const API_KEY = process.env.GEMINI_API_KEY || "";

const ENDPOINTS = {
  VISION: "https://generativelanguage.googleapis.com/v1alpha/models/gemini-3-flash-preview:generateContent",
  TEXT: "https://generativelanguage.googleapis.com/v1alpha/models/gemini-3-flash-preview:generateContent",
  IMAGE: "https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-image-preview:generateContent"
};

async function callGemini(endpoint: string, body: any) {
  const response = await fetch(`${endpoint}?key=${API_KEY}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorData = await response.json();
    console.error("Gemini API Error:", errorData);
    throw new Error(errorData.error?.message || "Gemini API failure");
  }

  return response.json();
}

/**
 * Extracts Instagram metrics from a base64 image
 */
export async function extractMetricsFromImage(base64Data: string) {
  const body = {
    contents: [{
      parts: [
        { 
          text: "Extract Instagram metrics from this screenshot. Return ONLY valid JSON with these exact fields: follower_count (number), engagement_rate (percentage as number), total_reach (number), top_locations (array of strings), age_demographics (object with age ranges as keys and percentages as values), gender_split (object with male/female percentages), post_impressions (number), profile_visits (number). If any field is not visible, use null." 
        },
        {
          inlineData: {
            mimeType: "image/jpeg",
            data: base64Data
          }
        }
      ]
    }]
  };

  const data = await callGemini(ENDPOINTS.VISION, body);
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  
  try {
    const cleaned = text.replace(/```json\n|```/g, "").trim();
    return JSON.parse(cleaned);
  } catch (e) {
    console.error("Failed to parse Vision JSON:", text);
    return null;
  }
}

/**
 * Polishes a casual bio into 3 professional variations
 */
export async function generateBioVariations(originalBio: string, creatorStats: any) {
  const body = {
    contents: [{
      parts: [{
        text: `Transform this casual bio into 3 professional versions for a media kit.

Original bio: "${originalBio}"
Niche: ${creatorStats.niche || "Fashion & Lifestyle"}
Followers: ${creatorStats.follower_count || "N/A"}
Engagement: ${creatorStats.engagement_rate || "N/A"}%

Create 3 variations:
1. CORPORATE: For established luxury brands (150 words max)
2. CASUAL: For DTC/Gen-Z brands (120 words max)
3. LUXURY: For high-end fashion houses (180 words max)

Return as JSON:
{
  "corporate": "...",
  "casual": "...",
  "luxury": "..."
}`
      }]
    }]
  };

  const data = await callGemini(ENDPOINTS.TEXT, body);
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  
  try {
    const cleaned = text.replace(/```json\n|```/g, "").trim();
    return JSON.parse(cleaned);
  } catch (e) {
    console.error("Failed to parse Bio JSON:", text);
    return null;
  }
}

/**
 * Generates a single, professional creator bio
 */
export async function generateSingleBio(name: string, currentBio: string, stats: any) {
  const body = {
    contents: [{
      parts: [{
        text: `Write a single, highly professional, and emotionally engaging creator bio for: ${name}.
        
        Current Context: "${currentBio}"
        Niche/Focus: ${stats.niche || "Content Creator"}
        Key Platforms: ${stats.platforms || "Social Media"}
        
        The bio should:
        1. Be concise (max 2-3 sentences).
        2. Sound premium, authoritative, and brand-ready.
        3. Highlight the creator's unique value proposition.
        4. Focus on "vibe" and "professionalism".
        
        Return ONLY the bio text, no explanations, no quotes.`
      }]
    }]
  };

  const data = await callGemini(ENDPOINTS.TEXT, body);
  return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || currentBio;
}

/**
 * Generates custom React/Tailwind component code
 */
export async function generateMediaKitCode(userPrompt: string, creatorData: any, history?: any[]) {
  const systemContext = `You are an expert React developer and designer. Generate a beautiful, mobile-responsive media kit component using ONLY Tailwind CSS. No external dependencies. Return ONLY the code, no explanations.`;
  
  const body = {
    contents: [{
      parts: [{
        text: `${systemContext}\n\nSTYLE: ${userPrompt}\n\nCREATOR DATA:\n- Name: ${creatorData.name}\n- Followers: ${creatorData.follower_count}\n- Bio: ${creatorData.bio}\n\nReturn ONLY the React component code.`
      }]
    }]
  };

  const data = await callGemini(ENDPOINTS.TEXT, body);
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  return text.replace(/```jsx\n|```tsx\n|```javascript\n|```/g, "").trim();
}

/**
 * Generates a branded visual asset
 */
export async function generateVisualAsset(prompt: string) {
  const body = {
    contents: [{
      parts: [{ text: prompt }]
    }],
    generationConfig: {
      responseModalities: ["TEXT", "IMAGE"],
      imageConfig: {
        aspectRatio: "16:9",
        imageSize: "2K"
      }
    }
  };

  const data = await callGemini(ENDPOINTS.IMAGE, body);
  // Implementation depends on actual REST response format for images
  return data;
}

/**
 * Expands a simple prompt into a detailed, descriptive one
 */
export async function expandPrompt(simplePrompt: string) {
  const body = {
    contents: [{
      parts: [{
        text: `Expand this simple media kit idea into a detailed, professional, and visually descriptive prompt (about 100-150 words). 
        Focus on: Visual aesthetic, core niche identity, key metrics to highlight, and target audience vibe.
        
        Simple Idea: "${simplePrompt}"
        
        Expanded Prompt:`
      }]
    }]
  };

  const data = await callGemini(ENDPOINTS.TEXT, body);
  return data.candidates?.[0]?.content?.parts?.[0]?.text || simplePrompt;
}

/**
 * Generates initial structured content for a media kit
 */
export async function generateInitialMediaKit(prompt: string, userData?: any) {
  const userContext = userData ? `
        --- USER DATA (USE THIS DATA) ---
        - Name: ${userData.name || "Habib"}
        - Bio: ${userData.bio || "Creator & Influencer"}
        - Instagram: ${userData.instagramFollowers || "0"} followers (${userData.instagramLink || "#"})
        - YouTube: ${userData.youtubeSubscribers || "0"} subscribers (${userData.youtubeLink || "#"})
        - X (Twitter): ${userData.xFollowers || "0"} followers (${userData.xLink || "#"})
        - Engagement Rate: ${userData.engagementRate || "0%"}
        - Email: ${userData.email || "hello@example.com"}
        - Visual Assets: Use professional placeholders, but describe them as if they are the user's high-res photos.
  ` : "";

  const body = {
    contents: [{
      parts: [{
        text: `You are an Elite Front-end Designer and Creative Director. 
        Your task is to create a breathtakingly beautiful, unique Media Kit using Tailwind CSS.
        
        INPUT CONCEPT: "${prompt}"
        ${userContext}

        --- HIGH-CONVERTING PSYCHOGRAPHIC STRUCTURE (STRICT ORDER) ---
        The AI MUST follow this exact 10-section sequence to build trust and authority:
        
        1. COVER / HERO (FIRST IMPRESSION): Use provided Name: ${userData?.name || "The Creator"}, Tagline based on Bio, Strong Hero Image, Brand Aesthetic.
        2. QUICK INTRO / ABOUT ME: Use provided Bio: ${userData?.bio || "Short professional summary"}.
        3. SOCIAL MEDIA SNAPSHOT (AUTHORITY): Use provided stats: IG: ${userData?.instagramFollowers}, YT: ${userData?.youtubeSubscribers}, X: ${userData?.xFollowers}. Show Engagement: ${userData?.engagementRate}.
        4. AUDIENCE DEMOGRAPHICS: Visual breakdown of Gender %, Age, Top Countries, and Interests (Estimate based on niche if not provided).
        5. CONTENT STYLE / BRAND AESTHETIC: 3-6 portfolio samples showing their visual mood.
        6. PAST BRAND COLLABORATIONS: Logos or screenshots of previous partnership work.
        7. SERVICES OFFERED: Structured list (e.g., Sponsored Content, UGC).
        8. RATES: Pricing information (e.g., "Starting at $XXX") or "Available upon request".
        9. TESTIMONIALS (SOCIAL PROOF): Quotes from brands.
        10. CONTACT INFORMATION (FINAL CTA): Email: ${userData?.email || "hello@example.com"}, Links: ${userData?.instagramLink}, ${userData?.youtubeLink}, ${userData?.xLink}.

        --- DESIGN & BRANDING PROTOCOL ---
        - EDITORIAL FEEL: Premium digital document. NO Navbars. NO generic buttons.
        - INTERACTION: Only social links and email addresses are clickable.
        - DATA VISUALIZATION: Use charts, graphs, and bold stat cards.
        - MOBILE-FRIENDLY: Flawless vertical flow.
        - TYPOGRAPHY: Elegant use of serif (Playfair Display) for headers and sans (Inter) for copy.

        --- TECHNICAL RULES ---
        1. Use React (TSX) and Tailwind CSS.
        2. Component 'MediaKit' MUST wrap everything in a <main className="min-h-screen w-full bg-white text-black ...">.
        3. NO NAVIGATION BARS or BUTTONS (except social icons).
        4. Use Lucide-react for icons.
        5. Return ONLY a single self-contained default export component named 'MediaKit'.

        RETURN ONLY valid JSON:
        {
          "title": "High-Converting Media Kit",
          "layoutType": "Professional Editorial",
          "code": "Transpiler-ready React TSX code..."
        }`
      }]
    }]
  };

  const data = await callGemini(ENDPOINTS.TEXT, body);
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  
  try {
    const cleaned = text.replace(/```json\n|```/g, "").trim();
    return JSON.parse(cleaned);
  } catch (e) {
    console.error("Failed to parse initial media kit JSON:", text);
    return { title: "New Project", code: text };
  }
}

export async function iterateMediaKit(currentCode: string, instruction: string) {
  const body = {
    contents: [{
      parts: [{
        text: `You are an Elite Front-end Designer. Update the following Media Kit React (TSX) code based on user feedback.
        
        CURRENT CODE:
        ${currentCode}

        USER INSTRUCTION:
        "${instruction}"

        SPECIAL MUTATION RULES (If instruction matches):
        - If "More bold": Increase contrast, larger typography, thicker borders.
        - If "More luxury": Add gold accents, increase whitespace, use serif fonts.
        - If "More minimal": Remove borders, use softer colors, extreme whitespace.
        - If "Make it sexier": Dark mode, deep red/dark grey accents, elegant transitions.
        - If "More editorial": Overlap images and text, use offset layouts.

        RULES:
        1. APPLY the changes gracefully while preserving existing content and imports.
        2. RETURN ONLY the updated React TSX code (no JSON, no markdown).
        3. Do not include any explanations.`
      }]
    }]
  };

  const data = await callGemini(ENDPOINTS.TEXT, body);
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  return text.replace(/```tsx\n|```jsx\n|```javascript\n|```/g, "").trim();
}

