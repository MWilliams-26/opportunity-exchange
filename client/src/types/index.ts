export interface User {
  id: string;
  email: string;
  name: string;
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
  meta?: {
    keyword: string;
    source: string;
    accuracy: string;
    supportedTlds: string[];
  };
}

export interface WatchlistItem {
  id: number;
  user_id: number;
  domain: string;
  expiry_date: string;
  estimated_value: number | null;
  notes: string | null;
  expiring_domain_id: number | null;
  created_at: string;
}

export interface ExpiringDomain {
  id: number;
  domain: string;
  tld: string;
  expiry_date: string | null;
  delete_date: string | null;
  status: 'pending' | 'available' | 'registered' | 'archived';
  backlinks: number;
  referring_domains: number;
  domain_age_years: number | null;
  archive_org_age: number | null;
  majestic_tf: number;
  majestic_cf: number;
  moz_da: number;
  moz_pa: number;
  estimated_value_cents: number | null;
  score: number;
  why_interesting: string | null;
  notes: string | null;
  is_favorite: number;
  dns_available: number | null;
  dns_checked_at: string | null;
  source: string;
  imported_at: string;
  updated_at: string;
}

export interface ExpiringDomainsStats {
  total: number;
  favorites: number;
  pending: number;
  registered: number;
  avg_score: number | null;
  max_score: number | null;
  high_backlinks: number;
  high_tf: number;
  byTld: Array<{ tld: string; count: number }>;
}
