import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Bell, Search, ChevronDown, UserCircle, Menu } from 'lucide-react';
import { getAllNotifications } from '../../data/dynamicStore';

export default function Topbar({ title, onMenuClick }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    getAllNotifications().then(setNotifications).catch(() => {});
  }, []);

  const roleColors = {
    admin: 'bg-indigo-100 text-indigo-800',
    student: 'bg-emerald-100 text-emerald-800',
  };

  const goTo = (section) => {
    const destinations = {
      admin: {
        profile: '/admin/profile',
        settings: '/admin/settings/general',
      },
      student: {
        profile: '/student/profile',
        settings: '/student/settings',
      },
    };

    const destination = destinations[user?.role]?.[section];
    if (destination) {
      setShowProfile(false);
      navigate(destination);
    }
  };

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between gap-3 px-4 sm:px-6 sticky top-0 z-20">
      <div className="flex min-w-0 items-center gap-3">
        <button onClick={onMenuClick} className="p-2 -ml-2 rounded-lg hover:bg-gray-100 lg:hidden" aria-label="Open navigation menu">
          <Menu className="w-5 h-5 text-gray-600" />
        </button>
        <h1 className="truncate text-lg sm:text-xl font-semibold text-gray-900">{title || 'Dashboard'}</h1>
      </div>

      <div className="flex shrink-0 items-center gap-2 sm:gap-4">
        <div className="relative hidden xl:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" placeholder="Search..." className="input-field w-64 pl-10" />
        </div>

        <div className="relative">
          <button onClick={() => { setShowNotifications(!showNotifications); setShowProfile(false); }} className="relative p-2 rounded-lg hover:bg-gray-100">
            <Bell className="w-5 h-5 text-gray-600" />
            {notifications.length > 0 && <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>}
          </button>
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-200">
                <p className="text-sm font-semibold">Notifications</p>
              </div>
              <div className="max-h-64 overflow-y-auto">
                {notifications.map(n => (
                  <div key={n.id} className="px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-0">
                    <p className="text-sm text-gray-700">{n.message}</p>
                    <p className="text-xs text-gray-400 mt-1">{n.time}</p>
                  </div>
                ))}
                {notifications.length === 0 && (
                  <p className="px-4 py-6 text-sm text-gray-400 text-center">No notifications</p>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="relative">
          <button onClick={() => { setShowProfile(!showProfile); setShowNotifications(false); }} className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-gray-100">
            <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center">
              <UserCircle className="w-6 h-6 text-white" />
            </div>
            <div className="hidden md:block text-left">
              <p className="text-sm font-medium text-gray-700">{user?.name}</p>
              <p className={`text-xs ${roleColors[user?.role] || 'text-gray-500'}`}>{user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1)}</p>
            </div>
            <ChevronDown className="w-4 h-4 text-gray-400 hidden md:block" />
          </button>
          {showProfile && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-200">
                <p className="text-sm font-medium">{user?.name}</p>
                <p className="text-xs text-gray-500">{user?.email}</p>
              </div>
              <div className="py-1">
                <button onClick={() => goTo('profile')} className="w-full px-4 py-2 text-sm text-left text-gray-700 hover:bg-gray-50">Profile</button>
                <button onClick={() => goTo('settings')} className="w-full px-4 py-2 text-sm text-left text-gray-700 hover:bg-gray-50">Settings</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
