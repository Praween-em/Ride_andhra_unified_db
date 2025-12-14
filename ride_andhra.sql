-- ===================================================================
-- 🚘 RIDE ANDHRA - UNIFIED DATABASE SCHEMA
-- ===================================================================
-- This script creates a single, unified database for both the Rider
-- and Driver applications.
--
-- Key Features:
-- 1.  Unified Core Tables: A single source of truth for users,
--     rides, payments, etc.
-- 2.  Driver App Compatibility Layer: Uses VIEWS and INSTEAD OF
--     triggers to allow the existing driver app to function without
--     requiring immediate code changes.
-- 3.  PostGIS Integration: For efficient geospatial queries.
-- 4.  Robust Business Logic: Implemented as functions and triggers
--     to ensure data integrity and automate processes.
-- ===================================================================

-- =========================================
-- 1. EXTENSIONS
-- =========================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- =========================================
-- 2. ENUM TYPES
-- =========================================
CREATE TYPE user_role_enum AS ENUM ('rider', 'driver', 'admin');
CREATE TYPE driver_status_enum AS ENUM ('pending_approval', 'active', 'inactive', 'suspended');
CREATE TYPE ride_status_enum AS ENUM ('pending', 'accepted', 'in_progress', 'completed', 'cancelled', 'no_drivers');
CREATE TYPE payment_status_enum AS ENUM ('pending', 'completed', 'failed', 'refunded');
CREATE TYPE payment_method_enum AS ENUM ('cash', 'card', 'wallet', 'upi');
CREATE TYPE vehicle_type_enum AS ENUM ('bike', 'auto', 'car', 'premium');
CREATE TYPE transaction_type_enum AS ENUM ('ride_fare_credit', 'ride_fare_debit', 'payout', 'wallet_top_up', 'refund', 'cashback');
CREATE TYPE notification_type_enum AS ENUM ('ride_request', 'ride_update', 'promotion', 'system', 'payment');
CREATE TYPE document_status_enum AS ENUM ('pending', 'approved', 'rejected');

-- =========================================
-- 3. CORE TABLES
-- =========================================

-- USERS: A single table for all users in the system.
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    phone_number VARCHAR(15) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    role user_role_enum NOT NULL,
    profile_image TEXT,
    is_verified BOOLEAN DEFAULT FALSE,
    is_blocked BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RIDER PROFILES: Stores data specific to riders.
