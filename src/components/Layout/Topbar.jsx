import { useState, useEffect } from 'react';
import { Bell, Search, ChevronDown, UserCircle, Menu, X, Lock, Save, AlertCircle, CheckCircle, Sun, Moon, Users, BookOpen, PenTool, Megaphone } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { supabase } from '../../supabase/client';
import { useNavigate } from 'react-router-dom';
import { getAllNotifications, getAllStudents, getAllCourses, getAllTestSeries, getAllAnnouncements } from '../../data/dynamicStore';

export default function Topbar({ title, onMenuClick }) {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwLoading, setPwLoading] = useState(false);
  const [pwError, setPwError] = useState('');
  const [pwSuccess, setPwSuccess] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchData, setSearchData] = useState({ students: [], courses: [], series: [], announcements: [] });

  useEffect(() => {
    getAllNotifications().then(setNotifications).catch(() => {});
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const [students, courses, series, announcements] = await Promise.all([
          getAllStudents(), getAllCourses(), getAllTestSeries(), getAllAnnouncements(),
        ]);
        setSearchData({
          students: students || [],
          courses: courses || [],
          series: series || [],
          announcements: announcements || [],
        });
      } catch {
        // search data unavailable
      }
    })();
  }, []);

  const isAdmin = user?.role === 'admin' || user?.role === 'instructor';

  const q = searchQuery.trim().toLowerCase();
  const queryResults = q.length < 1 ? [] : [
    { label: 'Students', icon: Users, items: searchData.students.filter(s => (s.name || '').toLowerCase().includes(q) || (s.email || '').toLowerCase().includes(q)).slice(0, 5).map(s => ({ key: `s${s.id}`, title: s.name, subtitle: s.email, path: '/admin/students' })) },
    { label: 'Courses', icon: BookOpen, items: searchData.courses.filter(c => (c.title || '').toLowerCase().includes(q)).slice(0, 5).map(c => ({ key: `c${c.id}`, title: c.title, subtitle: c.status, path: '/admin/courses' })) },
    { label: 'Test Series', icon: PenTool, items: searchData.series.filter(s => (s.name || '').toLowerCase().includes(q)).slice(0, 5).map(s => ({ key: `t${s.id}`, title: s.name, subtitle: s.description || '', path: '/admin/exams/questions' })) },
    { label: 'Announcements', icon: Megaphone, items: searchData.announcements.filter(a => (a.title || '').toLowerCase().includes(q)).slice(0, 5).map(a => ({ key: `a${a.id}`, title: a.title, subtitle: a.target || '', path: '/admin/announcements' })) },
  ].filter(g => g.items.length > 0);

  const goToSearchResult = (item) => {
    navigate(item.path);
    setSearchQuery('');
    setSearchOpen(false);
    setShowNotifications(false);
    setShowProfile(false);
  };

  const roleColors = {
    admin: 'bg-navy-600/15 text-navy-600 dark:text-navy-200',
    student: 'bg-gold-500/15 text-gold-700 dark:text-gold-300',
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
      <header className="h-16 bg-navy-950 border-b border-navy-700 flex items-center justify-between gap-3 px-4 sm:px-6 sticky top-0 z-20">
        <div className="flex min-w-0 items-center gap-3">
          <button onClick={onMenuClick} className="p-2 -ml-2 rounded-lg hover:bg-navy-800 lg:hidden" aria-label="Open navigation menu">
            <Menu className="w-5 h-5 text-navy-100" />
          </button>
          <h1 className="truncate text-lg sm:text-xl font-semibold text-navy-100">{title || 'Dashboard'}</h1>
        </div>

        <div className="flex shrink-0 items-center gap-2 sm:gap-4">
          <button onClick={toggleTheme} className="p-2 rounded-lg hover:bg-navy-800" aria-label="Toggle theme">
            {theme === 'dark' ? <Sun className="w-5 h-5 text-navy-200" /> : <Moon className="w-5 h-5 text-navy-200" />}
          </button>

          {isAdmin && (
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-navy-300 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => { setSearchQuery(e.target.value); setSearchOpen(true); }}
                onFocus={() => setSearchOpen(true)}
                placeholder="Search students, courses..."
                className="pl-10 pr-3 py-2 w-48 xl:w-72 bg-navy-950 border border-navy-700 rounded-lg text-sm text-navy-100 placeholder:text-navy-300 focus:outline-none focus:ring-2 focus:ring-navy-600 focus:border-navy-600"
              />
              {searchOpen && (
                <>
                  <div className="fixed inset-0 z-10 cursor-default" onClick={() => setSearchOpen(false)} />
                  <div className="absolute right-0 mt-2 w-[22rem] bg-surface rounded-xl shadow-lg border border-navy-700 overflow-hidden animate-zoom-in z-20">
                    <div className="px-4 py-3 border-b border-navy-700">
                      <p className="text-sm font-semibold text-navy-100">Search Results</p>
                    </div>
                    {queryResults.length === 0 ? (
                      <p className="px-4 py-6 text-sm text-navy-300 text-center">
                        {q.length ? `No results for "${searchQuery}"` : 'Start typing to search'}
                      </p>
                    ) : (
                      <div className="max-h-80 overflow-y-auto">
                        {queryResults.map(group => {
                          const GroupIcon = group.icon;
                          return (
                            <div key={group.label} className="pt-1">
                              <p className="px-4 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-navy-300 bg-navy-50/60 dark:bg-navy-800/60 sticky top-0 flex items-center gap-1.5">
                                <GroupIcon className="w-3 h-3" /> {group.label}
                              </p>
                              {group.items.map(item => (
                                <button key={item.key} onClick={() => goToSearchResult(item)} className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-navy-700/60">
                                  <GroupIcon className="w-4 h-4 text-navy-500 shrink-0" />
                                  <span className="min-w-0 flex-1">
                                    <span className="block text-sm text-navy-100 truncate">{item.title}</span>
                                    <span className="block text-xs text-navy-300 truncate">{item.subtitle}</span>
                                  </span>
                                </button>
                              ))}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          )}

          <div className="relative">
            <button onClick={() => { setShowNotifications(!showNotifications); setShowProfile(false); setSearchOpen(false); }} className="relative p-2 rounded-lg hover:bg-navy-800">
              <Bell className="w-5 h-5 text-navy-200" />
              {notifications.length > 0 && <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-brand-red rounded-full"></span>}
            </button>
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-surface rounded-xl shadow-lg border border-navy-700 overflow-hidden animate-zoom-in">
                <div className="px-4 py-3 border-b border-navy-700">
                  <p className="text-sm font-semibold text-navy-100">Notifications</p>
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {notifications.map(n => (
                    <div key={n.id} className="px-4 py-3 hover:bg-navy-800 border-b border-navy-700 last:border-0">
                      <p className="text-sm text-navy-100">{n.message}</p>
                      <p className="text-xs text-navy-300 mt-1">{n.time}</p>
                    </div>
                  ))}
                  {notifications.length === 0 && (
                    <p className="px-4 py-6 text-sm text-navy-300 text-center">No notifications</p>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="relative">
            <button onClick={() => { setShowProfile(!showProfile); setShowNotifications(false); setSearchOpen(false); }} className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-navy-800">
              <div className="w-8 h-8 rounded-full bg-navy-600 flex items-center justify-center">
                <UserCircle className="w-6 h-6 text-white" />
              </div>
              <div className="hidden md:block text-left">
                <p className="text-sm font-medium text-navy-100">{user?.name}</p>
                <p className={`text-xs ${roleColors[user?.role] || 'text-navy-300'}`}>{user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1)}</p>
              </div>
              <ChevronDown className="w-4 h-4 text-navy-300 hidden md:block" />
            </button>
            {showProfile && (
              <div className="absolute right-0 mt-2 w-48 bg-surface rounded-xl shadow-lg border border-navy-700 overflow-hidden animate-zoom-in">
                <div className="px-4 py-3 border-b border-navy-700">
                  <p className="text-sm font-medium text-navy-100">{user?.name}</p>
                  <p className="text-xs text-navy-300">{user?.email}</p>
                </div>
                <div className="py-1">
                  <button onClick={openProfileModal} className="w-full px-4 py-2 text-sm text-left text-navy-100 hover:bg-navy-700/60 hover:text-navy-600 dark:hover:bg-navy-800 dark:hover:text-white cursor-pointer">Profile</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {showProfileModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 animate-fade-in">
          <div className="bg-surface rounded-xl shadow-xl w-full max-w-md mx-4 overflow-hidden animate-zoom-in">
            <div className="flex items-center justify-between px-6 py-4 border-b border-navy-700">
              <h3 className="text-lg font-semibold text-navy-100">Profile</h3>
              <button onClick={() => { setShowProfileModal(false); setPwError(''); setPwSuccess(''); }} className="p-1 hover:bg-navy-800 rounded-lg cursor-pointer text-navy-200"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-navy-600 flex items-center justify-center flex-shrink-0">
                  <UserCircle className="w-10 h-10 text-white" />
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-navy-100">{user?.name || user?.username || 'User'}</h4>
                  <p className="text-sm text-navy-300">{user?.email || 'No email'}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${roleColors[user?.role] || 'bg-navy-600/15 text-navy-600 dark:text-navy-200'} font-medium mt-1 inline-block`}>{role}</span>
                </div>
              </div>

              <div className="border-t border-navy-700 pt-4">
                <h5 className="text-sm font-semibold text-navy-100 mb-3 flex items-center gap-2"><Lock className="w-4 h-4 text-navy-200" /> Change Password</h5>
                {pwError && (
                  <div className="flex items-center gap-2 p-2 bg-brand-red/10 border border-brand-red/40 rounded-lg text-sm text-red-700 dark:text-red-300 mb-3">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" /> {pwError}
                  </div>
                )}
                {pwSuccess && (
                  <div className="flex items-center gap-2 p-2 bg-emerald-500/10 border border-emerald-500/40 rounded-lg text-sm text-emerald-700 dark:text-emerald-300 mb-3">
                    <CheckCircle className="w-4 h-4 flex-shrink-0" /> {pwSuccess}
                  </div>
                )}
                <form onSubmit={handleChangePassword} className="space-y-3">
                  <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="New password" className="input-field" />
                  <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Confirm password" className="input-field" />
                  <button type="submit" disabled={pwLoading} className="flex items-center gap-2 px-4 py-2 bg-navy-600 text-white rounded-lg text-sm hover:bg-navy-700 dark:hover:bg-[#0D4FB5] disabled:opacity-50 cursor-pointer transition-colors">
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
