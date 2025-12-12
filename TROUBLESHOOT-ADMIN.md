# Troubleshooting Admin Access Issues

## Quick Diagnostic Steps

### Step 1: Check if Admin User Exists
Run this SQL query in your database:
```sql
SELECT id, username, role, branch_name, email FROM users WHERE role = 'admin';
```

If no admin user exists, run:
```sql
-- Create admin user
INSERT INTO users (username, password, role, branch_name, email) 
VALUES ('admin', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin', 'System Administration', 'admin@worktracker.com')
ON CONFLICT (username) DO NOTHING;
```

### Step 2: Check Backend Server
1. Make sure backend is running: `cd backend && npm start`
2. Check if admin routes are loaded: Look for "Server running on port 5000" message
3. Test health endpoint: `http://localhost:5000/api/health`

### Step 3: Test Admin Login
Run the test script:
```bash
cd work-progress-tracker
node test-admin-login.js
```

### Step 4: Check Browser Console
1. Open browser developer tools (F12)
2. Go to Console tab
3. Try logging in with admin credentials
4. Look for any JavaScript errors

### Step 5: Check Network Tab
1. Open browser developer tools (F12)
2. Go to Network tab
3. Try logging in with admin credentials
4. Check if login request returns 200 status
5. Check if user object has role: 'admin'

## Common Issues and Solutions

### Issue 1: "Invalid credentials" when logging in
**Solution**: Admin user doesn't exist in database
```sql
-- Run this to create admin user
INSERT INTO users (username, password, role, branch_name, email) 
VALUES ('admin', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin', 'System Administration', 'admin@worktracker.com');
```

### Issue 2: Login works but redirected to wrong dashboard
**Problem**: User role is not 'admin' in database
**Solution**: Check user role in database:
```sql
SELECT username, role FROM users WHERE username = 'admin';
-- Should show role = 'admin'
```

### Issue 3: "Access denied" when accessing admin routes
**Problem**: JWT token doesn't include admin role
**Solution**: 
1. Clear browser localStorage
2. Login again
3. Check token payload in browser dev tools

### Issue 4: Admin dashboard shows blank/loading
**Problem**: Frontend can't reach backend admin endpoints
**Solution**:
1. Check backend server is running
2. Check CORS settings allow frontend domain
3. Check admin routes are properly mounted

### Issue 5: Database connection errors
**Problem**: Backend can't connect to database
**Solution**:
1. Check .env file has correct database credentials
2. Make sure database server is running
3. Test database connection manually

## Manual Database Setup

If automated setup failed, run these commands manually:

```sql
-- 1. Update role constraint
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('admin', 'main_branch', 'branch_user'));

-- 2. Create admin user
INSERT INTO users (username, password, role, branch_name, email) 
VALUES ('admin', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin', 'System Administration', 'admin@worktracker.com')
ON CONFLICT (username) DO UPDATE SET 
  password = EXCLUDED.password,
  role = EXCLUDED.role,
  branch_name = EXCLUDED.branch_name,
  email = EXCLUDED.email;

-- 3. Verify admin user
SELECT id, username, role, branch_name, email FROM users WHERE role = 'admin';
```

## Test Login Credentials

**Default Admin Credentials:**
- Username: `admin`
- Password: `admin123`
- Email: `admin@worktracker.com`

## Environment Variables Check

Make sure your `.env` file in the backend folder has:
```
JWT_SECRET=your-secret-key-here
JWT_EXPIRES_IN=24h
DATABASE_URL=your-database-connection-string
```

## Port Configuration

**Default Ports:**
- Backend: http://localhost:5000
- Frontend: http://localhost:5173

Make sure these ports are not blocked by firewall.

## Quick Fix Commands

```bash
# 1. Restart backend
cd backend
npm start

# 2. Restart frontend  
cd frontend
npm run dev

# 3. Clear browser cache
# Press Ctrl+Shift+R in browser

# 4. Test API directly
curl http://localhost:5000/api/health
```

## Still Having Issues?

1. Run the diagnostic SQL: `debug-admin-access.sql`
2. Run the test script: `node test-admin-login.js`
3. Check browser console for JavaScript errors
4. Check backend server logs for error messages
5. Verify database connection and admin user exists

## Contact Information

If you're still having trouble:
1. Share the output of `debug-admin-access.sql`
2. Share any error messages from browser console
3. Share backend server startup logs
4. Confirm which step in this guide failed