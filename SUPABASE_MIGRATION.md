# Supabase Migration: Add user_address Column

## Problem
The map is not showing pins because we're using the AI-extracted `property_address` from the lease document instead of the user's input address. We need to store the user's input address separately for accurate map pin placement.

## Solution
Add a `user_address` column to the `lease_data` table to store the user's input address.

## Migration Steps

### 1. Add the Column
Run this SQL in your Supabase SQL Editor:

```sql
-- Add user_address column to lease_data table
ALTER TABLE lease_data 
ADD COLUMN user_address TEXT;

-- Add a comment to explain the difference
COMMENT ON COLUMN lease_data.user_address IS 'User input address for map pins';
COMMENT ON COLUMN lease_data.property_address IS 'AI-extracted address from lease document';
```

### 2. Update Existing Records (Optional)
If you have existing records, you can populate the user_address with the property_address:

```sql
-- Update existing records to use property_address as user_address
UPDATE lease_data 
SET user_address = property_address 
WHERE user_address IS NULL;
```

### 3. Make user_address Required (Optional)
If you want to make user_address required for new records:

```sql
-- Make user_address NOT NULL (only after populating existing records)
ALTER TABLE lease_data 
ALTER COLUMN user_address SET NOT NULL;
```

## Verification
After running the migration, verify the column exists:

```sql
-- Check the table structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'lease_data' 
ORDER BY ordinal_position;
```

## Expected Result
- `user_address` column added to `lease_data` table
- Map pins will now use the user's input address for geocoding
- Map will show pins at the locations where users actually live
- Popup will show both user address and property address
- Basic lease info (price, etc.) will be extracted separately for better accuracy

## Testing
1. Upload a new lease with a user address
2. Check the dashboard map
3. Verify pins appear at the user's input address location
4. Check that popup shows both addresses
5. Verify rent prices are correctly extracted and displayed
