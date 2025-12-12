-- Add admin role to the users table
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('admin', 'main_branch', 'branch_user'));

-- Create admin user
INSERT INTO users (username, password, role, branch_name, email) 
VALUES ('admin', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin', 'Admin Office', 'admin@worktracker.com')
ON CONFLICT (username) DO NOTHING;

-- Note: The password hash above is for 'password' - change this in production!