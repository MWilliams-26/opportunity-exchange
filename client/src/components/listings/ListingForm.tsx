import { useState, type FormEvent } from 'react';
import { Input, Select, Textarea, Button, Card } from '../ui';
import type { CreateListingData } from '../../lib/api';

interface ListingFormProps {
  onSubmit: (data: CreateListingData) => Promise<void>;
  loading?: boolean;
  error?: string | null;
}

const assetTypeOptions = [
  { value: 'patent', label: 'Patent' },
  { value: 'trademark', label: 'Trademark' },
  { value: 'copyright', label: 'Copyright' },
  { value: 'domain', label: 'Domain' },
  { value: 'license', label: 'License' },
  { value: 'contract', label: 'Contract' },
  { value: 'other', label: 'Other' },
];

const listingTypeOptions = [
  { value: 'buy_now', label: 'Buy Now (Fixed Price)' },
  { value: 'auction', label: 'Auction' },
];

export function ListingForm({ onSubmit, loading, error }: ListingFormProps) {
  const [formData, setFormData] = useState({
    assetName: '',
    assetType: 'patent',
    assetDescription: '',
    title: '',
    description: '',
    listingType: 'buy_now' as 'buy_now' | 'auction',
    buyNowPrice: '',
    startingBid: '',
    endDate: '',
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

    if (!formData.assetName.trim()) errors.assetName = 'Asset name is required';
    if (!formData.assetDescription.trim()) errors.assetDescription = 'Asset description is required';
    if (!formData.title.trim()) errors.title = 'Listing title is required';
    if (!formData.description.trim()) errors.description = 'Listing description is required';

    if (formData.listingType === 'buy_now') {
      if (!formData.buyNowPrice || parseFloat(formData.buyNowPrice) <= 0) {
        errors.buyNowPrice = 'Valid price is required';
      }
    } else {
      if (!formData.startingBid || parseFloat(formData.startingBid) <= 0) {
        errors.startingBid = 'Valid starting bid is required';
      }
      if (!formData.endDate) {
        errors.endDate = 'Auction end date is required';
      } else if (new Date(formData.endDate) <= new Date()) {
        errors.endDate = 'End date must be in the future';
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
      assetName: formData.assetName,
      assetType: formData.assetType,
      assetDescription: formData.assetDescription,
      title: formData.title,
      description: formData.description,
      listingType: formData.listingType,
    };

    if (formData.listingType === 'buy_now') {
      data.buyNowPrice = parseFloat(formData.buyNowPrice);
    } else {
      data.startingBid = parseFloat(formData.startingBid);
      data.endDate = formData.endDate;
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
            <p className="font-semibold text-slate-800">{formData.assetName}</p>
            <p className="text-sm text-slate-600">{formData.assetType}</p>
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
              {formData.listingType === 'buy_now' ? 'Price' : 'Starting Bid'}
            </span>
            <p className="text-xl font-bold text-slate-800">
              {formatCurrency(formData.listingType === 'buy_now' ? formData.buyNowPrice : formData.startingBid)}
            </p>
          </div>
          
          {formData.listingType === 'auction' && formData.endDate && (
            <div>
              <span className="text-sm text-slate-500">Auction Ends</span>
              <p className="text-slate-800">{new Date(formData.endDate).toLocaleString()}</p>
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
            name="assetName"
            value={formData.assetName}
            onChange={handleChange}
            error={validationErrors.assetName}
            placeholder="e.g., Patent #12345678"
          />
          <Select
            label="Asset Type"
            name="assetType"
            value={formData.assetType}
            onChange={handleChange}
            options={assetTypeOptions}
          />
          <Textarea
            label="Asset Description"
            name="assetDescription"
            value={formData.assetDescription}
            onChange={handleChange}
            error={validationErrors.assetDescription}
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
            name="listingType"
            value={formData.listingType}
            onChange={handleChange}
            options={listingTypeOptions}
          />

          {formData.listingType === 'buy_now' ? (
            <Input
              label="Buy Now Price"
              name="buyNowPrice"
              type="number"
              value={formData.buyNowPrice}
              onChange={handleChange}
              error={validationErrors.buyNowPrice}
              placeholder="Enter your asking price"
              min="1"
            />
          ) : (
            <>
              <Input
                label="Starting Bid"
                name="startingBid"
                type="number"
                value={formData.startingBid}
                onChange={handleChange}
                error={validationErrors.startingBid}
                placeholder="Enter the minimum starting bid"
                min="1"
              />
              <Input
                label="Auction End Date"
                name="endDate"
                type="datetime-local"
                value={formData.endDate}
                onChange={handleChange}
                error={validationErrors.endDate}
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
