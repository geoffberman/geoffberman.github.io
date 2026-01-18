# Supabase Setup Instructions

## Step 1: Create Supabase Project (5 minutes)

1. Go to https://supabase.com
2. Click "Start your project" (sign up if needed)
3. Click "New project"
4. Fill in:
   - Name: `better-coffee`
   - Database Password: (generate a strong one, save it)
   - Region: Choose closest to you
5. Click "Create new project" (takes ~2 minutes to provision)

## Step 2: Get Your Credentials

1. In your Supabase dashboard, click "Project Settings" (gear icon)
2. Click "API" in the left sidebar
3. Copy these two values:
   - **Project URL** (looks like: `https://xxxxx.supabase.co`)
   - **anon public** key (under "Project API keys")

## Step 3: Run Database Setup

1. In your Supabase dashboard, click "SQL Editor" in the left sidebar
2. Click "New query"
3. Copy and paste the entire contents of `supabase-setup.sql`
4. Click "Run" (bottom right)
5. You should see "Success. No rows returned"

## Step 4: Add Credentials to Vercel

1. Go to your Vercel dashboard
2. Select your project
3. Go to Settings → Environment Variables
4. Add these two variables:
   - `VITE_SUPABASE_URL` = (your Project URL)
   - `VITE_SUPABASE_ANON_KEY` = (your anon public key)
5. Click "Save"
6. Redeploy your app (Deployments → click ⋯ → Redeploy)

Done! Your database is ready.
