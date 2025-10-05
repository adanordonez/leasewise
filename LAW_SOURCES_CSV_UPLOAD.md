# 📊 **CSV Upload Setup for Law Sources**

## 🗄️ **Database Table Structure**

Create a table that matches your CSV columns exactly:

```sql
-- Create law_sources table for CSV upload
CREATE TABLE law_sources (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  state TEXT NOT NULL,
  city TEXT NOT NULL,
  uniform_landlord_tenant_law TEXT,
  source_1_statute_code TEXT,
  text_source_2 TEXT,
  source_3 TEXT,
  source_4 TEXT,
  source_5 TEXT
);

-- Enable RLS
ALTER TABLE law_sources ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow public select on law_sources" ON law_sources
  FOR SELECT USING (true);

CREATE POLICY "Allow public insert on law_sources" ON law_sources
  FOR INSERT WITH CHECK (true);
```

## 📋 **CSV Column Mapping**

Your CSV columns will map directly to database columns:

| CSV Column | Database Column | Description |
|------------|-----------------|-------------|
| `state` | `state` | State name |
| `city` | `city` | City name |
| `Uniform Landlord Tenant Law` | `uniform_landlord_tenant_law` | Uniform law text |
| `Source  #1 Statute/Code` | `source_1_statute_code` | Legal statute/code |
| `Text Source #2` | `text_source_2` | Additional source |
| `Source #3` | `source_3` | Additional source |
| `Source #4` | `source_4` | Additional source |
| `Source #5` | `source_5` | Additional source |

## 🚀 **How to Upload CSV to Supabase**

### **Step 1: Prepare Your CSV**
1. Make sure your CSV has the exact column names:
   - `state`
   - `city` 
   - `Uniform Landlord Tenant Law`
   - `Source  #1 Statute/Code`
   - `Text Source #2`
   - `Source #3`
   - `Source #4`
   - `Source #5`

### **Step 2: Upload to Supabase**
1. Go to your Supabase dashboard
2. Navigate to **Table Editor**
3. Select the `law_sources` table
4. Click **Insert** → **From CSV**
5. Upload your CSV file
6. Map the columns correctly
7. Click **Import**

### **Step 3: Verify Upload**
```sql
-- Check your uploaded data
SELECT state, city, uniform_landlord_tenant_law, source_1_statute_code 
FROM law_sources 
ORDER BY state, city 
LIMIT 10;
```

## 🔧 **Update API to Join Data**

The API will automatically join the sources with your existing laws by state and city:

```sql
-- Query to get laws with their sources
SELECT 
  l.*,
  ls.uniform_landlord_tenant_law,
  ls.source_1_statute_code,
  ls.text_source_2,
  ls.source_3,
  ls.source_4,
  ls.source_5
FROM laws l
LEFT JOIN law_sources ls ON l.state = ls.state AND l.city = ls.city
WHERE l.state = $1
ORDER BY l.city, l.topic;
```

## 🎨 **Update UI Components**

The UI will automatically display sources when they exist for a state/city combination.

## ✅ **Benefits of This Approach**

- **Simple Upload**: Just upload CSV directly to Supabase
- **Automatic Linking**: Sources linked by state and city
- **No Complex Scripts**: No need for import scripts
- **Easy Updates**: Just re-upload CSV to update sources
- **Flexible**: Can have different sources for different topics in same city

## 🔄 **Data Flow**

1. **Upload Sources CSV** → `law_sources` table
2. **API Query** → Joins `laws` with `law_sources` by state/city
3. **UI Display** → Shows sources for each law automatically

This approach is much simpler and gives you exactly what you want!
