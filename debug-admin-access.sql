-- Debug Admin Access Issues
-- Run this to check if admin user exists and troubleshoot login issues

-- 1. Check if admin user exists
SELECT 'Admin User Check' as check_type, 
       id, username, role, branch_name, email, created_at 
FROM users 
WHERE role = 'admin';

-- 2. Check all users and their roles
SELECT 'All Users' as check_type,
       id, username, role, branch_name, email 
FROM users 
ORDER BY role, username;

-- 3. Check role constraint
SELECT 'Role Constraint Check' as check_type,
       conname as constraint_name,
       consrc as constraint_definition
FROM pg_constraint 
WHERE conname = 'users_role_check';

-- 4. Check if admin user can be created (this will fail if user exists)
-- Uncomment the next line if you need to create admin user
-- INSERT INTO users (username, password, role, branch_name, email) 
-- VALUES ('admin', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin', 'System Administration', 'admin@worktracker.com');

-- 5. Show table structure
SELECT 'Table Structure' as check_type,
       column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'users' 
ORDER BY ordinal_position;