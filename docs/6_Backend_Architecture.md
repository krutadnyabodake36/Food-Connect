# FoodConnect Backend Architecture

The FoodConnect backend operates as a robust, high-performance API layer situated between the complex PostgreSQL database and the highly interactive React frontend. Designed entirely in Python, it ensures data integrity, performs rigorous business logic checks, and processes high-frequency geospatial location updates.

## 1. Core Framework

*   **FastAPI / Python (3.8+)**: Chosen for its async capabilities and exceptional performance. FastAPI handles massive concurrency effortlessly, which is critical when multiple volunteer apps concurrently ping the server with location telemetry updates every few seconds.
*   **Pydantic**: Heavily utilized for data validation and schema definition. Every incoming API request (e.g., registration payloads or new donation forms) is coerced into strict Pydantic models, guaranteeing malicious or malformed data never touches the database layer.

## 2. API Endpoint Domains

The API is segmented into dedicated logical router domains:

### **Auth & Identity Domain (`/auth`)**
Manages all user registrations, session creations, and role allocations securely without reliance on third-party backend-as-a-service providers.
*   `POST /auth/register`: Ingests user details, hashes the password via `PBKDF2`, stores the base user, and cascades the data into either the `hotel` or `volunteer` table.
*   `POST /auth/login`: Verifies credentials and issues session tokens. Evaluates whether to append `hotelProfile` or `volunteerProfile` details based on the user's mapped `role`.

### **Marketplace & Claims Domain (`/donations`)**
Coordinates the actual food lifecycle.
*   Handles the serialization of a "Donation Form" object from the frontend.
*   Executes complex SQL transactions: e.g., logging a volunteer's `pickup request`, setting the status as `PENDING`, and checking that a volunteer hasn't exceeded active claim limits.

### **Telemetry & Tracking Domain (`/location`)**
Specifically engineered to be non-blocking to handle high-frequency incoming coordinates.
*   `POST /location/update`: Accepts a `{latitude, longitude, volunteer_id}` payload and appends it to the `location_tracking` history table.
*   `GET /location/{donation_id}/latest`: Fetched rapidly by the Hotel dashboard to visually animate the incoming volunteer marker on their map.

## 3. Database Interaction mechanics

*   **Connection Driver**: Interactions with the PostgreSQL database occur via optimized python database drivers (either `psycopg2` or `SQLAlchemy` Core), leveraging connection pooling to avoid database blocking under high load.
*   **Encapsulation**: Raw SQL / ORM Queries are sequestered from the view logic into dedicated service layers. The API endpoints merely pass validated Pydantic objects to these services preventing SQL injection.

## 4. Security & Middleware Configurations

*   **CORS (Cross-Origin Resource Sharing)**: Configured strictly to only accept authenticated REST requests from the specific Vite React frontend domain.
*   **Cryptographic Verification**:
    *   Passwords are never stored in plaintext. Natively utilizing `werkzeug.security` or `passlib` for strong, salted hashing.
    *   Handoff verification (`pickup_hash`) utilizes dynamically generated One-Time Passwords stored in the `verification` linking table.

## 5. External API Orchestration

The backend acts as a secure bridge to sensitive third-party services that the frontend cannot call directly (to prevent exposing secret API Keys).
*   **Routing (OSRM)**: The backend relays coordinate sets to the Open Source Routing Machine to calculate optimal distances and ETAs without risking API key exposure.
*   **AI Integrations (Google Gemini)**: Processes images and metrics asynchronously, communicating with the Gemini LLM endpoints to structure the "Impact Video" JSON data, then relaying the structured output down to the user's browser.
