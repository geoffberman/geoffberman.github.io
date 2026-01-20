-- Better Coffee App Database Schema
-- Run this in your Supabase SQL Editor after creating your project

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (Supabase auth handles this automatically)
-- We'll use auth.users for authentication

-- User profiles table - stores additional user info like username
CREATE TABLE profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Equipment table - stores user's coffee equipment
CREATE TABLE equipment (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    espresso_machine TEXT,
    flow_control BOOLEAN DEFAULT false,
    grinder TEXT,
    pour_over TEXT[], -- Array of pour over devices
    other_methods TEXT[], -- Array of other brewing methods
    additional_equipment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Brew sessions table - stores each coffee analysis and brew attempt
CREATE TABLE brew_sessions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

    -- Coffee information
    coffee_name TEXT,
    roaster TEXT,
    roast_level TEXT,
    origin TEXT,
    processing TEXT,
    flavor_notes TEXT[],

    -- Brew method and original recipe
    brew_method TEXT NOT NULL,
    original_recipe JSONB NOT NULL, -- Stores the full recipe from AI

    -- User's actual brew (if they made adjustments)
    actual_brew JSONB, -- Stores what they actually did

    -- Rating
    rating TEXT, -- 'too_sour', 'perfect', 'too_bitter'

    -- Adjusted recipe (if they requested re-calculation)
    adjusted_recipe JSONB,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Saved recipes table - stores user's preferred recipes for specific coffee+method combos
CREATE TABLE saved_recipes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

    -- Coffee identifier (we'll create a hash of coffee characteristics)
    coffee_hash TEXT NOT NULL, -- Hash of: name + roaster + roast_level + origin
    coffee_name TEXT,
    roaster TEXT,

    -- Brew method
    brew_method TEXT NOT NULL,

    -- User's preferred recipe
    recipe JSONB NOT NULL,

    -- Technique notes (pour over instructions, etc.)
    technique_notes TEXT DEFAULT '',

    -- Metadata
    times_brewed INTEGER DEFAULT 1,
    last_brewed TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Ensure one saved recipe per user+coffee+method combo
    UNIQUE(user_id, coffee_hash, brew_method)
);

-- Row Level Security (RLS) policies
-- Users can only access their own data

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE brew_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_recipes ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile"
    ON profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
    ON profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
    ON profiles FOR UPDATE
    USING (auth.uid() = id);

-- Equipment policies
CREATE POLICY "Users can view their own equipment"
    ON equipment FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own equipment"
    ON equipment FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own equipment"
    ON equipment FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own equipment"
    ON equipment FOR DELETE
    USING (auth.uid() = user_id);

-- Brew sessions policies
CREATE POLICY "Users can view their own brew sessions"
    ON brew_sessions FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own brew sessions"
    ON brew_sessions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own brew sessions"
    ON brew_sessions FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own brew sessions"
    ON brew_sessions FOR DELETE
    USING (auth.uid() = user_id);

-- Saved recipes policies
CREATE POLICY "Users can view their own saved recipes"
    ON saved_recipes FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own saved recipes"
    ON saved_recipes FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own saved recipes"
    ON saved_recipes FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own saved recipes"
    ON saved_recipes FOR DELETE
    USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX idx_profiles_username ON profiles(username);
CREATE INDEX idx_equipment_user_id ON equipment(user_id);
CREATE INDEX idx_brew_sessions_user_id ON brew_sessions(user_id);
CREATE INDEX idx_brew_sessions_created_at ON brew_sessions(created_at DESC);
CREATE INDEX idx_saved_recipes_user_id ON saved_recipes(user_id);
CREATE INDEX idx_saved_recipes_lookup ON saved_recipes(user_id, coffee_hash, brew_method);

-- Function to automatically create profile when user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, username)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'username', 'user_' || substr(NEW.id::text, 1, 8))
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile after email confirmation
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    WHEN (NEW.email_confirmed_at IS NOT NULL OR NEW.phone_confirmed_at IS NOT NULL)
    EXECUTE FUNCTION public.handle_new_user();

-- Also handle updates (when user confirms email)
CREATE TRIGGER on_auth_user_confirmed
    AFTER UPDATE ON auth.users
    FOR EACH ROW
    WHEN (
        (OLD.email_confirmed_at IS NULL AND NEW.email_confirmed_at IS NOT NULL) OR
        (OLD.phone_confirmed_at IS NULL AND NEW.phone_confirmed_at IS NOT NULL)
    )
    EXECUTE FUNCTION public.handle_new_user();
