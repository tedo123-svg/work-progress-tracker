-- Manually create the first monthly plan for current month
-- Run this ENTIRE script in Supabase SQL Editor

DO $$
DECLARE
    new_plan_id INTEGER;
BEGIN
    -- Insert current month's plan (December 2025 = Month 6, Ethiopian Year 2018)
    INSERT INTO monthly_plans (
        title, 
        description, 
        month, 
        year, 
        target_amount, 
        deadline, 
        status
    ) VALUES (
        'Monthly Plan - Month 6',
        'Monthly plan for Ethiopian month 6 (Tahsas)',
        6,  -- December = Month 6 in Ethiopian calendar
        2018,  -- Ethiopian year
        114277.75,  -- Default target
        '2025-12-18',  -- Deadline: 18th of December
        'active'
    ) RETURNING id INTO new_plan_id;

    -- Create reports for all 10 branch users
    INSERT INTO monthly_reports (monthly_plan_id, branch_user_id, status)
    SELECT 
        new_plan_id,
        id,
        'pending'
    FROM users 
    WHERE role = 'branch_user';

    -- Show success message
    RAISE NOTICE 'Monthly plan created with ID: %', new_plan_id;
    RAISE NOTICE 'Created reports for % branches', (SELECT COUNT(*) FROM users WHERE role = 'branch_user');
END $$;

-- Verify the plan was created
SELECT 
    id,
    title,
    month,
    year,
    target_amount,
    deadline,
    status,
    created_at
FROM monthly_plans 
WHERE status = 'active';

-- Verify reports were created
SELECT 
    COUNT(*) as total_reports,
    SUM(CASE WHEN mr.status = 'pending' THEN 1 ELSE 0 END) as pending_reports
FROM monthly_reports mr
JOIN monthly_plans mp ON mr.monthly_plan_id = mp.id
WHERE mp.status = 'active';
