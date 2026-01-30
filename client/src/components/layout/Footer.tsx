import { Link } from 'react-router-dom';

export function Footer() {
  return (
    <footer className="bg-slate-800 text-slate-300">
      <div className="container-wide py-12">
        <div className="grid gap-8 md:grid-cols-4">
          <div className="md:col-span-2">
            <h3 className="text-lg font-bold text-white mb-4">Opportunity Exchange</h3>
            <p className="text-sm text-slate-400 max-w-md">
              Discover expiring domains and undervalued digital assets before anyone else.
              Track, monitor, and acquire opportunities at the right time.
            </p>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-white mb-4">Platform</h4>
            <nav className="flex flex-col gap-2">
              <Link to="/discover" className="text-sm hover:text-white transition-colors">
                Discover Domains
              </Link>
              <Link to="/dashboard" className="text-sm hover:text-white transition-colors">
                My Watchlist
              </Link>
            </nav>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-white mb-4">Account</h4>
            <nav className="flex flex-col gap-2">
              <Link to="/login" className="text-sm hover:text-white transition-colors">
                Login
              </Link>
              <Link to="/register" className="text-sm hover:text-white transition-colors">
                Register
              </Link>
            </nav>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-slate-700">
          <div className="bg-slate-700/50 rounded-lg p-4 mb-6">
            <p className="text-xs text-slate-400">
              <strong className="text-slate-300">Disclaimer:</strong> Opportunity Exchange provides 
              domain availability information for research purposes. We do not guarantee domain 
              availability or registration success. Domain expiry dates are estimates based on 
              publicly available WHOIS data. Users are responsible for verifying information 
              and conducting due diligence before any domain acquisition.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-sm text-slate-400">
              © {new Date().getFullYear()} Opportunity Exchange. All rights reserved.
            </p>
            <div className="flex gap-6">
              <a href="#" className="text-xs text-slate-400 hover:text-white transition-colors">
                Terms of Service
              </a>
              <a href="#" className="text-xs text-slate-400 hover:text-white transition-colors">
                Privacy Policy
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
