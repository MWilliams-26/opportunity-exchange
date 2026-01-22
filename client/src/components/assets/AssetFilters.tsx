import { useState, useEffect, type FormEvent } from 'react';
import { Input, Select, Button } from '../ui';
import type { AssetFilters as AssetFiltersType } from '../../lib/api';
import api from '../../lib/api';

interface Category {
  id: number;
  name: string;
  slug: string;
}

interface AssetFiltersProps {
  onFilter: (filters: AssetFiltersType) => void;
  loading?: boolean;
  mode?: 'marketplace' | 'discover';
}

const assetTypeOptions = [
  { value: '', label: 'All Types' },
  { value: 'domain', label: 'Domain' },
  { value: 'business_name', label: 'Business Name' },
];

export function AssetFilters({ onFilter, loading, mode = 'marketplace' }: AssetFiltersProps) {
  const [keyword, setKeyword] = useState('');
  const [type, setType] = useState('');
  const [category, setCategory] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    if (mode === 'marketplace') {
      api.get('/categories').then(({ data }) => setCategories(data)).catch(console.error);
    }
  }, [mode]);

  const categoryOptions = [
    { value: '', label: 'All Categories' },
    ...categories.map((c) => ({ value: c.slug, label: c.name })),
  ];

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onFilter({
      keyword: keyword || undefined,
      type: type || undefined,
      category: category || undefined,
      maxPrice: maxPrice ? parseInt(maxPrice, 10) : undefined,
    });
  };

  const handleReset = () => {
    setKeyword('');
    setType('');
    setCategory('');
    setMaxPrice('');
    onFilter({});
  };

  if (mode === 'discover') {
    return (
      <form onSubmit={handleSubmit} className="card mb-8">
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Search for domains by keyword
        </label>
        <div className="flex gap-3">
          <div className="flex-1">
            <Input
              placeholder="Enter keyword to search..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
            />
          </div>
          <Button type="submit" loading={loading}>
            Search
          </Button>
        </div>
      </form>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="card mb-8">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <Input
            placeholder="Search by keyword..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
          />
        </div>
        <Select
          options={assetTypeOptions}
          value={type}
          onChange={(e) => setType(e.target.value)}
        />
        <Select
          options={categoryOptions}
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        />
        <Input
          type="number"
          placeholder="Max price"
          value={maxPrice}
          onChange={(e) => setMaxPrice(e.target.value)}
          min="0"
        />
      </div>
      <div className="flex gap-3 mt-4">
        <Button type="submit" loading={loading}>
          Search
        </Button>
        <Button type="button" variant="ghost" onClick={handleReset}>
          Reset
        </Button>
      </div>
    </form>
  );
}
