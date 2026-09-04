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
    <div className="min-h-screen bg-gradient-to-br from-navy-600 via-purple-600 to-pink-500 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-white/20 dark:bg-gray-900/30 backdrop-blur flex items-center justify-center mx-auto mb-4 overflow-hidden">
            <img src={logo} alt="EXAMSTICK" className="w-12 h-12 object-contain" />
          </div>
          <h1 className="text-3xl font-bold text-white">EXAMSTICK</h1>
          <p className="text-navy-200 mt-2">Sign in to your account</p>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-8">
          <form onSubmit={handleLogin} className="space-y-5">
            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Username or email</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
                <input type="text" value={username} onChange={e => setUsername(e.target.value)} placeholder="Enter username or email" className="input-field pl-10" autoFocus />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
                <input type={showPw ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter password" className="input-field pl-10 pr-10" />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400">
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button type="submit" className="w-full bg-navy-600 text-white py-2.5 rounded-lg font-medium hover:bg-navy-700 transition-colors cursor-pointer">
              Sign In
            </button>
          </form>

         

          <div className="mt-6 pt-5 border-t border-gray-100 dark:border-gray-800 text-center text-sm text-gray-500 dark:text-gray-400">
            New to EXAMSTICK?{' '}
            <Link to="/signup" className="font-medium text-navy-600 hover:text-navy-700">
              Create an account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
