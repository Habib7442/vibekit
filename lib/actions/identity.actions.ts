'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export interface StudioModel {
  id: string;
  name: string;
  description: string;
  type: 'person' | 'product' | 'brand';
  reference_images: string[];
  // Brand DNA Fields
  colors?: string[];
  tone?: string;
  style?: string;
  audience?: string;
  category?: string;
  typography?: string;
}

export async function getMyIdentities() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return [];

  const { data, error } = await supabase
    .from('studio_models')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[Identities] Fetch Error:', error);
    return [];
  }

  return data as StudioModel[];
}

export async function createIdentityAction(params: {
  name: string;
  description: string;
  type: 'person' | 'product' | 'brand';
  referenceImages?: string[];
}) {
  if (!params.name?.trim()) throw new Error('Name is required');
  if (params.name.length > 100) throw new Error('Name must be 100 characters or less');
  if (!params.description?.trim()) throw new Error('Description is required');
  if (params.description.length > 1000) throw new Error('Description must be 1000 characters or less');

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error("Unauthorized");

  const { data, error } = await supabase
    .from('studio_models')
    .insert([{
      user_id: user.id,
      name: params.name,
      description: params.description,
      type: params.type,
      reference_images: params.referenceImages || []
    }])
    .select()
    .single();

  if (error) throw error;
  
  revalidatePath('/studio/visual');
  return { success: true, model: data };
}

export async function deleteIdentityAction(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error("Unauthorized");

  const { data, error } = await supabase
    .from('studio_models')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .maybeSingle();

  if (error) throw error;
  if (!data) {
    throw new Error('Identity not found or already deleted');
  }
  revalidatePath('/studio/visual');
  return { success: true };
}

export async function analyzeBrandDNAAction(url: string, scrapedData: { title: string; description: string; text: string; images: any[] }) {
  const API_KEY = process.env.GEMINI_API_KEY || "";
  if (!API_KEY) throw new Error("GEMINI_API_KEY not configured");

  const systemInstructions = `You are a world-class Brand Strategist and Creative Director.
YOUR TASK: Analyze the provided scraped data from a brand's website/social media and build a "Brand DNA Card".

Return ONLY a valid JSON object:
{
  "name": "Brand Name",
  "category": "e.g. Luxury Skincare, Streetwear, Artisanal Coffee",
  "description": "A comprehensive 3-4 sentence Brand DNA description for AI image generation.",
  "colors": ["#hex1", "#hex2", "#hex3"],
  "tone": "e.g. Luxury, Playful, Bold, Minimal, Street",
  "style": "e.g. Cinematic, Editorial, Lifestyle, Product-focused",
  "audience": "e.g. Young women, Fitness enthusiasts, Luxury travelers",
  "typography": "e.g. Serif elegant, Sans bold, Handwritten casual"
}`;

  const requestBody = {
    systemInstruction: {
      parts: [{ text: systemInstructions }]
    },
    contents: [{ 
      parts: [
        { text: `SCRAPED DATA FOR URL: ${url}
        TITLE: ${scrapedData.title}
        META DESC: ${scrapedData.description}
        TEXT CONTENT: ${scrapedData.text.slice(0, 3000)}` }
      ] 
    }],
    generationConfig: {
      temperature: 0.7,
      responseMimeType: "application/json",
    }
  };

  const response = await fetch(`https://generativelanguage.googleapis.com/v1alpha/models/gemini-3-flash-preview:generateContent?key=${API_KEY}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) throw new Error("Failed to analyze brand DNA");

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
  
  try {
    return JSON.parse(text);
  } catch (err) {
    console.error("[analyzeBrandDNAAction] JSON parse error:", err);
    throw new Error("Invalid response from AI");
  }
}
