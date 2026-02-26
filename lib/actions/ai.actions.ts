'use server';

import { revalidatePath } from "next/cache";
import { CAMPAIGN_FORMATS } from '@/lib/campaign-formats';
import { createClient } from '@/lib/supabase/server';
import { PLANS, PlanType } from '@/lib/plans';
import { deductCredit } from "@/lib/credits-actions";

const API_KEY = process.env.GEMINI_API_KEY || "";
const SEARCH_API_KEY = process.env.GOOGLE_SEARCH_API_KEY || "";
const SEARCH_CX = process.env.GOOGLE_SEARCH_CX || "";

const IMAGE_ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-image-preview:generateContent";
const TEXT_ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent";

// Single-shot fetch with timeout — no retries, one request only
async function fetchWithRetry(
  url: string,
  options: RequestInit,
  _maxRetries = 0,
  timeoutMs = 60000
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      const msg = errBody?.error?.message || `API error ${res.status}`;
      console.error(`[Gemini API] ${res.status}: ${msg}`);
    }
    
    return res;
  } catch (err: any) {
    clearTimeout(timeoutId);
    
    if (err.name === 'AbortError') {
      throw new Error("Request timed out. The AI server is busy — please try again.");
    }
    throw err;
  }
}

// Helper to fetch Pinterest references via Google Custom Search
async function searchPinterestReferences(query: string): Promise<{ title: string, link: string, snippet: string }[]> {
  if (!SEARCH_API_KEY || !SEARCH_CX) {
    console.log("[Search API] Keys missing, skipping live search.");
    return [];
  }
  
  const url = `https://www.googleapis.com/customsearch/v1?key=${SEARCH_API_KEY}&cx=${SEARCH_CX}&q=${encodeURIComponent(query + ' poster design pinterest')}&searchType=image&num=5`;
  
  try {
    const res = await fetch(url);
    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      console.warn("[Search API] Error:", res.status, JSON.stringify(errBody?.error?.message || errBody));
      return [];
    }
    const data = await res.json();
    return data.items?.map((item: any) => ({
      title: item.title,
      link: item.link,
      snippet: item.snippet
    })) || [];
  } catch (err) {
    console.error("[Pinterest Search] Failed:", err);
    return [];
  }
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

PRODUCT INTEGRITY & AUTHENTICITY (CRITICAL):
– If a product or specific object is present, YOU MUST PRESERVE ITS GEOMETRY, LABELS, AND BRANDING 100% ACCURATELY.
– DO NOT distort, re-imagine, or blur product details. All text on labels must remain sharp and exactly as provided.
– The physical shape of the product must remain "locked" and authentic.

LIGHTING & ENVIRONMENT MASTERY:
– ${direction}
– REFINED LIGHTING WRAP: The product must feel integrated into the environment. Use subtle "Light Wrapping" (background light bleeding slightly over product edges) for realism.
– REFLECTION MATCHING: If the background has strong colors or light sources, reflect those accurately but subtly on the product surfaces.

VISUAL EXCELLENCE:
– Professional color grading: rich tonal range, controlled saturation, harmonious palette
– Depth of field and compositional mastery (rule of thirds, leading lines, negative space)
– Premium texture rendering: skin pores, material reflections, surface details
– ${style}

TECHNICAL SPECS:
– ${aspectRatio} aspect ratio
– Sharp focus on subject, intentional bokeh where appropriate  
– Clean, artifact-free rendering
– FULL FRAME RENDERING: Do not leave any borders, white space, pillarboxing, or letterboxing. The image MUST fill the entire canvas area.

