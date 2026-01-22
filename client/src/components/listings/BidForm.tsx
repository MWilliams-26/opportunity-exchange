import { useState, type FormEvent } from 'react';
import { Input, Button } from '../ui';

interface BidFormProps {
  currentBid: number;
  minimumBid: number;
  onSubmit: (amount: number) => Promise<void>;
  loading?: boolean;
  error?: string | null;
}

export function BidForm({ currentBid, minimumBid, onSubmit, loading, error }: BidFormProps) {
  const [bidAmount, setBidAmount] = useState('');
  const [validationError, setValidationError] = useState('');

  const minBidAmount = Math.max(currentBid + 1, minimumBid);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setValidationError('');

    const amount = parseFloat(bidAmount);
    if (isNaN(amount) || amount < minBidAmount) {
      setValidationError(`Minimum bid is ${formatCurrency(minBidAmount)}`);
      return;
    }

    await onSubmit(amount);
    setBidAmount('');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-lg">
        <div className="flex-1">
          <span className="text-sm text-slate-500 block">Current Bid</span>
          <span className="text-2xl font-bold text-slate-800">{formatCurrency(currentBid)}</span>
        </div>
        <div className="text-right">
          <span className="text-sm text-slate-500 block">Minimum Next Bid</span>
          <span className="text-lg font-semibold text-emerald-600">{formatCurrency(minBidAmount)}</span>
        </div>
      </div>

      <Input
        label="Your Bid"
        type="number"
        value={bidAmount}
        onChange={(e) => {
          setBidAmount(e.target.value);
          setValidationError('');
        }}
        error={validationError}
        placeholder={`Enter at least ${formatCurrency(minBidAmount)}`}
        min={minBidAmount}
        step="1"
      />

      {error && (
        <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm">{error}</div>
      )}

      <Button type="submit" className="w-full" loading={loading}>
        Place Bid
      </Button>

      <p className="text-xs text-slate-500 text-center">
        By placing a bid, you agree to our terms of service and commit to completing 
        the purchase if you win.
      </p>
    </form>
  );
}
