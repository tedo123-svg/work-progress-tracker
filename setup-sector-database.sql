-- Setup Sector System Database Changes
-- Run this SQL script in your PostgreSQL database

-- Step 1: Update user role constraints to include sector roles
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check 
CHECK (role IN ('admin', 'main_branch', 'branch_user', 'organization_sector', 'information_sector', 'operation_sector', 'peace_value_sector'));

-- Step 2: Add sector column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS sector VARCHAR(50);

-- Step 3: Add sector column to annual_plans table  
ALTER TABLE annual_plans ADD COLUMN IF NOT EXISTS sector VARCHAR(50);

-- Step 4: Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_sector ON users(sector);
CREATE INDEX IF NOT EXISTS idx_annual_plans_sector ON annual_plans(sector);

-- Step 5: Insert the 4 sector admin users
-- Password hash for 'sector123' (bcrypt with salt rounds 10)
INSERT INTO users (username, password, role, branch_name, email, sector) VALUES
('organization_admin', '$2b$10$lmas9baRwAaHv9ayZIQ0POHDrUDPwU6qwCi1OYByf9F4ZepzADzeG', 'organization_sector', 'Organization Sector', 'organization@example.com', 'organization'),
('information_admin', '$2b$10$lmas9baRwAaHv9ayZIQ0POHDrUDPwU6qwCi1OYByf9F4ZepzADzeG', 'information_sector', 'Information Sector', 'information@example.com', 'information'),
('operation_admin', '$2b$10$lmas9baRwAaHv9ayZIQ0POHDrUDPwU6qwCi1OYByf9F4ZepzADzeG', 'operation_sector', 'Operation Sector', 'operation@example.com', 'operation'),
('peace_value_admin', '$2b$10$lmas9baRwAaHv9ayZIQ0POHDrUDPwU6qwCi1OYByf9F4ZepzADzeG', 'peace_value_sector', 'Peace and Value Sector', 'peacevalue@example.com', 'peace_value')
ON CONFLICT (username) DO UPDATE SET
  role = EXCLUDED.role,
  branch_name = EXCLUDED.branch_name,
  email = EXCLUDED.email,
  sector = EXCLUDED.sector;

-- Step 6: Update existing main_branch user to have organization sector
UPDATE users SET sector = 'organization' 
WHERE role = 'main_branch' AND sector IS NULL;

-- Step 7: Verify the setup
SELECT username, role, sector, branch_name FROM users WHERE role LIKE '%sector%' OR role = 'main_branch';

-- Expected output should show:
-- organization_admin | organization_sector | organization | Organization Sector
-- information_admin  | information_sector  | information  | Information Sector  
-- operation_admin    | operation_sector    | operation    | Operation Sector
-- peace_value_admin  | peace_value_sector  | peace_value  | Peace and Value Sector