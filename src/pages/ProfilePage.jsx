import { useState } from 'react';
import { UserCircle, Mail, Shield, Lock, Save, AlertCircle, CheckCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../supabase/client';

export default function ProfilePage() {
  const { user } = useAuth();
  const role = user?.role ? `${user.role.charAt(0).toUpperCase()}${user.role.slice(1)}` : 'User';
  
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      setSuccess('Password updated successfully!');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setError(err.message || 'Failed to update password');
    }
    setLoading(false);
  };

  return (
    <div className="max-w-3xl space-y-6">
      <section className="bg-surface border border-navy-700 rounded-xl p-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-navy-600 flex items-center justify-center">
            <UserCircle className="w-12 h-12 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-white">{user?.name || user?.username || 'User'}</h2>
            <p className="text-sm text-navy-200">Your account information</p>
          </div>
        </div>
      </section>

      <section className="bg-surface border border-navy-700 rounded-xl divide-y divide-gray-100 dark:divide-gray-800">
        <div className="flex items-center gap-3 p-5">
          <Mail className="w-5 h-5 text-navy-300" />
          <div>
            <p className="text-xs text-navy-200">Email</p>
            <p className="text-sm font-medium text-white">{user?.email || 'Not available'}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 p-5">
          <Shield className="w-5 h-5 text-navy-300" />
          <div>
            <p className="text-xs text-navy-200">Role</p>
            <p className="text-sm font-medium text-white">{role}</p>
          </div>
        </div>
      </section>

      <section className="bg-surface border border-navy-700 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Lock className="w-5 h-5" />
          Change Password
        </h3>

        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 mb-4">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        {success && (
          <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700 mb-4">
            <CheckCircle className="w-4 h-4 flex-shrink-0" />
            {success}
          </div>
        )}

        <form onSubmit={handleChangePassword} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-navy-100 mb-1">New Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter new password"
              className="w-full px-4 py-2 border border-navy-700 rounded-lg focus:ring-2 focus:ring-navy-500 focus:border-navy-500 bg-navy-800 text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-navy-100 mb-1">Confirm Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
              className="w-full px-4 py-2 border border-navy-700 rounded-lg focus:ring-2 focus:ring-navy-500 focus:border-navy-500 bg-navy-800 text-white"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-navy-600 text-white rounded-lg hover:bg-navy-700 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {loading ? 'Updating...' : 'Update Password'}
          </button>
        </form>
      </section>
    </div>
  );
}
