-- Add phone number field to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_number VARCHAR(20);

-- Add index for phone number (optional, for performance)
CREATE INDEX IF NOT EXISTS idx_users_phone_number ON users(phone_number);

-- Update existing users with sample phone numbers (optional)
UPDATE users SET phone_number = '+251911000001' WHERE username = 'admin';
UPDATE users SET phone_number = '+251911000002' WHERE username = 'main_branch';
UPDATE users SET phone_number = '+251911000003' WHERE username = 'branch1';
UPDATE users SET phone_number = '+251911000004' WHERE username = 'branch2';
UPDATE users SET phone_number = '+251911000005' WHERE username = 'branch3';

-- Verify the update
SELECT username, email, phone_number, role, branch_name FROM users ORDER BY username;