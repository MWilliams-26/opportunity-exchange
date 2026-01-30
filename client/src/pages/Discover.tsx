import { useState, useEffect, type FormEvent } from 'react';
import { Input, Button, Card, Badge, Select, Modal } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import {
  getExpiringDomains,
  toggleExpiringDomainFavorite,
  updateExpiringDomainNotes,
} from '../lib/api';
import type { ExpiringDomain, ExpiringDomainsStats } from '../types';

const TLD_OPTIONS = [
  { value: '', label: 'All TLDs' },
  { value: 'com', label: '.com' },
  { value: 'net', label: '.net' },
  { value: 'org', label: '.org' },
  { value: 'io', label: '.io' },
  { value: 'co', label: '.co' },
];

const SORT_OPTIONS = [
  { value: 'score', label: 'Best Score' },
  { value: 'backlinks', label: 'Most Backlinks' },
  { value: 'majestic_tf', label: 'Highest Trust Flow' },
  { value: 'delete_date', label: 'Soonest Expiry' },
  { value: 'domain', label: 'Alphabetical' },
];

const MIN_SCORE_OPTIONS = [
  { value: '', label: 'Any Score' },
  { value: '20', label: 'Score 20+' },
  { value: '40', label: 'Score 40+' },
  { value: '60', label: 'Score 60+' },
  { value: '80', label: 'Score 80+' },
];

