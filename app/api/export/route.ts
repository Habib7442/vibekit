import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';
import JSZip from 'jszip';

const API_KEY = process.env.GEMINI_API_KEY;

if (!API_KEY) {
  console.warn('[Export API] GEMINI_API_KEY not configured - AI expansion will be disabled');
}

const IMAGE_ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-image-preview:generateContent";

// Platform export presets
const PRESETS: Record<string, { width: number; height: number; format: 'jpeg' | 'png'; quality: number; label: string }> = {
  shopify:        { width: 2048, height: 2048, format: 'jpeg', quality: 95, label: 'Shopify Product' },
  amazon:         { width: 2000, height: 2000, format: 'jpeg', quality: 95, label: 'Amazon Main Image' },
  instagram_post: { width: 1080, height: 1080, format: 'jpeg', quality: 92, label: 'Instagram Post' },
  instagram_story:{ width: 1080, height: 1920, format: 'jpeg', quality: 92, label: 'Instagram Story' },
  facebook_ad:    { width: 1200, height: 628,  format: 'jpeg', quality: 92, label: 'Facebook Ad' },
  facebook_cover: { width: 1640, height: 624,  format: 'jpeg', quality: 92, label: 'Facebook Cover' },
  pinterest:      { width: 1000, height: 1500, format: 'jpeg', quality: 92, label: 'Pinterest Pin' },
  twitter_post:   { width: 1600, height: 900,  format: 'jpeg', quality: 92, label: 'Twitter/X Post' },
  youtube_thumb:  { width: 1280, height: 720,  format: 'jpeg', quality: 92, label: 'YouTube Thumbnail' },
  email_header:   { width: 600,  height: 200,  format: 'jpeg', quality: 90, label: 'Email Header' },
  print_4k:       { width: 3840, height: 2160, format: 'png',  quality: 100, label: 'Print 4K' },
  web_banner:     { width: 1920, height: 600,  format: 'jpeg', quality: 92, label: 'Website Banner' },
  logo_square:    { width: 500,  height: 500,  format: 'png',  quality: 100, label: 'Square Logo/Icon' },
  whatsapp_dp:    { width: 500,  height: 500,  format: 'jpeg', quality: 90, label: 'WhatsApp DP' },
  linkedin_post:  { width: 1200, height: 627,  format: 'jpeg', quality: 92, label: 'LinkedIn Post' },
};

// Get the aspect ratio key (e.g., "16:9", "1:1") for grouping
function getAspectRatioKey(w: number, h: number): string {
  if (w === 0 || h === 0) return "0:0";
  const gcd = (a: number, b: number): number => b === 0 ? a : gcd(b, a % b);
  const d = gcd(w, h);
  return `${w / d}:${h / d}`;
}

// Check if two aspect ratios are similar enough to just resize (within 5% tolerance)
function isSimilarAspectRatio(origW: number, origH: number, targetW: number, targetH: number): boolean {
  if (origH === 0 || targetH === 0) return false;
  const origRatio = origW / origH;
  const targetRatio = targetW / targetH;
  const diff = Math.abs(origRatio - targetRatio) / Math.max(origRatio, targetRatio);
  return diff < 0.05; // 5% tolerance
}

