# 🚀 Complete Back4App Deployment Guide

Step-by-step guide to deploy your Work Progress Tracker backend to Back4App.

---

## Prerequisites

✅ GitHub account with your code pushed
✅ Supabase database set up
✅ Dockerfile in backend folder (already created)

---

## Step 1: Create Back4App Account

1. Go to https://back4app.com
2. Click **"Sign Up"** (top right)
3. Sign up with:
   - **GitHub** (recommended - easiest)
   - Or email
4. Verify your email if required
5. Complete profile setup

---

## Step 2: Create New Container App

1. After login, click **"New App"** (green button)
2. Select **"Container as a Service"**
3. You'll see "How do you want to start?"
4. Click **"Build a Backend"** (left option with database icon)

---

## Step 3: Connect GitHub Repository

1. Click **"Deploy from GitHub"**
2. If first time:
   - Click **"Connect GitHub"**
   - Authorize Back4App to access your repositories
   - Select **"All repositories"** or specific repo
3. Find and select: **`work-progress-tracker`**
4. Click **"Select"** or **"Continue"**

---

## Step 4: Configure Repository Settings

### Repository Configuration:
- **Repository**: `tedo123-svg/work-progress-tracker`
- **Branch**: `main`
- **Root Directory**: `backend` ⚠️ IMPORTANT!

### How to set Root Directory:
1. Look for **"Root Directory"** or **"Project Path"** field
2. Enter: `backend`
3. This tells Back4App to deploy only the backend folder

---

## Step 5: Configure Build Settings

### Port Configuration:
- **Port**: `5000`
- This should match your backend server port

### Autodeploy:
- **Enable Autodeploy**: `Yes`
- This auto-deploys when you push to GitHub

---

## Step 6: Add Environment Variables ⚠️ CRITICAL

Click **"Environment Variables"** section, then click **"+ Add variable"** for each:

### Variable 1:
- **Key**: `PORT`
- **Value**: `5000`

### Variable 2:
- **Key**: `NODE_ENV`
- **Value**: `production`

### Variable 3:
- **Key**: `DB_HOST`
- **Value**: `aws-1-eu-north-1.pooler.supabase.com`

### Variable 4:
- **Key**: `DB_PORT`
- **Value**: `6543`

### Variable 5:
- **Key**: `DB_NAME`
- **Value**: `postgres`

### Variable 6:
- **Key**: `DB_USER`
- **Value**: `postgres.lxzuarfulvoqfmswdkga`

### Variable 7:
- **Key**: `DB_PASSWORD`
- **Value**: `Word@1212tedo`

### Variable 8:
- **Key**: `DB_SSL`
- **Value**: `true`

### Variable 9:
- **Key**: `JWT_SECRET`
- **Value**: `work_progress_tracker_secret_key_2024_change_this`

### Variable 10:
- **Key**: `JWT_EXPIRES_IN`
- **Value**: `7d`

---

## Step 7: Configure Health Check (Optional)

1. Expand **"Health"** section
2. **Health Check Path**: `/api/health`
3. This helps Back4App monitor if your app is running

---

## Step 8: Review Configuration

Double-check everything:
- ✅ Repository: `work-progress-tracker`
- ✅ Branch: `main`
- ✅ Root Directory: `backend`
- ✅ Port: `5000`
- ✅ Autodeploy: `Yes`
- ✅ Environment Variables: All 10 added
- ✅ Health Check: `/api/health`

---

## Step 9: Deploy!

1. Click the green **"Deploy"** button at the bottom
2. Wait for deployment (2-5 minutes)
3. You'll see build logs in real-time

### What happens during deployment:
```
1. Cloning repository...
2. Building Docker image...
3. Installing dependencies (npm install)...
4. Starting application (npm start)...
5. Health check...
6. Deployment complete! ✅
```

---

## Step 10: Get Your Backend URL

After successful deployment:

