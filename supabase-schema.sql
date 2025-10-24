-- BasePlace Database Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Canvas Sessions Table
-- Tracks each 6-hour canvas session
CREATE TABLE IF NOT EXISTS canvas_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  start_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  end_time TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'ended', 'minting', 'minted')),
  nft_token_id TEXT,
  nft_contract_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for querying active sessions
CREATE INDEX IF NOT EXISTS idx_canvas_sessions_status ON canvas_sessions(status);
CREATE INDEX IF NOT EXISTS idx_canvas_sessions_end_time ON canvas_sessions(end_time);

-- Pixels Table
-- Stores individual pixel placements
CREATE TABLE IF NOT EXISTS pixels (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  x INTEGER NOT NULL,
  y INTEGER NOT NULL,
  color TEXT NOT NULL,
  fid INTEGER NOT NULL,
  username TEXT,
  canvas_session_id UUID NOT NULL REFERENCES canvas_sessions(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_pixel_per_session UNIQUE (x, y, canvas_session_id)
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_pixels_session ON pixels(canvas_session_id);
CREATE INDEX IF NOT EXISTS idx_pixels_coordinates ON pixels(x, y);
CREATE INDEX IF NOT EXISTS idx_pixels_fid ON pixels(fid);

-- Minted NFTs Table
-- Tracks minted canvas NFTs
CREATE TABLE IF NOT EXISTS minted_nfts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  canvas_session_id UUID NOT NULL REFERENCES canvas_sessions(id) ON DELETE CASCADE,
  token_id TEXT NOT NULL,
  contract_address TEXT NOT NULL,
  ipfs_hash TEXT NOT NULL,
  image_url TEXT NOT NULL,
  minted_at TIMESTAMPTZ DEFAULT NOW(),
  minter_fid INTEGER
);

CREATE INDEX IF NOT EXISTS idx_minted_nfts_session ON minted_nfts(canvas_session_id);

-- User Cooldowns Table
-- Prevents spam by tracking last pixel placement time
CREATE TABLE IF NOT EXISTS user_cooldowns (
  fid INTEGER PRIMARY KEY,
  last_pixel_time TIMESTAMPTZ NOT NULL,
  canvas_session_id UUID NOT NULL REFERENCES canvas_sessions(id) ON DELETE CASCADE
);

-- Enable Row Level Security
ALTER TABLE canvas_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE pixels ENABLE ROW LEVEL SECURITY;
ALTER TABLE minted_nfts ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_cooldowns ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access
CREATE POLICY "Allow public read access to canvas_sessions"
  ON canvas_sessions FOR SELECT
  USING (true);

CREATE POLICY "Allow public read access to pixels"
  ON pixels FOR SELECT
  USING (true);

CREATE POLICY "Allow public read access to minted_nfts"
  ON minted_nfts FOR SELECT
  USING (true);

CREATE POLICY "Allow public read access to user_cooldowns"
  ON user_cooldowns FOR SELECT
  USING (true);

-- Create policies for authenticated insert
CREATE POLICY "Allow authenticated insert to pixels"
  ON pixels FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow authenticated upsert to user_cooldowns"
  ON user_cooldowns FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow authenticated update to user_cooldowns"
  ON user_cooldowns FOR UPDATE
  USING (true);

-- Function to get or create active canvas session
CREATE OR REPLACE FUNCTION get_or_create_active_session()
RETURNS UUID AS $$
DECLARE
  active_session UUID;
  session_duration INTERVAL := INTERVAL '6 hours';
BEGIN
  -- Try to find an active session
  SELECT id INTO active_session
  FROM canvas_sessions
  WHERE status = 'active' AND end_time > NOW()
  LIMIT 1;
  
  -- If no active session, create one
  IF active_session IS NULL THEN
    INSERT INTO canvas_sessions (start_time, end_time, status)
    VALUES (NOW(), NOW() + session_duration, 'active')
    RETURNING id INTO active_session;
  END IF;
  
  RETURN active_session;
END;
$$ LANGUAGE plpgsql;

-- Function to end expired sessions
CREATE OR REPLACE FUNCTION end_expired_sessions()
RETURNS void AS $$
BEGIN
  UPDATE canvas_sessions
  SET status = 'ended'
  WHERE status = 'active' AND end_time <= NOW();
END;
$$ LANGUAGE plpgsql;

-- Create initial active session
INSERT INTO canvas_sessions (start_time, end_time, status)
VALUES (NOW(), NOW() + INTERVAL '6 hours', 'active')
ON CONFLICT DO NOTHING;

