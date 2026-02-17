
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

import { createClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    if (!API_KEY) {
      return new NextResponse("GEMINI_API_KEY not configured", { status: 500 });
    }

    const params = await req.json();
    const { 
      screenName, 
      appDescription, 
      instruction, 
      existingCode, 
      images = [], 
      colorHex, 
      secondaryColor, 
      accentColor, 
      screenIndex, 
      totalScreens, 
      allScreenNames,
      mode = 'app',
      theme,
      stylingContext,
      rounding,
      fontFamily
    } = params;

    const isWeb = mode === 'web';

    const systemPrompt = `You are a world-class Lead UI/UX Designer and Frontend Engineer.
Your specialty is 'Bequoke Digital Craftsmanship' and 'Visual Cloning'.
Generate ONLY the <body> content of a plain HTML file using Vanilla CSS for a "${screenName}" ${isWeb ? 'page of a WEBSITE' : 'screen of a MOBILE APP'}.

DESIGN SYSTEM CONSISTENCY (CRITICAL):
${stylingContext ? `The user has provided a STYLING CONTEXT from a previous screen in the same project. 
YOU MUST CLONE THE DESIGN STYLE FROM THIS CONTEXT EXACTLY:
- Use the same :root CSS variables or color values.
- Replicate the exact border-radius, padding patterns, and shadow depths.
- Use the same Google Fonts and font-weight ratios.
- Ensure the 'vibe' (minimalist, brutalist, luxury) is identical.
- New components (buttons, cards, inputs) MUST match the existing ones.

STYLING CONTEXT CODE:
${stylingContext}
` : 'Establish a high-end design system base that can be cloned for future screens.'}

BRAND KIT CONSTRAINTS:
- Use Border-Radius: ${rounding || '12px'} for ALL cards, buttons, and inputs.
- Use Font Family: '${fontFamily || 'Inter'}', sans-serif. Import this from Google Fonts.

CRITICAL MANDATE: If images are provided, you MUST extract their 'Visual DNA' and replicate it EXACTLY. 
- TYPOGRAPHY: Match the font weight, oversized scales, and stylistic details (e.g., outlined text, specific character spacing).
- COLOR PALETTE: Replicate the exact color harmony (e.g., high-contrast monochrome, specific accent glows).
- LAYOUT: Replicate the spatial relationships, editorial overlaps, and negative space patterns.
- FIDELITY: Your output must be a pixel-perfect conceptual clone of the provided reference.

APP CONTEXT: ${appDescription}
${theme ? `FORCE THEME: Use a STRICT ${theme.toUpperCase()} THEME. ${theme === 'light' ? 'Background MUST be white/off-white, all text MUST be ink-black/zinc-900.' : 'Background MUST be deep dark/obsidian, all text MUST be light/high-contrast.'}` : ''}
${instruction ? `USER INSTRUCTION: ${instruction}` : ''}
${existingCode ? `EXISTING CODE TO IMPROVE/REDESIGN: \n${existingCode}` : ''}

BRANDING & CONTEXT:
${colorHex ? `– Primary Color: #${colorHex}` : ''}
${secondaryColor ? `– Secondary Color: #${secondaryColor}` : ''}
${accentColor ? `– Accent Color: #${accentColor}` : ''}

CRITICAL DESIGN REQUIREMENTS (MATCH THESE EXACTLY):
1. FORMAT: STANDALONE HTML FILE. No external frameworks. NO TAILWIND CSS. Use internal <style> tags.
2. THEME & COLORS: Use CSS variables (:root) derived from the provided colors. Ensure strict theme consistency.
3. TYPOGRAPHY: Include Google Fonts (e.g., '${fontFamily || 'Inter'}'). Use fluid, expensive-looking text hierarchies.
4. LAYOUT: Use CSS Grid and Flexbox for complex, premium layouts (Bento grids, asymmetrical sections).
5. VIEWPORT: ${isWeb ? 'FULL-WIDTH DESKTOP (100vw). Container max-width: 1200px (centered).' : 'MOBILE viewport (480px wide, min-height 844px).'}
6. DESIGN ELEMENTS: Use CSS radial gradients for depth, glassmorphism (backdrop-filter: blur), and modern box-shadows.
7. NAVIGATION: ${isWeb ? 'Use a standard top navigation bar and a professional footer. DO NOT use mobile bottom tab bars.' : 'Bottom tab bars MUST be pinned to the bottom of the viewport (e.g., position: fixed; bottom: 20px). NEVER let them float in content.'}
8. VISUAL COMPLETENESS: DO NOT use placeholders; populate with high-end descriptive text and beautiful Unsplash image URLs related to the niche.
9. ICONS: Use inline SVGs only.
10. OUTPUT: Return the COMPLETE raw HTML code string. No markdown, no chat. Starting with <!DOCTYPE html>.`;

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
        temperature: 0.2,
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
    console.error("[API_GENERATE_SCREEN] Error:", error);
    return new NextResponse(error.message || "Internal Server Error", { status: 500 });
  }
}
