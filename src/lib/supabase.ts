import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://jzgwenebmxxpapvtvhwa.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp6Z3dlbmVibXh4cGFwdnR2aHdhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEzMjcxOTEsImV4cCI6MjA3NjkwMzE5MX0.biJhNWRud_I6tT6AO4WA7X7ITUbNzXY9OFNTZy0kRdg';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

// Database Types
export interface Pixel {
  id: string;
  x: number;
  y: number;
  color: string;
  fid: number;
  username: string | null;
  canvas_session_id: string;
  created_at: string;
}

export interface CanvasSession {
  id: string;
  start_time: string;
  end_time: string;
  status: 'active' | 'ended' | 'minting' | 'minted';
  nft_token_id: string | null;
  nft_contract_address: string | null;
  created_at: string;
}

export interface MintedNFT {
  id: string;
  canvas_session_id: string;
  token_id: string;
  contract_address: string;
  ipfs_hash: string;
  image_url: string;
  minted_at: string;
  minter_fid: number | null;
}

