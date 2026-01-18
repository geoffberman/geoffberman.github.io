# Equipment Setup Guide

## What Happened?

Your equipment settings appeared "erased" because the app is currently running in **Demo Mode** without a configured database connection.

### Why Demo Mode?

The app couldn't connect to Supabase (the database) because:
1. The `/api/config` endpoint returned a 404 error OR
2. Environment variables aren't set in your Vercel deployment

In Demo Mode:
- ✅ Equipment is saved to **browser localStorage** (local to each device/browser)
- ❌ Equipment is **NOT synced** across devices
- ❌ No user authentication available

## Immediate Solution: Add Your Equipment

1. **Open the app** in your browser
2. Look for the **"Set Up Equipment ⚠️"** button at the top
3. Click it and fill in your coffee equipment
4. Click **"Save Equipment"**

Your equipment will be saved in this browser's localStorage and will persist between visits on THIS device.

## Long-Term Solution: Enable Database Sync

To sync equipment across all your devices and enable user profiles:

### Step 1: Verify Supabase Setup

1. Go to your [Supabase Dashboard](https://app.supabase.com)
2. Make sure you've run the SQL from `supabase-setup.sql` in the SQL Editor
3. Copy your:
   - Project URL (Settings → API → Project URL)
   - Anon/Public Key (Settings → API → Project API keys → anon/public)

### Step 2: Configure Vercel Environment Variables

1. Go to your [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your `geoffberman.github.io` project
3. Go to **Settings** → **Environment Variables**
4. Add these two variables:
   ```
   Name: VITE_SUPABASE_URL
   Value: [Your Supabase Project URL]

   Name: VITE_SUPABASE_ANON_KEY
   Value: [Your Supabase Anon Key]
   ```
5. Click **Save** for each

### Step 3: Redeploy

1. Go to **Deployments** tab in Vercel
2. Click the **three dots** (•••) on the latest deployment
3. Select **Redeploy**
4. Wait for deployment to complete

### Step 4: Test

1. Open your app (it may take a minute for changes to propagate)
2. Open browser console (F12 or Inspect → Console)
3. Refresh the page
4. Look for: `Supabase initialized successfully` (instead of "demo mode")
5. You should see a **Sign In / Sign Up** modal

### Step 5: Create Account

1. Sign up with your email and password
2. Your existing localStorage equipment will automatically migrate to the database
3. Now you can sign in from any device and see your equipment!

## Debugging

Open your browser console and look for these messages:

### Good Signs ✅
```
=== App Initialization Started ===
Supabase configured: true
Supabase initialized successfully
User authenticated: true
✓ Equipment loaded successfully
```

### Demo Mode (localStorage only) ⚠️
```
=== App Initialization Started ===
Supabase configured: false
⚠️ Running in DEMO MODE - Supabase not configured
⚠️ No saved equipment found in localStorage
→ Click "My Equipment" button to add your coffee gear
```

### Problem Signs ❌
```
Config endpoint returned 404 - running in demo mode
Failed to load equipment from database
```

## Quick Checklist

- [ ] Equipment settings filled out and saved
- [ ] Supabase project created
- [ ] SQL schema executed in Supabase
- [ ] Vercel environment variables set
- [ ] App redeployed in Vercel
- [ ] Sign up/Sign in modal appears
- [ ] Equipment syncs across devices

## Still Having Issues?

Check the browser console (F12) for detailed error messages. The app now has extensive logging to help diagnose issues.
