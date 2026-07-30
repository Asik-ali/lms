import { UserCircle, Mail, Shield } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function ProfilePage() {
  const { user } = useAuth();
  const role = user?.role ? `${user.role.charAt(0).toUpperCase()}${user.role.slice(1)}` : 'User';

  return (
    <div className="max-w-3xl space-y-6">
      <section className="bg-white border border-gray-200 rounded-xl p-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-indigo-600 flex items-center justify-center">
            <UserCircle className="w-12 h-12 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">{user?.name || user?.username || 'User'}</h2>
            <p className="text-sm text-gray-500">Your account information</p>
          </div>
        </div>
      </section>

      <section className="bg-white border border-gray-200 rounded-xl divide-y divide-gray-100">
        <div className="flex items-center gap-3 p-5">
          <Mail className="w-5 h-5 text-gray-400" />
          <div>
            <p className="text-xs text-gray-500">Email</p>
            <p className="text-sm font-medium text-gray-800">{user?.email || 'Not available'}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 p-5">
          <Shield className="w-5 h-5 text-gray-400" />
          <div>
            <p className="text-xs text-gray-500">Role</p>
            <p className="text-sm font-medium text-gray-800">{role}</p>
          </div>
        </div>
      </section>
    </div>
  );
}
