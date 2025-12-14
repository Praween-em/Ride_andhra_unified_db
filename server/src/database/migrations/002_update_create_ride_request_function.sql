-- MIGRATION: 002
-- This migration updates the 'create_ride_request' function to find nearby
-- drivers and create notification records for them.

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
    v_search_radius_meters INT := 5000; -- 5km search radius
BEGIN
    -- Get fare settings
    SELECT * INTO v_fare_settings FROM fare_settings WHERE vehicle_type = p_vehicle_type AND is_active = TRUE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Fare settings not found for vehicle type: %', p_vehicle_type;
    END IF;

    v_pickup_geog := ST_SetSRID(ST_MakePoint(p_pickup_lon, p_pickup_lat), 4326);
    v_dropoff_geog := ST_SetSRID(ST_MakePoint(p_drop_lon, p_drop_lat), 4326);

    -- Estimate distance and duration
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

    -- **NEW LOGIC STARTS HERE**
    -- Find nearby, online drivers
    FOR v_nearby_driver IN
        SELECT usr.id AS user_id
        FROM drivers d
        JOIN users usr ON d.user_id = usr.id
        WHERE d.is_online = TRUE
          AND d.last_seen_at > NOW() - INTERVAL '5 minutes'
          AND ST_DWithin(d.current_location, v_pickup_geog, v_search_radius_meters)
        ORDER BY ST_Distance(d.current_location, v_pickup_geog) -- Closest first
        LIMIT 10 -- Notify the closest 10 drivers
    LOOP
        -- Create a notification entry in the database for each driver
        INSERT INTO notifications (user_id, ride_id, type, title, message, data)
        VALUES (
            v_nearby_driver.user_id,
            v_ride.id,
            'ride_request',
            'New Ride Request!',
            'A new ride is available near you. Tap to view.',
            jsonb_build_object('rideId', v_ride.id, 'fare', v_ride.estimated_fare, 'pickup', v_ride.pickup_address)
        );
    END LOOP;
    
    -- Use pg_notify to alert the backend that a new request is ready to be sent
    PERFORM pg_notify('new_ride_broadcast', v_ride.id::text);

    RETURN jsonb_build_object('success', true, 'ride', row_to_json(v_ride));
END;
$$ LANGUAGE plpgsql;
