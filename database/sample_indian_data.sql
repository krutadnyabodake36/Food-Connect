-- Realistic demo data for viva/demo
-- Region focus: Mumbai, Thane, Kalyan
-- Run this AFTER database/queries/Sql_Queries.sql

BEGIN;

-- 1) Users (idempotent)
INSERT INTO users (password, email, phone, role)
SELECT * FROM (
  VALUES
  ('c21d7b8ab2227b4872f027f9cf1efa98$73f2bc56ff6141cc5a5f15f3c07b9a7082f84d7646c4af6b6ecfe43dbbc06f47', 'manager@dadargrand.in', '9898989821', 'hotel'),
  ('997eb0b7f1ca50c8b0dd4e416b1a1f0d$9d7bcb75dedeb3df33f2bcedbc8fb8fb7d81186c8272ac83e2207fbc4cbfdd03', 'owner@thaneplaza.in', '9898989822', 'hotel'),
  ('e313f04e95aeac982ef68e29d6d6e117$95bcf0f25de1618ac42c2f39c85b74572a1712a6d44a6a6fbfa34aa84edfb603', 'ops@kalyankitchen.in', '9898989823', 'hotel'),
  ('5ab14ecb7ec8b4f4e17af32891f49e6f$58c981683f38090ea22a7eb328f52575595c7cf10ec1fdf8388a903117541f89', 'admin@ulhasnagarthali.in', '9898989824', 'hotel'),
  ('9cd5321da50fbc0e5aef0c3ea66ca32f$3a571e8f60ca7dfd87d9da13ed45fd4a45b8f53fa13ec8d6cb10475c4de8e650', 'chef@powaimeals.in', '9898989825', 'hotel'),
  ('6904e542b1c909be6ce7f6eb2cf5c74e$eab9019a7aaf4bbf2d54a80d22027d8da059c86f14dc7f0e6716dd67f949218f', 'rahul.shinde@ngo.in', '9191919121', 'volunteer'),
  ('cd8ea91b6cdfd0b8d7f4a80dd3772f2f$c3f38d2e44df790f5f12f7dccf34bd2a1dfeb6edca6f4adf33f70bb09f718ef9', 'neha.jadhav@ngo.in', '9191919122', 'volunteer'),
  ('80ec5afb2f1deeb85ebbe621ee7be9b4$2bd0dcfa65cde758a62ef59495b63fb31a0a8ec5d2adf378422449f6b4a8566a', 'aman.khan@ngo.in', '9191919123', 'volunteer'),
  ('7d02a221bc34be94f313f7c266f2f2d8$80c0f885741f98abf53c88a833f032715f4fda531a2a01c68e5738e90f1f4c0d', 'fatima.shaikh@ngo.in', '9191919124', 'volunteer'),
  ('2a7f932fd4edb2eaf7a7580b5be687fa$30a0eaf1ec82f88f4f6ce5da2f038f8dbf951cbf71fbc4c4e44ec7df06d0fd40', 'rutuja.patil@ngo.in', '9191919125', 'volunteer'),
  ('f58e0fa4585af84e6d12094f7568a324$4b8b315fdd37013eb7f1578d2af49c93804dd46056dc2f23669e2da0fcae89fd', 'vijay.more@ngo.in', '9191919126', 'volunteer')
) AS seed(password, email, phone, role)
WHERE NOT EXISTS (SELECT 1 FROM users u WHERE u.email = seed.email);

-- 2) Hotels (Mumbai/Thane/Kalyan)
INSERT INTO hotel (user_id, h_name, hotel_type, contact_name, address, latitude, longitude, fssai)
SELECT u.user_id, s.h_name, s.hotel_type, s.contact_name, s.address, s.latitude, s.longitude, s.fssai
FROM users u
JOIN (
  VALUES
  ('manager@dadargrand.in', 'Dadar Grand Dining', 'Restaurant', 'Suresh Naik', 'Dadar West, Mumbai, Maharashtra 400028', 19.0180, 72.8429, 'FSSAI-MH-40121'),
  ('owner@thaneplaza.in', 'Thane Plaza Banquets', 'Banquet', 'Priyanka Patil', 'Naupada, Thane West, Maharashtra 400602', 19.2016, 72.9710, 'FSSAI-MH-40122'),
  ('ops@kalyankitchen.in', 'Kalyan Kitchen Hub', 'Caterer', 'Manoj Tiwari', 'Kalyan West, Maharashtra 421301', 19.2437, 73.1355, 'FSSAI-MH-40123'),
  ('admin@ulhasnagarthali.in', 'Ulhasnagar Thali Point', 'Restaurant', 'Shabana Khan', 'Ulhasnagar, Maharashtra 421003', 19.2215, 73.1632, 'FSSAI-MH-40124'),
  ('chef@powaimeals.in', 'Powai Meals Studio', 'Cloud Kitchen', 'Karan Deshmukh', 'Powai, Mumbai, Maharashtra 400076', 19.1176, 72.9060, 'FSSAI-MH-40125')
) AS s(email, h_name, hotel_type, contact_name, address, latitude, longitude, fssai)
  ON u.email = s.email
