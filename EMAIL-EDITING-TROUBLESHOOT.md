# 🔧 Email Editing Troubleshooting Guide

## ✅ Issue Fixed: ContactManager Integration

I've integrated the ContactManager component into your AdminDashboard. Now you should be able to edit user emails!

## 🎯 How to Edit User Emails

### Method 1: Contact Management Section (New)
1. **Login as admin** to your dashboard
2. **Scroll down** to the "Contact Management" section (below User Management table)
3. **Click "Edit"** next to any user's contact information
4. **Update email and/or phone** number
5. **Click "Save"** ✅ or "Cancel" ❌

### Method 2: Database Direct Update (Quick Fix)
If you still can't edit through the interface, use this SQL:

```sql
-- Update specific user emails
UPDATE users SET email = 'stedo0485+admin@gmail.com' WHERE username = 'admin';
UPDATE users SET email = 'stedo0485+branch1@gmail.com' WHERE username = 'branch1';
UPDATE users SET email = 'stedo0485+branch2@gmail.com' WHERE username = 'branch2';

-- Verify the updates
SELECT username, email, phone_number, role FROM users ORDER BY username;
```

## 🚨 Common Issues & Solutions

### Issue 1: "ContactManager not visible"
**Solution**: Clear browser cache and refresh
```bash
Ctrl + F5 (Windows) or Cmd + Shift + R (Mac)
```

### Issue 2: "Duplicate email error"
**Problem**: Trying to use an email that already exists
**Solution**: Use unique emails with + addressing:
```sql
-- Use Gmail + addressing for unique emails
UPDATE users SET email = 'stedo0485+user1@gmail.com' WHERE username = 'branch1';
UPDATE users SET email = 'stedo0485+user2@gmail.com' WHERE username = 'branch2';
```

### Issue 3: "API errors when saving"
**Check**: 
1. **Backend is running** on Render
2. **Environment variables** are set
3. **Database schema** includes phone_number field

**Fix database schema**:
```sql
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_number VARCHAR(20);
```

### Issue 4: "Edit button not working"
**Solution**: Check browser console for errors
1. **Press F12** to open developer tools
2. **Click Console** tab
3. **Try editing** an email
4. **Look for error messages**

## 🎯 What You Should See Now

**In your Admin Dashboard:**

1. **User Management Table** (existing)
   - Shows username, email, role, actions
   - Create new user button

2. **Contact Management Section** (new)
   - Shows all users with role icons
   - Email and phone for each user
   - Edit button for each user
   - Inline editing form

3. **Recent Activity** (existing)
   - System activity logs

## 📧 Testing Email Editing

**Step-by-step test:**

1. **Go to admin dashboard**
2. **Find Contact Management section**
3. **Click "Edit" on any user**
4. **Change email** to something like `test@example.com`
5. **Click "Save"**
6. **Should see success message**
7. **Email should update** in the display

## 🔧 If Still Not Working

**Quick diagnostic:**

1. **Check if ContactManager is loaded**:
   - Look for "Contact Management" heading in dashboard
   - Should see user list with edit buttons

2. **Check browser network tab**:
   - F12 → Network tab
   - Try editing email
   - Look for API calls to `/admin/users/:id/contact`

3. **Check backend logs**:
   - Go to Render dashboard
   - Check backend service logs
   - Look for email update requests

## 🚀 Alternative: Use Existing User Update

**If ContactManager still has issues, you can use the existing user update:**

1. **In User Management table**
2. **Click "Edit" on any user** (if available)
3. **Update email in the form**
4. **Save changes**

## 📱 Expected Behavior

**When editing works correctly:**

1. **Click Edit** → Form appears with current email/phone
2. **Change values** → Real-time validation
3. **Click Save** → API call to backend
4. **Success** → Form closes, display updates
5. **Error** → Clear error message shown

**Your email editing should now work! The ContactManager component is integrated and ready to use.** 🎉

---

**Quick Test:**
1. **Login as admin**
2. **Scroll to Contact Management**
3. **Click Edit on any user**
4. **Change email and save**
5. **Should work perfectly!** ✅