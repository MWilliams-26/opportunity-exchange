import { Link } from 'react-router-dom';
import { Button, Card } from '../components/ui';

const valueProps = [
  {
    title: 'Create & Earn',
    description: 'Submit brandable names you create. Earn money when they sell.',
    icon: '✨',
  },
  {
    title: 'Find & Flip',
    description: 'Discover expiring domains with value. Register and resell for profit.',
    icon: '🔍',
  },
  {
    title: 'Zero Upfront Cost',
    description: 'No inventory to buy. Just your creativity and eye for opportunity.',
    icon: '💡',
  },
];

export function Home() {
  return (
    <div>
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-slate-800 to-slate-900 text-white py-20 sm:py-28">
        <div className="container-wide text-center">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 tracking-tight">
            Turn Creativity
            <br />
            <span className="text-emerald-400">Into Income</span>
          </h1>
          <p className="text-lg sm:text-xl text-slate-300 max-w-2xl mx-auto mb-10">
            Create brandable names, discover expiring domains, and build passive income
            with zero upfront investment. Your creativity is your inventory.
          </p>

          <div className="flex flex-wrap justify-center gap-4">
            <Link to="/create">
              <Button variant="primary" size="lg">
                Start Creating
              </Button>
            </Link>
            <Link to="/discover">
              <Button variant="outline" size="lg" className="border-white/30 text-white hover:bg-white/10">
                Find Domains
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Value Props Section */}
      <section className="section">
        <div className="container-wide">
          <h2 className="page-title text-center mb-4">How It Works</h2>
          <p className="text-muted text-center mb-12 max-w-xl mx-auto">
            Three ways to turn your creativity and research into real income.
          </p>

          <div className="grid gap-8 md:grid-cols-3">
            {valueProps.map((prop) => (
              <Card key={prop.title} className="text-center">
                <span className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 text-2xl mb-4">
                  {prop.icon}
                </span>
                <h3 className="section-header mb-2">{prop.title}</h3>
                <p className="text-slate-600">{prop.description}</p>
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
            Join creators and domain flippers earning passive income on Opportunity Exchange.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link to="/create">
              <Button
                variant="outline"
                size="lg"
                className="border-white text-white hover:bg-white/10"
              >
                Create Names
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
