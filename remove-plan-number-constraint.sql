-- Remove NOT NULL constraint from plan_number field in actions table
-- This allows the plan_number field to be optional

ALTER TABLE actions ALTER COLUMN plan_number DROP NOT NULL;

-- Update existing records with NULL plan_number to 0 if needed (optional)
-- UPDATE actions SET plan_number = 0 WHERE plan_number IS NULL;