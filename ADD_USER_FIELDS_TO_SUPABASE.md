# Setup Supabase Database Tables

## Overview
This document explains how to create the required database tables for LeaseWise in Supabase.

## IMPORTANT: Run These Scripts in Order

### Step 1: Create the `lease_data` table

First, you need to create the main `lease_data` table. Run the SQL from `CREATE_LEASE_DATA_TABLE.sql` in your Supabase SQL Editor.

This will create the table with all required columns including:
- User information (user_name, user_email)
- Property details
- Financial information
- Lease dates
- And more

### Step 2: Create the `pdf_uploads` table

Next, create the `pdf_uploads` table. Run the SQL from `CREATE_PDF_UPLOADS_TABLE.sql`.

This tracks all PDF uploads and links them to lease data.

### Step 3 (If tables already exist): Add User Fields

If you already have the `lease_data` table and just need to add the user fields, run this SQL:

```sql
-- Add user_name and user_email columns to lease_data table
ALTER TABLE lease_data
ADD COLUMN IF NOT EXISTS user_name TEXT,
ADD COLUMN IF NOT EXISTS user_email TEXT;

-- Add index on email for faster lookups (optional but recommended)
CREATE INDEX IF NOT EXISTS idx_lease_data_user_email ON lease_data(user_email);

-- Add comment to columns for documentation
COMMENT ON COLUMN lease_data.user_name IS 'Full name of the user who uploaded the lease';
COMMENT ON COLUMN lease_data.user_email IS 'Email address of the user who uploaded the lease';
```

## Steps to Apply

1. Go to your Supabase Dashboard
2. Navigate to the SQL Editor
3. Create a new query
4. Paste the SQL above
5. Click "Run" to execute

## Verification

After running the migration, verify the columns were added:

```sql
-- Check that the columns exist
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'lease_data'
AND column_name IN ('user_name', 'user_email');
```

## What Was Changed

### Frontend (`LeaseWiseApp.tsx`)
- Added `userName` and `userEmail` state variables
- Added two new input fields on the analyze page:
  - Full Name (required)
  - Email Address (required)
- Added email validation
- Updated form validation to require name and email
- Updated API request to include `userName` and `userEmail`

### Backend (`app/api/analyze-lease/route.ts`)
- Added `userName` and `userEmail` parameters
- Updated validation to require these fields
- Updated Supabase insert to save `user_name` and `user_email`

## Data Privacy Note

The user's name and email are now being collected and stored. Make sure to:
1. Update your Privacy Policy to reflect this data collection
2. Implement proper data protection measures
3. Consider adding a checkbox for users to consent to data collection
4. Implement data retention policies

## Testing

After applying the migration, test the flow:
1. Go to the analyze page
2. Upload a lease PDF
3. Fill in the name and email fields
4. Submit the form
5. Check Supabase to verify the data was saved correctly

## Rollback (if needed)

If you need to remove these columns:

```sql
ALTER TABLE lease_data
DROP COLUMN IF EXISTS user_name,
DROP COLUMN IF EXISTS user_email;

DROP INDEX IF EXISTS idx_lease_data_user_email;
```

