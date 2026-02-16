'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export interface SaveCanvasParams {
  canvasId?: string; // Optional ID for updating existing canvas
  name: string;
  type: 'app' | 'web' | 'visual' | 'component';
  isPublic?: boolean;
  screens?: {
    id: string; // The client-side id from Zustand
    screenName: string;
    code: string;
    prompt?: string;
    order?: number;
  }[];
  images?: {
    imageUrl: string;
    prompt?: string;
    aspectRatio?: string;
  }[];
}

export async function saveCanvasAction(params: SaveCanvasParams) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error('You must be logged in to save your work.');
  }

  let canvasId = params.canvasId;

  // 1. Create or Update Canvas
  if (canvasId) {
    const { error: updateError } = await supabase
      .from('canvases')
      .update({
        name: params.name,
        ...(params.isPublic !== undefined && { is_public: params.isPublic }),
        updated_at: new Date().toISOString(),
      })
      .eq('id', canvasId)
      .eq('user_id', user.id);

    if (updateError) {
      console.error('[saveCanvasAction] Update Error:', updateError);
      throw new Error('Failed to update canvas.');
    }
  } else {
    const { data: canvas, error: canvasError } = await supabase
      .from('canvases')
      .insert({
        user_id: user.id,
        name: params.name,
        type: params.type,
        is_public: params.isPublic ?? false,
      })
      .select()
      .single();

    if (canvasError || !canvas) {
      console.error('[saveCanvasAction] Create Error:', canvasError);
      throw new Error('Failed to create canvas.');
    }
    canvasId = canvas.id;
  }

  // 2. Save Screens (if any)
  if (params.screens && params.screens.length > 0) {
    // We use upsert with a unique constraint on (canvas_id, local_id)
    // This allows us to only insert new ones and update modified ones, 
    // effectively satisfying the requirement "do not save previous 5 screens again" (redundantly)
    const screensToInsert = params.screens.map((s, idx) => ({
      canvas_id: canvasId,
      local_id: s.id, // Maps the client ID to the DB local_id
      name: s.screenName,
      code: s.code,
      prompt: s.prompt,
      order: s.order ?? idx,
    }));

    const { error: screensError } = await supabase
      .from('canvas_screens')
      .upsert(screensToInsert, { onConflict: 'canvas_id, local_id' });

    if (screensError) {
      console.error('[saveCanvasAction] Screens Upsert Error:', screensError);
      throw new Error('Failed to save screens.');
    }
  }

  // 3. Save Images (if any)
  if (params.images && params.images.length > 0) {
    // Note: We don't delete images on update as they are immutable storage assets
    // But we avoid inserting duplicate URLs if they already exist in this canvas
    const { data: existingImages } = await supabase
      .from('canvas_images')
      .select('image_url')
      .eq('canvas_id', canvasId);
    
    const existingUrls = new Set(existingImages?.map(img => img.image_url) || []);
    const newImages = params.images.filter(img => !existingUrls.has(img.imageUrl));

    if (newImages.length > 0) {
      const imagesToInsert = newImages.map(img => ({
        canvas_id: canvasId,
        user_id: user.id,
        image_url: img.imageUrl,
        prompt: img.prompt,
        aspect_ratio: img.aspectRatio,
      }));

      const { error: imagesError } = await supabase
        .from('canvas_images')
        .insert(imagesToInsert);

      if (imagesError) {
        console.error('[saveCanvasAction] Images Error:', imagesError);
        throw new Error('Failed to save images.');
      }
    }
  }

  revalidatePath('/studio/generations');
  return { success: true, canvasId };
}

export async function uploadImageToStudio(base64: string, filename: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error('Unauthorized');

  // Convert base64 to Buffer
  const buffer = Buffer.from(base64, 'base64');
  
  // Sanitize filename to prevent path traversal
  const sanitizedFilename = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
  const path = `${user.id}/${Date.now()}_${sanitizedFilename}`;

  const { data, error } = await supabase.storage
    .from('studio_assets')
    .upload(path, buffer, {
      contentType: 'image/png',
      upsert: true
    });

  if (error) {
    console.error('[uploadImageToStudio] Error:', error);
    throw new Error('Failed to upload image.');
  }

  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from('studio_assets')
    .getPublicUrl(path);

  return publicUrl;
}

export async function toggleCanvasPrivacyAction(canvasId: string, isPublic: boolean) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error('Unauthorized');

  const { error } = await supabase
    .from('canvases')
    .update({ is_public: isPublic })
    .eq('id', canvasId)
    .eq('user_id', user.id);

  if (error) {
    console.error('[toggleCanvasPrivacyAction] Error:', error);
    throw new Error('Failed to update privacy.');
  }

  revalidatePath('/studio/generations');
  revalidatePath(`/studio/generations/${canvasId}`);
  return { success: true };
}

export async function getPublicCanvasesAction(limit = 12) {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('canvases')
    .select(`
      *,
      screens:canvas_screens(id, name, code, order),
      images:canvas_images(id, image_url, prompt)
    `)
    .eq('is_public', true)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('[getPublicCanvasesAction] Error:', error);
    return [];
  }

  return data;
}
