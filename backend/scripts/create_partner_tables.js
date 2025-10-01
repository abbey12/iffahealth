const { Pool } = require('pg');
const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '../.env') });

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT || 5432,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

const createTablesQueries = [
  `CREATE TABLE IF NOT EXISTS lab_centers (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      name VARCHAR(200) NOT NULL,
      description TEXT,
      address JSONB,
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
  );`,
  `CREATE TABLE IF NOT EXISTS partner_pharmacies (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      name VARCHAR(200) NOT NULL,
      description TEXT,
      address JSONB,
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
  );`,
  `CREATE TABLE IF NOT EXISTS insurance_partners (
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
  );`
];

async function ensureTables() {
  const client = await pool.connect();

  try {
    console.log('🔍 Ensuring partner tables exist...');
    for (const query of createTablesQueries) {
      await client.query(query);
    }
    console.log('✅ Partner tables are ready.');
  } catch (error) {
    console.error('❌ Failed to create partner tables:', error);
  } finally {
    client.release();
    pool.end();
  }
}

ensureTables();

