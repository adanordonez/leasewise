# Supabase Database Setup Guide for LeaseWise

## Quick Start

Follow these steps to set up your Supabase database for LeaseWise:

### 1. Access Supabase SQL Editor

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Click on "SQL Editor" in the left sidebar
4. Click "New query"

### 2. Create Tables (Run in Order)

#### Step 1: Create `lease_data` table

Copy and paste the entire contents of `CREATE_LEASE_DATA_TABLE.sql` into the SQL Editor and click "Run".

This creates:
- ✅ Main `lease_data` table with all columns
- ✅ Indexes for performance
- ✅ Row Level Security (RLS) policies
- ✅ Auto-update trigger for `updated_at`

#### Step 2: Create `pdf_uploads` table

Copy and paste the entire contents of `CREATE_PDF_UPLOADS_TABLE.sql` into the SQL Editor and click "Run".

This creates:
- ✅ `pdf_uploads` table for tracking files
- ✅ Foreign key to `lease_data`
- ✅ Indexes and RLS policies

### 3. Verify Tables Were Created

Run this query to verify:

```sql
-- Check that both tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('lease_data', 'pdf_uploads');
```

You should see both `lease_data` and `pdf_uploads` in the results.

### 4. Check Column Structure

Verify the columns in `lease_data`:

```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'lease_data'
ORDER BY ordinal_position;
```

## Table Schemas

### `lease_data` Table

Stores all analyzed lease information:

| Column | Type | Description |
|--------|------|-------------|
| id | BIGSERIAL | Primary key |
| created_at | TIMESTAMPTZ | Record creation time |
| updated_at | TIMESTAMPTZ | Last update time |
| **user_name** | TEXT | User's full name |
| **user_email** | TEXT | User's email address |
| pdf_url | TEXT | URL to PDF in storage |
| user_address | TEXT | User-provided address |
| property_address | TEXT | AI-extracted address |
| building_name | TEXT | Name of the building |
| monthly_rent | NUMERIC | Monthly rent amount |
| security_deposit | NUMERIC | Security deposit amount |
| lease_start_date | DATE | Lease start date |
| lease_end_date | DATE | Lease end date |
| notice_period_days | INTEGER | Required notice period |
| property_type | TEXT | Type of property |
| square_footage | INTEGER | Property size |
| bedrooms | INTEGER | Number of bedrooms |
| bathrooms | NUMERIC | Number of bathrooms |
| parking_spaces | INTEGER | Number of parking spaces |
| pet_policy | TEXT | Pet policy details |
| utilities_included | TEXT[] | Array of included utilities |
| amenities | TEXT[] | Array of amenities |
| management_company | TEXT | Management company name |
| landlord_name | TEXT | Landlord name |
| maintenance_responsibility | TEXT | Maintenance details |
| subletting_allowed | BOOLEAN | Whether subletting is allowed |
| market_analysis | TEXT | Market analysis text |
| rent_percentile | INTEGER | Rent percentile (0-100) |
| deposit_status | TEXT | Deposit status |
| latitude | NUMERIC | Location latitude |
| longitude | NUMERIC | Location longitude |

### `pdf_uploads` Table

Tracks uploaded PDF files:

| Column | Type | Description |
|--------|------|-------------|
| id | BIGSERIAL | Primary key |
| created_at | TIMESTAMPTZ | Upload time |
| file_name | TEXT | Original filename |
| file_size | BIGINT | File size in bytes |
| file_type | TEXT | MIME type |
| storage_url | TEXT | URL in Supabase storage |
| address | TEXT | Associated address |
| lease_data_id | BIGINT | Foreign key to lease_data |
| upload_status | TEXT | Upload status |
| error_message | TEXT | Error message if any |

## Storage Setup

You also need to set up Supabase Storage for PDF files:

### 1. Create Storage Bucket

1. Go to "Storage" in Supabase Dashboard
2. Click "New bucket"
3. Name: `lease-pdfs`
4. Set to **Public** (or configure policies as needed)
5. Click "Create bucket"

### 2. Set Storage Policies

In the Storage policies section, make sure you have a policy that allows uploads:

```sql
-- Allow anyone to upload files to lease-pdfs bucket
CREATE POLICY "Allow public uploads"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id = 'lease-pdfs');

-- Allow anyone to read files from lease-pdfs bucket  
CREATE POLICY "Allow public downloads"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'lease-pdfs');
```

## Environment Variables

Make sure your `.env.local` file has these variables:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
OPENAI_API_KEY=your_openai_key
NEXT_PUBLIC_MAPBOX_TOKEN=your_mapbox_token
```

## Testing the Setup

After setup, test by:

1. Starting your Next.js app: `npm run dev`
2. Going to the analyze page
3. Filling out the form:
   - Upload a PDF
   - Enter your name
   - Enter your email
   - Enter a property address
4. Click "Analyze Lease"
5. Check Supabase to see if data was saved:

```sql
SELECT * FROM lease_data ORDER BY created_at DESC LIMIT 5;
SELECT * FROM pdf_uploads ORDER BY created_at DESC LIMIT 5;
```

## Troubleshooting

### Error: "relation does not exist"
- Make sure you ran the CREATE TABLE scripts
- Check that you're in the correct project

### Error: "permission denied"
- Check RLS policies are set up
- Verify the policies allow anonymous access (for now)

### Error: "foreign key violation"
- Make sure `lease_data` table was created before `pdf_uploads`
- The `lease_data_id` must exist in `lease_data` table

### Files not uploading to storage
- Check storage bucket exists and is named `lease-pdfs`
- Verify storage policies allow uploads
- Check SUPABASE_URL and ANON_KEY are set correctly

## Security Notes

The current setup allows **anonymous access** to the tables for ease of development. Before going to production:

1. Implement user authentication (Supabase Auth)
2. Update RLS policies to restrict access based on user ID
3. Add data retention policies
4. Implement rate limiting
5. Update Privacy Policy to reflect data collection

## Need Help?

- Check Supabase logs in the Dashboard
- View the API logs for errors
- Check browser console for frontend errors
- Review the `SUPABASE_SETUP.md` for additional configuration

