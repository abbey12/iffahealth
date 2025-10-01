-- IFFAHEALTH PostgreSQL Database Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types
CREATE TYPE gender_type AS ENUM ('male', 'female', 'other');
CREATE TYPE appointment_type AS ENUM ('video', 'in-person');
CREATE TYPE appointment_status AS ENUM ('scheduled', 'confirmed', 'completed', 'cancelled');
CREATE TYPE medication_status AS ENUM ('active', 'paused', 'completed');
CREATE TYPE lab_test_status AS ENUM ('scheduled', 'pending', 'completed', 'cancelled');
CREATE TYPE health_record_type AS ENUM ('consultation', 'diagnosis', 'treatment', 'procedure', 'vaccination');

-- Patients table
CREATE TABLE patients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20) NOT NULL,
    date_of_birth DATE NOT NULL,
    gender gender_type NOT NULL,
    address JSONB, -- Flexible address structure
    emergency_contact JSONB,
    medical_history TEXT[],
    allergies TEXT[],
    current_medications TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Hospitals table
CREATE TABLE hospitals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(200) NOT NULL,
    address JSONB NOT NULL,
    phone VARCHAR(20),
    email VARCHAR(255),
    website VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Doctors table
CREATE TABLE doctors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20) NOT NULL,
    specialty VARCHAR(100) NOT NULL,
    license_number VARCHAR(50) UNIQUE NOT NULL,
    hospital_id UUID REFERENCES hospitals(id),
    experience_years INTEGER DEFAULT 0,
    bio TEXT,
    profile_image_url VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Appointments table
CREATE TABLE appointments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    doctor_id UUID REFERENCES doctors(id) ON DELETE CASCADE,
    appointment_date DATE NOT NULL,
    appointment_time TIME NOT NULL,
    type appointment_type NOT NULL,
    status appointment_status NOT NULL DEFAULT 'scheduled',
    notes TEXT,
    location VARCHAR(200),
    meeting_link VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Medications table
CREATE TABLE medications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    dosage VARCHAR(100) NOT NULL,
    frequency VARCHAR(100) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE,
    prescribed_by UUID REFERENCES doctors(id),
    instructions TEXT,
    status medication_status NOT NULL DEFAULT 'active',
    side_effects TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Lab tests table
CREATE TABLE lab_tests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    test_name VARCHAR(200) NOT NULL,
    test_type VARCHAR(100) NOT NULL,
    ordered_by UUID REFERENCES doctors(id),
    test_date DATE NOT NULL,
    test_time TIME NOT NULL,
    location VARCHAR(200) NOT NULL,
    status lab_test_status NOT NULL DEFAULT 'scheduled',
    results JSONB, -- Flexible results structure
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Health records table
CREATE TABLE health_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    type health_record_type NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    record_date DATE NOT NULL,
    doctor_id UUID REFERENCES doctors(id),
    hospital_id UUID REFERENCES hospitals(id),
    attachments TEXT[], -- Array of file URLs
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Emergency contacts table
CREATE TABLE emergency_alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    location VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    responded_by UUID REFERENCES doctors(id),
    response_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_patients_email ON patients(email);
CREATE INDEX idx_patients_phone ON patients(phone);
CREATE INDEX idx_appointments_patient_date ON appointments(patient_id, appointment_date);
CREATE INDEX idx_appointments_doctor_date ON appointments(doctor_id, appointment_date);
CREATE INDEX idx_medications_patient_status ON medications(patient_id, status);
CREATE INDEX idx_lab_tests_patient_date ON lab_tests(patient_id, test_date);
CREATE INDEX idx_health_records_patient_date ON health_records(patient_id, record_date);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers
CREATE TRIGGER update_patients_updated_at BEFORE UPDATE ON patients FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_doctors_updated_at BEFORE UPDATE ON doctors FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON appointments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_medications_updated_at BEFORE UPDATE ON medications FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_lab_tests_updated_at BEFORE UPDATE ON lab_tests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_health_records_updated_at BEFORE UPDATE ON health_records FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Sample data removed for production
-- Hospitals and doctors will be added through the admin interface or API

-- Enable Row Level Security (RLS)
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE medications ENABLE ROW LEVEL SECURITY;
ALTER TABLE lab_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_records ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (basic - you'll need to customize based on your auth system)
CREATE POLICY "Patients can view own data" ON patients FOR SELECT USING (auth.uid()::text = id::text);
CREATE POLICY "Patients can update own data" ON patients FOR UPDATE USING (auth.uid()::text = id::text);

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated, service_role;
