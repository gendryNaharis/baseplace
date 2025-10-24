# BasePlace Setup Guide

BasePlace is a collaborative pixel art canvas on Farcaster, inspired by r/place. Every 6 hours, the canvas resets and the final artwork is minted as an NFT on Base network.

## Features

- 🎨 **Collaborative Canvas**: 100x100 pixel grid where users can place pixels
- ⏱️ **6-Hour Sessions**: Canvas resets every 6 hours
- 🖼️ **NFT Minting**: Each completed canvas is automatically minted as an NFT
- 🎨 **16-Color Palette**: r/place inspired color selection
- ⏳ **Cooldown System**: 30-second cooldown between pixel placements
- 🔄 **Real-time Updates**: See pixels appear in real-time using Supabase subscriptions
- 📱 **Mobile-First**: Optimized for Farcaster mobile apps
- 🔍 **Zoom & Pan**: Navigate the canvas easily
- 🖼️ **NFT Gallery**: View all previously minted canvases

## Setup Instructions

### 1. Supabase Database Setup

1. Go to your Supabase project: https://jzgwenebmxxpapvtvhwa.supabase.co
2. Navigate to the SQL Editor
3. Run the SQL script from `supabase-schema.sql`

This will create:
- `canvas_sessions` table - Tracks 6-hour canvas sessions
- `pixels` table - Stores individual pixel placements
- `minted_nfts` table - Records of minted NFTs
- `user_cooldowns` table - Prevents spam with cooldowns
- Row Level Security policies
- Helper functions for session management

### 2. Install Dependencies

```bash
npm install
```

The app uses:
- `@supabase/supabase-js` for database and real-time subscriptions
- `@farcaster/miniapp-sdk` for Farcaster integration
- `@neynar/react` for user authentication

### 3. Environment Variables

The Supabase credentials are already configured in `src/lib/supabase.ts`:
- URL: `https://jzgwenebmxxpapvtvhwa.supabase.co`
- Anon Key: (already configured)

Make sure you have these environment variables set:
```env
NEXT_PUBLIC_URL=your-app-url
NEYNAR_API_KEY=your-neynar-api-key
NEYNAR_CLIENT_ID=your-neynar-client-id
```

### 4. Run Development Server

```bash
npm run dev
```

### 5. Automatic Session Management

To automatically end expired sessions and mint NFTs, you can set up a cron job to call:

```
GET /api/canvas/check-sessions
```

Recommended: Set up a Vercel Cron Job or similar service to call this endpoint every 10 minutes.

Example vercel.json configuration:

```json
{
  "crons": [
    {
      "path": "/api/canvas/check-sessions",
      "schedule": "*/10 * * * *"
    }
  ]
}
```

## API Endpoints

### GET /api/canvas
Get current canvas state including active session and all pixels.

### POST /api/canvas
Place a pixel on the canvas.

**Body:**
```json
{
  "x": 0,
  "y": 0,
  "color": "#FFFFFF",
  "fid": 12345,
  "username": "username"
}
```

### GET /api/canvas/snapshot?sessionId=xxx
Get canvas snapshot for a specific session.

### POST /api/canvas/mint
Mint a canvas session as NFT (automatic).

**Body:**
```json
{
  "sessionId": "uuid",
  "minterFid": 12345
}
```

### GET /api/canvas/check-sessions
Check for expired sessions and trigger minting (cron job endpoint).

## Canvas Configuration

You can customize the canvas in `src/components/ui/PixelCanvas.tsx`:

- `CANVAS_WIDTH`: Default 100 pixels
- `CANVAS_HEIGHT`: Default 100 pixels
- `PIXEL_SIZE`: Default 10px rendering size
- `COOLDOWN_SECONDS`: Default 30 seconds
- `COLORS`: 16-color r/place inspired palette

## How It Works

1. **Canvas Sessions**: A new session starts automatically every 6 hours
2. **Pixel Placement**: Users can place one pixel every 30 seconds
3. **Real-time Updates**: All connected users see pixels appear instantly
4. **Session End**: After 6 hours, the session ends automatically
5. **NFT Minting**: The canvas is captured and minted as an NFT on Base
6. **New Session**: A fresh canvas starts immediately

## NFT Minting (Coming Soon)

The current implementation includes placeholder NFT minting. To complete the NFT functionality:

1. Set up an NFT contract on Base network
2. Implement IPFS upload for canvas snapshots
3. Integrate with your smart contract for minting
4. Update `src/app/api/canvas/mint/route.ts` with actual minting logic

## Architecture

- **Frontend**: Next.js 15 with React 19
- **Database**: Supabase (PostgreSQL + Realtime)
- **Blockchain**: Base network (for NFT minting)
- **Framework**: Farcaster Mini Apps SDK
- **Styling**: Tailwind CSS

## File Structure

```
src/
├── app/
│   ├── api/
│   │   ├── canvas/
│   │   │   ├── route.ts              # Canvas state & pixel placement
│   │   │   ├── snapshot/route.ts     # Canvas snapshots
│   │   │   ├── mint/route.ts         # NFT minting
│   │   │   └── check-sessions/route.ts # Session management
│   └── page.tsx
├── components/
│   ├── ui/
│   │   ├── PixelCanvas.tsx           # Main canvas component
│   │   ├── CanvasTimer.tsx           # 6-hour countdown
│   │   ├── NFTGallery.tsx            # Previous canvases
│   │   ├── Footer.tsx                # Navigation
│   │   └── Header.tsx                # App header
│   └── App.tsx                       # Main app container
├── lib/
│   ├── supabase.ts                   # Supabase client & types
│   └── constants.ts                  # App configuration
└── hooks/
    ├── useNeynarUser.ts              # User authentication
    └── useQuickAuth.ts               # Quick auth flow
```

## Troubleshooting

### Pixels not appearing
- Check Supabase connection
- Verify realtime subscriptions are enabled
- Check browser console for errors

### Authentication issues
- Verify Neynar API credentials
- Check user FID is available
- Ensure Mini App context is loaded

### Database errors
- Run the SQL schema again
- Check Row Level Security policies
- Verify table permissions

## Contributing

Feel free to submit issues and enhancement requests!

## License

MIT License - see LICENSE file for details

