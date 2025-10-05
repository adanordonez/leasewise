// CSV Import Script for Law Sources
// This script helps you import your CSV data with multiple sources

const fs = require('fs');
const csv = require('csv-parser');

// Configuration
const CSV_FILE_PATH = './law-sources.csv'; // Update this path
const OUTPUT_FILE = './imported-law-sources.json';

// Function to detect if text is a URL
function isUrl(text) {
  try {
    new URL(text);
    return true;
  } catch {
    return false;
  }
}

// Function to process CSV data
function processCsvData() {
  const results = [];
  const sources = [];

  fs.createReadStream(CSV_FILE_PATH)
    .pipe(csv())
    .on('data', (row) => {
      // Extract basic law information
      const lawData = {
        state: row.state,
        city: row.city,
        topic: 'Security Deposit', // Update based on your data
        info: row['Uniform Landlord Tenant Law'] || 'Law information not available'
      };

      // Process sources
      const sourceFields = [
        { field: 'Uniform Landlord Tenant Law', type: 'uniform_law' },
        { field: 'Source  #1 Statute/Code', type: 'statute' },
        { field: 'Text Source #2', type: 'source_2' },
        { field: 'Source #3', type: 'source_3' },
        { field: 'Source #4', type: 'source_4' },
        { field: 'Source #5', type: 'source_5' }
      ];

      const lawSources = [];
      sourceFields.forEach((source, index) => {
        const sourceText = row[source.field];
        if (sourceText && sourceText.trim() !== '') {
          lawSources.push({
            source_type: source.type,
            source_text: sourceText.trim(),
            source_url: isUrl(sourceText) ? sourceText : null,
            display_order: index + 1
          });
        }
      });

      // Add law with sources
      results.push({
        ...lawData,
        law_sources: lawSources
      });
    })
    .on('end', () => {
      // Write results to JSON file
      fs.writeFileSync(OUTPUT_FILE, JSON.stringify(results, null, 2));
      console.log(`Processed ${results.length} laws with sources`);
      console.log(`Results saved to ${OUTPUT_FILE}`);
      
      // Generate SQL insert statements
      generateSqlInserts(results);
    });
}

// Function to generate SQL insert statements
function generateSqlInserts(laws) {
  let sql = '-- SQL Insert Statements for Laws with Sources\n\n';
  
  laws.forEach((law, index) => {
    // Insert law
    sql += `-- Law ${index + 1}: ${law.state}, ${law.city}\n`;
    sql += `INSERT INTO laws (state, city, topic, info) VALUES `;
    sql += `('${law.state.replace(/'/g, "''")}', '${law.city.replace(/'/g, "''")}', '${law.topic.replace(/'/g, "''")}', '${law.info.replace(/'/g, "''")}');\n`;
    
    // Insert sources
    if (law.law_sources && law.law_sources.length > 0) {
      sql += `-- Sources for ${law.state}, ${law.city}\n`;
      law.law_sources.forEach(source => {
        sql += `INSERT INTO law_sources (law_id, source_type, source_text, source_url, display_order) VALUES `;
        sql += `((SELECT id FROM laws WHERE state = '${law.state.replace(/'/g, "''")}' AND city = '${law.city.replace(/'/g, "''")}' AND topic = '${law.topic.replace(/'/g, "''")}'), `;
        sql += `'${source.source_type}', '${source.source_text.replace(/'/g, "''")}', `;
        sql += source.source_url ? `'${source.source_url.replace(/'/g, "''")}'` : 'NULL';
        sql += `, ${source.display_order});\n`;
      });
    }
    
    sql += '\n';
  });
  
  // Write SQL to file
  fs.writeFileSync('./import-law-sources.sql', sql);
  console.log('SQL insert statements saved to import-law-sources.sql');
}

// Run the script
if (require.main === module) {
  console.log('Starting CSV import process...');
  console.log('Make sure to install csv-parser: npm install csv-parser');
  processCsvData();
}

module.exports = { processCsvData, generateSqlInserts };
