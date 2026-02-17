'use server';

import { revalidatePath } from "next/cache";

const API_KEY = process.env.GEMINI_API_KEY || "";
const IMAGE_ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-image-preview:generateContent";
const TEXT_ENDPOINT = "https://generativelanguage.googleapis.com/v1alpha/models/gemini-3-flash-preview:generateContent";

// Retry wrapper for Gemini API calls — handles rate limiting (429) and transient errors
async function fetchWithRetry(
  url: string,
  options: RequestInit,
  maxRetries = 3
): Promise<Response> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const res = await fetch(url, options);
      
      // If rate limited or server error, retry with backoff
      if ((res.status === 429 || res.status >= 500) && attempt < maxRetries) {
        const delay = Math.pow(2, attempt) * 1000 + Math.random() * 500;
        console.warn(`[Gemini API] ${res.status} on attempt ${attempt + 1}, retrying in ${Math.round(delay)}ms...`);
        await new Promise(r => setTimeout(r, delay));
        continue;
      }
      
      return res;
    } catch (err) {
      if (attempt < maxRetries) {
        const delay = Math.pow(2, attempt) * 1000;
        console.warn(`[Gemini API] Network error on attempt ${attempt + 1}, retrying in ${delay}ms...`);
        await new Promise(r => setTimeout(r, delay));
        continue;
      }
      throw err;
    }
  }
  throw new Error('Max retries exceeded');
}

const TEMPLATE_EXPERTS: Record<string, { persona: string, direction: string, style: string }> = {
  'etsy-studio': {
    persona: "Artisanal Product Photographer & Home Decor Stylist",
    direction: "Warm, organic, and inviting. Use soft natural window light. Focus on textures (wood grain, linen, ceramic). The composition should feel artisanal and cozy, like a top-tier Etsy star seller's shop.",
    style: "Organic, warm, rustic-modern, artisanal, soft-focus backgrounds, daylight-balanced."
  },
  'fashion-editorial': {
    persona: "Vogue Creative Director & High-Fashion Photographer",
    direction: "Dramatic, high-contrast, and avant-garde. Use professional studio lighting (Rembrandt, butterfly, or rim lighting). Focus on silhouette, luxury fabrics, and 'sexy' confidence. Composition should be magazine-cover worth.",
    style: "High-fashion, luxury, dramatic, edgy, polished, magazine-grade post-production."
  },
  'cinematic-extreme': {
    persona: "Hollywood Cinematographer (Oscar-winning)",
    direction: "Deep cinematic mood. Use anamorphic flares, heavy atmosphere (smoke/haze), and dramatic color grading (teal & orange or moody monochrome). Masterful use of shadows and light pools.",
    style: "Cinematic, moody, atmospheric, Hollywood-grade, anamorphic, narrative lighting."
  },
  'minimal-tech': {
    persona: "Apple Lead Product Designer & Industrial Photographer",
    direction: "Ultra-clean, minimalist, and precise. Use pure white or soft grey backgrounds with perfect softbox lighting. Zero clutter. Focus on engineering precision, glass reflections, and sleek metal finishes.",
    style: "Minimalist, sleek, clean, high-precision, Apple-aesthetic, industrial perfection."
  },
  'street-vogue': {
    persona: "Street Style Photographer & Content Creator",
    direction: "Authentic, urban, and trendy. Use natural city light, golden hour, or neon night vibes. The shot should feel spontaneous but perfectly composed. High-energy and culturally relevant.",
    style: "Urban, authentic, trendy, vibrant, lifestyle, candid-professional."
  }
};

