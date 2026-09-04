import { useState, useEffect } from 'react';
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

  useEffect(() => {
    const u = searchParams.get('username');
    const p = searchParams.get('password');
    if (u && p) handleLoginDirect(u, p);
  }, []);

  const handleLoginDirect = async (user, pass) => {
    try {
      const u = await login(user, pass);
      if (u.role === 'student') navigate('/student');
      else navigate('/admin');
    } catch {
      setError('Invalid username or password');
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    if (!username || !password) { setError('Please enter username and password'); return; }
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
          <div className="w-20 h-20 rounded-2xl bg-surface border border-navy-600/40 flex items-center justify-center mx-auto mb-5 shadow-lg shadow-[#091E42]/40">
            <img src={logo} alt="EXAMSTICK" className="w-14 h-14 object-contain" />
          </div>
          <h1 className="text-3xl font-bold text-navy-100">EXAMSTICK</h1>
          <p className="text-muted mt-2">Sign in to your account</p>
        </div>

        <div className="bg-surface rounded-2xl border border-navy-700 p-8 shadow-xl shadow-[#091E42]/40">
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

            <button type="submit" className="w-full bg-gold-500 text-[#071A3D] dark:text-navy-900 py-2.5 rounded-lg font-semibold hover:bg-gold-300 transition-all duration-200 cursor-pointer shadow-lg shadow-gold-500/20">
              Sign In
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
