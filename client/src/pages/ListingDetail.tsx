import { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, Badge, Button, Timer, Modal } from '../components/ui';
import { BidForm } from '../components/listings';
import { getListing, getBidsForListing, placeBid } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import type { Listing, Bid } from '../types';

export function ListingDetail() {
  const { id } = useParams<{ id: string }>();
  const { isAuthenticated, user } = useAuth();
  const [listing, setListing] = useState<Listing | null>(null);
  const [bids, setBids] = useState<Bid[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bidError, setBidError] = useState<string | null>(null);
  const [bidding, setBidding] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);

  const fetchData = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const [listingData, bidsData] = await Promise.all([
        getListing(id),
        getBidsForListing(id).catch(() => []),
      ]);
      setListing(listingData);
      setBids(bidsData);
    } catch (err) {
      setError('Failed to load listing. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handlePlaceBid = async (amount: number) => {
    if (!id) return;
    setBidding(true);
    setBidError(null);
    try {
      await placeBid(id, amount);
      await fetchData();
    } catch (err) {
      setBidError('Failed to place bid. Please try again.');
      console.error(err);
    } finally {
      setBidding(false);
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

  if (error || !listing) {
    return (
      <div className="section">
        <div className="container-narrow text-center">
          <p className="text-lg text-red-600 mb-4">{error || 'Listing not found'}</p>
          <Link to="/marketplace">
            <Button>Back to Marketplace</Button>
          </Link>
        </div>
      </div>
    );
  }

  const isAuction = listing.listing_type === 'auction';
  const isOwner = user?.id === listing.user_id;
  const isActive = listing.status === 'active';

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
          <Badge variant={isAuction ? 'warning' : 'success'}>
            {isAuction ? 'Auction' : 'Buy Now'}
          </Badge>
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
        </div>

        <h1 className="page-title mb-6">{listing.title}</h1>

        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <h2 className="section-header mb-4">Description</h2>
              <p className="text-slate-600 whitespace-pre-wrap">{listing.description}</p>
            </Card>

            {listing.asset && (
              <Card>
                <h2 className="section-header mb-4">Asset Information</h2>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Name</span>
                    <span className="font-medium text-slate-800">{listing.asset.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Type</span>
                    <span className="font-medium text-slate-800 capitalize">{listing.asset.type}</span>
                  </div>
                  {listing.asset.category_name && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">Category</span>
                      <span className="font-medium text-slate-800">{listing.asset.category_name}</span>
                    </div>
                  )}
                  {listing.asset.description && (
                    <div className="pt-3 border-t border-slate-100">
                      <span className="text-slate-500 block mb-2">Description</span>
                      <p className="text-slate-600">{listing.asset.description}</p>
                    </div>
                  )}
                </div>
              </Card>
            )}

            {isAuction && bids.length > 0 && (
              <Card>
                <h2 className="section-header mb-4">Bid History</h2>
                <div className="space-y-3">
                  {bids.map((bid, index) => (
                    <div
                      key={bid.id}
                      className={`flex justify-between items-center py-2 ${
                        index === 0 ? 'text-emerald-600 font-medium' : 'text-slate-600'
                      }`}
                    >
                      <span>{bid.bidder?.name || 'Anonymous'}</span>
                      <span>{formatCurrency(bid.amount)}</span>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>

          <div className="space-y-6">
            <Card>
              <div className="text-center mb-6">
                <span className="text-sm text-slate-500 block mb-1">
                  {isAuction
                    ? listing.current_bid
                      ? 'Current Bid'
                      : 'Starting Bid'
                    : 'Price'}
                </span>
                <span className="text-3xl font-bold text-slate-800">
                  {formatCurrency(
                    isAuction
                      ? listing.current_bid || listing.starting_bid || 0
                      : listing.buy_now_price || 0
                  )}
                </span>
              </div>

              {isAuction && listing.auction_end_date && isActive && (
                <div className="mb-6 p-4 bg-slate-50 rounded-lg">
                  <span className="text-sm text-slate-500 block mb-2">Auction ends in</span>
                  <Timer endDate={listing.auction_end_date} onExpire={fetchData} />
                </div>
              )}

              {isActive && !isOwner && (
                <>
                  {isAuction ? (
                    isAuthenticated ? (
                      <BidForm
                        currentBid={listing.current_bid || listing.starting_bid || 0}
                        minimumBid={listing.starting_bid || 1}
                        onSubmit={handlePlaceBid}
                        loading={bidding}
                        error={bidError}
                      />
                    ) : (
                      <div className="text-center">
                        <p className="text-sm text-slate-600 mb-4">
                          Sign in to place a bid on this listing.
                        </p>
                        <Link to="/login">
                          <Button className="w-full">Sign In to Bid</Button>
                        </Link>
                      </div>
                    )
                  ) : (
                    <Button
                      className="w-full"
                      size="lg"
                      onClick={() => {
                        if (isAuthenticated) {
                          setShowContactModal(true);
                        } else {
                          window.location.href = '/login';
                        }
                      }}
                    >
                      Express Interest
                    </Button>
                  )}
                </>
              )}

              {isOwner && (
                <div className="text-center py-4">
                  <p className="text-sm text-slate-500">This is your listing.</p>
                </div>
              )}
            </Card>

            <Card>
              <h3 className="font-semibold text-slate-800 mb-4">Seller Information</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">Name</span>
                  <span className="font-medium text-slate-800">
                    {listing.seller?.name || 'Unknown'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Member since</span>
                  <span className="text-slate-600">
                    {listing.seller?.created_at ? formatDate(listing.seller.created_at) : 'N/A'}
                  </span>
                </div>
              </div>
            </Card>

            <Card>
              <div className="text-xs text-slate-500">
                <p className="mb-2">
                  <strong>Listed:</strong> {formatDate(listing.created_at)}
                </p>
                <p>
                  Opportunity Exchange is not responsible for the accuracy of listing 
                  information. Buyers should conduct their own due diligence.
                </p>
              </div>
            </Card>
          </div>
        </div>
      </div>

      <Modal
        isOpen={showContactModal}
        onClose={() => setShowContactModal(false)}
        title="Express Purchase Interest"
        footer={
          <>
            <Button variant="outline" onClick={() => setShowContactModal(false)}>
              Cancel
            </Button>
            <Button onClick={() => setShowContactModal(false)}>
              Confirm Interest
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-slate-600">
            By expressing interest, you confirm that you are seriously considering 
            purchasing this asset at the listed price of{' '}
            <strong>{formatCurrency(listing.buy_now_price || 0)}</strong>.
          </p>
          <p className="text-slate-600">
            The seller will be notified and may contact you to proceed with the transaction.
          </p>
          <div className="p-4 bg-amber-50 rounded-lg">
            <p className="text-sm text-amber-800">
              <strong>Note:</strong> This does not complete a purchase. You will need to 
              finalize terms directly with the seller.
            </p>
          </div>
        </div>
      </Modal>
    </div>
  );
}
