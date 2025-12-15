-- Add goal field to annual_plans table
ALTER TABLE annual_plans ADD COLUMN IF NOT EXISTS goal_amharic TEXT;

-- Update existing plans to have a default goal if needed
UPDATE annual_plans 
SET goal_amharic = plan_title_amharic 
WHERE goal_amharic IS NULL AND plan_title_amharic IS NOT NULL;