-- Update user emails for testing (unique emails required due to database constraint)
-- You can run this in Supabase SQL Editor

-- Option 1: Use unique test emails (Gmail supports + addressing)
UPDATE users SET email = 'stedo0485+admin@gmail.com' WHERE username = 'admin';
UPDATE users SET email = 'stedo0485+main@gmail.com' WHERE username = 'main_branch';
UPDATE users SET email = 'stedo0485+branch1@gmail.com' WHERE username = 'branch1';
UPDATE users SET email = 'stedo0485+branch2@gmail.com' WHERE username = 'branch2';
UPDATE users SET email = 'stedo0485+branch3@gmail.com' WHERE username = 'branch3';
UPDATE users SET email = 'stedo0485+branch4@gmail.com' WHERE username = 'branch4';
UPDATE users SET email = 'stedo0485+branch5@gmail.com' WHERE username = 'branch5';
UPDATE users SET email = 'stedo0485+branch6@gmail.com' WHERE username = 'branch6';
UPDATE users SET email = 'stedo0485+branch7@gmail.com' WHERE username = 'branch7';
UPDATE users SET email = 'stedo0485+branch8@gmail.com' WHERE username = 'branch8';
UPDATE users SET email = 'stedo0485+branch9@gmail.com' WHERE username = 'branch9';
UPDATE users SET email = 'stedo0485+branch10@gmail.com' WHERE username = 'branch10';

-- Option 2: Use your main email for all (if you want to remove unique constraint temporarily)
/*
-- First remove the unique constraint (CAREFUL - this affects security)
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_email_key;

-- Then update all to same email
UPDATE users SET email = 'stedo0485@gmail.com';

-- Optionally re-add constraint later for production
-- ALTER TABLE users ADD CONSTRAINT users_email_key UNIQUE (email);
*/

-- Verify the updates
SELECT username, email, role, branch_name FROM users ORDER BY username;