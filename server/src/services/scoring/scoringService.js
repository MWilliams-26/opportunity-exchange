const SCORE_WEIGHTS = {
  backlinks: { max: 30, thresholds: [{ min: 1000, score: 30 }, { min: 100, score: 20 }, { min: 10, score: 10 }, { min: 1, score: 5 }] },
  referringDomains: { max: 25, thresholds: [{ min: 100, score: 25 }, { min: 50, score: 20 }, { min: 10, score: 15 }, { min: 1, score: 5 }] },
  trustFlow: { max: 20, thresholds: [{ min: 30, score: 20 }, { min: 20, score: 15 }, { min: 10, score: 10 }, { min: 1, score: 5 }] },
  domainAge: { max: 15, thresholds: [{ min: 15, score: 15 }, { min: 10, score: 12 }, { min: 5, score: 8 }, { min: 1, score: 3 }] },
  tld: { max: 10, premium: ['com', 'net', 'org', 'io', 'co'] },
};

function calculateScore(domain) {
  const breakdown = [];
  let totalScore = 0;

  const blScore = getThresholdScore(domain.backlinks || 0, SCORE_WEIGHTS.backlinks.thresholds);
  if (blScore > 0) {
    totalScore += blScore;
    breakdown.push({ factor: 'backlinks', value: domain.backlinks, score: blScore, max: SCORE_WEIGHTS.backlinks.max });
  }

  const rdScore = getThresholdScore(domain.referring_domains || 0, SCORE_WEIGHTS.referringDomains.thresholds);
  if (rdScore > 0) {
    totalScore += rdScore;
    breakdown.push({ factor: 'referringDomains', value: domain.referring_domains, score: rdScore, max: SCORE_WEIGHTS.referringDomains.max });
  }

  const tfScore = getThresholdScore(domain.majestic_tf || 0, SCORE_WEIGHTS.trustFlow.thresholds);
  if (tfScore > 0) {
    totalScore += tfScore;
    breakdown.push({ factor: 'trustFlow', value: domain.majestic_tf, score: tfScore, max: SCORE_WEIGHTS.trustFlow.max });
  }

  const ageScore = getThresholdScore(domain.archive_org_age || 0, SCORE_WEIGHTS.domainAge.thresholds);
  if (ageScore > 0) {
    totalScore += ageScore;
    breakdown.push({ factor: 'domainAge', value: domain.archive_org_age, score: ageScore, max: SCORE_WEIGHTS.domainAge.max });
  }

  const tld = (domain.tld || '').toLowerCase();
  if (SCORE_WEIGHTS.tld.premium.includes(tld)) {
    totalScore += SCORE_WEIGHTS.tld.max;
    breakdown.push({ factor: 'tld', value: tld, score: SCORE_WEIGHTS.tld.max, max: SCORE_WEIGHTS.tld.max });
  }

  return { score: totalScore, breakdown };
}

function getThresholdScore(value, thresholds) {
  for (const t of thresholds) {
    if (value >= t.min) return t.score;
  }
  return 0;
}

function generateWhyInteresting(domain, scoreBreakdown) {
  const reasons = [];

  for (const item of scoreBreakdown) {
    switch (item.factor) {
      case 'backlinks':
        if (item.value >= 100) reasons.push(`Strong backlink profile (${item.value.toLocaleString()} links)`);
        break;
      case 'referringDomains':
        if (item.value >= 50) reasons.push(`${item.value} referring domains`);
        break;
      case 'trustFlow':
        if (item.value >= 20) reasons.push(`High trust flow (${item.value})`);
        break;
      case 'domainAge':
        if (item.value >= 10) reasons.push(`Established domain (${item.value}+ years old)`);
        break;
      case 'tld':
        if (item.value === 'com') reasons.push('Premium .com TLD');
        break;
    }
  }

  if (domain.majestic_tf && domain.majestic_cf && domain.majestic_tf > domain.majestic_cf) {
    reasons.push('Quality backlinks (TF > CF)');
  }

  const nameWithoutTld = domain.domain?.split('.')[0] || '';
  if (nameWithoutTld.length <= 6) {
    reasons.push(`Short name (${nameWithoutTld.length} chars)`);
  }

  return reasons.length > 0 ? reasons.join('. ') + '.' : 'Standard metrics.';
}

module.exports = {
  calculateScore,
  generateWhyInteresting,
  SCORE_WEIGHTS,
};
