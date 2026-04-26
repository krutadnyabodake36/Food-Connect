-- Food Donation Management System schema
-- Strict ER implementation using PostgreSQL with Realistic Columns and Seed Data

BEGIN;

DROP TABLE IF EXISTS location_tracking CASCADE;
DROP TABLE IF EXISTS verification CASCADE;
DROP TABLE IF EXISTS claims_record CASCADE;
DROP TABLE IF EXISTS donation_tags CASCADE;
DROP TABLE IF EXISTS donations CASCADE;
DROP TABLE IF EXISTS volunteer CASCADE;
DROP TABLE IF EXISTS hotel CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- 1) USERS
CREATE TABLE users (
   user_id BIGSERIAL PRIMARY KEY,
   password VARCHAR(255) NOT NULL,
   email VARCHAR(150) NOT NULL UNIQUE,
   phone VARCHAR(20) NOT NULL UNIQUE,
   role VARCHAR(20) NOT NULL CHECK (role IN ('hotel', 'volunteer', 'admin')),
   created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 2) HOTEL
CREATE TABLE hotel (
   h_id BIGSERIAL PRIMARY KEY,
   user_id BIGINT NOT NULL UNIQUE,
   h_name VARCHAR(150) NOT NULL,
   hotel_type VARCHAR(50) DEFAULT 'Restaurant',  -- e.g., Bakery, 5-Star Hotel, Caterer
   contact_name VARCHAR(150),
   address TEXT NOT NULL,
   latitude NUMERIC(10,8),
   longitude NUMERIC(11,8),
   fssai VARCHAR(50) NOT NULL UNIQUE,
   CONSTRAINT fk_hotel_user
      FOREIGN KEY (user_id)
      REFERENCES users(user_id)
      ON DELETE CASCADE
);

-- 3) VOLUNTEER
CREATE TABLE volunteer (
   vol_id BIGSERIAL PRIMARY KEY,
   user_id BIGINT NOT NULL UNIQUE,
   vol_name VARCHAR(150) NOT NULL,
   age INTEGER,
   vehicle_type VARCHAR(50) NOT NULL,
   availability_status BOOLEAN DEFAULT TRUE,
   latitude NUMERIC(10,8),
   longitude NUMERIC(11,8),
   score INTEGER NOT NULL DEFAULT 0 CHECK (score >= 0),
   CONSTRAINT fk_volunteer_user
      FOREIGN KEY (user_id)
      REFERENCES users(user_id)
      ON DELETE CASCADE
);

-- 4) DONATIONS
CREATE TABLE donations (
   d_id BIGSERIAL PRIMARY KEY,
   h_id BIGINT NOT NULL,
   total_wt NUMERIC(10,2) NOT NULL CHECK (total_wt > 0),
   food_description TEXT,
   is_veg BOOLEAN DEFAULT TRUE,
   prep_time TIMESTAMP,
   exp_time TIMESTAMP NOT NULL,
   created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
   CONSTRAINT fk_donation_hotel
      FOREIGN KEY (h_id)
      REFERENCES hotel(h_id)
      ON DELETE CASCADE
);

CREATE TABLE donation_tags (
   tag_id BIGSERIAL PRIMARY KEY,
   d_id BIGINT NOT NULL,
   tag VARCHAR(20) NOT NULL CHECK (tag IN ('biryani', 'rice', 'noodles')),
   CONSTRAINT uq_donation_tag UNIQUE (d_id, tag),
   CONSTRAINT fk_donation_tags_donation
      FOREIGN KEY (d_id)
      REFERENCES donations(d_id)
      ON DELETE CASCADE
);

-- 5) CLAIMS_RECORD
CREATE TABLE claims_record (
   c_id BIGSERIAL PRIMARY KEY,
   d_id BIGINT NOT NULL,
   vol_id BIGINT NOT NULL,
   status VARCHAR(20) NOT NULL CHECK (status IN ('pending', 'accepted', 'delivered')),
   c_wt NUMERIC(10,2) NOT NULL CHECK (c_wt > 0),
   timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
   CONSTRAINT fk_claim_donation
      FOREIGN KEY (d_id)
      REFERENCES donations(d_id)
      ON DELETE CASCADE,
   CONSTRAINT fk_claim_volunteer
      FOREIGN KEY (vol_id)
      REFERENCES volunteer(vol_id)
      ON DELETE CASCADE
);

-- 6) VERIFICATION
CREATE TABLE verification (
   ve_id BIGSERIAL PRIMARY KEY,
   c_id BIGINT NOT NULL UNIQUE,
   exp_time TIMESTAMP NOT NULL,
   pickup_hash VARCHAR(128) NOT NULL,
   delivery_hash VARCHAR(128),
   verified_at TIMESTAMP,
   CONSTRAINT fk_verification_claim
      FOREIGN KEY (c_id)
      REFERENCES claims_record(c_id)
      ON DELETE CASCADE
);

-- 7) LOCATION_TRACKING
CREATE TABLE location_tracking (
    id BIGSERIAL PRIMARY KEY,
    volunteer_id BIGINT NOT NULL,
    donation_id BIGINT NOT NULL,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    accuracy REAL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_tracking_volunteer
        FOREIGN KEY (volunteer_id) REFERENCES volunteer(vol_id) ON DELETE CASCADE,
    CONSTRAINT fk_tracking_donation
        FOREIGN KEY (donation_id) REFERENCES donations(d_id) ON DELETE CASCADE
);

