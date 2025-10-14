-- Safe update script for existing lease_data table
-- This adds missing columns without destroying existing data

-- Add user information columns if they don't exist
ALTER TABLE lease_data ADD COLUMN IF NOT EXISTS user_name TEXT;
ALTER TABLE lease_data ADD COLUMN IF NOT EXISTS user_email TEXT;

-- Add file and address columns if they don't exist
ALTER TABLE lease_data ADD COLUMN IF NOT EXISTS pdf_url TEXT;
ALTER TABLE lease_data ADD COLUMN IF NOT EXISTS user_address TEXT;
ALTER TABLE lease_data ADD COLUMN IF NOT EXISTS property_address TEXT;
ALTER TABLE lease_data ADD COLUMN IF NOT EXISTS building_name TEXT;

-- Add financial columns if they don't exist
ALTER TABLE lease_data ADD COLUMN IF NOT EXISTS monthly_rent NUMERIC;
ALTER TABLE lease_data ADD COLUMN IF NOT EXISTS security_deposit NUMERIC;

-- Add date columns if they don't exist
ALTER TABLE lease_data ADD COLUMN IF NOT EXISTS lease_start_date DATE;
ALTER TABLE lease_data ADD COLUMN IF NOT EXISTS lease_end_date DATE;
ALTER TABLE lease_data ADD COLUMN IF NOT EXISTS notice_period_days INTEGER;

-- Add property detail columns if they don't exist
ALTER TABLE lease_data ADD COLUMN IF NOT EXISTS property_type TEXT;
ALTER TABLE lease_data ADD COLUMN IF NOT EXISTS square_footage INTEGER;
ALTER TABLE lease_data ADD COLUMN IF NOT EXISTS bedrooms INTEGER;
ALTER TABLE lease_data ADD COLUMN IF NOT EXISTS bathrooms NUMERIC;
ALTER TABLE lease_data ADD COLUMN IF NOT EXISTS parking_spaces INTEGER;

-- Add policy columns if they don't exist
ALTER TABLE lease_data ADD COLUMN IF NOT EXISTS pet_policy TEXT;

-- Add array columns if they don't exist
ALTER TABLE lease_data ADD COLUMN IF NOT EXISTS utilities_included TEXT[];
ALTER TABLE lease_data ADD COLUMN IF NOT EXISTS amenities TEXT[];

-- Add management columns if they don't exist
ALTER TABLE lease_data ADD COLUMN IF NOT EXISTS management_company TEXT;
ALTER TABLE lease_data ADD COLUMN IF NOT EXISTS landlord_name TEXT;
ALTER TABLE lease_data ADD COLUMN IF NOT EXISTS maintenance_responsibility TEXT;
ALTER TABLE lease_data ADD COLUMN IF NOT EXISTS subletting_allowed BOOLEAN;

-- Add market analysis columns if they don't exist
ALTER TABLE lease_data ADD COLUMN IF NOT EXISTS market_analysis TEXT;
ALTER TABLE lease_data ADD COLUMN IF NOT EXISTS rent_percentile INTEGER;
ALTER TABLE lease_data ADD COLUMN IF NOT EXISTS deposit_status TEXT;

-- Add geocoding columns if they don't exist
ALTER TABLE lease_data ADD COLUMN IF NOT EXISTS latitude NUMERIC;
ALTER TABLE lease_data ADD COLUMN IF NOT EXISTS longitude NUMERIC;

-- Add timestamps if they don't exist
ALTER TABLE lease_data ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE lease_data ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_lease_data_user_email ON lease_data(user_email);
CREATE INDEX IF NOT EXISTS idx_lease_data_created_at ON lease_data(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_lease_data_user_address ON lease_data(user_address);
CREATE INDEX IF NOT EXISTS idx_lease_data_monthly_rent ON lease_data(monthly_rent);

-- Add comments for documentation
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

-- Enable Row Level Security if not already enabled
ALTER TABLE lease_data ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if it exists, then recreate
DROP POLICY IF EXISTS "Allow all operations on lease_data" ON lease_data;
CREATE POLICY "Allow all operations on lease_data"
  ON lease_data
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Grant permissions
GRANT ALL ON lease_data TO authenticated;
GRANT ALL ON lease_data TO anon;

-- Grant sequence permissions if the table has an id column
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_sequences WHERE schemaname = 'public' AND sequencename = 'lease_data_id_seq') THEN
    GRANT USAGE, SELECT ON SEQUENCE lease_data_id_seq TO authenticated;
    GRANT USAGE, SELECT ON SEQUENCE lease_data_id_seq TO anon;
  END IF;
END $$;

-- Verify the update
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns
WHERE table_name = 'lease_data'
ORDER BY ordinal_position;

