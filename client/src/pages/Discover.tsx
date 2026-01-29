import { useState, useEffect, type FormEvent } from 'react';
import { Input, Button, Card, Badge, Select, Modal } from '../components/ui';
import { Timer } from '../components/ui/Timer';
import { useAuth } from '../context/AuthContext';

interface ExpiringDomain {
  name: string;
  tld: string;
  expiryDate: string;
  estimatedValue: number;
  length: number;
}

interface WatchlistItem {
  id: string;
  domain: string;
  expiryDate: string;
  addedAt: string;
}

const TLD_OPTIONS = [
  { value: '', label: 'All TLDs' },
  { value: '.com', label: '.com' },
  { value: '.net', label: '.net' },
  { value: '.org', label: '.org' },
  { value: '.io', label: '.io' },
];

const MAX_LENGTH_OPTIONS = [
  { value: '', label: 'Any Length' },
  { value: '4', label: '4 characters or less' },
  { value: '6', label: '6 characters or less' },
  { value: '8', label: '8 characters or less' },
  { value: '10', label: '10 characters or less' },
];

const PREFIXES = ['my', 'go', 'get', 'the', 'pro', 'best', 'top', 'e', 'i', 'x'];
const SUFFIXES = ['hub', 'lab', 'ly', 'ify', 'io', 'app', 'hq', 'zone', 'spot', 'box'];

