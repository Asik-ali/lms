import { useState, useEffect } from 'react';
import { Bell, Search, ChevronDown, UserCircle, Menu, X, Lock, Save, AlertCircle, CheckCircle, Sun, Moon } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { supabase } from '../../supabase/client';
import { getAllNotifications } from '../../data/dynamicStore';

export default function Topbar({ title, onMenuClick }) {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwLoading, setPwLoading] = useState(false);
  const [pwError, setPwError] = useState('');
  const [pwSuccess, setPwSuccess] = useState('');

  useEffect(() => {
    getAllNotifications().then(setNotifications).catch(() => {});
  }, []);

  const roleColors = {
    admin: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-500/15 dark:text-indigo-300',
    student: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300',
  };

  const role = user?.role ? `${user.role.charAt(0).toUpperCase()}${user.role.slice(1)}` : 'User';

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPwError('');
    setPwSuccess('');
    if (newPassword.length < 6) { setPwError('Password must be at least 6 characters'); return; }
    if (newPassword !== confirmPassword) { setPwError('Passwords do not match'); return; }
    setPwLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      setPwSuccess('Password updated!');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setPwError(err.message || 'Failed to update');
    }
    setPwLoading(false);
  };

  const openProfileModal = () => {
    setShowProfile(false);
    setShowProfileModal(true);
  };

  return (
    <>
      <header className="h-16 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between gap-3 px-4 sm:px-6 sticky top-0 z-20">
        <div className="flex min-w-0 items-center gap-3">
          <button onClick={onMenuClick} className="p-2 -ml-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 lg:hidden" aria-label="Open navigation menu">
            <Menu className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
          <h1 className="truncate text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100">{title || 'Dashboard'}</h1>
        </div>

        <div className="flex shrink-0 items-center gap-2 sm:gap-4">
          <button onClick={toggleTheme} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800" aria-label="Toggle theme">
            {theme === 'dark' ? <Sun className="w-5 h-5 text-gray-600 dark:text-gray-300" /> : <Moon className="w-5 h-5 text-gray-600 dark:text-gray-300" />}
          </button>

          <div className="relative hidden xl:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
            <input type="text" placeholder="Search..." className="input-field w-64 pl-10" />
          </div>

          <div className="relative">
            <button onClick={() => { setShowNotifications(!showNotifications); setShowProfile(false); }} className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
              <Bell className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              {notifications.length > 0 && <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>}
            </button>
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-gray-200 dark:border-gray-800 overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-800">
                  <p className="text-sm font-semibold">Notifications</p>
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {notifications.map(n => (
                    <div key={n.id} className="px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/60 border-b border-gray-100 dark:border-gray-800 last:border-0">
                      <p className="text-sm text-gray-700 dark:text-gray-300">{n.message}</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{n.time}</p>
                    </div>
                  ))}
                  {notifications.length === 0 && (
                    <p className="px-4 py-6 text-sm text-gray-400 dark:text-gray-500 text-center">No notifications</p>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="relative">
            <button onClick={() => { setShowProfile(!showProfile); setShowNotifications(false); }} className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
              <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center">
                <UserCircle className="w-6 h-6 text-white" />
              </div>
              <div className="hidden md:block text-left">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{user?.name}</p>
                <p className={`text-xs ${roleColors[user?.role] || 'text-gray-500 dark:text-gray-400'}`}>{user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1)}</p>
              </div>
              <ChevronDown className="w-4 h-4 text-gray-400 dark:text-gray-500 hidden md:block" />
            </button>
            {showProfile && (
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-gray-200 dark:border-gray-800 overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-800">
                  <p className="text-sm font-medium">{user?.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{user?.email}</p>
                </div>
                <div className="py-1">
                  <button onClick={openProfileModal} className="w-full px-4 py-2 text-sm text-left text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/60 cursor-pointer">Profile</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {showProfileModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-xl w-full max-w-md mx-4 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Profile</h3>
              <button onClick={() => { setShowProfileModal(false); setPwError(''); setPwSuccess(''); }} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg cursor-pointer"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-indigo-600 flex items-center justify-center flex-shrink-0">
                  <UserCircle className="w-10 h-10 text-white" />
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{user?.name || user?.username || 'User'}</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{user?.email || 'No email'}</p>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300 font-medium mt-1 inline-block">{role}</span>
                </div>
              </div>

              <div className="border-t border-gray-200 dark:border-gray-800 pt-4">
                <h5 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2"><Lock className="w-4 h-4" /> Change Password</h5>
                {pwError && (
                  <div className="flex items-center gap-2 p-2 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 mb-3">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" /> {pwError}
                  </div>
                )}
                {pwSuccess && (
                  <div className="flex items-center gap-2 p-2 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700 mb-3">
                    <CheckCircle className="w-4 h-4 flex-shrink-0" /> {pwSuccess}
                  </div>
                )}
                <form onSubmit={handleChangePassword} className="space-y-3">
                  <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="New password" className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-800 dark:text-gray-100" />
                  <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Confirm password" className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-800 dark:text-gray-100" />
                  <button type="submit" disabled={pwLoading} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 disabled:opacity-50 cursor-pointer">
                    <Save className="w-4 h-4" /> {pwLoading ? 'Updating...' : 'Update Password'}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
