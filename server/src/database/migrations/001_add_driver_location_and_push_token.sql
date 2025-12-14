-- MIGRATION: 001
-- This migration adds columns necessary for driver location tracking and push notifications.

-- Add columns to the 'drivers' table for real-time status and location
ALTER TABLE drivers ADD COLUMN is_online BOOLEAN DEFAULT FALSE;
ALTER TABLE drivers ADD COLUMN last_seen_at TIMESTAMPTZ;
ALTER TABLE drivers ADD COLUMN current_latitude DECIMAL(10, 6);
ALTER TABLE drivers ADD COLUMN current_longitude DECIMAL(10, 6);
ALTER TABLE drivers ADD COLUMN current_location GEOGRAPHY(Point, 4326);

-- Add a geospatial index for efficient location-based queries
CREATE INDEX idx_drivers_current_location ON drivers USING GIST(current_location);

-- Add a column to the 'users' table to store the push notification token
ALTER TABLE users ADD COLUMN push_token TEXT;
