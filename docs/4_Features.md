# FoodConnect Features & Functionalities

This document outlines the core functional capabilities provided to different user roles within the FoodConnect ecosystem.

## Part 1: Hotel & Restaurant Partner Portal

### 1. Active Donation Dashboards
Hotels control custom dashboards to actively register surplus food items. The form requires granular input, including categorical identifying tags, weight measurements, and constrained expiration/pickup windows enforcing food safety.

### 2. Live Request Management
Unlike blind queue systems, the Hotel evaluates incoming volunteer pickup requests intentionally. Dashboards provide contextual data on the volunteer (vehicle capacity, historical success scores), allowing the hotel to 'Accept' or 'Reject' specific drivers before a pickup is confirmed.

### 3. Cryptographic OTP Secure Handoff Protocol
The most critical feature to prevent malfeasance. Upon authorizing a pickup, the backend generates an un-spoofable 4-digit One-Time Password. The platform locks the transaction in an `accepted` state. Only when the physical volunteer arrives and provides the exact code to the hotel agent will the system resolve the state to `delivered`.

### 4. Live Telemetry Viewing
Once an assignment is accepted, the Hotel dashboard activates an embedded map tracking the live location of the incoming volunteer dynamically generated via backend tracking APIs in real-time.

### 5. AI Reporting & Audit Generation
*   **Export Tools:** Immediate functionality to output compliance-ready histories (`CSV` file formats or direct integrations onto Google Sheets instances) of all donation loads, weights, and dates.
*   **Gemini Integrations:** Generates marketing materials or impact summaries using an LLM to analyze the metadata surrounding high-profile donations.

---

## Part 2: Volunteer Portal

### 1. Geospatial Live Map Triage
Volunteers organize pickups via an interactive Leaflet mapping interface rather than lists. The system maps all available donations geo-spatially relative to their own position.
*   **Supercluster Technology:** To preserve Framerate speeds, large areas aggregating hundreds of food markers visually group together dynamically depending on zoom-level. 

### 2. True-Route Logistics Engine (OSRM)
Upon tapping a donation pin, an algorithm powered by Open Source Routing Machine computes the actual turn-by-turn road miles (as opposed to irrelevant point-to-point bird-flight miles), to generate an accurate Estimated Time of Arrival calculations before accepting claims.

### 3. Dedicated Navigation HUD
Once a request clears the Hotel's portal, the UI reorganizes into a driving companion mode displaying:
*   Real-Time location syncing to the backend.
*   Highly readable turn mechanics.
*   The prominently displayed 4-digit Handshake OTP pinned to the UI header.

### 4. Gamified Impact Analysis
All 'Delivered' payloads incrementally raise a volunteer’s point score natively housed in PostgreSQL triggers. The Volunteer Interface renders these lifetime scores into dynamic, visually rich charts leveraging `Recharts`, motivating continued activity.

---

## Part 3: Global System Elements

### 1. Robust State Management
Because interactions happen dynamically across multiple physical locations, the application automatically rerenders UI screens globally depending on Database row-state changes (transitioning statuses like `PENDING` -> `ACCEPTED`) managed through constant API polling loops.

### 2. FCM Push Notifications (Cross-Platform)
Using Firebase Cloud Messaging solely for notification routing allows phones to receive native push notifications instantly when key actions execute, even if a portal application tab is minimized or temporarily in the background.

### 3. Modern PWA/Mobile-First Access
Designed holistically utilizing styling frameworks like TailwindCSS yielding fully responsive configurations. Incorporates critical User Experience elements including native 'Dark-Mode' support built natively into contexts.
