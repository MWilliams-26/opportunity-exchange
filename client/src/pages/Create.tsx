import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { Input, Button, Card, Badge, Select, Textarea } from '../components/ui';
import { checkDomain, createListing, getMyListings, type CreateListingData } from '../lib/api';
import type { Listing } from '../types';
import { useAuth } from '../context/AuthContext';

const CATEGORIES = [
  { value: '', label: 'Select a category' },
  { value: 'tech', label: 'Tech' },
  { value: 'saas', label: 'SaaS' },
  { value: 'ecommerce', label: 'E-commerce' },
  { value: 'health', label: 'Health & Wellness' },
  { value: 'finance', label: 'Finance' },
  { value: 'creative', label: 'Creative' },
  { value: 'food', label: 'Food & Beverage' },
  { value: 'lifestyle', label: 'Lifestyle' },
];

const PREFIXES = ['Get', 'Go', 'Try', 'My', 'The', 'Use', 'Hey', 'One'];
const SUFFIXES = ['ly', 'ify', 'Hub', 'Labs', 'Co', 'HQ', 'Box', 'Spot', 'Base', 'Stack'];

function generateNames(keyword: string): string[] {
  if (!keyword.trim()) return [];
  
  const cleanKeyword = keyword.trim().charAt(0).toUpperCase() + keyword.trim().slice(1).toLowerCase();
  const names: string[] = [];
  
  PREFIXES.forEach(prefix => {
    names.push(`${prefix}${cleanKeyword}`);
  });
  
  SUFFIXES.forEach(suffix => {
    names.push(`${cleanKeyword}${suffix}`);
  });
  
  names.push(`${cleanKeyword}io`);
  names.push(`${cleanKeyword}App`);
  names.push(`The${cleanKeyword}Co`);
  
  return [...new Set(names)];
}

