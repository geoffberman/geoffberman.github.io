-- Add notes column to saved_recipes table
-- This allows users to store notes about their brewing experiences
ALTER TABLE saved_recipes
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Create index on notes for potential text searches
CREATE INDEX IF NOT EXISTS idx_saved_recipes_notes ON saved_recipes USING GIN (to_tsvector('english', notes));
