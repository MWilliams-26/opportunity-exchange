import { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, Badge, Button, Modal } from '../components/ui';
import { getMyListings, deleteListing, getBidsForListing } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import type { Listing, Bid } from '../types';

export function Dashboard() {
  const navigate = useNavigate();
  const { isAuthenticated, user, loading: authLoading } = useAuth();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [listingToDelete, setListingToDelete] = useState<Listing | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [bidsModalOpen, setBidsModalOpen] = useState(false);
  const [selectedListingBids, setSelectedListingBids] = useState<Bid[]>([]);
  const [loadingBids, setLoadingBids] = useState(false);

  const fetchListings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getMyListings();
      setListings(data);
    } catch (err) {
      setError('Failed to load your listings.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchListings();
    }
  }, [isAuthenticated, fetchListings]);

  const handleDelete = async () => {
    if (!listingToDelete) return;
    setDeleting(true);
    try {
      await deleteListing(listingToDelete.id);
      setListings((prev) => prev.filter((l) => l.id !== listingToDelete.id));
      setDeleteModalOpen(false);
      setListingToDelete(null);
    } catch (err) {
      console.error(err);
    } finally {
      setDeleting(false);
    }
  };

  const handleViewBids = async (listing: Listing) => {
    setLoadingBids(true);
    setBidsModalOpen(true);
    try {
      const bids = await getBidsForListing(listing.id);
      setSelectedListingBids(bids);
    } catch (err) {
      console.error(err);
      setSelectedListingBids([]);
    } finally {
      setLoadingBids(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (authLoading) {
    return (
      <div className="section">
        <div className="container-wide">
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
          <h1 className="page-title mb-4">Dashboard</h1>
          <p className="text-slate-600 mb-6">
            Sign in to view your dashboard.
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
      <div className="container-wide">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="page-title mb-2">Dashboard</h1>
            <p className="text-muted">Welcome back, {user?.name}</p>
          </div>
          <Button onClick={() => navigate('/create-listing')}>
            Create New Listing
          </Button>
        </div>

        {error && (
          <div className="p-4 bg-red-50 text-red-600 rounded-lg mb-6">{error}</div>
        )}

        <Card padding="none">
          <div className="p-6 border-b border-slate-200">
            <h2 className="section-header">My Listings</h2>
          </div>

          {loading ? (
            <div className="p-6 space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="skeleton h-16 w-full" />
              ))}
            </div>
          ) : listings.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-slate-600 mb-4">You haven't created any listings yet.</p>
              <Button onClick={() => navigate('/create-listing')}>
                Create Your First Listing
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 text-left text-sm text-slate-500">
                  <tr>
                    <th className="px-6 py-3 font-medium">Title</th>
                    <th className="px-6 py-3 font-medium">Type</th>
                    <th className="px-6 py-3 font-medium">Price / Bid</th>
                    <th className="px-6 py-3 font-medium">Status</th>
                    <th className="px-6 py-3 font-medium">Created</th>
                    <th className="px-6 py-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {listings.map((listing) => (
                    <tr key={listing.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4">
                        <Link
                          to={`/listings/${listing.id}`}
                          className="font-medium text-slate-800 hover:text-emerald-600"
                        >
                          {listing.title}
                        </Link>
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant={listing.listingType === 'auction' ? 'warning' : 'info'}>
                          {listing.listingType === 'auction' ? 'Auction' : 'Buy Now'}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 font-medium text-slate-800">
                        {formatCurrency(
                          listing.listingType === 'auction'
                            ? listing.currentBid || listing.startingBid || 0
                            : listing.buyNowPrice || 0
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <Badge
                          variant={
                            listing.status === 'active'
                              ? 'success'
                              : listing.status === 'sold'
                              ? 'info'
                              : 'neutral'
                          }
                        >
                          {listing.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-slate-500">
                        {formatDate(listing.createdAt)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          {listing.listingType === 'auction' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewBids(listing)}
                            >
                              Bids
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/listings/${listing.id}`)}
                          >
                            View
                          </Button>
                          {listing.status === 'active' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={() => {
                                setListingToDelete(listing);
                                setDeleteModalOpen(true);
                              }}
                            >
                              Delete
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>

      <Modal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setListingToDelete(null);
        }}
        title="Delete Listing"
        footer={
          <>
            <Button variant="outline" onClick={() => setDeleteModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDelete} loading={deleting}>
              Delete
            </Button>
          </>
        }
      >
        <p className="text-slate-600">
          Are you sure you want to delete "{listingToDelete?.title}"? This action cannot be undone.
        </p>
      </Modal>

      <Modal
        isOpen={bidsModalOpen}
        onClose={() => {
          setBidsModalOpen(false);
          setSelectedListingBids([]);
        }}
        title="Bid History"
      >
        {loadingBids ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="skeleton h-12 w-full" />
            ))}
          </div>
        ) : selectedListingBids.length === 0 ? (
          <p className="text-slate-600 text-center py-4">No bids yet.</p>
        ) : (
          <div className="space-y-3">
            {selectedListingBids.map((bid, index) => (
              <div
                key={bid.id}
                className={`flex justify-between items-center p-3 rounded-lg ${
                  index === 0 ? 'bg-emerald-50' : 'bg-slate-50'
                }`}
              >
                <div>
                  <span className="font-medium text-slate-800">
                    {bid.bidder?.name || 'Anonymous'}
                  </span>
                  <span className="text-sm text-slate-500 block">
                    {formatDate(bid.createdAt)}
                  </span>
                </div>
                <span className={`font-bold ${index === 0 ? 'text-emerald-600' : 'text-slate-600'}`}>
                  {formatCurrency(bid.amount)}
                </span>
              </div>
            ))}
          </div>
        )}
      </Modal>
    </div>
  );
}
