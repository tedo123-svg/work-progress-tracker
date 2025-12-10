-- Users Table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('main_branch', 'branch_user')),
    branch_name VARCHAR(100),
    email VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Annual Plans Table
CREATE TABLE IF NOT EXISTS annual_plans (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    year INTEGER NOT NULL,
    target_amount DECIMAL(15, 2),
    target_units INTEGER,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Actions Table (Main branch creates actions with plan numbers)
CREATE TABLE IF NOT EXISTS actions (
    id SERIAL PRIMARY KEY,
    annual_plan_id INTEGER REFERENCES annual_plans(id) ON DELETE CASCADE,
    action_number INTEGER NOT NULL,
    action_title TEXT NOT NULL,
    plan_number INTEGER NOT NULL,
    plan_activity INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Monthly Periods Table (auto-generated from annual plan)
CREATE TABLE IF NOT EXISTS monthly_periods (
    id SERIAL PRIMARY KEY,
    annual_plan_id INTEGER REFERENCES annual_plans(id) ON DELETE CASCADE,
    month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
    year INTEGER NOT NULL,
    target_amount DECIMAL(15, 2),
    target_units INTEGER,
    deadline DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Monthly Plans Table (auto-renew system)
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
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Monthly Reports Table
CREATE TABLE IF NOT EXISTS monthly_reports (
    id SERIAL PRIMARY KEY,
    monthly_period_id INTEGER REFERENCES monthly_periods(id) ON DELETE CASCADE,
    branch_user_id INTEGER REFERENCES users(id),
    achieved_amount DECIMAL(15, 2) DEFAULT 0,
    achieved_units INTEGER DEFAULT 0,
    progress_percentage DECIMAL(5, 2) DEFAULT 0,
    notes TEXT,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'submitted', 'late')),
    submitted_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Link monthly reports to monthly plans (new system)
ALTER TABLE IF EXISTS monthly_reports
  ADD COLUMN IF NOT EXISTS monthly_plan_id INTEGER REFERENCES monthly_plans(id) ON DELETE CASCADE;

-- Action Reports Table (Branch users report on specific actions)
CREATE TABLE IF NOT EXISTS action_reports (
    id SERIAL PRIMARY KEY,
    action_id INTEGER REFERENCES actions(id) ON DELETE CASCADE,
    monthly_period_id INTEGER REFERENCES monthly_periods(id) ON DELETE CASCADE,
    branch_user_id INTEGER REFERENCES users(id),
    actual_activity INTEGER DEFAULT 0,
    implementation_percentage DECIMAL(5, 2) DEFAULT 0,
    notes TEXT,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'submitted', 'late')),
    submitted_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Quarterly Aggregations Table
CREATE TABLE IF NOT EXISTS quarterly_aggregations (
    id SERIAL PRIMARY KEY,
    annual_plan_id INTEGER REFERENCES annual_plans(id) ON DELETE CASCADE,
    quarter INTEGER NOT NULL CHECK (quarter BETWEEN 1 AND 4),
    year INTEGER NOT NULL,
    total_achieved_amount DECIMAL(15, 2) DEFAULT 0,
    total_achieved_units INTEGER DEFAULT 0,
    progress_percentage DECIMAL(5, 2) DEFAULT 0,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Annual Aggregations Table
CREATE TABLE IF NOT EXISTS annual_aggregations (
    id SERIAL PRIMARY KEY,
    annual_plan_id INTEGER REFERENCES annual_plans(id) ON DELETE CASCADE,
    total_achieved_amount DECIMAL(15, 2) DEFAULT 0,
    total_achieved_units INTEGER DEFAULT 0,
    progress_percentage DECIMAL(5, 2) DEFAULT 0,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_monthly_periods_plan ON monthly_periods(annual_plan_id);
CREATE INDEX IF NOT EXISTS idx_monthly_reports_period ON monthly_reports(monthly_period_id);
CREATE INDEX IF NOT EXISTS idx_monthly_reports_user ON monthly_reports(branch_user_id);
CREATE INDEX IF NOT EXISTS idx_monthly_reports_plan ON monthly_reports(monthly_plan_id);
CREATE INDEX IF NOT EXISTS idx_quarterly_agg_plan ON quarterly_aggregations(annual_plan_id);
CREATE INDEX IF NOT EXISTS idx_annual_agg_plan ON annual_aggregations(annual_plan_id);
CREATE INDEX IF NOT EXISTS idx_actions_plan ON actions(annual_plan_id);
CREATE INDEX IF NOT EXISTS idx_action_reports_action ON action_reports(action_id);
CREATE INDEX IF NOT EXISTS idx_action_reports_period ON action_reports(monthly_period_id);
CREATE INDEX IF NOT EXISTS idx_action_reports_user ON action_reports(branch_user_id);
CREATE INDEX IF NOT EXISTS idx_monthly_plans_month_year_status ON monthly_plans(month, year, status);

-- Attachments Table: links/documents associated with actions and reports
CREATE TABLE IF NOT EXISTS attachments (
    id SERIAL PRIMARY KEY,
    entity_type VARCHAR(30) NOT NULL CHECK (entity_type IN ('action','monthly_report','action_report')),
    entity_id INTEGER NOT NULL,
    title VARCHAR(255) NOT NULL,
    url TEXT NOT NULL,
    mime_type VARCHAR(100),
    uploaded_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_attachments_entity ON attachments(entity_type, entity_id);