WHERE NOT EXISTS (SELECT 1 FROM hotel h WHERE h.fssai = s.fssai);

-- 3) Volunteers with local coordinates
INSERT INTO volunteer (user_id, vol_name, age, vehicle_type, availability_status, latitude, longitude, score)
SELECT u.user_id, s.vol_name, s.age, s.vehicle_type, TRUE, s.latitude, s.longitude, s.score
FROM users u
JOIN (
  VALUES
  ('rahul.shinde@ngo.in', 'Rahul Shinde', 27, 'Bike', 19.0101, 72.8452, 48),
  ('neha.jadhav@ngo.in', 'Neha Jadhav', 29, 'Scooty', 19.2048, 72.9784, 76),
  ('aman.khan@ngo.in', 'Aman Khan', 25, 'Bike', 19.2401, 73.1282, 39),
  ('fatima.shaikh@ngo.in', 'Fatima Shaikh', 31, 'Auto', 19.2260, 73.1601, 82),
  ('rutuja.patil@ngo.in', 'Rutuja Patil', 24, 'Scooty', 19.2148, 73.0904, 44),
  ('vijay.more@ngo.in', 'Vijay More', 33, 'Bike', 19.1202, 72.9035, 91)
) AS s(email, vol_name, age, vehicle_type, latitude, longitude, score)
  ON u.email = s.email
WHERE NOT EXISTS (SELECT 1 FROM volunteer v WHERE v.user_id = u.user_id);

-- 4) 18 realistic donations across Mumbai/Thane/Kalyan
INSERT INTO donations (h_id, total_wt, food_description, is_veg, prep_time, exp_time)
SELECT h.h_id, d.total_wt, d.food_description, d.is_veg, NOW() - d.prep_offset, NOW() + d.exp_offset
FROM hotel h
JOIN (
  VALUES
  ('Dadar Grand Dining', 9.5, 'Veg biryani family packs and dal', TRUE, INTERVAL '70 minutes', INTERVAL '4 hours'),
  ('Dadar Grand Dining', 6.0, 'Paneer fried rice and gravy', TRUE, INTERVAL '50 minutes', INTERVAL '3 hours'),
  ('Dadar Grand Dining', 8.2, 'Chicken biryani trays', FALSE, INTERVAL '80 minutes', INTERVAL '3 hours'),
  ('Dadar Grand Dining', 5.4, 'Veg noodles and spring rolls', TRUE, INTERVAL '40 minutes', INTERVAL '2 hours'),

  ('Thane Plaza Banquets', 14.0, 'Wedding rice and mixed veg curry', TRUE, INTERVAL '2 hours', INTERVAL '5 hours'),
  ('Thane Plaza Banquets', 11.5, 'Tandoori chicken with pulao', FALSE, INTERVAL '90 minutes', INTERVAL '4 hours'),
  ('Thane Plaza Banquets', 7.8, 'Hakka noodles and manchurian', TRUE, INTERVAL '55 minutes', INTERVAL '3 hours'),
  ('Thane Plaza Banquets', 10.0, 'Jeera rice and rajma', TRUE, INTERVAL '75 minutes', INTERVAL '4 hours'),

  ('Kalyan Kitchen Hub', 13.2, 'Veg biryani and raita buckets', TRUE, INTERVAL '65 minutes', INTERVAL '4 hours'),
  ('Kalyan Kitchen Hub', 8.1, 'Egg fried rice meal boxes', FALSE, INTERVAL '45 minutes', INTERVAL '3 hours'),
  ('Kalyan Kitchen Hub', 12.0, 'Khichdi and kadhi packs', TRUE, INTERVAL '60 minutes', INTERVAL '5 hours'),
  ('Kalyan Kitchen Hub', 6.6, 'Noodles with paneer chili', TRUE, INTERVAL '35 minutes', INTERVAL '2 hours'),

  ('Ulhasnagar Thali Point', 7.0, 'Dal khichdi and papad', TRUE, INTERVAL '40 minutes', INTERVAL '3 hours'),
  ('Ulhasnagar Thali Point', 4.8, 'Veg pulao and curd', TRUE, INTERVAL '30 minutes', INTERVAL '2 hours'),
  ('Ulhasnagar Thali Point', 6.1, 'Chicken rice bowls', FALSE, INTERVAL '50 minutes', INTERVAL '3 hours'),

  ('Powai Meals Studio', 9.0, 'South Indian rice combo', TRUE, INTERVAL '55 minutes', INTERVAL '4 hours'),
  ('Powai Meals Studio', 5.9, 'Schezwan noodles and momos', TRUE, INTERVAL '35 minutes', INTERVAL '2 hours'),
  ('Powai Meals Studio', 6.7, 'Biryani and salan', FALSE, INTERVAL '45 minutes', INTERVAL '3 hours')
) AS d(h_name, total_wt, food_description, is_veg, prep_offset, exp_offset)
  ON h.h_name = d.h_name
