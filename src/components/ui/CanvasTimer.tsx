"use client";

import { useEffect, useState } from "react";
import { supabase, type CanvasSession } from "~/lib/supabase";

export function CanvasTimer() {
  const [activeSession, setActiveSession] = useState<CanvasSession | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<string>("");

  useEffect(() => {
    loadActiveSession();
    const interval = setInterval(loadActiveSession, 10000); // Check every 10 seconds
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!activeSession) return;

    const updateTimer = () => {
      const now = new Date().getTime();
      const end = new Date(activeSession.end_time).getTime();
      const diff = end - now;

      if (diff <= 0) {
        setTimeRemaining("Ending soon...");
        loadActiveSession(); // Reload to check if new session started
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeRemaining(
        `${hours.toString().padStart(2, "0")}:${minutes
          .toString()
          .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
      );
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [activeSession]);

  const loadActiveSession = async () => {
    const { data, error } = await supabase
      .from("canvas_sessions")
      .select("*")
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== "PGRST116") {
      console.error("Error loading session:", error);
      return;
    }

    if (data) {
      setActiveSession(data);
    }
  };

  const getStatusColor = () => {
    if (!activeSession) return "bg-gray-500";
    
    const now = new Date().getTime();
    const end = new Date(activeSession.end_time).getTime();
    const diff = end - now;
    const hours = diff / (1000 * 60 * 60);

    if (hours < 0.5) return "bg-red-500";
    if (hours < 1) return "bg-orange-500";
    return "bg-green-500";
  };

  if (!activeSession) {
    return (
      <div className="flex items-center justify-center p-4 bg-gray-100 rounded-lg">
        <div className="text-sm text-gray-600">Loading session...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-gray-200">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${getStatusColor()} animate-pulse`}></div>
          <span className="text-sm font-medium text-gray-700">Canvas Session</span>
        </div>
        <div className="text-xs text-gray-500">
          #{activeSession.id.slice(0, 8)}
        </div>
      </div>
      
      <div className="flex items-center justify-center">
        <div className="text-3xl font-bold text-gray-900 font-mono">
          {timeRemaining}
        </div>
      </div>
      
      <div className="text-xs text-center text-gray-600">
        Time until this canvas is minted as NFT
      </div>
      
      {activeSession.status === "minting" && (
        <div className="text-xs text-center text-blue-600 font-medium animate-pulse">
          🎨 Minting NFT...
        </div>
      )}
      
      {activeSession.status === "minted" && activeSession.nft_token_id && (
        <div className="text-xs text-center text-green-600 font-medium">
          ✅ Minted as NFT #{activeSession.nft_token_id}
        </div>
      )}
    </div>
  );
}

