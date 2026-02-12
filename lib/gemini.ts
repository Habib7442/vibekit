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
