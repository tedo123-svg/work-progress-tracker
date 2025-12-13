# ✅ 92HOST Deployment Checklist

## Files Ready for Upload ✅

Your application is now ready to deploy! Here's what you have:

### 1. Frontend Files (Built Successfully) ✅
- Location: `work-progress-tracker/frontend/dist/`
- Files to upload to `public_html`:
  - `index.html`
  - `assets/` folder (contains CSS and JS)
  - All other files in `dist` folder

### 2. Backend Files ✅
- Location: `work-progress-tracker/backend/`
- Upload entire folder contents to `public_html/api/`

### 3. Database Schema ✅
- File: `mysql-schema-92host.sql`
- Ready to import into MySQL database

### 4. Configuration Files ✅
- MySQL database connection: `backend/src/database/mysql-db.js`
- Environment template: `92host-env-template.txt`

---

## Step-by-Step Deployment

### Step 1: Upload Frontend ✅ Ready
1. **In 92HOST File Manager** (where you are now):
   - Delete existing `index.html` in `public_html`
   - Upload ALL files from `frontend/dist/` to `public_html`

### Step 2: Upload Backend
1. **Create API folder**:
   - In File Manager, click "New Folder"
   - Name: `api`
2. **Upload backend files**:
   - Upload entire `backend/` folder contents to `public_html/api/`

### Step 3: Setup Database
1. **In cPanel main page**:
   - Go to "MySQL Databases"
   - Create database: `worktracker_db`
   - Create user: `worktracker_user`
   - Set secure password
   - Add user to database (ALL PRIVILEGES)

2. **Import schema**:
   - Go to "phpMyAdmin"
   - Select your database
   - Import `mysql-schema-92host.sql`

### Step 4: Configure Environment
1. **Create .env file**:
   - In File Manager, go to `public_html/api/`
   - Create new file: `.env`
   - Copy content from `92host-env-template.txt`
   - Update database password and domain

### Step 5: Setup Node.js
1. **In cPanel**:
   - Find "Node.js Apps"
   - Create application:
     ```
     Node.js Version: Latest
     Application Root: api
     Application URL: yourdomain.com/api
     Startup File: server.js
     ```
2. **Install dependencies**:
   - Click "Run NPM Install"

### Step 6: Update Database Connection
1. **Edit server.js**:
   - Change import from `./database/db.js` to `./database/mysql-db.js`

### Step 7: Start Application
1. **Start Node.js app** in cPanel
2. **Test your site**: Visit `https://yourdomain.com`

---

## Login Credentials

After deployment, you can login with:

- **Admin**: `admin` / `password`
- **Main Branch**: `main_branch` / `password`
- **Branch Users**: `branch1`, `branch2`, `branch3` / `password`

---

## File Structure After Deployment

```
public_html/
├── index.html                 (Your React app)
├── assets/                    (CSS, JS, images)
├── api/                       (Your Node.js backend)
│   ├── src/
│   ├── package.json
│   ├── server.js
│   └── .env
└── other files...
```

---

## Need Help?

**Ready to start uploading?** 

1. **Upload frontend first** - Copy all files from `frontend/dist/` to your `public_html`
2. **Then backend** - Create `api` folder and upload backend files
3. **Setup database** - Use the MySQL schema file
4. **Configure Node.js** - Set up the app in cPanel

**Which step would you like help with first?**