// Supabase Client for Grocery App
// This is separate from the coffee app's Supabase instance

// IMPORTANT: Replace these with your grocery app's Supabase credentials
// Get these from: Supabase Dashboard → Settings → API

const SUPABASE_URL = 'YOUR_GROCERY_SUPABASE_URL'; // Replace with your Project URL
const SUPABASE_ANON_KEY = 'YOUR_GROCERY_SUPABASE_ANON_KEY'; // Replace with your anon/public key

// Initialize Supabase client
if (typeof supabase !== 'undefined' && supabase.createClient) {
    window.supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    console.log('Grocery app Supabase client initialized');
} else {
    console.error('Supabase library not loaded. Make sure the CDN script is included in index.html');
}
