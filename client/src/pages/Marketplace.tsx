import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ListingCard } from '../components/listings';
import { Button, Select } from '../components/ui';
import { getListings, type ListingFilters } from '../lib/api';
import type { Listing } from '../types';

const listingTypeOptions = [
  { value: '', label: 'All Types' },
  { value: 'buy_now', label: 'Buy Now' },
  { value: 'auction', label: 'Auction' },
];

export function Marketplace() {
  const [searchParams] = useSearchParams();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [listingType, setListingType] = useState('');

  const fetchListings = useCallback(async (filters: ListingFilters = {}) => {
    setLoading(true);
    setError(null);
    try {
      const data = await getListings({ ...filters, status: 'active' });
      setListings(data);
    } catch (err) {
      setError('Failed to load listings. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const assetId = searchParams.get('assetId');
    fetchListings(assetId ? { status: 'active' } : undefined);
  }, [searchParams, fetchListings]);

  const handleFilterChange = (type: string) => {
    setListingType(type);
    fetchListings(type ? { listingType: type, status: 'active' } : { status: 'active' });
  };

  return (
    <div className="section">
      <div className="container-wide">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="page-title mb-2">Marketplace</h1>
            <p className="text-muted">
              Browse active listings from verified sellers.
            </p>
          </div>
          <div className="flex gap-3 items-center">
            <span className="text-sm text-slate-500">Filter by:</span>
            <Select
              options={listingTypeOptions}
              value={listingType}
              onChange={(e) => handleFilterChange(e.target.value)}
              className="w-40"
            />
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-50 text-red-600 rounded-lg mb-6">{error}</div>
        )}

        {loading ? (
          <div className="grid-cards">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="card">
                <div className="flex justify-between mb-4">
                  <div className="skeleton h-6 w-20" />
                  <div className="skeleton h-6 w-16" />
                </div>
                <div className="skeleton h-6 w-full mb-2" />
                <div className="skeleton h-4 w-3/4 mb-4" />
                <div className="skeleton h-8 w-1/2" />
              </div>
            ))}
          </div>
        ) : listings.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-lg text-slate-600 mb-4">No active listings found.</p>
            <p className="text-slate-500 mb-6">Be the first to create a listing.</p>
            <Button onClick={() => window.location.href = '/create-listing'}>
              Create Listing
            </Button>
          </div>
        ) : (
          <div className="grid-cards">
            {listings.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
