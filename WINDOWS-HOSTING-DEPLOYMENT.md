# Windows Hosting Deployment Guide

## Overview
This guide will help you deploy your Work Progress Tracker to Windows hosting with MS SQL Server.

## Phase 1: Database Migration (PostgreSQL → MS SQL Server)

### 1. Update Database Configuration
Create a new database configuration file for MS SQL Server:

```javascript
// backend/src/database/mssql-db.js
import sql from 'mssql';
import dotenv from 'dotenv';

dotenv.config();

const config = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_HOST,
  database: process.env.DB_NAME,
  options: {
    encrypt: true, // Use encryption
    trustServerCertificate: true // For development
  }
};

let pool;

export const connectDB = async () => {
  try {
    pool = await sql.connect(config);
    console.log('✅ Connected to MS SQL Server');
    return pool;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    throw error;
  }
};

export const getPool = () => pool;
export default sql;
```

### 2. Convert Database Schema
Your PostgreSQL schema needs to be converted to MS SQL Server format.

## Phase 2: File Preparation

### 1. Build Frontend
```bash
cd frontend
npm run build
```

### 2. Prepare Backend
```bash
cd backend
npm install --production
```

## Phase 3: Upload to Hosting

### 1. Using File Manager (Recommended)
1. Go to "File Manager" in your hosting control panel
2. Upload your files to the root directory
3. Extract if needed

### 2. Using FTP (Alternative)
- Use FTP client like FileZilla
- Connect with your hosting credentials
- Upload files to wwwroot folder

## Phase 4: Database Setup

### 1. Create Database
1. Go to "Databases" in control panel
2. Create new MS SQL Server database
3. Note down connection details

### 2. Import Schema
1. Use SQL Server Management Studio or web interface
2. Run the converted schema script
3. Import your data

## Phase 5: Configuration

### 1. Environment Variables
Create .env file with your hosting database details:
```
DB_HOST=your-mssql-server
DB_USER=your-username
DB_PASSWORD=your-password
DB_NAME=your-database-name
JWT_SECRET=your-jwt-secret
```

### 2. Update API URLs
Update frontend API URLs to point to your hosting domain.

## Phase 6: Testing

1. Test database connection
2. Test admin login
3. Test user management features
4. Test report functionality

## Troubleshooting

### Common Issues:
1. **Database Connection**: Check connection string format
2. **File Permissions**: Ensure proper file permissions
3. **Node.js Version**: Verify hosting supports your Node.js version
4. **Dependencies**: Install all required packages

## Support
Contact your hosting provider for:
- Database connection details
- Node.js configuration
- SSL certificate setup
- Domain configuration