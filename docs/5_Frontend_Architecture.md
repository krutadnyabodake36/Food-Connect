# FoodConnect Frontend Architecture

The FoodConnect frontend is built to deliver a highly interactive, location-aware, and responsive Single Page Application (SPA). It uses modern React paradigms to ensure seamless coordination between donors, volunteers, and the backend database.

## 1. Core Frameworks & Tooling

*   **React 18**: The foundational UI library leveraging modern functional components and hooks (`useState`, `useEffect`, `useContext`) for reactive data binding.
*   **TypeScript (v5+)**: Enforces strict typing for API responses and component props, preventing runtime errors (e.g., ensuring a `Volunteer` object type always has `latitude` and `longitude`).
*   **Vite**: The build tool of choice, providing instantaneous Hot Module Replacement (HMR) during development and heavily optimized, minified bundles for production deployment.

## 2. Directory & Component Architecture

The `src/` directory is logically separated by feature domain rather than purely by file type, ensuring scalability:

*   **`src/components/hotel/`**: Contains hotel-specific UI shards (e.g., `DonationForm`, `PendingRequestsTable`, `OTPInputModal`).
*   **`src/components/volunteer/`**: Contains volunteer-specific map and tracking UIs (e.g., `LiveMapContainer`, `LeafletClusterPin`, `NavigationHUD`).
*   **`src/components/shared/`**: Reusable generic components (e.g., `Navbar`, `NotificationBell`, `AnimatedModal`, custom Form Inputs).
*   **`src/pages/`**: Top-level route components that assemble the smaller UI shards into full views (e.g., `HotelDashboard.tsx`, `VolunteerMap.tsx`).
*   **`src/contexts/`**: Centralized state managers (e.g., `AuthContext.tsx` handling the user session token, `ThemeContext.tsx` handling Dark/Light mode).

## 3. DBMS Integration & State Management

The frontend does not communicate directly with the PostgreSQL database. Instead, it interfaces through the Python/FastAPI backend layer.

*   **API Service Interceptors**: Custom Axios or Fetch wrapper functions handle attaching JWT tokens (or session IDs) to every outgoing request.
*   **Real-time Polling / WebSockets**: To mimic the instant "Accept/Reject" features, the frontend relies on structured API calls to check for state changes in the `claims_record` PostgreSQL table.
*   **Location Telemetry (Navigator API)**: 
    When a volunteer enters "Navigation Mode," the frontend utilizes the browser's native `navigator.geolocation.watchPosition()`. It captures standard coordinates and pushes them to the `/location/update` backend endpoint at regular intervals. 

## 4. Layouts & Protected Routing

Using a router (like `react-router-dom`), the application enforces strict Access Control Lists (ACLs) driven by the database `role` column.

*   **Authentication Gates**: When a user logs in, the `AuthContext` caches their profile.
*   **`HotelApp` Layout**: If `role === 'hotel'`, they are wrapped in a layout exposing the Donation History, ESG Reporting, and Active Inventory routes.
*   **`VolunteerApp` Layout**: If `role === 'volunteer'`, they are immediately routed to the Live Map interface and Gamification Dashboards.
*   Attempting to cross-access routes results in an immediate redirect to unauthorized/login fallback pages.

## 5. UI/UX Libraries

*   **Tailwind CSS**: Used for all styling. Allows for a highly bespoke design system (custom brand colors, glass-morphism effects) without leaving the component files. It also effortlessly configures the dark-mode switch.
*   **Framer Motion**: Orchestrates page transitions (e.g., sliding between the Map and the Settings page) and micro-interactions (e.g., pulsing animation on an active pending donation pin).
*   **React Leaflet**: Wraps the Leaflet.js library into React components, interacting directly with OpenStreetMap tiles and overlaying OSRM route lines.
*   **Recharts**: Renders the SVG-based charts in the volunteer's gamification dashboard and the hotel's ESG tracking portal.
