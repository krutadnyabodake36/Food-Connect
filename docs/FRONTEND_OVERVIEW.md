# FoodConnect Frontend - Complete Overview

## 📋 Table of Contents
1. [Architecture Overview](#architecture-overview)
2. [Tech Stack](#tech-stack)
3. [Project Structure](#project-structure)
4. [Authentication System](#authentication-system)
5. [State Management](#state-management)
6. [Routing System](#routing-system)
7. [Key Components](#key-components)
8. [Features by Role](#features-by-role)
9. [Data Flow](#data-flow)
10. [Styling & UI](#styling--ui)

---

## Architecture Overview

FoodConnect frontend is a **Role-Based Single Page Application (SPA)** with two distinct user interfaces:

```
┌─────────────────────────────────────────────┐
│         FoodConnect Frontend                 │
├─────────────────────────────────────────────┤
│                                             │
│  ┌──────────────┐      ┌──────────────┐   │
│  │ Landing Page │      │  Login Page   │   │
│  │   (Public)   │      │   (Public)    │   │
│  └──────────────┘      └──────────────┘   │
│         │                     │            │
│         └─────────┬───────────┘            │
│                   │                         │
│        ┌──────────▼──────────┐            │
│        │  Authentication     │            │
│        │  (AuthContext)      │            │
│        └──────────┬──────────┘            │
│                   │                         │
│        ┌──────────┴──────────┐            │
│        │                     │            │
│   ┌────▼────┐         ┌─────▼────┐      │
│   │ HotelApp│         │VolunteerApp│   │
│   │ (Hotel) │         │ (Volunteer)│   │
│   └────┬────┘         └─────┬────┘      │
│        │                    │           │
└────────┼────────────────────┼───────────┘
         │                    │
    ┌────▼────┐          ┌────▼────┐
    │ Backend  │          │ Backend  │
    │ (Hotel   │          │(Volunteer│
    │ APIs)    │          │ APIs)    │
    └──────────┘          └──────────┘
```

### Key Architecture Points:
- **Role-based routing**: Different UIs for hotel partners and volunteers
- **Client-side state management**: React Context API for auth, donations, theme
- **REST API integration**: FastAPI backend communication via axios-based apiRequest
- **LocalStorage persistence**: Session and user preferences persist across refreshes
- **Real-time features**: Maps, location tracking, notifications

---

## Tech Stack

### Frontend Technologies
| Category | Technologies |
|----------|--------------|
| **Framework** | React 19 with TypeScript |
| **Build Tool** | Vite (dev server, fast HMR) |
| **Routing** | React Router v6 |
| **State Management** | React Context API |
| **Styling** | Tailwind CSS v3 + custom utilities |
| **Animations** | Framer Motion |
| **Maps** | Leaflet (OSM maps) |
| **Charts** | Recharts |
| **Icons** | Lucide React 24px icons |
| **HTTP Client** | Axios (wrapped in apiRequest) |
| **Notifications** | Firebase Cloud Messaging + Local notifications |
| **Database Utils** | IndexedDB (via localStorage) |

### Development Tools
- **Package Manager**: npm
- **TypeScript**: Strict type checking enabled
- **CSS Framework**: Tailwind CSS with custom `glass-panel`, `animate-gradient-text` utilities

---

## Project Structure

```
src/
├── App.tsx                    # Main app router component
├── main.tsx                   # React entry point
├── vite-env.d.ts             # Vite type definitions
├── types.ts                  # Shared TypeScript interfaces ⭐
├── constants.ts              # Global constants
├── index.css                 # Global styles
│
├── contexts/                 # State Management (Context API)
│   ├── AuthContext.tsx       # Authentication & user profile
│   ├── DonationContext.tsx   # Donation data & operations
│   ├── SettingsContext.tsx   # User preferences
│   └── ThemeContext.tsx      # Light/Dark mode theme
│
├── layouts/                  # Main layout containers
│   ├── HotelApp.tsx          # Hotel partner dashboard layout
│   └── VolunteerApp.tsx      # Volunteer dashboard layout
│
├── pages/                    # Page components
│   ├── LandingPage.tsx       # Home page (public)
│   ├── LoginPage.tsx         # Login/Register page (public)
│   ├── hotel/
│   │   ├── Dashboard.tsx     # Hotel overview & active donations
│   │   ├── Donations.tsx     # Create/manage donations
│   │   ├── Requests.tsx      # Volunteer pickup requests
│   │   ├── History.tsx       # Past donations & analytics
│   │   ├── Settings.tsx      # Hotel settings
│   │   └── ...
│   └── volunteer/
│       ├── VolunteerDashboard.tsx  # Volunteer stats & impact
│       ├── Impact.tsx              # Volunteer achievements
│       ├── Settings.tsx            # Volunteer preferences
│       └── ...
│
├── components/               # Reusable UI components
│   ├── shared/               # Shared across both roles
│   │   ├── NotificationBell.tsx
│   │   ├── AIChatWidget.tsx
│   │   ├── SyncIndicator.tsx
│   │   └── ...
│   ├── hotel/                # Hotel-specific components
│   │   ├── HotelMap.tsx
│   │   ├── DonationForm.tsx
│   │   └── ...
│   └── volunteer/            # Volunteer-specific components
│       ├── VolunteerMap.tsx
│       ├── DonationSheet.tsx
│       └── ...
│
├── services/                 # Business logic services
│   ├── geminiService.ts      # Google Gemini AI integration
│   └── ...
│
├── lib/                      # Utility functions & libraries ⭐
│   ├── api.ts                # HTTP client wrapper (apiRequest)
│   ├── firebase.ts           # Firebase initialization
│   ├── notifications.ts      # Notification utilities
│   ├── hotelLocation.ts      # Geolocation caching
│   ├── locationTracking.ts   # Real-time location tracking
│   ├── routingService.ts     # Route calculations
│   ├── routeService.ts       # Alternative routing
│   └── exportService.ts      # CSV/PDF export utilities
│
└── images.d.ts               # Image import declarations
```

---

## Authentication System

### AuthContext Overview
**Location**: `src/contexts/AuthContext.tsx`

#### Features:
1. **User Registration** - Both roles (hotel/volunteer) with validation
2. **User Login** - JWT-based authentication
3. **Demo Login** - Bypass authentication for testing (DEMO_HOTEL / DEMO_VOLUNTEER)
4. **Session Persistence** - localStorage stores session data
5. **Profile Management** - Update user info (name, phone, etc.)
6. **Logout** - Clear session and token

#### Auth Flow:
```
User Input (Register/Login)
    ↓
[apiRequest to Backend] (/auth/login, /auth/register)
    ↓
Backend validates & returns JWT token + user object
    ↓
persistSession() saves to localStorage
    ↓
setSession() updates React state
    ↓
User redirected based on role:
  - hotel → /app/dashboard
  - volunteer → /app/dashboard
```

#### Key Functions:
- `login(role, identifier, password)` - Authenticate user
- `register(role, data, password)` - Create new account
- `demoLogin(role)` - Quick demo without backend (for testing)
- `logout()` - Clear session
- `updateProfile(data)` - Modify user information

#### Session Storage:
```javascript
// Stored in localStorage ('foodconnect_session')
{
  token: "jwt_token_here",
  user: {
    id: "user_123",
    name: "John Doe",
    email: "john@hotel.com",
    role: "hotel",
    hotelName: "Grand Hotel", // hotel-specific
    // OR
    vehicle: "Bike",           // volunteer-specific
    ngoName: "Save Food NGO"
  },
  hotelProfile?: {  // Only for hotel users
    id: "hotel_123",
    hotelName: "Grand Hotel",
    address: "123 Main St, Mumbai"
  }
}
```

---

## State Management

FoodConnect uses **React Context API** for global state - no Redux needed.

### 1. **AuthContext** - Authentication & User
```typescript
- user: User | null              // Current logged-in user
- hotelProfile: Hotel | null     // Hotel details (if hotel user)
- loading: boolean               // Auth check in progress
- Functions: login(), register(), logout(), demoLogin()
```
**Used by**: All authenticated pages

### 2. **DonationContext** - Donation Management
```typescript
- donations: HotelDonation[]          // All donations in system
- loading: boolean                    // Data fetching state
- Functions: 
  - addDonation()          // Create new donation
  - editDonation()         // Update donation
  - acceptRequest()        // Hotel accepts volunteer request
  - rejectRequest()        // Hotel rejects request
  - requestPickup()        // Volunteer requests pickup
  - markCompleted()        // Mark donation complete
  - verifyAndComplete()    // Verify pickup with OTP
```
**Used by**: Hotel dashboard, maps, donation sheets

### 3. **ThemeContext** - Light/Dark Mode
```typescript
- theme: 'light' | 'dark'
- Functions: toggleTheme()
```
**Used by**: All pages for consistent theming

### 4. **SettingsContext** - User Preferences
```typescript
- preferences: UserSettings      // User-specific settings
- Functions: updateSettings()
```
**Used by**: Settings pages

---

## Routing System

### Route Structure
**Location**: `src/App.tsx`

```
/                    → LandingPage (public, marketing)
├── /login           → LoginPage (public, auth required)
│                       - Registration mode
│                       - Login mode
│                       - Demo buttons
│
└── /app/*           → Protected routes (auth required)
    ├── /app/dashboard     (default)
    ├── /app/donations     (hotel only)
    ├── /app/map           (volunteer only)
    ├── /app/requests      (hotel only)
    ├── /app/impact        (volunteer only)
    ├── /app/history       (hotel only)
    ├── /app/settings
    └── /app/profile
```

### Role-Based Routing
```typescript
if (user.role === 'hotel') {
  → HotelApp layout         // Hotel-specific interface
} else if (user.role === 'volunteer') {
  → VolunteerApp layout     // Volunteer-specific interface
}
```

### Protected Routes
- **Redirects** `/` to `/app` if user is logged in
- **Redirects** `/app` to `/login` if user is NOT logged in
- **Redirects** `/login` to `/app` if user IS logged in (can't access login when authenticated)

---

## Key Components

### Layout Components

#### **HotelApp.tsx** (Hotel Partner Interface)
- **Purpose**: Main container for hotel user dashboard
- **Includes**: Sidebar navigation, header with notifications
- **Routes**: Dashboard, Donations, Requests, History, Settings
- **Key Features**:
  - Donation management
  - Volunteer request handling
  - Statistics & analytics
  - Theme toggle

#### **VolunteerApp.tsx** (Volunteer Interface)
- **Purpose**: Main container for volunteer dashboard
- **Includes**: Sidebar navigation, mobile menu, header
- **Routes**: Dashboard, Rescue Map, Impact, Settings
- **Key Features**:
  - Interactive donation map
  - Pickup requests
  - Impact metrics
  - Location tracking

### Page Components

#### **LandingPage.tsx**
- Marketing/onboarding page
- Feature highlights
- Call-to-action buttons to login

#### **LoginPage.tsx**
- **Two Modes**:
  - Signup: Register as hotel or volunteer
  - Login: Authenticate existing user
- **Demo Buttons**: 
  - 🏨 Demo Hotel Access
  - 🤝 Demo Volunteer Access
- **Features**:
  - Email/phone validation
  - Password validation
  - Error message display
  - Role selection (hotel/volunteer)

#### **Hotel Pages** (`pages/hotel/`)
- **Dashboard.tsx** - Overview of donations, stats, quick actions
- **Donations.tsx** - Create new donation form with image upload
- **Requests.tsx** - View volunteer pickup requests
- **History.tsx** - Past donations with filters
- **Settings.tsx** - Hotel profile, preferences

#### **Volunteer Pages** (`pages/volunteer/`)
- **VolunteerDashboard.tsx** - Impact metrics, recent activity, weekly stats
- **Impact.tsx** - Achievements, badges, ratings
- **Settings.tsx** - Volunteer preferences, profile

### Shared Components (`components/shared/`)
- **NotificationBell.tsx** - Firebase notification icon
- **AIChatWidget.tsx** - AI chatbot interface
- **SyncIndicator.tsx** - Real-time sync status
- **NavLink** - Sidebar navigation item
- **UI Components** - Buttons, modals, forms

### Hotel-Specific Components (`components/hotel/`)
- **HotelMap.tsx** - Show volunteer locations
- **DonationForm.tsx** - Create/edit donation form
- **RequestCard.tsx** - Volunteer request display

### Volunteer-Specific Components (`components/volunteer/`)
- **VolunteerMap.tsx** - Interactive map with donation markers
- **DonationSheet.tsx** - Donation details & pickup action
- **VolunteerCard.tsx** - Volunteer information display

---

## Features by Role

### 🏨 Hotel Partner Features

**Dashboard**
- [ ] Overview of active donations
- [ ] Recent requests from volunteers
- [ ] Quick stats (total donated, volunteers helped)
- [ ] Quick create donation button

**Donation Management**
- [ ] Create new donation with:
  - Food type (veg/non-veg/bakery/bulk)
  - Quantity and unit (kg/plates/pieces/servings)
  - Description and tags
  - Prep time and expiry
  - Photo upload
  - Urgent flag
- [ ] Edit existing donations
- [ ] Set pickup window/availability
- [ ] Mark as completed

**Requests**
- [ ] View volunteer pickup requests
- [ ] Accept/Reject requests
- [ ] Assign to volunteer
- [ ] Track volunteer via GPS
- [ ] Receive OTP from volunteer on pickup
- [ ] Verify OTP to confirm completion
- [ ] Rate volunteer after completion

**History**
- [ ] View past donations with status
- [ ] Filter by status, date, volunteer
- [ ] See volunteer ratings
- [ ] Export donation history
- [ ] Analytics charts

**Settings**
- [ ] Update hotel profile
- [ ] Change password
- [ ] Toggle theme
- [ ] Notification preferences
- [ ] Logout

---

### 🤝 Volunteer Features

**Dashboard**
- [ ] Impact metrics:
  - Meals rescued
  - Hours volunteered
  - Network activity
- [ ] Quick link to rescue map
- [ ] Weekly impact chart
- [ ] Recent activity feed

**Rescue Map**
- [ ] Interactive map showing donations
- [ ] Filter by food type (veg/non-veg/bakery/bulk/hot)
- [ ] Click markers to see details
- [ ] Request pickup from donation
- [ ] Real-time location tracking
- [ ] Route direction/ETA
- [ ] Sync status indicator

**My Impact**
- [ ] Achievement badges
- [ ] Volunteer rating
- [ ] Meals rescued statistics
- [ ] Hours logged
- [ ] Trending metrics
- [ ] Leaderboard

**Settings**
- [ ] Profile information
- [ ] Vehicle details
- [ ] NGO association
- [ ] Theme toggle
- [ ] Notification preferences
- [ ] Logout

---

## Data Flow

### 1. Donation Creation Flow (Hotel → Volunteer)
```
Hotel User Creates Donation
    ↓
[DonationForm component gathers data]
    ↓
[apiRequest POST /donations creates donation]
    ↓
DonationContext.addDonation() updates state
    ↓
Donation appears on VolunteerMap for volunteers
    ↓
🎯 Volunteer sees it in real-time (map updates)
```

### 2. Pickup Request Flow (Volunteer → Hotel)
```
Volunteer Clicks "Request Pickup"
    ↓
[apiRequest POST /donations/{id}/request]
    ↓
DonationContext.requestPickup() updates donation
    ↓
Donation status: pending → requested
    ↓
activeRequest field populated with volunteer info
    ↓
Hotel sees request in Requests page
    ↓
Hotel clicks Accept/Reject
    ↓
[apiRequest POST /donations/{id}/accept-request]
    ↓
Donation status: requested → assigned
    ↓
volunteer assigned location & directions
```

### 3. Completion Flow (Volunteer captures OTP)
```
Volunteer arrives at hotel
    ↓
Hotel shows 4-digit OTP (In Person)
    ↓
Volunteer enters OTP in app
    ↓
[apiRequest POST /donations/{id}/verify?code=1234]
    ↓
Backend verifies OTP & completes donation
    ↓
DonationContext updates status: assigned → completed
    ↓
Hotel rate volunteer
    ↓
Impact metrics update for volunteer
```

### 4. Map Update Flow (Real-time Tracking)
```
Volunteer enables location tracking
    ↓
[locationTracking.ts polls location every 5-10s]
    ↓
[apiRequest POST /location/update sends coordinates]
    ↓
Hotel sees volunteer moving on map in real-time
    ↓
Progress bar updates (distance, ETA)
    ↓
Status shows: on_route / stopped / arrived
```

---

## Styling & UI

### Styling Approach
- **Tailwind CSS** for all utility-based styling
- **Custom CSS classes** in `index.css`:
  - `.glass-panel` - Frosted glass effect with backdrop blur
  - `.animate-gradient-text` - Text gradient animation
  - `.animate-mesh-bg` - Animated mesh background
  - `.no-scrollbar` - Remove scrollbar while keeping scroll

### Color Scheme
```
Primary Colors:
- Forest Green: #34ab72 (rgb(52, 171, 114))
- Stone Gray: #78716c (neutral colors)
- White/Black: Light/Dark mode

Gradients:
- Forest gradient: forest-50 → forest-900
- Stone gradient: stone-50 → stone-950
- Custom: animate-gradient-text
```

### Component Styling Pattern
```typescript
// Example: Modal/Card component
<div className="
  glass-panel           // Frosted glass base
  rounded-2xl           // Rounded corners
  p-6                   // Padding
  border border-white/20  // Subtle border
  shadow-xl             // Drop shadow
  backdrop-blur-xl      // Blur background
  transition-all        // Smooth transitions
  hover:shadow-2xl      // Hover effect
">
  {/* Content */}
</div>
```

### Dark Mode
- Uses Tailwind's `dark:` prefix
- Toggle in ThemeContext
- Automatically applied via `.dark` class on root element
- All colors have dark-mode variants

### Animations
- **Framer Motion** for:
  - Page transitions (fade in/slide in)
  - Component entrance animations
  - Hover states
  - Loading skeletons
- **Tailwind animations** for:
  - Spinning loaders
  - Pulsing effects
  - Gradient text animations

---

## API Integration

### HTTP Client: `lib/api.ts`
```typescript
apiRequest<T>(
  endpoint: string,
  options?: {
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
    body?: any
    headers?: Record<string, string>
  }
): Promise<T>
```

### Example Calls:
```typescript
// Fetch user stats
const stats = await apiRequest(`/users/${user.id}/stats`);

// Create donation
const donation = await apiRequest('/donations', {
  method: 'POST',
  body: { title, weight, tags, ... }
});

// Accept request
await apiRequest(`/donations/${id}/accept-request`, {
  method: 'POST',
  body: { volunteerId, ... }
});
```

### Authentication
- JWT token stored in localStorage
- Automatically added to all requests via `Authorization: Bearer {token}` header
- Token set during login/register

---

## Performance Optimizations

1. **Code Splitting** - Lazy loaded routes via React Router
2. **Memoization** - useMemo/useCallback for expensive computations
3. **Vite Fast Refresh** - Instant HMR during development
4. **Image Optimization** - Lazy loading images in donation cards
5. **Map Clustering** - Donation markers clustered on VolunteerMap
6. **Pagination** - History/donation lists paginated
7. **Debounced Searches** - Filter/search inputs debounced

---

## How to Explain to Someone

### **30-Second Pitch**
"FoodConnect frontend is a React app with two interfaces - one for hotels to donate surplus food, and one for volunteers to pickup that food. Hotels create donations with photos and details, volunteers see them on an interactive map, request pickups, and complete with OTP verification. Everything syncs in real-time with the backend."

### **2-Minute Explanation**
1. **Two Users, Two Interfaces**:
   - Hotel partners post surplus food with photos and details
   - Volunteers browse donations on a map and request pickups

2. **Authentication**:
   - Users register with email and role (hotel/volunteer)
   - Login creates JWT session stored locally
   - Demo login available for testing

3. **State Management**:
   - React Context API manages: auth, donations, theme, settings
   - No Redux - contexts are simple and effective

4. **Key Flow**:
   - Hotel creates donation → appears on volunteer map in real-time
   - Volunteer requests pickup → hotel accepts/rejects
   - Volunteer arrives → enters OTP for verification
   - Donation marked complete → impact metrics update

5. **Tech Stack**:
   - React 19 + TypeScript + Vite
   - Tailwind CSS for styling
   - Leaflet maps for geolocation
   - Framer Motion for animations
   - REST API communication with FastAPI backend

### **5-Minute Deep Dive**
Include the data flow diagram, show the folder structure, explain each context, walk through a complete donation lifecycle, mention the role-based routing.

---

## Deployment

### Development
```bash
npm install      # Install dependencies
npm run dev      # Start Vite dev server (port 3000)
```

### Production Build
```bash
npm run build    # Create optimized build in dist/
npm run preview  # Preview production build locally
```

### Environment Variables
```
VITE_API_BASE_URL=http://localhost:8000  // Backend API
VITE_FIREBASE_CONFIG=...                 // Firebase config
```

---

## Testing Focus Areas

✅ **High Priority**:
1. Donation creation & real-time updates
2. Pickup request flow
3. OTP verification
4. Map filtering & marker interaction
5. Role-based access control

⚠️ **Medium Priority**:
1. Form validation
2. Error handling
3. Theme switching
4. Responsive design on mobile

📋 **Low Priority**:
1. Performance benchmarks
2. Analytics tracking
3. A/B testing variants

---

## Summary

**FoodConnect Frontend is:**
- ✅ A **two-role React SPA** with distinct interfaces for hotels & volunteers
- ✅ Built on **modern stack**: React 19, TypeScript, Vite, Tailwind, Framer Motion
- ✅ **Context-based state management** (auth, donations, theme)
- ✅ **Real-time features**: Maps, location tracking, notifications
- ✅ **Role-based routing** protecting user data
- ✅ **REST API integrated** with FastAPI backend
- ✅ **Production-ready** with dark mode, responsive design, animations

The architecture is **clean, scalable, and easy to extend** for new features.
