import { NextRequest, NextResponse } from "next/server";
import { supabase } from "~/lib/supabase";

// Get current canvas state
export async function GET() {
  try {
    // Get active session
    const { data: session, error: sessionError } = await supabase
      .from("canvas_sessions")
      .select("*")
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (sessionError && sessionError.code !== "PGRST116") {
      return NextResponse.json(
        { error: "Failed to get session" },
        { status: 500 }
      );
    }

    if (!session) {
      // Create new session if none exists
      const { data: newSession, error: createError } = await supabase
        .from("canvas_sessions")
        .insert({
          start_time: new Date().toISOString(),
          end_time: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(),
          status: "active",
        })
        .select()
        .single();

      if (createError) {
        return NextResponse.json(
          { error: "Failed to create session" },
          { status: 500 }
        );
      }

      return NextResponse.json({
        session: newSession,
        pixels: [],
      });
    }

    // Get pixels for current session
    const { data: pixels, error: pixelsError } = await supabase
      .from("pixels")
      .select("*")
      .eq("canvas_session_id", session.id);

    if (pixelsError) {
      return NextResponse.json(
        { error: "Failed to get pixels" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      session,
      pixels: pixels || [],
    });
  } catch (error) {
    console.error("Error in canvas API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Place a pixel
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { x, y, color, fid, username } = body;

    if (typeof x !== "number" || typeof y !== "number" || !color || !fid) {
      return NextResponse.json({ error: "Invalid parameters" }, { status: 400 });
    }

    // Get active session
    const { data: session, error: sessionError } = await supabase
      .from("canvas_sessions")
      .select("id")
      .eq("status", "active")
      .limit(1)
      .single();

    if (sessionError || !session) {
      return NextResponse.json(
        { error: "No active session" },
        { status: 400 }
      );
    }

    // Check cooldown
    const { data: cooldown } = await supabase
      .from("user_cooldowns")
      .select("*")
      .eq("fid", fid)
      .eq("canvas_session_id", session.id)
      .single();

    if (cooldown) {
      const lastPixelTime = new Date(cooldown.last_pixel_time).getTime();
      const now = Date.now();
      const cooldownMs = 30 * 1000; // 30 seconds

      if (now - lastPixelTime < cooldownMs) {
        const remainingSeconds = Math.ceil((cooldownMs - (now - lastPixelTime)) / 1000);
        return NextResponse.json(
          { error: `Please wait ${remainingSeconds} seconds`, cooldown: remainingSeconds },
          { status: 429 }
        );
      }
    }

    // Place pixel
    const { data: pixel, error: pixelError } = await supabase
      .from("pixels")
      .upsert({
        x,
        y,
        color,
        fid,
        username,
        canvas_session_id: session.id,
      })
      .select()
      .single();

    if (pixelError) {
      return NextResponse.json(
        { error: "Failed to place pixel" },
        { status: 500 }
      );
    }

    // Update cooldown
    await supabase.from("user_cooldowns").upsert({
      fid,
      last_pixel_time: new Date().toISOString(),
      canvas_session_id: session.id,
    });

    return NextResponse.json({ success: true, pixel });
  } catch (error) {
    console.error("Error placing pixel:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

