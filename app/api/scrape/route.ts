import { NextResponse } from 'next/server';
import puppeteer from 'puppeteer';

export async function POST(req: Request) {
  try {
    const { url } = await req.json();

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();

    // Use a desktop viewport
    await page.setViewport({ width: 1280, height: 800 });

    try {
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
      
      const content = await page.evaluate(() => {
        const title = document.title;
        const metaDescription = document.querySelector('meta[name="description"]')?.getAttribute('content') || '';
        
        // Extract the actual HTML code (cleaned slightly)
        const html = document.body.innerHTML;

        // Extract main text content
        const bodyText = Array.from(document.querySelectorAll('h1, h2, h3, p'))
          .map(el => el.textContent?.trim())
          .filter(text => text && text.length > 20)
          .slice(0, 20)
          .join('\n\n');

        // Extract images
        const images = Array.from(document.querySelectorAll('img'))
          .map(img => ({
            src: img.src,
            alt: img.alt || '',
            width: img.naturalWidth,
            height: img.naturalHeight
          }))
          .filter(img => img.src.startsWith('http') && (img.width > 50 || img.height > 50))
          .slice(0, 15);

        return {
          title,
          description: metaDescription,
          text: bodyText,
          html,
          images
        };
      });

      await browser.close();
      return NextResponse.json(content);
    } catch (error: any) {
      await browser.close();
      return NextResponse.json({ error: `Failed to scrape page: ${error.message}` }, { status: 500 });
    }
  } catch (error: any) {
    console.error('[SCRAPE_API_ERROR]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
