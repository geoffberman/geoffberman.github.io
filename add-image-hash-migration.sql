-- Add image_hash column to saved_recipes table
-- This allows us to cache analysis results based on the exact image
ALTER TABLE saved_recipes
ADD COLUMN IF NOT EXISTS image_hash TEXT;

-- Add fields for storing full coffee analysis
ALTER TABLE saved_recipes
ADD COLUMN IF NOT EXISTS roast_level TEXT,
ADD COLUMN IF NOT EXISTS origin TEXT,
ADD COLUMN IF NOT EXISTS flavor_notes TEXT[],
ADD COLUMN IF NOT EXISTS processing TEXT;

-- Add updated_at column for cache management
ALTER TABLE saved_recipes
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create index on image_hash for faster lookups
CREATE INDEX IF NOT EXISTS idx_saved_recipes_image_hash ON saved_recipes(user_id, image_hash);

-- Update the trigger to set updated_at on updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_saved_recipes_updated_at ON saved_recipes;
CREATE TRIGGER update_saved_recipes_updated_at
    BEFORE UPDATE ON saved_recipes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
