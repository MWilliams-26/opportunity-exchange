import { useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { ListingForm } from '../components/listings';
import { createListing, type CreateListingData } from '../lib/api';
import { useAuth } from '../context/AuthContext';

export function CreateListing() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const prefillDomain = searchParams.get('domain') || undefined;

  const handleSubmit = async (data: CreateListingData) => {
    setLoading(true);
    setError(null);
    try {
      const listing = await createListing(data);
      navigate(`/listings/${listing.id}`);
    } catch (err) {
      setError('Failed to create listing. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
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

  if (!isAuthenticated) {
    return (
      <div className="section">
        <div className="container-narrow text-center">
          <h1 className="page-title mb-4">Create a Listing</h1>
          <p className="text-slate-600 mb-6">
            You need to be signed in to create a listing.
          </p>
          <Link to="/login" className="btn-primary">
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="section">
      <div className="container-narrow">
        <div className="mb-8">
          <h1 className="page-title mb-2">Create a Listing</h1>
          <p className="text-muted">
            List your intellectual property asset for sale on the marketplace.
          </p>
        </div>

        <ListingForm onSubmit={handleSubmit} loading={loading} error={error} prefillDomain={prefillDomain} />
      </div>
    </div>
  );
}
