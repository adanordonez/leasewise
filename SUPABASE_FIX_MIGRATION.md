# Supabase Database Fix: Add Missing Columns

## Problem
The `pdf_uploads` table is missing the `address` column that our direct upload code is trying to use.

## Solution
Run these SQL commands in your Supabase SQL Editor to fix the table schema:

### 1. Add Missing Columns to pdf_uploads Table
```sql
-- Add the missing address column
ALTER TABLE pdf_uploads ADD COLUMN address TEXT;

-- Update column names to match our code
ALTER TABLE pdf_uploads RENAME COLUMN filename TO file_name;
ALTER TABLE pdf_uploads RENAME COLUMN content_type TO file_type;
ALTER TABLE pdf_uploads RENAME COLUMN url TO storage_url;
```

### 2. Update Existing Records (Optional)
If you have existing records, you can populate the address column:
```sql
-- Update existing records with a default address
UPDATE pdf_uploads 
SET address = 'Unknown Address' 
WHERE address IS NULL;
```

### 3. Make address Required (Optional)
If you want to make address required for new records:
```sql
-- Make address NOT NULL (only after populating existing records)
ALTER TABLE pdf_uploads 
ALTER COLUMN address SET NOT NULL;
```

## Verification
After running the migration, verify the table structure:
```sql
-- Check the table structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'pdf_uploads' 
ORDER BY ordinal_position;
```

## Expected Result
The `pdf_uploads` table should now have these columns:
- `id` (UUID, Primary Key)
- `created_at` (Timestamp)
- `file_name` (TEXT)
- `file_size` (BIGINT)
- `file_type` (TEXT)
- `storage_url` (TEXT)
- `address` (TEXT)
- `lease_data_id` (UUID, Foreign Key)

## Testing
1. Try uploading a PDF with the new direct Supabase upload
2. Check that no database errors occur
3. Verify the data is saved correctly in the `pdf_uploads` table
