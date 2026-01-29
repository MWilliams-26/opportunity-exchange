import { useState, type FormEvent } from 'react';
import { Input, Select, Textarea, Button, Card } from '../ui';
import type { CreateListingData } from '../../lib/api';

interface ListingFormProps {
  onSubmit: (data: CreateListingData) => Promise<void>;
  loading?: boolean;
  error?: string | null;
  prefillDomain?: string;
}

const assetTypeOptions = [
  { value: 'domain', label: 'Domain Name' },
  { value: 'business_name', label: 'Business Name' },
];

const listingTypeOptions = [
  { value: 'buy_now', label: 'Buy Now (Fixed Price)' },
  { value: 'auction', label: 'Auction' },
];

export function ListingForm({ onSubmit, loading, error, prefillDomain }: ListingFormProps) {
  const [formData, setFormData] = useState({
    asset_name: prefillDomain || '',
    asset_type: 'domain' as 'domain' | 'business_name',
    asset_description: '',
    title: prefillDomain ? `Premium Domain: ${prefillDomain}` : '',
    description: '',
    listing_type: 'buy_now' as 'buy_now' | 'auction',
    buy_now_price: '',
    starting_bid: '',
    auction_end_date: '',
    contact_email: '',
  });
  const [ownershipConfirmed, setOwnershipConfirmed] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setValidationErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const validate = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.asset_name.trim()) errors.asset_name = 'Asset name is required';
    if (!formData.asset_description.trim()) errors.asset_description = 'Asset description is required';
    if (!formData.title.trim()) errors.title = 'Listing title is required';
    if (!formData.description.trim()) errors.description = 'Listing description is required';

    if (formData.listing_type === 'buy_now') {
      if (!formData.buy_now_price || parseFloat(formData.buy_now_price) <= 0) {
        errors.buy_now_price = 'Valid price is required';
      }
    } else {
      if (!formData.starting_bid || parseFloat(formData.starting_bid) <= 0) {
        errors.starting_bid = 'Valid starting bid is required';
      }
      if (!formData.auction_end_date) {
        errors.auction_end_date = 'Auction end date is required';
      } else if (new Date(formData.auction_end_date) <= new Date()) {
        errors.auction_end_date = 'End date must be in the future';
      }
    }

    if (!ownershipConfirmed) {
      errors.ownership = 'You must confirm ownership';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const data: CreateListingData = {
      asset_name: formData.asset_name,
      asset_type: formData.asset_type,
      asset_description: formData.asset_description || undefined,
      title: formData.title,
      description: formData.description,
      listing_type: formData.listing_type,
      contact_email: formData.contact_email || undefined,
    };

    if (formData.listing_type === 'buy_now') {
      data.buy_now_price = parseFloat(formData.buy_now_price);
    } else {
      data.starting_bid = parseFloat(formData.starting_bid);
      data.auction_end_date = formData.auction_end_date;
    }

    await onSubmit(data);
  };

  const formatCurrency = (amount: string) => {
    const num = parseFloat(amount);
    if (isNaN(num)) return '$0';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(num);
  };

  if (showPreview) {
    return (
      <Card className="max-w-2xl mx-auto">
        <h2 className="section-header mb-6">Preview Your Listing</h2>
        
        <div className="space-y-4">
          <div>
            <span className="text-sm text-slate-500">Asset</span>
            <p className="font-semibold text-slate-800">{formData.asset_name}</p>
            <p className="text-sm text-slate-600">{formData.asset_type}</p>
          </div>
          
          <div>
            <span className="text-sm text-slate-500">Listing Title</span>
            <p className="font-semibold text-slate-800">{formData.title}</p>
          </div>
          
          <div>
            <span className="text-sm text-slate-500">Description</span>
            <p className="text-slate-600">{formData.description}</p>
          </div>
          
          <div>
            <span className="text-sm text-slate-500">
              {formData.listing_type === 'buy_now' ? 'Price' : 'Starting Bid'}
            </span>
            <p className="text-xl font-bold text-slate-800">
              {formatCurrency(formData.listing_type === 'buy_now' ? formData.buy_now_price : formData.starting_bid)}
            </p>
          </div>
          
          {formData.listing_type === 'auction' && formData.auction_end_date && (
            <div>
              <span className="text-sm text-slate-500">Auction Ends</span>
              <p className="text-slate-800">{new Date(formData.auction_end_date).toLocaleString()}</p>
            </div>
          )}
        </div>

        {error && (
          <div className="mt-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm">{error}</div>
        )}

        <div className="flex gap-3 mt-6">
          <Button variant="outline" onClick={() => setShowPreview(false)}>
            Edit
          </Button>
          <Button onClick={handleSubmit} loading={loading}>
            Publish Listing
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <form onSubmit={(e) => { e.preventDefault(); setShowPreview(true); }} className="max-w-2xl mx-auto">
      <Card className="mb-6">
        <h2 className="section-header mb-6">Asset Information</h2>
        <div className="space-y-4">
          <Input
            label="Asset Name"
            name="asset_name"
            value={formData.asset_name}
            onChange={handleChange}
            error={validationErrors.asset_name}
            placeholder="e.g., Patent #12345678"
          />
          <Select
            label="Asset Type"
            name="asset_type"
            value={formData.asset_type}
            onChange={handleChange}
            options={assetTypeOptions}
          />
          <Textarea
            label="Asset Description"
            name="asset_description"
            value={formData.asset_description}
            onChange={handleChange}
            error={validationErrors.asset_description}
            placeholder="Describe the asset, its history, and any relevant details..."
            helpText="Include relevant registration numbers, jurisdictions, or other identifying information"
          />
        </div>
      </Card>

      <Card className="mb-6">
        <h2 className="section-header mb-6">Listing Details</h2>
        <div className="space-y-4">
          <Input
            label="Listing Title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            error={validationErrors.title}
            placeholder="Create an attractive title for your listing"
          />
          <Textarea
            label="Listing Description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            error={validationErrors.description}
            placeholder="Explain why this asset is valuable and what buyers should know..."
          />
          <Select
            label="Listing Type"
            name="listing_type"
            value={formData.listing_type}
            onChange={handleChange}
            options={listingTypeOptions}
          />

          {formData.listing_type === 'buy_now' ? (
            <Input
              label="Buy Now Price"
              name="buy_now_price"
              type="number"
              value={formData.buy_now_price}
              onChange={handleChange}
              error={validationErrors.buy_now_price}
              placeholder="Enter your asking price"
              min="1"
            />
          ) : (
            <>
              <Input
                label="Starting Bid"
                name="starting_bid"
                type="number"
                value={formData.starting_bid}
                onChange={handleChange}
                error={validationErrors.starting_bid}
                placeholder="Enter the minimum starting bid"
                min="1"
              />
              <Input
                label="Auction End Date"
                name="auction_end_date"
                type="datetime-local"
                value={formData.auction_end_date}
                onChange={handleChange}
                error={validationErrors.auction_end_date}
                min={new Date().toISOString().slice(0, 16)}
              />
            </>
          )}
        </div>
      </Card>

      <Card className="mb-6">
        <h2 className="section-header mb-4">Ownership Confirmation</h2>
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={ownershipConfirmed}
            onChange={(e) => {
              setOwnershipConfirmed(e.target.checked);
              setValidationErrors((prev) => ({ ...prev, ownership: '' }));
            }}
            className="mt-1 w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
          />
          <span className="text-sm text-slate-600">
            I confirm that I am the legal owner of this asset or have the authority to sell it.
            I understand that providing false information may result in legal consequences and
            removal from the platform.
          </span>
        </label>
        {validationErrors.ownership && (
          <p className="text-xs text-red-600 mt-2">{validationErrors.ownership}</p>
        )}
      </Card>

      {error && (
        <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-lg text-sm">{error}</div>
      )}

      <div className="flex gap-3">
        <Button type="submit">Preview Listing</Button>
      </div>
    </form>
  );
}
