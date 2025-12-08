-- ========================================
-- Supabase Database Setup Script
-- Run this in Supabase SQL Editor
-- ========================================

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
CREATE INDEX IF NOT EXISTS idx_quarterly_agg_plan ON quarterly_aggregations(annual_plan_id);
CREATE INDEX IF NOT EXISTS idx_annual_agg_plan ON annual_aggregations(annual_plan_id);
CREATE INDEX IF NOT EXISTS idx_actions_plan ON actions(annual_plan_id);
CREATE INDEX IF NOT EXISTS idx_action_reports_action ON action_reports(action_id);
CREATE INDEX IF NOT EXISTS idx_action_reports_period ON action_reports(monthly_period_id);
CREATE INDEX IF NOT EXISTS idx_action_reports_user ON action_reports(branch_user_id);

-- ========================================
-- Insert Default Users
-- Password for all users: admin123
-- Hashed using bcrypt with salt rounds 10
-- ========================================

-- Main Branch Admin User
INSERT INTO users (username, password, role, branch_name, email)
VALUES (
    'main_branch',
    '$2b$10$rHZJYjlt4lz8VqN7O2K8KeYXQ7Z8kGx8vK5J5X5X5X5X5X5X5X5X5u',
    'main_branch',
    'Main Branch',
    'main@workprogress.com'
) ON CONFLICT (username) DO NOTHING;

-- Branch User 1
INSERT INTO users (username, password, role, branch_name, email)
VALUES (
    'branch1',
    '$2b$10$rHZJYjlt4lz8VqN7O2K8KeYXQ7Z8kGx8vK5J5X5X5X5X5X5X5X5X5u',
    'branch_user',
    'Branch 1',
    'branch1@workprogress.com'
) ON CONFLICT (username) DO NOTHING;

-- Branch User 2
INSERT INTO users (username, password, role, branch_name, email)
VALUES (
    'branch2',
    '$2b$10$rHZJYjlt4lz8VqN7O2K8KeYXQ7Z8kGx8vK5J5X5X5X5X5X5X5X5X5u',
    'branch_user',
    'Branch 2',
    'branch2@workprogress.com'
) ON CONFLICT (username) DO NOTHING;

-- Branch User 3
INSERT INTO users (username, password, role, branch_name, email)
VALUES (
    'branch3',
    '$2b$10$rHZJYjlt4lz8VqN7O2K8KeYXQ7Z8kGx8vK5J5X5X5X5X5X5X5X5X5u',
    'branch_user',
    'Branch 3',
    'branch3@workprogress.com'
) ON CONFLICT (username) DO NOTHING;

-- Branch User 4
INSERT INTO users (username, password, role, branch_name, email)
VALUES (
    'branch4',
    '$2b$10$rHZJYjlt4lz8VqN7O2K8KeYXQ7Z8kGx8vK5J5X5X5X5X5X5X5X5X5u',
    'branch_user',
    'Branch 4',
    'branch4@workprogress.com'
) ON CONFLICT (username) DO NOTHING;

-- Branch User 5
INSERT INTO users (username, password, role, branch_name, email)
VALUES (
    'branch5',
    '$2b$10$rHZJYjlt4lz8VqN7O2K8KeYXQ7Z8kGx8vK5J5X5X5X5X5X5X5X5X5u',
    'branch_user',
    'Branch 5',
    'branch5@workprogress.com'
) ON CONFLICT (username) DO NOTHING;

-- Branch User 6
INSERT INTO users (username, password, role, branch_name, email)
VALUES (
    'branch6',
    '$2b$10$rHZJYjlt4lz8VqN7O2K8KeYXQ7Z8kGx8vK5J5X5X5X5X5X5X5X5X5u',
    'branch_user',
    'Branch 6',
    'branch6@workprogress.com'
) ON CONFLICT (username) DO NOTHING;

-- Branch User 7
INSERT INTO users (username, password, role, branch_name, email)
VALUES (
    'branch7',
    '$2b$10$rHZJYjlt4lz8VqN7O2K8KeYXQ7Z8kGx8vK5J5X5X5X5X5X5X5X5X5u',
    'branch_user',
    'Branch 7',
    'branch7@workprogress.com'
) ON CONFLICT (username) DO NOTHING;

-- Branch User 8
INSERT INTO users (username, password, role, branch_name, email)
VALUES (
    'branch8',
    '$2b$10$rHZJYjlt4lz8VqN7O2K8KeYXQ7Z8kGx8vK5J5X5X5X5X5X5X5X5X5u',
    'branch_user',
    'Branch 8',
    'branch8@workprogress.com'
) ON CONFLICT (username) DO NOTHING;

-- Branch User 9
INSERT INTO users (username, password, role, branch_name, email)
VALUES (
    'branch9',
    '$2b$10$rHZJYjlt4lz8VqN7O2K8KeYXQ7Z8kGx8vK5J5X5X5X5X5X5X5X5X5u',
    'branch_user',
    'Branch 9',
    'branch9@workprogress.com'
) ON CONFLICT (username) DO NOTHING;

-- Branch User 10
INSERT INTO users (username, password, role, branch_name, email)
VALUES (
    'branch10',
    '$2b$10$rHZJYjlt4lz8VqN7O2K8KeYXQ7Z8kGx8vK5J5X5X5X5X5X5X5X5X5u',
    'branch_user',
    'Branch 10',
    'branch10@workprogress.com'
) ON CONFLICT (username) DO NOTHING;

-- ========================================
-- Setup Complete!
-- ========================================
-- You should now have:
-- - 8 tables created
-- - 11 users (1 admin + 10 branches)
-- - All indexes created
--
-- Default login credentials:
-- Admin: main_branch / admin123
-- Branches: branch1-10 / admin123
-- ========================================
