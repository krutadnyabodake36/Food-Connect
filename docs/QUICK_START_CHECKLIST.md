# 📋 Manual Setup Checklist

Complete these steps in order to ensure proper database connectivity:

## ✅ Prerequisites

- [ ] PostgreSQL installed (download from https://www.postgresql.org/download/windows/)
- [ ] Python 3.8+ installed
- [ ] Node.js 16+ installed
- [ ] Git installed

---

## ✅ Step 1: PostgreSQL Database Setup

### Create Database
Open **Command Prompt** or **PowerShell**:
```bash
psql -U postgres

# Then inside psql shell:
CREATE DATABASE foodconnect;
\q
```

Or use **pgAdmin GUI**:
1. Right-click "Databases" → Create → Database
2. Name: `foodconnect`
3. Click Save

---

## ✅ Step 2: Load Initial Schema

From `e:\foodconnect\Food-Connect`:

```bash
# Run SQL schema
psql -U postgres -d foodconnect -f database/queries/Sql_Queries.sql
```

Verify it worked:
```bash
psql -U postgres -d foodconnect -c "\dt"
```

Should show:
```
 public | users               | table | postgres
 public | hotel               | table | postgres
 public | volunteer           | table | postgres
 public | donations          | table | postgres
 ...and more
```

---

## ✅ Step 3: Configure Environment

Edit `.env` file:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/foodconnect
JWT_SECRET=change-me-in-production-2024
VITE_API_BASE_URL=http://localhost:8000
```

---

## ✅ Step 4: Test Database Connection

```bash
cd e:\foodconnect\Food-Connect
python scripts/verify_db.py
```

✅ Should output:
```
Successfully connected to the database!
Found tables: users, hotel, volunteer, donations, ...
```

---

## ✅ Step 5: Install Backend Dependencies

```bash
cd e:\foodconnect\Food-Connect
pip install -r backend/requirements.txt
```

---

## ✅ Step 6: Install Frontend Dependencies

```bash
npm install
```

---

## ✅ Step 7: Start Backend Server

**Terminal 1:**
```bash
cd e:\foodconnect\Food-Connect
npm run api
```

✅ Wait for: `Application startup complete`

---

## ✅ Step 8: Start Frontend Server

**Terminal 2:**
```bash
cd e:\foodconnect\Food-Connect
npm run dev
```

✅ Should show: `Local: http://localhost:3000/`

---

## ✅ Step 9: Test Application

Open browser: **http://localhost:3000**

You should see the FoodConnect login page.

---

## 🆘 If Something Goes Wrong

### Database Won't Connect
```bash
# Check if PostgreSQL is running
psql -U postgres -c "SELECT version();"

# If not found, start PostgreSQL:
# Windows 10/11: 
# Settings → Services → Find "PostgreSQL" → Right-click → Start
```

### Port 8000 or 3000 Already in Use
```bash
# Find process using port
netstat -ano | findstr :8000

# Kill it (replace PID with the number from above)
taskkill /PID <PID> /F

# Or use different ports:
# Backend: npm run api -- --port 8001
# Frontend: Edit vite.config.ts and change port to 3001
```

### Node Modules Issues
```bash
# Clear and reinstall
rm -r node_modules package-lock.json
npm install
```

---

## 📊 Verify Everything Works

Create a quick test in browser console (F12):

```javascript
// Test backend API
fetch('http://localhost:8000/health')
  .then(r => r.json())
  .then(d => console.log('Backend OK:', d))
  .catch(e => console.error('Backend Error:', e))
```

Should show: `Backend OK: {status: "ok", service: "foodconnect-api"}`

---

## ✅ All Fixes Applied

✅ Database connection pool properly configured
✅ All SQL queries now properly commit
✅ Session storage working
✅ Login/Registration fixed
✅ Data persistence fixed
✅ Connection management fixed

**You're ready to use the app! 🚀**
