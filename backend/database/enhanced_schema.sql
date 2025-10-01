-- IFFAHEALTH Enhanced Production Database Schema
-- This schema includes all features needed for the production app

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types
DO $$ BEGIN
    CREATE TYPE gender_type AS ENUM ('male', 'female', 'other');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('patient', 'doctor', 'admin');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE appointment_type AS ENUM ('video', 'in-person');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE appointment_status AS ENUM ('scheduled', 'confirmed', 'completed', 'cancelled', 'no-show');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE medication_status AS ENUM ('active', 'paused', 'completed', 'discontinued');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE lab_test_status AS ENUM ('scheduled', 'pending', 'completed', 'cancelled', 'failed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE health_record_type AS ENUM ('consultation', 'diagnosis', 'treatment', 'procedure', 'vaccination', 'lab_result', 'prescription');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE payout_status AS ENUM ('pending', 'processing', 'completed', 'failed', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE payout_method AS ENUM ('mobile_money', 'bank_transfer', 'paypal');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE prescription_status AS ENUM ('active', 'completed', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE notification_type AS ENUM ('appointment', 'prescription', 'lab_result', 'payment', 'general');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE notification_status AS ENUM ('unread', 'read', 'archived');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Users table (for authentication)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role user_role NOT NULL,
    is_verified BOOLEAN DEFAULT FALSE,
    verification_token VARCHAR(255),
    reset_token VARCHAR(255),
    reset_token_expires TIMESTAMP WITH TIME ZONE,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Patients table
CREATE TABLE IF NOT EXISTS patients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    date_of_birth DATE NOT NULL,
    gender gender_type NOT NULL,
    address JSONB, -- Flexible address structure
    emergency_contact JSONB,
    medical_history TEXT[],
    allergies TEXT[],
    current_medications TEXT[],
    blood_type VARCHAR(10),
    height DECIMAL(5,2), -- in cm
    weight DECIMAL(5,2), -- in kg
    marital_status VARCHAR(20),
    occupation VARCHAR(100),
    employer VARCHAR(100),
    insurance_provider VARCHAR(100),
    insurance_number VARCHAR(50),
    insurance_group_number VARCHAR(50),
    insurance_type VARCHAR(20),
    insurance_expiry_date DATE,
    preferred_language VARCHAR(50),
    preferred_doctor_gender VARCHAR(20),
    preferred_appointment_time VARCHAR(20),
    communication_preferences TEXT[],
    referral_source VARCHAR(100),
    profile_picture_url VARCHAR(500),
    consent_to_telehealth BOOLEAN DEFAULT FALSE,
    consent_to_data_sharing BOOLEAN DEFAULT FALSE,
    is_profile_complete BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Hospitals table
CREATE TABLE IF NOT EXISTS hospitals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(200) NOT NULL,
    address JSONB NOT NULL,
    phone VARCHAR(20),
    email VARCHAR(255),
    website VARCHAR(255),
    license_number VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Partner lab centers table
CREATE TABLE IF NOT EXISTS lab_centers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(200) NOT NULL,
    description TEXT,
    address JSONB NOT NULL,
    city VARCHAR(100),
    region VARCHAR(100),
    country VARCHAR(100) DEFAULT 'Ghana',
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),
    phone VARCHAR(20),
    email VARCHAR(255),
    website VARCHAR(255),
    services TEXT[],
    operating_hours JSONB,
    coverage_radius_km DECIMAL(5,2) DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    rating DECIMAL(3,2),
    total_reviews INTEGER DEFAULT 0,
    created_by UUID,
    updated_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Partner pharmacies table
CREATE TABLE IF NOT EXISTS partner_pharmacies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(200) NOT NULL,
    description TEXT,
    address JSONB NOT NULL,
    city VARCHAR(100),
    region VARCHAR(100),
    country VARCHAR(100) DEFAULT 'Ghana',
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),
    phone VARCHAR(20),
    email VARCHAR(255),
    website VARCHAR(255),
    services TEXT[],
    operating_hours JSONB,
    delivery_options TEXT[],
    accepts_insurance BOOLEAN DEFAULT FALSE,
    insurance_providers TEXT[],
    coverage_radius_km DECIMAL(5,2) DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    rating DECIMAL(3,2),
    total_reviews INTEGER DEFAULT 0,
    created_by UUID,
    updated_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insurance partners table
