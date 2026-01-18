// Authentication module for Better Coffee app

class Auth {
    constructor() {
        this.user = null;
        this.session = null;
    }

    // Initialize auth - check for existing session
    async init() {
        const supabase = window.getSupabase();
        if (!supabase) {
            console.warn('Auth: Supabase not configured');
            return false;
        }

        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
                this.session = session;
                this.user = session.user;
                console.log('Auth: User logged in:', this.user.email);
                return true;
            }
            return false;
        } catch (error) {
            console.error('Auth: Failed to get session:', error);
            return false;
        }
    }

    // Sign up with email and password
    async signUp(email, password) {
        const supabase = window.getSupabase();
        if (!supabase) throw new Error('Supabase not configured');

        const { data, error } = await supabase.auth.signUp({
            email,
            password
        });

        if (error) throw error;

        this.user = data.user;
        this.session = data.session;
        return data;
    }

    // Sign in with email and password
    async signIn(email, password) {
        const supabase = window.getSupabase();
        if (!supabase) throw new Error('Supabase not configured');

        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        });

        if (error) throw error;

        this.user = data.user;
        this.session = data.session;
        return data;
    }

    // Sign out
    async signOut() {
        const supabase = window.getSupabase();
        if (!supabase) throw new Error('Supabase not configured');

        const { error } = await supabase.auth.signOut();
        if (error) throw error;

        this.user = null;
        this.session = null;
    }

    // Check if user is authenticated
    isAuthenticated() {
        return this.user !== null && this.session !== null;
    }

    // Get current user
    getUser() {
        return this.user;
    }

    // Get user ID
    getUserId() {
        return this.user?.id || null;
    }

    // Listen for auth state changes
    onAuthStateChange(callback) {
        const supabase = window.getSupabase();
        if (!supabase) return () => {};

        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            this.session = session;
            this.user = session?.user || null;
            callback(event, session);
        });

        return () => subscription.unsubscribe();
    }
}

// Create singleton instance
window.auth = new Auth();
