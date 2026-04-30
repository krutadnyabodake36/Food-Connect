# FoodConnect Security and Deployment Architecture

This document covers how the FoodConnect platform maintains data privacy, secures active food transactions, and how it is deployed for production usage.

## 1. Security Architecture & Data Privacy

FoodConnect prioritizes user security, specifically focusing on physical handoff verification, cryptographic hashing, and data masking.

### A. The Handoff Validation Protocol (OTP Security)
Preventing malicious food interception is critical. 
1. When a Hotel hits 'Accept' on a volunteer's request, the backend randomly generates a `pickup_hash` (a One-Time Password).
2. This code is inserted into the `verification` linking table mapped exactly to the active `claims_record`.
3. The Hotel's UI drops into an "Awaiting OTP" state. 
4. The backend securely transmits this code only to the authenticated Volunteer's app.
5. Only when the hotel inputs the exact code, verifying physical proximity, does the database release the `completed` state and issue gamification scores.

### B. Access Control & Authorization (JWT & Roles)
*   **PBKDF2 Password Hashing**: Passwords never touch the database in plaintext.
*   **JSON Web Tokens (JWT)**: Upon login, the backend issues an expiring JWT bearing the user's ID and `role` (Hotel or Volunteer).
*   **Role-Based Access Control (RBAC)**: Backend endpoint routes enforce middleware checks. E.g., a token bearing the `volunteer` role attempting to `POST` to `/donations/create` will immediately be rejected with a `403 Forbidden` err, preventing unauthorized writes.

### C. Form Validations & SQL Injection Prevention
*   **Frontend**: React uses controlled inputs to validate forms (e.g., ensuring food weight is `> 0`).
*   **Backend**: FastAPI leverages **Pydantic** models to rigorously sanitize incoming JSON bodies before they are touched by database processing.
*   **Database**: The `SQLAlchemy`/`psycopg2` libraries parameterize all raw SQL queries, fundamentally nullifying SQL Injection attack vectors.

---

## 2. Infrastructure & Deployment Architecture

FoodConnect is designed to be easily scalable and hostable on standardized platform infrastructure.

### A. Frontend Delivery Layer
*   **Environment**: The React/Vite application is compiled into static HTML/JS/CSS assets.
*   **Suggested Hosting (Vercel / Netlify / AWS S3)**: These global CDNs serve the application practically instantaneously.
*   **Features Engine**: Contains localized `.env` variables containing only safe public keys (e.g., MapBox tokens for Leaflet styling).

### B. Backend API Layer
*   **Environment**: Python ASGI (Asynchronous Server Gateway Interface) environment powered by **Uvicorn** scaling the FastAPI app.
*   **Suggested Hosting (Render / Heroku / AWS EC2)**: Instances that can maintain persistent connections necessary for the `/location/` polling endpoints.
*   **Secret Management**: Server-side `.env` stores critical secrets: `DATABASE_URL`, Cryptographic Salt, and the private Google Gemini API Key. These are never exposed to the frontend.

### C. Database Layer
*   **Relational Engine**: PostgreSQL (v12+).
*   **Hosting**: Can be deployed on managed Database-as-a-Service (DBaaS) providers like **Supabase**, **Amazon RDS**, or **Aiven**. 
*   **Durability**: Managed providers naturally provide data-at-rest encryption and automated snapshot backups preventing critical data loss of the `users` and `donations` tables.
