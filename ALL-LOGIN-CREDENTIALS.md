# 🔐 All Login Credentials - Work Progress Tracker

## 🌐 Application URLs

### Live Production (Vercel)
- **Frontend**: https://work-progress-tracker-rho.vercel.app
- **Backend**: https://work-progress-tracker.onrender.com

### Local Development
- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:5000

---

## 👨‍💼 MAIN BRANCH ADMIN

### Primary Admin Account
```
Username: main_branch
Password: [Contact Administrator]
Role: Main Branch Administrator
```

**Admin Capabilities:**
- ✅ Create and manage annual plans
- ✅ Create actions for action-based reporting
- ✅ View all reports from all branches
- ✅ Access branch performance comparison
- ✅ Monitor quarterly & annual progress
- ✅ Export reports (PDF, Excel, Word)
- ✅ View action reports from all branches
- ✅ Access analytics dashboard

---

## 👥 BRANCH USERS (10 Branches)

### Branch 1
```
Username: branch1
Role: Branch User
Branch Name: Branch 1
```

### Branch 2
```
Username: branch2
Role: Branch User
Branch Name: Branch 2
```

### Branch 3
```
Username: branch3
Role: Branch User
Branch Name: Branch 3
```

### Branch 4
```
Username: branch4
Role: Branch User
Branch Name: Branch 4
```

### Branch 5
```
Username: branch5
Role: Branch User
Branch Name: Branch 5
```

### Branch 6
```
Username: branch6
Role: Branch User
Branch Name: Branch 6
```

### Branch 7
```
Username: branch7
Role: Branch User
Branch Name: Branch 7
```

### Branch 8
```
Username: branch8
Role: Branch User
Branch Name: Branch 8
```

### Branch 9
```
Username: branch9
Role: Branch User
Branch Name: Branch 9
```

### Branch 10
```
Username: branch10
Role: Branch User
Branch Name: Branch 10
```

**Branch User Capabilities:**
- ✅ Submit monthly progress reports
- ✅ Submit action reports (if actions are created)
- ✅ View their own progress and history
- ✅ Track deadlines and submission status
- ✅ Update/edit submitted reports
- ✅ Export their own reports (PDF, Excel, Word)
- ✅ Add attachments to action reports

---

## 🗄️ DATABASE CREDENTIALS

### Supabase Production Database
```
Host: aws-0-eu-north-1.pooler.supabase.com
Port: 6543
Database: postgres
User: postgres.lxzuarfulvoqfmswdkga
Password: [Contact Administrator]
```

### Local Development Database (if using Docker)
```
Host: localhost
Port: 5432
Database: work_progress_db
User: postgres
Password: [Contact Administrator]
```

---

## 🚀 Quick Login Guide

### For Testing Main Branch Features:
1. Go to: https://work-progress-tracker-rho.vercel.app
2. Login with your credentials (contact administrator)
3. Test features:
   - Create annual plans
   - Create actions
   - View action reports tab
   - Export functionality

### For Testing Branch Features:
1. Go to: https://work-progress-tracker-rho.vercel.app
2. Login with your branch credentials (contact administrator)
3. Test features:
   - Submit monthly reports
   - Submit action reports
   - Export own reports

---

## 🔒 Security Notes

- All passwords are hashed using bcrypt
- JWT tokens used for authentication
- Role-based access control implemented
- Secure API endpoints with authentication middleware
- Passwords are not stored in documentation for security

---

## 📱 Access Levels Summary

| Feature | Main Branch | Branch Users |
|---------|-------------|--------------|
| Create Annual Plans | ✅ | ❌ |
| Create Actions | ✅ | ❌ |
| View All Reports | ✅ | Own Only |
| Submit Reports | ❌ | ✅ |
| Export Reports | ✅ All | ✅ Own |
| Branch Comparison | ✅ | ❌ |
| Action Reports Tab | ✅ | ❌ |
| Analytics Dashboard | ✅ | Limited |

---

## 🆘 Troubleshooting Login Issues

### If Login Fails:
1. Check username spelling (case-sensitive)
2. Contact administrator for correct password
3. Clear browser cache and cookies
4. Try different browser
5. Check if backend is running

### If Features Missing:
1. Ensure correct role (main_branch vs branch user)
2. Check if annual plans exist (required for some features)
3. Refresh the page
4. Check browser console for errors

---

## 🎉 System Information

The enhanced action reporting system with professional exports is available for both main branch and branch users.

**Live URL**: https://work-progress-tracker-rho.vercel.app

**For login credentials, contact your system administrator.**