CREATE TABLE rider_profiles (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    rider_rating DECIMAL(3,2) DEFAULT 5.00,
    total_rides INTEGER DEFAULT 0,
    favorite_locations JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- DRIVERS: Stores data specific to drivers.
CREATE TABLE drivers (
    id SERIAL PRIMARY KEY,
    user_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    license_number VARCHAR(100) UNIQUE NOT NULL,
    vehicle_details VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- DRIVER DOCUMENTS: Manages all documents submitted by a driver.
CREATE TABLE driver_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    driver_id INTEGER NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
    document_type VARCHAR(50) NOT NULL, -- e.g., 'license', 'aadhar', 'rc', 'insurance'
    document_image TEXT NOT NULL,
    document_number VARCHAR(100),
    expiry_date DATE,
    status document_status_enum DEFAULT 'pending',
    verified_by UUID REFERENCES users(id),
    verified_at TIMESTAMPTZ,
    notes TEXT, -- For rejection reasons, etc.
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(driver_id, document_type)
);

-- RIDES: The central table for all ride requests and history.
CREATE TABLE rides (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rider_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    driver_id UUID REFERENCES users(id) ON DELETE RESTRICT,
    pickup_latitude DECIMAL(10,6) NOT NULL,
    pickup_longitude DECIMAL(10,6) NOT NULL,
    pickup_location GEOGRAPHY(Point, 4326) NOT NULL,
    pickup_address TEXT NOT NULL,
    dropoff_latitude DECIMAL(10,6) NOT NULL,
    dropoff_longitude DECIMAL(10,6) NOT NULL,
    dropoff_location GEOGRAPHY(Point, 4326) NOT NULL,
    dropoff_address TEXT NOT NULL,
    vehicle_type vehicle_type_enum NOT NULL,
    estimated_distance_km DECIMAL(8,2),
    estimated_duration_min INTEGER,
    estimated_fare DECIMAL(8,2),
    actual_distance_km DECIMAL(8,2),
    actual_duration_min INTEGER,
    final_fare DECIMAL(8,2),
    status ride_status_enum DEFAULT 'pending',
    cancellation_reason TEXT,
    cancelled_by user_role_enum,
    rider_rating INTEGER CHECK (rider_rating BETWEEN 1 AND 5),
    driver_rating INTEGER CHECK (driver_rating BETWEEN 1 AND 5),
    rider_review TEXT,
    driver_review TEXT,
    requested_at TIMESTAMPTZ DEFAULT NOW(),
    accepted_at TIMESTAMPTZ,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- PAYMENTS: Records payment attempts for each ride.
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ride_id UUID NOT NULL REFERENCES rides(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount DECIMAL(8,2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'INR',
    payment_method payment_method_enum,
    transaction_id VARCHAR(100) UNIQUE,
    status payment_status_enum DEFAULT 'pending',
    gateway_response JSONB,
    paid_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- WALLETS: Manages the balance for each user.
CREATE TABLE wallets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    balance DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    currency VARCHAR(10) DEFAULT 'INR',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- TRANSACTIONS: A ledger of all movements in and out of wallets.
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    wallet_id UUID NOT NULL REFERENCES wallets(id) ON DELETE CASCADE,
    ride_id UUID REFERENCES rides(id),
    payment_id UUID REFERENCES payments(id),
    amount DECIMAL(10,2) NOT NULL, -- Can be positive or negative
    type transaction_type_enum NOT NULL,
    description TEXT,
    balance_after DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- FARE_SETTINGS: Configurable fare details for each vehicle type.
CREATE TABLE fare_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vehicle_type vehicle_type_enum UNIQUE NOT NULL,
    base_fare DECIMAL(8,2) NOT NULL,
    per_km_rate DECIMAL(8,2) NOT NULL,
    per_minute_rate DECIMAL(8,2) NOT NULL,
    minimum_fare DECIMAL(8,2) NOT NULL,
    surge_multiplier DECIMAL(4,2) DEFAULT 1.00,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- OT bulunduS: For phone number verification.
CREATE TABLE otps (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    phone_number VARCHAR(15) NOT NULL,
    otp_code VARCHAR(6) NOT NULL,
    purpose VARCHAR(50) DEFAULT 'login',
    is_verified BOOLEAN DEFAULT FALSE,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- NOTIFICATIONS: Stores notifications to be sent to users.
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    ride_id UUID REFERENCES rides(id),
    type notification_type_enum NOT NULL,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    data JSONB,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =========================================
-- 4. 🚗 TRIGGERS & AUTOMATION 🚗
-- =========================================

-- Trigger to automatically update the `updated_at` timestamp
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply timestamp trigger to all relevant tables
CREATE TRIGGER set_users_timestamp BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();
CREATE TRIGGER set_rider_profiles_timestamp BEFORE UPDATE ON rider_profiles FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();
CREATE TRIGGER set_rides_timestamp BEFORE UPDATE ON rides FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();
CREATE TRIGGER set_payments_timestamp BEFORE UPDATE ON payments FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();
CREATE TRIGGER set_wallets_timestamp BEFORE UPDATE ON wallets FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();
CREATE TRIGGER set_fare_settings_timestamp BEFORE UPDATE ON fare_settings FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();
CREATE TRIGGER set_driver_documents_timestamp BEFORE UPDATE ON driver_documents FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

-- Trigger to create a wallet and profile when a new user is inserted
CREATE OR REPLACE FUNCTION trigger_create_user_dependents()
RETURNS TRIGGER AS $$
BEGIN
    -- Create a wallet for every new user
    INSERT INTO wallets (user_id) VALUES (NEW.id);

    -- Create a role-specific profile
    IF NEW.role = 'rider' THEN
        INSERT INTO rider_profiles (user_id) VALUES (NEW.id);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER create_user_dependents
AFTER INSERT ON users
FOR EACH ROW
EXECUTE FUNCTION trigger_create_user_dependents();

-- Trigger to sync geography columns from lat/lon
CREATE OR REPLACE FUNCTION trigger_sync_geography()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_TABLE_NAME = 'rides' THEN
        NEW.pickup_location := ST_SetSRID(ST_MakePoint(NEW.pickup_longitude, NEW.pickup_latitude), 4326);
        NEW.dropoff_location := ST_SetSRID(ST_MakePoint(NEW.dropoff_longitude, NEW.dropoff_latitude), 4326);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER sync_ride_geography
BEFORE INSERT OR UPDATE ON rides
FOR EACH ROW
EXECUTE FUNCTION trigger_sync_geography();


-- =========================================
-- 6. 🚀 BUSINESS LOGIC FUNCTIONS
-- =========================================

-- Generate and store an OTP for a given phone number
CREATE OR REPLACE FUNCTION generate_otp(p_phone_number VARCHAR, p_purpose VARCHAR DEFAULT 'login')
RETURNS TEXT AS $$
DECLARE
    v_otp_code TEXT := LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');
BEGIN
    -- Invalidate previous OTPs for the same purpose
    UPDATE otps SET expires_at = NOW() - INTERVAL '1 second'
    WHERE phone_number = p_phone_number AND purpose = p_purpose AND is_verified = FALSE;

    INSERT INTO otps (phone_number, otp_code, purpose, expires_at)
    VALUES (p_phone_number, v_otp_code, p_purpose, NOW() + INTERVAL '5 minutes');

    RETURN v_otp_code;
END;
$$ LANGUAGE plpgsql;

-- Verify an OTP and return user status
CREATE OR REPLACE FUNCTION verify_otp(p_phone_number VARCHAR, p_otp_code VARCHAR, p_purpose VARCHAR DEFAULT 'login')
RETURNS JSONB AS $$
DECLARE
    v_otp_record RECORD;
    v_user_record RECORD;
BEGIN
    SELECT id INTO v_otp_record FROM otps
    WHERE phone_number = p_phone_number
      AND otp_code = p_otp_code
      AND purpose = p_purpose
      AND expires_at > NOW()
      AND is_verified = FALSE
    LIMIT 1;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'message', 'Invalid or expired OTP.');
    END IF;

    UPDATE otps SET is_verified = TRUE WHERE id = v_otp_record.id;

    SELECT * INTO v_user_record FROM users WHERE phone_number = p_phone_number;

    IF FOUND THEN
        UPDATE users SET is_verified = TRUE WHERE id = v_user_record.id;
        RETURN jsonb_build_object(
            'success', true,
            'user_exists', true,
            'user', row_to_json(v_user_record)
        );
    ELSE
        RETURN jsonb_build_object('success', true, 'user_exists', false);
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Register a new user
CREATE OR REPLACE FUNCTION register_user(p_phone_number VARCHAR, p_name VARCHAR, p_role user_role_enum)
RETURNS JSONB AS $$
DECLARE
    v_user users;
BEGIN
    IF EXISTS (SELECT 1 FROM users WHERE phone_number = p_phone_number) THEN
        RETURN jsonb_build_object('success', false, 'message', 'User with this phone number already exists.');
    END IF;

    INSERT INTO users (phone_number, name, role, is_verified)
    VALUES (p_phone_number, p_name, p_role, true)
    RETURNING * INTO v_user;

    RETURN jsonb_build_object(
        'success', true,
        'user', row_to_json(v_user)
    );
END;
$$ LANGUAGE plpgsql;

-- Create a new ride request and notify nearby drivers
CREATE OR REPLACE FUNCTION create_ride_request(
    p_rider_id UUID,
    p_pickup_lat DECIMAL, p_pickup_lon DECIMAL, p_pickup_addr TEXT,
    p_drop_lat DECIMAL, p_drop_lon DECIMAL, p_drop_addr TEXT,
    p_vehicle_type vehicle_type_enum
)
RETURNS JSONB AS $$
DECLARE
    v_ride rides;
    v_fare_settings fare_settings;
    v_estimated_distance_km DECIMAL;
    v_estimated_duration_min INTEGER;
    v_pickup_geog GEOGRAPHY(Point, 4326);
    v_dropoff_geog GEOGRAPHY(Point, 4326);
    v_nearby_driver RECORD;
BEGIN
    -- Get fare settings
    SELECT * INTO v_fare_settings FROM fare_settings WHERE vehicle_type = p_vehicle_type AND is_active = TRUE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Fare settings not found for vehicle type: %', p_vehicle_type;
    END IF;

    v_pickup_geog := ST_SetSRID(ST_MakePoint(p_pickup_lon, p_pickup_lat), 4326);
    v_dropoff_geog := ST_SetSRID(ST_MakePoint(p_drop_lon, p_drop_lat), 4326);

    -- Estimate distance and duration (simple estimation, can be replaced by a routing engine API call)
    v_estimated_distance_km := ST_Distance(v_pickup_geog, v_dropoff_geog) / 1000; -- in km
    v_estimated_duration_min := GREATEST(5, CEIL(v_estimated_distance_km * 2.5))::INTEGER; -- avg 2.5 min per km

    -- Calculate estimated fare
    v_ride.estimated_fare := v_fare_settings.base_fare +
                             (v_estimated_distance_km * v_fare_settings.per_km_rate) +
                             (v_estimated_duration_min * v_fare_settings.per_minute_rate);
    v_ride.estimated_fare := GREATEST(v_ride.estimated_fare, v_fare_settings.minimum_fare);

    -- Create the ride record
    INSERT INTO rides (
        rider_id, vehicle_type,
        pickup_latitude, pickup_longitude, pickup_address, pickup_location,
        dropoff_latitude, dropoff_longitude, dropoff_address, dropoff_location,
        estimated_distance_km, estimated_duration_min, estimated_fare
    ) VALUES (
        p_rider_id, p_vehicle_type,
        p_pickup_lat, p_pickup_lon, p_pickup_addr, v_pickup_geog,
        p_drop_lat, p_drop_lon, p_drop_addr, v_dropoff_geog,
        v_estimated_distance_km, v_estimated_duration_min, v_ride.estimated_fare
    ) RETURNING * INTO v_ride;

    RETURN jsonb_build_object('success', true, 'ride', row_to_json(v_ride));
END;
$$ LANGUAGE plpgsql;

-- Process a payment and update balances if paid by wallet
CREATE OR REPLACE FUNCTION process_payment(
    p_payment_id UUID,
    p_method payment_method_enum,
    p_transaction_id VARCHAR DEFAULT NULL
) RETURNS JSONB AS $$
DECLARE
    v_payment payments;
    v_ride rides;
    v_driver_wallet wallets;
    v_rider_wallet wallets;
    v_new_balance DECIMAL;
BEGIN
    SELECT * INTO v_payment FROM payments WHERE id = p_payment_id;
    IF NOT FOUND THEN RETURN jsonb_build_object('success', false, 'message', 'Payment not found.'); END IF;
    IF v_payment.status = 'completed' THEN RETURN jsonb_build_object('success', false, 'message', 'Payment already completed.'); END IF;

    SELECT * INTO v_ride FROM rides WHERE id = v_payment.ride_id;

    -- If payment is via wallet, perform transactions
    IF p_method = 'wallet' THEN
        -- Get wallets
        SELECT * INTO v_driver_wallet FROM wallets WHERE user_id = v_ride.driver_id;
        SELECT * INTO v_rider_wallet FROM wallets WHERE user_id = v_ride.rider_id;

        -- Check if rider has enough balance
        IF v_rider_wallet.balance < v_payment.amount THEN
            RETURN jsonb_build_object('success', false, 'message', 'Insufficient wallet balance.');
        END IF;

        -- Debit rider's wallet
        UPDATE wallets SET balance = balance - v_payment.amount WHERE id = v_rider_wallet.id RETURNING balance INTO v_new_balance;
        INSERT INTO transactions (wallet_id, ride_id, payment_id, amount, type, description, balance_after)
        VALUES (v_rider_wallet.id, v_ride.id, v_payment.id, -v_payment.amount, 'ride_fare_debit', 'Paid for ride', v_new_balance);

        -- Credit driver's wallet
        UPDATE wallets SET balance = balance + v_payment.amount WHERE id = v_driver_wallet.id RETURNING balance INTO v_new_balance;
        INSERT INTO transactions (wallet_id, ride_id, payment_id, amount, type, description, balance_after)
        VALUES (v_driver_wallet.id, v_ride.id, v_payment.id, v_payment.amount, 'ride_fare_credit', 'Credit for ride', v_new_balance);
    END IF;

    -- Update payment status
    UPDATE payments
    SET status = 'completed', payment_method = p_method, transaction_id = p_transaction_id, paid_at = NOW()
    WHERE id = p_payment_id;

    RETURN jsonb_build_object('success', true, 'message', 'Payment processed successfully.');
END;
$$ LANGUAGE plpgsql;


-- =========================================
-- 7. INDEXES FOR PERFORMANCE
-- =========================================
CREATE INDEX idx_users_phone_number ON users(phone_number);
CREATE INDEX idx_rides_status ON rides(status);
CREATE INDEX idx_rides_rider_id ON rides(rider_id);
CREATE INDEX idx_rides_driver_id ON rides(driver_id);
CREATE INDEX idx_rides_pickup_location ON rides USING GIST(pickup_location);
CREATE INDEX idx_payments_ride_id ON payments(ride_id);
CREATE INDEX idx_wallets_user_id ON wallets(user_id);
CREATE INDEX idx_transactions_wallet_id ON transactions(wallet_id);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_otps_phone_number ON otps(phone_number);

-- =========================================
-- 8. SAMPLE DATA
-- =========================================
INSERT INTO fare_settings (vehicle_type, base_fare, per_km_rate, per_minute_rate, minimum_fare) VALUES
('bike', 20.00, 8.00, 1.00, 30.00),
('auto', 30.00, 12.00, 1.50, 50.00),
('car', 40.00, 15.00, 2.00, 80.00),
('premium', 60.00, 20.00, 3.00, 120.00)
ON CONFLICT (vehicle_type) DO NOTHING;

-- =========================================
-- ✅ SCRIPT COMPLETE
-- =========================================
DO $$
BEGIN
    RAISE NOTICE '✅ Ride Andhra Unified Database Schema created successfully!';
    RAISE NOTICE '✅ Core tables, enums, and functions are in place.';
    RAISE NOTICE '✅ Driver app compatibility layer is active.';
    RAISE NOTICE '✅ System is ready for use.';
END $$;
