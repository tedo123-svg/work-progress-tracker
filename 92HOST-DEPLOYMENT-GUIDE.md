# 🚀 Deploy to 92HOST - Complete Guide

Deploy your Work Progress Tracker to 92HOST Ethiopian hosting with cPanel.

## 📋 What You'll Deploy

- **Frontend**: React application (built files)
- **Backend**: Node.js API server
- **Database**: MySQL/PostgreSQL (depending on plan)

## 🎯 Recommended Plan

Based on your application needs:

### **Managed Plan (Br1,500/year)** - RECOMMENDED
- ✅ cPanel hosting
- ✅ UNLIMITED NVMe Storage
- ✅ UNLIMITED Bandwidth
- ✅ UNLIMITED Email Accounts
- ✅ Daily Backups for 21 days
- ✅ Powered by cPanel
- ✅ Node.js support
- ✅ MySQL database included

**Why this plan?**
- Your app needs Node.js backend support
- Unlimited storage for file uploads
- Daily backups for data safety
- Professional cPanel interface

---

## 🚀 Step-by-Step Deployment

### Step 1: Purchase Hosting & Setup

1. **Order Hosting**
   - Go to 92HOST website
   - Select **Managed Plan (Br1,500/year)**
   - Complete payment
   - Wait for setup email with cPanel credentials

2. **Access cPanel**
   - Login URL: Usually `https://yourdomain.com:2083`
   - Or: `https://server.92host.com:2083`
   - Use credentials from setup email

### Step 2: Prepare Your Application

1. **Build Frontend**
   ```bash
   cd work-progress-tracker/frontend
   npm install
   npm run build
   ```
   This creates a `dist` folder with your website files.

2. **Prepare Backend**
   ```bash
   cd work-progress-tracker/backend
   # Create production package.json
   npm install --production
   ```

### Step 3: Database Setup

1. **Create Database in cPanel**
   - Login to cPanel
   - Go to **"MySQL Databases"**
   - Create database: `worktracker_db`
   - Create user: `worktracker_user`
   - Set password: `your_secure_password`
   - Add user to database with ALL PRIVILEGES

2. **Import Database Schema**
   - Go to **"phpMyAdmin"** in cPanel
   - Select your database
   - Click **"Import"**
   - Upload your database schema file

### Step 4: Upload Files

#### Upload Frontend (Website Files)

1. **Access File Manager**
   - In cPanel, click **"File Manager"**
   - Navigate to `public_html` folder
   - Delete default files (index.html, etc.)

2. **Upload Frontend Files**
   - Upload all files from `frontend/dist` folder
   - Extract if uploaded as ZIP
   - Your main files should be directly in `public_html`:
     ```
     public_html/
     ├── index.html
     ├── assets/
     ├── favicon.ico
     └── other files...
     ```

#### Upload Backend (API Files)

1. **Create API Directory**
   - In File Manager, create folder: `public_html/api`
   - Upload your entire `backend` folder contents to `/api`
   - Structure should be:
     ```
     public_html/api/
     ├── src/
     ├── package.json
     ├── server.js
     └── other backend files...
     ```

### Step 5: Configure Node.js

1. **Setup Node.js App**
   - In cPanel, find **"Node.js Apps"** or **"Node.js Selector"**
   - Click **"Create Application"**
   - Configure:
     ```
     Node.js Version: Latest (18.x or 20.x)
     Application Mode: Production
     Application Root: api
     Application URL: yourdomain.com/api
     Application Startup File: server.js
     ```

2. **Install Dependencies**
   - In Node.js Apps, click **"Run NPM Install"**
   - Or use Terminal in cPanel:
     ```bash
     cd public_html/api
     npm install
     ```

### Step 6: Environment Configuration

1. **Create .env File**
   - In File Manager, go to `public_html/api`
   - Create new file: `.env`
   - Add your configuration:
     ```env
     NODE_ENV=production
     PORT=3000
     
     # Database Configuration
     DB_HOST=localhost
     DB_PORT=3306
     DB_NAME=worktracker_db
     DB_USER=worktracker_user
     DB_PASSWORD=your_secure_password
     
     # JWT Configuration
     JWT_SECRET=your_super_secret_jwt_key_change_this
     JWT_EXPIRES_IN=7d
     
     # CORS Configuration
     FRONTEND_URL=https://yourdomain.com
     ```

2. **Update Database Connection**
   - Edit `backend/src/database/db.js`
   - Update for MySQL if needed:
     ```javascript
     import mysql from 'mysql2/promise';
     
     const pool = mysql.createPool({
       host: process.env.DB_HOST,
       port: process.env.DB_PORT,
       user: process.env.DB_USER,
       password: process.env.DB_PASSWORD,
       database: process.env.DB_NAME,
       waitForConnections: true,
       connectionLimit: 10,
       queueLimit: 0
     });
     
     export default pool;
     ```

### Step 7: Update Frontend API URL

1. **Update API Configuration**
   - Edit your built files or rebuild with correct API URL
   - In `frontend/src/services/api.js`, ensure:
     ```javascript
     const API_BASE_URL = 'https://yourdomain.com/api';
     ```

