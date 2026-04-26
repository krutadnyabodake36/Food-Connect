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

> [!IMPORTANT]
> This is a **PRIVATE** repository. Ensure that sensitive information (API keys, secrets) is never committed. Use the provided `.env.example` as a template for your local environment.

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
| **Styling** | Vanilla CSS (Modern), Tailwind CSS, Framer Motion |
| **Backend** | Python (FastAPI/Flask), Node.js |
| **Database** | Supabase (PostgreSQL + Real-time) |
| **Authentication** | Firebase Auth (Phone OTP) |
| **Maps** | Leaflet + OpenRouteService |
| **AI** | Google Gemini API (Impact analysis & insights) |

---

## 🚀 Getting Started

### 1. Prerequisites
- [Node.js](https://nodejs.org/) (v18+)
- [Python](https://www.python.org/) (v3.10+) for backend services
- [PostgreSQL](https://www.postgresql.org/) (if running locally)

### 2. Clone and Install
```bash
git clone https://github.com/Dipankar2105/Food-Connect.git
cd Food-Connect
npm install
```

### 3. Backend Setup
```bash
cd backend
pip install -r requirements.txt
# Set up your .env file inside backend/ as well
```

### 4. Environment Variables
Create a `.env` file in the root directory. **Note: This file is ignored by Git for security.**
Refer to `.env.example` for all required keys.

| Variable | Description |
|---|---|
| `DATABASE_URL` | Connection string for your PostgreSQL database |
| `VITE_FIREBASE_*` | Firebase configuration for Authentication and FCM |
| `VITE_GEMINI_API_KEY` | API key for Google Gemini AI features |
| `VITE_ORS_API_KEY` | API key for OpenRouteService (Maps) |

---

## 📁 Repository Structure & File Details

### Core Directories
- `src/` — Main React application source code.
  - `components/` — UI components (Hotel, Volunteer, Shared).
  - `contexts/` — State management (Auth, Donation, Theme).
  - `layouts/` — Application shells for different portals.
  - `lib/` — Third-party service integrations (Firebase, Supabase, API).
  - `pages/` — Top-level route components.
- `backend/` — Python-based backend services and API logic.
- `database/` — SQL scripts and database schema definitions.
- `docs/` — Detailed documentation, setup guides, and architecture overviews.
- `scripts/` — Utility scripts for database verification and schema generation.

### Important Files (Included in Repo)
- `package.json` — Frontend dependencies and build scripts.
- `vite.config.ts` — Vite configuration for the React app.
- `tsconfig.json` — TypeScript configuration.
- `.env.example` — Template for environment variables.
- `AUTHENTICATION_FIXES_SUMMARY.md` — Detailed report on auth system improvements.

### Ignored Files (NOT in Repo)
> [!CAUTION]
> The following files are excluded from Git to protect secrets and avoid bloat. They must be managed locally.

- `.env` — Contains sensitive API keys and database credentials.
- `node_modules/` — Managed by `npm install`.
- `.venv/`, `.venv-1/` — Python virtual environments.
- `dist/` — Compiled production build output.
- `__pycache__/` — Python compiled files.

---

## 📊 Database Setup
1. Use the scripts in `database/` to initialize your PostgreSQL instance.
2. If using Supabase, apply the schema located in `supabase/schema.sql` (if applicable) or follow the `DATABASE_SETUP_GUIDE.md` in the `docs/` folder.

---

## 🤝 Contributing
This is a private project. Please coordinate with the repository owner before making changes.

---

<div align="center">

**Built with ❤️ to reduce food waste and feed communities**

</div>

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---

<div align="center">

**Built with ❤️ to reduce food waste and feed communities**

*If this project helped you, consider giving it a ⭐!*

</div>
