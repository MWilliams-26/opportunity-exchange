import { useState, type FormEvent } from 'react';
import { searchDomains } from '../lib/api';
import type { DomainSearchResult } from '../types';
import { Input, Button, Card, Badge } from '../components/ui';

export function Discover() {
  const [keyword, setKeyword] = useState('');
  const [results, setResults] = useState<DomainSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async (e: FormEvent) => {
    e.preventDefault();
    if (!keyword.trim()) return;

    setLoading(true);
    setError(null);
    setHasSearched(true);

    try {
      const data = await searchDomains(keyword.trim());
      setResults(data.domains || []);
    } catch (err) {
      setError('Failed to search domains. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="section">
      <div className="container-wide">
        <div className="mb-8">
          <h1 className="page-title mb-2">Domain Discovery</h1>
          <p className="text-muted">
            Find available domain names for your next project or business.
          </p>
        </div>

        <form onSubmit={handleSearch} className="card mb-8">
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Enter a keyword like "coffee" or "fitness"
          </label>
          <div className="flex gap-3">
            <div className="flex-1">
              <Input
                placeholder="Enter keyword to search..."
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
              />
            </div>
            <Button type="submit" loading={loading}>
              Search Domains
            </Button>
          </div>
        </form>

        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-8">
          <p className="text-sm text-amber-800">
            <strong>Disclaimer:</strong> Domain availability is checked in real-time. 
            Prices are estimates for standard registration.
          </p>
        </div>

        {error && (
          <div className="p-4 bg-red-50 text-red-600 rounded-lg mb-6">{error}</div>
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
            <p className="text-lg text-slate-600 mb-2">Enter a keyword to discover available domains</p>
            <p className="text-slate-500">We'll check multiple TLDs (.com, .io, .co, etc.) for availability.</p>
          </div>
        ) : results.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-lg text-slate-600 mb-4">No domains found for "{keyword}".</p>
            <p className="text-slate-500">Try a different keyword.</p>
          </div>
        ) : (
          <div className="grid-cards">
            {results.map((domain) => (
              <Card key={domain.name} hover className="flex flex-col h-full">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <Badge variant="info">{domain.tld}</Badge>
                  <Badge variant={domain.available ? 'success' : 'neutral'}>
                    {domain.available ? 'Available' : 'Taken'}
                  </Badge>
                </div>

                <h3 className="text-lg font-semibold text-slate-800 mb-4">
                  {domain.name}
                </h3>

                <div className="mt-auto pt-4 border-t border-slate-100">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-500">Est. Registration Cost</span>
                    <span className="font-semibold text-emerald-600">
                      {formatCurrency(domain.estimated_cost)}
                    </span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
