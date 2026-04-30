# FoodConnect DBMS Overview & Database Architecture

The backbone of FoodConnect is a highly normalized, standard Relational Database Management System (RDBMS) modeled in **PostgreSQL**. The platform relies deeply on relational integrity to manage the complex interactions between donors, volunteers, shifting geospatial states, and sensitive transactional states across the application's lifecycle.

## 1. Architectural Core Principles

The database design strictly enforces Data Integrity natively at the DBMS level, using advanced constraint mechanics.

*   **ACID Compliance**: By relying on an RDBMS architecture natively, operations—such as accepting a volunteer request and updating their score simultaneously—are strictly atomic transactions.
*   **Enforced Integrity**: Extensive use of Foreign Keys (`ON DELETE CASCADE`), `CHECK` constraints, and `UNIQUE` indexes ensures the database state never degrades (e.g., preventing orphaned food items when a hotel deletes their account).

## 2. Entity-Relationship (ER) Schema Breakdown

The schema utilizes a Master-Detail inheritance pattern for identity, mapping 1:1 records out to specific roles.

### `users` (Master Identity Table)
Central registry controlling all authentication and overarching roles.
*   **Attributes**: `user_id` (PK), `email` (UNIQUE), `password` (hashed), `role` (ENUM: 'hotel', 'volunteer').
*   **Function**: Contains core identifying data.

### `hotel` (Donor Entity Table)
Represents the food provider. 1:1 mapping mapping exactly to `users`.
*   **Attributes**: `user_id` (PK, FK), `h_name`, `address`, `latitude`, `longitude`, `license_number` (UNIQUE).
*   **Integrity**: If a User record drops, the specific Hotel record intrinsically drops. Location fields initialize to track geospatial data.

### `volunteer` (Receiver/Courier Entity Table)
Represents the courier. 1:1 mapping mapping exactly to `users`.
*   **Attributes**: `user_id` (PK, FK), `vol_name`, `vehicle_type`, `score`, `latitude`, `longitude`.
*   **Integrity**: The `score` tracking utilizes constraints (e.g., cannot be negative) facilitating reliable UI gamification.

### `donations` (Item Table)
Representing the food payload. Mapped 1:N from `hotel`.
*   **Attributes**: `d_id` (PK), `user_id`/`h_id` (FK), `total_wt`.
*   **Integrity**: Weight constraints (`CHECK > 0`).

### `donation_tags` (Multi-Valued Attribute Resolver)
Resolves complex lists connected to a single `donation` row (e.g., 'rice', 'bread').
*   **Attributes**: `tag_id` (PK), `d_id` (FK), `tag`.
*   **Integrity**: `UNIQUE(d_id, tag)` prevents the identical tag mapping twice to the same donation.

### `claims_record` (Association Entity)
Maps the N:M relationship occurring when a Volunteer interacts with a specific Donation.
*   **Attributes**: `c_id` (PK), `d_id` (FK), `vol_id` (FK), `status` (CHECK: 'pending', 'accepted', 'delivered'), `timestamp`.
*   **Function**: Serves as the central state machine for the application flow, tracing when food moves through its states.

### `location_tracking` (Real-Time Telemetry History)
Aggregates geographical movement tied to a specific delivery in action.
*   **Attributes**: `id` (PK), `volunteer_id` (FK), `donation_id` (FK), `latitude`, `longitude`, `timestamp`.
*   **Function**: Stores the points logged incrementally via `/location/update` enabling mapping history playback.

### `verification`
*   **Attributes**: `ve_id` (PK), `c_id` (FK, UNIQUE), `pickup_hash`
*   **Function**: Cryptographic verification step; Maps exactly to an active claim. Once matched, it triggers the claim resolution to `delivered`.

## 3. Optimization and Indexing Profiles

Due to the heavy read-query constraints placed on mapping services requiring geographical coordinates constantly, optimization focuses on lookup speed.

*   **Operational Indexes**:
    *   `CREATE INDEX idx_donations_status ON donations(status)` – Drastically speeds up map rendering queries for 'Pending' donations.
    *   `CREATE INDEX idx_location_tracking_donation ON location_tracking(donation_id)` – Optimizes retrieving route histories for a single assignment.
    *   `idx_users_role` – Standardizes rapid user dashboard routing logic upon login.

## 4. No Firebase Reliance for Auth
All user entity storage and verification processes operate purely within PostgreSQL using standard encrypted password structures over REST API (no third party BaaS Auth), enforcing complete data sovereignty.
