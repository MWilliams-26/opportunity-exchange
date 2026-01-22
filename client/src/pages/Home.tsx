import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button, Input, Card } from '../components/ui';

const categories = [
  { name: 'Patents', icon: '📜', description: 'Utility and design patents', count: 1250 },
  { name: 'Trademarks', icon: '™️', description: 'Registered brand marks', count: 890 },
  { name: 'Domains', icon: '🌐', description: 'Premium domain names', count: 2100 },
  { name: 'Licenses', icon: '📄', description: 'Software and media licenses', count: 560 },
  { name: 'Copyrights', icon: '©️', description: 'Creative works', count: 780 },
  { name: 'Contracts', icon: '📋', description: 'Business agreements', count: 340 },
];

const trustPoints = [
  {
    title: 'Verified Listings',
    description: 'All listings require ownership confirmation from sellers.',
    icon: '✓',
  },
  {
    title: 'Secure Transactions',
    description: 'Protected communication and intent verification.',
    icon: '🔒',
  },
  {
    title: 'Transparent Pricing',
    description: 'Clear pricing with auction and fixed-price options.',
    icon: '💰',
  },
];

export function Home() {
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/discover?keyword=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <div>
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-slate-800 to-slate-900 text-white py-20 sm:py-28">
        <div className="container-wide text-center">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 tracking-tight">
            Discover Valuable
            <br />
            <span className="text-emerald-400">Intellectual Property</span>
          </h1>
          <p className="text-lg sm:text-xl text-slate-300 max-w-2xl mx-auto mb-10">
            The marketplace for patents, trademarks, domains, and other IP assets. 
            Find opportunities, list your assets, and connect with buyers.
          </p>

          <form onSubmit={handleSearch} className="max-w-xl mx-auto mb-8">
            <div className="flex gap-3">
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search patents, trademarks, domains..."
                className="flex-1 bg-white/10 border-white/20 text-white placeholder-slate-400 focus:bg-white/15"
              />
              <Button type="submit" variant="primary" size="lg">
                Search
              </Button>
            </div>
          </form>

          <div className="flex flex-wrap justify-center gap-4">
            <Link to="/discover">
              <Button variant="outline" className="border-white/30 text-white hover:bg-white/10">
                Browse Assets
              </Button>
            </Link>
            <Link to="/create-listing">
              <Button variant="primary" size="lg">
                List Your Asset
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="section">
        <div className="container-wide">
          <h2 className="page-title text-center mb-4">Featured Categories</h2>
          <p className="text-muted text-center mb-12 max-w-xl mx-auto">
            Explore thousands of intellectual property assets across all major categories.
          </p>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((category) => (
              <Link key={category.name} to={`/discover?category=${category.name.toLowerCase()}`}>
                <Card hover className="flex items-center gap-4">
                  <span className="text-4xl">{category.icon}</span>
                  <div className="flex-1">
                    <h3 className="font-semibold text-slate-800">{category.name}</h3>
                    <p className="text-sm text-slate-500">{category.description}</p>
                  </div>
                  <span className="text-sm font-medium text-emerald-600">
                    {category.count.toLocaleString()}
                  </span>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="section-alt">
        <div className="container-wide">
          <h2 className="page-title text-center mb-4">Built on Trust</h2>
          <p className="text-muted text-center mb-12 max-w-xl mx-auto">
            We prioritize transparency and ethical practices in every transaction.
          </p>

          <div className="grid gap-8 md:grid-cols-3">
            {trustPoints.map((point) => (
              <Card key={point.title} className="text-center">
                <span className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 text-xl mb-4">
                  {point.icon}
                </span>
                <h3 className="section-header mb-2">{point.title}</h3>
                <p className="text-slate-600">{point.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="section bg-emerald-600 text-white">
        <div className="container-narrow text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-emerald-100 mb-8 max-w-md mx-auto">
            Whether you're looking to acquire valuable IP or list your own assets, 
            Opportunity Exchange is here to help.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link to="/discover">
              <Button
                variant="outline"
                size="lg"
                className="border-white text-white hover:bg-white/10"
              >
                Discover Assets
              </Button>
            </Link>
            <Link to="/register">
              <Button
                variant="secondary"
                size="lg"
                className="bg-white text-emerald-600 hover:bg-slate-100"
              >
                Create Account
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
