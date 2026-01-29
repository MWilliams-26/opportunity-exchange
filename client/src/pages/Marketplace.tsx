import { useEffect, useState, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { MarketplaceCard } from '../components/marketplace';
import { Button, Select, Input } from '../components/ui';
import { getListings, getBrandableNames, getCategories } from '../lib/api';
import type { Listing, BrandableName, Category, MarketplaceItem } from '../types';

type TabFilter = 'all' | 'brandable_name' | 'premium_domain';
type SortOption = 'newest' | 'price_asc' | 'price_desc';

const tabOptions: { value: TabFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'brandable_name', label: 'Brandable Names' },
  { value: 'premium_domain', label: 'Premium Domains' },
];

const sortOptions: { value: SortOption; label: string }[] = [
  { value: 'newest', label: 'Newest' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
];

function brandableNameToMarketplaceItem(bn: BrandableName): MarketplaceItem {
  return {
    id: String(bn.id),
    type: 'brandable_name',
    name: bn.name,
    price: bn.suggested_price,
    category: bn.category_name,
    seller: bn.creator_name,
    created_at: bn.created_at,
    domain_available: bn.domain_available,
    description: bn.description,
    original: bn,
  };
}

function listingToMarketplaceItem(listing: Listing): MarketplaceItem {
  const price = listing.listing_type === 'auction'
    ? listing.current_bid || listing.starting_bid
    : listing.buy_now_price;
  
  return {
    id: listing.id,
    type: 'premium_domain',
    name: listing.title,
    price: price || null,
    category: listing.asset?.category_name || null,
    seller: listing.seller?.name || 'Unknown',
    created_at: listing.created_at,
    listing_type: listing.listing_type,
    description: listing.description,
    original: listing,
  };
}

export function Marketplace() {
  const [brandableNames, setBrandableNames] = useState<BrandableName[]>([]);
  const [listings, setListings] = useState<Listing[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<TabFilter>('all');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [brandableNamesData, listingsData, categoriesData] = await Promise.all([
        getBrandableNames(),
        getListings({ status: 'active' }),
        getCategories(),
      ]);
      setBrandableNames(brandableNamesData);
      setListings(listingsData);
      setCategories(categoriesData);
    } catch (err) {
      setError('Failed to load marketplace. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const categoryOptions = useMemo(() => [
    { value: '', label: 'All Categories' },
    ...categories.map(c => ({ value: c.slug, label: c.name })),
  ], [categories]);

  const filteredAndSortedItems = useMemo(() => {
    let items: MarketplaceItem[] = [];

    if (activeTab === 'all' || activeTab === 'brandable_name') {
      items = items.concat(brandableNames.map(brandableNameToMarketplaceItem));
    }

    if (activeTab === 'all' || activeTab === 'premium_domain') {
      items = items.concat(listings.map(listingToMarketplaceItem));
    }

    if (categoryFilter) {
      items = items.filter(item => {
        if (item.type === 'brandable_name') {
          const bn = item.original as BrandableName;
          return bn.category_slug === categoryFilter;
        } else {
          const listing = item.original as Listing;
          return listing.asset?.category_slug === categoryFilter;
        }
      });
    }

    const minPriceNum = minPrice ? parseFloat(minPrice) : null;
    const maxPriceNum = maxPrice ? parseFloat(maxPrice) : null;

    if (minPriceNum !== null) {
      items = items.filter(item => item.price !== null && item.price >= minPriceNum);
    }

    if (maxPriceNum !== null) {
      items = items.filter(item => item.price !== null && item.price <= maxPriceNum);
    }

    items.sort((a, b) => {
      if (sortBy === 'newest') {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      } else if (sortBy === 'price_asc') {
        const priceA = a.price ?? Infinity;
        const priceB = b.price ?? Infinity;
        return priceA - priceB;
      } else {
        const priceA = a.price ?? -Infinity;
        const priceB = b.price ?? -Infinity;
        return priceB - priceA;
      }
    });

    return items;
  }, [brandableNames, listings, activeTab, categoryFilter, minPrice, maxPrice, sortBy]);

  const clearFilters = () => {
    setCategoryFilter('');
    setMinPrice('');
    setMaxPrice('');
    setSortBy('newest');
  };

  const hasActiveFilters = categoryFilter || minPrice || maxPrice || sortBy !== 'newest';

  return (
    <div className="section">
      <div className="container-wide">
        <div className="mb-8">
          <h1 className="page-title mb-2">Marketplace</h1>
          <p className="text-muted">
            Discover brandable names and premium domains from verified sellers.
          </p>
        </div>

        <div className="flex flex-wrap gap-2 mb-6 border-b border-slate-200">
          {tabOptions.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
                activeTab === tab.value
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="bg-slate-50 rounded-lg p-4 mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <Select
              options={categoryOptions}
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full"
            />
            <Input
              type="number"
              placeholder="Min Price"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              min="0"
            />
            <Input
              type="number"
              placeholder="Max Price"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              min="0"
            />
            <Select
              options={sortOptions}
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="w-full"
            />
            {hasActiveFilters && (
              <Button variant="outline" onClick={clearFilters}>
                Clear Filters
              </Button>
            )}
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
                  <div className="skeleton h-6 w-24" />
                  <div className="skeleton h-6 w-16" />
                </div>
                <div className="skeleton h-6 w-full mb-2" />
                <div className="skeleton h-4 w-3/4 mb-4" />
                <div className="skeleton h-8 w-1/2" />
              </div>
            ))}
          </div>
        ) : filteredAndSortedItems.length === 0 ? (
          <div className="text-center py-12 bg-slate-50 rounded-lg">
            <div className="text-4xl mb-4">🔍</div>
            <p className="text-lg text-slate-600 mb-2">No results found</p>
            <p className="text-slate-500 mb-6">
              {hasActiveFilters
                ? 'Try adjusting your filters or browse all items.'
                : activeTab === 'brandable_name'
                ? 'No brandable names available yet. Be the first to create one!'
                : activeTab === 'premium_domain'
                ? 'No premium domains listed yet. List your first domain!'
                : 'The marketplace is empty. Start by creating a brandable name or listing a domain.'}
            </p>
            <div className="flex justify-center gap-4">
              {hasActiveFilters && (
                <Button variant="outline" onClick={clearFilters}>
                  Clear Filters
                </Button>
              )}
              <Link to="/brand-factory">
                <Button variant="secondary">Create Names</Button>
              </Link>
              <Link to="/create-listing">
                <Button>List a Domain</Button>
              </Link>
            </div>
          </div>
        ) : (
          <>
            <p className="text-sm text-slate-500 mb-4">
              {filteredAndSortedItems.length} {filteredAndSortedItems.length === 1 ? 'item' : 'items'} found
            </p>
            <div className="grid-cards">
              {filteredAndSortedItems.map((item) => (
                <MarketplaceCard
                  key={`${item.type}-${item.id}`}
                  item={item}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
