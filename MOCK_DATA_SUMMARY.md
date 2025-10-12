# Mock Data Summary

## ✅ Successfully Generated 70 Lease Records!

Your Supabase database now contains 70 realistic mock lease records that will populate your dashboard.

## What Was Generated

### Geographic Distribution
- **10 Major US Cities**: New York, Los Angeles, San Francisco, Chicago, Austin, Seattle, Boston, Denver, Portland, Miami
- **40+ Neighborhoods**: Real neighborhoods like Manhattan, Brooklyn, SOMA, Capitol Hill, etc.
- **Unique Addresses**: Each lease has a realistic street address

### Property Types
- Studios
- 1-Bedroom Apartments
- 2-Bedroom Apartments
- 3-Bedroom Apartments
- Lofts, Condos, Townhouses, Duplexes

### Financial Data
- **Monthly Rent**: Ranges from $1,500 to $5,500 (city-dependent)
  - NYC: $2,500-$4,800
  - SF: $2,800-$5,200
  - LA: $2,000-$3,800
  - Chicago: $1,600-$3,000
  - Austin: $1,500-$2,800
  - And more...
- **Security Deposits**: 1x, 1.5x, or 2x monthly rent
- **Market Analysis**: Each lease includes percentile ranking and market comparison

### Property Features
- **Square Footage**: 400-1,800 sq ft (based on bedroom count)
- **Bathrooms**: 1-4 (proportional to bedrooms)
- **Parking**: 0-2 spaces
- **Amenities**: 3-6 per property from 18 options (Gym, Pool, Laundry, etc.)
- **Utilities Included**: Various combinations of water, heat, trash, etc.

### Lease Details
- **Lease Dates**: Random start dates in 2023-2024, all with 1-year terms
- **Notice Periods**: 30, 60, or 90 days
- **Pet Policies**: Various (no pets, cats allowed, dogs under 25lbs, etc.)
- **Management**: 10 different management companies
- **Landlords**: 10 different landlord names

## View Your Data

1. **Start your dev server** (if not running):
   ```bash
   npm run dev
   ```

2. **Visit the dashboard**:
   ```
   http://localhost:3000/dashboard
   ```

3. **What you'll see**:
   - 📍 70 pins on the map across major US cities
   - 📊 Stats cards showing average rent, total leases, etc.
   - 🔍 Filterable lease data by city, price range, bedrooms
   - 🗺️ Interactive map with lease details in popups

## Sample Data Points

### Example Lease 1
- **Location**: Lincoln Park, Chicago, IL
- **Type**: 1BR Apartment
- **Rent**: $2,250/month
- **Size**: 734 sq ft
- **Amenities**: Package Room, Dishwasher, Gym, Elevator

### Example Lease 2
- **Location**: Manhattan, New York, NY
- **Type**: 1BR Loft
- **Rent**: $3,750/month
- **Size**: 649 sq ft
- **Amenities**: Storage, Balcony, Bike Storage

## Generate More Data

To add more leases:
```bash
node scripts/generate-mock-lease-data.js 50
```

## Clear Mock Data (if needed)

To remove all mock data from Supabase:
```sql
DELETE FROM lease_data WHERE pdf_url = '';
```

Or via Supabase Dashboard:
1. Go to Table Editor
2. Select `lease_data` table
3. Filter by `pdf_url` = empty
4. Select all and delete

## Next Steps

1. ✅ View your populated dashboard
2. ✅ Test the map interactions
3. ✅ Try the search and filter features
4. ✅ Check the market analysis data
5. ✅ Ensure all pins display correctly on the map

Your dashboard should now look vibrant and populated with real-looking data! 🎉

