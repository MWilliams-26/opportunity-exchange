import axios, { AxiosError } from 'axios';
import type { AuthResponse, User, DomainSearchResult, SearchResponse, ApiError, WatchlistItem, ExpiringDomain, ExpiringDomainsStats } from '../types';

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

// Domain Search
export const searchDomains = async (keyword: string): Promise<SearchResponse> => {
  const { data } = await api.get('/assets/search', { params: { keyword } });
  return data;
};

export const checkDomain = async (domain: string): Promise<DomainSearchResult> => {
  const { data } = await api.get('/assets/check', { params: { domain } });
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

// Expiring Domains
export interface ExpiringDomainsFilters {
  keyword?: string;
  tld?: string;
  minBacklinks?: number;
  minScore?: number;
  minTF?: number;
  favoritesOnly?: boolean;
  status?: string;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
  limit?: number;
  offset?: number;
}

export interface ExpiringDomainsResponse {
  domains: ExpiringDomain[];
  stats: ExpiringDomainsStats;
  filters: ExpiringDomainsFilters;
}

export const getExpiringDomains = async (filters?: ExpiringDomainsFilters): Promise<ExpiringDomainsResponse> => {
  const { data } = await api.get('/expiring-domains', { params: filters });
  return data;
};

export const getExpiringDomainStats = async (): Promise<ExpiringDomainsStats> => {
  const { data } = await api.get('/expiring-domains/stats');
  return data;
};

export const toggleExpiringDomainFavorite = async (id: number): Promise<ExpiringDomain> => {
  const { data } = await api.post(`/expiring-domains/${id}/favorite`);
  return data;
};

export const updateExpiringDomainNotes = async (id: number, notes: string): Promise<ExpiringDomain> => {
  const { data } = await api.put(`/expiring-domains/${id}/notes`, { notes });
  return data;
};

export const updateExpiringDomainStatus = async (id: number, status: string): Promise<ExpiringDomain> => {
  const { data } = await api.put(`/expiring-domains/${id}/status`, { status });
  return data;
};

export default api;
