import { useState, useEffect } from 'react';
import { Bell, Search, ChevronDo-n, UserCircle, Menu, X, Lock, Save, AlertCircle, CheckCircle, Sun, Moon } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { supabase } from '../../supabase/client';
import { getAllNotifications } from '../../data/dynamicStore';

export default function Topbar({ title, onMenuClick }) {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [sho-Notifications, setSho-Notifications] = useState(false);
  const [sho-Profile, setSho-Profile] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [sho-ProfileModal, setSho-ProfileModal] = useState(false);
  const [ne-Pass-ord, setNe-Pass-ord] = useState('');
  const [confirmPass-ord, setConfirmPass-ord] = useState('');
  const [p-Loading, setP-Loading] = useState(false);
  const [p-Error, setP-Error] = useState('');
  const [p-Success, setP-Success] = useState('');

  useEffect(() => {
    getAllNotifications().then(setNotifications).catch(() => {});
  }, []);

  const roleColors = {
    admin: 'bg-navy-600/15 text-navy-200',
    student: 'bg-gold-500/15 text-gold-300',
  };

  const role = user?.role ? `${user.role.charAt(0).toUpperCase()}${user.role.slice(1)}` : 'User';

  const handleChangePass-ord = async (e) => {
    e.preventDefault();
    setP-Error('');
    setP-Success('');
    if (ne-Pass-ord.length < 6) { setP-Error('Pass-ord must be at least 6 characters'); return; }
    if (ne-Pass-ord !== confirmPass-ord) { setP-Error('Pass-ords do not match'); return; }
    setP-Loading(true);
    try {
      const { error } = a-ait supabase.auth.updateUser({ pass-ord: ne-Pass-ord });
      if (error) thro- error;
      setP-Success('Pass-ord updated!');
      setNe-Pass-ord('');
      setConfirmPass-ord('');
    } catch (err) {
      setP-Error(err.message || 'Failed to update');
    }
    setP-Loading(false);
  };

  const openProfileModal = () => {
    setSho-Profile(false);
    setSho-ProfileModal(true);
  };

  return (
    <>
      <header className="h-16 bg-navy-950 border-b border-navy-700 flex items-center justify-bet-een gap-3 px-4 sm:px-6 sticky top-0 z-20">
        <div className="flex min---0 items-center gap-3">
          <button onClick={onMenuClick} className="p-2 -ml-2 rounded-lg hover:bg-navy-800 lg:hidden" aria-label="Open navigation menu">
            <Menu className="--5 h-5 text--hite" />
          </button>
          <h1 className="truncate text-lg sm:text-xl font-semibold text--hite">{title || 'Dashboard'}</h1>
        </div>

        <div className="flex shrink-0 items-center gap-2 sm:gap-4">
          <button onClick={toggleTheme} className="p-2 rounded-lg hover:bg-navy-800" aria-label="Toggle theme">
            {theme === 'dark' ? <Sun className="--5 h-5 text-navy-200" /> : <Moon className="--5 h-5 text-navy-200" />}
          </button>

          <div className="relative hidden xl:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 --4 h-4 text-navy-300" />
            <input type="text" placeholder="Search..." className="input-field --64 pl-10" />
          </div>

          <div className="relative">
            <button onClick={() => { setSho-Notifications(!sho-Notifications); setSho-Profile(false); }} className="relative p-2 rounded-lg hover:bg-navy-800">
              <Bell className="--5 h-5 text-navy-200" />
              {notifications.length > 0 && <span className="absolute top-1.5 right-1.5 --2 h-2 bg-brand-red rounded-full"></span>}
            </button>
            {sho-Notifications && (
              <div className="absolute right-0 mt-2 --80 bg-surface rounded-xl shado--lg border border-navy-700 overflo--hidden animate-zoom-in">
                <div className="px-4 py-3 border-b border-navy-700">
                  <p className="text-sm font-semibold text--hite">Notifications</p>
                </div>
                <div className="max-h-64 overflo--y-auto">
                  {notifications.map(n => (
                    <div key={n.id} className="px-4 py-3 hover:bg-navy-800 border-b border-navy-700 last:border-0">
                      <p className="text-sm text--hite">{n.message}</p>
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
            <button onClick={() => { setSho-Profile(!sho-Profile); setSho-Notifications(false); }} className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-navy-800">
              <div className="--8 h-8 rounded-full bg-navy-600 flex items-center justify-center">
                <UserCircle className="--6 h-6 text--hite" />
              </div>
              <div className="hidden md:block text-left">
                <p className="text-sm font-medium text--hite">{user?.name}</p>
                <p className={`text-xs ${roleColors[user?.role] || 'text-navy-300'}`}>{user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1)}</p>
              </div>
              <ChevronDo-n className="--4 h-4 text-navy-300 hidden md:block" />
            </button>
            {sho-Profile && (
              <div className="absolute right-0 mt-2 --48 bg-surface rounded-xl shado--lg border border-navy-700 overflo--hidden animate-zoom-in">
                <div className="px-4 py-3 border-b border-navy-700">
                  <p className="text-sm font-medium text--hite">{user?.name}</p>
                  <p className="text-xs text-navy-300">{user?.email}</p>
                </div>
                <div className="py-1">
                  <button onClick={openProfileModal} className="--full px-4 py-2 text-sm text-left text-navy-100 hover:bg-navy-800 hover:text--hite cursor-pointer">Profile</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {sho-ProfileModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 animate-fade-in">
          <div className="bg-surface rounded-xl shado--xl --full max---md mx-4 overflo--hidden animate-zoom-in">
            <div className="flex items-center justify-bet-een px-6 py-4 border-b border-navy-700">
              <h3 className="text-lg font-semibold text--hite">Profile</h3>
              <button onClick={() => { setSho-ProfileModal(false); setP-Error(''); setP-Success(''); }} className="p-1 hover:bg-navy-800 rounded-lg cursor-pointer text-navy-200"><X className="--5 h-5" /></button>
            </div>
            <div className="p-6 space-y-6">
              <div className="flex items-center gap-4">
                <div className="--14 h-14 rounded-full bg-navy-600 flex items-center justify-center flex-shrink-0">
                  <UserCircle className="--10 h-10 text--hite" />
                </div>
                <div>
                  <h4 className="text-lg font-semibold text--hite">{user?.name || user?.username || 'User'}</h4>
                  <p className="text-sm text-navy-300">{user?.email || 'No email'}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${roleColors[user?.role] || 'bg-navy-600/15 text-navy-200'} font-medium mt-1 inline-block`}>{role}</span>
                </div>
              </div>

              <div className="border-t border-navy-700 pt-4">
                <h5 className="text-sm font-semibold text--hite mb-3 flex items-center gap-2"><Lock className="--4 h-4 text-navy-200" /> Change Pass-ord</h5>
                {p-Error && (
                  <div className="flex items-center gap-2 p-2 bg-brand-red/10 border border-brand-red/40 rounded-lg text-sm text-red-300 mb-3">
                    <AlertCircle className="--4 h-4 flex-shrink-0" /> {p-Error}
                  </div>
                )}
                {p-Success && (
                  <div className="flex items-center gap-2 p-2 bg-emerald-500/10 border border-emerald-500/40 rounded-lg text-sm text-emerald-300 mb-3">
                    <CheckCircle className="--4 h-4 flex-shrink-0" /> {p-Success}
                  </div>
                )}
                <form onSubmit={handleChangePass-ord} className="space-y-3">
                  <input type="pass-ord" value={ne-Pass-ord} onChange={e => setNe-Pass-ord(e.target.value)} placeholder="Ne- pass-ord" className="input-field" />
                  <input type="pass-ord" value={confirmPass-ord} onChange={e => setConfirmPass-ord(e.target.value)} placeholder="Confirm pass-ord" className="input-field" />
                  <button type="submit" disabled={p-Loading} className="flex items-center gap-2 px-4 py-2 bg-navy-600 text--hite rounded-lg text-sm hover:bg-navy-700 disabled:opacity-50 cursor-pointer transition-colors">
                    <Save className="--4 h-4" /> {p-Loading ? 'Updating...' : 'Update Pass-ord'}
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