ABSOLUTELY AVOID: Product distortion, hallucinated labels, flat lighting, generic compositions, amateur feel, borders, or any form of letterboxing.`;
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

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from('profiles').select('plan').eq('id', user?.id).single();
  const planName = (profile?.plan || 'free') as PlanType;
  const currentResolution = PLANS[planName].resolution;

  // Deduct credits before starting
  await deductCredit(imageCount);

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
      ? `TASK: RECOMPOSE THIS PHOTOGRAPH for a ${aspectRatio} frame.

         You have a reference photo of a person/subject. Your job is to RECREATE this EXACT scene but ZOOMED OUT to show MORE of the person and their surroundings, fitting perfectly into a ${aspectRatio} aspect ratio.

         MANDATORY:
         1. ZOOM OUT — SHOW THE FULL PERSON: The output MUST show the person's FULL BODY visible in the frame. If the reference shows only a head/face/shoulders close-up, you must zoom out to reveal their full torso, arms, waist, hips, and legs. The person should look like they were photographed from further away to capture their entire body.
         2. IDENTICAL PERSON: The person in the output must be the EXACT same person as in the reference — same face, same features, same expression, same makeup, same accessories (sunglasses, jewelry, etc.), same skin tone. DO NOT change anything about WHO they are.
         3. IDENTICAL SCENE: Keep the same background, colors, lighting, mood, and environment from the reference. The expanded view should continue the scene naturally.
         4. NATURAL COMPOSITION: The final ${aspectRatio} image must look like a professionally taken photograph — the person should be naturally posed and fully visible with no body parts cut off at any edge. Imagine the photographer simply stepped back to capture a wider/taller shot.
         5. NO CROPPING: Do NOT crop or cut off ANY part of the person — their head, hair, hands, fingers, arms, legs, and feet must all be fully visible within the frame.
         6. NO SPLIT SCREEN / NO SEAMS: The entire output image must look like ONE single photograph taken in ONE shutter click. There must be ZERO visible seams, boundaries, or lines where one part of the image looks different from another. Specifically:
            - UNIFORM LIGHTING: The light source, shadow direction, and brightness must be consistent across the ENTIRE image — left to right, top to bottom.
            - UNIFORM COLOR: The color temperature, contrast, and color grading must be identical everywhere. No part should look warmer/cooler or brighter/darker than another.
            - CONTINUOUS PERSPECTIVE: All vanishing points, perspective lines (walls, roads, floors) must flow smoothly through the entire image without breaks or misalignment.
            - NO COLLAGE EFFECT: The image must NEVER look like two photos stitched together. It must be one seamless, cohesive photograph.
         
         ${hasIdentity ? "IDENTITY LOCK: Maintain the exact facial features, expression, and identity of the person while showing their full body." : "Show the complete person naturally composed in the frame."}
         
         SCENE DIRECTION: ${basePrompt}
         ${masterPrompt}`
      : (imageCount > 1 
        ? `${masterPrompt}\n\nVARIATION ${i + 1} of ${imageCount}: Give me a unique creative variation focused on detail and composition. FILL THE ENTIRE ${aspectRatio} FRAME.`
        : masterPrompt);

    parts.push({ text });

    const body = {
      contents: [{ parts }],
      generationConfig: {
        responseModalities: ["TEXT", "IMAGE"],
        imageConfig: { 
          aspectRatio,
          imageSize: currentResolution
        }
      }
    };

    const response = await fetchWithRetry(IMAGE_ENDPOINT, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "x-goog-api-key": API_KEY
      },
      body: JSON.stringify(body),
    }, 0, 120000); // 120s timeout for image generation

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
    
    // Small gap between requests
    if (imageCount > 1 && i < imageCount - 1) await new Promise(r => setTimeout(r, 500));
  }

  const images = results.filter((r: any) => r.image);
  const errors = results.filter((r: any) => r.error);
  
  if (images.length === 0) {
    const lastError = errors[errors.length - 1]?.error || "Unknown error";
    throw new Error(`Generation failed: ${lastError}. This usually happens when the AI quota is exceeded. Please wait a minute and try again.`);
  }

  return {
    images: images.map(img => ({ image: img.image, mimeType: img.mimeType })),
    total: images.length,
    errors: errors.length > 0 ? errors.map(e => e.error) : undefined
  };
}

export async function planAppAction(prompt: string) {
  if (!API_KEY) throw new Error("GEMINI_API_KEY not configured");

  const systemInstructions = `You are the world's #1 mobile app designer and prompt engineer. You work at the intersection of Apple HIG, Vercel/Linear aesthetics, and high-end luxury brand design.

YOUR TASK: The user gives you a SHORT idea for either a full app or a single UI component. You must:

