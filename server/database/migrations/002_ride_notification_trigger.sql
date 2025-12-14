-- Migration: Add ride_rejections table and notification trigger
-- This tracks which drivers rejected which rides to prevent duplicate notifications

-- Create ride_rejections table
CREATE TABLE IF NOT EXISTS ride_rejections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ride_id UUID NOT NULL REFERENCES rides(id) ON DELETE CASCADE,
    driver_id UUID NOT NULL REFERENCES driver_profiles(user_id) ON DELETE CASCADE,
    rejected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(ride_id, driver_id)
);

-- Create index for faster lookups
CREATE INDEX idx_ride_rejections_ride_id ON ride_rejections(ride_id);
CREATE INDEX idx_ride_rejections_driver_id ON ride_rejections(driver_id);

-- Create function to notify about new rides
CREATE OR REPLACE FUNCTION notify_new_ride()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'pending' THEN
    PERFORM pg_notify('new_ride_broadcast', NEW.id::text);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on rides table
DROP TRIGGER IF EXISTS ride_created_trigger ON rides;
CREATE TRIGGER ride_created_trigger
AFTER INSERT ON rides
FOR EACH ROW
EXECUTE FUNCTION notify_new_ride();

-- Add comment for documentation
COMMENT ON TABLE ride_rejections IS 'Tracks driver rejections to implement cascading notification logic';
COMMENT ON FUNCTION notify_new_ride() IS 'Triggers PostgreSQL NOTIFY when a new ride is created with pending status';
