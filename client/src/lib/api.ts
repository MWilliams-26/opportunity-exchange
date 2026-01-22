import axios from 'axios';
import type { Asset, Listing, Bid, AuthResponse, User, DomainSearchResult, SearchResponse } from '../types';

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
  listingType?: string;
  status?: string;
  sellerId?: string;
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
  const { data } = await api.get('/listings/my');
  return data;
};

export interface CreateListingData {
  assetName: string;
  assetType: string;
  assetDescription: string;
  title: string;
  description: string;
  listingType: 'buy_now' | 'auction';
  buyNowPrice?: number;
  startingBid?: number;
  endDate?: string;
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

export default api;
