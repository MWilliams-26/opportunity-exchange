const db = require('../../db/schema');

const WHOIS_CACHE_TTL_HOURS = 72;
const WHOIS_API_BASE = 'https://www.whoisxmlapi.com/whoisserver/WhoisService';

const API_KEY = process.env.WHOISXML_API_KEY;

async function enrichDomain(domain) {
  const cached = getCachedWhois(domain);
  if (cached) {
    return { ...cached, cached: true };
  }

  if (!API_KEY) {
    console.warn('WHOISXML_API_KEY not set - returning stub data');
    return {
      domain,
      registrar: null,
      createdDate: null,
      expiresDate: null,
      enriched: false,
      reason: 'API key not configured',
    };
  }

  try {
    const response = await fetch(
      `${WHOIS_API_BASE}?apiKey=${API_KEY}&domainName=${domain}&outputFormat=JSON`
    );
    const data = await response.json();
    
    const result = {
      domain,
      registrar: data.WhoisRecord?.registrarName || null,
      createdDate: data.WhoisRecord?.createdDate || null,
      expiresDate: data.WhoisRecord?.expiresDate || null,
      rawData: data,
      enriched: true,
    };
    
    cacheWhoisResult(domain, result);
    
    return { ...result, cached: false };
  } catch (err) {
    console.error(`WHOIS lookup failed for ${domain}:`, err.message);
    return {
      domain,
      enriched: false,
      error: err.message,
    };
  }
}

function getCachedWhois(domain) {
  const row = db.prepare(`
    SELECT whois_data, whois_fetched_at 
    FROM expiring_domains 
    WHERE domain = ? 
    AND whois_fetched_at > datetime('now', '-${WHOIS_CACHE_TTL_HOURS} hours')
    AND whois_data IS NOT NULL
  `).get(domain);
  
  if (row && row.whois_data) {
    try {
      return JSON.parse(row.whois_data);
    } catch {
      return null;
    }
  }
  return null;
}

function cacheWhoisResult(domain, result) {
  db.prepare(`
    UPDATE expiring_domains 
    SET whois_data = ?, whois_fetched_at = CURRENT_TIMESTAMP 
    WHERE domain = ?
  `).run(JSON.stringify(result), domain);
}

function shouldEnrich(domain) {
  const row = db.prepare(`
    SELECT is_favorite, delete_date, whois_fetched_at
    FROM expiring_domains
    WHERE domain = ?
  `).get(domain);
  
  if (!row) return false;
  
  if (row.whois_fetched_at) {
    const fetchedAt = new Date(row.whois_fetched_at);
    const hoursSince = (Date.now() - fetchedAt.getTime()) / (1000 * 60 * 60);
    if (hoursSince < WHOIS_CACHE_TTL_HOURS) return false;
  }
  
  if (row.is_favorite) return true;
  
  if (row.delete_date) {
    const deleteDate = new Date(row.delete_date);
    const daysUntil = (deleteDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
    if (daysUntil <= 7) return true;
  }
  
  return false;
}

module.exports = {
  enrichDomain,
  shouldEnrich,
  WHOIS_CACHE_TTL_HOURS,
};