// Call Gemini to AI-expand/outpaint the image to a new aspect ratio
async function aiExpandImage(imageBase64: string, mimeType: string, targetW: number, targetH: number): Promise<string | null> {
  const aspectLabel = targetW > targetH ? 'landscape' : targetW < targetH ? 'portrait' : 'square';
  
  const prompt = `Expand this image to perfectly fill a ${targetW}x${targetH} (${aspectLabel}) frame. Seamlessly extend the background in all directions needed to fill the new aspect ratio. Keep the main subject exactly as it is — do not modify, crop, or distort it. The extended areas should look natural, photorealistic, and match the lighting, color, and style of the original image perfectly. Do not add any text, watermarks, logos, or new objects.`;

  const reqBody = {
    contents: [{
      parts: [
        { inlineData: { mimeType: mimeType || 'image/png', data: imageBase64 } },
        { text: prompt }
      ]
    }],
    generationConfig: {
      responseModalities: ["IMAGE", "TEXT"],
      temperature: 1.0,
    }
  };

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 120000); // 2 minute timeout

    const res = await fetch(IMAGE_ENDPOINT, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'x-goog-api-key': API_KEY || '',
      },
      body: JSON.stringify(reqBody),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      console.error(`[AI Expand] API error ${res.status}:`, errBody?.error?.message);
      return null;
    }

    const data = await res.json();
    const parts = data?.candidates?.[0]?.content?.parts;
    if (!parts) return null;

    for (const part of parts) {
      if (part.inlineData?.data) {
        return part.inlineData.data; // base64 expanded image
      }
    }
    return null;
  } catch (err: any) {
    console.error('[AI Expand] Error:', err.message);
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { image, mimeType, platforms, filename, useAI } = body;

    if (!image || !platforms || !Array.isArray(platforms) || platforms.length === 0) {
      return NextResponse.json({ error: 'Missing image or platforms' }, { status: 400 });
    }

    // Decode the base64 image or fetch URL
    let imageBuffer: Buffer;
    let base64ForAI = '';

    if (image.startsWith('http')) {
      const fetchRes = await fetch(image);
      const arrayBuffer = await fetchRes.arrayBuffer();
      imageBuffer = Buffer.from(arrayBuffer);
      base64ForAI = imageBuffer.toString('base64');
    } else {
      imageBuffer = Buffer.from(image, 'base64');
      base64ForAI = image;
    }
    
    // Get original image metadata
    const metadata = await sharp(imageBuffer).metadata();
    const origWidth = metadata.width || 1024;
    const origHeight = metadata.height || 1024;

    const zip = new JSZip();
    const exportFolder = zip.folder(filename || 'exports')!;

    // If AI expand is enabled, group platforms by aspect ratio to minimize API calls
    const expandedCache: Record<string, typeof imageBuffer> = {};

    for (const platformKey of platforms) {
      const preset = PRESETS[platformKey];
      if (!preset) continue;

      try {
        let sourceBuffer = imageBuffer;

        // If AI expand is enabled and aspect ratio differs significantly
        if (useAI && !isSimilarAspectRatio(origWidth, origHeight, preset.width, preset.height)) {
          const ratioKey = getAspectRatioKey(preset.width, preset.height);
          
          // Check cache — reuse expanded images for same aspect ratio
          if (expandedCache[ratioKey]) {
            sourceBuffer = expandedCache[ratioKey];
          } else {
            console.log(`[AI Expand] Expanding for ${preset.label} (${ratioKey})...`);
            const expandedBase64 = await aiExpandImage(base64ForAI, mimeType, preset.width, preset.height);
            
            if (expandedBase64) {
              sourceBuffer = Buffer.from(expandedBase64, 'base64');
              expandedCache[ratioKey] = sourceBuffer; // cache it
              console.log(`[AI Expand] Successfully expanded for ${ratioKey}`);
            } else {
              console.warn(`[AI Expand] Failed for ${ratioKey}, falling back to smart crop`);
              // Fallback: use 'cover' (intelligent crop) instead of black bars
            }
          }
        }

        // Resize to exact platform dimensions
        // Use 'cover' (crop to fit) when source is AI-expanded or similar ratio
        // Use 'contain' only as last resort
        let resized: Buffer;
        const fitMode = useAI ? 'cover' as const : 'cover' as const; // always cover now — AI handles the expand

        if (preset.format === 'png') {
          resized = await sharp(sourceBuffer)
            .resize(preset.width, preset.height, {
              fit: fitMode,
              position: 'centre',
            })
            .png({ compressionLevel: 9 })
            .toBuffer();
        } else {
          resized = await sharp(sourceBuffer)
            .resize(preset.width, preset.height, {
              fit: fitMode,
              position: 'centre',
            })
            .jpeg({ quality: preset.quality, mozjpeg: true })
            .toBuffer();
        }

        const ext = preset.format === 'png' ? 'png' : 'jpg';
        const safeName = preset.label.replace(/[^a-zA-Z0-9 ]/g, '').replace(/\s+/g, '_');
        exportFolder.file(`${safeName}_${preset.width}x${preset.height}.${ext}`, resized);
      } catch (err) {
        console.error(`[Export] Failed for ${platformKey}:`, err);
      }
    }

    // Generate ZIP
    const zipBuffer = await zip.generateAsync({ 
      type: 'nodebuffer',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 }
    });

    // Sanitize filename for Content-Disposition header
    const safeFilename = (filename || 'exports')
      .replace(/[^a-zA-Z0-9_\-\.]/g, '_')
      .substring(0, 200);

    return new NextResponse(new Uint8Array(zipBuffer), {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${safeFilename}.zip"`,
      },
    });
  } catch (err: any) {
    console.error('[Export API] Error:', err);
    return NextResponse.json({ error: err.message || 'Export failed' }, { status: 500 });
  }
}