1. EXPAND it into a world-class, extremely detailed design brief. 
   - APP/WEB PROJECTS: Describe the theme and a set of 3-7 key screens/pages tailored specifically to the project's niche and "vibe". 
   - LANDING PAGE FIRST: For websites/web projects, the first page MUST always be "Landing".
   - USER PREFERENCE: If the user explicitly mentions specific pages (e.g., "Build me a Login and a Dashboard"), YOU MUST prioritize those in your plan.
   - Demand ultra-premium aesthetics: Bento grids, sophisticated glassmorphism, fluid typography, and professional layouts.
   - Mention specific colors, spacing, and smooth CSS-based animations.
   - Explicitly state that for mobile apps, the "Welcome", "Login", and "Register" screens must NOT have a bottom tab bar, ensuring a clean entry flow. Navigation (tab bar) should strictly start from the "Home" screen.
   - DO NOT suggest any external libraries or React-specific code. Everything must be plain HTML and CSS. (No Tailwind unless requested).

2. PICK THE PERFECT COLOR PALETTE — 3 hex colors tailored to the vibe:
   - primaryColor: Main brand color.
   - secondaryColor: Surface/background or subtle complement.
   - accentColor: Pop color for CTA and attention.

COLOR RULES: Avoid generic/bright defaults. Use sophisticated, muted, or vibrant luxury palettes.

3. PICK THE PERFECT BORDER-RADIUS (rounding) for the project's vibe:
   - "0px" = Sharp/Brutalist (tech, developer tools, editorial, newspaper)
   - "8px" = Soft (corporate, SaaS, professional, business)
   - "12px" = Modern (general purpose, startups, lifestyle, e-commerce)
   - "24px" = Round (social media, playful, Gen-Z, creative, health/wellness)
   - "999px" = Pill (futuristic, AI/tech, bold, experimental)
   Choose the one that BEST matches the project's personality. Default to "12px" if unsure.

4. PICK THE PERFECT FONT FAMILY for the project's vibe:
   - "Inter" = Clean, modern, SaaS, tech, startups (like Vercel/Linear)
   - "Playfair Display" = Luxury, elegant, editorial, fashion, high-end brands
   - "Clash Display" = Bold, creative, Gen-Z, trendy, dynamic
   - "Syne" = Futuristic, experimental, artistic, tech-forward
   - "Cabinet Grotesk" = Minimal, sophisticated, design-focused, premium
   Choose the one that BEST matches the project's personality. Default to "Inter" if unsure.

Return ONLY a valid JSON object:
{
  "title": "A short, catchy title (max 40 chars)",
  "detailedPrompt": "Your 4-6 sentence master-level design brief here",
  "primaryColor": "#hexcode",
  "secondaryColor": "#hexcode",
  "accentColor": "#hexcode",
  "rounding": "12px",
  "fontFamily": "Inter",
  "screens": ["Landing", "Features", "Pricing", ...] 
}`;

  const requestBody = {
    systemInstruction: {
      parts: [{ text: systemInstructions }]
    },
    contents: [{ 
      parts: [
        { text: `APP IDEA: "${prompt}"

