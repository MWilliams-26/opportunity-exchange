import { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, Badge, Button } from '../components/ui';
import { getWatchlist, removeFromWatchlist } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import type { WatchlistItem } from '../types';

export function Dashboard() {
  const navigate = useNavigate();
  const { isAuthenticated, user, loading: authLoading } = useAuth();

  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const watchlistData = await getWatchlist().catch(() => []);
      setWatchlist(watchlistData);
    } catch (err) {
      setError('Failed to load dashboard data.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchData();
    }
  }, [isAuthenticated, fetchData]);

  const handleRemoveFromWatchlist = async (item: WatchlistItem) => {
    try {
      await removeFromWatchlist(item.id);
      setWatchlist((prev) => prev.filter((w) => w.id !== item.id));
    } catch (err) {
      console.error(err);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getDaysLeft = (expiryDate: string) => {
    const expiry = new Date(expiryDate);
    const now = new Date();
    const diff = expiry.getTime() - now.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const getDaysLeftColor = (days: number) => {
    if (days < 7) return 'text-red-600';
    if (days < 14) return 'text-yellow-600';
    return 'text-slate-600';
  };

  const getUrgentDomains = () => watchlist.filter(item => getDaysLeft(item.expiry_date) < 14);

  if (authLoading) {
    return (
      <div className="section">
        <div className="container-wide">
          <div className="skeleton h-8 w-48 mb-4" />
          <div className="skeleton h-64 w-full" />
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="section">
        <div className="container-narrow text-center">
          <h1 className="page-title mb-4">Dashboard</h1>
          <p className="text-slate-600 mb-6">Sign in to view your dashboard.</p>
          <Link to="/login" className="btn-primary">
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  const urgentDomains = getUrgentDomains();

  return (
    <div className="section">
      <div className="container-wide space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="page-title mb-2">Dashboard</h1>
            <p className="text-muted">Welcome back, {user?.name}</p>
          </div>
          <Button onClick={() => navigate('/discover')}>
            Find Domains
          </Button>
        </div>

        {error && (
          <div className="p-4 bg-red-50 text-red-600 rounded-lg">{error}</div>
        )}

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="text-center">
            <p className="text-3xl font-bold text-slate-800">{watchlist.length}</p>
            <p className="text-sm text-slate-500">Domains Tracked</p>
          </Card>
          <Card className="text-center">
            <p className="text-3xl font-bold text-yellow-600">{urgentDomains.length}</p>
            <p className="text-sm text-slate-500">Expiring Soon</p>
          </Card>
          <Card className="text-center">
            <p className="text-3xl font-bold text-emerald-600">
              {watchlist.filter(w => w.estimated_value).length}
            </p>
            <p className="text-sm text-slate-500">With Valuations</p>
          </Card>
        </div>

        {/* Urgent Alerts */}
        {urgentDomains.length > 0 && (
          <Card className="border-yellow-200 bg-yellow-50">
            <div className="flex items-start gap-3">
              <span className="text-2xl">⚠️</span>
              <div>
                <h3 className="font-semibold text-yellow-800 mb-1">
                  {urgentDomains.length} domain{urgentDomains.length > 1 ? 's' : ''} expiring soon!
                </h3>
                <p className="text-yellow-700 text-sm">
                  {urgentDomains.map(d => d.domain).join(', ')}
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Watchlist */}
        <Card padding="none">
          <div className="p-6 border-b border-slate-200 flex items-center justify-between">
            <h2 className="section-header">My Watchlist</h2>
            <Button size="sm" variant="outline" onClick={() => navigate('/discover')}>
              Add Domains
            </Button>
          </div>

          {loading ? (
            <div className="p-6 space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="skeleton h-16 w-full" />
              ))}
            </div>
          ) : watchlist.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-slate-600 mb-4">
                No domains in your watchlist yet.
              </p>
              <Button onClick={() => navigate('/discover')}>
                Start Tracking Domains
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 text-left text-sm text-slate-500">
                  <tr>
                    <th className="px-6 py-3 font-medium">Domain</th>
                    <th className="px-6 py-3 font-medium">Expiry Date</th>
                    <th className="px-6 py-3 font-medium">Days Left</th>
                    <th className="px-6 py-3 font-medium">Estimated Value</th>
                    <th className="px-6 py-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {watchlist.map((item) => {
                    const daysLeft = getDaysLeft(item.expiry_date);
                    return (
                      <tr key={item.id} className="hover:bg-slate-50">
                        <td className="px-6 py-4 font-medium text-slate-800">
                          {item.domain}
                          {daysLeft < 7 && (
                            <Badge variant="error" className="ml-2">Urgent</Badge>
                          )}
                        </td>
                        <td className="px-6 py-4 text-slate-500">
                          {formatDate(item.expiry_date)}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`font-medium ${getDaysLeftColor(daysLeft)}`}>
                            {daysLeft} days
                          </span>
                        </td>
                        <td className="px-6 py-4 text-slate-500">
                          {item.estimated_value
                            ? formatCurrency(item.estimated_value)
                            : '—'}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={() => handleRemoveFromWatchlist(item)}
                            >
                              Remove
                            </Button>
                            <a
                              href={`https://www.namecheap.com/domains/registration/results/?domain=${item.domain}`}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <Button variant="outline" size="sm">
                                Register
                              </Button>
                            </a>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* How It Works */}
        <Card>
          <h2 className="section-header mb-4">How to Acquire Expiring Domains</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-xl">1</span>
              </div>
              <h3 className="font-medium mb-1">Track</h3>
              <p className="text-sm text-slate-600">
                Add expiring domains to your watchlist and monitor their status
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-xl">2</span>
              </div>
              <h3 className="font-medium mb-1">Wait</h3>
              <p className="text-sm text-slate-600">
                Domains enter a grace period, then become available for registration
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-xl">3</span>
              </div>
              <h3 className="font-medium mb-1">Register</h3>
              <p className="text-sm text-slate-600">
                Use a backorder service or register directly when the domain drops
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
