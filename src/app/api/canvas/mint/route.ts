import { NextRequest, NextResponse } from "next/server";
import { supabase } from "~/lib/supabase";

// Mint canvas as NFT
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId, minterFid } = body;

    if (!sessionId) {
      return NextResponse.json(
        { error: "Session ID required" },
        { status: 400 }
      );
    }

    // Get session
    const { data: session, error: sessionError } = await supabase
      .from("canvas_sessions")
      .select("*")
      .eq("id", sessionId)
      .single();

    if (sessionError || !session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    // Check if already minted
    if (session.status === "minted") {
      return NextResponse.json(
        { error: "Session already minted" },
        { status: 400 }
      );
    }

    // Update session to minting status
    await supabase
      .from("canvas_sessions")
      .update({ status: "minting" })
      .eq("id", sessionId);

    // Get all pixels for the session (for future NFT rendering)
    const { data: _pixels } = await supabase
      .from("pixels")
      .select("*")
      .eq("canvas_session_id", sessionId);

    // TODO: Implement actual NFT minting logic
    // This would involve:
    // 1. Generating canvas image
    // 2. Uploading to IPFS
    // 3. Minting NFT on Base network
    // 4. Saving NFT details to database

    // For now, we'll simulate the minting process
    const mockTokenId = `${Date.now()}`;
    const mockContractAddress = "0x" + "0".repeat(40); // Placeholder
    const mockIpfsHash = "Qm" + "0".repeat(44); // Placeholder
    const mockImageUrl = `/api/canvas/snapshot?sessionId=${sessionId}`;

    // Save minted NFT record
    const { data: nft, error: nftError } = await supabase
      .from("minted_nfts")
      .insert({
        canvas_session_id: sessionId,
        token_id: mockTokenId,
        contract_address: mockContractAddress,
        ipfs_hash: mockIpfsHash,
        image_url: mockImageUrl,
        minter_fid: minterFid || null,
      })
      .select()
      .single();

    if (nftError) {
      // Rollback session status
      await supabase
        .from("canvas_sessions")
        .update({ status: "ended" })
        .eq("id", sessionId);

      return NextResponse.json(
        { error: "Failed to save NFT record" },
        { status: 500 }
      );
    }

    // Update session with NFT details
    await supabase
      .from("canvas_sessions")
      .update({
        status: "minted",
        nft_token_id: mockTokenId,
        nft_contract_address: mockContractAddress,
      })
      .eq("id", sessionId);

    // Create new active session for next round
    await supabase.from("canvas_sessions").insert({
      start_time: new Date().toISOString(),
      end_time: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(),
      status: "active",
    });

    return NextResponse.json({
      success: true,
      nft,
      message: "Canvas minted successfully!",
    });
  } catch (error) {
    console.error("Error minting canvas:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

