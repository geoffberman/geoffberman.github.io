// Supabase client configuration
// Fetches credentials from API endpoint

let supabase = null;
let configLoaded = false;

// Initialize Supabase client
async function initSupabase() {
    try {
        const response = await fetch('/api/config');
        const config = await response.json();

        if (config.SUPABASE_URL && config.SUPABASE_ANON_KEY) {
            supabase = window.supabase.createClient(config.SUPABASE_URL, config.SUPABASE_ANON_KEY);
            configLoaded = true;
            console.log('Supabase initialized successfully');
            return true;
        } else {
            console.warn('Supabase not configured - running in demo mode');
            return false;
        }
    } catch (error) {
        console.error('Failed to initialize Supabase:', error);
        return false;
    }
}

// Check if Supabase is configured
function isSupabaseConfigured() {
    return configLoaded && supabase !== null;
}

// Get the Supabase client
function getSupabase() {
    return supabase;
}

// Export for use in other files
window.initSupabase = initSupabase;
window.getSupabase = getSupabase;
window.isSupabaseConfigured = isSupabaseConfigured;

