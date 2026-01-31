-- Add filters column to equipment table
-- Date: 2026-01-31
-- Description: Adds filters column to store coffee filter types (paper white, paper natural, metal, cloth)

-- Add filters column to equipment table
ALTER TABLE equipment ADD COLUMN IF NOT EXISTS filters TEXT[] DEFAULT '{}';

-- Add comment explaining the column
COMMENT ON COLUMN equipment.filters IS 'Array of coffee filter types user owns (e.g., Paper - White, Paper - Natural, Metal, Cloth)';
