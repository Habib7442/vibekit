import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { generateSingleBio } from "@/lib/gemini";

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name, currentBio, stats } = await req.json();

    const generatedBio = await generateSingleBio(name, currentBio, stats);

    return NextResponse.json({ bio: generatedBio });
  } catch (error: any) {
    console.error("Bio Generation Error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
