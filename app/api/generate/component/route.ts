
import { NextResponse } from "next/server";

const API_KEY = process.env.GEMINI_API_KEY || "";
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

export async function POST(req: Request) {
  try {
    if (!API_KEY) return new NextResponse("GEMINI_API_KEY not configured", { status: 500 });

    const params = await req.json();
    const { theme, instruction, existingCode, images = [], primaryColor, secondaryColor, accentColor } = params;

    const systemPrompt = `You are a world-class Lead UI Engineer at a top design studio.
Create a premium, ultra-high-end UI component using ONLY plain HTML and Tailwind CSS.
STYLE: ${theme === 'dark' ? 'Modern Dark Luxury (Zind-950, deep glows, sophisticated depth)' : 'Modern Light Luxury (Soft shadows, layered glassmorphism, crisp white space)'}
INSTRUCTION: ${instruction}
${existingCode ? `REFINE THIS HTML: \n${existingCode}` : ''}

BRANDING:
${primaryColor ? `– Primary Color: #${primaryColor}` : ''}
${secondaryColor ? `– Secondary Color: #${secondaryColor}` : ''}
${accentColor ? `– Accent Color: #${accentColor}` : ''}

REQUIREMENTS:
1. FORMAT: Return ONLY the HTML content. DO NOT use React, JSX, or imports.
2. DESIGN QUALITY: Create a unique, niche-specific masterpiece. DO NOT use generic "SaaS" or "Dashboard" styles. If the niche is tech, use monospaced/sharp aesthetics. If creative, use brutalist/vibrant energy. If luxury, use elegant serifs and deep negative space.
3. TYPOGRAPHY: Use unique, niche-appropriate fonts (e.g., 'Syne', 'Clash Display', 'Chillax', 'Cabinet Grotesk' style energy from Google Fonts).
4. VISUAL COMPLETENESS: DO NOT leave any section blank. Use placeholders for every image area.
5. ICONS: Use inline SVG for icons.
6. ANIMATIONS: Use standard Tailwind transitions or CSS animations for subtle micro-interactions.
7. OUTPUT: Return ONLY the raw HTML string. No markdown, no chat.`;

    const parts: any[] = [{ text: systemPrompt }];
    images.forEach((img: any) => {
      parts.push({
        inlineData: {
          data: img.data.split(',')[1] || img.data,
          mimeType: img.mimeType
        }
      });
    });

    const body = {
      contents: [{ parts }],
      generationConfig: {
        temperature: 0.4,
        maxOutputTokens: 8192
      }
    };

    const response = await fetchWithRetry(`${TEXT_ENDPOINT}?key=${API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errText = await response.text();
      return new NextResponse(errText, { status: response.status });
    }

    const data = await response.json();
    let code = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    code = code.replace(/^```(tsx|jsx|javascript|typescript|ts|js)?\n/, '').replace(/\n```$/, '');

    return NextResponse.json({ code });
  } catch (error: any) {
    console.error("[API_GENERATE_COMPONENT] Error:", error);
    return new NextResponse(error.message || "Internal Server Error", { status: 500 });
  }
}
