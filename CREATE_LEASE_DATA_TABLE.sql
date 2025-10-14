-- Create the lease_data table with all required columns
CREATE TABLE IF NOT EXISTS lease_data (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- User Information
  user_name TEXT,
  user_email TEXT,
  
  -- File and Address Information
  pdf_url TEXT,
  user_address TEXT, -- User's input address for map pins
  property_address TEXT, -- AI-extracted address from lease
  building_name TEXT,
  
  -- Financial Information
  monthly_rent NUMERIC,
  security_deposit NUMERIC,
  
  -- Lease Dates
  lease_start_date DATE,
  lease_end_date DATE,
  notice_period_days INTEGER,
  
  -- Property Details
  property_type TEXT,
  square_footage INTEGER,
  bedrooms INTEGER,
  bathrooms NUMERIC,
  parking_spaces INTEGER,
  
  -- Policies
  pet_policy TEXT,
  
  -- Utilities and Amenities
  utilities_included TEXT[],
  amenities TEXT[],
  
  -- Legal and Management
  management_company TEXT,
  landlord_name TEXT,
  maintenance_responsibility TEXT,
  subletting_allowed BOOLEAN,
  
  -- Additional Information
  market_analysis TEXT,
  rent_percentile INTEGER,
  deposit_status TEXT,
  
  -- Geocoding for map display
  latitude NUMERIC,
  longitude NUMERIC
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_lease_data_user_email ON lease_data(user_email);
CREATE INDEX IF NOT EXISTS idx_lease_data_created_at ON lease_data(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_lease_data_user_address ON lease_data(user_address);
CREATE INDEX IF NOT EXISTS idx_lease_data_monthly_rent ON lease_data(monthly_rent);

-- Add comments for documentation
COMMENT ON TABLE lease_data IS 'Stores analyzed lease data with user information and property details';
COMMENT ON COLUMN lease_data.user_name IS 'Full name of the user who uploaded the lease';
COMMENT ON COLUMN lease_data.user_email IS 'Email address of the user who uploaded the lease';
COMMENT ON COLUMN lease_data.user_address IS 'User-provided property address for geocoding';
COMMENT ON COLUMN lease_data.property_address IS 'AI-extracted address from the lease document';
COMMENT ON COLUMN lease_data.latitude IS 'Latitude for map display';
COMMENT ON COLUMN lease_data.longitude IS 'Longitude for map display';

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_lease_data_updated_at ON lease_data;
CREATE TRIGGER update_lease_data_updated_at
  BEFORE UPDATE ON lease_data
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS) - IMPORTANT for security
ALTER TABLE lease_data ENABLE ROW LEVEL SECURITY;

-- Create a policy that allows all operations (you can customize this later)
-- For now, we'll allow all operations since there's no auth yet
DROP POLICY IF EXISTS "Allow all operations on lease_data" ON lease_data;
CREATE POLICY "Allow all operations on lease_data"
  ON lease_data
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Grant permissions to authenticated and anon users
GRANT ALL ON lease_data TO authenticated;
GRANT ALL ON lease_data TO anon;
GRANT USAGE, SELECT ON SEQUENCE lease_data_id_seq TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE lease_data_id_seq TO anon;

