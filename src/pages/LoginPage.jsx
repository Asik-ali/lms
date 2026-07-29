import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { BookOpen, User, Lock, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { findCredential, resolveUser } from '../data/credentialsStore';

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
    const cred = findCredential(user, pass);
    if (!cred) { setError('Invalid username or password'); return; }

    if (cred.studentId === null) {
      if (user === 'admin') {
        login({ role: 'admin', name: 'Admin User', email: 'admin@lms.com', id: 'admin' });
        navigate('/admin');
      } else {
        login({ role: 'instructor', name: 'Dr. Sarah Chen', email: 'sarah@lms.com', id: 'instructor' });
        navigate('/instructor');
      }
      return;
    }

    const student = await resolveUser(cred);
    if (!student) { setError('Student not found'); return; }

    login({ role: 'student', ...student, id: student.id });
    navigate('/student');
  };

  const handleLogin = (e) => {
    e.preventDefault();
    setError('');
    if (!username || !password) { setError('Please enter username and password'); return; }
    handleLoginDirect(username, password);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center mx-auto mb-4">
            <BookOpen className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white">LMS Portal</h1>
          <p className="text-indigo-200 mt-2">Sign in to your account</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <form onSubmit={handleLogin} className="space-y-5">
            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Username</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input type="text" value={username} onChange={e => setUsername(e.target.value)} placeholder="Enter username" className="input-field pl-10" autoFocus />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input type={showPw ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter password" className="input-field pl-10 pr-10" />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button type="submit" className="w-full bg-indigo-600 text-white py-2.5 rounded-lg font-medium hover:bg-indigo-700 transition-colors cursor-pointer">
              Sign In
            </button>
          </form>

          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <p className="text-xs font-medium text-gray-500 mb-2">Demo Credentials</p>
            <div className="space-y-1 text-xs text-gray-400">
              <p><span className="font-mono text-gray-600">admin</span> / <span className="font-mono text-gray-600">admin123</span> — Admin</p>
              <p><span className="font-mono text-gray-600">instructor</span> / <span className="font-mono text-gray-600">instructor123</span> — Instructor</p>
              <p><span className="font-mono text-gray-600">alice.johnson</span> / <span className="font-mono text-gray-600">student123</span> — Student</p>
              <p><span className="font-mono text-gray-600">bob.smith</span> / <span className="font-mono text-gray-600">student123</span> — Student</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