export function Create() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isAuthenticated, loading: authLoading } = useAuth();
  
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [domainAvailable, setDomainAvailable] = useState<boolean | null>(null);
  const [checkingDomain, setCheckingDomain] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [generatorKeyword, setGeneratorKeyword] = useState('');
  const [generatedNames, setGeneratedNames] = useState<string[]>([]);
  
  const [myListings, setMyListings] = useState<Listing[]>([]);
  const [loadingListings, setLoadingListings] = useState(false);
  
  const prefillDomain = searchParams.get('domain') || undefined;

  useEffect(() => {
    if (prefillDomain) {
      setName(prefillDomain.replace('.com', ''));
    }
  }, [prefillDomain]);

  useEffect(() => {
    if (isAuthenticated) {
      setLoadingListings(true);
      getMyListings()
        .then(listings => {
          const brandNames = listings.filter(l => l.asset?.type === 'business_name');
          setMyListings(brandNames);
        })
        .catch(console.error)
        .finally(() => setLoadingListings(false));
    }
  }, [isAuthenticated]);

  const debouncedCheckDomain = useCallback(
    (() => {
      let timeoutId: ReturnType<typeof setTimeout>;
      return (domainName: string) => {
        clearTimeout(timeoutId);
        if (!domainName.trim()) {
          setDomainAvailable(null);
          return;
        }
        timeoutId = setTimeout(async () => {
          setCheckingDomain(true);
          try {
            const result = await checkDomain(`${domainName.toLowerCase()}.com`);
            setDomainAvailable(result.available);
          } catch {
            setDomainAvailable(null);
          } finally {
            setCheckingDomain(false);
          }
        }, 500);
      };
    })(),
    []
  );

  useEffect(() => {
    debouncedCheckDomain(name);
  }, [name, debouncedCheckDomain]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !category || !description || !price) {
      setError('Please fill in all fields');
      return;
    }
    
    setSubmitting(true);
    setError(null);
    
    try {
      const listingData: CreateListingData = {
        asset_name: name,
        asset_type: 'business_name',
        asset_description: description,
        title: name,
        description,
        listing_type: 'buy_now',
        buy_now_price: parseFloat(price),
      };
      const listing = await createListing(listingData);
      navigate(`/listings/${listing.id}`);
    } catch (err) {
      setError('Failed to create listing. Please try again.');
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleGenerateNames = () => {
    const names = generateNames(generatorKeyword);
    setGeneratedNames(names);
  };

  const handleSelectGeneratedName = (selectedName: string) => {
    setName(selectedName);
  };

  if (authLoading) {
    return (
      <div className="section">
        <div className="container-narrow">
          <div className="skeleton h-8 w-48 mb-4" />
          <div className="skeleton h-64 w-full" />
        </div>
      </div>
    );
  }

  const generatorSection = (
    <Card className="mb-8">
      <h2 className="text-xl font-semibold mb-4">Name Generator</h2>
      <p className="text-slate-600 mb-4">
        Enter keywords or an industry to generate brandable name ideas.
      </p>
      <div className="flex gap-3 mb-4">
        <Input
          placeholder="Enter a keyword (e.g., cloud, pixel, zen)"
          value={generatorKeyword}
          onChange={(e) => setGeneratorKeyword(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleGenerateNames()}
          className="flex-1"
        />
        <Button onClick={handleGenerateNames} disabled={!generatorKeyword.trim()}>
          Generate
        </Button>
      </div>
      {generatedNames.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {generatedNames.map((genName) => (
            <button
              key={genName}
              onClick={() => handleSelectGeneratedName(genName)}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-full text-sm font-medium transition-colors"
            >
              {genName}
            </button>
          ))}
        </div>
      )}
    </Card>
  );

  if (!isAuthenticated) {
    return (
      <div className="section">
        <div className="container-narrow">
          <div className="mb-8">
            <h1 className="page-title mb-2">Brand Name Creator</h1>
            <p className="text-slate-600">
              Create and sell brandable business names on the marketplace.
            </p>
          </div>

          {generatorSection}

          <Card className="text-center">
            <h2 className="text-xl font-semibold mb-2">Ready to Sell Your Names?</h2>
            <p className="text-slate-600 mb-6">
              Sign up to submit your brandable names and earn when they sell.
            </p>
            <div className="flex justify-center gap-4">
              <Link to="/login" className="btn-secondary">
                Sign In
              </Link>
              <Link to="/register" className="btn-primary">
                Create Account
              </Link>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="section">
      <div className="container-narrow">
        <div className="mb-8">
          <h1 className="page-title mb-2">Brand Name Creator</h1>
          <p className="text-muted">
            Submit brandable names you've created. Earn when they sell on the marketplace.
          </p>
        </div>

        {generatorSection}

        <Card className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Submit a Brand Name</h2>
          
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <Input
                label="Brand Name"
                placeholder="e.g., Zenflow, Pixelcraft, CloudBase"
                value={name}
                onChange={(e) => setName(e.target.value)}
                helpText="Enter the brandable name you want to sell"
              />
              {name && (
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-sm text-slate-600">{name.toLowerCase()}.com</span>
                  {checkingDomain ? (
                    <span className="text-sm text-slate-500">Checking...</span>
                  ) : domainAvailable !== null ? (
                    <Badge variant={domainAvailable ? 'success' : 'warning'}>
                      {domainAvailable ? '.com Available' : '.com Taken'}
                    </Badge>
                  ) : null}
                </div>
              )}
            </div>

            <Select
              label="Category"
              options={CATEGORIES}
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            />

            <Textarea
              label="Description"
              placeholder="Explain why this name is valuable. What type of business would it suit? What does it evoke?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
            />

            <Input
              label="Suggested Price"
              type="number"
              min="1"
              step="1"
              placeholder="500"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              helpText="Price in USD"
            />

            {error && (
              <div className="text-red-600 text-sm mb-4">{error}</div>
            )}

            <Button type="submit" disabled={submitting} className="w-full">
              {submitting ? 'Submitting...' : 'Submit Brand Name'}
            </Button>
          </form>
        </Card>

        <Card>
          <h2 className="text-xl font-semibold mb-4">My Created Names</h2>
          
          {loadingListings ? (
            <div className="space-y-3">
              <div className="skeleton h-12 w-full" />
              <div className="skeleton h-12 w-full" />
            </div>
          ) : myListings.length === 0 ? (
            <p className="text-slate-600 text-center py-8">
              You haven't created any brand names yet. Submit your first one above!
            </p>
          ) : (
            <div className="divide-y">
              {myListings.map((listing) => (
                <div key={listing.id} className="py-3 flex items-center justify-between">
                  <div>
                    <Link 
                      to={`/listings/${listing.id}`}
                      className="font-medium text-blue-600 hover:underline"
                    >
                      {listing.title}
                    </Link>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-slate-600">${listing.buy_now_price ?? listing.current_bid ?? 0}</span>
                    <Badge variant={listing.status === 'sold' ? 'success' : 'info'}>
                      {listing.status === 'sold' ? 'Sold' : 'Available'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
