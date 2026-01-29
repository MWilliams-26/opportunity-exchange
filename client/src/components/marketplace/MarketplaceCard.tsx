import { Link } from 'react-router-dom';
import type { MarketplaceItem } from '../../types';
import { Card, Badge } from '../ui';

interface MarketplaceCardProps {
  item: MarketplaceItem;
}

export function MarketplaceCard({ item }: MarketplaceCardProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const isBrandableName = item.type === 'brandable_name';
  const linkTo = isBrandableName
    ? `/names/${item.id}`
    : `/listings/${item.id}`;

  return (
    <Link to={linkTo}>
      <Card hover className="h-full flex flex-col">
        <div className="flex items-start justify-between gap-2 mb-3">
          <Badge variant={isBrandableName ? 'info' : 'success'}>
            {isBrandableName ? 'Brandable Name' : 'Premium Domain'}
          </Badge>
          {isBrandableName && item.domain_available && (
            <Badge variant="success">.com Available</Badge>
          )}
          {!isBrandableName && item.listing_type && (
            <Badge variant={item.listing_type === 'auction' ? 'warning' : 'neutral'}>
              {item.listing_type === 'auction' ? 'Auction' : 'Buy Now'}
            </Badge>
          )}
        </div>

        <h3 className="text-lg font-semibold text-slate-800 mb-2 line-clamp-1">
          {item.name}
        </h3>

        {item.description && (
          <p className="text-sm text-slate-600 mb-3 line-clamp-2 flex-1">
            {item.description}
          </p>
        )}

        <div className="text-xs text-slate-500 mb-4 flex items-center gap-2">
          {item.category && (
            <span className="bg-slate-100 px-2 py-0.5 rounded">{item.category}</span>
          )}
          <span>by {item.seller}</span>
        </div>

        <div className="pt-4 border-t border-slate-100 flex justify-between items-center">
          <span className="text-sm text-slate-500">Price</span>
          <span className="text-xl font-bold text-slate-800">
            {item.price ? formatCurrency(item.price) : 'Make Offer'}
          </span>
        </div>
      </Card>
    </Link>
  );
}
