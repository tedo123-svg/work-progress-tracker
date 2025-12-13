-- Update user emails for testing
-- Set admin user to your real email for testing
UPDATE users SET email = 'stedo0485@gmail.com' WHERE username = 'admin';

-- Update main_branch user to your email as well for testing
UPDATE users SET email = 'stedo0485@gmail.com' WHERE username = 'main_branch';

-- For other users, you can set different emails when you have real users
-- For now, they'll use the test email in development mode

-- Verify the updates
SELECT username, email, role, branch_name FROM users ORDER BY username;