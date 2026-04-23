# Convex API Error Fix Guide

## Problem
You're seeing this error:
```
Module [project]/convex/_generated/api.js was instantiated but the module factory is not available
```

This happens because the Convex development server is not running, so the generated API files don't exist.

## Solution

### Step 1: Start Convex Dev Server

Open a terminal and run ONE of these commands:

**Option A - Run both Next.js and Convex together (recommended):**
```bash
npm run dev
```

**Option B - Run Convex separately:**
```bash
npm run convex
```
(Keep this terminal open - Convex needs to stay running)

Then in another terminal:
```bash
npm run dev:next
```

### Step 2: Wait for Convex to Generate Files

You should see output like:
```
✔ Convex functions ready!
```

This means Convex has generated the API files in `convex/_generated/`.

### Step 3: Clear Next.js Cache (if needed)

If you still see errors after starting Convex:

```bash
rm -rf .next
```

Then restart your Next.js dev server.

### Step 4: Hard Reload Browser

Press `Ctrl + Shift + R` (Windows/Linux) or `Cmd + Shift + R` (Mac) to hard reload the page.

## What I Fixed

I've added the Bug Reporting toggle to your dashboard Settings view. Once Convex is running, you'll see:

1. **New "Bug Reporting" section** in Settings tab
2. **Toggle switch** to enable/disable bug reporting
3. When disabled, the extension will show users that reporting is unavailable

## Testing the Feature

1. Start Convex dev server (see Step 1)
2. Go to your project dashboard
3. Click "Settings" tab
4. Scroll down to see "Bug Reporting" section
5. Toggle it on/off
6. The extension will check this status before allowing bug submissions

## How It Works

- **Backend**: `convex/projects.ts` has `toggleReporting` mutation and `checkReportingStatus` query
- **Frontend**: Dashboard Settings view now has the toggle UI
- **Extension**: `popup.js` checks reporting status before showing the bug form
- **Schema**: Projects table has `reportingEnabled` field (defaults to `true`)

## Troubleshooting

**Still seeing errors?**
1. Make sure Convex dev server is running (check terminal)
2. Check that you see `✔ Convex functions ready!` message
3. Clear browser cache and hard reload
4. Delete `.next` folder and restart Next.js

**Extension not checking status?**
- Make sure you've reloaded the extension in Chrome
- Check that the project ID and API key are correct in extension settings

## Next Steps

Once everything is working:
- Test the toggle in dashboard
- Test that extension respects the disabled state
- Verify that users see appropriate messages when reporting is disabled
