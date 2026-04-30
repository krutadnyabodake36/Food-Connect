# FoodConnect Database Setup Guide

## ✅ Current Status
- **Database**: Connected ✓
- **Tables**: All 9 tables exist ✓
- **Connection Pool**: Configured with 1-20 concurrent connections ✓

---

## 🔧 What You Need to Do Manually

### 1. **PostgreSQL Setup** (if not already done)
```bash
# On Windows: Install PostgreSQL from https://www.postgresql.org/download/windows/
# During installation, set:
# - Username: postgres
# - Password: postgres
# - Port: 5432
```

### 2. **Create Database** (if not already created)
Open **pgAdmin** or use **psql**:

```sql
-- Method 1: Using pgAdmin
-- 1. Right-click Servers → Create → Server
-- 2. Name: FoodConnect
-- 3. Host: localhost, Port: 5432
-- 4. Username: postgres, Password: postgres
-- 5. Right-click Databases → Create → Database
-- 6. Database name: foodconnect

-- Method 2: Using psql (Command Line)
psql -U postgres
CREATE DATABASE foodconnect;
\c foodconnect
```

### 3. **Run Initial Schema** (One-time)
From the project root:

```bash
# Option A: Using psql
psql -U postgres -d foodconnect -f database/queries/Sql_Queries.sql

# Option B: Using pgAdmin
# 1. Open Query Tool in pgAdmin (Tools → Query Tool)
# 2. Open database/queries/Sql_Queries.sql file
# 3. Run all queries (F5 or Execute button)
```

### 4. **Verify Database Setup**
```bash
cd e:\foodconnect\Food-Connect
python scripts/verify_db.py
```

Expected output:
```
--- Database connection test ---
Connecting to: postgresql+psycopg2://postgres:postgres@localhost:5432/foodconnect
Successfully connected to the database!
Found tables: verification, location_tracking, pickup_requests, users, donations, donation_tags, claims_record, hotel, volunteer
```

---

## ⚙️ Environment Configuration

### 5. **Configure .env File**
Edit `e:\foodconnect\Food-Connect\.env`:

```env
# REQUIRED: Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/foodconnect
JWT_SECRET=your-secret-key-change-this-in-production

# API Base URL
VITE_API_BASE_URL=http://localhost:8000

# Firebase (for authentication)
VITE_FIREBASE_API_KEY=AIzaSyArQA4G1uXFoLdCJC3KirNHKG40nowNmg4
VITE_FIREBASE_AUTH_DOMAIN=food-connect-ed27b.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=food-connect-ed27b
VITE_FIREBASE_STORAGE_BUCKET=food-connect-ed27b.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=555206354447
VITE_FIREBASE_APP_ID=1:555206354447:web:087a4693e59e66a58ca57a

# APIs
VITE_GEMINI_API_KEY=AIzaSyA-0gQhhldjYcSy6agao2vCq5qAApQcBIQ
VITE_ORS_API_KEY=eyJvcmciOiI1YjNjZTM1OTc4NTExMTAwMDFjZjYyNDgiLCJpZCI6ImMxNzQ3YzNhNDRkMTQ5M2ViZDhhZTk4MGU3ZWIyZWY4IiwiaCI6Im11cm11cjY0In0=
VITE_OPENROUTER_API_KEY=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
```

---

## 🚀 Starting the Application

### 6. **Start Backend Server**
```bash
cd e:\foodconnect\Food-Connect
npm run api
```
✓ Server runs on: `http://localhost:8000`
✓ API Docs: `http://localhost:8000/docs`

### 7. **Start Frontend Server** (New Terminal)
```bash
cd e:\foodconnect\Food-Connect
npm run dev
```
✓ Frontend runs on: `http://localhost:3000`

---

## 📊 Database Schema Overview

### Core Tables:
- **users** - User accounts (email, phone, password, role)
- **hotel** - Hotel partner profiles
- **volunteer** - Volunteer profiles
- **donations** - Food donations from hotels
- **donation_tags** - Categories (biryani, rice, noodles)
- **claims_record** - Volunteer claims on donations
- **verification** - Pickup/delivery verification codes
- **location_tracking** - Real-time volunteer location

---

## 🔐 Connection Pool Configuration

The backend uses a **ThreadedConnectionPool** with:
- **Min connections**: 1
- **Max connections**: 20
- **Auto-commit enabled**: Yes
- **Connection cursor factory**: RealDictCursor (dict-like access)

---

## ✅ Troubleshooting

### Issue: "Database connection refused"
```bash
# 1. Check PostgreSQL is running
# Windows: Services (services.msc) → Look for "PostgreSQL"
# OR:
psql -U postgres -c "SELECT version();"

# 2. Verify credentials in .env
# DEFAULT: postgres:postgres@localhost:5432

# 3. Check if database exists
psql -U postgres -l | grep foodconnect
```

### Issue: "Connection pool exhausted"
- Solutions:
  1. Restart backend server: `Ctrl+C` then `npm run api`
  2. Check for connection leaks in logs
  3. Increase max pool size in `backend/main.py`

### Issue: "User data not saving"
- All queries now use proper connection management
- Data automatically commits to database
- No manual `conn.commit()` needed in endpoints

---

## 🎯 Quick Start Commands

```bash
# In one terminal - Start Backend
cd e:\foodconnect\Food-Connect
npm run api

# In another terminal - Verify DB
python verify_db.py

# In another terminal - Start Frontend
npm run dev

# Open: http://localhost:3000
```

---

## 📝 Key Features Now Working

✅ User Registration (Hotel/Volunteer)
✅ User Login with JWT tokens
✅ Session persistence in localStorage
✅ Donation creation and management
✅ Real-time location tracking
✅ Claim management
✅ Verification codes

---

## 🆘 Need Help?

Check logs in:
- Backend: Terminal running `npm run api`
- Database: `database/queries/Sql_Queries.sql`
- Frontend: Browser console (F12)
