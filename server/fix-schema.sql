DROP TABLE IF EXISTS driver_documents CASCADE;

CREATE TABLE driver_documents (
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
    CONSTRAINT driver_documents_unique_type UNIQUE(driver_id, document_type)
);

CREATE INDEX idx_driver_documents_driver_id ON driver_documents(driver_id);
CREATE INDEX idx_driver_documents_status ON driver_documents(status);

-- Re-create trigger function if needed (or just use existing generic one if available)
-- Assuming trigger_set_timestamp exists from previous files
CREATE TRIGGER set_driver_documents_timestamp
BEFORE UPDATE ON driver_documents
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();
