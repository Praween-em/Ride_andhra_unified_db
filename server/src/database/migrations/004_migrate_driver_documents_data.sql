-- MIGRATION: 004
-- This migration migrates existing driver document data from the drivers table
-- to the new driver_documents table.

-- Migrate existing aadhaar_photo data to driver_documents
INSERT INTO driver_documents (driver_id, document_type, document_url, status, created_at, updated_at)
SELECT 
    id,
    'aadhar',
    aadhaar_photo,
    'approved', -- Assume existing documents were already verified
    created_at,
    NOW()
FROM drivers
WHERE aadhaar_photo IS NOT NULL 
  AND aadhaar_photo != ''
ON CONFLICT (driver_id, document_type) DO NOTHING;

-- Migrate existing pan_photo data to driver_documents
INSERT INTO driver_documents (driver_id, document_type, document_url, status, created_at, updated_at)
SELECT 
    id,
    'pan',
    pan_photo,
    'approved', -- Assume existing documents were already verified
    created_at,
    NOW()
FROM drivers
WHERE pan_photo IS NOT NULL 
  AND pan_photo != ''
ON CONFLICT (driver_id, document_type) DO NOTHING;

-- Log migration results
DO $$
DECLARE
    aadhar_count INTEGER;
    pan_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO aadhar_count FROM driver_documents WHERE document_type = 'aadhar';
    SELECT COUNT(*) INTO pan_count FROM driver_documents WHERE document_type = 'pan';
    
    RAISE NOTICE '✅ Migration complete:';
    RAISE NOTICE '   - Migrated % Aadhar documents', aadhar_count;
    RAISE NOTICE '   - Migrated % PAN documents', pan_count;
    RAISE NOTICE '   - Total documents: %', (aadhar_count + pan_count);
END $$;
