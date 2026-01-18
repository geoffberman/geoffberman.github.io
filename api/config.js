// API endpoint to serve public environment variables to the frontend
module.exports = async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Handle preflight request
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'GET') {
        res.status(405).json({ error: 'Method not allowed' });
        return;
    }

    // Return public environment variables
    res.status(200).json({
        SUPABASE_URL: process.env.VITE_SUPABASE_URL || '',
        SUPABASE_ANON_KEY: process.env.VITE_SUPABASE_ANON_KEY || ''
    });
};
