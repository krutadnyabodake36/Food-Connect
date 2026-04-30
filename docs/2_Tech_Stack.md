# FoodConnect Technology Stack

FoodConnect employs a modern, robust, and scalable technology stack designed to handle real-time geospatial data, strict transactional integrity, and cross-platform accessibility.

## 1. Frontend Technologies

The client-side architecture focuses on providing a responsive, native-app-like experience.

*   **React 18**: The core library for building dynamic, component-based user interfaces.
*   **TypeScript**: Adds reliable static typing across the entire frontend ecosystem, catching errors at compile-time.
*   **Vite**: Next-generation building tool, providing extremely rapid hot-module replacements and optimized production bundles.
*   **Tailwind CSS**: Utility-first CSS framework enabling rapid, highly customized, and fully responsive styling.
*   **Framer Motion**: powers the platform's micro-animations and smooth transition effects to improve user engagement.

## 2. Backend API Layer

A performant Python backend orchestrates business logic and location telemetry.

*   **FastAPI / Python (3.8+)**: Utilized for routing, handling authentication endpoints, and processing the high-frequency geographic location updates from volunteers.

## 3. Database Management System (DBMS) Layer

The core of data persistence relies heavily on a strictly normalized RDBMS.

*   **PostgreSQL (12+)**: The primary relational database used as the single source of truth.
    *   **psycopg2 / SQLAlchemy**: Python libraries managing database connections and Object-Relational Mapping (ORM) functions.

## 4. Geospatial & Mapping Services

Crucial for the logistics engine of the platform.

*   **Leaflet & React-Leaflet**: Open-source JavaScript libraries providing the interactive map interfaces for volunteers.
*   **OpenStreetMap**: Foundation mapping data.
*   **Supercluster**: Algorithmic library used for efficiently rendering dense clusters of food donation pins on the map without performance degradation.
*   **OSRM (Open Source Routing Machine)**: Used extensively by the backend/frontend to calculate turn-by-turn navigation, real-world road distances (vs. straight-line), and Estimated Time of Arrival (ETA).

## 5. Security & Authentication

Security is handled via custom backend implementations rather than third-party BaaS for maximum control.

*   **Custom Authentication Flow**: Managed securely within the PostgreSQL database structure (passwords encrypted via PBKDF2 hashing algorithms).
*   **Cryptographic OTPs**: Generates unique One-Time Passwords during the 'Acceptance' phase for physical handoff verification, preventing unauthorized food claims.

## 6. Real-Time Communication

*   **Location Telemetry API**: Custom endpoints (`/location/update`, `/location/{id}/latest`) handle polling updates (e.g., every 10 seconds) from the browser Geolocation API to visualize volunteer movement.
*   **Firebase Cloud Messaging (FCM)**: Utilized specifically for out-of-band, native-like Push Notifications alerting users of accepted claims or deliveries, even when the app is backgrounded.

## 7. AI & Analytics Integrations

*   **Google Gemini API**: Processes uploaded donation images and historical database metrics to generate qualitative "impact summaries" and marketing-ready video scripts for Hotel CSR teams.
*   **Recharts**: Charting library visualizing individual volunteer gamification data and global impact metrics.
*   **Google Sheets API**: Enables direct programmatic exporting of donation history for compliance auditing.
