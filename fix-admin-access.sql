-- Fix Admin Access - Run this to ensure admin user is properly set up

-- 1. First, update the role constraint to include admin
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('admin', 'main_branch', 'branch_user'));

-- 2. Create or update admin user (password is 'admin123')
INSERT INTO users (username, password, role, branch_name, email) 
VALUES ('admin', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin', 'System Administration', 'admin@worktracker.com')
ON CONFLICT (username) DO UPDATE SET 
  password = EXCLUDED.password,
  role = EXCLUDED.role,
  branch_name = EXCLUDED.branch_name,
  email = EXCLUDED.email;

-- 3. Verify the admin user was created/updated
SELECT 'Admin user verification:' as message, id, username, role, branch_name, email, created_at 
FROM users 
WHERE username = 'admin';

-- 4. Show all users for reference
SELECT 'All users:' as message, username, role, branch_name 
FROM users 
ORDER BY role, username;