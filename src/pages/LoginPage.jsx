import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { User, Lock, AlertCircle, Eye, EyeOff } from 'lucide-react';
import logo from '../assets/image.png';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [username, setUsername] = useState(searchParams.get('username') || '');
  const [password, setPassword] = useState(searchParams.get('password') || '');
  const [error, setError] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const autoLoginStarted = useRef(false);

  const handleLoginDirect = useCallback(async (user, pass) => {
    setSubmitting(true);
    try {
      const u = await login(user, pass);
      if (u.role === 'student') navigate('/student');
      else navigate('/admin');
    } catch {
      setError(navigator.onLine ? 'Unable to sign in. Check your credentials and try again.' : 'No internet. Please turn on mobile data or Wi-Fi.');
    } finally {
      setSubmitting(false);
    }
  }, [login, navigate]);

  useEffect(() => {
    if (autoLoginStarted.current) return;
    const u = searchParams.get('username');
    const p = searchParams.get('password');
    if (!u || !p) return;
    autoLoginStarted.current = true;
    const cleanUrl = new URL(window.location.href);
    cleanUrl.searchParams.delete('password');
    window.history.replaceState(window.history.state, '', cleanUrl.pathname + cleanUrl.search + cleanUrl.hash);
    handleLoginDirect(u, p);
  }, [searchParams, handleLoginDirect]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    if (submitting) return;
    if (!username.trim() || !password) { setError('Please enter username and password'); return; }
    await handleLoginDirect(username, password);
  };

  return (
    <div className="min-h-screen bg-navy-950 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-navy-600/20 blur-3xl" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 rounded-full bg-gold-500/10 blur-3xl" />
      </div>
      <div className="w-full max-w-md relative animate-fade-up">
        <div className="text-center mb-8">
          <div className="w-24 h-24 rounded-full bg-[#0B1424] border border-gold-500/40 flex items-center justify-center mx-auto mb-5 shadow-lg shadow-gold-500/10 overflow-hidden">
            <img src={logo} alt="EXAMSTICK" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-navy-100">EXAM<span className="text-gold-700 dark:text-gold-400">STICK</span></h1>
          <p className="text-muted mt-2">Sign in to your account</p>
        </div>

        <div className="bg-surface rounded-2xl border border-navy-700 border-t-2 border-t-gold-500 p-5 sm:p-8 shadow-xl shadow-black/5 dark:shadow-black/20">
          <form onSubmit={handleLogin} className="space-y-5">
            {error && (
              <div className="flex items-center gap-2 p-3 bg-brand-red/10 border border-brand-red/40 rounded-lg text-sm text-red-700 dark:text-red-300">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-navy-100 mb-1.5">Username or email</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-navy-300" />
                <input type="text" value={username} onChange={e => setUsername(e.target.value)} placeholder="Enter username or email" className="input-field pl-10" autoFocus />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-navy-100 mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-navy-300" />
                <input type={showPw ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter password" className="input-field pl-10 pr-10" />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-navy-300 hover:text-navy-100">
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button disabled={submitting} type="submit" className="w-full bg-gold-500 text-[#071A3D] dark:text-navy-900 py-2.5 rounded-lg font-semibold hover:bg-gold-300 transition-all duration-200 cursor-pointer shadow-lg shadow-gold-500/20 disabled:opacity-60">
              {submitting ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-navy-700 text-center text-sm text-navy-200">
            New to EXAMSTICK?{' '}
            <Link to="/signup" className="font-medium text-gold-600 dark:text-gold-400 hover:text-gold-500 dark:hover:text-gold-300">
              Create an account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
