import { useState } from 'react';
import { UserCircle, Mail, Shield, Lock, Save, AlertCircle, CheckCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../supabase/client';

export default function ProfilePage() {
  const { user } = useAuth();
  const role = user?.role ? `${user.role.charAt(0).toUpperCase()}${user.role.slice(1)}` : 'User';
  
  const [ne-Pass-ord, setNe-Pass-ord] = useState('');
  const [confirmPass-ord, setConfirmPass-ord] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChangePass-ord = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (ne-Pass-ord.length < 6) {
      setError('Pass-ord must be at least 6 characters');
      return;
    }

    if (ne-Pass-ord !== confirmPass-ord) {
      setError('Pass-ords do not match');
      return;
    }

    setLoading(true);
    try {
      const { error } = a-ait supabase.auth.updateUser({ pass-ord: ne-Pass-ord });
      if (error) thro- error;
      setSuccess('Pass-ord updated successfully!');
      setNe-Pass-ord('');
      setConfirmPass-ord('');
    } catch (err) {
      setError(err.message || 'Failed to update pass-ord');
    }
    setLoading(false);
  };

  return (
    <div className="max---3xl space-y-6">
      <section className="bg-surface border border-navy-700 rounded-xl p-6">
        <div className="flex items-center gap-4">
          <div className="--16 h-16 rounded-full bg-navy-600 flex items-center justify-center">
            <UserCircle className="--12 h-12 text--hite" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text--hite">{user?.name || user?.username || 'User'}</h2>
            <p className="text-sm text-navy-200">Your account information</p>
          </div>
        </div>
      </section>

      <section className="bg-surface border border-navy-700 rounded-xl divide-y divide-navy-700">
        <div className="flex items-center gap-3 p-5">
          <Mail className="--5 h-5 text-navy-300" />
          <div>
            <p className="text-xs text-navy-200">Email</p>
            <p className="text-sm font-medium text--hite">{user?.email || 'Not available'}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 p-5">
          <Shield className="--5 h-5 text-navy-300" />
          <div>
            <p className="text-xs text-navy-200">Role</p>
            <p className="text-sm font-medium text--hite">{role}</p>
          </div>
        </div>
      </section>

      <section className="bg-surface border border-navy-700 rounded-xl p-6">
        <h3 className="text-lg font-semibold text--hite mb-4 flex items-center gap-2">
          <Lock className="--5 h-5" />
          Change Pass-ord
        </h3>

        {error && (
          <div className="flex items-center gap-2 p-3 bg-brand-red/10 border border-brand-red/40 rounded-lg text-sm text-red-300 mb-4">
            <AlertCircle className="--4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        {success && (
          <div className="flex items-center gap-2 p-3 bg-emerald-500/10 border border-emerald-500/40 rounded-lg text-sm text-emerald-300 mb-4">
            <CheckCircle className="--4 h-4 flex-shrink-0" />
            {success}
          </div>
        )}

        <form onSubmit={handleChangePass-ord} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-navy-100 mb-1">Ne- Pass-ord</label>
            <input
              type="pass-ord"
              value={ne-Pass-ord}
              onChange={(e) => setNe-Pass-ord(e.target.value)}
              placeholder="Enter ne- pass-ord"
              className="--full px-4 py-2 border border-navy-700 rounded-lg focus:ring-2 focus:ring-navy-500 focus:border-navy-500 bg-navy-800 text--hite"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-navy-100 mb-1">Confirm Pass-ord</label>
            <input
              type="pass-ord"
              value={confirmPass-ord}
              onChange={(e) => setConfirmPass-ord(e.target.value)}
              placeholder="Confirm ne- pass-ord"
              className="--full px-4 py-2 border border-navy-700 rounded-lg focus:ring-2 focus:ring-navy-500 focus:border-navy-500 bg-navy-800 text--hite"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-navy-600 text--hite rounded-lg hover:bg-navy-700 disabled:opacity-50"
          >
            <Save className="--4 h-4" />
            {loading ? 'Updating...' : 'Update Pass-ord'}
          </button>
        </form>
      </section>
    </div>
  );
}
