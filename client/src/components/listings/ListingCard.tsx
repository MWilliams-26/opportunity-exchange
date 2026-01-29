import { Link } from 'react-router-dom';
import type { Listing } from '../../types';
import { Card, Badge, Timer } from '../ui';

interface ListingCardProps {
  listing: Listing;
}

export function ListingCard({ listing }: ListingCardProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const isAuction = listing.listing_type === 'auction';
  const displayPrice = isAuction
    ? listing.current_bid || listing.starting_bid
    : listing.buy_now_price;

  return (
    <Link to={`/listings/${listing.id}`}>
      <Card hover className="h-full flex flex-col">
        <div className="flex items-start justify-between gap-2 mb-3">
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

        <h3 className="text-lg font-semibold text-slate-800 mb-2 line-clamp-2">
          {listing.title}
        </h3>

        <p className="text-sm text-slate-600 mb-4 line-clamp-2 flex-1">
          {listing.description}
        </p>

        {listing.asset && (
          <div className="text-xs text-slate-500 mb-4">
            <span className="inline-flex items-center gap-1">
              <span className="font-medium">{listing.asset.type}</span>
              {listing.asset.category_name && (
                <>
                  <span>•</span>
                  <span>{listing.asset.category_name}</span>
                </>
              )}
            </span>
          </div>
        )}

        <div className="pt-4 border-t border-slate-100 space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-slate-500">
              {isAuction ? (listing.current_bid ? 'Current Bid' : 'Starting Bid') : 'Price'}
            </span>
            <span className="text-xl font-bold text-slate-800">
              {displayPrice ? formatCurrency(displayPrice) : 'N/A'}
            </span>
          </div>

          {isAuction && listing.auction_end_date && listing.status === 'active' && (
            <div className="pt-2 border-t border-slate-100">
              <span className="text-xs text-slate-500 block mb-1">Ends in</span>
              <Timer endDate={listing.auction_end_date} />
            </div>
          )}
        </div>
      </Card>
    </Link>
  );
}
