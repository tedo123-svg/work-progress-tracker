-- Monthly Plans Table (replaces the annual plan system)
-- Each month gets its own plan that auto-renews
CREATE TABLE IF NOT EXISTS monthly_plans (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
    year INTEGER NOT NULL,
    target_amount DECIMAL(15, 2) DEFAULT 0,
    deadline DATE NOT NULL,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'archived')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(month, year, status) -- Only one active plan per month/year
);

-- Update Monthly Reports to reference monthly_plans instead of monthly_periods
-- First, add new column
ALTER TABLE monthly_reports ADD COLUMN IF NOT EXISTS monthly_plan_id INTEGER REFERENCES monthly_plans(id) ON DELETE CASCADE;

-- Update Action Reports to reference monthly_plans
ALTER TABLE action_reports ADD COLUMN IF NOT EXISTS monthly_plan_id INTEGER REFERENCES monthly_plans(id) ON DELETE CASCADE;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_monthly_plans_status ON monthly_plans(status);
CREATE INDEX IF NOT EXISTS idx_monthly_plans_month_year ON monthly_plans(month, year);
CREATE INDEX IF NOT EXISTS idx_monthly_reports_plan ON monthly_reports(monthly_plan_id);
CREATE INDEX IF NOT EXISTS idx_action_reports_plan ON action_reports(monthly_plan_id);

-- Monthly Actions Table (actions specific to each month)
CREATE TABLE IF NOT EXISTS monthly_actions (
    id SERIAL PRIMARY KEY,
    monthly_plan_id INTEGER REFERENCES monthly_plans(id) ON DELETE CASCADE,
    action_number INTEGER NOT NULL,
    action_title TEXT NOT NULL,
    plan_number INTEGER NOT NULL,
    plan_activity INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_monthly_actions_plan ON monthly_actions(monthly_plan_id);

-- Function to auto-archive old plans and create new ones
CREATE OR REPLACE FUNCTION check_and_renew_monthly_plans()
RETURNS void AS $$
DECLARE
    active_plan RECORD;
    next_month INTEGER;
    next_year INTEGER;
BEGIN
    -- Find all active plans past their deadline
    FOR active_plan IN 
        SELECT * FROM monthly_plans 
        WHERE status = 'active' AND deadline < CURRENT_DATE
    LOOP
        -- Archive the old plan
        UPDATE monthly_plans 
        SET status = 'archived', updated_at = CURRENT_TIMESTAMP
        WHERE id = active_plan.id;
        
        -- Calculate next month
        next_month := active_plan.month + 1;
        next_year := active_plan.year;
        
        IF next_month > 12 THEN
            next_month := 1;
            next_year := next_year + 1;
        END IF;
        
        -- Create next month's plan (if it doesn't exist)
        INSERT INTO monthly_plans (
            title, description, month, year, target_amount, 
            deadline, status
        )
        SELECT 
            'Monthly Plan - Month ' || next_month,
            'Auto-generated monthly plan for Ethiopian month ' || next_month,
            next_month,
            next_year,
            active_plan.target_amount,
            DATE(next_year || '-' || next_month || '-18'),
            'active'
        WHERE NOT EXISTS (
            SELECT 1 FROM monthly_plans 
            WHERE month = next_month AND year = next_year AND status = 'active'
        );
        
        RAISE NOTICE 'Archived plan for month % and created plan for month %', active_plan.month, next_month;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Create a scheduled job trigger (optional - can also be called from Node.js)
-- This would require pg_cron extension
-- SELECT cron.schedule('check-monthly-plans', '0 0 * * *', 'SELECT check_and_renew_monthly_plans()');

COMMENT ON TABLE monthly_plans IS 'Monthly plans that auto-renew. Only one active plan per month.';
COMMENT ON FUNCTION check_and_renew_monthly_plans() IS 'Archives expired plans and creates new monthly plans automatically';
