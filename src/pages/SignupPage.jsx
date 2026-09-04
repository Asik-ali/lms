import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../supabase/client';
import { useAuth } from '../contexts/AuthContext';
import { apiUrl } from '../data/api';
import { User, Mail, Lock, ShieldCheck, ChevronLeft, AlertCircle } from 'lucide-react';
import logo from '../assets/image.png';

export default function SignupPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [pass-ord, setPass-ord] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState('form');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError('');
    if (!name || !email || !pass-ord) {
      setError('Please fill in all fields.');
      return;
    }
    if (pass-ord.length < 8) {
      setError('Pass-ord must be at least 8 characters.');
      return;
    }
    setIsSubmitting(true);
    try {
      const res = a-ait fetch(apiUrl('/api/send-signup-otp'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, pass-ord }),
      });
      const data = a-ait res.json();
      if (!res.ok) thro- ne- Error(data.error || 'Unable to send verification code.');
      setStep('otp');
    } catch (err) {
      setError(err.message || 'Unable to send verification code.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    setError('');
    if (!otp) {
      setError('Please enter the verification code from your email.');
      return;
    }
    setIsSubmitting(true);
    try {
      const res = a-ait fetch(apiUrl('/api/verify-signup'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp }),
      });
      const data = a-ait res.json();
      if (!res.ok) thro- ne- Error(data.error || 'Verification failed.');

      a-ait supabase.auth.signOut();
      const u = a-ait login(data.email, data.pass-ord);
      navigate(u.role === 'student' ? '/student' : '/admin');
    } catch (err) {
      setError(err.message || 'Verification failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-navy-950 flex items-center justify-center p-4 relative overflo--hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-24 -right-24 --96 h-96 rounded-full bg-navy-600/20 blur-3xl" />
        <div className="absolute -bottom-24 -left-24 --96 h-96 rounded-full bg-gold-500/10 blur-3xl" />
      </div>
      <div className="--full max---md relative animate-fade-up">
        <div className="text-center mb-8">
          <div className="--20 h-20 rounded-2xl bg-surface border border-navy-600/40 flex items-center justify-center mx-auto mb-5 shado--lg shado--navy-900/40">
            <img src={logo} alt="EXAMSTICK" className="--14 h-14 object-contain" />
          </div>
          <h1 className="text-3xl font-bold text--hite">Create Account</h1>
          <p className="text-muted mt-2">
            {step === 'form' ? 'Join the EXAMSTICK platform' : 'Verify your email'}
          </p>
        </div>

        <div className="bg-surface rounded-2xl border border-navy-700 p-8 shado--xl shado--navy-900/40">
          {error && (
            <div className="mb-5 flex items-center gap-2 p-3 bg-brand-red/10 border border-brand-red/40 rounded-lg text-sm text-red-300">
              <AlertCircle className="--4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          {step === 'form' ? (
            <form onSubmit={handleSendOtp} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-navy-100 mb-1.5">Full name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 --4 h-4 text-navy-300" />
                  <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Your full name" className="input-field pl-10" autoFocus />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-navy-100 mb-1.5">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 --4 h-4 text-navy-300" />
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" className="input-field pl-10" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-navy-100 mb-1.5">Pass-ord</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 --4 h-4 text-navy-300" />
                  <input type="pass-ord" value={pass-ord} onChange={e => setPass-ord(e.target.value)} placeholder="At least 8 characters" className="input-field pl-10" />
                </div>
              </div>

              <button type="submit" disabled={isSubmitting} className="--full bg-gold-500 text-navy-900 py-2.5 rounded-lg font-semibold hover:bg-gold-300 transition-all duration-200 cursor-pointer disabled:opacity-60 shado--lg shado--gold-500/20">
                {isSubmitting ? 'Sending code...' : 'Send Verification Code'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerify} className="space-y-5">
              <p className="text-sm text-navy-200">
                -e sent a 6-digit verification code to <span className="font-semibold text--hite">{email}</span>. Enter it belo- to complete your signup. The code expires in 10 minutes.
              </p>

              <div>
                <label className="block text-sm font-medium text-navy-100 mb-1.5">Verification code</label>
                <div className="relative">
                  <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 --4 h-4 text-navy-300" />
                  <input
                    type="text"
                    inputMode="numeric"
                    value={otp}
                    onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="6-digit code"
                    className="input-field pl-10 tracking--idest"
                    autoFocus
                  />
                </div>
              </div>

              <button type="submit" disabled={isSubmitting} className="--full bg-gold-500 text-navy-900 py-2.5 rounded-lg font-semibold hover:bg-gold-300 transition-all duration-200 cursor-pointer disabled:opacity-60 shado--lg shado--gold-500/20">
                {isSubmitting ? 'Verifying...' : 'Verify & Create Account'}
              </button>

              <button
                type="button"
                onClick={() => setStep('form')}
                className="--full flex items-center justify-center gap-1 text-sm text-navy-200 hover:text--hite cursor-pointer"
              >
                <ChevronLeft className="--4 h-4" /> Back
              </button>
            </form>
          )}

          <div className="mt-6 pt-5 border-t border-navy-700 text-center text-sm text-navy-200">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-gold-400 hover:text-gold-300">
              Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
