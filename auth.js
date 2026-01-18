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

    // Sign up with email, password, and username
    async signUp(email, password, username) {
        const supabase = window.getSupabase();
        if (!supabase) throw new Error('Supabase not configured');

        // First, sign up with email and password
        const { data, error } = await supabase.auth.signUp({
            email,
            password
        });

        if (error) throw error;

        this.user = data.user;
        this.session = data.session;

        // Ensure the session is set on the Supabase client for RLS to work
        if (data.session) {
            const { error: sessionError } = await supabase.auth.setSession({
                access_token: data.session.access_token,
                refresh_token: data.session.refresh_token
            });

            if (sessionError) {
                console.error('Failed to set session:', sessionError);
            }
        }

        // Then create the user profile with username
        if (data.user && data.session) {
            try {
                const { error: profileError } = await supabase
                    .from('profiles')
                    .insert([
                        {
                            id: data.user.id,
                            username: username
                        }
                    ]);

                if (profileError) {
                    console.error('Failed to create profile:', profileError);
                    // If username is taken, show a better error message
                    if (profileError.code === '23505') { // PostgreSQL unique violation
                        throw new Error('Username already taken. Please choose another.');
                    }
                    throw new Error('Failed to create profile: ' + profileError.message);
                }
            } catch (profileError) {
                // If profile creation fails, we should ideally delete the auth user
                // but for now just throw the error
                throw profileError;
            }
        }

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
