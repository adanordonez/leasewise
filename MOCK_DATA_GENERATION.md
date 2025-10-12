# Mock Lease Data Generation

This script generates realistic mock lease data for your Supabase dashboard.

## Features

The script generates diverse, realistic lease data including:

### **Location Data**
- 10 major US cities (NYC, LA, SF, Chicago, Austin, Seattle, Boston, Denver, Portland, Miami)
- Real neighborhoods for each city
- Realistic street addresses

### **Property Details**
- Property types: Studio, Apartment, Loft, Condo, Townhouse, Duplex
- Bedrooms: 0-3 (weighted towards 1-2BR)
- Bathrooms: 1-4 (based on bedroom count)
- Square footage: Realistic ranges based on bedroom count
- Parking: 0-2 spaces

### **Financial Data**
- **City-based rent pricing**: NYC ($2500-4800), SF ($2800-5200), LA ($2000-3800), etc.
- Security deposits: 1x, 1.5x, or 2x monthly rent
- Market analysis with percentile rankings

### **Lease Terms**
- Lease dates: Random start dates in 2023-2024, 1-year terms
- Notice periods: 30, 60, or 90 days
- Standard lease clauses and special provisions
- Early termination and renewal terms

### **Amenities & Features**
- 18 common amenities (Gym, Pool, Parking, Laundry, etc.)
- 3-6 random amenities per property
- Utilities included (various combinations)
- Pet policies (various options)

### **Contact Information**
- Landlord names
- Management companies
- Contact emails and phone numbers

## Usage

### 1. **Install Dependencies** (if not already installed)
```bash
cd leasewise-app
npm install @supabase/supabase-js dotenv
```

### 2. **Ensure Environment Variables**
Make sure your `.env.local` file has:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. **Run the Script**

Generate 50 mock leases (default):
```bash
node scripts/generate-mock-lease-data.js
```

Generate a custom number of leases:
```bash
node scripts/generate-mock-lease-data.js 100
```

Generate just a few for testing:
```bash
node scripts/generate-mock-lease-data.js 10
```

## Output

The script will:
1. Generate the specified number of realistic lease records
2. Insert them into your Supabase `lease_data` table
3. Display a success message with the count
4. Show a sample record for verification

Example output:
```
Generating 50 mock lease records...
Inserting data into Supabase...
✅ Successfully inserted 50 lease records!

Sample record:
{
  "user_address": "4523 Main St, Apt 23, Manhattan, New York, NY",
  "building_name": "The Heights",
  "monthly_rent": 3200,
  "security_deposit": 4800,
  ...
}
```

## Data Distribution

The script generates data with realistic distributions:
- **Studios**: ~14%
- **1BR**: ~43%
- **2BR**: ~36%
- **3BR**: ~7%

Rent prices vary by city and are adjusted randomly within realistic ranges.

## Viewing the Data

After running the script:
1. Visit your dashboard at `/dashboard`
2. You should see all the mock leases on the map
3. Use the filters to explore the data
4. Check the stats cards for aggregated information

## Cleaning Up

To remove mock data from Supabase:
```sql
-- Delete all lease data (use with caution!)
DELETE FROM lease_data;

-- Or delete only recent entries
DELETE FROM lease_data 
WHERE created_at > '2024-01-01';
```

## Notes

- The script respects Supabase Row Level Security (RLS) policies
- All data is completely fictional
- Addresses are realistic but not real locations
- Market analysis percentiles are randomly generated
- The script can be run multiple times to add more data

