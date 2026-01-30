#!/usr/bin/env node

/**
 * Import expiring domains from ExpiredDomains.net CSV files
 * 
 * Usage:
 *   node scripts/import-domains.js <csv-file>
 *   node scripts/import-domains.js data/expired-domains.csv --dry-run
 *   node scripts/import-domains.js data/expired-domains.csv --replace
 */

const path = require('path');
const csvIngestionService = require('../src/services/discovery/csvIngestionService');

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    console.log(`
Import Expiring Domains from ExpiredDomains.net CSV

Usage:
  node scripts/import-domains.js <csv-file> [options]

Options:
  --dry-run   Preview import without making changes
  --replace   Replace existing domains (default: skip)
  --help      Show this help message

Examples:
  node scripts/import-domains.js data/deleted-com.csv
  node scripts/import-domains.js data/pending-delete.csv --dry-run

CSV files should be placed in the server/data/ directory.
Download them from https://www.expireddomains.net
    `);
    process.exit(0);
  }
  
  const csvFile = args.find(arg => !arg.startsWith('--'));
  const dryRun = args.includes('--dry-run');
  const replace = args.includes('--replace');
  
  if (!csvFile) {
    console.error('Error: Please provide a CSV file path');
    process.exit(1);
  }
  
  const serverDir = path.join(__dirname, '..');
  let filePath = csvFile;
  
  if (!path.isAbsolute(csvFile)) {
    filePath = path.join(serverDir, csvFile);
  }
  
  console.log(`\n📂 Importing from: ${filePath}`);
  console.log(`   Mode: ${dryRun ? 'DRY RUN' : 'LIVE IMPORT'}`);
  console.log(`   Existing: ${replace ? 'REPLACE' : 'SKIP'}\n`);
  
  try {
    const startTime = Date.now();
    
    const results = await csvIngestionService.importFromCSV(filePath, {
      dryRun,
      skipExisting: !replace,
    });
    
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
    
    console.log(`\n✅ Import ${dryRun ? 'preview' : 'complete'}!\n`);
    console.log(`   Total rows:  ${results.total}`);
    console.log(`   Imported:    ${results.imported}`);
    console.log(`   Skipped:     ${results.skipped}`);
    console.log(`   Errors:      ${results.errors.length}`);
    console.log(`   Time:        ${elapsed}s\n`);
    
    if (results.errors.length > 0) {
      console.log('⚠️  Errors (first 5):');
      results.errors.slice(0, 5).forEach((err, i) => {
        console.log(`   ${i + 1}. ${err.error}`);
      });
    }
    
  } catch (err) {
    console.error(`\n❌ Error: ${err.message}\n`);
    process.exit(1);
  }
}

main();
