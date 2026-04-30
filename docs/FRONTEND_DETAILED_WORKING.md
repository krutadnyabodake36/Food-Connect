# FoodConnect Frontend - Deep Technical Working Guide

## 📑 Complete Table of Contents

1. [Application Startup & Initialization](#1-application-startup--initialization)
2. [Provider Stack & Context Setup](#2-provider-stack--context-setup)
3. [AuthContext Deep Dive](#3-authcontext-deep-dive)
4. [DonationContext Deep Dive](#4-donationcontext-deep-dive)
5. [API Request System](#5-api-request-system)
6. [Routing & Navigation](#6-routing--navigation)
7. [Component Lifecycle & Rendering](#7-component-lifecycle--rendering)
8. [State Management Flow](#8-state-management-flow)
9. [Form Handling System](#9-form-handling-system)
10. [Real-time Updates & Sync](#10-real-time-updates--sync)
11. [LocalStorage Management](#11-localstorage-management)
12. [Error Handling & Notifications](#12-error-handling--notifications)

---

## 1. Application Startup & Initialization

### The Entry Point: `main.tsx`

When the app starts, `main.tsx` is the first file executed:

```typescript
// src/main.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { AuthProvider, ThemeProvider, SettingsProvider, DonationProvider } from './contexts';
import ToastViewport from './components/shared/ToastViewport';
import './index.css';

const rootElement = document.getElementById('root');
const root = ReactDOM.createRoot(rootElement);

root.render(
  <React.StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <SettingsProvider>
          <AuthProvider>
            <DonationProvider>
              <App />
              <ToastViewport />
            </DonationProvider>
          </AuthProvider>
        </SettingsProvider>
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>
);
```

### Step-by-Step Initialization:

**Step 1: React Renders to DOM**
```
HTML <div id="root"></div>
    ↓
ReactDOM.createRoot() finds root element
    ↓
.render() mounts React component tree
```

**Step 2: Providers Wrap Every Component**
```
┌─ BrowserRouter (handles URL routing)
│  ├─ ThemeProvider (light/dark mode state)
│  │  ├─ SettingsProvider (user settings)
│  │  │  ├─ AuthProvider (authentication)
│  │  │  │  ├─ DonationProvider (donation data)
│  │  │  │  │  ├─ App (main app component)
│  │  │  │  │  └─ ToastViewport (notifications)
│  │  │  │  │
```

**Step 3: Providers Initialize (Bottom-Up)**

Each provider runs its `useEffect` hooks to initialize:

```
1. ThemeProvider initializes → reads localStorage for theme preference
2. SettingsProvider initializes → loads user settings
3. AuthProvider initializes → CHECKS FOR EXISTING SESSION
   ├─ reads localStorage for 'foodconnect_session'
   ├─ sets loading = true
   ├─ sets user = session.user (if exists)
   └─ sets loading = false
4. DonationProvider initializes → LOADS DONATIONS
   ├─ tries backend /donations endpoint
   ├─ if fails, falls back to localStorage
   └─ sets donations state
5. App renders → checks if user exists
```

**Step 4: App Component Evaluates User State**

```typescript
// src/App.tsx (simplified)
const App: React.FC = () => {
  const { user, loading } = useAuth();

  // While auth is checking session
  if (loading) {
    return <LoadingSpinner />;  // Shows spinner
  }

  // User is logged in
  if (user) {
    if (user.role === 'hotel') {
      return <HotelApp />;       // Show hotel interface
    } else {
      return <VolunteerApp />;   // Show volunteer interface
    }
  }

  // User is not logged in
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
    </Routes>
  );
};
```

**Complete Startup Timeline:**
```
0ms    → index.html loads (contains <div id="root"></div>)
10ms   → main.tsx executes
20ms   → React renders provider tree
30ms   → ThemeProvider useEffect runs
40ms   → SettingsProvider useEffect runs
50ms   → AuthProvider useEffect runs → reads localStorage
55ms   → DonationProvider useEffect runs → fetches /donations
60ms   → App component renders, checks loading state
65ms   → If !loading and user exists → renders HotelApp or VolunteerApp
70ms   → User sees either login page or dashboard
```

---

## 2. Provider Stack & Context Setup

### Why Nested Providers?

Each provider manages one aspect:

```
┌─ BrowserRouter
│  Manages URL routing, navigation
│  Provides useNavigate(), useLocation() hooks
│
├─ ThemeProvider
│  State: theme ('light' | 'dark')
│  localStorage key: 'foodconnect_theme'
│  Provides: useTheme() hook
│
├─ SettingsProvider
│  State: user preferences
│  localStorage key: 'foodconnect_settings'
│  Provides: useSettings() hook
│
├─ AuthProvider
│  State: user, hotelProfile, loading
│  localStorage key: 'foodconnect_session', 'foodconnect_token'
│  Provides: useAuth() hook
│  Methods: login, register, logout, demoLogin
│
└─ DonationProvider
   State: donations, loading
   localStorage key: 'foodconnect_donations'
   Provides: useDonations() hook
   Syncs with: backend via API
```

### Provider Order Matters!

```
✅ CORRECT ORDER:
Router → Theme → Settings → Auth → Donations → App
       (outer)                          (inner)

Why?
- Auth depends on Theme (dark mode in login)
- Donations depends on Auth (needs user token)
- App depends on all (all hooks available)
```

### How Providers Work Internally

Each provider is a context + component:

```typescript
// Pattern used for all providers
const MyContext = createContext<MyContextType | undefined>(undefined);

export const useMyContext = () => {
  const context = useContext(MyContext);
  if (!context) throw new Error('Must be within Provider');
  return context;
};

export const MyProvider: React.FC<{children}> = ({ children }) => {
  const [state, setState] = useState(initialValue);

  useEffect(() => {
    // Initialize state
  }, []);

  const methods = {
    action1: () => setState(...),
    action2: () => setState(...)
  };

  return (
    <MyContext.Provider value={{ state, ...methods }}>
      {children}  // All child components rendered here
    </MyContext.Provider>
  );
};
```

---

## 3. AuthContext Deep Dive

### Architecture

```
┌─────────────────────────────────────────┐
│        AuthContext (createContext)      │
├─────────────────────────────────────────┤
│ Provides:                               │
│  - user: User | null                    │
│  - hotelProfile: Hotel | null           │
│  - loading: boolean                     │
│  - login()                              │
│  - register()                           │
│  - logout()                             │
│  - demoLogin()                          │
│  - updateProfile()                      │
└─────────────────────────────────────────┘
           ↑
      Provided by
           ↓
┌─────────────────────────────────────────┐
│       AuthProvider Component            │
├─────────────────────────────────────────┤
│ useState:                               │
│  - user                                 │
│  - hotelProfile                         │
│  - loading                              │
│                                         │
│ useEffect:                              │
│  - On mount: read session from storage  │
│  - On logout: clear storage             │
└─────────────────────────────────────────┘
           ↓
      Wraps
           ↓
     All child components
     (can use useAuth hook)
```

### Detailed Flow: Login

```
User enters credentials and clicks "Login"
    ↓
[LoginPage.handleSubmit() called]
    ↓
await login(role, identifier, password)
    ↓
[AuthContext.login() method executes]
    ├─ Calls apiRequest('/auth/login', {
    │   method: 'POST',
    │   body: JSON.stringify({
    │     role: 'hotel' or 'volunteer',
    │     identifier: email/phone,
    │     password: password
    │   })
    │ })
    ├─ Sends HTTP POST to backend
    │
    └─ Backend validates & responds:
       {
         token: "jwt_token_abc123",
         user: {
           id: "user_123",
           name: "John Doe",
           email: "john@hotel.com",
           role: "hotel",
           phone: "9999999999",
           hotelName: "My Hotel"
         },
         hotelProfile: {
           id: "hotel_123",
           hotelName: "My Hotel",
           address: "123 Main St"
         }
       }
    ↓
[setSession(response) called]
    ├─ setUser(response.user)
    │  └─ Updates React state → triggers re-render
    ├─ setHotelProfile(response.hotelProfile)
    │  └─ Updates React state → triggers re-render
    └─ persistSession(response)
       └─ Saves to localStorage('foodconnect_session')
       └─ Saves to localStorage('foodconnect_token')
    ↓
[App component re-renders]
    ├─ useAuth() returns user object (no longer null)
    ├─ user.role === 'hotel' check passes
    └─ Renders <HotelApp /> instead of <LoginPage />
    ↓
[Router navigates to /app]
    ↓
User sees Hotel Dashboard
```

### Code Example: Complete Login Flow

```typescript
// Step 1: User clicks submit in LoginPage
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  try {
    await login(role, identifier, password);
    // If no error thrown, login succeeded
    // useAuth() in other components now returns user state
  } catch (err) {
    setError(err.message);
  }
};

// Step 2: AuthContext.login() executes
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [hotelProfile, setHotelProfile] = useState(null);
  
  const login = async (role, identifier, password) => {
    // Make API call
    const response = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ role, identifier, password })
    });
    
    // Update state & storage
    setSession(response);
  };
  
  const setSession = (response) => {
    // 1. Update React state
    setUser(response.user);           // Triggers re-render
    setHotelProfile(response.hotelProfile);
    
    // 2. Save to localStorage
    persistSession(response);
  };
};

// Step 3: Any component using useAuth gets new state
export const useAuth = () => {
  const context = useContext(AuthContext);
  return context; // Now has { user, hotelProfile, login, logout, ... }
};

// Step 4: HotelApp component receives new user via hook
const HotelApp = () => {
  const { user } = useAuth(); // Gets updated user state
  // Can now use user.name, user.hotelName, etc.
};
```

### Session Persistence

```
localStorage structure after login:
{
  "foodconnect_session": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": "user_123",
      "name": "John Doe",
      "email": "john@hotel.com",
      "role": "hotel",
      "phone": "9999999999",
      "hotelName": "My Hotel"
    },
    "hotelProfile": {
      "id": "hotel_123",
      "hotelName": "My Hotel",
      "address": "123 Main St, Mumbai"
    }
  },
  "foodconnect_token": "eyJhbGciOiJIUzI1NiIs..."
}
```

### On Page Refresh

```
User has session in localStorage
    ↓
Page refreshes (F5)
    ↓
main.tsx executes again
    ↓
AuthProvider component renders
    ↓
useEffect hook runs on mount
    ├─ const session = readSession()
    │  └─ localStorage.getItem('foodconnect_session')
    ├─ if (session?.user) {
    │    setUser(session.user)    // Restore user
    │  }
    └─ setLoading(false)
    ↓
App checks: if (loading) → show spinner
    ↓
App checks: if (user) → show dashboard (not login)
    ↓
User sees seamless experience (no re-login needed)
```

---

## 4. DonationContext Deep Dive

### Architecture

```
DonationProvider handles:
1. Loading donations from backend
2. Caching donations in localStorage
3. Auto-syncing donations every 10s
4. Handling operations (create/edit/request/accept/complete)
```

### Initialization Flow

```
DonationProvider mounts
    ↓
useEffect runs:
    ├─ if (useBackend.current) {
    │   loadFromBackend()
    │   ├─ apiRequest('/donations')
    │   ├─ Maps API response to HotelDonation objects
    │   ├─ setDonations(mapped)
    │   └─ setLoading(false)
    │
    │   If fails:
    │   └─ useBackend.current = false
    │   └─ loadFromStorage()
    │
    └─ else {
       loadFromStorage()
       ├─ localStorage.getItem('foodconnect_donations')
       ├─ JSON.parse and set state
       └─ setLoading(false)
```

### Data Structure Transformation

```
API Response (from backend):
{
  id: "donation_123",
  hotelId: "hotel_456",
  hotelName: "Grand Hotel",
  hotelLat: 19.0176,
  hotelLng: 72.8562,
  title: "Biryani",
  description: "Fresh hot biryani",
  isVeg: false,
  weight: 50,
  quantityUnit: "kg",
  tags: ["veg", "hot"],
  status: "pending",
  timestamp: "2024-01-15T10:30:00Z",
  pickupWindow: "15mins",
  activeRequest: null,
  assignedVolunteer: null
}
    ↓
Mapped to HotelDonation:
{
  ...all above fields...
  plus: hotelAddress, hotelType, contactName, etc.
  hotelLocation gets geo-cached
  hotel name gets stored for future use
}
```

### Real-time Sync: Auto-Refresh

```
DonationProvider has useEffect that:
1. Sets up interval: every 10 seconds
2. On interval:
   ├─ if useBackend.current:
   │   └─ loadFromBackend()
   │       └─ apiRequest('/donations')
   │       └─ Compare new data with previous
   │       └─ If changed:
   │           └─ setDonations(newData)
   │           └─ Triggers re-render in all listening components
   │
   └─ if error:
       └─ Switch to localStorage fallback

3. Additional triggers:
   ├─ When user switches browser tabs:
   │   └─ Immediately sync (visibilitychange event)
   │
   └─ When localStorage changes in another tab:
       └─ Sync via storage event listener
```

### State Update Flow: Create Donation

```
Hotel user fills donation form in HotelApp
    ↓
Form submitted
    ↓
[DonationForm.handleSubmit()] called
    ├─ Validates form fields
    ├─ Creates FormData object with image
    └─ Calls apiRequest('/donations', {
         method: 'POST',
         body: formData
       })
    ↓
Backend creates donation in database
    ↓
Returns created donation object
    ↓
DonationContext receives response
    ├─ In auto-sync (10 second interval):
    │   └─ Next /donations call includes new donation
    │   └─ setDonations([...old, newDonation])
    │   └─ Triggers re-render
    │
    └─ All components using useDonations() hook:
        ├─ VolunteerMap gets new marker
        ├─ VolunteerDashboard updates available count
        └─ Hotel Dashboard shows confirmation
    ↓
User sees donation on map in real-time
```

### Complete Donation Lifecycle

```
PENDING (Hotel creates donation)
User submits form → backend saves → appears on volunteer map
    ↓
REQUESTED (Volunteer has requested pickup)
Volunteer clicks "Request Pickup" → donation.activeRequest = volunteer
    ↓
ASSIGNED (Hotel accepts the request)
Hotel clicks "Accept" → donation.assignedVolunteer = volunteer
    ↓
(Real-time tracking)
Volunteer location updates → shown on hotel map
    ↓
COMPLETED (Volunteer delivers, shows OTP)
Volunteer enters OTP → volunteer confirms pickup verified
Donation marked complete → removed from active map
    ↓
Data persists in history for analytics
```

---

## 5. API Request System

### How `apiRequest()` Works

```typescript
// src/lib/api.ts
const API_BASE_URL = 'http://127.0.0.1:8000';

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  // Step 1: Get token from localStorage
  const token = localStorage.getItem(TOKEN_STORAGE_KEY);

  // Step 2: Prepare request headers
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {})
  };

  // Step 3: Make fetch request
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers,
    ...options
  });

  // Step 4: Parse response
  const text = await response.text();
  let data = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = { message: text };
    }
  }

  // Step 5: Check for errors
  if (!response.ok) {
    let errorMessage = 'Request failed';
    if (data?.detail) errorMessage = data.detail;
    else if (data?.message) errorMessage = data.message;
    
    throw new Error(errorMessage);
  }

  // Step 6: Return typed data
  return data as T;
}
```

### Network Flow: Creating a Donation

```
HotelApp Component
    ↓
User submits DonationForm
    ↓
DonationForm.onSubmit(data)
    ├─ Form validation passes
    ├─ Creates FormData with image
    └─ Calls:
       await apiRequest('/donations', {
         method: 'POST',
         body: formData
       })
    ↓
apiRequest() executes:
    ├─ Gets token from localStorage
    │  token = "jwt_eyJhbGc..."
    │
    ├─ Sets headers:
    │  {
    │    'Content-Type': 'application/json',
    │    'Authorization': 'Bearer jwt_eyJhbGc...'
    │  }
    │
    ├─ fetch('http://localhost:8000/donations', {
    │   headers,
    │   method: 'POST',
    │   body: formData
    │ })
    │
    ↓ (Network request over HTTP)
    ↓
[FastAPI Backend] receives request
    ├─ Matches route: POST /donations
    ├─ Extracts JWT from header
    ├─ Verifies token validity
    ├─ Gets user from token
    ├─ Validates form data
    ├─ Saves to PostgreSQL database
    └─ Returns created donation:
       {
         id: "donation_123",
         hotelId: "hotel_456",
         title: "Biryani",
         ...
       }
    ↓
Response comes back to browser
    ↓
apiRequest() receives response:
    ├─ response.ok === true
    ├─ Parses JSON
    └─ Returns data to caller
    ↓
DonationForm receives donation object
    ├─ Shows success notification
    ├─ Clears form
    └─ Closes modal
    ↓
DonationProvider auto-sync (10 sec):
    ├─ Next poll: /donations
    ├─ Gets all donations including new one
    ├─ Updates state
    └─ Components re-render
    ↓
Volunteer maps update:
    ├─ New donation appears as marker
    └─ Visible to all volunteers in real-time
```

### Error Handling

```typescript
try {
  const response = await apiRequest('/donations', {
    method: 'POST',
    body: formData
  });
  // Success: response is the data
  console.log(response.id); // Works!
} catch (error) {
  // Error: thrown with message
  console.error(error.message); // Shows meaningful error
  // Example errors:
  // "Field validation failed: title is required"
  // "Unauthorized - token expired"
  // "Database connection failed"
}
```

---

## 6. Routing & Navigation

### React Router Setup

```
BrowserRouter wraps App
    ↓
App contains Routes component
    ↓
Routes contain multiple Route components
    ↓
Each Route maps path → component
    ↓
Router listens to URL changes
    ↓
Renders matching component
```

### Route Logic

```typescript
const App = () => {
  const { user, loading } = useAuth();

  if (loading) return <Spinner />;

  return (
    <Routes>
      {/* Public Routes */}
      <Route 
        path="/" 
        element={!user ? <LandingPage /> : <Navigate to="/app" />} 
      />
      {/* If user exists, redirect / → /app */}

      <Route 
        path="/login" 
        element={!user ? <LoginPage /> : <Navigate to="/" />} 
      />
      {/* If user exists, redirect /login → / */}

      {/* Protected Routes */}
      <Route
        path="/app/*"
        element={
          !user ? (
            <Navigate to="/login" />
          ) : user.role === 'hotel' ? (
            <HotelApp />
          ) : (
            <VolunteerApp />
          )
        }
      />
      {/* If no user, redirect /app → /login */}
      {/* If user is hotel, show HotelApp */}
      {/* If user is volunteer, show VolunteerApp */}

      {/* Fallback */}
      <Route 
        path="*" 
        element={<Navigate to={user ? '/app' : '/'} />} 
      />
    </Routes>
  );
};
```

### Routing Flow Example: Login Process

```
User starts on /login (LoginPage)
    ↓
User fills form & submits
    ↓
await login(role, identifier, password)
    ↓
[AuthProvider.login()] executes
    ├─ API call to /auth/login
    ├─ Backend validates credentials
    ├─ Returns user object with role='hotel'
    ├─ setSession(response)
    │  ├─ setUser(response.user)      // user is no longer null
    │  └─ persistSession(response)    // Save to localStorage
    ↓
[App component re-renders]
    ├─ useAuth() now returns { user: {...} }
    ├─ user exists! So:
    │  └─ Routes re-evaluate
    │  └─ <Route path="/login"> checks: !user ? → FALSE
    │  └─ So LoginPage doesn't render
    │
    ├─ <Route path="/app/*"> checks: !user ? → FALSE
    │  └─ user.role === 'hotel' ? → TRUE
    │  └─ <HotelApp /> renders
    │
    └─ Browser URL stays at /login but HotelApp renders
       (because Routes changed what's displayed)
    ↓
Now user manually navigates or code calls navigate()
    ↓
useNavigate hook: const navigate = useNavigate()
    ├─ navigate('/app')  // Go to /app
    │
    └─ Browser updates URL to /app
       React Router sees URL /app
       Routes match /app/* → <HotelApp />
    ↓
User sees HotelApp dashboard at /app URL
```

### Protected Route Pattern

```
Frontend routes at: /app/dashboard, /app/donations, /app/map, etc.
    ↓
All behind:
  if (!user) {
    <Navigate to="/login" />
  }
    ↓
Backend ALSO protects:
  Every endpoint checks JWT token
  If invalid/missing → 401 Unauthorized
    ↓
Frontend + Backend together = secure
```

---

## 7. Component Lifecycle & Rendering

### Example: VolunteerDashboard Component Lifecycle

```typescript
const VolunteerDashboard = ({ onGoToMap, availableCount = 0 }) => {
  const { user } = useAuth();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);

  // STEP 1: Component mounts
  useEffect(() => {
    const fetchStats = async () => {
      // STEP 2: Initial load
      if (!user?.id) return;  // Don't fetch if no user
      
      try {
        // STEP 3: Make API call
        const data = await apiRequest(`/users/${user.id}/stats`);
        // STEP 4: Update state with response
        setStats(data);
      } catch (error) {
        // STEP 5: Handle error gracefully
        setStats({
          userId: user.id,
          mealsRescued: 0,
          hoursVolunteered: 0,
          totalWeight: 0,
          completedPickups: 0,
          score: 0,
          rating: 4.9,
        });
      } finally {
        // STEP 6: Stop loading
        setLoading(false);
      }
    };

    fetchStats();
  }, [user?.id]);  // Re-run if user.id changes

  // STEP 7: Render loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center p-8 min-h-[400px]">
        <Loader2 className="animate-spin text-forest-600 w-10 h-10" />
        <p className="text-sm font-bold text-stone-400">Loading...</p>
      </div>
    );
  }

  // STEP 8: Render actual content
  return (
    <motion.div className="...">
      <h1>Good afternoon, {user?.name}.</h1>
      <StatCard title="Meals Rescued" value={stats?.mealsRescued} />
      <StatCard title="Hours Logged" value={`${stats?.hoursVolunteered}h`} />
      {/* More JSX... */}
    </motion.div>
  );
};
```

### Complete Component Lifecycle Diagram

```
Component First Mounts
    ↓
render() [Return JSX]
    ↓
DOM updated [browser paints]
    ↓
useEffect hooks run [AFTER render]
    ├─ useEffect for data fetching
    │  ├─ Make API call
    │  ├─ setState when response arrives
    │  └─ [triggers re-render]
    │
    ├─ useEffect for subscriptions
    │  ├─ addEventListener, subscribe to events
    │  └─ return cleanup function
    │
    └─ useEffect for side effects
       └─ Analytics, logging, etc.
    ↓
New render [with new state]
    ↓
DOM updated [browser paints with new data]
    ↓
Component lifetime continues
    ├─ Re-renders when:
    │  ├─ Props change
    │  ├─ State changes (setState called)
    │  └─ Parent component re-renders
    │
    └─ useEffect runs when dependencies change []
    │
    └─ Return cleanup() on unmount
    ↓
Component unmounts
    ↓
cleanup() functions called [reverse order]
    ├─ removeEventListener
    ├─ unsubscribe from sources
    └─ clear timers/intervals
```

---

## 8. State Management Flow

### Global State Architecture

```
localStorage (Persistent)
    ↓
AuthContext ← readSession() on app start
    ├─ user
    ├─ hotelProfile
    ├─ token (JWT)
    └─ methods: login, register, logout
    ↓
(Used by every authenticated component)

DonationContext ← loadFromBackend() / loadFromStorage()
    ├─ donations[] array
    ├─ loading state
    └─ methods: addDonation, acceptRequest, etc.
    ↓
(Used by maps, dashboards, donation displays)

ThemeContext
    ├─ theme ('light' | 'dark')
    └─ toggleTheme()
    ↓
(Used by all components for dark mode)

SettingsContext
    ├─ userSettings object
    └─ updateSettings()
    ↓
(Used by preferences/settings pages)
```

### How State Flows to Components

```
Context created with value:
{
  donations: [
    { id: '1', title: 'Biryani', status: 'pending' },
    { id: '2', title: 'Samosa', status: 'assigned' }
  ],
  loading: false,
  requestPickup: async (donationId) => {...}
}
    ↓
Provider wraps all components
    ↓
Component A:
  const { donations } = useDonations()
    ├─ Gets donations from context
    └─ Re-renders when donations changes
    
Component B:
  const { donations } = useDonations()
    ├─ Gets SAME donations from context
    └─ Also re-renders when donations changes
    
Component C:
  const { donations, requestPickup } = useDonations()
    ├─ Can read AND modify donations
    └─ When calls requestPickup():
       ├─ Donations state updates
       ├─ Component A & B notified
       └─ All re-render with new data
```

### State Update Propagation

```
User action (click button)
    ↓
Event handler called
    ↓
Call context method: await donations.requestPickup(id)
    ↓
Context method executes:
    ├─ makeAPIRequest
    ├─ serverResponds with updated donation
    └─ setState(newDonations)  ← TRIGGERS RE-RENDERS
    ↓
React batches updates:
    ├─ Old: donations = [...]
    └─ New: donations = [..., { id, status: 'requested' }]
    ↓
All components using useDonations() are notified:
    ├─ VolunteerMap re-renders
    │  └─ Marker changes color
    │
    ├─ DonationSheet re-renders
    │  └─ Button text changes
    │
    └─ HotelRequests re-renders
       └─ Shows new request in list
    ↓
User sees instant updates across app
(no need to refresh or manually sync)
```

---

## 9. Form Handling System

### Example: Donation Form Submission

```typescript
const DonationForm = ({ onClose }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    weight: '',
    tags: [],
    image: null
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { user } = useAuth();
  const { addDonation } = useDonations();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    // Update formData state
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData(prev => ({
        ...prev,
        image: file
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();  // Prevent page reload
    setError('');
    setIsLoading(true);  // Show loading state

    try {
      // Validation
      if (!formData.title.trim()) {
        throw new Error('Title is required');
      }
      if (!formData.weight) {
        throw new Error('Weight is required');
      }

      // Create FormData for file upload
      const fd = new FormData();
      fd.append('title', formData.title);
      fd.append('weight', formData.weight);
      fd.append('description', formData.description);
      fd.append('tags', JSON.stringify(formData.tags));
      if (formData.image) {
        fd.append('image', formData.image);
      }

      // Call API through context
      await apiRequest('/donations', {
        method: 'POST',
        body: fd
      });

      // Success!
      sendLocalNotification('success', 'Donation created');
      onClose();  // Close modal
      // addDonation will be updated by auto-sync
    } catch (err) {
      setError(err.message);
      sendLocalNotification('error', 'Failed to create donation', err.message);
    } finally {
      setIsLoading(false);  // Stop loading
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input
        type="text"
        name="title"
        placeholder="Donation title"
        value={formData.title}
        onChange={handleInputChange}
        disabled={isLoading}
      />

      <input
        type="number"
        name="weight"
        placeholder="Weight in kg"
        value={formData.weight}
        onChange={handleInputChange}
        disabled={isLoading}
      />

      <textarea
        name="description"
        placeholder="Description"
        value={formData.description}
        onChange={handleInputChange}
        disabled={isLoading}
      />

      <input
        type="file"
        accept="image/*"
        onChange={handleImageUpload}
        disabled={isLoading}
      />

      {error && <p className="text-red-500">{error}</p>}

      <button
        type="submit"
        disabled={isLoading}
        className={isLoading ? 'opacity-50' : ''}
      >
        {isLoading ? 'Creating...' : 'Create Donation'}
      </button>
    </form>
  );
};
```

### Form State Flow

```
Initial State:
formData = {
  title: '',
  description: '',
  weight: '',
  tags: [],
  image: null,
  isLoading: false,
  error: ''
}

User types in title input:
    ↓
onChange event fires
    ↓
handleInputChange({ target: { name: 'title', value: 'Biryani' } })
    ↓
setFormData(prev => ({ ...prev, title: 'Biryani' }))
    ↓
React updates state
    ↓
Component re-renders
    ↓
Input now shows 'Biryani'

User clicks submit:
    ↓
handleSubmit called
    ↓
e.preventDefault() stops page reload
    ↓
setIsLoading(true)
    ↓
Component re-renders, button shows "Creating..."
    ↓
Validation checks pass
    ↓
FormData object created with fields
    ↓
await apiRequest('/donations', {
  method: 'POST',
  body: fd
})
    ↓
Browser sends multipart/form-data to backend
    ↓
Backend saves donation, returns { id, ... }
    ↓
try block completes
    ↓
finally block: setIsLoading(false)
    ↓
Component re-renders, button enabled again
    ↓
onClose() modal closes
    ↓
DonationProvider auto-sync (10s):
    ↓
Fetches /donations again
    ↓
New donation appears in array
    ↓
Components using useDonations() re-render
    ↓
User sees donation on map
```

---

## 10. Real-time Updates & Sync

### Auto-Refresh Mechanism

```
DonationProvider has:
useEffect(() => {
  let intervalId = setInterval(() => {
    if (useBackend.current && document.hidden === false) {
      loadFromBackend()
      // Fetches /donations
      // Compares hash with previous
      // If changed: setDonations(newData)
    }
  }, 10000);  // Every 10 seconds

  return () => clearInterval(intervalId);
}, []);
```

### Sync Triggers

```
1. Page Visibility
   User switches to another tab
    ↓
   visibilitychange event fires
    ↓
   if (document.hidden === false) {
     loadFromBackend()  // Immediate sync
   }
    ↓
   User returns to tab → data is fresh

2. Storage Events (multi-tab sync)
   Tab A: User creates donation
    ↓
   localStorage updated
    ↓
   storage event fires in Tab B
    ↓
   Tab B: reads new localStorage
    ↓
   Tab B: updates donations state
    ↓
   Tab B: map updates instantly

3. Interval (10 seconds)
   Timer every 10 seconds
    ↓
   Fetch fresh donations from backend
    ↓
   Compare with cached
    ↓
   If different: update state
    ↓
   All listeners notified
```

### Hash-Based Change Detection

```
Previous donations state:
{
  id: '1',
  status: 'pending',
  weight: 50,
  activeRequest: null
}

Create previousHash:
JSON.stringify([{id, status, weight, activeRequest}])
→ '[{"id":"1","status":"pending","weight":50,"activeRequest":null}]'

New fetch returns SAME data

Create currentHash:
JSON.stringify([{id, status, weight, activeRequest}])
→ '[{"id":"1","status":"pending","weight":50,"activeRequest":null}]'

Compare:
previousHash === currentHash
→ TRUE! No change detected
→ setDonations NOT called
→ No re-render (optimization!)

Now hotel accepts volunteer request:
New fetch returns:
{
  id: '1',
  status: 'assigned',  // ← CHANGED
  weight: 50,
  activeRequest: { id: 'vol_123', name: 'John' }  // ← CHANGED
}

Create currentHash:
→ '[{"id":"1","status":"assigned","weight":50,"activeRequest":{"id":"vol_123"}}]'

previousHash !== currentHash
→ TRUE! Change detected
→ setDonations(newData)
→ All listeners re-render
```

---

## 11. LocalStorage Management

### Storage Keys

```
foodconnect_session
{
  token: "jwt...",
  user: {...},
  hotelProfile: {...}
}
    ↓
Accessed by: AuthContext
    ↓
Cleared on: logout()

foodconnect_token
"jwt..."
    ↓
Accessed by: apiRequest() adds to Authorization header
    ↓
Cleared on: logout()

foodconnect_donations
[
  { id: '1', title: 'Biryani', ... },
  { id: '2', title: 'Samosa', ... }
]
    ↓
Accessed by: DonationContext (fallback)
    ↓
Updated on: DonationProvider auto-sync

foodconnect_donations_version
"city-realistic-v1"
    ↓
Used to detect if storage needs refresh
    ↓
If version mismatch: clear donations

foodconnect_theme
"light" or "dark"
    ↓
Accessed by: ThemeContext
    ↓
Updated on: toggleTheme() call

foodconnect_settings
{
  notifications: true,
  language: 'en',
  ...
}
    ↓
Accessed by: SettingsContext
    ↓
Updated on: updateSettings()
```

### Storage Write Flow

```
AuthContext:
  setSession(response)
    ├─ persistSession(response)
    │  ├─ localStorage.setItem('foodconnect_session', JSON.stringify(payload))
    │  └─ localStorage.setItem('foodconnect_token', payload.token)
    │
    └─ Executes immediately
       (before API response is returned to caller)

DonationContext:
  useEffect listens to donations state
    ├─ if (donations.length > 0) {
    │   writeToStorage(donations)
    │ }
    │
    └─ Happens AFTER state update
       (Batch: multiple donations → single write)
```

### Session Recovery

```
User loses internet connection
    ↓
apiRequest('/donations') fails
    ↓
DonationProvider catches error
    ↓
useBackend.current = false  // Switch to offline mode
    ↓
loadFromStorage()
    ↓
Components still render with cached donations
    ↓
User can still interact with app (limited)

User regains internet
    ↓
Can refresh page or wait for next auto-sync attempt
    ↓
DonationProvider tries backend again
    ↓
useBackend.current = true  // Switch back online
    ↓
Syncs fresh data
```

---

## 12. Error Handling & Notifications

### Error Flow

```
User action triggers API call
    ↓
apiRequest throws Error
    ↓
Try-catch block catches
    ↓
Extract error message:
  - Check error.detail (field-specific)
  - Check error.message (general)
  - Check response.statusText (HTTP)
    ↓
Set error state: setError(message)
    ↓
Component renders error UI:
  {error && <p className="text-red-500">{error}</p>}
    ↓
User sees human-readable error
    ↓
Finally block: setIsLoading(false)
    ↓
User can retry
```

### Notification System

```
sendLocalNotification(type, title, message)
    ├─ type: 'success' | 'error' | 'info' | 'request_accepted'
    ├─ title: string
    └─ message: string
    ↓
Creates toast notification:
  ├─ Shows in ToastViewport component
  ├─ Auto-dismisses after 5 seconds
  │  (or on click)
  ├─ Styled with Tailwind
  │  (green for success, red for error)
    └─ Alert sound plays for critical notifications
```

### API Error Example

```typescript
try {
  await login(role, identifier, password);
  // Success: navigate to dashboard
  navigate('/app');
} catch (error) {
  // Error handling
  const message = error.message;
  // Examples:
  // "Invalid credentials"
  // "Email validation failed"
  // "User not found"

  setError(message);  // Show on screen
  
  sendLocalNotification(
    'request_rejected',
    'Login Failed',
    message
  );  // Show toast
}
```

---

## Complete App Flow: User Experience

### Scenario: New Volunteer Using App

```
0s   → User visits foodconnect.com
       ↓
2s   → main.tsx loads
       ↓
5s   → Provider stack initializes
       ├─ ThemeProvider reads theme preference
       ├─ AuthProvider checks localStorage for session
       │  └─ No session found (new user)
       ├─ DonationProvider tries /donations
       │  └─ Fails (not authenticated)
       │  └─ Falls back to empty localStorage
       └─ App renders
       ↓
10s  → LandingPage shown (public)
       ↓
User clicks "Sign Up as Volunteer"
       ↓
Navigate to /login
       ↓
15s  → LoginPage renders in signup mode
       ↓
User fills form:
  - Name: "John"
  - Phone: "9999999999"
  - Age: "25"
  - Vehicle: "Bike"
  - Password: "secure_password"
       ↓
User clicks "Create Account"
       ↓
handleSubmit() calls register(
  'volunteer',
  { name, phone, age, vehicle },
  password
)
       ↓
apiRequest('/auth/register', {
  method: 'POST',
  body: { ... }
})
       ↓
20s  → Backend creates user in database
       ↓
Returns response:
{
  token: "jwt_...",
  user: {
    id: "user_123",
    name: "John",
    phone: "9999999999",
    role: "volunteer"
  }
}
       ↓
setSession(response)
       ├─ setUser(response.user)
       ├─ localStorage.setItem('foodconnect_session', ...)
       └─ localStorage.setItem('foodconnect_token', ...)
       ↓
22s  → App re-renders
       ├─ useAuth() returns { user: {...}, loading: false }
       ├─ user exists and role === 'volunteer'
       └─ Routes render <VolunteerApp />
       ↓
25s  → VolunteerApp mounts
       ├─ DonationProvider auto-sync fires immediately
       │  ├─ apiRequest('/donations')
       │  ├─ Token automatically added to header
       │  └─ Returns all available donations
       │
       ├─ VolunteerMap mounts
       │  ├─ Renders Leaflet map
       │  └─ Sets donation markers
       │
       └─ VolunteerDashboard useEffect fires
          ├─ apiRequest(`/users/user_123/stats`)
          └─ Renders stats (0 meals, 0 hours)
       ↓
30s  → User sees full VolunteerApp interface
       ├─ Sidebar with menu
       ├─ Map with donation markers
       ├─ Available pickup count
       └─ "Request Pickup" button
       ↓
User sees donation on map, clicks it
       ↓
onSelectMarker(donationId) called
       ↓
selectedId state updates
       ↓
DonationSheet opens with donation details
       ├─ Title, weight, hotel name
       ├─ "Request Pickup" button highlighted
       └─ Distance and ETA shown
       ↓
User clicks "Request Pickup"
       ↓
handleRequestPickup(donationId) called
       ↓
apiRequest(`/donations/${donationId}/request`, {
  method: 'POST',
  body: { volunteerId: "user_123" }
})
       ↓
Backend:
  ├─ Updates donation status: pending → requested
  ├─ Sets activeRequest: { id, name, phone }
  └─ Returns updated donation
       ↓
35s  → DonationProvider auto-sync (10s interval)
       ├─ apiRequest('/donations')
       ├─ Gets donation with status: 'requested'
       └─ setDonations(updated)
       ↓
All components re-render:
  ├─ VolunteerMap marker color changes
  ├─ DonationSheet shows "Request Pending"
  └─ Hotel sees request in Requests page
       ↓
Hotel clicks "Accept"
       ↓
Backend updates donation:
  ├─ status: requested → assigned
  ├─ assignedVolunteer: john_volunteer_object
  └─ Returns updated donation
       ↓
40s  → Next auto-sync
       ├─ Volunteer's map updates
       ├─ "Request Pending" → "En Route"
       ├─ Shows hotel location & directions
       └─ Tracking starts
       ↓
Volunteer navigates to hotel
       ↓
When at hotel, hotel shows OTP: "1234"
       ↓
Volunteer enters OTP in app
       ↓
apiRequest(`/donations/${donationId}/verify?code=1234`, {
  method: 'POST'
})
       ↓
Backend verifies OTP:
  ├─ status: assigned → completed
  ├─ Removes from active donations
  └─ Updates volunteer stats
       ↓
45s  → Volunteer app updates
       ├─ Notification: "✅ Pickup confirmed!"
       ├─ Meals Rescued: 0 → 1
       ├─ Hours Volunteered: 0 → 0.5
       └─ Donation removed from map
       ↓
Volunteer sees real-time impact update
       ↓
Data persists in localStorage
       ↓
User refreshes page
       ↓
Session restored from localStorage
       ├─ Auth loads immediately
       ├─ No re-login needed
       └─ Donations cached and shown instantly
       ↓
User is back where they left off
```

---

## Quick Reference: File Execution Order

```
1. index.html loads <div id="root"></div>
2. main.tsx executes
3. ReactDOM.createRoot() + .render()
4. Provider stack depth-first traversal:
   - BrowserRouter renders
   - ThemeProvider renders
   - SettingsProvider renders
   - AuthProvider renders
     ├─ useState hooks initialize
     ├─ useEffect runs
     └─ Reads localStorage session
     ├─ DonationProvider renders
       ├─ useState hooks initialize
       ├─ useEffect runs
       └─ Attempts backend load / fallback
   - App component renders
5. App checks loading state
   ├─ if (loading) return <Spinner />
   └─ else return <Routes>
6. Routes match current URL
   ├─ /login → LoginPage
   ├─ /app → HotelApp or VolunteerApp
   └─ / → LandingPage
7. Matched component renders
8. Browser paints to screen
9. useLayoutEffect hooks run
10. useEffect hooks run (after paint)
11. Event listeners attached
12. App is interactive
```

---

## Key Takeaways

### How It All Works Together

1. **Authentication** - AuthContext manages user session via JWT + localStorage
2. **Data Fetching** - DonationProvider auto-syncs every 10 seconds
3. **Routing** - React Router shows different interfaces based on user role
4. **State Management** - Context API distributes state to all components via hooks
5. **Real-time Sync** - All components automatically update when data changes
6. **Offline Support** - Falls back to localStorage if backend unavailable
7. **Error Handling** - API errors caught and displayed to user
8. **Notifications** - Toast notifications inform user of actions
9. **Persistence** - Data survives page refresh via localStorage
10. **Role-Based Access** - Frontend & backend both enforce user permissions

### Component Communication Pattern

```
User Action
    ↓
Event Handler
    ↓
Call Context Method
    ↓
Context makes API call
    ↓
API updates backend
    ↓
Context setState()
    ↓
All listeners notified
    ↓
Components re-render
    ↓
User sees update
```

### State Hierarchy

```
Browser localStorage (persistent disk)
    ↓
Context state in memory (React state)
    ↓
Component useState hooks (local state)
    ↓
DOM (rendered HTML)
```

### Data Flow Direction

```
Backend Database
    ↓
API endpoint (/donations, /auth, etc.)
    ↓
apiRequest() HTTP call
    ↓
Context receives and setState()
    ↓
Components useContext() hook
    ↓
Components re-render with new data
    ↓
User sees updated UI
```

This is the complete working of FoodConnect frontend - every component, every flow, every mechanism explained in depth! 🎯
