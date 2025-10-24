import { NextResponse } from "next/server";
import { supabase } from "~/lib/supabase";

// Cron job endpoint to check and end expired sessions
export async function GET() {
  try {
    // Find expired active sessions
    const { data: expiredSessions, error: fetchError } = await supabase
      .from("canvas_sessions")
      .select("*")
      .eq("status", "active")
      .lt("end_time", new Date().toISOString());

    if (fetchError) {
      console.error("Error fetching expired sessions:", fetchError);
      return NextResponse.json(
        { error: "Failed to fetch sessions" },
        { status: 500 }
      );
    }

    if (!expiredSessions || expiredSessions.length === 0) {
      return NextResponse.json({
        message: "No expired sessions found",
        count: 0,
      });
    }

    // Auto-mint expired sessions
    const mintResults = [];
    for (const session of expiredSessions) {
      try {
        // Update session status to ended
        await supabase
          .from("canvas_sessions")
          .update({ status: "ended" })
          .eq("id", session.id);

        // Trigger minting (you can call the mint API here)
        // For now, we just mark it as ended
        mintResults.push({
          sessionId: session.id,
          status: "ended",
        });
      } catch (error) {
        console.error(`Error processing session ${session.id}:`, error);
        mintResults.push({
          sessionId: session.id,
          status: "error",
        });
      }
    }

    // Check if we need to create a new active session
    const { data: activeSessions } = await supabase
      .from("canvas_sessions")
      .select("id")
      .eq("status", "active")
      .limit(1);

    if (!activeSessions || activeSessions.length === 0) {
      // Create new session
      await supabase.from("canvas_sessions").insert({
        start_time: new Date().toISOString(),
        end_time: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(),
        status: "active",
      });
    }

    return NextResponse.json({
      message: "Sessions checked and processed",
      expiredCount: expiredSessions.length,
      results: mintResults,
    });
  } catch (error) {
    console.error("Error in check-sessions:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

