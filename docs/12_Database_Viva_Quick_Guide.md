# FoodConnect Database Viva Quick Guide

This guide helps you explain the database confidently in viva.

## 1) Why This Database Exists

FoodConnect tracks the full donation lifecycle:

1. Hotel posts surplus food
2. Volunteer requests pickup
3. Hotel accepts request
4. Volunteer reaches hotel and verifies pickup code
5. Delivery is completed and scored

## 2) Core Tables and Purpose

### `users`
- Stores account credentials and identity.
- Roles: `hotel`, `volunteer`, `admin`.
- Key columns: `user_id`, `email`, `phone`, `password`, `role`, `created_at`.

### `hotel`
- One-to-one extension of hotel users.
- Stores operational details and geolocation.
- Key columns: `h_id`, `user_id`, `h_name`, `hotel_type`, `contact_name`, `address`, `latitude`, `longitude`, `fssai`.

### `volunteer`
- One-to-one extension of volunteer users.
- Stores availability, location, and performance score.
- Key columns: `vol_id`, `user_id`, `vol_name`, `age`, `vehicle_type`, `availability_status`, `latitude`, `longitude`, `score`.

### `donations`
- Core business table for posted food.
- Key columns: `d_id`, `h_id`, `total_wt`, `food_description`, `is_veg`, `prep_time`, `exp_time`, `created_at`.

### `donation_tags`
- Category mapping for donations.
- Allowed tags currently: `biryani`, `rice`, `noodles`.
- Key columns: `tag_id`, `d_id`, `tag`.

### `claims_record`
- Tracks volunteer requests and status flow.
- Status values: `pending -> accepted -> delivered`.
- Key columns: `c_id`, `d_id`, `vol_id`, `status`, `c_wt`, `timestamp`.

### `verification`
- Stores pickup verification code and delivery confirmation.
- Key columns: `ve_id`, `c_id`, `pickup_hash`, `delivery_hash`, `exp_time`, `verified_at`.

### `location_tracking`
- Stores volunteer movement points for active pickups.
- Key columns: `id`, `volunteer_id`, `donation_id`, `latitude`, `longitude`, `accuracy`, `timestamp`.

## 3) Important Relationships

- `users.user_id` -> `hotel.user_id` (1:1)
- `users.user_id` -> `volunteer.user_id` (1:1)
- `hotel.h_id` -> `donations.h_id` (1:N)
- `donations.d_id` -> `donation_tags.d_id` (1:N)
- `donations.d_id` -> `claims_record.d_id` (1:N)
- `volunteer.vol_id` -> `claims_record.vol_id` (1:N)
- `claims_record.c_id` -> `verification.c_id` (1:1)
- `donations.d_id` -> `location_tracking.donation_id` (1:N)
- `volunteer.vol_id` -> `location_tracking.volunteer_id` (1:N)

## 4) Status Lifecycle You Can Explain

1. Donation created in `donations`.
2. Volunteer request inserted in `claims_record` with `pending`.
3. Hotel accepts request; status becomes `accepted`.
4. System generates 4-digit pickup code in `verification.pickup_hash`.
5. On successful verification, `claims_record.status` becomes `delivered` and `verification.verified_at` is updated.

## 5) Performance and Integrity

- Foreign keys enforce referential integrity.
- Check constraints enforce valid roles/status/tags.
- Indexes improve performance on frequent filters (`status`, `exp_time`, foreign keys).

## 6) New Sample Data Added

- Added organized seed file: `database/sample_indian_data.sql`.
- Includes realistic Indian hotels, volunteers, donations, claims, verification, and tracking rows.
- Adds 10+ donation records for demo and viva.

## 7) How To Show Database Live In App

- Open Hotel portal -> Settings -> Database Explorer.
- You can select each table and display live rows.
- This is useful to explain both schema design and actual data during viva.

## 8) Common Viva Questions (Quick Answers)

Q: Why separate `users` from `hotel` and `volunteer`?
A: Shared authentication data is centralized in `users`, while role-specific fields are normalized into dedicated tables.

Q: How do you avoid invalid transitions?
A: Backend enforces explicit state transitions in claims (`pending -> accepted -> delivered`).

Q: How is authenticity ensured during handoff?
A: Pickup verification uses a time-limited code in `verification` and delivery is only completed after successful match.

Q: How is location handled?
A: Hotel static location is stored in `hotel`, while dynamic movement is appended to `location_tracking`.
