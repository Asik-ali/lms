import { Outlet } from 'react-router-dom';
import BackButton from '../common/BackButton';

export default function PublicLayout() {
  return <div className="min-h-screen bg-navy-950 text-navy-100">
    <div className="px-4 py-3 sm:px-6"><BackButton /></div>
    <Outlet />
  </div>;
}
