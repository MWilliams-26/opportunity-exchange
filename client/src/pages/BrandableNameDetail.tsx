import { useEffect, useState, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Card, Badge, Button } from '../components/ui';
import { getBrandableName, createCheckoutSession, extractErrorMessage } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import type { BrandableName } from '../types';

export function BrandableNameDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const [brandableName, setBrandableName] = useState<BrandableName | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [purchasing, setPurchasing] = useState(false);
  const [purchaseError, setPurchaseError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getBrandableName(id);
      setBrandableName(data);
    } catch (err) {
      setError('Failed to load brandable name. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleBuyNow = async () => {
    if (!brandableName) return;
    setPurchasing(true);
    setPurchaseError(null);
    try {
      const { url } = await createCheckoutSession(brandableName.id);
      window.location.href = url;
    } catch (err) {
      setPurchaseError(extractErrorMessage(err));
      console.error(err);
    } finally {
      setPurchasing(false);
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="section">
        <div className="container-narrow">
          <div className="skeleton h-8 w-48 mb-4" />
          <div className="skeleton h-12 w-full mb-6" />
          <div className="card">
            <div className="skeleton h-6 w-32 mb-4" />
            <div className="skeleton h-24 w-full mb-4" />
            <div className="skeleton h-8 w-1/2" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !brandableName) {
    return (
      <div className="section">
        <div className="container-narrow text-center">
          <p className="text-lg text-red-600 mb-4">{error || 'Brandable name not found'}</p>
          <Link to="/marketplace">
            <Button>Back to Marketplace</Button>
          </Link>
        </div>
      </div>
    );
  }

  const isOwner = user?.id === String(brandableName.creator_id);
  const isAvailable = brandableName.status === 'available';

  return (
    <div className="section">
      <div className="container-narrow">
        <Link to="/marketplace" className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-800 mb-6">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Marketplace
        </Link>

        <div className="flex flex-wrap gap-3 mb-4">
          <Badge variant="info">Brandable Name</Badge>
          {brandableName.domain_available && (
            <Badge variant="success">.com Available</Badge>
          )}
          <Badge
            variant={
              brandableName.status === 'available'
                ? 'success'
                : brandableName.status === 'sold'
                ? 'neutral'
                : 'warning'
            }
          >
            {brandableName.status}
          </Badge>
        </div>

        <h1 className="page-title mb-6">{brandableName.name}</h1>

        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <h2 className="section-header mb-4">Description</h2>
              <p className="text-slate-600 whitespace-pre-wrap">
                {brandableName.description || 'No description provided.'}
              </p>
            </Card>

            <Card>
              <h2 className="section-header mb-4">Details</h2>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-slate-500">Name</span>
                  <span className="font-medium text-slate-800">{brandableName.name}</span>
                </div>
                {brandableName.category_name && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Category</span>
                    <span className="font-medium text-slate-800">{brandableName.category_name}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-slate-500">.com Domain</span>
                  <span className={`font-medium ${brandableName.domain_available ? 'text-emerald-600' : 'text-slate-800'}`}>
                    {brandableName.domain_available ? 'Available' : 'Taken'}
                  </span>
                </div>
              </div>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <div className="text-center mb-6">
                <span className="text-sm text-slate-500 block mb-1">Price</span>
                <span className="text-3xl font-bold text-slate-800">
                  {brandableName.suggested_price
                    ? formatCurrency(brandableName.suggested_price)
                    : 'Make Offer'}
                </span>
              </div>

              {purchaseError && (
                <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg">
                  {purchaseError}
                </div>
              )}

              {isAvailable && !isOwner && (
                <>
                  {isAuthenticated ? (
                    <Button
                      className="w-full"
                      size="lg"
                      onClick={handleBuyNow}
                      loading={purchasing}
                    >
                      Buy Now
                    </Button>
                  ) : (
                    <div className="text-center">
                      <p className="text-sm text-slate-600 mb-4">
                        Sign in to purchase this brandable name.
                      </p>
                      <Button className="w-full" onClick={() => navigate('/login')}>
                        Sign In to Buy
                      </Button>
                    </div>
                  )}
                </>
              )}

              {isOwner && (
                <div className="text-center py-4">
                  <p className="text-sm text-slate-500">This is your brandable name.</p>
                </div>
              )}

              {!isAvailable && !isOwner && (
                <div className="text-center py-4">
                  <p className="text-sm text-slate-500">
                    This brandable name is no longer available.
                  </p>
                </div>
              )}
            </Card>

            <Card>
              <h3 className="font-semibold text-slate-800 mb-4">Creator Information</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">Name</span>
                  <span className="font-medium text-slate-800">
                    {brandableName.creator_name || 'Unknown'}
                  </span>
                </div>
              </div>
            </Card>

            <Card>
              <div className="text-xs text-slate-500">
                <p className="mb-2">
                  <strong>Listed:</strong> {formatDate(brandableName.created_at)}
                </p>
                <p>
                  Opportunity Exchange facilitates secure transactions between buyers 
                  and sellers. Payments are processed through Stripe.
                </p>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