2. **Rebuild and Re-upload Frontend**
   ```bash
   cd frontend
   npm run build
   # Upload new dist files to public_html
   ```

### Step 8: Start Your Application

1. **Start Node.js App**
   - In cPanel Node.js Apps
   - Click **"Start"** next to your application
   - Check status shows "Running"

2. **Test Your Application**
   - Visit: `https://yourdomain.com`
   - Should show your login page
   - Test login with: `admin` / `password`

---

## 🔧 Database Migration (PostgreSQL to MySQL)

If you need to convert from PostgreSQL to MySQL:

### Convert Schema
```sql
-- PostgreSQL to MySQL conversions needed:

-- 1. SERIAL → AUTO_INCREMENT
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role ENUM('admin', 'main_branch', 'branch_user') NOT NULL,
  branch_name VARCHAR(255),
  email VARCHAR(255) UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. TEXT → TEXT (same)
-- 3. BOOLEAN → TINYINT(1)
-- 4. TIMESTAMP → TIMESTAMP or DATETIME
```

### Update Backend Code
```javascript
// Update queries for MySQL syntax
// PostgreSQL: $1, $2, $3
// MySQL: ?, ?, ?

// Before (PostgreSQL)
const result = await pool.query(
  'SELECT * FROM users WHERE username = $1',
  [username]
);

// After (MySQL)
const [result] = await pool.execute(
  'SELECT * FROM users WHERE username = ?',
  [username]
);
```

---

## 🔐 Security Configuration

### 1. Secure File Permissions
```bash
# In cPanel Terminal or File Manager
chmod 644 public_html/index.html
chmod 755 public_html/api
chmod 600 public_html/api/.env
```

### 2. Setup SSL Certificate
- In cPanel, go to **"SSL/TLS"**
- Enable **"Let's Encrypt SSL"** (free)
- Force HTTPS redirects

### 3. Configure .htaccess
Create `public_html/.htaccess`:
```apache
# Force HTTPS
RewriteEngine On
RewriteCond %{HTTPS} off
RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]

# Handle React Router
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteCond %{REQUEST_URI} !^/api
RewriteRule . /index.html [L]

# API Proxy (if needed)
RewriteRule ^api/(.*)$ /api/server.js [L]
```

---

## 📊 Monitoring & Maintenance

### 1. Check Application Status
- **cPanel → Node.js Apps**: Monitor app status
- **cPanel → Error Logs**: Check for errors
- **cPanel → Metrics**: Monitor resource usage

### 2. Database Backups
- **cPanel → Backup**: Create full backups
- **Automatic**: Daily backups included in Managed plan
- **Manual**: Export database via phpMyAdmin

### 3. Update Application
```bash
# To update your app:
1. Make changes locally
2. Build frontend: npm run build
3. Upload new files via File Manager
4. Restart Node.js app in cPanel
```

---

## 🚨 Troubleshooting

### Common Issues:

**1. Node.js App Won't Start**
- Check Node.js version compatibility
- Verify package.json and dependencies
- Check error logs in cPanel

**2. Database Connection Failed**
- Verify database credentials in .env
- Check database user permissions
- Ensure database exists

**3. Frontend Shows Blank Page**
- Check browser console for errors
- Verify API URL is correct
- Check .htaccess configuration

**4. API Requests Fail**
- Check CORS configuration
- Verify Node.js app is running
- Check API endpoint URLs

### Get Help:
- **92HOST Support**: Contact via their support system
- **cPanel Documentation**: Built-in help system
- **Node.js Logs**: Check in cPanel error logs

---

## 💰 Cost Breakdown

**Managed Plan (Br1,500/year)**
- Hosting: Br1,500/year (~$27/year)
- Domain: ~Br500/year (if needed)
- **Total**: ~Br2,000/year (~$36/year)

**Included:**
- ✅ Unlimited storage & bandwidth
- ✅ Daily backups
- ✅ SSL certificate
- ✅ cPanel access
- ✅ Email accounts
- ✅ Node.js support
- ✅ MySQL database

---

## ✅ Deployment Checklist

- [ ] Purchase 92HOST Managed plan
- [ ] Receive cPanel credentials
- [ ] Create MySQL database
- [ ] Build frontend (`npm run build`)
- [ ] Upload frontend files to `public_html`
- [ ] Upload backend files to `public_html/api`
- [ ] Configure Node.js app in cPanel
- [ ] Create .env file with database credentials
- [ ] Install backend dependencies
- [ ] Start Node.js application
- [ ] Test login and functionality
- [ ] Setup SSL certificate
- [ ] Configure .htaccess for routing

---

## 🎉 Final Result

After deployment, you'll have:
- **Website**: `https://yourdomain.com`
- **API**: `https://yourdomain.com/api`
- **Admin Access**: Login with `admin`/`password`
- **Full Features**: User management, reports, analytics
- **Local Hosting**: Fast access from Ethiopia
- **Professional Setup**: SSL, backups, monitoring

**Your Work Progress Tracker will be fully online and ready for your team to use!**