# Supabase Setup Guide

## 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Sign up or log in
3. Click "New Project"
4. Choose your organization
5. Enter project details:
   - **Name**: `leasewise-data`
   - **Database Password**: Choose a strong password
   - **Region**: Choose closest to your users
6. Click "Create new project"
7. Wait for the project to be ready (2-3 minutes)

## 2. Get Your Credentials

1. Go to **Settings** → **API**
2. Copy the following values:
   - **Project URL** (starts with `https://`)
   - **anon public** key (starts with `eyJ`)

## 3. Set Up Environment Variables

Add these to your `.env.local` file:

```bash
# OpenAI API Key (already configured)
OPENAI_API_KEY=your_openai_api_key_here

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

## 4. Create Database Tables

Run these SQL commands in your Supabase SQL Editor:

### PDF Uploads Table
```sql
CREATE TABLE pdf_uploads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  file_name TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  file_type TEXT NOT NULL,
  storage_url TEXT NOT NULL,
  address TEXT NOT NULL,
  lease_data_id UUID REFERENCES lease_data(id)
);
```

### Lease Data Table
```sql
CREATE TABLE lease_data (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  pdf_url TEXT,
  building_name TEXT,
  property_address TEXT NOT NULL,
  monthly_rent DECIMAL(10,2),
  security_deposit DECIMAL(10,2),
  lease_start_date DATE,
  lease_end_date DATE,
  notice_period_days INTEGER,
  property_type TEXT,
  square_footage INTEGER,
  bedrooms INTEGER,
  bathrooms DECIMAL(3,1),
  parking_spaces INTEGER,
  pet_policy TEXT,
  utilities_included TEXT[],
  amenities TEXT[],
  landlord_name TEXT,
  management_company TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  lease_terms TEXT[],
  special_clauses TEXT[],
  market_analysis JSONB,
  red_flags JSONB,
  tenant_rights JSONB,
  key_dates JSONB,
  raw_analysis JSONB
);
```

## 5. Set Up Storage Bucket

1. Go to **Storage** in your Supabase dashboard
2. Click **Create a new bucket**
3. Name: `lease-documents`
4. Make it **Public**
5. Click **Create bucket**

## 6. Set Up Row Level Security (RLS)

### Enable RLS on tables
```sql
ALTER TABLE pdf_uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE lease_data ENABLE ROW LEVEL SECURITY;
```

### Create policies for public access
```sql
-- Allow anyone to insert PDF uploads
CREATE POLICY "Allow public insert on pdf_uploads" ON pdf_uploads
  FOR INSERT WITH CHECK (true);

-- Allow anyone to insert lease data
CREATE POLICY "Allow public insert on lease_data" ON lease_data
  FOR INSERT WITH CHECK (true);

-- Allow anyone to read lease data
CREATE POLICY "Allow public read on lease_data" ON lease_data
  FOR SELECT USING (true);

-- Allow anyone to update lease data
CREATE POLICY "Allow public update on lease_data" ON lease_data
  FOR UPDATE USING (true);
```

### Set up Storage Bucket Policies
```sql
-- Allow public access to storage bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('lease-documents', 'lease-documents', true);

-- Allow anyone to upload files
CREATE POLICY "Allow public uploads" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'lease-documents');

-- Allow anyone to read files
CREATE POLICY "Allow public access" ON storage.objects
  FOR SELECT USING (bucket_id = 'lease-documents');
```

## 7. Deploy to Vercel

1. Add the environment variables to your Vercel project:
   - Go to your Vercel project settings
   - Navigate to **Environment Variables**
   - Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`

2. Deploy your app:
```bash
vercel --prod
```

## 8. Test the Setup

1. Upload a PDF file
2. Check your Supabase dashboard:
   - **Storage** → `lease-documents` bucket should show your PDF
   - **Table Editor** → `lease_data` should show the extracted data
   - **Table Editor** → `pdf_uploads` should show the file metadata

## 9. Data Export for Property Management Companies

Your data is now structured and ready for export! You can:

1. **Query specific data**:
```sql
SELECT building_name, monthly_rent, property_address, amenities 
FROM lease_data 
WHERE monthly_rent > 2000;
```

2. **Export to CSV**:
```sql
COPY (
  SELECT building_name, property_address, monthly_rent, security_deposit, 
         lease_start_date, lease_end_date, property_type, square_footage,
         bedrooms, bathrooms, amenities, landlord_name, management_company
  FROM lease_data
) TO STDOUT WITH CSV HEADER;
```

3. **Create API endpoints** for property management companies to access the data

## Benefits

✅ **Structured Data**: All lease information is extracted and stored in a queryable format
✅ **Scalable Storage**: Supabase handles large files and high volume
✅ **Real-time Updates**: Data is available immediately after processing
✅ **Export Ready**: Easy to create reports and data exports
✅ **Revenue Potential**: Structured data can be sold to property management companies
