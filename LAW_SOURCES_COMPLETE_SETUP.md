# 🏛️ **Complete Law Sources Setup Guide**

## 🎯 **Overview**

You now have a complete system to display multiple legal sources for each law, including hyperlinks! This handles your CSV with columns: `state`, `city`, `Uniform Landlord Tenant Law`, `Source #1 Statute/Code`, `Text Source #2`, `Source #3`, `Source #4`, `Source #5`.

## 📊 **Database Structure**

### **Option 1: Normalized Approach (Recommended)**

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

### **Option 2: Single Table Approach (Simpler)**

```sql
-- Add columns to existing laws table
ALTER TABLE laws 
ADD COLUMN uniform_law TEXT,
ADD COLUMN source_1_statute TEXT,
ADD COLUMN source_2 TEXT,
ADD COLUMN source_3 TEXT,
ADD COLUMN source_4 TEXT,
ADD COLUMN source_5 TEXT;
```

## 🚀 **How to Import Your CSV Data**

### **Method 1: Using the Import Script**

1. **Install dependencies:**
   ```bash
   cd /Users/adanordonez/Desktop/leasewise/leasewise-app
   npm install csv-parser
   ```

2. **Prepare your CSV:**
   - Save your CSV as `law-sources.csv` in the project root
   - Make sure columns match: `state`, `city`, `Uniform Landlord Tenant Law`, `Source #1 Statute/Code`, `Text Source #2`, `Source #3`, `Source #4`, `Source #5`

3. **Run the import script:**
   ```bash
   node scripts/import-law-sources.js
   ```

4. **Execute the generated SQL:**
   - The script creates `import-law-sources.sql`
   - Copy and paste the SQL into your Supabase SQL Editor
   - Run the SQL to import all data

### **Method 2: Manual Database Import**

1. **For Normalized Approach:**
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
    'source_2', 'City of LA Municipal Code', 'https://www.lacity.org/city-government/legal-issues', 3);
   ```

2. **For Single Table Approach:**
   ```sql
   INSERT INTO laws (state, city, topic, info, uniform_law, source_1_statute, source_2, source_3, source_4, source_5) 
   VALUES ('California', 'Los Angeles', 'Security Deposit', 'In Los Angeles, landlords can charge a maximum of 2 months rent...', 
           'Uniform Landlord Tenant Act', 'Cal. Civ. Code § 1950.5', 'https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml', 
           'City of LA Municipal Code', 'https://www.lacity.org/city-government/legal-issues', 'California Department of Consumer Affairs');
   ```

## 🎨 **UI Features**

### **Source Display:**
- **Icons**: Different icons for different source types
- **Hyperlinks**: Automatic detection and linking of URLs
- **Ordered Display**: Sources appear in logical order
- **Professional Styling**: Clean, organized presentation

### **Source Types:**
- **Uniform Law**: Scale icon
- **Statute/Code**: Book icon  
- **Other Sources**: File icon
- **Hyperlinks**: External link icon

### **Visual Design:**
- **Card Layout**: Each source in its own card
- **Hover Effects**: Interactive hover states
- **Color Coding**: Blue for links, gray for text
- **Responsive**: Works on all devices

## 🔧 **Technical Implementation**

### **API Updates:**
- **Fallback Support**: Works with or without sources table
- **Relationship Queries**: Fetches laws with their sources
- **Error Handling**: Graceful fallback to basic laws

### **Component Structure:**
- **LawSources Component**: Displays sources with hyperlinks
- **Icon System**: Different icons for different source types
- **URL Detection**: Automatic hyperlink detection
- **Responsive Design**: Mobile-friendly layout

## 📋 **CSV Data Mapping**

| CSV Column | Database Field | Source Type | Description |
|------------|----------------|-------------|-------------|
| `state` | `state` | - | State name |
| `city` | `city` | - | City name |
| `Uniform Landlord Tenant Law` | `info` | `uniform_law` | Main law text |
| `Source #1 Statute/Code` | - | `statute` | Legal statute/code |
| `Text Source #2` | - | `source_2` | Additional source |
| `Source #3` | - | `source_3` | Additional source |
| `Source #4` | - | `source_4` | Additional source |
| `Source #5` | - | `source_5` | Additional source |

## 🎯 **Ready to Use!**

### **What You Get:**
✅ **Multiple Sources**: Display up to 5 sources per law  
✅ **Hyperlink Support**: Automatic URL detection and linking  
✅ **Professional UI**: Clean, organized source display  
✅ **Icon System**: Visual indicators for different source types  
✅ **Responsive Design**: Works on all devices  
✅ **Database Flexibility**: Choose normalized or single table approach  

### **Next Steps:**
1. **Choose Database Approach**: Normalized (recommended) or single table
2. **Import Your CSV**: Use the script or manual import
3. **Test the UI**: View your laws with sources on the website
4. **Customize**: Adjust styling or add more source types as needed

---

**Your laws page now displays multiple legal sources with hyperlinks in a professional, organized way!** 🎉

**Users can click on statute links, view uniform laws, and access all your legal sources directly from the website!** ✨
