"use server";

import { expandPrompt, generateInitialMediaKit, iterateMediaKit } from "@/lib/gemini";

export async function processPromptAction(simplePrompt: string) {
  if (!simplePrompt.trim()) return null;

  try {
    const detailedPrompt = await expandPrompt(simplePrompt);
    return detailedPrompt;
  } catch (error) {
    console.error("Action Error - expandPrompt:", error);
    return null;
  }
}

export async function startBuildingAction(prompt: string, userData?: any) {
  if (!prompt.trim()) return null;

  try {
    const mediaKitData = await generateInitialMediaKit(prompt, userData);
    const projectId = crypto.randomUUID();
    return { projectId, mediaKitData };
  } catch (error) {
    console.error("Action Error - startBuilding:", error);
    return null;
  }
}

export async function iterateCodeAction(currentCode: string, instruction: string, userData?: any) {
  if (!instruction.trim()) return null;

  try {
    // If no current code, this is an initial generation
    if (!currentCode) {
      const initialData = await generateInitialMediaKit(instruction, userData);
      return initialData.code;
    }

    const updatedCode = await iterateMediaKit(currentCode, instruction);
    return updatedCode;
  } catch (error) {
    console.error("Action Error - iterateCode:", error);
    return null;
  }
}
