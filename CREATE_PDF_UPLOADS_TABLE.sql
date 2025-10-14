-- Create the pdf_uploads table for tracking uploaded PDF files
CREATE TABLE IF NOT EXISTS pdf_uploads (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- File Information
  file_name TEXT NOT NULL,
  file_size BIGINT,
  file_type TEXT,
  storage_url TEXT NOT NULL,
  
  -- Associated Data
  address TEXT,
  lease_data_id BIGINT REFERENCES lease_data(id) ON DELETE CASCADE,
  
  -- Metadata
  upload_status TEXT DEFAULT 'completed',
  error_message TEXT
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_pdf_uploads_created_at ON pdf_uploads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_pdf_uploads_lease_data_id ON pdf_uploads(lease_data_id);
CREATE INDEX IF NOT EXISTS idx_pdf_uploads_address ON pdf_uploads(address);

-- Add comments
COMMENT ON TABLE pdf_uploads IS 'Tracks PDF file uploads and their metadata';
COMMENT ON COLUMN pdf_uploads.file_name IS 'Original name of the uploaded PDF file';
COMMENT ON COLUMN pdf_uploads.file_size IS 'Size of the file in bytes';
COMMENT ON COLUMN pdf_uploads.storage_url IS 'URL to the file in Supabase storage';
COMMENT ON COLUMN pdf_uploads.lease_data_id IS 'Foreign key to the associated lease_data record';

-- Enable Row Level Security (RLS)
ALTER TABLE pdf_uploads ENABLE ROW LEVEL SECURITY;

-- Create a policy that allows all operations (customize later)
DROP POLICY IF EXISTS "Allow all operations on pdf_uploads" ON pdf_uploads;
CREATE POLICY "Allow all operations on pdf_uploads"
  ON pdf_uploads
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Grant permissions
GRANT ALL ON pdf_uploads TO authenticated;
GRANT ALL ON pdf_uploads TO anon;

-- Grant sequence permissions (only if sequence exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_sequences WHERE schemaname = 'public' AND sequencename = 'pdf_uploads_id_seq') THEN
    GRANT USAGE, SELECT ON SEQUENCE pdf_uploads_id_seq TO authenticated;
    GRANT USAGE, SELECT ON SEQUENCE pdf_uploads_id_seq TO anon;
  END IF;
END $$;

