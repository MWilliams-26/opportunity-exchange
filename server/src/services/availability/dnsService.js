const dns = require('dns').promises;
const db = require('../../db/schema');

const DNS_CACHE_TTL_HOURS = 24;

async function checkAvailability(domain) {
  const cached = getCachedResult(domain);
  if (cached !== null) {
    return cached;
  }

  try {
    await dns.lookup(domain);
    await cacheResult(domain, false);
    return { available: false, source: 'dns', cached: false };
  } catch (err) {
    if (err.code === 'ENOTFOUND') {
      await cacheResult(domain, true);
      return { available: true, source: 'dns', cached: false };
    }
    throw err;
  }
}

function getCachedResult(domain) {
  const row = db.prepare(`
    SELECT dns_available, dns_checked_at 
    FROM expiring_domains 
    WHERE domain = ? 
    AND dns_checked_at > datetime('now', '-${DNS_CACHE_TTL_HOURS} hours')
  `).get(domain);
  
  if (row) {
    return { available: !!row.dns_available, source: 'dns', cached: true };
  }
  return null;
}

async function cacheResult(domain, available) {
  db.prepare(`
    UPDATE expiring_domains 
    SET dns_available = ?, dns_checked_at = CURRENT_TIMESTAMP 
    WHERE domain = ?
  `).run(available ? 1 : 0, domain);
}

async function checkMultiple(domains, concurrency = 5) {
  const results = [];
  for (let i = 0; i < domains.length; i += concurrency) {
    const batch = domains.slice(i, i + concurrency);
    const batchResults = await Promise.all(
      batch.map(d => checkAvailability(d).catch(err => ({ domain: d, error: err.message })))
    );
    results.push(...batchResults);
  }
  return results;
}

module.exports = {
  checkAvailability,
  checkMultiple,
  DNS_CACHE_TTL_HOURS,
};
