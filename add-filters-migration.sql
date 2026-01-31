-- Add filters columns to equipment table
-- Date: 2026-01-31
-- Description: Adds filters and custom_filters columns to store coffee filter types

-- Add filters column to equipment table
ALTER TABLE equipment ADD COLUMN IF NOT EXISTS filters TEXT[] DEFAULT '{}';

-- Add custom_filters column to equipment table
ALTER TABLE equipment ADD COLUMN IF NOT EXISTS custom_filters TEXT[] DEFAULT '{}';

-- Add comments explaining the columns
COMMENT ON COLUMN equipment.filters IS 'Array of standard coffee filter types user owns (e.g., Paper - White, Paper - Natural, Sibarist Fast, Sibarist B3, Cafec, Metal, Cloth)';
COMMENT ON COLUMN equipment.custom_filters IS 'Array of custom/other coffee filter types added by user';
