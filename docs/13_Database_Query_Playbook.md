# Database Query Playbook (Safe Queries)

This document contains PostgreSQL queries you can run in pgAdmin safely.

## Usage Rules

- Read-only section: no data change.
- Insert-testing section: uses `BEGIN` + `ROLLBACK` so data is not permanently changed.
- These queries are written for the current FoodConnect schema.

## A) Read-Only Queries (No Changes)

```sql
-- 1) List all public tables
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
```

```sql
-- 2) Show columns and datatypes for one table (change table_name value)
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'donations'
ORDER BY ordinal_position;
```

```sql
-- 3) Row count per core table
SELECT 'users' AS table_name, COUNT(*) FROM users
UNION ALL SELECT 'hotel', COUNT(*) FROM hotel
UNION ALL SELECT 'volunteer', COUNT(*) FROM volunteer
UNION ALL SELECT 'donations', COUNT(*) FROM donations
UNION ALL SELECT 'donation_tags', COUNT(*) FROM donation_tags
UNION ALL SELECT 'claims_record', COUNT(*) FROM claims_record
UNION ALL SELECT 'verification', COUNT(*) FROM verification
UNION ALL SELECT 'location_tracking', COUNT(*) FROM location_tracking
ORDER BY table_name;
```

```sql
-- 4) Latest users
SELECT user_id, email, phone, role
FROM users
ORDER BY user_id DESC
LIMIT 20;
```

```sql
-- 5) Hotels
SELECT h_id, h_name, hotel_type, contact_name, address, latitude, longitude, fssai
FROM hotel
ORDER BY h_id DESC;
```

```sql
-- 6) Volunteers leaderboard
SELECT vol_id, vol_name, vehicle_type, score, latitude, longitude
FROM volunteer
ORDER BY score DESC, vol_id ASC;
```

```sql
-- 7) Donations with hotel names
SELECT d.d_id, h.h_name, d.total_wt, d.food_description, d.is_veg, d.prep_time, d.exp_time, d.created_at
FROM donations d
JOIN hotel h ON h.h_id = d.h_id
ORDER BY d.created_at DESC
LIMIT 50;
```

```sql
-- 8) Donations with aggregated tags
SELECT d.d_id, h.h_name, d.food_description,
       COALESCE(string_agg(dt.tag, ', ' ORDER BY dt.tag), 'no-tag') AS tags
FROM donations d
JOIN hotel h ON h.h_id = d.h_id
LEFT JOIN donation_tags dt ON dt.d_id = d.d_id
GROUP BY d.d_id, h.h_name, d.food_description
ORDER BY d.d_id DESC;
```

```sql
-- 9) Claim status summary
SELECT status, COUNT(*) AS total_claims, COALESCE(SUM(c_wt), 0) AS total_weight
FROM claims_record
GROUP BY status
ORDER BY status;
```

```sql
-- 10) Claim flow with donation, volunteer, verification
SELECT c.c_id, c.status, c.c_wt, c.timestamp,
       d.d_id, d.food_description,
       h.h_name,
       v.vol_name,
       ver.pickup_hash, ver.delivery_hash, ver.exp_time, ver.verified_at
FROM claims_record c
JOIN donations d ON d.d_id = c.d_id
JOIN hotel h ON h.h_id = d.h_id
JOIN volunteer v ON v.vol_id = c.vol_id
LEFT JOIN verification ver ON ver.c_id = c.c_id
ORDER BY c.timestamp DESC;
```

```sql
-- 11) Donations expiring in next 2 hours
SELECT d.d_id, h.h_name, d.food_description, d.total_wt, d.exp_time
FROM donations d
JOIN hotel h ON h.h_id = d.h_id
WHERE d.exp_time BETWEEN NOW() AND NOW() + INTERVAL '2 hours'
ORDER BY d.exp_time ASC;
```

```sql
-- 12) Latest location point per donation
SELECT DISTINCT ON (lt.donation_id)
       lt.donation_id, lt.volunteer_id, lt.latitude, lt.longitude, lt.accuracy, lt.timestamp
FROM location_tracking lt
ORDER BY lt.donation_id, lt.timestamp DESC;
```

```sql
-- 13) Hotels in Mumbai / Thane / Kalyan
SELECT h_id, h_name, address
FROM hotel
WHERE address ILIKE '%mumbai%'
   OR address ILIKE '%thane%'
   OR address ILIKE '%kalyan%'
ORDER BY h_name;
```

## B) Insert-Test Queries (Non-Permanent by Default)

Use this pattern whenever you want to test inserts safely.

```sql
BEGIN;

-- Your INSERT / UPDATE test here

-- Verify using SELECT

ROLLBACK; -- cancels changes
```

### Example: Safe test insert for a donation

```sql
BEGIN;

INSERT INTO donations (h_id, total_wt, food_description, is_veg, prep_time, exp_time)
VALUES (1, 5.5, 'Test veg rice box', TRUE, NOW() - INTERVAL '30 minutes', NOW() + INTERVAL '3 hours')
RETURNING *;

SELECT d_id, h_id, total_wt, food_description, exp_time
FROM donations
ORDER BY d_id DESC
LIMIT 3;

ROLLBACK;
```

### Example: Safe test insert for donation tags

```sql
BEGIN;

WITH inserted AS (
  INSERT INTO donations (h_id, total_wt, food_description, is_veg, prep_time, exp_time)
  VALUES (1, 3.0, 'Temporary tag test donation', TRUE, NOW() - INTERVAL '20 minutes', NOW() + INTERVAL '2 hours')
  RETURNING d_id
)
INSERT INTO donation_tags (d_id, tag)
SELECT d_id, 'rice' FROM inserted
RETURNING *;

ROLLBACK;
```

## C) Important Notes

- Allowed tags are currently limited to: `biryani`, `rice`, `noodles`.
- `claims_record.status` allows: `pending`, `accepted`, `delivered`.
- If you actually want to save changes, replace `ROLLBACK` with `COMMIT`.
