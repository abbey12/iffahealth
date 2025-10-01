-- Create doctor payment methods table
CREATE TABLE IF NOT EXISTS doctor_payment_methods (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    doctor_id UUID REFERENCES doctors(id) ON DELETE CASCADE,
    method_type VARCHAR(50) NOT NULL, -- mobile_money, bank_transfer, etc.
    provider VARCHAR(100) NOT NULL, -- MTN, Airtel, Bank Name, etc.
    account_details JSONB NOT NULL, -- phone_number, account_number, etc.
    is_default BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_doctor_payment_methods_doctor_id ON doctor_payment_methods(doctor_id);
CREATE INDEX IF NOT EXISTS idx_doctor_payment_methods_is_default ON doctor_payment_methods(is_default);

-- Add some sample data for testing
INSERT INTO doctor_payment_methods (doctor_id, method_type, provider, account_details, is_default, is_active) 
VALUES 
    ('7ef371ba-e494-4251-8cc6-a68eaf856d2b', 'mobile_money', 'MTN', '{"phone_number": "0241234567", "account_name": "Dr. New Test"}', true, true),
    ('7ef371ba-e494-4251-8cc6-a68eaf856d2b', 'bank_transfer', 'Ghana Commercial Bank', '{"account_number": "1234567890", "account_name": "Dr. New Test", "routing_number": "GCB001"}', false, true)
ON CONFLICT DO NOTHING;
