"use client";

import { useEffect, useState, useRef } from "react";
import { supabase, type Pixel, type CanvasSession } from "~/lib/supabase";
import { useMiniApp } from "@neynar/react";
import { Button } from "./Button";

// Canvas configuration
const CANVAS_WIDTH = 100;
const CANVAS_HEIGHT = 100;
const PIXEL_SIZE = 10; // Size of each pixel in pixels
const COOLDOWN_SECONDS = 30; // 30 seconds between placements

// Color palette (r/place inspired)
const COLORS = [
  "#FFFFFF", // White
  "#E4E4E4", // Light Gray
  "#888888", // Gray
  "#222222", // Dark Gray
  "#FFA7D1", // Pink
  "#E50000", // Red
  "#E59500", // Orange
  "#A06A42", // Brown
  "#E5D900", // Yellow
  "#94E044", // Light Green
  "#02BE01", // Green
  "#00D3DD", // Cyan
  "#0083C7", // Blue
  "#0000EA", // Dark Blue
  "#CF6EE4", // Purple
  "#820080", // Dark Purple
];

interface PixelCanvasProps {
  onPixelPlaced?: () => void;
}

export function PixelCanvas({ onPixelPlaced }: PixelCanvasProps) {
  const { context } = useMiniApp();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [pixels, setPixels] = useState<Map<string, Pixel>>(new Map());
  const [selectedColor, setSelectedColor] = useState(COLORS[0]);
  const [isPlacing, setIsPlacing] = useState(false);
  const [cooldownRemaining, setCooldownRemaining] = useState(0);
  const [activeSession, setActiveSession] = useState<CanvasSession | null>(null);
  const [hoveredPixel, setHoveredPixel] = useState<{ x: number; y: number } | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [lastPanPosition, setLastPanPosition] = useState({ x: 0, y: 0 });

  // Load active session and pixels
  useEffect(() => {
    loadActiveSession();
    loadPixels();
  }, []);

  // Subscribe to real-time pixel updates
  useEffect(() => {
    if (!activeSession) return;

    const channel = supabase
      .channel('pixels-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'pixels',
          filter: `canvas_session_id=eq.${activeSession.id}`,
        },
        (payload) => {
          const newPixel = payload.new as Pixel;
          setPixels((prev) => {
            const newMap = new Map(prev);
            newMap.set(`${newPixel.x},${newPixel.y}`, newPixel);
            return newMap;
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'pixels',
          filter: `canvas_session_id=eq.${activeSession.id}`,
        },
        (payload) => {
          const updatedPixel = payload.new as Pixel;
          setPixels((prev) => {
            const newMap = new Map(prev);
            newMap.set(`${updatedPixel.x},${updatedPixel.y}`, updatedPixel);
            return newMap;
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeSession]);

  // Draw canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Apply transformations
    ctx.save();
    ctx.translate(pan.x, pan.y);
    ctx.scale(zoom, zoom);

    // Draw grid background
    ctx.fillStyle = '#f0f0f0';
    ctx.fillRect(0, 0, CANVAS_WIDTH * PIXEL_SIZE, CANVAS_HEIGHT * PIXEL_SIZE);

    // Draw grid lines
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 0.5 / zoom;
    for (let i = 0; i <= CANVAS_WIDTH; i++) {
      ctx.beginPath();
      ctx.moveTo(i * PIXEL_SIZE, 0);
      ctx.lineTo(i * PIXEL_SIZE, CANVAS_HEIGHT * PIXEL_SIZE);
      ctx.stroke();
    }
    for (let i = 0; i <= CANVAS_HEIGHT; i++) {
      ctx.beginPath();
      ctx.moveTo(0, i * PIXEL_SIZE);
      ctx.lineTo(CANVAS_WIDTH * PIXEL_SIZE, i * PIXEL_SIZE);
      ctx.stroke();
    }

    // Draw pixels
    pixels.forEach((pixel) => {
      ctx.fillStyle = pixel.color;
      ctx.fillRect(
        pixel.x * PIXEL_SIZE,
        pixel.y * PIXEL_SIZE,
        PIXEL_SIZE,
        PIXEL_SIZE
      );
    });

    // Draw hovered pixel preview
    if (hoveredPixel && cooldownRemaining === 0) {
      ctx.fillStyle = selectedColor;
      ctx.globalAlpha = 0.5;
      ctx.fillRect(
        hoveredPixel.x * PIXEL_SIZE,
        hoveredPixel.y * PIXEL_SIZE,
        PIXEL_SIZE,
        PIXEL_SIZE
      );
      ctx.globalAlpha = 1;
    }

    ctx.restore();
  }, [pixels, hoveredPixel, selectedColor, cooldownRemaining, zoom, pan]);

  // Cooldown timer
  useEffect(() => {
    if (cooldownRemaining > 0) {
      const timer = setTimeout(() => {
        setCooldownRemaining((prev) => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldownRemaining]);

  const loadActiveSession = async () => {
    const { data, error } = await supabase
      .from('canvas_sessions')
      .select('*')
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error loading session:', error);
      return;
    }

    if (data) {
      setActiveSession(data);
    }
  };

  const loadPixels = async () => {
    const { data: sessionData } = await supabase
      .from('canvas_sessions')
      .select('id')
      .eq('status', 'active')
      .limit(1)
      .single();

    if (!sessionData) return;

    const { data, error } = await supabase
      .from('pixels')
      .select('*')
      .eq('canvas_session_id', sessionData.id);

    if (error) {
      console.error('Error loading pixels:', error);
      return;
    }

    if (data) {
      const pixelMap = new Map<string, Pixel>();
      data.forEach((pixel) => {
        pixelMap.set(`${pixel.x},${pixel.y}`, pixel);
      });
      setPixels(pixelMap);
    }
  };

  const getCanvasCoordinates = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();
    const x = (clientX - rect.left - pan.x) / zoom;
    const y = (clientY - rect.top - pan.y) / zoom;

    const gridX = Math.floor(x / PIXEL_SIZE);
    const gridY = Math.floor(y / PIXEL_SIZE);

    if (gridX >= 0 && gridX < CANVAS_WIDTH && gridY >= 0 && gridY < CANVAS_HEIGHT) {
      return { x: gridX, y: gridY };
    }

    return null;
  };

  const handleCanvasClick = async (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isPanning || cooldownRemaining > 0 || !context?.user?.fid || !activeSession) return;

    const coords = getCanvasCoordinates(e.clientX, e.clientY);
    if (!coords) return;

    setIsPlacing(true);

    try {
      const { error } = await supabase
        .from('pixels')
        .upsert({
          x: coords.x,
          y: coords.y,
          color: selectedColor,
          fid: context.user.fid,
          username: context.user.username || null,
          canvas_session_id: activeSession.id,
        }, {
          onConflict: 'x,y,canvas_session_id',
        });

      if (error) {
        console.error('Error placing pixel:', error);
        return;
      }

      // Update cooldown
      await supabase
        .from('user_cooldowns')
        .upsert({
          fid: context.user.fid,
          last_pixel_time: new Date().toISOString(),
          canvas_session_id: activeSession.id,
        });

      setCooldownRemaining(COOLDOWN_SECONDS);
      onPixelPlaced?.();
    } catch (error) {
      console.error('Error placing pixel:', error);
    } finally {
      setIsPlacing(false);
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isPanning) {
      const dx = e.clientX - lastPanPosition.x;
      const dy = e.clientY - lastPanPosition.y;
      setPan((prev) => ({ x: prev.x + dx, y: prev.y + dy }));
      setLastPanPosition({ x: e.clientX, y: e.clientY });
    } else {
      const coords = getCanvasCoordinates(e.clientX, e.clientY);
      setHoveredPixel(coords);
    }
  };

  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (e.button === 1 || e.ctrlKey || e.metaKey) {
      e.preventDefault();
      setIsPanning(true);
      setLastPanPosition({ x: e.clientX, y: e.clientY });
    }
  };

  const handleCanvasMouseUp = () => {
    setIsPanning(false);
  };

  const handleCanvasMouseLeave = () => {
    setHoveredPixel(null);
    setIsPanning(false);
  };

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setZoom((prev) => Math.max(0.5, Math.min(4, prev * delta)));
  };

  const resetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Canvas Container */}
      <div className="relative border-2 border-gray-300 rounded-lg overflow-hidden bg-gray-100">
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH * PIXEL_SIZE}
          height={CANVAS_HEIGHT * PIXEL_SIZE}
          className="cursor-crosshair touch-none"
          style={{
            width: '100%',
            maxHeight: '60vh',
            imageRendering: 'pixelated',
          }}
          onClick={handleCanvasClick}
          onMouseMove={handleCanvasMouseMove}
          onMouseDown={handleCanvasMouseDown}
          onMouseUp={handleCanvasMouseUp}
          onMouseLeave={handleCanvasMouseLeave}
          onWheel={handleWheel}
        />
        
        {/* Cooldown Overlay */}
        {cooldownRemaining > 0 && (
          <div className="absolute top-2 right-2 bg-black/70 text-white px-3 py-1 rounded-full text-sm font-medium">
            {cooldownRemaining}s
          </div>
        )}

        {/* Zoom Controls */}
        <div className="absolute bottom-2 right-2 flex gap-2">
          <Button
            onClick={() => setZoom((prev) => Math.min(4, prev * 1.2))}
            className="w-8 h-8 p-0 bg-white/90 hover:bg-white"
          >
            +
          </Button>
          <Button
            onClick={() => setZoom((prev) => Math.max(0.5, prev / 1.2))}
            className="w-8 h-8 p-0 bg-white/90 hover:bg-white"
          >
            −
          </Button>
          <Button
            onClick={resetView}
            className="px-2 h-8 text-xs bg-white/90 hover:bg-white"
          >
            Reset
          </Button>
        </div>
      </div>

      {/* Color Picker */}
      <div className="flex flex-col gap-2">
        <div className="text-sm font-medium text-gray-700">
          Select Color:
        </div>
        <div className="grid grid-cols-8 gap-2">
          {COLORS.map((color) => (
            <button
              key={color}
              onClick={() => setSelectedColor(color)}
              className={`w-10 h-10 rounded-lg border-2 transition-all hover:scale-110 ${
                selectedColor === color
                  ? 'border-blue-500 ring-2 ring-blue-300'
                  : 'border-gray-300'
              }`}
              style={{ backgroundColor: color }}
              title={color}
            />
          ))}
        </div>
      </div>

      {/* Status Info */}
      <div className="text-xs text-gray-500 text-center">
        {hoveredPixel && `Position: (${hoveredPixel.x}, ${hoveredPixel.y})`}
        {!context?.user?.fid && ' • Sign in to place pixels'}
        {isPlacing && ' • Placing...'}
      </div>
    </div>
  );
}