1. Go to your app dashboard
2. Look for **"URL"** or **"Domain"**
3. Your backend URL will be something like:
   ```
   https://work-progress-tracker-xxxxx.back4app.io
   ```
4. **Copy this URL** - you'll need it for frontend!

---

## Step 11: Test Your Backend

### Test 1: Health Check
Open in browser:
```
https://your-app.back4app.io/api/health
```

Should return:
```json
{
  "status": "ok",
  "message": "Work Progress Tracker API is running"
}
```

### Test 2: Database Connection
Check the logs in Back4App dashboard:
- Look for: `✅ Database connected`
- Look for: `📍 Connected to: aws-1-eu-north-1.pooler.supabase.com`

---

## Step 12: Monitor Your App

### View Logs:
1. Go to your app dashboard
2. Click **"Logs"** tab
3. See real-time application logs

### View Metrics:
1. Click **"Metrics"** tab
2. See CPU, Memory, Network usage

### Restart App:
1. Click **"Settings"**
2. Click **"Restart"** if needed

---

## 🎉 Backend Deployment Complete!

Your backend is now live at:
```
https://your-app.back4app.io
```

---

## Next Steps: Deploy Frontend

Now that backend is deployed, deploy frontend to Vercel:

### Quick Frontend Deployment:

1. Go to https://vercel.com
2. Sign up with GitHub
3. Click **"New Project"**
4. Import `work-progress-tracker`
5. Configure:
   - **Root Directory**: `frontend`
   - **Framework**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
6. Add Environment Variable:
   - **Key**: `VITE_API_URL`
   - **Value**: `https://your-app.back4app.io/api`
7. Click **"Deploy"**

Your frontend will be live at:
```
https://work-progress-tracker.vercel.app
```

---

## 🔧 Troubleshooting

### Deployment Failed?

**Error: "Dockerfile not found"**
- Solution: Make sure `backend/Dockerfile` exists
- Check Root Directory is set to `backend`

**Error: "Build failed"**
- Check logs for specific error
- Verify `package.json` has correct scripts
- Ensure all dependencies are in `package.json`

**Error: "Application not responding"**
- Check environment variables are correct
- Verify Supabase credentials
- Check logs for database connection errors

**Error: "Port already in use"**
- Make sure PORT environment variable is `5000`
- Check Dockerfile exposes correct port

### Can't Connect to Database?

1. Verify Supabase credentials in environment variables
2. Check `DB_SSL` is set to `true`
3. Verify Supabase project is active
4. Check logs for connection errors

### App Keeps Restarting?

1. Check logs for errors
2. Verify all environment variables are set
3. Test database connection
4. Check health endpoint

---

## 📊 Free Tier Limits

Back4App Free Tier includes:
- ✅ 1 Container App
- ✅ 256 MB RAM
- ✅ 0.25 vCPU
- ✅ 1 GB Storage
- ✅ 1 GB Bandwidth/month

This is enough for testing and small production use!

---

## 🔐 Security Tips

1. **Change JWT Secret**: Use a strong random string
2. **Change Database Password**: Update in Supabase and env vars
3. **Enable HTTPS**: Back4App provides this automatically
4. **Monitor Logs**: Check regularly for suspicious activity
5. **Update Dependencies**: Keep packages up to date

---

## 📞 Support

- **Back4App Docs**: https://docs.back4app.com
- **Back4App Support**: support@back4app.com
- **Community Forum**: https://community.back4app.com

---

## ✅ Deployment Checklist

- [ ] Back4App account created
- [ ] GitHub repository connected
- [ ] Root directory set to `backend`
- [ ] All 10 environment variables added
- [ ] Port set to `5000`
- [ ] Autodeploy enabled
- [ ] Health check configured
- [ ] Deployment successful
- [ ] Backend URL obtained
- [ ] Health endpoint tested
- [ ] Database connection verified
- [ ] Logs checked for errors
- [ ] Frontend deployment started

---

**Congratulations! Your backend is now live on Back4App! 🎉**

Next: Deploy frontend to Vercel using the backend URL you just got!
