export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: string;
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
  assetId: string;
  asset?: Asset;
  sellerId: string;
  seller?: User;
  title: string;
  description: string;
  listingType: 'buy_now' | 'auction';
  buyNowPrice?: number;
  startingBid?: number;
  currentBid?: number;
  highestBidderId?: string;
  endDate?: string;
  status: 'active' | 'sold' | 'expired' | 'cancelled';
  createdAt: string;
}

export interface Bid {
  id: string;
  listingId: string;
  bidderId: string;
  bidder?: User;
  amount: number;
  createdAt: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface ApiError {
  message: string;
  errors?: Record<string, string[]>;
}

export type AssetType = Asset['type'];
export type ListingType = Listing['listingType'];
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
