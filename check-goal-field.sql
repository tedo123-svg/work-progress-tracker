-- Check if goal_amharic column exists in annual_plans table
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'annual_plans' 
AND column_name = 'goal_amharic';

-- Show all columns in annual_plans table
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'annual_plans' 
ORDER BY ordinal_position;