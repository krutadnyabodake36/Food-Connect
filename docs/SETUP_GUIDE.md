# FoodConnect - Complete Setup Guide

## Overview
FoodConnect is now fully configured for backend authentication using PostgreSQL (pgAdmin) and includes real-time location tracking with optimized routing for fastest delivery paths.

---

## 🔧 Prerequisites

### 1. **PostgreSQL Database**
- Install PostgreSQL 12+
- Create a database named `foodconnect`
- Note your connection string

### 2. **Python Backend**
- Python 3.8+
- pip (Python package manager)

### 3. **Node.js Frontend**
- Node.js 16+
- npm or yarn

---

## 📦 Backend Setup

### Step 1: Install Dependencies
```bash
cd Food-Connect
pip install -r backend/requirements.txt
```

### Step 2: Configure Database Connection
Create `.env` file in the `Food-Connect` directory:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/foodconnect
PHONE_AUTH_PASSWORD=FoodConnectPhoneLogin2024!
```

### Step 3: Initialize Database
```bash
# Run SQL queries from database/queries/Sql_Queries.sql in pgAdmin:
# 1. Open pgAdmin
# 2. Create database "foodconnect"
# 3. Run the SQL from database/queries/Sql_Queries.sql

# OR use psql:
psql -U postgres -d foodconnect -f database/queries/Sql_Queries.sql
```

### Step 4: Start Backend Server
```bash
npm run api
# Server starts at http://localhost:8000
```

**Backend Endpoints:**
- `GET /health` - Health check
- `POST /auth/register` - User registration
- `POST /auth/login` - User login
- `POST /location/update` - Update volunteer location
- `GET /location/{donation_id}/latest` - Get latest location
- `GET /location/{donation_id}/history` - Get location history

---

## 🎨 Frontend Setup

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Configure Environment
Create/update `.env` file:

```env
VITE_API_BASE_URL=http://localhost:8000
VITE_ORS_API_KEY=   # Optional: for route optimization
```

### Step 3: Start Frontend Development Server
```bash
npm run dev
# Frontend starts at http://localhost:5173
```

### Step 4: Build for Production
```bash
npm run build
npm run preview
```

---

## 🔐 Authentication

### New Authentication Flow (Backend-Based)

**No Firebase Required!** All authentication is now handled via your pgAdmin database.

### Registration
```javascript
POST /auth/register
{
  "role": "hotel" | "volunteer",
  "password": "secure_password",
  "data": {
    "name": "John Doe",
    "hotelName": "Hotel Paradise",
    "address": "123 Main St",
    "managerNumber": "9999999999",
    "licenseNumber": "LIC-12345",
    "age": 25,
    "vehicle": "Bike",
    ...
  }
}
```

### Login
```javascript
POST /auth/login
{
  "role": "hotel" | "volunteer",
  "identifier": "Hotel Paradise" | "John Doe" | "9999999999",
  "password": "secure_password"
}
```

**Response:**
```javascript
{
  "user": {
    "id": "1",
    "email": "hotelparadise@hotel.foodconnect.com",
    "name": "Hotel Paradise",
    "role": "hotel",
    "hotelName": "Hotel Paradise",
    "address": "123 Main St",
    "managerNumber": "9999999999",
    "licenseNumber": "LIC-12345",
    ...
  },
  "hotelProfile": { ... } // For hotel users
}
```

---

## 📍 Location Tracking

### Real-Time Volunteer Location Updates

The frontend automatically tracks volunteer location when they accept a pickup.

**Location Update Flow:**
1. Volunteer accepts a donation
2. Browser requests geolocation permission
3. Location is updated every 10 seconds
4. Updates sent to backend via `/location/update`
5. Hotel can view real-time location on map

### Backend Location API

**Update Volunteer Location:**
```bash
POST /location/update
{
  "volunteerID": 1,
  "donationID": 5,
  "latitude": 19.0760,
  "longitude": 72.8777,
  "accuracy": 20
}
```

**Get Latest Location:**
```bash
GET /location/{donation_id}/latest
```

**Get Location History (Path):**
```bash
GET /location/{donation_id}/history?limit=100
```

---

## 🗺️ Maps & Routing

### Optimized Route Calculation

The app now uses **OSRM (Open Source Routing Machine)** for fastest route calculation.

#### Free OSRM Service
- Uses public OSRM API: `https://router.project-osrm.org`
- No API key required
- Automatically calculates fastest driving routes

#### Features:
- **Real-time route updates** as volunteer moves
- **Progress tracking** along the route
- **ETA calculation** based on road conditions
- **Distance calculation** in kilometers

### Customizing Map Provider

To use a different routing service (e.g., Google Maps, Mapbox):

