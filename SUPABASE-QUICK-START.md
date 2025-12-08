# ⚡ Supabase Quick Start (5 Minutes)

## Step 1: Create Supabase Project (2 min)
1. Go to https://supabase.com → Sign up
2. Click "New Project"
3. Set name: `work-progress-tracker`
4. Set database password (SAVE IT!)
5. Choose region → Create

## Step 2: Get Connection Details (1 min)
1. Go to Settings → Database
2. Copy these values:
   - Host: `db.xxxxxxxxxxxxx.supabase.co`
   - Database: `postgres`
   - Port: `5432`
   - User: `postgres`
   - Password: [your password from Step 1]

## Step 3: Configure Backend (1 min)
Create `backend/.env` file:
```env
PORT=5000
NODE_ENV=production

DB_HOST=db.xxxxxxxxxxxxx.supabase.co
DB_PORT=5432
DB_NAME=postgres
DB_USER=postgres
DB_PASSWORD=your_password_here
DB_SSL=true

JWT_SECRET=any_random_string_here
JWT_EXPIRES_IN=7d
```

## Step 4: Run Migration (1 min)
```bash
cd backend
npm install
npm run migrate
```

## Step 5: Start App
```bash
# Terminal 1 - Backend
cd backend
npm start

# Terminal 2 - Frontend
cd frontend
npm install
npm run dev
```

Open http://localhost:3000

Login: `main_branch` / `admin123`

---

## 🎉 Done!
Your app is now connected to Supabase cloud database!

View your data: Supabase Dashboard → Table Editor

---

## 🆘 Problems?

**Migration fails?**
- Check DB_SSL=true
- Verify password is correct
- Check internet connection

**Can't connect?**
- Verify DB_HOST is correct
- Check Supabase project is active

**Need help?** See [SUPABASE-SETUP.md](SUPABASE-SETUP.md) for detailed guide.
