"use server";

import { extractMetricsFromImage, generateBioVariations, generateMediaKitCode } from "@/lib/gemini";

export async function processInstagramScreenshot(base64Image: string) {
  try {
    const metrics = await extractMetricsFromImage(base64Image);
    return { success: true, data: metrics };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function refineBio(originalBio: string, stats: any) {
  try {
    const bios = await generateBioVariations(originalBio, stats);
    return { success: true, data: bios };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function generateInitialMediaKit(prompt: string, creatorData: any) {
  try {
    const code = await generateMediaKitCode(prompt, creatorData);
    return { success: true, data: code };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
