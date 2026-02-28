import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Note: Puppeteer is heavy and often fails in serverless environments like Vercel.
// We'll use a hybrid approach: A lightweight fetch-based scraper for production reliability,
// and we'll keep the puppeteer logic as a "heavy" fallback if needed and available.

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { url } = await req.json();

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }
    // SSRF Protection: Prevent access to internal networks/metadata endpoints
    let hostname = '';
    try {
      const parsedUrl = new URL(url);
      hostname = parsedUrl.hostname.toLowerCase();
      console.log(`[SCRAPE] Starting scrape for host: ${hostname}`);

      if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
        return NextResponse.json({ error: 'Invalid URL protocol' }, { status: 400 });
      }
      
      // Block IPv6 loopback and private ranges
      const isIPv6Internal = /^\[?(::1|::ffff:(127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)|fe80:|fc00:|fd00:)/i.test(hostname);
      
      // Block IPv4 private ranges, localhost, and common bypasses (0.0.0.0, etc.)
      const isIPv4Internal = /^(localhost|0\.0\.0\.0|127\.|192\.168\.|10\.|172\.(1[6-9]|2[0-9]|3[0-1])\.|169\.254\.)/.test(hostname);
      
      // Block decimal/octal/hex IP representations (any all-numeric or suspicious numeric hostname)
      const isNumericIP = /^\d+$/.test(hostname);
      
      if (isIPv6Internal || isIPv4Internal || isNumericIP) {
        console.warn(`[SCRAPE] Restricted URL blocked from ${hostname}`);
        return NextResponse.json({ error: 'Restricted URL origin' }, { status: 403 });
      }
    } catch (err) {
      return NextResponse.json({ error: 'Invalid URL format' }, { status: 400 });
    }

    // --- PHASE 1: Lightweight Fetch Scraper (Production Safe) ---
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        }
      });
      
      clearTimeout(timeoutId);

      if (response.ok) {
        // Limit response size (e.g., 5MB max for HTML)
        const contentLength = response.headers.get('content-length');
        const MAX_HTML_SIZE = 5 * 1024 * 1024;
        if (contentLength && parseInt(contentLength, 10) > MAX_HTML_SIZE) {
          throw new Error('Page too large (max 5MB)');
        }

        const html = await response.text();
        if (html.length > MAX_HTML_SIZE) {
          throw new Error('Page too large (max 5MB)');
        }
        
        // Basic extraction using regex (fast and serverless-safe)
        const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
        const title = titleMatch ? titleMatch[1].trim() : url;
        
        const descMatch = html.match(/<meta[^>]*name="description"[^>]*content="([^"]*)"/i) || 
                          html.match(/<meta[^>]*content="([^"]*)"[^>]*name="description"/i);
        const description = descMatch ? descMatch[1] : '';

        // Extract some text content
        // This is a naive but working way to get text without heavy dependencies
        const bodyContent = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i)?.[1] || html;
        const cleanText = bodyContent
          .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
          .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
          .replace(/<[^>]+>/g, ' ')
          .replace(/\s+/g, ' ')
          .trim()
          .slice(0, 5000); // Limit context for Gemini

        // Simple image extraction
        const imgMatches = html.matchAll(/<img[^>]*src="([^"]*)"[^>]*>/gi);
        const images = [];
        for (const match of imgMatches) {
          let src = match[1];
          if (src && !src.startsWith('data:')) {
            if (src.startsWith('//')) src = 'https:' + src;
            else if (src.startsWith('/')) {
              const urlObj = new URL(url);
              src = `${urlObj.protocol}//${urlObj.host}${src}`;
            }
            images.push({ src, alt: '' });
          }
          if (images.length >= 10) break;
        }

        console.log(`[SCRAPE] Fetch success for ${url}`);
        return NextResponse.json({
          title,
          description,
          text: cleanText,
          html: html.slice(0, 20000), // Return a chunk of HTML for structure
          images,
          method: 'fetch'
        });
      }
    } catch (fetchError) {
      console.warn(`[SCRAPE] Fetch method failed, falling back to Puppeteer (if available):`, fetchError);
    }

    // --- PHASE 2: Puppeteer Fallback (Works in Local/Heavy environments) ---
    // We only reach here if fetch failed or returned nothing
    let puppeteer;
    try {
      puppeteer = await import('puppeteer');
      const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
      });
      
      const page = await browser.newPage();
      await page.setViewport({ width: 1280, height: 800 });
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 20000 });
      
      const content = await page.evaluate(() => {
        return {
          title: document.title,
          description: document.querySelector('meta[name="description"]')?.getAttribute('content') || '',
          text: document.body.innerText.slice(0, 5000),
          html: document.body.innerHTML.slice(0, 20000),
          images: Array.from(document.querySelectorAll('img'))
            .slice(0, 10)
            .map(img => ({ src: img.src, alt: img.alt || '' }))
        };
      });

      await browser.close();
      return NextResponse.json({ ...content, method: 'puppeteer' });
    } catch (puppeteerError: any) {
      console.error(`[SCRAPE] Puppeteer error:`, puppeteerError.message);
      return NextResponse.json({ 
        error: 'Scraping failed', 
        details: 'Both fetch and puppeteer methods failed in this environment.' 
      }, { status: 500 });
    }
  } catch (error: any) {
    console.error('[SCRAPE_API_CRITICAL_ERROR]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
