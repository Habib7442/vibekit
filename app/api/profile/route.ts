import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createAdminClient } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const adminClient = createAdminClient();
    const { data: profile, error } = await adminClient
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    // Fetch dedicated assets as a fallback/sync measure
    const { data: assets } = await adminClient
      .from('assets')
      .select('url')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    const photoUrls = assets?.map((a: { url: string }) => a.url) || [];

    return NextResponse.json({
      ...(profile || { onboarding_complete: false }),
      photos: photoUrls.length > 0 ? photoUrls : (profile?.photos || [])
    });
  } catch (error: any) {
    console.error("API Error - Profile GET:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userData = await req.json();
    const adminClient = createAdminClient();

    const { error } = await adminClient
      .from('profiles')
      .upsert({
        id: userId,
        name: userData.name,
        bio: userData.bio,
        email: userData.email,
        instagram_followers: userData.instagramFollowers,
        youtube_subscribers: userData.youtubeSubscribers,
        x_followers: userData.xFollowers,
        instagram_link: userData.instagramLink,
        youtube_link: userData.youtubeLink,
        x_link: userData.xLink,
        engagement_rate: userData.engagementRate,
        profile_image_url: userData.profile_image_url || userData.profileImageUrl,
        username: userData.username,
        monthly_reach: userData.monthlyReach,
        avg_views: userData.avgViews,
        female_percentage: userData.femalePercentage,
        male_percentage: userData.malePercentage,
        top_age_range: userData.topAgeRange,
        top_country: userData.topCountry,
        is_public: userData.isPublic,
        photos: userData.photos,
        onboarding_complete: userData.onboarding_complete ?? true,
        updated_at: new Date().toISOString(),
      });

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("API Error - Profile POST:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
