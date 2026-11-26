import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { User, Lock, AlertCircle, Eye, EyeOff, BookOpen, ClipboardList, GraduationCap } from 'lucide-react';
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
    cleanUrl.searchParams.delete('username');
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
    <div className="auth-workspace">
      <section className="auth-introduction" aria-label="About EXAMSTICK">
        <div className="auth-wordmark"><img src={logo} alt="" /><span>EXAM<span>STICK</span></span></div>
        <div className="auth-introduction-content">
          <p className="auth-kicker">PREPARE WITH PURPOSE</p>
          <h2>A focused space for your next achievement.</h2>
          <p>Bring your courses, practice tests, and academy updates together. Build your preparation one step at a time.</p>
          <div className="auth-features">
            <div><BookOpen aria-hidden="true" /><span><strong>Structured learning</strong><small>Your enrolled courses, in one place.</small></span></div>
            <div><ClipboardList aria-hidden="true" /><span><strong>Purposeful practice</strong><small>Test series to support your preparation.</small></span></div>
            <div><GraduationCap aria-hidden="true" /><span><strong>Stay connected</strong><small>Academy updates and student support.</small></span></div>
          </div>
        </div>
        <p className="auth-brand-footer">EXAMSTICK · Your learning workspace</p>
      </section>
      <div className="auth-form-area">
      <div className="w-full max-w-md relative">
        <div className="auth-form-heading">
          <div className="auth-mobile-logo w-16 h-16 rounded-full bg-[#0B1424] border border-gold-500/40 items-center justify-center mb-5 overflow-hidden">
            <img src={logo} alt="EXAMSTICK" className="w-full h-full object-contain" />
          </div>
          <p className="learning-eyebrow">WELCOME TO EXAMSTICK</p>
          <h1 className="text-3xl font-bold tracking-tight text-navy-100">Sign in to your workspace</h1>
          <p className="text-muted mt-3">Continue your learning journey.</p>
        </div>

        <div className="auth-form-card">
          <form onSubmit={handleLogin} name="examstick-login" autoComplete="on" className="space-y-5">
            {error && (
              <div id="login-error" role="alert" className="flex items-center gap-2 p-3 bg-brand-red/10 border border-brand-red/40 rounded-lg text-sm text-red-700 dark:text-red-300">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}

            <div>
              <label htmlFor="login-username" className="block text-sm font-medium text-navy-100 mb-1.5">Username or email</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-navy-300" />
                <input id="login-username" name="username" type="text" autoComplete="username" autoCapitalize="none" spellCheck={false} aria-describedby={error ? 'login-error' : undefined} value={username} onChange={e => setUsername(e.target.value)} placeholder="Enter username or email" className="input-field pl-10" autoFocus />
              </div>
            </div>

            <div>
              <label htmlFor="login-password" className="block text-sm font-medium text-navy-100 mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-navy-300" />
                <input id="login-password" name="password" type={showPw ? 'text' : 'password'} autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter password" className="input-field pl-10 pr-12" />
                <button type="button" aria-label={showPw ? 'Hide password' : 'Show password'} aria-pressed={showPw} onClick={() => setShowPw(!showPw)} className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center justify-center w-11 h-11 rounded-lg text-navy-300 hover:text-navy-100">
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button disabled={submitting} type="submit" className="btn-primary w-full py-2.5 shadow-lg shadow-blue-700/15 disabled:opacity-60">
              {submitting ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-navy-700 text-center text-sm text-navy-200">
            <p className="mb-3"><Link to="/privacy-policy" className="underline">Privacy Policy</Link>{' · '}<Link to="/delete-account" className="underline">Delete account</Link></p>
            New to EXAMSTICK?{' '}
            <Link to="/signup" className="font-medium text-gold-600 dark:text-gold-400 hover:text-gold-500 dark:hover:text-gold-300">
              Create an account
            </Link>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}