Respond with ONLY a JSON object containing: title, detailedPrompt, primaryColor, secondaryColor, accentColor, rounding, fontFamily, screens.` }
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

  const response = await fetchWithRetry(TEXT_ENDPOINT, {
    method: "POST",
    headers: { 
      "Content-Type": "application/json",
      "x-goog-api-key": API_KEY
    },
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

  // Valid options for rounding and font
  const validRoundings = ['0px', '8px', '12px', '24px', '999px'];
  const validFonts = ['Inter', 'Playfair Display', 'Clash Display', 'Syne', 'Cabinet Grotesk'];

  // Clean potential markdown wrap and extract JSON
  const cleaned = text
    .replace(/```json\s*/gi, '')
    .replace(/```\s*/g, '')
    .trim();
  
  const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
  
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[0]);
      
      // Validate rounding — must be one of the exact dropdown values
      const rawRounding = parsed.rounding || parsed.borderRadius || parsed.border_radius || '12px';
      const resolvedRounding = validRoundings.includes(rawRounding) ? rawRounding : '12px';
      
      // Validate fontFamily — must be one of the exact dropdown values
      const rawFont = parsed.fontFamily || parsed.font_family || parsed.font || parsed.typography || 'Inter';
      const resolvedFont = validFonts.includes(rawFont) ? rawFont : 'Inter';

      return {
        title: parsed.title || parsed.projectName || parsed.name || prompt,
        detailedPrompt: parsed.detailedPrompt || parsed.detailed_prompt || parsed.prompt || parsed.appDescription || prompt,
        primaryColor: parsed.primaryColor || parsed.primary_color || parsed.primary || '#6366F1',
        secondaryColor: parsed.secondaryColor || parsed.secondary_color || parsed.secondary || '#1E1B2E',
        accentColor: parsed.accentColor || parsed.accent_color || parsed.accent || '#F5C77E',
        rounding: resolvedRounding,
        fontFamily: resolvedFont,
        screens: Array.isArray(parsed.screens) ? parsed.screens : undefined
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
    rounding: '12px',
    fontFamily: 'Inter',
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

  const response = await fetchWithRetry(TEXT_ENDPOINT, {
    method: "POST",
    headers: { 
      "Content-Type": "application/json",
      "x-goog-api-key": API_KEY
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => "Unknown error");
    console.error("[planVisualAction] API error:", response.status, errText);
    throw new Error("Failed to expand image prompt");
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
  
  if (!text.trim()) {
    console.error("[planVisualAction] Empty response from Gemini");
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
        detailedPrompt: parsed.detailedPrompt || parsed.prompt || text
      };
    } catch (err) {
      console.error("[planVisualAction] JSON parse error:", err, "Raw:", jsonMatch[0].substring(0, 200));
    }
  }

  // Fallback: use raw text if JSON extraction fails
  console.warn("[planVisualAction] No valid JSON found, using raw text fallback");
  return {
    detailedPrompt: cleaned.substring(0, 1000) || prompt
  };
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
export async function convertToReactNativeAction(htmlCode: string) {
  if (!API_KEY) throw new Error("GEMINI_API_KEY not configured");

  const MAX_HTML_LENGTH = 10000;
  const wasTruncated = htmlCode.length > MAX_HTML_LENGTH;

  const systemInstructions = `You are a world-class React Native and Expo Mobile Engineer.
YOUR TASK: Translate the provided HTML/CSS/Tailwind code into a professional, production-ready React Native component.

GUIDELINES:
1. Use Expo standards.
2. Translate Tailwind classes to React Native StyleSheet or inline styles.
3. Use Lucide-react-native for icons.
4. Ensure the layout matches the visual intent of the HTML (flexbox, spacing, typography).
5. Output ONLY the code for a single file component (e.g., App.tsx or Screen.tsx).
6. DO NOT include markdown blocks. DO NOT include chat or meta-talk.
7. Use 'react-native' components: View, Text, Image, ScrollView, TouchableOpacity, SafeAreaView, etc.
8. Use TypeScript for all components and styles.

OUTPUT: Return the COMPLETE raw .tsx code string.`;

  const requestBody = {
    contents: [{ 
      parts: [
        { text: `TRANSLATE THIS HTML TO REACT NATIVE: \n\n${htmlCode.slice(0, MAX_HTML_LENGTH)}` }
      ] 
    }],
    systemInstruction: {
      parts: [{ text: systemInstructions }]
    },
    generationConfig: {
      temperature: 0.1, // Low temperature for high precision translation
      maxOutputTokens: 8192,
    }
  };

  const response = await fetchWithRetry(TEXT_ENDPOINT, {
    method: "POST",
    headers: { 
      "Content-Type": "application/json",
      "x-goog-api-key": API_KEY
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    throw new Error("Failed to convert to React Native");
  }

  const data = await response.json();
  let code = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
  
  // Clean potential markdown blocks
  code = code.replace(/^```(tsx|jsx|javascript|typescript|ts|js)?\n/, '').replace(/\n```$/, '');
  
  return { code, wasTruncated };
}

export async function generateAdCampaignAction(params: {
  brandDNA: any;
  goal: string;
  message: string;
  offer?: string;
  mood?: string;
  count?: number;
  aspectRatio?: string;
}) {
  const { brandDNA, goal, message, offer, count = 1, aspectRatio = '1:1' } = params;
  
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from('profiles').select('plan').eq('id', user?.id).single();
  const plan = (profile?.plan || 'free') as PlanType;
  const resolution = PLANS[plan].resolution;

  // Deduct credits for campaign
  await deductCredit(count);

  const results = [];
  const brandColors = brandDNA.colors?.join(' and ') || brandDNA.color || 'vivid signature colors';
  const brandTone = brandDNA.tone || 'energetic cool premium';
  const brandCategory = brandDNA.category || '';
  const brandAudience = brandDNA.audience || 'Gen Z young adults';
  const brandName = brandDNA.name;
  const brandDesc = brandDNA.description || '';

  // Text overlay instructions — only if user provided them
  const hasMessage = message && message.trim().length > 0;
  const hasOffer = offer && offer.trim().length > 0;
  const textInstruction = hasMessage
    ? `Bold white typography at the bottom reads: "${message}".${hasOffer ? ` Below in smaller text: "${offer}".` : ''} Brand name "${brandName}" subtly at top.`
    : `No text overlays. Completely clean image — no words, no captions, no labels. Pure visual storytelling only.`;

  // Text rules — conditional based on user input
  const typographyInstruction = hasMessage
    ? `Large ultra-bold white headline typography reads "${message}" prominently behind or around the product. ${hasOffer ? `A secondary badge or label reads "${offer}".` : ''} Brand name "${brandName}" in top corner.`
    : `No text overlays at all. Completely clean — no words, labels, or captions anywhere in the image. Pure product visual only.`;

  // 5 reference-inspired commercial brand photoshoot styles
  const creativeArchetypes = [
    {
      // Style 1: Bold Typography Hero — like NAKOA Boba / REFRESH can poster
      name: 'Bold Typography Hero',
      prompt:
        `Hyper-real commercial product poster for ${brandName} (${brandCategory}). ` +
        `The ${brandName} product is centered and floating, dominating the frame. ` +
        `Behind and around the product, enormous ultra-bold display typography in ${brandColors} tones creates a dramatic background — the letters are so large they are partially hidden behind the product. ` +
        `Flying ${brandDNA.ingredients || 'product ingredients and brand elements'} are suspended mid-air around the product with realistic physics. ` +
        `Background: smooth warm gradient in ${brandColors}. ` +
        `Lighting: soft studio key light, glossy specular highlights on packaging, subtle drop shadow beneath product. ` +
        `${typographyInstruction} ` +
        `Style: premium FMCG brand poster, modern advertising layout, ultra sharp product focus, vibrant color grading, 8K photorealistic. Campaign: ${goal}.`,
    },
    {
      // Style 2: Liquid Splash — like CRIEPVASREI strawberry can
      name: 'Liquid Splash',
      prompt:
        `Hyper-real beverage advertisement poster for ${brandName}. ` +
        `The ${brandName} product (can, bottle, or package) emerges dramatically from a large dynamic liquid splash of the brand's signature flavor — the liquid arcs outward in ultra-realistic physics. ` +
        `Floating fresh ingredients (fruits, herbs, or key brand elements) scatter dynamically around the product with realistic motion blur. ` +
        `Condensation droplets on the packaging catch studio light with glossy specular highlights. ` +
        `Background: bold smooth gradient in ${brandColors} — monochromatic and saturated. ` +
        `Bright studio lighting with cinematic HDR color grading. ` +
        `${typographyInstruction} ` +
        `Style: ultra realistic liquid physics, premium drink campaign, refreshing and vibrant, 8K. Campaign: ${goal}.`,
    },
    {
      // Style 3: Lifestyle Forced Perspective — like Pepsi Skateboarder
      name: 'Lifestyle Forced Perspective',
      prompt:
        `Hyper-real commercial lifestyle advertisement photo for ${brandName}. ` +
        `An energetic, smiling young ${brandAudience} person is skating, running, or jumping in a dynamic outdoor city environment. ` +
        `They hold the ${brandName} product very close to the camera lens in forced perspective — wide-angle 24mm lens distortion makes the product appear oversized and dominant in the foreground while the person is visible behind it. ` +
        `Sunlight flare and warm highlights streak across the scene. Motion blur on the background city environment. ` +
        `Shallow depth of field — razor sharp product, soft background. ` +
        `Color grade: vibrant, saturated, cinematic warm tones matching ${brandColors}. ` +
        `${typographyInstruction} ` +
        `Style: global advertising campaign photography, Pepsi/Nike/Red Bull aesthetic, ultra photorealistic, 8K. Campaign: ${goal}.`,
    },
    {
      // Style 4: Floating Ingredients — like Lay's chips poster
      name: 'Floating Ingredients',
      prompt:
        `Clean commercial product poster for ${brandName} (${brandCategory}). ` +
        `The ${brandName} product packet or packaging is centered and floating at a slight angle, dramatically lit from the front with soft studio key light. ` +
        `Around it, brand-relevant ingredients, chips, fruits, spices, or product elements fly outward in all directions — frozen mid-air with realistic motion, some with subtle motion blur for speed. ` +
        `Background: rich deep gradient in ${brandColors} — dark at edges, lighter in center, with subtle atmospheric glow or stars/bokeh. ` +
        `Soft vignette, premium packaging highlights, crisp shadows. ` +
        `${typographyInstruction} ` +
        `Style: premium FMCG packaging advertisement, Lay's / Maggi / Cadbury campaign aesthetic, 8K ultra photorealistic. Campaign: ${goal}.`,
    },
    {
      // Style 5: Clean FMCG Product Poster — like K2 Strawberry Juice with calligraphy/ingredient callouts
      name: 'FMCG Product Close-Up',
      prompt:
        `High-end FMCG product advertisement for ${brandName}. ` +
        `The ${brandName} product is front-and-center, large and dominant, with ultra-sharp packaging detail. ` +
        `Key ingredients (fruits, botanicals, or brand elements) are artfully placed around the product — some cut in half to show texture, some whole, all styled beautifully. ` +
        `Warm-to-vibrant gradient background in ${brandColors} — orange at top fading to deeper tones at bottom. ` +
        `Floating green leaves and light particles add freshness and life to the composition. ` +
        `Mixed typography: bold display font for the product name at top in ${brandColors}, elegant script font for the variant/flavor name below, small benefit callouts positioned around the product. ` +
        `${typographyInstruction} ` +
        `Style: premium supermarket shelf poster, FMCG advertising, fresh and vibrant, 8K photorealistic commercial photography. Campaign: ${goal}.`,
    },
  ];

  // REAL-TIME PINTEREST TREND ANALYSIS (optional enrichment)
  const references = await searchPinterestReferences(`${brandName} ${brandCategory} ${goal}`);
  
  let pinterestTrendInsight = "";
  if (references.length > 0) {
    const trendContext = references.map(r => `- ${r.title}: ${r.snippet}`).join('\n');
    const analyzeBody = {
      contents: [{
        parts: [{
          text: `You are a commercial brand photographer. Based on these Pinterest search results for "${brandCategory} ${goal}", give 2 sentences of specific visual direction to enrich the ad composition. Focus only on lighting, color, and composition details.\n\nRESULTS:\n${trendContext}`
        }]
      }]
    };
    
    try {
      const trendRes = await fetch(TEXT_ENDPOINT, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-goog-api-key': API_KEY
        },
        body: JSON.stringify(analyzeBody)
      });
      if (!trendRes.ok) {
        console.warn("[Trend Analysis] API error:", trendRes.status);
      } else {
        const trendData = await trendRes.json();
        pinterestTrendInsight = trendData.candidates?.[0]?.content?.parts?.[0]?.text || "";
      }
    } catch (err) {
      // Silently fail — Pinterest search is optional enhancement
    }
  }

  for (let i = 0; i < count; i++) {
    try {
      const archetype = creativeArchetypes[i % creativeArchetypes.length];
      const pinterestReference = pinterestTrendInsight ? `PINTEREST TREND DIRECTION: ${pinterestTrendInsight}` : "";
      const finalPrompt = `[BRAND: ${brandName}] [VIBE: ${brandTone}] [DNA: ${brandDesc}]\n\n${pinterestReference}\n\nSTYLING ARCHETYPE: ${archetype.prompt}`;

      const data = await generateAIImage({
        prompt: finalPrompt,
        aspectRatio: aspectRatio as any,
        count: 1
      });
      
      results.push({
        name: archetype.name,
        prompt: finalPrompt,
        image: data.images[0].image,
        mimeType: data.images[0].mimeType,
        ratio: aspectRatio,
        caption: hasMessage 
          ? `🔥 ${message}\n\n${brandName} #brandad #${goal.replace(/\s+/g, '').toLowerCase()}`
          : `${brandName} — ${goal}\n\n#brandad #genz #${brandName.replace(/\s+/g, '').toLowerCase()}`,
        cta: offer || "Shop Now"
      });
    } catch (err) {
      console.error(`Failed to generate ad ${i + 1}:`, err);
    }
  }

  return { ads: results };
}

