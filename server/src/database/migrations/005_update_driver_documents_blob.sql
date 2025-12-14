-- Update driver_documents table to store images as BLOB (bytea)
-- This eliminates the need for external storage services

-- Drop the table and recreate with proper schema
DROP TABLE IF EXISTS driver_documents CASCADE;

CREATE TABLE driver_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    driver_id UUID NOT NULL REFERENCES driver_profiles(user_id) ON DELETE CASCADE,
    document_type VARCHAR(50) NOT NULL,
    
    -- Store image as bytea (BLOB)
    document_image BYTEA NOT NULL,
    
    -- Store original filename and mime type for serving
    file_name VARCHAR(255),
    mime_type VARCHAR(100),
    file_size INTEGER,
    
    -- Document metadata
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

-- Create indexes
CREATE INDEX idx_driver_documents_driver_id ON driver_documents(driver_id);
CREATE INDEX idx_driver_documents_status ON driver_documents(status);
CREATE INDEX idx_driver_documents_type ON driver_documents(document_type);

-- Create trigger for updated_at
CREATE TRIGGER set_driver_documents_timestamp
BEFORE UPDATE ON driver_documents
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();

-- Add comments
COMMENT ON TABLE driver_documents IS 'Stores driver documents as BLOB (bytea) in database';
COMMENT ON COLUMN driver_documents.document_image IS 'Binary image data stored as bytea';
COMMENT ON COLUMN driver_documents.mime_type IS 'Image MIME type (e.g., image/jpeg, image/png)';