Edit `src/lib/routingService.ts`:
```typescript
// Change the API endpoint
const url = `https://your-routing-service.com/...`;
```

---

## 💾 Database Schema

### Users Table
```sql
CREATE TABLE users (
   user_id SERIAL PRIMARY KEY,
   password VARCHAR(255) NOT NULL,
   email VARCHAR(100) UNIQUE NOT NULL,
   role VARCHAR(20) NOT NULL CHECK (role IN ('hotel', 'volunteer', 'admin')),
   phone VARCHAR(20),
   created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Hotel Table
```sql
CREATE TABLE hotel (
   user_id INTEGER PRIMARY KEY,
   h_name VARCHAR(200) NOT NULL,
   address VARCHAR(100),
   latitude DECIMAL(10, 8),
   longitude DECIMAL(11, 8),
   manager_number VARCHAR(50),
   license_number VARCHAR(50),
   created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
   FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);
```

### Volunteer Table
```sql
CREATE TABLE volunteer (
   user_id INTEGER PRIMARY KEY,
   vol_name VARCHAR(100) NOT NULL,
   vehicle_type VARCHAR(50),
   age INTEGER,
   ngo_name VARCHAR(100),
   ngo_number VARCHAR(50),
   contact_person VARCHAR(100),
   score INTEGER DEFAULT 0,
   latitude DECIMAL(10, 8),
   longitude DECIMAL(11, 8),
   created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
   FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);
```

### Location Tracking Table
```sql
CREATE TABLE location_tracking (
    id SERIAL PRIMARY KEY,
    volunteer_id INTEGER NOT NULL,
    donation_id INTEGER NOT NULL,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    accuracy REAL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (volunteer_id) REFERENCES volunteer(user_id) ON DELETE CASCADE,
    FOREIGN KEY (donation_id) REFERENCES donations(d_id) ON DELETE CASCADE
);
```

---

## 🎨 Demo Data

Demo data is automatically seeded when the database is empty:

**Hotel:**
- Email: `hotelparadise@hotel.foodconnect.com`
- Password: `hotelpass`
- Location: Bandra, Mumbai

**Volunteer:**
- Email: `alice@vol.foodconnect.com`
- Password: `volpass`
- Vehicle: Bike
- Location: Dadar, Mumbai

**Demo Donations:**
- Veg Biryani & Curry (Pending)
- Assorted Breads & Dal (Completed)

---

## 🚀 New Accounts with Null Data

When a user creates a new account:
- **Hotel data**: All location and profile fields start as NULL
- **Volunteer data**: Location coordinates start as NULL
- **Donations**: Initially no donations created
- **Data retained**: Once users add their information, it's stored in the database

This ensures clean slate for new users while maintaining data persistence.

---

## 🔧 Common Issues & Solutions

### Issue: "Connection refused" to database
**Solution:** 
- Check PostgreSQL is running
- Verify DATABASE_URL is correct
- Ensure database `foodconnect` exists

### Issue: "VITE_API_BASE_URL is missing"
**Solution:**
- Create `.env` file with correct API URL
- Restart frontend dev server

### Issue: Location not updating on map
**Solution:**
- Check browser geolocation permission
- Verify location tracking endpoint is reachable
- Check browser console for errors

### Issue: Map showing straight line instead of road route
**Solution:**
- OSRM API might be down
- Check internet connection
- Routes are calculated asynchronously - wait a moment

---

## 📊 Monitoring

### Backend Logs
```bash
# View API logs
tail -f api.log

# Check database queries
# Enable PostgreSQL query logging in postgresql.conf
```

### Frontend Console
```javascript
// Check location tracking
localStorage.getItem('foodconnect_session')

// Monitor API calls
// Open DevTools > Network tab
```

---

## 🔒 Security Checklist

- [ ] DATABASE_URL is not in git repo (use .env)
- [ ] PHONE_AUTH_PASSWORD is strong
- [ ] Backend is behind HTTPS in production
- [ ] CORS is correctly configured
- [ ] API rate limiting is enabled
- [ ] Database backups are configured
- [ ] User sessions have proper timeout

---

## 📈 Performance Tips

1. **Database indexing**: Create indexes on frequently queried columns
   ```sql
   CREATE INDEX idx_donations_status ON donations(status);
   CREATE INDEX idx_location_tracking_donation ON location_tracking(donation_id);
   ```

2. **Caching**: Implement Redis for session caching
3. **Location updates**: Adjust update interval based on needs (currently 10 seconds)
4. **Route caching**: Cache routes for repeated origin-destination pairs

---

## 🆘 Support

For issues or questions:
1. Check backend logs: `npm run api`
2. Check frontend console: F12 in browser
3. Verify database connection
4. Check .env configuration

---

## 📝 Version Information

- **Backend**: FastAPI with SQLAlchemy ORM
- **Frontend**: React 19 + TypeScript + Vite
- **Database**: PostgreSQL 12+
- **Maps**: Leaflet + OpenStreetMap + OSRM Routing
- **Location Tracking**: Browser Geolocation API
- **Authentication**: Backend password hashing (PBKDF2)

---

Last Updated: 2026-04-05
