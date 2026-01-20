-- Migration: Add technique_notes column to saved_recipes table
-- This allows pour over instructions and other technique notes to persist with saved recipes
-- Run this in your Supabase SQL Editor

ALTER TABLE saved_recipes
ADD COLUMN IF NOT EXISTS technique_notes TEXT DEFAULT '';

-- Add a comment to document the column
COMMENT ON COLUMN saved_recipes.technique_notes IS 'Stores the technique instructions (e.g., pour over schedules) from when the recipe was saved';
