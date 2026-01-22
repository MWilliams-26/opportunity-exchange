const dns = require('dns');
const { promisify } = require('util');

const resolveDns = promisify(dns.resolve);

// NOTE: DNS-based availability checking is NOT 100% accurate.
// A domain that doesn't resolve may still be registered but not configured.
// For production, use a proper registrar API (GoDaddy, Namecheap, etc.)

const TLD_PRICING = {
  '.com': 12,
  '.net': 12,
  '.org': 12,
  '.io': 40,
  '.co': 30,
  '.app': 35,
  '.dev': 35,
};

const SUPPORTED_TLDS = Object.keys(TLD_PRICING);

const DOMAIN_PREFIXES = ['get', 'try', 'use', 'my', 'the', 'go', 'hey', ''];
const DOMAIN_SUFFIXES = ['app', 'hub', 'lab', 'hq', 'now', 'io', 'co', ''];

function generateDomainSuggestions(keyword) {
  const suggestions = [];
  const cleanKeyword = keyword.toLowerCase().replace(/[^a-z0-9]/g, '');
  
  if (!cleanKeyword) return suggestions;

  for (const tld of SUPPORTED_TLDS) {
    suggestions.push(`${cleanKeyword}${tld}`);
    
    for (const prefix of DOMAIN_PREFIXES) {
      if (prefix) {
        suggestions.push(`${prefix}${cleanKeyword}${tld}`);
      }
    }
    
    for (const suffix of DOMAIN_SUFFIXES) {
      if (suffix) {
        suggestions.push(`${cleanKeyword}${suffix}${tld}`);
      }
    }
  }

  const uniqueSuggestions = [...new Set(suggestions)];
  return uniqueSuggestions.slice(0, 30);
}

async function checkDomainAvailability(domain) {
  const tld = SUPPORTED_TLDS.find(t => domain.endsWith(t)) || '.com';
  const estimatedCost = TLD_PRICING[tld] || 15;

  try {
    await resolveDns(domain, 'A');
    return { domain, available: false, estimatedCost, tld };
  } catch (err) {
    if (err.code === 'ENOTFOUND' || err.code === 'ENODATA') {
      return { domain, available: true, estimatedCost, tld };
    }
    return { domain, available: false, estimatedCost, tld, error: 'DNS lookup failed' };
  }
}

async function searchAvailableDomains(keyword, limit = 10) {
  const suggestions = generateDomainSuggestions(keyword);
  
  const results = await Promise.all(
    suggestions.map(domain => checkDomainAvailability(domain))
  );

  const available = results
    .filter(r => r.available)
    .slice(0, limit)
    .map(r => ({
      name: r.domain,
      type: 'domain',
      available: true,
      estimated_cost: r.estimatedCost,
      tld: r.tld,
      source: 'dns_lookup',
      note: 'Availability based on DNS lookup - verify with registrar before purchase'
    }));

  return available;
}

// NOTE: Business name availability requires state-specific lookups
// (Secretary of State databases). Out of scope for MVP.
// Structure is here for future implementation.
async function checkBusinessNameAvailability(name, state) {
  return {
    name,
    state,
    available: null,
    note: 'Business name lookup requires state-specific database access. Not implemented in MVP.',
    suggestedAction: 'Check your state Secretary of State website manually'
  };
}

module.exports = {
  generateDomainSuggestions,
  checkDomainAvailability,
  searchAvailableDomains,
  checkBusinessNameAvailability,
  SUPPORTED_TLDS,
  TLD_PRICING
};
