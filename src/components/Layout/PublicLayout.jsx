import { useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { BookOpen, Menu, X, Sun, Moon } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

const navLinks = [
  { label: 'Home', path: '/' },
  { label: 'Pricing', path: '/pricing' },
  { label: 'About', path: '/about' },
  { label: 'Contact', path: '/contact' },
  { label: 'FAQ', path: '/faq' },
];

export default function PublicLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-950">
      <header className="sticky top-0 z-40 bg-white border-b border-gray-200 dark:bg-gray-900 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-indigo-600" />
            <span className="font-bold text-lg text-gray-900 dark:text-white">LMS</span>
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            {navLinks.map(link => (
              <Link
                key={link.path}
                to={link.path}
                className={`text-sm font-medium transition-colors ${
                  location.pathname === link.path
                    ? 'text-indigo-600'
                    : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <Link to="/signup" className="hidden sm:inline-flex text-sm font-medium text-indigo-600 hover:text-indigo-700">
              Sign Up
            </Link>
            <Link to="/login" className="btn-primary hidden sm:inline-flex">
              Login
            </Link>
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 md:hidden cursor-pointer"
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {mobileOpen && (
          <div className="md:hidden border-t border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
            <nav className="px-4 py-3 space-y-1">
              {navLinks.map(link => (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setMobileOpen(false)}
                  className={`block px-3 py-2 rounded-lg text-sm font-medium ${
                    location.pathname === link.path
                      ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400'
                      : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
              <Link
                to="/signup"
                onClick={() => setMobileOpen(false)}
                className="block px-3 py-2 rounded-lg text-sm font-medium text-indigo-600 hover:bg-gray-100 dark:hover:bg-gray-800 mt-2"
              >
                Sign Up
              </Link>
              <Link
                to="/login"
                onClick={() => setMobileOpen(false)}
                className="block px-3 py-2 rounded-lg text-sm font-medium bg-indigo-600 text-white text-center mt-1"
              >
                Login
              </Link>
            </nav>
          </div>
        )}
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="bg-gray-900 text-gray-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <BookOpen className="w-5 h-5 text-indigo-400" />
                <span className="font-bold text-white">LMS</span>
              </div>
              <p className="text-sm">A modern learning management system for courses, live classes, and test series.</p>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white mb-3">Quick Links</h4>
              <ul className="space-y-2 text-sm">
                {navLinks.map(link => (
                  <li key={link.path}>
                    <Link to={link.path} className="hover:text-white transition-colors">{link.label}</Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white mb-3">Support</h4>
              <ul className="space-y-2 text-sm">
                <li><Link to="/faq" className="hover:text-white transition-colors">FAQ</Link></li>
                <li><Link to="/contact" className="hover:text-white transition-colors">Contact Us</Link></li>
                <li><Link to="/pricing" className="hover:text-white transition-colors">Pricing</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white mb-3">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li><Link to="/terms" className="hover:text-white transition-colors">Terms &amp; Conditions</Link></li>
                <li><Link to="/refunds" className="hover:text-white transition-colors">Refunds &amp; Cancellations</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white mb-3">Contact</h4>
              <ul className="space-y-2 text-sm">
                <li>info@lms.edu</li>
                <li>+1 (555) 123-4567</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-xs">
            &copy; {new Date().getFullYear()} LMS Platform. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