export function Discover() {
  const { isAuthenticated } = useAuth();
  const [keyword, setKeyword] = useState('');
  const [tldFilter, setTldFilter] = useState('');
  const [minScore, setMinScore] = useState('');
  const [sortBy, setSortBy] = useState('score');
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  
  const [domains, setDomains] = useState<ExpiringDomain[]>([]);
  const [stats, setStats] = useState<ExpiringDomainsStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [selectedDomain, setSelectedDomain] = useState<ExpiringDomain | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [savingNote, setSavingNote] = useState(false);

  const fetchDomains = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getExpiringDomains({
        keyword: keyword || undefined,
        tld: tldFilter || undefined,
        minScore: minScore ? parseInt(minScore) : undefined,
        sortBy,
        favoritesOnly,
        limit: 100,
      });
      setDomains(response.domains);
      setStats(response.stats);
    } catch (err) {
      setError('Failed to load domains. Make sure you have imported some data.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDomains();
  }, [tldFilter, minScore, sortBy, favoritesOnly]);

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    fetchDomains();
  };

  const handleToggleFavorite = async (domain: ExpiringDomain) => {
    if (!isAuthenticated) return;
    try {
      const updated = await toggleExpiringDomainFavorite(domain.id);
      setDomains(prev => prev.map(d => d.id === domain.id ? updated : d));
      if (selectedDomain?.id === domain.id) {
        setSelectedDomain(updated);
      }
    } catch (err) {
      console.error('Failed to toggle favorite:', err);
    }
  };

  const handleSaveNote = async () => {
    if (!selectedDomain || !isAuthenticated) return;
    setSavingNote(true);
    try {
      const updated = await updateExpiringDomainNotes(selectedDomain.id, noteText);
      setDomains(prev => prev.map(d => d.id === selectedDomain.id ? updated : d));
      setSelectedDomain(updated);
    } catch (err) {
      console.error('Failed to save note:', err);
    } finally {
      setSavingNote(false);
    }
  };

  const openDetailModal = (domain: ExpiringDomain) => {
    setSelectedDomain(domain);
    setNoteText(domain.notes || '');
    setShowDetailModal(true);
  };

  const getRegistrarLinks = (domain: string) => [
    { name: 'GoDaddy', url: `https://www.godaddy.com/domainsearch/find?domainToCheck=${domain}` },
    { name: 'Namecheap', url: `https://www.namecheap.com/domains/registration/results/?domain=${domain}` },
    { name: 'Porkbun', url: `https://porkbun.com/checkout/search?q=${domain}` },
    { name: 'DropCatch', url: `https://www.dropcatch.com/domain/${domain.split('.')[0]}` },
  ];

  const getScoreBadge = (score: number): 'success' | 'warning' | 'neutral' => {
    if (score >= 60) return 'success';
    if (score >= 40) return 'warning';
    return 'neutral';
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getDaysUntilDrop = (dateString: string | null) => {
    if (!dateString) return null;
    const dropDate = new Date(dateString);
    const now = new Date();
    const diffTime = dropDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getDropUrgency = (days: number | null): 'error' | 'warning' | 'info' | 'neutral' => {
    if (days === null) return 'neutral';
    if (days <= 3) return 'error';
    if (days <= 7) return 'warning';
    if (days <= 14) return 'info';
    return 'neutral';
  };

  return (
    <div className="section">
      <div className="container-wide">
        <div className="mb-8">
          <h1 className="page-title mb-2">Discover Expiring Domains</h1>
          <p className="text-lg text-slate-600">
            Find valuable domains about to expire. Filter by score, backlinks, and more.
          </p>
        </div>

        {/* Stats Cards */}
        {stats && stats.total > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <Card className="text-center">
              <p className="text-2xl font-bold text-slate-800">{stats.total.toLocaleString()}</p>
              <p className="text-sm text-slate-500">Total Domains</p>
            </Card>
            <Card className="text-center">
              <p className="text-2xl font-bold text-yellow-600">{stats.favorites}</p>
              <p className="text-sm text-slate-500">Favorites</p>
            </Card>
            <Card className="text-center">
              <p className="text-2xl font-bold text-emerald-600">{stats.high_backlinks}</p>
              <p className="text-sm text-slate-500">High Backlinks (100+)</p>
            </Card>
            <Card className="text-center">
              <p className="text-2xl font-bold text-blue-600">{stats.high_tf}</p>
              <p className="text-sm text-slate-500">High TF (20+)</p>
            </Card>
          </div>
        )}

        {/* Filters */}
        <form onSubmit={handleSearch} className="card mb-8">
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            <div className="md:col-span-2">
              <Input
                label="Search"
                placeholder="Keyword in domain..."
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
                label="Min Score"
                options={MIN_SCORE_OPTIONS}
                value={minScore}
                onChange={(e) => setMinScore(e.target.value)}
              />
            </div>
            <div>
              <Select
                label="Sort By"
                options={SORT_OPTIONS}
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              />
            </div>
            <div className="flex items-end gap-2">
              <Button type="submit" className="flex-1">
                Search
              </Button>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
              <input
                type="checkbox"
                checked={favoritesOnly}
                onChange={(e) => setFavoritesOnly(e.target.checked)}
                className="rounded border-slate-300"
              />
              Favorites only
            </label>
            {stats?.byTld && stats.byTld.length > 0 && (
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <span>Top TLDs:</span>
                {stats.byTld.slice(0, 5).map(t => (
                  <button
                    key={t.tld}
                    type="button"
                    onClick={() => setTldFilter(t.tld)}
                    className={`px-2 py-0.5 rounded text-xs ${tldFilter === t.tld ? 'bg-slate-800 text-white' : 'bg-slate-100 hover:bg-slate-200'}`}
                  >
                    .{t.tld} ({t.count})
                  </button>
                ))}
              </div>
            )}
          </div>
        </form>

        {/* Results */}
        {loading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="skeleton h-20 w-full" />
            ))}
          </div>
        ) : error ? (
          <Card className="text-center py-12">
            <p className="text-slate-600 mb-4">{error}</p>
            <div className="bg-slate-50 rounded-lg p-4 max-w-md mx-auto text-left">
              <p className="text-sm font-medium text-slate-700 mb-2">To get started:</p>
              <ol className="text-sm text-slate-600 list-decimal list-inside space-y-1">
                <li>Download a CSV from <a href="https://www.expireddomains.net" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">ExpiredDomains.net</a></li>
                <li>Save it to <code className="bg-slate-100 px-1 rounded">server/data/</code></li>
                <li>Run: <code className="bg-slate-100 px-1 rounded">node scripts/import-domains.js data/your-file.csv</code></li>
              </ol>
            </div>
          </Card>
        ) : domains.length === 0 ? (
          <Card className="text-center py-12">
            <p className="text-lg text-slate-600 mb-2">No domains found</p>
            <p className="text-slate-500">Try adjusting your filters or import more data.</p>
          </Card>
        ) : (
          <>
            <p className="text-sm text-slate-500 mb-4">
              Showing {domains.length} domains
            </p>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 text-left text-sm text-slate-500">
                  <tr>
                    <th className="px-4 py-3 font-medium">Domain</th>
                    <th className="px-4 py-3 font-medium">Score</th>
                    <th className="px-4 py-3 font-medium">Backlinks</th>
                    <th className="px-4 py-3 font-medium">Ref Domains</th>
                    <th className="px-4 py-3 font-medium">TF</th>
                    <th className="px-4 py-3 font-medium">DA</th>
                    <th className="px-4 py-3 font-medium">Age</th>
                    <th className="px-4 py-3 font-medium">Drops In</th>
                    <th className="px-4 py-3 font-medium">Why Interesting</th>
                    <th className="px-4 py-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {domains.map((domain) => (
                    <tr key={domain.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleToggleFavorite(domain)}
                            className={`text-lg ${domain.is_favorite ? 'text-yellow-500' : 'text-slate-300 hover:text-yellow-400'}`}
                            title={domain.is_favorite ? 'Remove from favorites' : 'Add to favorites'}
                          >
                            {domain.is_favorite ? '★' : '☆'}
                          </button>
                          <span className="font-medium text-slate-800">{domain.domain}</span>
                          {domain.notes && (
                            <span className="text-blue-500 text-xs" title={domain.notes}>📝</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={getScoreBadge(domain.score)}>
                          {domain.score}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {domain.backlinks.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {domain.referring_domains.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-slate-600">{domain.majestic_tf}</td>
                      <td className="px-4 py-3 text-slate-600">{domain.moz_da}</td>
                      <td className="px-4 py-3 text-slate-600">
                        {domain.archive_org_age ? `${domain.archive_org_age}y` : '—'}
                      </td>
                      <td className="px-4 py-3">
                        {(() => {
                          const days = getDaysUntilDrop(domain.delete_date);
                          if (days === null) return <span className="text-slate-400">—</span>;
                          return (
                            <div className="flex flex-col">
                              <Badge variant={getDropUrgency(days)}>
                                {days <= 0 ? 'Dropped!' : `${days} days`}
                              </Badge>
                              <span className="text-xs text-slate-500 mt-1">
                                {formatDate(domain.delete_date)}
                              </span>
                            </div>
                          );
                        })()}
                      </td>
                      <td className="px-4 py-3 text-slate-600 max-w-xs truncate" title={domain.why_interesting || ''}>
                        {domain.why_interesting || '—'}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => openDetailModal(domain)}>
                            Details
                          </Button>
                          <a
                            href={`https://www.namecheap.com/domains/registration/results/?domain=${domain.domain}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <Button size="sm">Register</Button>
                          </a>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* Tips Section */}
        <div className="mt-12 bg-emerald-50 border border-emerald-200 rounded-lg p-6">
          <h2 className="font-semibold text-emerald-800 mb-4">Understanding the Metrics</h2>
          <div className="grid md:grid-cols-2 gap-6 text-sm">
            <div>
              <h3 className="font-medium text-emerald-700 mb-2">SEO Metrics</h3>
              <ul className="text-emerald-700 space-y-1">
                <li><strong>Score:</strong> Our combined quality score (0-100)</li>
                <li><strong>Backlinks:</strong> Total links pointing to domain</li>
                <li><strong>Ref Domains:</strong> Unique websites linking to domain</li>
                <li><strong>TF:</strong> Majestic Trust Flow (quality of backlinks)</li>
                <li><strong>DA:</strong> Moz Domain Authority (ranking potential)</li>
              </ul>
            </div>
            <div>
              <h3 className="font-medium text-emerald-700 mb-2">What to Look For</h3>
              <ul className="text-emerald-700 space-y-1">
                <li>Score 60+ = Excellent opportunity</li>
                <li>TF &gt; CF = Quality over quantity (good)</li>
                <li>Age 10+ years = Established domain</li>
                <li>.com with backlinks = Most valuable</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Detail Modal */}
        <Modal
          isOpen={showDetailModal}
          onClose={() => setShowDetailModal(false)}
          title="Domain Details"
        >
          {selectedDomain && (
            <div className="space-y-6">
              <div className="bg-slate-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xl font-bold text-slate-800">{selectedDomain.domain}</h3>
                  <Badge variant={getScoreBadge(selectedDomain.score)}>
                    Score: {selectedDomain.score}
                  </Badge>
                </div>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-slate-500">Backlinks</p>
                    <p className="font-medium">{selectedDomain.backlinks.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Ref Domains</p>
                    <p className="font-medium">{selectedDomain.referring_domains.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Trust Flow</p>
                    <p className="font-medium">{selectedDomain.majestic_tf}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Citation Flow</p>
                    <p className="font-medium">{selectedDomain.majestic_cf}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Domain Authority</p>
                    <p className="font-medium">{selectedDomain.moz_da}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Archive Age</p>
                    <p className="font-medium">
                      {selectedDomain.archive_org_age ? `${selectedDomain.archive_org_age} years` : '—'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Notes */}
              {isAuthenticated && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Your Notes
                  </label>
                  <textarea
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                    rows={3}
                    placeholder="Add notes about this domain..."
                  />
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={handleSaveNote}
                    loading={savingNote}
                    className="mt-2"
                  >
                    Save Notes
                  </Button>
                </div>
              )}

              {/* Research Links */}
              <div>
                <p className="text-sm font-medium text-slate-700 mb-2">Research</p>
                <div className="flex flex-wrap gap-2">
                  <a
                    href={`https://web.archive.org/web/*/${selectedDomain.domain}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:underline"
                  >
                    Wayback Machine →
                  </a>
                  <a
                    href={`https://www.semrush.com/analytics/overview/?q=${selectedDomain.domain}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:underline"
                  >
                    SEMrush →
                  </a>
                  <a
                    href={`https://ahrefs.com/site-explorer?target=${selectedDomain.domain}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:underline"
                  >
                    Ahrefs →
                  </a>
                </div>
              </div>

              {/* Register Links */}
              <div>
                <p className="text-sm font-medium text-slate-700 mb-2">Register / Backorder</p>
                <div className="grid grid-cols-2 gap-2">
                  {getRegistrarLinks(selectedDomain.domain).map((registrar) => (
                    <a
                      key={registrar.name}
                      href={registrar.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-secondary text-center text-sm"
                    >
                      {registrar.name}
                    </a>
                  ))}
                </div>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </div>
  );
}
