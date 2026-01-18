// Supabase client configuration
// Fetches credentials from API endpoint

let supabaseClient = null;
let configLoaded = false;

// Initialize Supabase client
async function initSupabase() {
    try {
        const response = await fetch('/api/config');

        if (!response.ok) {
            console.warn('Config endpoint returned', response.status, '- running in demo mode');
            return false;
        }

        const config = await response.json();

        if (config.SUPABASE_URL && config.SUPABASE_ANON_KEY) {
            supabaseClient = window.supabase.createClient(config.SUPABASE_URL, config.SUPABASE_ANON_KEY);
            configLoaded = true;
            console.log('Supabase initialized successfully');
            return true;
        } else {
            console.warn('Supabase credentials not found - running in demo mode');
            return false;
        }
    } catch (error) {
        console.warn('Failed to initialize Supabase - running in demo mode:', error.message);
        return false;
    }
}

// Check if Supabase is configured
function isSupabaseConfigured() {
    return configLoaded && supabaseClient !== null;
}

// Get the Supabase client
function getSupabase() {
    return supabaseClient;
}

// Export for use in other files
window.initSupabase = initSupabase;
window.getSupabase = getSupabase;
window.isSupabaseConfigured = isSupabaseConfigured;