function generateMockDomains(keyword: string, tld: string, maxLength: number): ExpiringDomain[] {
  const domains: ExpiringDomain[] = [];
  const tlds = tld ? [tld] : ['.com', '.net', '.org', '.io'];
  const now = Date.now();

  const candidates: string[] = [];
  
  tlds.forEach(t => {
    candidates.push(`${keyword}${t}`);
    PREFIXES.forEach(prefix => {
      candidates.push(`${prefix}${keyword}${t}`);
    });
    SUFFIXES.forEach(suffix => {
      candidates.push(`${keyword}${suffix}${t}`);
    });
    candidates.push(`${keyword}2024${t}`);
    candidates.push(`${keyword}pro${t}`);
  });

  const shuffled = candidates.sort(() => Math.random() - 0.5);
  const selected = shuffled.slice(0, 12);

  selected.forEach(domain => {
    const domainTld = tlds.find(t => domain.endsWith(t)) || '.com';
    const nameWithoutTld = domain.replace(domainTld, '');
    const length = nameWithoutTld.length;

    if (maxLength && length > maxLength) return;

    const daysUntilExpiry = Math.floor(Math.random() * 30) + 1;
    const expiryDate = new Date(now + daysUntilExpiry * 24 * 60 * 60 * 1000).toISOString();

    let estimatedValue = 50;
    if (length <= 4) estimatedValue = Math.floor(Math.random() * 500) + 500;
    else if (length <= 6) estimatedValue = Math.floor(Math.random() * 300) + 200;
    else if (length <= 8) estimatedValue = Math.floor(Math.random() * 150) + 100;
    else estimatedValue = Math.floor(Math.random() * 50) + 50;

    if (domainTld === '.com') estimatedValue *= 2;
    else if (domainTld === '.io') estimatedValue *= 1.5;

    domains.push({
      name: domain,
      tld: domainTld,
      expiryDate,
      estimatedValue: Math.round(estimatedValue),
      length,
    });
  });

  return domains.sort((a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime());
}

export function Discover() {
  const { isAuthenticated } = useAuth();
  const [keyword, setKeyword] = useState('');
  const [tldFilter, setTldFilter] = useState('');
  const [maxLength, setMaxLength] = useState('');
  const [results, setResults] = useState<ExpiringDomain[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [watchlistLoading, setWatchlistLoading] = useState(false);
  const [selectedDomain, setSelectedDomain] = useState<ExpiringDomain | null>(null);
  const [showRegisterModal, setShowRegisterModal] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      fetchWatchlist();
    }
  }, [isAuthenticated]);

  const fetchWatchlist = async () => {
    setWatchlistLoading(true);
    try {
      const mockWatchlist: WatchlistItem[] = [];
      setWatchlist(mockWatchlist);
    } catch (err) {
      console.error('Failed to fetch watchlist:', err);
    } finally {
      setWatchlistLoading(false);
    }
  };

  const handleSearch = async (e: FormEvent) => {
    e.preventDefault();
    if (!keyword.trim()) return;

    setLoading(true);
    setHasSearched(true);

    await new Promise(resolve => setTimeout(resolve, 500));

    const domains = generateMockDomains(
      keyword.trim().toLowerCase(),
      tldFilter,
      maxLength ? parseInt(maxLength) : 0
    );
    setResults(domains);
    setLoading(false);
  };

  const handleAddToWatchlist = (domain: ExpiringDomain) => {
    const newItem: WatchlistItem = {
      id: Date.now().toString(),
      domain: domain.name,
      expiryDate: domain.expiryDate,
      addedAt: new Date().toISOString(),
    };
    setWatchlist(prev => [...prev, newItem]);
  };

  const handleRemoveFromWatchlist = (id: string) => {
    setWatchlist(prev => prev.filter(item => item.id !== id));
  };

  const isInWatchlist = (domainName: string) => {
    return watchlist.some(item => item.domain === domainName);
  };

  const handleRegisterClick = (domain: ExpiringDomain) => {
    setSelectedDomain(domain);
    setShowRegisterModal(true);
  };

  const getRegistrarLinks = (domain: string) => [
    { name: 'GoDaddy', url: `https://www.godaddy.com/domainsearch/find?domainToCheck=${domain}` },
    { name: 'Namecheap', url: `https://www.namecheap.com/domains/registration/results/?domain=${domain}` },
    { name: 'Porkbun', url: `https://porkbun.com/checkout/search?q=${domain}` },
    { name: 'Dynadot', url: `https://www.dynadot.com/domain/search?domain=${domain}` },
  ];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getDaysUntilExpiry = (expiryDate: string) => {
    const days = Math.ceil((new Date(expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return days;
  };

  return (
    <div className="section">
      <div className="container-wide">
        <div className="mb-8">
          <h1 className="page-title mb-2">Find Expiring Domains</h1>
          <p className="text-lg text-slate-600 mb-4">
            Discover valuable domains about to expire. Register for ~$12, flip for $100-$1000+
          </p>
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
            <h3 className="font-semibold text-slate-800 mb-2">How Domain Flipping Works</h3>
            <ol className="text-sm text-slate-600 space-y-1 list-decimal list-inside">
              <li>Find expiring domains with valuable characteristics (short, memorable, .com)</li>
              <li>Register them for standard registration cost (~$10-15)</li>
              <li>List them for sale on marketplaces or directly to buyers</li>
              <li>Profit from the difference between registration and sale price</li>
            </ol>
          </div>
        </div>

        <form onSubmit={handleSearch} className="card mb-8">
          <h2 className="font-semibold text-slate-800 mb-4">Search Expiring Domains</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div className="md:col-span-1">
              <Input
                label="Keyword"
                placeholder="e.g., crypto, fitness, ai"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
              />
            </div>
            <div>
              <Select
                label="TLD"
                options={TLD_OPTIONS}
                value={tldFilter}
                onChange={(e) => setTldFilter(e.target.value)}
              />
            </div>
            <div>
              <Select
                label="Max Length"
                options={MAX_LENGTH_OPTIONS}
                value={maxLength}
                onChange={(e) => setMaxLength(e.target.value)}
              />
            </div>
            <div className="flex items-end">
              <Button type="submit" loading={loading} className="w-full">
                Search Domains
              </Button>
            </div>
          </div>
        </form>

        {isAuthenticated && watchlist.length > 0 && (
          <div className="card mb-8">
            <h2 className="font-semibold text-slate-800 mb-4">Your Watchlist</h2>
            <div className="space-y-3">
              {watchlistLoading ? (
                <div className="skeleton h-16 w-full" />
              ) : (
                watchlist.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                  >
                    <div>
                      <p className="font-medium text-slate-800">{item.domain}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant={getDaysUntilExpiry(item.expiryDate) <= 3 ? 'error' : 'warning'}>
                          {getDaysUntilExpiry(item.expiryDate)} days left
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <Timer endDate={item.expiryDate} className="text-sm" />
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleRemoveFromWatchlist(item.id)}
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {loading ? (
          <div className="grid-cards">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="card">
                <div className="skeleton h-6 w-20 mb-4" />
                <div className="skeleton h-6 w-full mb-2" />
                <div className="skeleton h-4 w-3/4 mb-4" />
                <div className="skeleton h-4 w-1/2" />
              </div>
            ))}
          </div>
        ) : !hasSearched ? (
          <div className="text-center py-12">
            <p className="text-lg text-slate-600 mb-2">Enter a keyword to find expiring domains</p>
            <p className="text-slate-500">We'll show you domains expiring in the next 30 days.</p>
          </div>
        ) : results.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-lg text-slate-600 mb-4">No expiring domains found for "{keyword}".</p>
            <p className="text-slate-500">Try a different keyword or adjust your filters.</p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-slate-800">
                {results.length} Expiring Domains Found
              </h2>
              <p className="text-sm text-slate-500">Sorted by expiry date</p>
            </div>
            <div className="grid-cards">
              {results.map((domain) => (
                <Card key={domain.name} hover className="flex flex-col h-full">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <Badge variant="info">{domain.tld}</Badge>
                    <Badge variant={getDaysUntilExpiry(domain.expiryDate) <= 3 ? 'error' : 'warning'}>
                      {getDaysUntilExpiry(domain.expiryDate)} days
                    </Badge>
                  </div>

                  <h3 className="text-lg font-semibold text-slate-800 mb-2">
                    {domain.name}
                  </h3>

                  <div className="flex gap-4 text-sm text-slate-500 mb-4">
                    <span>{domain.length} chars</span>
                    <span>•</span>
                    <span>Est. Value: <span className="text-emerald-600 font-medium">{formatCurrency(domain.estimatedValue)}</span></span>
                  </div>

                  <div className="mt-auto pt-4 border-t border-slate-100">
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-sm text-slate-500">Registration Cost</span>
                      <span className="font-medium text-slate-800">~$12</span>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        className="flex-1"
                        onClick={() => handleRegisterClick(domain)}
                      >
                        Register Now
                      </Button>
                      {isAuthenticated && (
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => handleAddToWatchlist(domain)}
                          disabled={isInWatchlist(domain.name)}
                        >
                          {isInWatchlist(domain.name) ? 'Watching' : 'Watch'}
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </>
        )}

        <div className="mt-12 bg-emerald-50 border border-emerald-200 rounded-lg p-6">
          <h2 className="font-semibold text-emerald-800 mb-4">Tips for Finding Valuable Domains</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium text-emerald-700 mb-2">What Makes a Domain Valuable</h3>
              <ul className="text-sm text-emerald-700 space-y-1 list-disc list-inside">
                <li><strong>Short length</strong> - 4-6 character domains are premium</li>
                <li><strong>.com TLD</strong> - Most valuable and recognized extension</li>
                <li><strong>Memorable</strong> - Easy to spell and remember</li>
                <li><strong>Trending keywords</strong> - AI, crypto, tech, health</li>
                <li><strong>Brandable</strong> - Could work as a company name</li>
              </ul>
            </div>
            <div>
              <h3 className="font-medium text-emerald-700 mb-2">Pro Tips</h3>
              <ul className="text-sm text-emerald-700 space-y-1 list-disc list-inside">
                <li>Set up alerts for domains you're watching</li>
                <li>Research comparable sales on NameBio.com</li>
                <li>Consider renewal costs in your ROI calculation</li>
                <li>List on multiple marketplaces for exposure</li>
                <li>Be patient - good domains can take months to sell</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-6 bg-amber-50 border border-amber-200 rounded-lg p-4">
          <p className="text-sm text-amber-800">
            <strong>MVP Notice:</strong> Domain expiry data shown is simulated for demonstration purposes. 
            In production, this would connect to expiring domain APIs like ExpiredDomains.net or DropCatch.
          </p>
        </div>

        <Modal
          isOpen={showRegisterModal}
          onClose={() => setShowRegisterModal(false)}
          title="Register Domain"
          footer={<Button variant="secondary" onClick={() => setShowRegisterModal(false)}>Close</Button>}
        >
          {selectedDomain && (
            <div className="space-y-4">
              <div className="bg-slate-50 rounded-lg p-4">
                <p className="text-lg font-semibold text-slate-800">{selectedDomain.name}</p>
                <div className="flex gap-4 mt-2 text-sm">
                  <span className="text-slate-600">Length: {selectedDomain.length} chars</span>
                  <span className="text-emerald-600 font-medium">
                    Est. Value: {formatCurrency(selectedDomain.estimatedValue)}
                  </span>
                </div>
              </div>

              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                <p className="text-sm text-emerald-800">
                  <strong>Potential Profit:</strong> Register for ~$12, estimated flip value {formatCurrency(selectedDomain.estimatedValue)}
                </p>
              </div>

              <div>
                <p className="text-sm font-medium text-slate-700 mb-3">Register with a trusted registrar:</p>
                <div className="grid grid-cols-2 gap-2">
                  {getRegistrarLinks(selectedDomain.name).map((registrar) => (
                    <a
                      key={registrar.name}
                      href={registrar.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-secondary text-center"
                    >
                      {registrar.name}
                    </a>
                  ))}
                </div>
              </div>

              <p className="text-sm text-slate-500">
                After registering, you can list your domain for sale on Opportunity Exchange.
              </p>
            </div>
          )}
        </Modal>
      </div>
    </div>
  );
}
