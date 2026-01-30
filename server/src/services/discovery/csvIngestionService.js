const fs = require('fs');
const path = require('path');
const db = require('../../db/schema');
const { calculateScore, generateWhyInteresting } = require('../scoring/scoringService');

const COLUMN_MAPPINGS = {
  domain: ['domain', 'domainname', 'name'],
  tld: ['tld', 'extension'],
  backlinks: ['bl', 'backlinks', 'links'],
  referring_domains: ['dp', 'domainpop', 'rd', 'referringdomains'],
  archive_org_age: ['aby', 'archiveage', 'waybackage'],
  delete_date: ['datependingdelete', 'deletedate', 'dropdate', 'pendingdelete'],
  expiry_date: ['expirydate', 'expiration', 'expires'],
  majestic_tf: ['tf', 'trustflow'],
  majestic_cf: ['cf', 'citationflow'],
  moz_da: ['da', 'domainauthority'],
  moz_pa: ['pa', 'pageauthority'],
};

function normalizeHeader(header) {
  return header.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if ((char === ',' || char === ';') && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

function findColumnIndex(headers, possibleNames) {
  const normalizedHeaders = headers.map(normalizeHeader);
  for (const name of possibleNames) {
    const index = normalizedHeaders.indexOf(normalizeHeader(name));
    if (index !== -1) return index;
  }
  return -1;
}

function extractTLD(domain) {
  const parts = domain.split('.');
  return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : 'com';
}

function parseDate(dateStr) {
  if (!dateStr || dateStr === '-' || dateStr === '') return null;
  
  const formats = [
    /^(\d{4})-(\d{2})-(\d{2})$/,
    /^(\d{2})\/(\d{2})\/(\d{4})$/,
    /^(\d{2})-(\d{2})-(\d{4})$/,
  ];
  
  for (const format of formats) {
    const match = dateStr.match(format);
    if (match) {
      try {
        const date = new Date(dateStr);
        if (!isNaN(date.getTime())) {
          return date.toISOString().split('T')[0];
        }
      } catch {
        continue;
      }
    }
  }
  
  try {
    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) {
      return date.toISOString().split('T')[0];
    }
  } catch {
    return null;
  }
  
  return null;
}

function parseIntValue(value, defaultValue = 0) {
  if (!value || value === '-' || value === '') return defaultValue;
  const parsed = Number.parseInt(value, 10);
  return isNaN(parsed) ? defaultValue : parsed;
}

async function importFromCSV(filePath, options = {}) {
  const { dryRun = false, skipExisting = true } = options;
  
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }
  
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n').filter(line => line.trim());
  
  if (lines.length < 2) {
    throw new Error('CSV file must have at least a header row and one data row');
  }
  
  const headers = parseCSVLine(lines[0]);
  
  const columnIndices = {};
  for (const [field, possibleNames] of Object.entries(COLUMN_MAPPINGS)) {
    columnIndices[field] = findColumnIndex(headers, possibleNames);
  }
  
  if (columnIndices.domain === -1) {
    throw new Error('Could not find domain column in CSV. Expected: Domain, DomainName, or Name');
  }
  
  const results = {
    total: lines.length - 1,
    imported: 0,
    skipped: 0,
    errors: [],
  };
  
  const insertStmt = db.prepare(`
    INSERT OR REPLACE INTO expiring_domains (
      domain, tld, expiry_date, delete_date, backlinks, referring_domains,
      archive_org_age, majestic_tf, majestic_cf, moz_da, moz_pa, score, why_interesting, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
  `);
  
  const checkStmt = db.prepare('SELECT id FROM expiring_domains WHERE domain = ?');
  
  const seenDomains = new Set();
  
  const importMany = db.transaction((rows) => {
    for (const row of rows) {
      try {
        const values = parseCSVLine(row);
        const domainName = values[columnIndices.domain]?.toLowerCase().trim();
        
        if (!domainName || domainName.length < 3) {
          results.skipped++;
          continue;
        }
        
        if (seenDomains.has(domainName)) {
          results.skipped++;
          continue;
        }
        seenDomains.add(domainName);
        
        if (skipExisting) {
          const existing = checkStmt.get(domainName);
          if (existing) {
            results.skipped++;
            continue;
          }
        }
        
        const domainData = {
          domain: domainName,
          tld: columnIndices.tld !== -1 ? values[columnIndices.tld]?.toLowerCase() : extractTLD(domainName),
          expiry_date: columnIndices.expiry_date !== -1 ? parseDate(values[columnIndices.expiry_date]) : null,
          delete_date: columnIndices.delete_date !== -1 ? parseDate(values[columnIndices.delete_date]) : null,
          backlinks: parseIntValue(values[columnIndices.backlinks]),
          referring_domains: parseIntValue(values[columnIndices.referring_domains]),
          archive_org_age: parseIntValue(values[columnIndices.archive_org_age]),
          majestic_tf: parseIntValue(values[columnIndices.majestic_tf]),
          majestic_cf: parseIntValue(values[columnIndices.majestic_cf]),
          moz_da: parseIntValue(values[columnIndices.moz_da]),
          moz_pa: parseIntValue(values[columnIndices.moz_pa]),
        };
        
        const { score, breakdown } = calculateScore(domainData);
        domainData.score = score;
        domainData.why_interesting = generateWhyInteresting(domainData, breakdown);
        
        if (!dryRun) {
          insertStmt.run(
            domainData.domain,
            domainData.tld,
            domainData.expiry_date,
            domainData.delete_date,
            domainData.backlinks,
            domainData.referring_domains,
            domainData.archive_org_age,
            domainData.majestic_tf,
            domainData.majestic_cf,
            domainData.moz_da,
            domainData.moz_pa,
            domainData.score,
            domainData.why_interesting
          );
        }
        
        results.imported++;
      } catch (err) {
        results.errors.push({ row, error: err.message });
      }
    }
  });
  
  importMany(lines.slice(1));
  
  return results;
}

module.exports = {
  importFromCSV,
  parseCSVLine,
  normalizeHeader,
  COLUMN_MAPPINGS,
};
