-- Diagnostic queries to understand the current month reports issue

-- 1. Check what the current Ethiopian date calculation gives us
-- December 8, 2025 should be Month 6 (Tahsas), Year 2018

-- 2. Check all monthly plans and their status
SELECT 
    id, 
    month, 
    year, 
    status, 
    title,
    created_at,
    target_amount
FROM monthly_plans 
ORDER BY year DESC, month DESC;

-- 3. Check reports for the expected current month (Month 6, Year 2018)
SELECT 
    mr.id,
    mp.month,
    mp.year,
    mp.status as plan_status,
    u.branch_name,
    mr.status as report_status,
    mr.submitted_at,
    mr.created_at
FROM monthly_reports mr
JOIN monthly_plans mp ON mr.monthly_plan_id = mp.id
JOIN users u ON mr.branch_user_id = u.id
WHERE mp.month = 6 AND mp.year = 2018
ORDER BY u.branch_name, mr.status;

-- 4. Check if there are reports for other months that might be showing up
SELECT 
    mp.month,
    mp.year,
    mp.status,
    COUNT(mr.id) as report_count
FROM monthly_plans mp
LEFT JOIN monthly_reports mr ON mp.id = mr.monthly_plan_id
GROUP BY mp.month, mp.year, mp.status
ORDER BY mp.year DESC, mp.month DESC;

-- 5. Check for any monthly plans with status = 'active'
SELECT 
    id,
    month,
    year,
    status,
    title,
    created_at
FROM monthly_plans 
WHERE status = 'active'
ORDER BY year DESC, month DESC;

-- 6. Check the exact query that the backend is running
-- This should match what getAllCurrentMonthReports is doing
SELECT mr.*, mp.month, mp.year, mp.target_amount, mp.deadline,
       u.username, u.branch_name, mp.title as plan_title,
       mr.status, mr.achieved_amount, mr.progress_percentage, mr.submitted_at
FROM monthly_reports mr
JOIN monthly_plans mp ON mr.monthly_plan_id = mp.id
JOIN users u ON mr.branch_user_id = u.id
WHERE mp.month = 6 AND mp.year = 2018
ORDER BY u.branch_name, mr.status;

-- 7. Check if there are duplicate monthly plans for the same month/year
SELECT 
    month,
    year,
    COUNT(*) as plan_count,
    STRING_AGG(status, ', ') as statuses
FROM monthly_plans
GROUP BY month, year
HAVING COUNT(*) > 1
ORDER BY year DESC, month DESC;