<div align="center">

# 🍽️ FoodConnect

**Bridging the gap between surplus food and those in need**

[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Vite](https://img.shields.io/badge/Vite-6-646CFF?logo=vite&logoColor=white)](https://vitejs.dev)
[![Supabase](https://img.shields.io/badge/Supabase-Database-3FCF8E?logo=supabase&logoColor=white)](https://supabase.com)
[![Firebase](https://img.shields.io/badge/Firebase-Auth%20%26%20FCM-FFCA28?logo=firebase&logoColor=black)](https://firebase.google.com)
[![Leaflet](https://img.shields.io/badge/Leaflet-Maps-199900?logo=leaflet&logoColor=white)](https://leafletjs.com)

*A real-time food donation platform connecting hotels & restaurants with volunteers to reduce food waste and feed communities.*

---

</div>

## ✨ Features

### 🏨 Hotel / Restaurant Portal
- **Post Donations** — List surplus food with details (weight, tags, pickup window, urgency)
- **Manage Requests** — Accept or reject volunteer pickup requests in real-time
- **OTP Verification** — 4-digit code system ensures secure handoffs
- **Donation History** — Track all past donations with ratings and reviews
- **Export Reports** — Download CSV or export to Google Sheets with summary stats
- **Impact Videos** — AI-generated impact videos from donation images (Gemini API)

### 🤝 Volunteer Portal
- **Interactive Map** — See nearby donations on a live map with clustering
- **Real Driving Directions** — Actual road routes via OpenRouteService (distance + ETA)
- **Request Pickups** — Send requests to hotels, get notified when accepted
- **Navigation Mode** — Turn-by-turn route with prominently displayed pickup code
- **Impact Dashboard** — Track personal impact stats and contribution history

### 🔔 Shared Features
- **Real-time Sync** — Supabase real-time subscriptions for instant updates
- **Push Notifications** — FCM-powered notifications for all lifecycle events
- **Phone OTP Login** — Firebase Authentication with SMS verification
- **Dark Mode** — Full dark mode support on both portals
- **Responsive Design** — Mobile-first, works on all screen sizes
- **Offline Fallback** — localStorage fallback when Supabase is unavailable

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18, TypeScript, Vite |
| **Styling** | Tailwind CSS, Framer Motion |
| **Database** | Supabase (PostgreSQL + Real-time) |
| **Authentication** | Firebase Auth (Phone OTP) |
| **Maps** | Leaflet + OpenStreetMap + OpenRouteService |
| **Notifications** | Firebase Cloud Messaging (FCM) |
| **Export** | CSV / Google Sheets API |
| **AI** | Google Gemini API (impact videos) |

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v18 or higher
- [npm](https://www.npmjs.com/) v9 or higher
- A [Supabase](https://supabase.com) account (free tier works)
- A [Firebase](https://firebase.google.com) project
- An [OpenRouteService](https://openrouteservice.org) API key (free)

### 1. Clone the repo

```bash
git clone https://github.com/krutadnyabodake36/Food-Connect.git
cd Food-Connect
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

Create a `.env.local` file in the project root:

```env
# Supabase
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Firebase
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_firebase_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id

# OpenRouteService
VITE_ORS_API_KEY=your_ors_api_key
```

### 4. Set up Supabase database

1. Go to your Supabase dashboard → **SQL Editor**
2. Copy the contents of `supabase/schema.sql`
3. Paste and run it in the SQL Editor

This creates the required tables (`profiles`, `donations`, `pickup_requests`), enables RLS, real-time subscriptions, and seeds demo data.

### 5. Enable Firebase Phone Auth

1. Go to Firebase Console → **Authentication** → **Sign-in method**
2. Enable **Phone** provider
3. Add `localhost` to authorized domains (for development)

### 6. Start the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 7. Demo Login

| Role | Credentials |
|---|---|
| **Hotel** | Name: `Demo Hotel` / Password: `password` |
| **Volunteer** | Phone: `+91 9876543210` / Password: `password` |

---

## 📁 Project Structure

```
food-connect/
├── public/
│   └── firebase-messaging-sw.js    # FCM service worker
├── supabase/
│   └── schema.sql                  # Database schema + seed data
├── src/
│   ├── components/
│   │   ├── hotel/                  # Hotel UI components
│   │   ├── volunteer/              # Volunteer UI (Map, DonationSheet)
│   │   └── shared/                 # NotificationBell, Logo
│   ├── contexts/
│   │   ├── AuthContext.tsx          # Auth + Firebase Phone OTP
│   │   ├── DonationContext.tsx      # Donation lifecycle + Supabase
│   │   └── ThemeContext.tsx         # Light/Dark mode
│   ├── layouts/
│   │   ├── HotelApp.tsx            # Hotel portal shell
│   │   └── VolunteerApp.tsx        # Volunteer portal shell
│   ├── lib/
│   │   ├── supabase.ts             # Supabase client
│   │   ├── firebase.ts             # Firebase app + auth
│   │   ├── routeService.ts         # OpenRouteService directions
│   │   ├── notifications.ts        # FCM + in-app toasts
│   │   └── exportService.ts        # CSV / Google Sheets export
│   ├── pages/
│   │   ├── hotel/                  # Dashboard, Donate, History, Requests, Settings
│   │   ├── volunteer/              # Dashboard, Impact, Settings
│   │   └── LoginPage.tsx           # Auth page with Phone OTP
│   ├── App.tsx                     # Route orchestration
│   ├── main.tsx                    # Entry point
│   └── types.ts                    # TypeScript type definitions
├── .env.local                      # Environment variables (not in git)
├── package.json
├── tailwind.config.js
├── tsconfig.json
└── vite.config.ts
```

---

## 📊 Donation Lifecycle

```
Hotel posts donation
       │
       ▼
   [PENDING] ── Shows on volunteer map
       │
  Volunteer requests pickup
       │
       ▼
  [REQUESTED] ── Hotel sees request with volunteer info
       │
  Hotel accepts (OTP generated)
       │
       ▼
  [ASSIGNED] ── Volunteer navigates to hotel
       │
  Volunteer arrives, gives 4-digit code
       │
       ▼
  [COMPLETED] ── Both get notification 🎉
```

---

## 🔑 API Keys Required

| Service | Free Tier | Get Key |
|---|---|---|
| **Supabase** | ✅ 500MB DB, 2GB bandwidth | [supabase.com](https://supabase.com) |
| **Firebase** | ✅ 10K SMS/month | [firebase.google.com](https://firebase.google.com) |
| **OpenRouteService** | ✅ 2K requests/day | [openrouteservice.org](https://openrouteservice.org) |
| **Google Gemini** | ✅ Free tier available | [ai.google.dev](https://ai.google.dev) |

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---

<div align="center">

**Built with ❤️ to reduce food waste and feed communities**

*If this project helped you, consider giving it a ⭐!*

</div>
