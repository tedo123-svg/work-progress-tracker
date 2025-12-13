-- Update branch user emails for testing
-- You can run this in Supabase SQL Editor to set real email addresses

-- Option 1: Set all branch users to your test email for development
UPDATE users SET email = 'stedo0485@gmail.com' WHERE role = 'branch_user';

-- Option 2: Set specific emails for each branch (uncomment and modify as needed)
/*
UPDATE users SET email = 'branch1@company.com' WHERE username = 'branch1';
UPDATE users SET email = 'branch2@company.com' WHERE username = 'branch2';
UPDATE users SET email = 'branch3@company.com' WHERE username = 'branch3';
UPDATE users SET email = 'john.doe@company.com' WHERE username = 'branch4';
UPDATE users SET email = 'jane.smith@company.com' WHERE username = 'branch5';
-- Add more as needed...
*/

-- Update admin email
UPDATE users SET email = 'stedo0485@gmail.com' WHERE role = 'admin';

-- Verify the updates
SELECT username, email, role, branch_name FROM users ORDER BY role, username;