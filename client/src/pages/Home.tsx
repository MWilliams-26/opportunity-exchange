import { Link } from 'react-router-dom';
import { Button, Card } from '../components/ui';

const features = [
  {
    title: 'Track Expiring Domains',
    description: 'Monitor domains nearing expiration. Get alerts before they drop.',
    icon: '🔍',
  },
  {
    title: 'Register at Drop',
    description: 'Catch valuable domains when they become available. No bidding wars.',
    icon: '⚡',
  },
  {
    title: 'Flip for Profit',
    description: 'Acquire undervalued domains and resell them for a profit.',
    icon: '💰',
  },
];

const assetTypes = [
  { name: 'Domains', description: 'Expiring .com, .net, .org, .io', available: true },
  { name: 'Social Handles', description: 'Twitter, Instagram, TikTok', available: false },
  { name: 'Trademarks', description: 'Abandoned & lapsed marks', available: false },
  { name: 'Real Estate', description: 'Tax liens & auctions', available: false },
];

export function Home() {
  return (
    <div>
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-slate-800 to-slate-900 text-white py-20 sm:py-28">
        <div className="container-wide text-center">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 tracking-tight">
            Catch Expiring Domains
            <br />
            <span className="text-emerald-400">Before Anyone Else</span>
          </h1>
          <p className="text-lg sm:text-xl text-slate-300 max-w-2xl mx-auto mb-10">
            Track domains nearing expiration, get alerts when they drop, and register
            valuable names at standard prices. No auctions. No bidding wars.
          </p>

          <div className="flex flex-wrap justify-center gap-4">
            <Link to="/discover">
              <Button variant="primary" size="lg">
                Search Domains
              </Button>
            </Link>
            <Link to="/register">
              <Button variant="outline" size="lg" className="border-white/30 text-white hover:bg-white/10">
                Create Account
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="section">
        <div className="container-wide">
          <h2 className="page-title text-center mb-4">How It Works</h2>
          <p className="text-muted text-center mb-12 max-w-xl mx-auto">
            Find, track, and acquire expiring domains in three simple steps.
          </p>

          <div className="grid gap-8 md:grid-cols-3">
            {features.map((feature) => (
              <Card key={feature.title} className="text-center">
                <span className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 text-2xl mb-4">
                  {feature.icon}
                </span>
                <h3 className="section-header mb-2">{feature.title}</h3>
                <p className="text-slate-600">{feature.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Asset Types */}
      <section className="section bg-slate-50">
        <div className="container-wide">
          <h2 className="page-title text-center mb-4">Discover Undervalued Assets</h2>
          <p className="text-muted text-center mb-12 max-w-xl mx-auto">
            We're building the best platform for finding affordable digital (and physical) assets.
          </p>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {assetTypes.map((asset) => (
              <Card key={asset.name} className={!asset.available ? 'opacity-60' : ''}>
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-slate-800">{asset.name}</h3>
                  {asset.available ? (
                    <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">
                      Live
                    </span>
                  ) : (
                    <span className="text-xs bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full">
                      Coming Soon
                    </span>
                  )}
                </div>
                <p className="text-sm text-slate-600">{asset.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="section bg-emerald-600 text-white">
        <div className="container-narrow text-center">
          <h2 className="text-3xl font-bold mb-4">Start Finding Opportunities</h2>
          <p className="text-emerald-100 mb-8 max-w-md mx-auto">
            Join smart investors who catch expiring domains and build valuable portfolios.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link to="/discover">
              <Button
                variant="outline"
                size="lg"
                className="border-white text-white hover:bg-white/10"
              >
                Search Domains
              </Button>
            </Link>
            <Link to="/register">
              <Button
                variant="secondary"
                size="lg"
                className="bg-white text-emerald-600 hover:bg-slate-100"
              >
                Create Free Account
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
