import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabase } from "@/lib/supabase";
import { generateInitialMediaKit, iterateMediaKit } from "@/lib/gemini";

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { currentCode, prompt, userData } = await req.json();

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    // Check credits
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('credits')
      .eq('id', userId)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    if (profile.credits < 1) {
      return NextResponse.json({ error: "Insufficient credits. Please top up." }, { status: 403 });
    }

    let result;
    if (!currentCode) {
      // Initial Build
      const initialData = await generateInitialMediaKit(prompt, userData);
      result = initialData.code;
    } else {
      // Iteration
      result = await iterateMediaKit(currentCode, prompt);
    }

    if (result) {
      // Successful generation, deduct credit
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ credits: profile.credits - 1 })
        .eq('id', userId);

      if (updateError) {
        console.error("Credit deduction failed:", updateError);
      }
    }

    return NextResponse.json({ 
      code: result,
      creditsRemaining: profile.credits - 1 
    });
  } catch (error: any) {
    console.error("API Error - Generate:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
