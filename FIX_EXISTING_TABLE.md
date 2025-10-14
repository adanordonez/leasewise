# Fix Existing lease_data Table

## Your Situation

You have an existing `lease_data` table that's missing some columns. This guide will safely add all missing columns without losing any data.

## Solution: Run the Update Script

### Step 1: Use the Update Script

Instead of `CREATE_LEASE_DATA_TABLE.sql`, run the **`UPDATE_EXISTING_LEASE_DATA_TABLE.sql`** script.

1. Go to Supabase Dashboard → SQL Editor
2. Open the file `UPDATE_EXISTING_LEASE_DATA_TABLE.sql`
3. Copy the entire contents
4. Paste into Supabase SQL Editor
5. Click **"Run"**

### What This Does (Safely)

The script uses `ADD COLUMN IF NOT EXISTS` for each column, which means:
- ✅ **If column exists**: Nothing happens, no error
- ✅ **If column missing**: Column is added safely
- ✅ **Existing data**: Completely preserved
- ✅ **No data loss**: Impossible with this approach

### Step 2: Verify the Update

After running the script, verify all columns exist:

```sql
-- Check all columns in lease_data
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'lease_data'
ORDER BY ordinal_position;
```

You should see all these columns:
- id
- created_at
- updated_at
- **user_name** ← NEW
- **user_email** ← NEW
- pdf_url
- user_address
- property_address
- building_name
- monthly_rent
- security_deposit
- lease_start_date
- lease_end_date
- notice_period_days
- property_type
- square_footage
- bedrooms
- bathrooms
- parking_spaces
- pet_policy
- utilities_included
- amenities
- management_company
- landlord_name
- maintenance_responsibility
- subletting_allowed
- market_analysis
- rent_percentile
- deposit_status
- **latitude** ← This was missing
- **longitude** ← This was missing

### Step 3: Create pdf_uploads Table

After fixing `lease_data`, run the `CREATE_PDF_UPLOADS_TABLE.sql` script:

1. Open `CREATE_PDF_UPLOADS_TABLE.sql`
2. Copy entire contents
3. Paste into Supabase SQL Editor
4. Click **"Run"**

This creates the `pdf_uploads` table (which links to `lease_data`).

## Why Did You Get That Error?

The error happened because:
1. You had a partial `lease_data` table (maybe from a previous attempt)
2. The `CREATE TABLE IF NOT EXISTS` command saw the table existed
3. So it skipped creating it
4. But the existing table was missing the `latitude` column
5. The `COMMENT ON COLUMN` command tried to add a comment to a non-existent column

## What's the Difference Between the Scripts?

### `CREATE_LEASE_DATA_TABLE.sql`
- Creates a brand new table from scratch
- Works if: No table exists
- Fails if: Table already exists but is incomplete

### `UPDATE_EXISTING_LEASE_DATA_TABLE.sql` ← Use This!
- Updates an existing table
- Adds missing columns one by one
- Works if: Table exists (complete or incomplete)
- Also works if: Table doesn't exist yet
- **This is the safer option!**

## Verification Checklist

After running the update script:

- [ ] No errors in SQL Editor
- [ ] Run the verification query above
- [ ] See all 31 columns listed
- [ ] Check existing data is still there:
  ```sql
  SELECT * FROM lease_data LIMIT 5;
  ```
- [ ] New columns show NULL for old records (this is normal and safe)

## Next Steps

1. ✅ Run `UPDATE_EXISTING_LEASE_DATA_TABLE.sql`
2. ✅ Verify columns exist
3. ✅ Run `CREATE_PDF_UPLOADS_TABLE.sql`
4. ✅ Test the app (upload a lease with name/email)
5. ✅ Check Supabase to see the data saved

## Still Getting Errors?

If you still get errors, you may need to drop and recreate the table. **Only do this if you don't have important data!**

```sql
-- ⚠️ WARNING: This deletes ALL data in lease_data table!
-- Only run this if the table is empty or you don't need the data

DROP TABLE IF EXISTS lease_data CASCADE;
```

Then run `CREATE_LEASE_DATA_TABLE.sql` to create a fresh table.

## Safe Alternative: Fresh Start (If Needed)

If you want to start completely fresh:

```sql
-- Check if you have any data first
SELECT COUNT(*) FROM lease_data;

-- If count is 0 or you don't need the data, you can drop it
DROP TABLE IF EXISTS lease_data CASCADE;
DROP TABLE IF EXISTS pdf_uploads CASCADE;
```

Then run:
1. `CREATE_LEASE_DATA_TABLE.sql`
2. `CREATE_PDF_UPLOADS_TABLE.sql`

---

**Recommended Approach:** Just run `UPDATE_EXISTING_LEASE_DATA_TABLE.sql` - it's the safest! ✅

