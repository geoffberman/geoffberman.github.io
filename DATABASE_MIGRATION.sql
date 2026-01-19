-- Add new equipment columns to support pod machines, no grinder, and other equipment
-- Run this in your Supabase SQL Editor

-- Add pod_machines column (array of text)
ALTER TABLE equipment
ADD COLUMN IF NOT EXISTS pod_machines text[] DEFAULT '{}';

-- Add no_grinder column (boolean)
ALTER TABLE equipment
ADD COLUMN IF NOT EXISTS no_grinder boolean DEFAULT false;

-- Add other_equipment column (text)
ALTER TABLE equipment
ADD COLUMN IF NOT EXISTS other_equipment text DEFAULT '';

-- Verify the columns were added
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'equipment'
ORDER BY ordinal_position;
