import { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, Badge, Button, Modal } from '../components/ui';
import {
  getMyListings,
  deleteListing,
  getBidsForListing,
  getMyBrandableNames,
  deleteBrandableName,
  getWatchlist,
  removeFromWatchlist,
} from '../lib/api';
import { useAuth } from '../context/AuthContext';
import type { Listing, Bid, BrandableName, WatchlistItem } from '../types';

export function Dashboard() {
  const navigate = useNavigate();
  const { isAuthenticated, user, loading: authLoading } = useAuth();

  const [listings, setListings] = useState<Listing[]>([]);
  const [brandableNames, setBrandableNames] = useState<BrandableName[]>([]);
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [listingToDelete, setListingToDelete] = useState<Listing | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [deleteNameModalOpen, setDeleteNameModalOpen] = useState(false);
  const [nameToDelete, setNameToDelete] = useState<BrandableName | null>(null);
  const [deletingName, setDeletingName] = useState(false);

  const [bidsModalOpen, setBidsModalOpen] = useState(false);
  const [selectedListingBids, setSelectedListingBids] = useState<Bid[]>([]);
  const [loadingBids, setLoadingBids] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [listingsData, namesData, watchlistData] = await Promise.all([
        getMyListings().catch(() => []),
        getMyBrandableNames().catch(() => []),
        getWatchlist().catch(() => []),
      ]);
      setListings(listingsData);
      setBrandableNames(namesData);
      setWatchlist(watchlistData);
    } catch (err) {
      setError('Failed to load dashboard data.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchData();
    }
  }, [isAuthenticated, fetchData]);

  const handleDeleteListing = async () => {
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

  const handleDeleteName = async () => {
    if (!nameToDelete) return;
    setDeletingName(true);
    try {
      await deleteBrandableName(nameToDelete.id);
      setBrandableNames((prev) => prev.filter((n) => n.id !== nameToDelete.id));
      setDeleteNameModalOpen(false);
      setNameToDelete(null);
    } catch (err) {
      console.error(err);
    } finally {
      setDeletingName(false);
    }
  };

  const handleRemoveFromWatchlist = async (item: WatchlistItem) => {
    try {
      await removeFromWatchlist(item.id);
      setWatchlist((prev) => prev.filter((w) => w.id !== item.id));
    } catch (err) {
      console.error(err);
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

  const getDaysLeft = (expiryDate: string) => {
    const expiry = new Date(expiryDate);
    const now = new Date();
    const diff = expiry.getTime() - now.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const getDaysLeftColor = (days: number) => {
    if (days < 7) return 'text-red-600';
    if (days < 14) return 'text-yellow-600';
    return 'text-slate-600';
  };

  const soldNames = brandableNames.filter((n) => n.status === 'sold').length;
  const soldDomains = listings.filter((l) => l.status === 'sold').length;

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
          <p className="text-slate-600 mb-6">Sign in to view your dashboard.</p>
          <Link to="/login" className="btn-primary">
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="section">
      <div className="container-wide space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="page-title mb-2">Dashboard</h1>
            <p className="text-muted">Welcome back, {user?.name}</p>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-50 text-red-600 rounded-lg">{error}</div>
        )}

        {/* Earnings Summary */}
        <Card>
          <h2 className="section-header mb-6">Earnings Summary</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-emerald-600">$0</p>
              <p className="text-sm text-slate-500">Total Earnings</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-yellow-600">$0</p>
              <p className="text-sm text-slate-500">Pending Payouts</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-slate-800">{soldNames}</p>
              <p className="text-sm text-slate-500">Names Sold</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-slate-800">{soldDomains}</p>
              <p className="text-sm text-slate-500">Domains Sold</p>
            </div>
          </div>
        </Card>

        {/* Brandable Names Section */}
        <Card padding="none">
          <div className="p-6 border-b border-slate-200 flex items-center justify-between">
            <h2 className="section-header">My Brandable Names</h2>
            <Button size="sm" onClick={() => navigate('/create-name')}>
              Create New Name
            </Button>
          </div>

          {loading ? (
            <div className="p-6 space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="skeleton h-16 w-full" />
              ))}
            </div>
          ) : brandableNames.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-slate-600 mb-4">
                You haven't created any brandable names yet.
              </p>
              <Button onClick={() => navigate('/create-name')}>
                Create Your First Name
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 text-left text-sm text-slate-500">
                  <tr>
                    <th className="px-6 py-3 font-medium">Name</th>
                    <th className="px-6 py-3 font-medium">Status</th>
                    <th className="px-6 py-3 font-medium">Price</th>
                    <th className="px-6 py-3 font-medium">Created</th>
                    <th className="px-6 py-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {brandableNames.map((name) => (
                    <tr key={name.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 font-medium text-slate-800">
                        {name.name}
                      </td>
                      <td className="px-6 py-4">
                        <Badge
                          variant={name.status === 'available' ? 'success' : 'info'}
                        >
                          {name.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 font-medium text-slate-800">
                        {name.suggested_price ? formatCurrency(name.suggested_price) : 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-slate-500">
                        {formatDate(name.created_at)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/names/${name.id}`)}
                          >
                            View
                          </Button>
                          {name.status === 'available' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={() => {
                                setNameToDelete(name);
                                setDeleteNameModalOpen(true);
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

        {/* Domain Listings Section */}
        <Card padding="none">
          <div className="p-6 border-b border-slate-200 flex items-center justify-between">
            <h2 className="section-header">My Domain Listings</h2>
            <Button size="sm" onClick={() => navigate('/create-listing')}>
              Create New Listing
            </Button>
          </div>

          {loading ? (
            <div className="p-6 space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="skeleton h-16 w-full" />
              ))}
            </div>
          ) : listings.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-slate-600 mb-4">
                You haven't created any domain listings yet.
              </p>
              <Button onClick={() => navigate('/create-listing')}>
                Create Your First Listing
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 text-left text-sm text-slate-500">
                  <tr>
                    <th className="px-6 py-3 font-medium">Domain</th>
                    <th className="px-6 py-3 font-medium">Status</th>
                    <th className="px-6 py-3 font-medium">Price</th>
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
                      <td className="px-6 py-4 font-medium text-slate-800">
                        {formatCurrency(
                          listing.listing_type === 'auction'
                            ? listing.current_bid || listing.starting_bid || 0
                            : listing.buy_now_price || 0
                        )}
                      </td>
                      <td className="px-6 py-4 text-slate-500">
                        {formatDate(listing.created_at)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          {listing.listing_type === 'auction' && (
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
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/listings/${listing.id}/edit`)}
                          >
                            Edit
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

        {/* Watchlist Section */}
        <Card padding="none">
          <div className="p-6 border-b border-slate-200">
            <h2 className="section-header">My Watchlist</h2>
          </div>

          {loading ? (
            <div className="p-6 space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="skeleton h-16 w-full" />
              ))}
            </div>
          ) : watchlist.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-slate-600">
                No domains in your watchlist. Search for expiring domains to add
                them here.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 text-left text-sm text-slate-500">
                  <tr>
                    <th className="px-6 py-3 font-medium">Domain</th>
                    <th className="px-6 py-3 font-medium">Expiry Date</th>
                    <th className="px-6 py-3 font-medium">Days Left</th>
                    <th className="px-6 py-3 font-medium">Estimated Value</th>
                    <th className="px-6 py-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {watchlist.map((item) => {
                    const daysLeft = getDaysLeft(item.expiry_date);
                    return (
                      <tr key={item.id} className="hover:bg-slate-50">
                        <td className="px-6 py-4 font-medium text-slate-800">
                          {item.domain}
                        </td>
                        <td className="px-6 py-4 text-slate-500">
                          {formatDate(item.expiry_date)}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`font-medium ${getDaysLeftColor(daysLeft)}`}>
                            {daysLeft} days
                          </span>
                        </td>
                        <td className="px-6 py-4 text-slate-500">
                          {item.estimated_value
                            ? formatCurrency(item.estimated_value)
                            : '—'}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={() => handleRemoveFromWatchlist(item)}
                            >
                              Remove
                            </Button>
                            <a
                              href={`https://www.namecheap.com/domains/registration/results/?domain=${item.domain}`}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <Button variant="outline" size="sm">
                                Register Now
                              </Button>
                            </a>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* Recent Activity Section */}
        <Card>
          <h2 className="section-header mb-4">Recent Activity</h2>
          <p className="text-slate-500 text-center py-8">No transactions yet.</p>
        </Card>
      </div>

      {/* Delete Listing Modal */}
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
            <Button variant="danger" onClick={handleDeleteListing} loading={deleting}>
              Delete
            </Button>
          </>
        }
      >
        <p className="text-slate-600">
          Are you sure you want to delete "{listingToDelete?.title}"? This action
          cannot be undone.
        </p>
      </Modal>

      {/* Delete Name Modal */}
      <Modal
        isOpen={deleteNameModalOpen}
        onClose={() => {
          setDeleteNameModalOpen(false);
          setNameToDelete(null);
        }}
        title="Delete Brandable Name"
        footer={
          <>
            <Button variant="outline" onClick={() => setDeleteNameModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDeleteName} loading={deletingName}>
              Delete
            </Button>
          </>
        }
      >
        <p className="text-slate-600">
          Are you sure you want to delete "{nameToDelete?.name}"? This action cannot
          be undone.
        </p>
      </Modal>

      {/* Bids Modal */}
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
                    {formatDate(bid.created_at)}
                  </span>
                </div>
                <span
                  className={`font-bold ${
                    index === 0 ? 'text-emerald-600' : 'text-slate-600'
                  }`}
                >
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
