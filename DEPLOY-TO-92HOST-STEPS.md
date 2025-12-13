# 🚀 Deploy to 92HOST - Quick Steps

You're already in the cPanel File Manager! Here's exactly what to do:

## Step 1: Fix Build Error First

There's a syntax error in your frontend. Let's fix it:

1. **Fix the JSX Error**
   - The `SubmitActionReport.jsx` file has unclosed tags
   - We need to fix this before building

## Step 2: Build Your Frontend

After fixing the error, run these commands on your local computer:

```bash
# Navigate to frontend folder
cd work-progress-tracker/frontend

# Install dependencies (if not done)
npm install

# Build for production
npm run build
```

This creates a `dist` folder with your website files.

## Step 3: Upload Frontend Files

In your 92HOST File Manager (where you are now):

1. **Clear public_html**
   - Delete the existing `index.html` file
   - Delete the `cgi-bin` folder (if not needed)

2. **Upload Frontend Files**
   - Click "Upload" button in File Manager
   - Upload all files from your `frontend/dist` folder
   - OR create a ZIP of the `dist` folder contents and upload it
   - Extract the ZIP in `public_html`

   **Your public_html should look like:**
   ```
   public_html/
   ├── index.html
   ├── assets/
   │   ├── index-[hash].js
   │   ├── index-[hash].css
   │   └── other files...
   ├── favicon.ico
   └── other static files...
   ```

## Step 4: Create API Directory

1. **Create API Folder**
   - In File Manager, click "New Folder"
   - Name it: `api`
   - This will be: `public_html/api/`

2. **Upload Backend Files**
   - Upload your entire `backend` folder contents to `public_html/api/`
   - Your structure should be:
   ```
   public_html/api/
   ├── src/
   ├── package.json
   ├── server.js
   └── other backend files...
   ```

## Step 5: Configure Database

1. **Create MySQL Database**
   - Go back to cPanel main page
   - Click "MySQL Databases"
   - Create database: `worktracker_db`
   - Create user: `worktracker_user`
   - Set strong password
   - Add user to database with ALL PRIVILEGES

2. **Convert Database Schema**
   - Your current database is PostgreSQL
   - 92HOST uses MySQL
   - You'll need to convert the schema

## Step 6: Setup Node.js

1. **Configure Node.js App**
   - In cPanel, find "Node.js Apps" or "Node.js Selector"
   - Create new application:
     ```
     Node.js Version: Latest (18.x or 20.x)
     Application Root: api
     Application URL: yourdomain.com/api
     Startup File: server.js
     ```

2. **Install Dependencies**
   - In Node.js Apps, click "Run NPM Install"

## Step 7: Environment Configuration

Create `.env` file in `public_html/api/`:

```env
NODE_ENV=production
PORT=3000

# Database (MySQL)
DB_HOST=localhost
DB_PORT=3306
DB_NAME=worktracker_db
DB_USER=worktracker_user
DB_PASSWORD=your_database_password

# JWT
JWT_SECRET=your_super_secret_jwt_key_change_this
JWT_EXPIRES_IN=7d

# CORS
FRONTEND_URL=https://yourdomain.com
```

## Step 8: Update API URL

Update your frontend to use the correct API URL:
- Edit `frontend/src/services/api.js`
- Change API URL to: `https://yourdomain.com/api`
- Rebuild and re-upload frontend

## Step 9: Start Application

1. **Start Node.js App**
   - In cPanel Node.js Apps
   - Click "Start" button
   - Check status shows "Running"

2. **Test Your Site**
   - Visit: `https://yourdomain.com`
   - Should show your login page
   - Test with: `admin` / `password`

---

## 🔧 Quick Fix for Build Error

Let's fix the JSX error first. The issue is in `SubmitActionReport.jsx`. 

**Would you like me to:**
1. **Fix the JSX error** so you can build successfully?
2. **Create the MySQL database schema** for 92HOST?
3. **Help with the file upload process** step by step?

**Which step would you like to start with?**