// ----- CAMPAIGN BATCH GENERATOR -----
// Generates one image per platform format from a single brief

export async function generateCampaignBatchAction(params: {
  brief: string;
  formats: string[]; // keys from CAMPAIGN_FORMATS
  brandDNA?: any;    // optional brand identity
  tone?: string;
  offer?: string;
  productImages?: { data: string; mimeType: string }[];
}) {
  const { brief, formats, brandDNA, tone, offer, productImages = [] } = params;
  const selectedFormats = CAMPAIGN_FORMATS.filter(f => formats.includes(f.key));

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from('profiles').select('plan').eq('id', user?.id).single();
  const planBatch = (profile?.plan || 'free') as PlanType;
  const currentResolution = PLANS[planBatch].resolution;

  // Deduct credits for batch
  await deductCredit(selectedFormats.length);

  // Step 1: Use Gemini to plan the campaign visual direction
  const identityContext = brandDNA 
    ? `${brandDNA.type === 'brand' ? 'Brand' : 'Subject'}: ${brandDNA.name}. Description: ${brandDNA.description}. ${brandDNA.colors?.length ? `Colors: ${brandDNA.colors.join(', ')}.` : ''}`
    : '';

  const planPrompt = `You are a creative director at a top ad agency. Plan a visual campaign based on this brief:

BRIEF: "${brief}"
${identityContext}
${offer ? `OFFER/CTA: "${offer}"` : ''}

Return EXACTLY this JSON format (no markdown, no code blocks, just raw JSON):
{
  "concept": "One sentence describing the overall visual concept",
  "colorMood": "color palette description",
  "visualStyle": "photographic style description (e.g., cinematic, editorial, portrait, commercial)",
  "keyElements": "list of visual elements to include, incorporating the specific subject/product if provided",
  "typography": "description of text treatment if any text should appear"
} ${productImages.length > 0 ? "(Note: Subject/product photos ARE provided, use them as the ABSOLUTE core subject of every asset. Ensure EXACT facial features and identity match.)" : ""}`;

  let campaignPlan = {
    concept: brief,
    colorMood: 'modern and vibrant',
    visualStyle: 'premium commercial photography',
    keyElements: 'product, branding elements',
    typography: 'bold modern sans-serif'
  };

  try {
    const planRes = await fetch(`${TEXT_ENDPOINT}?key=${API_KEY}`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'x-goog-api-key': API_KEY 
      },
      body: JSON.stringify({
        contents: [{ 
          parts: [
            { text: planPrompt },
            ...productImages.map(img => ({
              inlineData: {
                data: img.data,
                mimeType: img.mimeType
              }
            }))
          ] 
        }],
        generationConfig: { 
          temperature: 0.7,
          responseMimeType: "application/json" 
        }
      }),
    });

    if (planRes.ok) {
      const planData = await planRes.json();
      const planText = planData.candidates?.[0]?.content?.parts?.[0]?.text || '';
      // Extract JSON from response
      const jsonMatch = planText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          campaignPlan = { ...campaignPlan, ...JSON.parse(jsonMatch[0]) };
        } catch {}
      }
    }
  } catch (err) {
    console.warn('[Campaign] Plan generation failed, using defaults');
  }

  console.log('[Campaign] Plan:', campaignPlan);

  // Step 2: Generate one image per selected format
  const results: {
    key: string;
    label: string;
    aspectRatio: string;
    image: string;
    mimeType: string;
    prompt: string;
    error?: string;
  }[] = [];

  for (let i = 0; i < selectedFormats.length; i++) {
    const format = selectedFormats[i];
    
    // Build format-specific prompt
    const formatHint = format.aspectRatio === '9:16' 
      ? 'VERTICAL composition — place main subject in center, leave space for text at top and bottom'
      : format.aspectRatio === '16:9'
      ? 'WIDE LANDSCAPE composition — use the full horizontal space, cinematic framing'
      : format.aspectRatio === '4:5'
      ? 'TALL PORTRAIT composition — emphasize vertical space, subject slightly above center'
      : 'SQUARE composition — centered subject with balanced negative space';

    const textOverlay = offer 
      ? `Include bold text overlay: "${offer}". ${brandDNA?.name ? `Brand name "${brandDNA.name}" visible.` : ''}`
      : 'No text overlays — pure visual only.';

    const fullPrompt = `CAMPAIGN ASSET — ${format.label} (${format.aspectRatio})

CAMPAIGN CONCEPT: ${campaignPlan.concept}
VISUAL STYLE: ${campaignPlan.visualStyle}
COLOR MOOD: ${campaignPlan.colorMood}  
KEY ELEMENTS: ${campaignPlan.keyElements}
${productImages.length > 0 ? "IMPORTANT: Use the EXACT main subject from the provided input images as the central subject. Maintain the subject's identity, face/label details, and features exactly. Place them naturally into the scene." : ""}
${identityContext}

COMPOSITION: ${formatHint}
FILL THE ENTIRE ${format.aspectRatio} FRAME completely.

BRIEF: ${brief}
${textOverlay}

TASK: ADVANCED BRAND PHOTOGRAPHY & CAMPAIGN ASSET GENERATION.
${productImages.length > 0 ? `
PIXEL-LOCK & FACE-MATCH MANDATE: You MUST treat the subject in the uploaded reference photos as the literal source of truth. 
DO NOT HALLUCINATE A DIFFERENT FACE. The final image must have the EXACT features, eye shape, nose structure, and facial proportions of the person in the provided photos.
IDENTITY LOCK: The provided person is the ONLY subject. Generate the entire ${format.label} environment around this exact identity. No substitutions.
FULL BODY: Show the person's COMPLETE body — head, shoulders, chest, torso, waist, hips. NEVER cut off the person abruptly. The subject must look naturally composed in the ${format.aspectRatio} frame.
` : "Generate a professional, stunning commercial image based on the brand DNA."}

Create a stunning, professional ${format.label} creative for this campaign. 
Style: ${campaignPlan.visualStyle}, ${campaignPlan.colorMood}.
Cohesion: Match asset ${i + 1} of ${selectedFormats.length} to the universal color palette (${campaignPlan.colorMood}) and style (${campaignPlan.visualStyle}).
Quality: 8K photorealistic commercial chromatography. Ultra premium.`;

    try {
      const body = {
        contents: [{ 
          parts: [
            { text: fullPrompt },
            ...productImages.map(img => ({
              inlineData: {
                data: img.data,
                mimeType: img.mimeType
              }
            }))
          ] 
        }],
        generationConfig: {
          responseModalities: ["TEXT", "IMAGE"],
          imageConfig: { 
            aspectRatio: format.aspectRatio,
            imageSize: currentResolution
          }
        }
      };

      const response = await fetchWithRetry(`${IMAGE_ENDPOINT}?key=${API_KEY}`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      }, 0, 120000);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        results.push({ 
          key: format.key, label: format.label, aspectRatio: format.aspectRatio,
          image: '', mimeType: '', prompt: fullPrompt,
          error: errorData?.error?.message || `Failed (${response.status})`
        });
        continue;
      }

      const data = await response.json();
      const parts = data.candidates?.[0]?.content?.parts || [];
      const imagePart = parts.find((p: any) => p.inlineData);

      if (!imagePart?.inlineData?.data) {
        results.push({ 
          key: format.key, label: format.label, aspectRatio: format.aspectRatio,
          image: '', mimeType: '', prompt: fullPrompt,
          error: 'No image returned' 
        });
        continue;
      }

      results.push({
        key: format.key,
        label: format.label,
        aspectRatio: format.aspectRatio,
        image: imagePart.inlineData.data,
        mimeType: imagePart.inlineData.mimeType || 'image/png',
        prompt: fullPrompt,
      });

      console.log(`[Campaign] Generated ${format.label} (${i + 1}/${selectedFormats.length})`);

      // Delay between requests to avoid rate limiting
      if (i < selectedFormats.length - 1) {
        await new Promise(r => setTimeout(r, 1000));
      }
    } catch (err: any) {
      console.error(`[Campaign] Failed ${format.label}:`, err.message);
      results.push({
        key: format.key, label: format.label, aspectRatio: format.aspectRatio,
        image: '', mimeType: '', prompt: fullPrompt,
        error: err.message
      });
    }
  }

  return {
    plan: campaignPlan,
    assets: results.filter(r => r.image),
    errors: results.filter(r => r.error),
    totalRequested: selectedFormats.length,
  };
}
