-- MIGRATION: 003
-- This migration creates the driver_documents table for flexible document management
-- with verification workflow support.

-- Create the driver_documents table
CREATE TABLE IF NOT EXISTS driver_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    driver_id INTEGER NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
    document_type VARCHAR(50) NOT NULL,
    document_url TEXT NOT NULL,
    document_number VARCHAR(100),
    expiry_date DATE,
    status VARCHAR(20) DEFAULT 'pending',
    verified_by UUID REFERENCES users(id),
    verified_at TIMESTAMPTZ,
    rejection_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT driver_documents_unique_type UNIQUE(driver_id, document_type),
    CONSTRAINT driver_documents_status_check CHECK (status IN ('pending', 'approved', 'rejected')),
    CONSTRAINT driver_documents_type_check CHECK (document_type IN ('profile_image', 'aadhar', 'license', 'pan', 'vehicle_rc', 'insurance'))
);

-- Create indexes for performance
CREATE INDEX idx_driver_documents_driver_id ON driver_documents(driver_id);
CREATE INDEX idx_driver_documents_status ON driver_documents(status);
CREATE INDEX idx_driver_documents_type ON driver_documents(document_type);
CREATE INDEX idx_driver_documents_expiry ON driver_documents(expiry_date) WHERE expiry_date IS NOT NULL;

-- Create trigger to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION trigger_set_driver_documents_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_driver_documents_timestamp
BEFORE UPDATE ON driver_documents
FOR EACH ROW
EXECUTE FUNCTION trigger_set_driver_documents_timestamp();

-- Add comments for documentation
COMMENT ON TABLE driver_documents IS 'Stores all driver-related documents with verification workflow';
COMMENT ON COLUMN driver_documents.document_type IS 'Type of document: profile_image, aadhar, license, pan, vehicle_rc, insurance';
COMMENT ON COLUMN driver_documents.status IS 'Verification status: pending, approved, rejected';
COMMENT ON COLUMN driver_documents.document_url IS 'S3 URL, local path, or base64 encoded image data';
