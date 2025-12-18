-- Seed data for fare_settings
INSERT INTO fare_settings (vehicle_type, base_fare, per_km_rate, per_minute_rate, minimum_fare, surge_multiplier, is_active)
VALUES 
('bike', 20.00, 5.00, 1.00, 30.00, 1.0, true),
('auto', 30.00, 10.00, 1.50, 40.00, 1.0, true),
('car', 50.00, 15.00, 2.00, 80.00, 1.0, true),
('premium', 80.00, 20.00, 3.00, 100.00, 1.0, true),
('parcel', 25.00, 6.00, 1.00, 35.00, 1.0, true),
('bike_lite', 15.00, 4.00, 0.50, 20.00, 1.0, true)
ON CONFLICT (vehicle_type) DO NOTHING;
