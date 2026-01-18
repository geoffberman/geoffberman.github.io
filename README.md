# Coffee Brew Recommender

A web app that analyzes photos of coffee bags and recommends optimal brew methods and recipes using Claude AI's vision capabilities.

## Easy Setup Guide (For Beginners)

### Step 1: Get Your Anthropic API Key

1. Go to [https://console.anthropic.com/](https://console.anthropic.com/)
2. Sign up or log in
3. Click "API Keys" in the left sidebar
4. Click "Create Key"
5. Copy the key (it looks like `sk-ant-...`)
6. **Save it somewhere safe** - you'll need it in Step 3

### Step 2: Deploy to Vercel (Free)

Vercel is a free hosting service that will run your app online.

1. Go to [https://vercel.com/signup](https://vercel.com/signup)
2. Sign up with your GitHub account (click "Continue with GitHub")
3. Once logged in, click "Add New" → "Project"
4. Find your `geoffberman.github.io` repository and click "Import"
5. Click "Deploy" (don't change any settings)
6. Wait 1-2 minutes for deployment to complete

### Step 3: Add Your API Key to Vercel

This keeps your API key secure on the server (not in the browser).

1. After deployment, click "Go to Dashboard" or find your project in Vercel
2. Click the "Settings" tab at the top
3. Click "Environment Variables" in the left sidebar
4. Add a new variable:
   - **Name:** `ANTHROPIC_API_KEY`
   - **Value:** Paste your API key from Step 1 (the `sk-ant-...` key)
   - Click "Save"
5. Go back to the "Deployments" tab
6. Click the three dots (...) on the latest deployment
7. Click "Redeploy" → "Redeploy"

### Step 4: Update the Backend Code

The serverless function needs to use your environment variable:

1. Open the file `api/analyze.js` in your repository
2. Find this line at the top:
   ```javascript
   const ANTHROPIC_API_KEY = 'YOUR_API_KEY_HERE';
   ```
3. Change it to:
   ```javascript
   const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
   ```
4. Save and commit the change
5. Push to GitHub - Vercel will automatically redeploy

### Step 5: Use the App!

1. Go to your Vercel app URL (looks like `yourproject.vercel.app`)
2. Click "Take Photo" or "Choose File" to upload a coffee bag photo
3. Click "Analyze & Get Recommendations"
4. Wait 5-10 seconds
5. See your personalized brew recommendations!

## Features

- **Photo Upload**: Take a photo or upload an image of your coffee bag
- **AI Analysis**: Identifies roast level, origin, flavor notes, and more
- **Brew Recommendations**: Get the best brew method for your specific coffee
- **Detailed Recipe**: Exact measurements, temperatures, and step-by-step instructions
- **Secure**: Your API key is stored safely on the server, not in your browser

## Troubleshooting

**"Failed to fetch" error:**
- Make sure you completed Step 3 (added API key to Vercel)
- Make sure you completed Step 4 (updated the code to use environment variable)
- Make sure you redeployed after adding the environment variable

**Analysis takes too long:**
- First analysis might take 10-15 seconds, this is normal
- Make sure your photo is clear and well-lit

**Wrong recommendations:**
- Try taking a clearer photo with the coffee bag label visible
- Make sure there's good lighting on the text/label

## How It Works

1. You upload a photo of your coffee bag
2. The photo is sent to a secure serverless function on Vercel
3. The serverless function sends it to Claude AI (Anthropic's vision model)
4. Claude analyzes the bag and generates personalized recommendations
5. You see the results!

## Privacy

- Your photos are only used for analysis and not stored
- Your API key is stored securely as an environment variable on Vercel
- No data is saved or shared

## Support

If you run into issues:
1. Check the troubleshooting section above
2. Make sure all steps were completed in order
3. Try redeploying from Vercel dashboard

Enjoy your perfectly brewed coffee! ☕
