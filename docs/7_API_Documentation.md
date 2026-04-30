# FoodConnect API Documentation

The FoodConnect RESTful API facilitates all communication between the web frontend and the PostgreSQL database. It handles user authentication, logistics calculations, and data transactions securely.

## 1. Authentication Endpoints Base (`/auth`)

These endpoints manage user identities securely without exposing raw data to the clients.

### **POST** `/auth/register`
*   **Description**: Registers a new user (Volunteer or Hotel) and initiates their respective sub-profiles in the database.
*   **Request Body**:
    ```json
    {
      "role": "hotel", 
      "password": "secure_password",
      "data": {
        "email": "hotel@example.com",
        "hotelName": "Hotel Paradise",
        "licenseNumber": "LIC-12345"
      }
    }
    ```
*   **Success Response (201 Created)**: Returns the newly generated `user_id` and an authorization JWT/Session Token.

### **POST** `/auth/login`
*   **Description**: Authenticates a user and returns their database profile.
*   **Request Body**: `{ "identifier": "hotel@example.com", "password": "password" }`
*   **Success Response (200 OK)**:
    ```json
    {
      "token": "eyJh...", 
      "user": { "id": "1", "role": "hotel", "hotelName": "Hotel Paradise" }
    }
    ```

## 2. Donation Marketplace Endpoints (`/donations`)

Manages the core state machine of food packages.

### **POST** `/donations/create`
*   **Description**: Allows a hotel to list a new surplus food package.
*   **Payload**: `{ "total_wt": 15, "tags": ["rice", "curry"], "exp_time": "2024-12-01T15:00:00Z" }`
*   **Database action**: Inserts into `donations` and `donation_tags` acting as an atomic transaction.

### **GET** `/donations/pending`
*   **Description**: Fetches all active donations for the volunteer map.
*   **Query Params**: `?lat=19.0760&lon=72.8777&radius=10`
*   **Response**: Returns an array of available donations with calculated distances using the OSRM engine.

### **POST** `/donations/{d_id}/claim`
*   **Description**: A volunteer attempts to claim a pending donation.
*   **Database Action**: Inserts a row into `claims_record` with status `pending_approval`.

### **POST** `/donations/{c_id}/accept`
*   **Description**: Hotel accepts a volunteer's claim.
*   **Database Action**: Updates `claims_record` status. Generates and stores the cryptographic OTP in the `verification` table.

## 3. Real-Time Telemetry Endpoints (`/location`)

Engineered for extreme high-frequency polling.

### **POST** `/location/update`
*   **Description**: Volunteer's mobile device pings this to log their coordinates.
*   **Rate**: Expected every 5-10 seconds during an active delivery.
*   **Payload**: `{ "donationID": 5, "latitude": 19.0760, "longitude": 72.8777 }`

### **GET** `/location/{donation_id}/history`
*   **Description**: Fetches the breadcrumb trail of a delivery for the Hotel's live-tracking map.
*   **Response**: Returns an array of sequential `{lat, lon}` tuples.
