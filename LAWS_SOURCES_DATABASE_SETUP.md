# Laws Sources Database Setup

## 1. Update the `laws` Table

Add new columns to store multiple sources:

```sql
-- Add new columns to the existing laws table
ALTER TABLE laws 
ADD COLUMN uniform_law TEXT,
ADD COLUMN source_1_statute TEXT,
ADD COLUMN source_2 TEXT,
ADD COLUMN source_3 TEXT,
ADD COLUMN source_4 TEXT,
ADD COLUMN source_5 TEXT;
```

## 2. Alternative: Create a Separate Sources Table (Recommended)

For better normalization, create a separate sources table:

```sql
-- Create sources table
CREATE TABLE law_sources (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  law_id UUID REFERENCES laws(id) ON DELETE CASCADE,
  source_type TEXT NOT NULL, -- 'uniform_law', 'statute', 'source_2', etc.
  source_text TEXT NOT NULL,
  source_url TEXT, -- for hyperlinks
  display_order INTEGER DEFAULT 0
);

-- Enable RLS
ALTER TABLE law_sources ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow public select on law_sources" ON law_sources
  FOR SELECT USING (true);

CREATE POLICY "Allow public insert on law_sources" ON law_sources
  FOR INSERT WITH CHECK (true);
```

## 3. Sample Data Structure

Your CSV data would be structured like this:

### Option A: Single Table (Simpler)
```sql
INSERT INTO laws (state, city, topic, info, uniform_law, source_1_statute, source_2, source_3, source_4, source_5) 
VALUES 
('California', 'Los Angeles', 'Security Deposit', 'In Los Angeles, landlords can charge a maximum of 2 months rent...', 
 'Uniform Landlord Tenant Act', 'Cal. Civ. Code § 1950.5', 'https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml', 
 'City of LA Municipal Code', 'https://www.lacity.org/city-government/legal-issues', 'California Department of Consumer Affairs');
```

### Option B: Normalized Tables (Better)
```sql
-- Insert law
INSERT INTO laws (state, city, topic, info) 
VALUES ('California', 'Los Angeles', 'Security Deposit', 'In Los Angeles, landlords can charge a maximum of 2 months rent...');

-- Insert sources
INSERT INTO law_sources (law_id, source_type, source_text, source_url, display_order) VALUES
((SELECT id FROM laws WHERE state = 'California' AND city = 'Los Angeles' AND topic = 'Security Deposit'), 
 'uniform_law', 'Uniform Landlord Tenant Act', NULL, 1),
((SELECT id FROM laws WHERE state = 'California' AND city = 'Los Angeles' AND topic = 'Security Deposit'), 
 'statute', 'Cal. Civ. Code § 1950.5', 'https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml', 2),
((SELECT id FROM laws WHERE state = 'California' AND city = 'Los Angeles' AND topic = 'Security Deposit'), 
 'source_2', 'City of LA Municipal Code', 'https://www.lacity.org/city-government/legal-issues', 3),
((SELECT id FROM laws WHERE state = 'California' AND city = 'Los Angeles' AND topic = 'Security Deposit'), 
 'source_3', 'California Department of Consumer Affairs', NULL, 4);
```

## 4. CSV Import Process

### For Option A (Single Table):
1. Add the new columns to your CSV
2. Import directly into the `laws` table

### For Option B (Normalized):
1. Import basic law data into `laws` table
2. Process sources separately and insert into `law_sources` table

## 5. API Updates

Update your API to fetch sources:

```sql
-- Query with sources
SELECT l.*, ls.source_type, ls.source_text, ls.source_url, ls.display_order
FROM laws l
LEFT JOIN law_sources ls ON l.id = ls.law_id
WHERE l.state = $1
ORDER BY l.city, l.topic, ls.display_order;
```