CREATE TABLE IF NOT EXISTS insurance_partners (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(200) NOT NULL,
    description TEXT,
    logo_url VARCHAR(500),
    coverage_areas TEXT[],
    contact_person JSONB,
    phone VARCHAR(20),
    email VARCHAR(255),
    website VARCHAR(255),
    plans JSONB,
    is_active BOOLEAN DEFAULT TRUE,
    created_by UUID,
    updated_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Doctors table
CREATE TABLE IF NOT EXISTS doctors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    specialty VARCHAR(100) NOT NULL,
    license_number VARCHAR(50) UNIQUE NOT NULL,
    medical_school VARCHAR(200),
    graduation_year INTEGER,
    hospital_affiliation VARCHAR(200),
    practice_address JSONB,
    city VARCHAR(100),
    consultation_fee DECIMAL(10,2),
    bio TEXT,
    languages TEXT[],
    experience_years INTEGER DEFAULT 0,
    profile_image_url VARCHAR(500),
    is_verified BOOLEAN DEFAULT FALSE,
    verification_documents JSONB, -- Array of document URLs
    board_certification VARCHAR(200),
    board_certification_document VARCHAR(500),
    is_profile_complete BOOLEAN DEFAULT FALSE,
    is_available BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Appointments table
CREATE TABLE IF NOT EXISTS appointments (
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
    payment_status VARCHAR(20) DEFAULT 'pending',
    payment_reference VARCHAR(100),
    amount DECIMAL(10,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Medications table
CREATE TABLE IF NOT EXISTS medications (
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

-- Prescriptions table
CREATE TABLE IF NOT EXISTS prescriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    doctor_id UUID REFERENCES doctors(id) ON DELETE CASCADE,
    prescription_date DATE NOT NULL,
    status prescription_status NOT NULL DEFAULT 'active',
    notes TEXT,
    follow_up_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Prescription items table
CREATE TABLE IF NOT EXISTS prescription_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    prescription_id UUID REFERENCES prescriptions(id) ON DELETE CASCADE,
    medication_name VARCHAR(200) NOT NULL,
    dosage VARCHAR(100) NOT NULL,
    frequency VARCHAR(100) NOT NULL,
    quantity INTEGER NOT NULL,
    instructions TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Lab tests table
CREATE TABLE IF NOT EXISTS lab_tests (
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
    doctor_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Health records table
CREATE TABLE IF NOT EXISTS health_records (
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

-- Doctor earnings table
CREATE TABLE IF NOT EXISTS doctor_earnings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    doctor_id UUID REFERENCES doctors(id) ON DELETE CASCADE,
    appointment_id UUID REFERENCES appointments(id),
    amount DECIMAL(10,2) NOT NULL,
    commission_rate DECIMAL(5,2) DEFAULT 0.80, -- 80% to doctor
    net_amount DECIMAL(10,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    earned_date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Payout requests table
CREATE TABLE IF NOT EXISTS payout_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    doctor_id UUID REFERENCES doctors(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    method payout_method NOT NULL,
    account_details JSONB NOT NULL, -- Mobile number, bank details, etc.
    status payout_status NOT NULL DEFAULT 'pending',
    request_date DATE NOT NULL,
    processed_date DATE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    type notification_type NOT NULL,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    data JSONB, -- Additional data for the notification
    status notification_status NOT NULL DEFAULT 'unread',
    read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Emergency alerts table
CREATE TABLE IF NOT EXISTS emergency_alerts (
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

-- Video call sessions table
CREATE TABLE IF NOT EXISTS video_call_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    appointment_id UUID REFERENCES appointments(id) ON DELETE CASCADE,
    session_id VARCHAR(100) UNIQUE NOT NULL,
    channel_name VARCHAR(100) NOT NULL,
    agora_token TEXT,
    started_at TIMESTAMP WITH TIME ZONE,
    ended_at TIMESTAMP WITH TIME ZONE,
    duration INTEGER, -- in seconds
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Payment transactions table
CREATE TABLE IF NOT EXISTS payment_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    appointment_id UUID REFERENCES appointments(id),
    patient_id UUID REFERENCES patients(id),
    doctor_id UUID REFERENCES doctors(id),
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'GHS',
    payment_method VARCHAR(50) NOT NULL,
    payment_reference VARCHAR(100) UNIQUE NOT NULL,
    paystack_reference VARCHAR(100),
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    paid_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_patients_user_id ON patients(user_id);
-- Note: Email index will be created on users table instead
CREATE INDEX idx_doctors_user_id ON doctors(user_id);
CREATE INDEX idx_doctors_specialty ON doctors(specialty);
CREATE INDEX idx_lab_centers_city ON lab_centers(city);
CREATE INDEX idx_lab_centers_region ON lab_centers(region);
CREATE INDEX idx_lab_centers_location ON lab_centers(latitude, longitude);
CREATE INDEX idx_partner_pharmacies_city ON partner_pharmacies(city);
CREATE INDEX idx_partner_pharmacies_region ON partner_pharmacies(region);
CREATE INDEX idx_partner_pharmacies_location ON partner_pharmacies(latitude, longitude);
CREATE INDEX idx_appointments_patient_date ON appointments(patient_id, appointment_date);
CREATE INDEX idx_appointments_doctor_date ON appointments(doctor_id, appointment_date);
CREATE INDEX idx_appointments_status ON appointments(status);
CREATE INDEX idx_medications_patient_status ON medications(patient_id, status);
CREATE INDEX idx_prescriptions_patient ON prescriptions(patient_id);
CREATE INDEX idx_prescriptions_doctor ON prescriptions(doctor_id);
CREATE INDEX idx_lab_tests_patient_date ON lab_tests(patient_id, test_date);
CREATE INDEX idx_lab_tests_status ON lab_tests(status);
CREATE INDEX idx_health_records_patient_date ON health_records(patient_id, record_date);
CREATE INDEX idx_doctor_earnings_doctor ON doctor_earnings(doctor_id);
CREATE INDEX idx_payout_requests_doctor ON payout_requests(doctor_id);
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_status ON notifications(status);
CREATE INDEX idx_payment_transactions_patient ON payment_transactions(patient_id);
CREATE INDEX idx_payment_transactions_reference ON payment_transactions(payment_reference);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_patients_updated_at BEFORE UPDATE ON patients FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_doctors_updated_at BEFORE UPDATE ON doctors FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON appointments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_medications_updated_at BEFORE UPDATE ON medications FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_prescriptions_updated_at BEFORE UPDATE ON prescriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_lab_tests_updated_at BEFORE UPDATE ON lab_tests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_health_records_updated_at BEFORE UPDATE ON health_records FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_payout_requests_updated_at BEFORE UPDATE ON payout_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_emergency_alerts_updated_at BEFORE UPDATE ON emergency_alerts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_lab_centers_updated_at BEFORE UPDATE ON lab_centers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_partner_pharmacies_updated_at BEFORE UPDATE ON partner_pharmacies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_insurance_partners_updated_at BEFORE UPDATE ON insurance_partners FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Note: Row Level Security (RLS) can be enabled later if using Supabase
-- For now, we'll rely on application-level security through JWT authentication

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO postgres;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres;