function buildMasterPrompt(userPrompt: string, aspectRatio: string, templateId?: string): string {
  const expert = templateId ? TEMPLATE_EXPERTS[templateId] : null;
  const persona = expert?.persona || "world-leading creative director and visual artist";
  const direction = expert?.direction || "Ultra-high-fidelity, editorial-grade imagery. Cinematic lighting with intentional mood.";
  const style = expert?.style || "Editorial, luxury, sleek, premium, cinematic, modern, polished.";

  return `You are a ${persona}.
${templateId ? `SPECIALIZED MODE: ${templateId.toUpperCase()}` : ''}

TASK: Generate a masterpiece based on the following:
CONCEPT: ${userPrompt}

VISUAL DIRECTION:
– ${direction}
– Professional color grading: rich tonal range, controlled saturation, harmonious palette
– Depth of field and compositional mastery (rule of thirds, leading lines, negative space)
– Premium texture rendering: skin pores, material reflections, surface details

STYLE: ${style}

TECHNICAL SPECS:
– ${aspectRatio} aspect ratio
– Sharp focus on subject, intentional bokeh where appropriate  
– Clean, artifact-free rendering
– FULL FRAME RENDERING: Do not leave any borders, white space, pillarboxing, or letterboxing. The image MUST fill the entire canvas area.

ABSOLUTELY AVOID: Stock photo aesthetic, flat lighting, generic compositions, amateur feel, borders, or any form of letterboxing.`;
}

// --- Server Actions ---