WHERE NOT EXISTS (
  SELECT 1 FROM donations x WHERE x.h_id = h.h_id AND x.food_description = d.food_description
);

-- 5) Add allowed tags (schema allows only biryani/rice/noodles)
INSERT INTO donation_tags (d_id, tag)
SELECT d.d_id,
  CASE
    WHEN LOWER(d.food_description) LIKE '%biryani%' THEN 'biryani'
    WHEN LOWER(d.food_description) LIKE '%noodle%' THEN 'noodles'
    ELSE 'rice'
  END AS tag
FROM donations d
WHERE d.food_description IN (
  'Veg biryani family packs and dal',
  'Paneer fried rice and gravy',
  'Chicken biryani trays',
  'Veg noodles and spring rolls',
  'Wedding rice and mixed veg curry',
  'Tandoori chicken with pulao',
  'Hakka noodles and manchurian',
  'Jeera rice and rajma',
  'Veg biryani and raita buckets',
  'Egg fried rice meal boxes',
  'Khichdi and kadhi packs',
  'Noodles with paneer chili',
  'Dal khichdi and papad',
  'Veg pulao and curd',
  'Chicken rice bowls',
  'South Indian rice combo',
  'Schezwan noodles and momos',
  'Biryani and salan'
)
ON CONFLICT (d_id, tag) DO NOTHING;

-- 6) Sample claims and verification
INSERT INTO claims_record (d_id, vol_id, status, c_wt, timestamp)
SELECT d.d_id, v.vol_id, s.status, s.c_wt, NOW() - s.time_ago
FROM (
  VALUES
  ('Veg biryani family packs and dal', 'Rahul Shinde', 'pending', 7.0, INTERVAL '20 minutes'),
  ('Wedding rice and mixed veg curry', 'Neha Jadhav', 'accepted', 10.0, INTERVAL '18 minutes'),
  ('Veg biryani and raita buckets', 'Aman Khan', 'pending', 9.5, INTERVAL '12 minutes'),
  ('Khichdi and kadhi packs', 'Fatima Shaikh', 'accepted', 8.0, INTERVAL '22 minutes'),
  ('South Indian rice combo', 'Vijay More', 'delivered', 9.0, INTERVAL '2 hours')
) AS s(food_description, vol_name, status, c_wt, time_ago)
JOIN donations d ON d.food_description = s.food_description
JOIN volunteer v ON v.vol_name = s.vol_name
WHERE NOT EXISTS (
  SELECT 1 FROM claims_record c WHERE c.d_id = d.d_id AND c.vol_id = v.vol_id
);

INSERT INTO verification (c_id, exp_time, pickup_hash)
SELECT c.c_id, NOW() + INTERVAL '2 hours', LPAD((1000 + (c.c_id % 8999))::text, 4, '0')
FROM claims_record c
WHERE c.status = 'accepted'
  AND NOT EXISTS (SELECT 1 FROM verification v WHERE v.c_id = c.c_id);

INSERT INTO location_tracking (volunteer_id, donation_id, latitude, longitude, accuracy, timestamp)
SELECT c.vol_id, c.d_id,
       COALESCE(v.latitude, 19.0760) + 0.001,
       COALESCE(v.longitude, 72.8777) + 0.001,
       10.0,
       NOW() - INTERVAL '6 minutes'
FROM claims_record c
JOIN volunteer v ON v.vol_id = c.vol_id
WHERE c.status = 'accepted'
  AND NOT EXISTS (
    SELECT 1 FROM location_tracking lt WHERE lt.volunteer_id = c.vol_id AND lt.donation_id = c.d_id
  );

COMMIT;
