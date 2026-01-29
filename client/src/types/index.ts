export interface User {
  id: string;
  email: string;
  name: string;
  created_at: string;
}

export interface Asset {
  id: number;
  name: string;
  type: 'domain' | 'business_name';
  category_id: number;
  category_name?: string;
  category_slug?: string;
  description: string;
  estimated_cost: number;
  potential_value: string;
  state?: string;
  created_at: string;
}

export interface Listing {
  id: string;
  asset_id: string;
  asset?: Asset;
  user_id: string;
  seller?: User;
  title: string;
  description: string;
  listing_type: 'buy_now' | 'auction';
  buy_now_price?: number;
  starting_bid?: number;
  current_bid?: number;
  highest_bidder_id?: string;
  auction_end_date?: string;
  contact_email?: string;
  status: 'active' | 'sold' | 'expired' | 'cancelled';
  created_at: string;
}

export interface Bid {
  id: string;
  listing_id: string;
  user_id: string;
  bidder?: User;
  bidder_name?: string;
  amount: number;
  created_at: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface ApiError {
  error: {
    code: string;
    message: string;
    field?: string;
  };
}

export type AssetType = Asset['type'];
export type ListingType = Listing['listing_type'];
export type ListingStatus = Listing['status'];

export interface DomainSearchResult {
  name: string;
  type: string;
  tld: string;
  available: boolean;
  estimated_cost: number;
  source: string;
  note: string;
}

export interface SearchResponse {
  domains: DomainSearchResult[];
  businessName?: {
    name: string;
    state: string | null;
    available: boolean | null;
    note: string;
    suggestedAction: string;
  };
  meta?: {
    keyword: string;
    source: string;
    accuracy: string;
    supportedTlds: string[];
  };
}

export interface BrandableName {
  id: number;
  creator_id: number;
  name: string;
  description: string | null;
  category_id: number | null;
  category_name: string | null;
  category_slug: string | null;
  suggested_price: number | null;
  domain_available: boolean;
  status: 'available' | 'sold' | 'reserved';
  creator_name: string;
  created_at: string;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  asset_count?: number;
}

export type MarketplaceItemType = 'brandable_name' | 'premium_domain';

export interface MarketplaceItem {
  id: string;
  type: MarketplaceItemType;
  name: string;
  price: number | null;
  category: string | null;
  seller: string;
  created_at: string;
  domain_available?: boolean;
  listing_type?: 'buy_now' | 'auction';
  description?: string | null;
  original: BrandableName | Listing;
}

export interface WatchlistItem {
  id: number;
  user_id: number;
  domain: string;
  expiry_date: string;
  estimated_value: number | null;
  notes: string | null;
  days_until_expiry: number;
  created_at: string;
}
