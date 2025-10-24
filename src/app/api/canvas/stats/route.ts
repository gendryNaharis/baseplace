import { NextResponse } from "next/server";
import { supabase } from "~/lib/supabase";

// Get canvas statistics
export async function GET() {
  try {
    // Get active session
    const { data: activeSession } = await supabase
      .from("canvas_sessions")
      .select("*")
      .eq("status", "active")
      .limit(1)
      .single();

    // Get total pixels in current session
    const { count: pixelCount } = await supabase
      .from("pixels")
      .select("*", { count: "exact", head: true })
      .eq("canvas_session_id", activeSession?.id || "");

    // Get unique contributors
    const { data: contributors } = await supabase
      .from("pixels")
      .select("fid")
      .eq("canvas_session_id", activeSession?.id || "");

    const uniqueContributors = contributors
      ? new Set(contributors.map((c) => c.fid)).size
      : 0;

    // Get total minted NFTs
    const { count: nftCount } = await supabase
      .from("minted_nfts")
      .select("*", { count: "exact", head: true });

    // Get total sessions
    const { count: sessionCount } = await supabase
      .from("canvas_sessions")
      .select("*", { count: "exact", head: true });

    return NextResponse.json({
      activeSession: activeSession
        ? {
            id: activeSession.id,
            startTime: activeSession.start_time,
            endTime: activeSession.end_time,
            status: activeSession.status,
          }
        : null,
      currentCanvas: {
        pixels: pixelCount || 0,
        contributors: uniqueContributors,
        coverage: ((pixelCount || 0) / (100 * 100) * 100).toFixed(1) + "%",
      },
      totals: {
        sessions: sessionCount || 0,
        nfts: nftCount || 0,
      },
    });
  } catch (error) {
    console.error("Error fetching stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch statistics" },
      { status: 500 }
    );
  }
}

