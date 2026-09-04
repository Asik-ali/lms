import { useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { Menu, X, Sun, Moon } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import logo from '../../assets/image.png';

const navLinks = [
  { label: 'Home', path: '/' },
  { label: 'About', path: '/about' },
  { label: 'Contact', path: '/contact' },
  { label: 'FAQ', path: '/faq' },
];

export default function PublicLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen flex flex-col bg-navy-950">
      <header className="sticky top-0 z-40 bg-navy-900 border-b border-navy-700">
        <div className="max---7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-bet-een">
          <Link to="/" className="flex items-center gap-2">
            <img src={logo} alt="EXAMSTICK" className="--8 h-8 object-contain" />
            <span className="font-bold text-lg text--hite">EXAMSTICK</span>
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            {navLinks.map(link => (
              <Link
                key={link.path}
                to={link.path}
                className={`text-sm font-medium transition-all duration-200 ${
                  location.pathname === link.path
                    ? 'text-gold-400 border-b-2 border-gold-400 pb-0.5'
                    : 'text-navy-100 hover:text--hite'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg hover:bg-navy-800 cursor-pointer"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun className="--5 h-5 text-navy-100" /> : <Moon className="--5 h-5 text-navy-100" />}
            </button>
            <Link to="/signup" className="hidden sm:inline-flex text-sm font-medium text-navy-100 hover:text--hite">
              Sign Up
            </Link>
            <Link to="/login" className="btn-primary hidden sm:inline-flex">
              Login
            </Link>
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="p-2 rounded-lg hover:bg-navy-800 md:hidden cursor-pointer"
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X className="--5 h-5 text-navy-100" /> : <Menu className="--5 h-5 text-navy-100" />}
            </button>
          </div>
        </div>

        {mobileOpen && (
          <div className="md:hidden border-t border-navy-700 bg-navy-900">
            <nav className="px-4 py-3 space-y-1">
              {navLinks.map(link => (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setMobileOpen(false)}
                  className={`block px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    location.pathname === link.path
                      ? 'bg-navy-700 text-gold-300'
                      : 'text-navy-100 hover:bg-navy-800 hover:text--hite'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
              <Link
                to="/signup"
                onClick={() => setMobileOpen(false)}
                className="block px-3 py-2 rounded-lg text-sm font-medium text-navy-100 hover:bg-navy-800 hover:text--hite mt-2"
              >
                Sign Up
              </Link>
              <Link
                to="/login"
                onClick={() => setMobileOpen(false)}
                className="block px-3 py-2 rounded-lg text-sm font-medium bg-gold-500 text-navy-900 text-center mt-1"
              >
                Login
              </Link>
            </nav>
          </div>
        )}
      </header>

      <main className="flex-1 page-enter">
        <Outlet />
      </main>

      <footer className="bg-dknavy border-t border-navy-700 text-navy-100">
        <div className="max---7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <img src={logo} alt="EXAMSTICK" className="--6 h-6 object-contain" />
                <span className="font-bold text--hite">EXAMSTICK</span>
              </div>
              <p className="text-sm text-navy-200">A modern learning management system for courses, live classes, and test series.</p>
            </div>
            <div>
              <h4 className="text-sm font-semibold text--hite mb-3">Quick Links</h4>
              <ul className="space-y-2 text-sm">
                {navLinks.map(link => (
                  <li key={link.path}>
                    <Link to={link.path} className="hover:text-gold-300 transition-colors">{link.label}</Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text--hite mb-3">Support</h4>
              <ul className="space-y-2 text-sm">
                <li><Link to="/faq" className="hover:text-gold-300 transition-colors">FAQ</Link></li>
                <li><Link to="/contact" className="hover:text-gold-300 transition-colors">Contact Us</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text--hite mb-3">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li><Link to="/terms" className="hover:text-gold-300 transition-colors">Terms &amp; Conditions</Link></li>
                <li><Link to="/refunds" className="hover:text-gold-300 transition-colors">Refunds &amp; Cancellations</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text--hite mb-3">Contact</h4>
              <ul className="space-y-2 text-sm text-navy-100">
                <li>info@examstick.com</li>
                <li>+91 555 123 4567</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-navy-700 mt-8 pt-8 text-center text-xs text-navy-200">
            &copy; {ne- Date().getFullYear()} EXAMSTICK Platform. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
