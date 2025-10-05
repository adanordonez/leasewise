# Laws Database Setup

## 1. Create the Laws Table

Run this SQL in your Supabase SQL Editor:

```sql
-- Create laws table
CREATE TABLE laws (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  state TEXT NOT NULL,
  city TEXT NOT NULL,
  topic TEXT NOT NULL,
  info TEXT NOT NULL
);

-- Create indexes for better performance
CREATE INDEX idx_laws_state ON laws(state);
CREATE INDEX idx_laws_city ON laws(city);
CREATE INDEX idx_laws_topic ON laws(topic);
CREATE INDEX idx_laws_state_city ON laws(state, city);
CREATE INDEX idx_laws_state_topic ON laws(state, topic);

-- Enable RLS
ALTER TABLE laws ENABLE ROW LEVEL SECURITY;

-- Create policies for public access
CREATE POLICY "Allow public select on laws" ON laws
  FOR SELECT USING (true);

CREATE POLICY "Allow public insert on laws" ON laws
  FOR INSERT WITH CHECK (true);
```

## 2. Import Your CSV Data

You can import your CSV data using one of these methods:

### Method A: Supabase Dashboard
1. Go to your Supabase dashboard
2. Navigate to Table Editor
3. Select the `laws` table
4. Click "Insert" → "Import data from CSV"
5. Upload your CSV file

### Method B: SQL Insert (if you have a small dataset)
```sql
INSERT INTO laws (state, city, topic, info) VALUES
('California', 'Los Angeles', 'Security Deposit', 'Maximum security deposit is 2 months rent for unfurnished units, 3 months for furnished units.'),
('California', 'San Francisco', 'Security Deposit', 'Maximum security deposit is 2 months rent for unfurnished units, 3 months for furnished units.'),
-- Add more rows as needed
```

## 3. Verify the Data

```sql
-- Check total count
SELECT COUNT(*) FROM laws;

-- Check unique states
SELECT DISTINCT state FROM laws ORDER BY state;

-- Check unique topics
SELECT DISTINCT topic FROM laws ORDER BY topic;

-- Check data for a specific state
SELECT * FROM laws WHERE state = 'California' ORDER BY city, topic;
```

## 4. Sample Data Structure

Your CSV should have these columns:
- `state`: Full state name (e.g., "California", "New York")
- `city`: City name (e.g., "Los Angeles", "San Francisco")
- `topic`: Law category (e.g., "Security Deposit", "Rent Control", "Eviction")
- `info`: Detailed law information

## 5. Expected Categories

Based on common landlord-tenant law topics, you might want to include:
- Security Deposit
- Rent Control
- Eviction Process
- Notice Requirements
- Habitability Standards
- Discrimination Laws
- Lease Terms
- Property Maintenance
