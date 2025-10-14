#!/usr/bin/env node

/**
 * Copy PDF.js worker to public directory
 * This ensures the worker is available for the PDF viewer
 * Run this after: npm install
 */

const fs = require('fs');
const path = require('path');

const source = path.join(__dirname, '../node_modules/pdfjs-dist/build/pdf.worker.min.mjs');
const dest = path.join(__dirname, '../public/pdf.worker.min.mjs');

try {
  // Check if source exists
  if (!fs.existsSync(source)) {
    console.error('❌ Source file not found:', source);
    console.error('Make sure pdfjs-dist is installed: npm install pdfjs-dist');
    process.exit(1);
  }

  // Copy file
  fs.copyFileSync(source, dest);
  console.log('✅ PDF.js worker copied successfully!');
  console.log(`   From: ${source}`);
  console.log(`   To: ${dest}`);
} catch (error) {
  console.error('❌ Error copying PDF.js worker:', error.message);
  process.exit(1);
}

