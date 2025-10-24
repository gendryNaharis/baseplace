# 🚀 BasePlace Quick Start

Get your collaborative pixel canvas running in 5 minutes!

## Step 1: Install Dependencies

```bash
npm install
```

## Step 2: Set Up Supabase Database

1. Open your Supabase project: https://jzgwenebmxxpapvtvhwa.supabase.co
2. Go to **SQL Editor** in the left sidebar
3. Create a new query
4. Copy and paste the entire contents of `supabase-schema.sql`
5. Click **Run** to execute the SQL

This creates all necessary tables and functions.

## Step 3: Test Locally

```bash
npm run dev
```

Your app should now be running! The Supabase credentials are already configured in the code.

## Step 4: Deploy to Vercel (Optional)

```bash
npm run deploy:vercel
```

Or use the Vercel CLI:

```bash
vercel --prod
```

## What You Get

✅ **100x100 Pixel Canvas** - Collaborative drawing space  
✅ **Real-time Updates** - See pixels appear instantly  
✅ **Color Picker** - 16 colors to choose from  
✅ **Cooldown System** - 30 seconds between placements  
✅ **Session Timer** - 6-hour countdown display  
✅ **NFT Gallery** - View past canvases  
✅ **Zoom & Pan** - Navigate the canvas easily  

## Canvas Controls

- **Click** to place a pixel
- **Middle-click or Ctrl+Click** to pan
- **Scroll** to zoom in/out
- **Reset button** to return to default view

## How Sessions Work

1. A new canvas session starts automatically
2. Users collaborate for 6 hours
3. Session ends and canvas is prepared for NFT minting
4. New session starts immediately
5. Cron job (every 10 minutes) handles expired sessions

## Cron Job Setup

The app includes a Vercel cron job configuration that automatically checks for expired sessions every 10 minutes. This is already set up in `vercel.json`.

If deploying elsewhere, set up a cron job to call:
```
GET https://your-domain.com/api/canvas/check-sessions
```

## Database Tables

The SQL schema creates these tables:

- `canvas_sessions` - 6-hour canvas periods
- `pixels` - Individual pixel placements
- `user_cooldowns` - Spam prevention
- `minted_nfts` - NFT records

## Troubleshooting

### Build Errors
```bash
npm run build
```
Check for any TypeScript errors.

### Supabase Connection Issues
- Verify the SQL schema was executed successfully
- Check browser console for errors
- Ensure realtime is enabled in Supabase

### No Pixels Appearing
- Check the `canvas_sessions` table has an active session
- Verify you're signed in (shows your FID in the UI)
- Check browser console for real-time subscription errors

## Next Steps

1. **Customize Colors**: Edit `COLORS` array in `src/components/ui/PixelCanvas.tsx`
2. **Adjust Canvas Size**: Change `CANVAS_WIDTH` and `CANVAS_HEIGHT`
3. **Modify Cooldown**: Update `COOLDOWN_SECONDS`
4. **Implement NFT Minting**: Complete the logic in `src/app/api/canvas/mint/route.ts`

## Need Help?

- Check [SETUP.md](./SETUP.md) for detailed documentation
- Review the [Farcaster Mini Apps docs](https://miniapps.farcaster.xyz/)
- Check [Supabase docs](https://supabase.com/docs) for database help

## What's Already Configured

✅ Supabase credentials  
✅ Real-time subscriptions  
✅ User authentication  
✅ API endpoints  
✅ Cron job for session management  
✅ Responsive design  
✅ Mobile optimization  

Just run the SQL script and you're ready to go! 🎨