-- Performance indexes
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_hotel_user_id ON hotel(user_id);
CREATE INDEX idx_volunteer_user_id ON volunteer(user_id);
CREATE INDEX idx_donations_h_id ON donations(h_id);
CREATE INDEX idx_donations_exp_time ON donations(exp_time);
CREATE INDEX idx_claims_d_id ON claims_record(d_id);
CREATE INDEX idx_claims_vol_id ON claims_record(vol_id);
CREATE INDEX idx_claims_status ON claims_record(status);
CREATE INDEX idx_verification_exp_time ON verification(exp_time);
CREATE INDEX idx_donation_tags_tag ON donation_tags(tag);
CREATE INDEX idx_location_tracking_donation ON location_tracking(donation_id);


-- SEED DATA (Realistic Locations around Mumbai)

-- Users
INSERT INTO users (user_id, password, email, phone, role) VALUES 
(1, 'dc52935779353668024ae0bea1bcfbc0$b6bddf827fabb3aa4e1df6add73310fd1b1095985ef57a5b84e8efc5fd37ef90', 'manager@tajmahalpalace.com', '9898989801', 'hotel'),
(2, '78383bd6dd1cf7960bc227bdac8e650a$ee181f23a2f36c4bb41a35cc03882d79fd66f3f9db8eaa8a8be93943cf6bc723', 'admin@bastianmumbai.com', '9898989802', 'hotel'),
(3, 'b46991668c5f81f7dc48d3c4eac88953$43a0cd15e46e67a16854d1e45f549431edcf3eff32db8d6ba6c28784913bc7a5', 'vikas.sharma@gmail.com', '9191919101', 'volunteer'),
(4, '843bf9569f47a443790321b0376981cf$c24b6200748dd8dce230ec7f9e378a62821da3e23c2bf8c3cba01291ed216de5', 'priya.desai@yahoo.com', '9191919102', 'volunteer');

-- Hotels
-- Taj Mahal Palace: Colaba
-- Bastian: Bandra West
INSERT INTO hotel (user_id, h_name, hotel_type, contact_name, address, latitude, longitude, fssai) VALUES 
(1, 'The Taj Mahal Palace', '5-Star Hotel', 'Rajiv Menon', 'Apollo Bunder, Colaba, Mumbai, Maharashtra 400001', 18.9217, 72.8332, 'FSSAI-MH-10001'),
(2, 'Bastian Fine Dining', 'Restaurant', 'Simran Kaur', 'Linking Road, Bandra West, Mumbai, Maharashtra 400050', 19.0645, 72.8358, 'FSSAI-MH-20002');

-- Volunteers
INSERT INTO volunteer (user_id, vol_name, age, vehicle_type, availability_status, latitude, longitude, score) VALUES 
(3, 'Vikas Sharma', 28, 'Bike', TRUE, 18.9322, 72.8264, 45), -- Near Churchgate
(4, 'Priya Desai', 32, 'Scooty', TRUE, 19.0759, 72.8776, 120); -- Near BKC

-- Donations
INSERT INTO donations (d_id, h_id, total_wt, food_description, is_veg, prep_time, exp_time) VALUES 
(1, 1, 25.5, 'Fresh assorted bread and leftover buffet spread', FALSE, CURRENT_TIMESTAMP - INTERVAL '2 hours', CURRENT_TIMESTAMP + INTERVAL '4 hours'),
(2, 2, 12.0, 'Premium vegetable biryani and side dishes', TRUE, CURRENT_TIMESTAMP - INTERVAL '1 hour', CURRENT_TIMESTAMP + INTERVAL '3 hours'),
(3, 1, 5.0, 'Freshly made noodles from the wok station', TRUE, CURRENT_TIMESTAMP - INTERVAL '30 minutes', CURRENT_TIMESTAMP + INTERVAL '2 hours');

-- Donation Tags
INSERT INTO donation_tags (d_id, tag) VALUES 
(1, 'rice'),
(2, 'biryani'),
(3, 'noodles');

-- Claims (One accepted, one delivered, one pending)
INSERT INTO claims_record (c_id, d_id, vol_id, status, c_wt, timestamp) VALUES 
(1, 1, 1, 'delivered', 25.5, CURRENT_TIMESTAMP - INTERVAL '2 hours'), -- Vikas delivered from Taj
(2, 2, 2, 'accepted', 12.0, CURRENT_TIMESTAMP - INTERVAL '15 minutes'); -- Priya accepted from Bastian

-- Verification (For the accepted one, we need an active verification)
INSERT INTO verification (c_id, exp_time, pickup_hash) VALUES 
(2, CURRENT_TIMESTAMP + INTERVAL '2 hours', 'bastian_hash_8989');

-- Location Tracking History (For Priya tracking towards Bastian)
INSERT INTO location_tracking (volunteer_id, donation_id, latitude, longitude, accuracy, timestamp) VALUES 
(2, 2, 19.0759, 72.8776, 10.5, CURRENT_TIMESTAMP - INTERVAL '10 minutes'), -- Start at BKC
(2, 2, 19.0700, 72.8600, 12.0, CURRENT_TIMESTAMP - INTERVAL '5 minutes'), -- Moving towards Bandra
(2, 2, 19.0660, 72.8450, 8.5, CURRENT_TIMESTAMP - INTERVAL '1 minute'); -- Approaching Bastian

-- Sync sequences for the serial IDs since we hardcoded values
SELECT setval('users_user_id_seq', (SELECT MAX(user_id) FROM users));
SELECT setval('hotel_h_id_seq', (SELECT MAX(h_id) FROM hotel));
SELECT setval('volunteer_vol_id_seq', (SELECT MAX(vol_id) FROM volunteer));
SELECT setval('donations_d_id_seq', (SELECT MAX(d_id) FROM donations));
SELECT setval('claims_record_c_id_seq', (SELECT MAX(c_id) FROM claims_record));

COMMIT;
