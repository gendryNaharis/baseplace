import { NextRequest, NextResponse } from "next/server";
import { supabase } from "~/lib/supabase";

const CANVAS_WIDTH = 100;
const CANVAS_HEIGHT = 100;
const PIXEL_SIZE = 10;

// Generate canvas snapshot as base64 image
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const sessionId = searchParams.get("sessionId");

    if (!sessionId) {
      return NextResponse.json(
        { error: "Session ID required" },
        { status: 400 }
      );
    }

    // Get pixels for session
    const { data: pixels, error: pixelsError } = await supabase
      .from("pixels")
      .select("*")
      .eq("canvas_session_id", sessionId);

    if (pixelsError) {
      return NextResponse.json(
        { error: "Failed to get pixels" },
        { status: 500 }
      );
    }

    // Create canvas snapshot
    // Note: This would need to be done server-side with a library like node-canvas
    // For now, we return the pixel data
    return NextResponse.json({
      sessionId,
      pixels: pixels || [],
      dimensions: {
        width: CANVAS_WIDTH,
        height: CANVAS_HEIGHT,
        pixelSize: PIXEL_SIZE,
      },
    });
  } catch (error) {
    console.error("Error generating snapshot:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