export async function generateAIImage(params: {
  prompt: string;
  aspectRatio?: string;
  count?: number;
  images?: { data: string; mimeType: string }[];
  template?: string;
}) {
  const { prompt, aspectRatio = '1:1', count = 1, images: uploadedImages = [], template } = params;

  if (!API_KEY) throw new Error("GEMINI_API_KEY not configured");

  const imageCount = Math.min(Math.max(1, count), 5);
  const basePrompt = prompt || (template ? `A high-end ${template.replace('-', ' ')} concept.` : (uploadedImages.length > 0 ? "Transform and combine these images into a single artistic advertisement." : ""));
  const masterPrompt = buildMasterPrompt(basePrompt, aspectRatio, template);
  
  const isEditing = uploadedImages.length > 0;

  const results = [];
  for (let i = 0; i < imageCount; i++) {
    const parts: any[] = [];
    
    uploadedImages.forEach((img: any) => {
      if (img.data && img.mimeType) {
        parts.push({
          inlineData: {
            data: img.data,
            mimeType: img.mimeType
          }
        });
      }
    });

    let taskPrefix = "";
    if (uploadedImages.length === 1) {
      taskPrefix = "TASK: TRANSFORM/EDIT THE UPLOADED IMAGE.";
    } else if (uploadedImages.length > 1) {
      taskPrefix = `TASK: COMBINE THE ${uploadedImages.length} UPLOADED IMAGES INTO ONE COHESIVE PRODUCT ADVERTISEMENT OR CREATIVE COMPOSITION. THE FINAL IMAGE MUST BE A SINGLE INTEGRATED SCENE.`;
    }

    const hasIdentity = basePrompt.includes("SUBJECT IDENTITY");
    const text = isEditing 
      ? `TASK: ADVANCED CREATIVE COMPOSITION. 
         ${hasIdentity ? "CRITICAL: YOU MUST INCLUDE THE CHARACTER/SUBJECT DESCRIBED IN THE 'SUBJECT IDENTITY' SECTION. THEY MUST BE INTERACTING WITH THE PRODUCTS/ELEMENTS IN THE UPLOADED IMAGES (e.g., holding them, looking at them, or being in the same scene)." : "TRANSFORM/DEVELOP THE SCENE WHILE PRESERVING THE ELEMENTS IN THE UPLOADED IMAGES."}
         CRITICAL: FILL THE ENTIRE ${aspectRatio} FRAME. THE IMAGE MUST COMPLETELY FILL THE CANVAS.
         
         CONCEPT: ${basePrompt}
         ${masterPrompt}`
      : (imageCount > 1 
        ? `${masterPrompt}\n\nVARIATION ${i + 1} of ${imageCount}: Give me a unique creative variation focused on detail and composition. FILL THE ENTIRE ${aspectRatio} FRAME.`
        : masterPrompt);

    parts.push({ text });

    const body = {
      contents: [{ parts }],
      generationConfig: {
        responseModalities: ["TEXT", "IMAGE"],
        imageConfig: { aspectRatio }
      }
    };

    const response = await fetch(`${IMAGE_ENDPOINT}?key=${API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      results.push({ error: errorData?.error?.message || `Failed (${response.status})`, index: i });
      continue;
    }

    const data = await response.json();
    const responseParts = data.candidates?.[0]?.content?.parts || [];
    const imagePart = responseParts.find((p: any) => p.inlineData);
    
    if (!imagePart?.inlineData?.data) {
      results.push({ error: 'No image returned', index: i });
      continue;
    }

    results.push({ 
      image: imagePart.inlineData.data,
      mimeType: imagePart.inlineData.mimeType || 'image/png',
      index: i,
    });
    
    // Tiny delay to ensure unique entropy/timestamp in API side if any
    if (imageCount > 1) await new Promise(r => setTimeout(r, 200));
  }

  const images = results.filter((r: any) => r.image);
  
  if (images.length === 0) throw new Error("All image generations failed");

  return {
    images: images.map(img => ({ image: img.image, mimeType: img.mimeType })),
    total: images.length
  };
}

export async function planAppAction(prompt: string) {
  if (!API_KEY) throw new Error("GEMINI_API_KEY not configured");

  const systemInstructions = `You are the world's #1 mobile app designer and prompt engineer. You work at the intersection of Apple HIG, Vercel/Linear aesthetics, and high-end luxury brand design.

YOUR TASK: The user gives you a SHORT idea for either a full app or a single UI component. You must:

1. EXPAND it into a world-class, extremely detailed design brief. If it's a component, describe its layout, micro-interactions, and visual style. If it's an app, describe the theme and 5 key screens. 
   - Demand ultra-premium aesthetics: Bento grids, sophisticated glassmorphism, fluid typography, and professional layouts.
   - Mention specific colors, spacing, and smooth CSS-based animations.
   - DO NOT suggest any external libraries or React-specific code. Everything must be plain HTML and Tailwind CSS.

2. PICK THE PERFECT COLOR PALETTE — 3 hex colors tailored to the vibe:
   - primaryColor: Main brand color.
   - secondaryColor: Surface/background or subtle complement.
   - accentColor: Pop color for CTA and attention.

COLOR RULES: Avoid generic/bright defaults. Use sophisticated, muted, or vibrant luxury palettes.

Return ONLY a valid JSON object:
{
  "detailedPrompt": "Your 4-6 sentence master-level design brief here",
  "primaryColor": "#hexcode",
  "secondaryColor": "#hexcode",
  "accentColor": "#hexcode"
}`;

  const requestBody = {
    systemInstruction: {
      parts: [{ text: systemInstructions }]
    },
    contents: [{ 
      parts: [
        { text: `APP IDEA: "${prompt}"

Respond with ONLY a JSON object containing: detailedPrompt, primaryColor, secondaryColor, accentColor.` }
      ] 
    }],
    generationConfig: {
      temperature: 0.85,
      topP: 0.9,
      topK: 40,
      maxOutputTokens: 1024,
      responseMimeType: "application/json",
    }
  };

  const response = await fetchWithRetry(`${TEXT_ENDPOINT}?key=${API_KEY}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errText = await response.text();
    console.error("[planAppAction] API error:", response.status, errText);
    throw new Error("Failed to expand prompt");
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
  
  if (!text.trim()) {
    console.error("[planAppAction] Empty response from Gemini");
    throw new Error("Empty response from AI");
  }

  // Clean potential markdown wrap and extract JSON
  const cleaned = text
    .replace(/```json\s*/gi, '')
    .replace(/```\s*/g, '')
    .trim();
  
  const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
  
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        detailedPrompt: parsed.detailedPrompt || parsed.detailed_prompt || parsed.prompt || parsed.appDescription || prompt,
        primaryColor: parsed.primaryColor || parsed.primary_color || parsed.primary || '#6366F1',
        secondaryColor: parsed.secondaryColor || parsed.secondary_color || parsed.secondary || '#1E1B2E',
        accentColor: parsed.accentColor || parsed.accent_color || parsed.accent || '#F5C77E',
      };
    } catch (parseErr) {
      console.error("[planAppAction] JSON parse error:", parseErr, "Raw:", jsonMatch[0].substring(0, 200));
    }
  }
  
  // Fallback: use the raw text as the expanded prompt with default colors
  console.warn("[planAppAction] No JSON found, using raw text as expanded prompt");
  return {
    detailedPrompt: cleaned.substring(0, 500) || prompt,
    primaryColor: '#6366F1',
    secondaryColor: '#1E1B2E',
    accentColor: '#F5C77E',
  };
}

