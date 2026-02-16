
import { NextResponse } from "next/server";

const API_KEY = process.env.GEMINI_API_KEY || "";
const IMAGE_ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-image-preview:generateContent";
const TEXT_ENDPOINT = "https://generativelanguage.googleapis.com/v1alpha/models/gemini-3-flash-preview:generateContent";

async function fetchWithRetry(
  url: string,
  options: RequestInit,
  maxRetries = 3
): Promise<Response> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const res = await fetch(url, options);
      if ((res.status === 429 || res.status >= 500) && attempt < maxRetries) {
        const delay = Math.pow(2, attempt) * 1000 + Math.random() * 500;
        await new Promise(r => setTimeout(r, delay));
        continue;
      }
      return res;
    } catch (err) {
      if (attempt < maxRetries) {
        const delay = Math.pow(2, attempt) * 1000;
        await new Promise(r => setTimeout(r, delay));
        continue;
      }
      throw err;
    }
  }
  throw new Error('Max retries exceeded');
}

import { createClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    if (!API_KEY) return new NextResponse("GEMINI_API_KEY not configured", { status: 500 });

    const { code, appDescription, screenName } = await req.json();

    // 1. Analyze code for image placeholders
    const analysisPrompt = `Analyze this HTML code and identify ALL image placeholders (src attributes of <img>, background-image URLs, or placeholder strings like "img-placeholder-*").
For each placeholder, determine what kind of image it represents based on the surrounding context.
APP CONTEXT: "${appDescription}" - Screen: "${screenName}"
CODE:
${code}
Return ONLY a valid JSON array. Each item should have:
- "placeholder": the exact URL or string found in the code
- "description": a highly detailed, professional, photorealistic prompt for Gemini (e.g. "Minimalist luxury apartment interior, soft morning light, 8k, cinematic shot")
- "type": "avatar", "hero", "product", "background", "lifestyle"
Return ONLY the JSON array.`;

    const analysisRes = await fetchWithRetry(`${TEXT_ENDPOINT}?key=${API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: analysisPrompt }] }],
        generationConfig: { temperature: 0.3, maxOutputTokens: 4096 },
      }),
    });

    if (!analysisRes.ok) return NextResponse.json({ code });

    const analysisData = await analysisRes.json();
    const analysisText = analysisData.candidates?.[0]?.content?.parts?.[0]?.text || '[]';
    
    let imageRequests: any[];
    try {
      const cleaned = analysisText.replace(/```json\n|```/g, '').trim();
      imageRequests = JSON.parse(cleaned);
    } catch {
      return NextResponse.json({ code });
    }

    if (!Array.isArray(imageRequests) || imageRequests.length === 0) return NextResponse.json({ code });

    const limitedRequests = imageRequests.slice(0, 6);

    // 2. Generate images in parallel
    const imageResults = await Promise.allSettled(
      limitedRequests.map(async (request: any) => {
        const imgPrompt = `Generate a high-quality, photorealistic image: ${request.description}. 
Context: This is for a ${appDescription} mobile app. NO text overlay.`;

        const body = {
          contents: [{ parts: [{ text: imgPrompt }] }],
          generationConfig: { responseModalities: ["TEXT", "IMAGE"] },
        };

        const res = await fetchWithRetry(`${IMAGE_ENDPOINT}?key=${API_KEY}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }, 2);

        if (!res.ok) throw new Error(`API error ${res.status}`);

        const data = await res.json();
        const parts = data.candidates?.[0]?.content?.parts || [];
        const imagePart = parts.find((p: any) => p.inlineData);

        if (!imagePart?.inlineData?.data) throw new Error("No data");

        return {
          placeholder: request.placeholder,
          dataUri: `data:${imagePart.inlineData.mimeType || 'image/png'};base64,${imagePart.inlineData.data}`
        };
      })
    );

    // 3. Replace in code
    let updatedCode = code;
    let count = 0;
    for (const result of imageResults) {
      if (result.status === 'fulfilled') {
        const { placeholder, dataUri } = result.value;
        const escaped = placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        updatedCode = updatedCode.replace(new RegExp(escaped, 'g'), dataUri);
        count++;
      }
    }

    return NextResponse.json({
      code: updatedCode,
      imagesGenerated: count,
      totalImages: limitedRequests.length
    });
  } catch (error: any) {
    console.error("[API_GENERATE_ASSETS] Error:", error);
    return new NextResponse(error.message || "Internal Server Error", { status: 500 });
  }
}
