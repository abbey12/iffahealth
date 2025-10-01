-- IFFAHEALTH Database Schema
-- PostgreSQL Database for Telehealth Platform

-- Create database (run this separately)
-- CREATE DATABASE iffahealth;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    phone VARCHAR(15) NOT NULL,
    date_of_birth DATE NOT NULL,
    gender VARCHAR(10) CHECK (gender IN ('male', 'female', 'other')) NOT NULL,
    address TEXT NOT NULL,
    city VARCHAR(100) NOT NULL,
    country VARCHAR(100) DEFAULT 'Ghana',
    emergency_contact VARCHAR(100) NOT NULL,
    emergency_phone VARCHAR(15) NOT NULL,
    blood_type VARCHAR(5) CHECK (blood_type IN ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-')),
    allergies TEXT[] DEFAULT '{}',
    medical_conditions TEXT[] DEFAULT '{}',
    medications TEXT[] DEFAULT '{}',
    is_verified BOOLEAN DEFAULT FALSE,
    role VARCHAR(20) CHECK (role IN ('patient', 'doctor', 'nurse', 'admin')) DEFAULT 'patient',
    profile_image VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Appointments table
CREATE TABLE IF NOT EXISTS appointments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    doctor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    appointment_date DATE NOT NULL,
    appointment_time VARCHAR(10) NOT NULL,
    duration INTEGER DEFAULT 30 CHECK (duration >= 15 AND duration <= 120),
    type VARCHAR(20) CHECK (type IN ('video', 'in-person')) NOT NULL,
    status VARCHAR(20) CHECK (status IN ('scheduled', 'confirmed', 'in-progress', 'completed', 'cancelled', 'no-show')) DEFAULT 'scheduled',
    specialty VARCHAR(100) NOT NULL,
    reason TEXT NOT NULL,
    symptoms TEXT,
    notes TEXT,
    diagnosis TEXT,
    prescription TEXT,
    follow_up_required BOOLEAN DEFAULT FALSE,
    follow_up_date DATE,
    meeting_link VARCHAR(255),
    room_id VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Post-discharge care table
CREATE TABLE IF NOT EXISTS post_discharge_care (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    assigned_nurse_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    doctor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    discharge_date DATE NOT NULL,
    diagnosis TEXT NOT NULL,
    treatment TEXT NOT NULL,
    medications TEXT[] DEFAULT '{}',
    care_instructions TEXT NOT NULL,
    follow_up_date DATE NOT NULL,
    status VARCHAR(20) CHECK (status IN ('active', 'completed', 'cancelled')) DEFAULT 'active',
    priority VARCHAR(10) CHECK (priority IN ('high', 'medium', 'low')) DEFAULT 'medium',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Care plan tasks table
CREATE TABLE IF NOT EXISTS care_plan_tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_discharge_care_id UUID NOT NULL REFERENCES post_discharge_care(id) ON DELETE CASCADE,
    title VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    due_date DATE NOT NULL,
    status VARCHAR(20) CHECK (status IN ('pending', 'completed', 'overdue')) DEFAULT 'pending',
    priority VARCHAR(10) CHECK (priority IN ('high', 'medium', 'low')) DEFAULT 'medium',
    category VARCHAR(20) CHECK (category IN ('medication', 'exercise', 'diet', 'appointment', 'other')) DEFAULT 'other',
    completed_at TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Health records table
CREATE TABLE IF NOT EXISTS health_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    record_type VARCHAR(50) NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    file_path VARCHAR(255),
    file_type VARCHAR(50),
    file_size INTEGER,
    uploaded_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_appointments_patient_id ON appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_appointments_doctor_id ON appointments(doctor_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(appointment_date);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);
CREATE INDEX IF NOT EXISTS idx_post_discharge_patient_id ON post_discharge_care(patient_id);
CREATE INDEX IF NOT EXISTS idx_post_discharge_nurse_id ON post_discharge_care(assigned_nurse_id);
CREATE INDEX IF NOT EXISTS idx_care_tasks_care_plan_id ON care_plan_tasks(post_discharge_care_id);
CREATE INDEX IF NOT EXISTS idx_care_tasks_status ON care_plan_tasks(status);
CREATE INDEX IF NOT EXISTS idx_care_tasks_due_date ON care_plan_tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_health_records_patient_id ON health_records(patient_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);

-- Create triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON appointments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_post_discharge_care_updated_at BEFORE UPDATE ON post_discharge_care
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_care_plan_tasks_updated_at BEFORE UPDATE ON care_plan_tasks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_health_records_updated_at BEFORE UPDATE ON health_records
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data
INSERT INTO users (email, password, first_name, last_name, phone, date_of_birth, gender, address, city, emergency_contact, emergency_phone, role, is_verified) VALUES
('admin@iffahealth.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/8Qz8K2', 'Admin', 'User', '+233241234567', '1980-01-01', 'male', '123 Admin Street', 'Accra', 'Emergency Contact', '+233241234568', 'admin', true),
('doctor@iffahealth.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/8Qz8K2', 'Dr. Sarah', 'Mensah', '+233241234569', '1985-05-15', 'female', '456 Doctor Avenue', 'Accra', 'Emergency Contact', '+233241234570', 'doctor', true),
('nurse@iffahealth.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/8Qz8K2', 'Nurse Grace', 'Asante', '+233241234571', '1990-08-20', 'female', '789 Nurse Road', 'Accra', 'Emergency Contact', '+233241234572', 'nurse', true),
('patient@iffahealth.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/8Qz8K2', 'John', 'Doe', '+233241234573', '1995-12-10', 'male', '321 Patient Lane', 'Accra', 'Emergency Contact', '+233241234574', 'patient', true);

-- Note: The password hash above is for 'password123' - change this in production!