export async function planVisualAction(prompt: string, identity?: { name: string, description: string }) {
  if (!API_KEY) throw new Error("GEMINI_API_KEY not configured");

  const identityContext = identity 
    ? `\n\nIMPORTANT: THE OUTPUT MUST INCLUDE THE FOLLOWING CHARACTER/SUBJECT IDENTITY IN THE SCENE:
       NAME: ${identity.name}
       DNA: ${identity.description}`
    : "";

  const systemInstructions = `You are a world-class High-Fashion and Product Studio Creative Director.
 specialized in Midjourney, DALL-E 3, and Gemini Image generation. 

YOUR TASK: The user gives you a SHORT idea for an image. You must expand it into a MASTERPIECE PROMPT.
- Focus on: Cinematic lighting, specific camera lenses (e.g., 85mm f/1.8), atmospheric details (smoke, dust motes), high-end textures, and specific artistic styles.
- Professional terminology: Use words like 'octane render', 'ray tracing', 'hyper-realistic', 'editorial photoshoot', 'rembrandt lighting'.
- Tone: Sophisticated, detailed, and visually evocative.

Return ONLY a valid JSON object:
{
  "detailedPrompt": "Your 4-6 sentence master-level image generation brief here"
}`;

  const requestBody = {
    systemInstruction: {
      parts: [{ text: systemInstructions }]
    },
    contents: [{ 
      parts: [
        { text: `IMAGE IDEA: "${prompt}"${identityContext}\n\nRespond with ONLY a JSON object containing: detailedPrompt.${identity ? ' The detailedPrompt must explicitly describe the character/subject and how they are positioned in the scene.' : ''}` }
      ] 
    }],
    generationConfig: {
      temperature: 0.9,
      topP: 0.95,
      responseMimeType: "application/json",
    }
  };

  const response = await fetchWithRetry(`${TEXT_ENDPOINT}?key=${API_KEY}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    throw new Error("Failed to expand image prompt");
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
  
  try {
    const parsed = JSON.parse(text);
    return {
      detailedPrompt: parsed.detailedPrompt || text
    };
  } catch {
    return {
      detailedPrompt: text.substring(0, 1000) || prompt
    };
  }
}

export async function generateScreenImageAction(params: {
  appDescription: string;
  screenName: string;
  colorHex?: string;
  screenIndex?: number;
  totalScreens?: number;
}) {
  const { appDescription, screenName, colorHex } = params;
  
  // Create a specialized design prompt for a visual mockup of the screen
  const designPrompt = `A world-class, high-fidelity mobile app UI design for a screen named "${screenName}". 
    APP CONTEXT: ${appDescription}. 
    STYLE: Premium, high-end luxury aesthetic, clean layout, sophisticated typography. 
    BRAND COLOR: #${colorHex || '6366f1'}. 
    VIEWPORT: Modern smartphone display.`;

  const data = await generateAIImage({
    prompt: designPrompt,
    aspectRatio: '9:16', // Standard mobile screen ratio
    count: 1
  });

  return {
    image: data.images[0].image,
    screenName
  };
}
