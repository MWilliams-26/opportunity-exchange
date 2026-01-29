import axios, { AxiosError } from 'axios';
import type { Asset, Listing, Bid, AuthResponse, User, DomainSearchResult, SearchResponse, ApiError, BrandableName, WatchlistItem, Category } from '../types';

const api = axios.create({
  baseURL: 'http://localhost:3001/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const extractErrorMessage = (error: unknown): string => {
  if (error instanceof AxiosError && error.response?.data) {
    const data = error.response.data as ApiError;
    if (data.error?.message) {
      return data.error.message;
    }
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'An unexpected error occurred';
};

export const extractErrorCode = (error: unknown): string | null => {
  if (error instanceof AxiosError && error.response?.data) {
    const data = error.response.data as ApiError;
    if (data.error?.code) {
      return data.error.code;
    }
  }
  return null;
};

export const extractErrorField = (error: unknown): string | null => {
  if (error instanceof AxiosError && error.response?.data) {
    const data = error.response.data as ApiError;
    if (data.error?.field) {
      return data.error.field;
    }
  }
  return null;
};

// Auth
export const login = async (email: string, password: string): Promise<AuthResponse> => {
  const { data } = await api.post('/auth/login', { email, password });
  return data;
};

export const register = async (name: string, email: string, password: string): Promise<AuthResponse> => {
  const { data } = await api.post('/auth/register', { name, email, password });
  return data;
};

export const getMe = async (): Promise<User> => {
  const { data } = await api.get('/auth/me');
  return data;
};

// Assets
export interface AssetFilters {
  keyword?: string;
  type?: string;
  category?: string;
  maxPrice?: number;
}

export const getAssets = async (filters?: AssetFilters): Promise<Asset[]> => {
  const { data } = await api.get('/assets', { params: filters });
  return data;
};

export const getAsset = async (id: string): Promise<Asset> => {
  const { data } = await api.get(`/assets/${id}`);
  return data;
};

export const searchDomains = async (keyword: string): Promise<SearchResponse> => {
  const { data } = await api.get('/assets/search', { params: { keyword } });
  return data;
};

export const checkDomain = async (domain: string): Promise<DomainSearchResult> => {
  const { data } = await api.get('/assets/check', { params: { domain } });
  return data;
};

// Listings
export interface ListingFilters {
  listing_type?: string;
  status?: string;
  user_id?: string;
}

export const getListings = async (filters?: ListingFilters): Promise<Listing[]> => {
  const { data } = await api.get('/listings', { params: filters });
  return data;
};

export const getListing = async (id: string): Promise<Listing> => {
  const { data } = await api.get(`/listings/${id}`);
  return data;
};

export const getMyListings = async (): Promise<Listing[]> => {
  const { data } = await api.get('/users/me/listings');
  return data;
};

export interface CreateListingData {
  asset_name: string;
  asset_type: 'domain' | 'business_name';
  asset_description?: string;
  category_id?: number;
  title: string;
  description: string;
  listing_type: 'buy_now' | 'auction';
  buy_now_price?: number;
  starting_bid?: number;
  auction_end_date?: string;
  contact_email?: string;
}

export const createListing = async (listingData: CreateListingData): Promise<Listing> => {
  const { data } = await api.post('/listings', listingData);
  return data;
};

export const updateListing = async (id: string, listingData: Partial<CreateListingData>): Promise<Listing> => {
  const { data } = await api.put(`/listings/${id}`, listingData);
  return data;
};

export const deleteListing = async (id: string): Promise<void> => {
  await api.delete(`/listings/${id}`);
};

// Bids
export const getBidsForListing = async (listingId: string): Promise<Bid[]> => {
  const { data } = await api.get(`/listings/${listingId}/bids`);
  return data;
};

export const placeBid = async (listingId: string, amount: number): Promise<Bid> => {
  const { data } = await api.post(`/listings/${listingId}/bids`, { amount });
  return data;
};

// Brandable Names
export interface BrandableNameFilters {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  sort?: 'newest' | 'price_asc' | 'price_desc';
}

export const getBrandableNames = async (filters?: BrandableNameFilters): Promise<BrandableName[]> => {
  const { data } = await api.get('/brandable-names', { params: filters });
  return data;
};

export const getMyBrandableNames = async (): Promise<BrandableName[]> => {
  const { data } = await api.get('/users/me/brandable-names');
  return data;
};

export const deleteBrandableName = async (id: number): Promise<void> => {
  await api.delete(`/brandable-names/${id}`);
};

// Categories
export const getCategories = async (): Promise<Category[]> => {
  const { data } = await api.get('/categories');
  return data;
};

// Watchlist
export const getWatchlist = async (): Promise<WatchlistItem[]> => {
  const { data } = await api.get('/watchlist');
  return data;
};

export interface AddToWatchlistData {
  domain: string;
  expiry_date: string;
  estimated_value?: number;
  notes?: string;
}

export const addToWatchlist = async (watchlistData: AddToWatchlistData): Promise<WatchlistItem> => {
  const { data } = await api.post('/watchlist', watchlistData);
  return data;
};

export const removeFromWatchlist = async (id: number): Promise<void> => {
  await api.delete(`/watchlist/${id}`);
};

// Brandable Names - Create
export interface CreateBrandableNameData {
  name: string;
  description?: string;
  category_id?: number;
  suggested_price: number;
  domain_available?: boolean;
}

export const createBrandableName = async (data: CreateBrandableNameData): Promise<BrandableName> => {
  const { data: result } = await api.post('/brandable-names', data);
  return result;
};

export default api;
