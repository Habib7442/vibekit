import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createAdminClient } from "@/lib/supabase";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;
    const uploadType = formData.get("type") as string || "asset"; // "profile" or "asset"

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const fileExt = file.name ? file.name.split('.').pop() : 'png';
    const prefix = uploadType === "profile" ? "profile" : "asset";
    const filePath = `${userId}/${prefix}-${Date.now()}.${fileExt}`;

    console.log("Attempting upload to storage:", { bucket: 'assets', filePath, type: uploadType });

    const buffer = Buffer.from(await file.arrayBuffer());

    // Upload via direct REST API call to bypass sb_secret_ key JWT limitation.
    const uploadResponse = await fetch(
      `${supabaseUrl}/storage/v1/object/assets/${filePath}`,
      {
        method: 'POST',
        headers: {
          'apikey': supabaseServiceKey,
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'Content-Type': file.type,
          'x-upsert': 'true',
        },
        body: buffer,
      }
    );

    if (!uploadResponse.ok) {
      const errorBody = await uploadResponse.text();
      console.error("Storage upload error:", uploadResponse.status, errorBody);
      throw new Error(`Storage upload failed: ${uploadResponse.status} - ${errorBody}`);
    }

    // Construct the public URL
    const publicUrl = `${supabaseUrl}/storage/v1/object/public/assets/${filePath}`;

    // Only insert into assets table for media assets, NOT for profile pictures
    if (uploadType !== "profile") {
      const adminClient = createAdminClient();
      const { error: dbError } = await adminClient
        .from('assets')
        .insert({
          user_id: userId,
          url: publicUrl
        });

      if (dbError) {
        console.error("Database insert error:", dbError);
      }
    }

    return NextResponse.json({ publicUrl });
  } catch (error: any) {
    console.error("Full Upload Error Context:", error);
    return NextResponse.json({ 
      error: error.message || "Internal Server Error",
      details: error
    }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { url } = await req.json();
    if (!url) {
      return NextResponse.json({ error: "No URL provided" }, { status: 400 });
    }

    // Extract the file path from the public URL
    // URL format: https://xxx.supabase.co/storage/v1/object/public/assets/userId/file.ext
    const storagePrefix = `/storage/v1/object/public/assets/`;
    const pathIndex = url.indexOf(storagePrefix);
    
    if (pathIndex === -1) {
      return NextResponse.json({ error: "Invalid asset URL" }, { status: 400 });
    }

    const filePath = url.substring(pathIndex + storagePrefix.length);

    // Verify the file belongs to this user
    if (!filePath.startsWith(userId)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    console.log("Deleting from storage:", { bucket: 'assets', filePath });

    // Delete from storage via REST API
    const deleteResponse = await fetch(
      `${supabaseUrl}/storage/v1/object/assets/${filePath}`,
      {
        method: 'DELETE',
        headers: {
          'apikey': supabaseServiceKey,
          'Authorization': `Bearer ${supabaseServiceKey}`,
        },
      }
    );

    if (!deleteResponse.ok) {
      const errorBody = await deleteResponse.text();
      console.error("Storage delete error:", deleteResponse.status, errorBody);
      // Continue to delete from DB even if storage delete fails
    }

    // Delete from assets table
    const adminClient = createAdminClient();
    const { error: dbError } = await adminClient
      .from('assets')
      .delete()
      .eq('user_id', userId)
      .eq('url', url);

    if (dbError) {
      console.error("Database delete error:", dbError);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Delete Error:", error);
    return NextResponse.json({ 
      error: error.message || "Internal Server Error" 
    }, { status: 500 });
  }
}
