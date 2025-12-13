-- Check current admin user
SELECT id, username, role, branch_name, email, created_at 
FROM users 
WHERE role = 'admin';

-- Update admin password to 'password' (hashed)
UPDATE users 
SET password = '$2a$10$N9qo8uLOickgx2ZMRZoMye.IjPFvU5LIlG/HYduFkneXHIPjVQS..' 
WHERE username = 'admin' AND role = 'admin';

-- Verify the update
SELECT id, username, role, branch_name, email, created_at 
FROM users 
WHERE role = 'admin';