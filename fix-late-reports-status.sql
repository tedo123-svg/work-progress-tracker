-- Fix reports marked as "late" that were actually submitted before deadline
-- These reports were submitted before Tahsas 18, 2018 deadline
-- Current date: Hidar 29, 2018 (19 days before deadline)

-- Update all reports with status 'late' to 'submitted' for current active month
UPDATE monthly_reports mr
SET status = 'submitted', updated_at = NOW()
FROM monthly_plans mp
WHERE mr.monthly_plan_id = mp.id
  AND mp.status = 'active'
  AND mr.status = 'late'
  AND mr.submitted_at < mp.deadline;

-- Verify the fix
SELECT 
    mr.id,
    u.branch_name,
    mr.status,
    mr.submitted_at,
    mp.deadline,
    CASE 
        WHEN mr.submitted_at < mp.deadline THEN 'On Time'
        ELSE 'Actually Late'
    END as actual_status
FROM monthly_reports mr
JOIN monthly_plans mp ON mr.monthly_plan_id = mp.id
JOIN users u ON mr.branch_user_id = u.id
WHERE mp.status = 'active'
  AND mr.status IN ('submitted', 'late')
ORDER BY u.branch_name;

-- Show updated statistics
SELECT 
    COUNT(*) as total_reports,
    SUM(CASE WHEN mr.status = 'submitted' THEN 1 ELSE 0 END) as submitted,
    SUM(CASE WHEN mr.status = 'pending' THEN 1 ELSE 0 END) as pending,
    SUM(CASE WHEN mr.status = 'late' THEN 1 ELSE 0 END) as late
FROM monthly_reports mr
JOIN monthly_plans mp ON mr.monthly_plan_id = mp.id
WHERE mp.status = 'active';
