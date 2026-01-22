import type { Asset, DomainSearchResult } from '../../types';
import { Card, Badge } from '../ui';

type AssetCardProps = 
  | { asset: Asset; domainResult?: never }
  | { domainResult: DomainSearchResult; asset?: never };

const assetTypeLabels: Record<Asset['type'], string> = {
  domain: 'Domain',
  business_name: 'Business Name',
};

const assetTypeColors: Record<Asset['type'], 'success' | 'warning' | 'info' | 'neutral'> = {
  domain: 'info',
  business_name: 'success',
};

export function AssetCard(props: AssetCardProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if ('domainResult' in props && props.domainResult) {
    const { domainResult } = props;
    return (
      <Card hover className="flex flex-col h-full">
        <div className="flex items-start justify-between gap-2 mb-3">
          <Badge variant="info">{domainResult.tld}</Badge>
          <Badge variant={domainResult.available ? 'success' : 'neutral'}>
            {domainResult.available ? 'Available' : 'Taken'}
          </Badge>
        </div>

        <h3 className="text-lg font-semibold text-slate-800 mb-4">
          {domainResult.name}
        </h3>

        <div className="mt-auto pt-4 border-t border-slate-100">
          <div className="flex justify-between items-center">
            <span className="text-sm text-slate-500">Est. Registration Cost</span>
            <span className="font-semibold text-emerald-600">
              {formatCurrency(domainResult.estimated_cost)}
            </span>
          </div>
        </div>
      </Card>
    );
  }

  const { asset } = props;
  return (
    <Card hover className="flex flex-col h-full">
      <div className="flex items-start justify-between gap-2 mb-3">
        <Badge variant={assetTypeColors[asset.type] || 'neutral'}>
          {assetTypeLabels[asset.type] || asset.type}
        </Badge>
        {asset.category_name && (
          <span className="text-xs text-slate-500">{asset.category_name}</span>
        )}
      </div>

      <h3 className="text-lg font-semibold text-slate-800 mb-2 line-clamp-2">
        {asset.name}
      </h3>

      <p className="text-sm text-slate-600 mb-4 line-clamp-3 flex-1">
        {asset.description}
      </p>

      {asset.state && (
        <p className="text-xs text-slate-500 mb-2">
          State: {asset.state}
        </p>
      )}

      <div className="space-y-2 pt-4 border-t border-slate-100">
        <div className="flex justify-between items-center">
          <span className="text-sm text-slate-500">Est. Acquisition Cost</span>
          <span className="font-semibold text-slate-800">
            {formatCurrency(asset.estimated_cost)}
          </span>
        </div>
        {asset.potential_value && (
          <div className="flex justify-between items-center">
            <span className="text-sm text-slate-500">Potential</span>
            <span className="text-sm text-emerald-600 font-medium">
              {asset.potential_value}
            </span>
          </div>
        )}
      </div>
    </Card>
  );
}
