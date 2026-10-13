import { ArrowLeft } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export default function BackButton() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { user } = useAuth();
  const home = user ? (['admin', 'instructor'].includes(user.role) ? '/admin' : '/student') : '/login';
  const fallback = pathname.startsWith('/student/courses/') ? '/student/courses'
    : pathname.startsWith('/student/test/') ? '/student/test-series'
    : home;
  const canGoBack = Number(window.history.state?.idx) > 0;
  const disabled = !canGoBack && pathname === fallback;

  return <button type="button" aria-label="Go back to previous page" disabled={disabled}
    onClick={() => canGoBack ? navigate(-1) : navigate(fallback, { replace: true })}
    className="btn-secondary inline-flex min-h-11 items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
    <ArrowLeft className="w-4 h-4" aria-hidden="true" /> Back
  </button>;
}
