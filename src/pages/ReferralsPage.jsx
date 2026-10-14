import { useCallback, useEffect, useState } from 'react';
import { Copy, Users, RefreshCw, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../supabase/client';
import { apiUrl } from '../data/api';
import { showSuccess, showError } from '../components/common/Toast';

const money = value => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(value || 0);

export default function ReferralsPage() {
  const { user } = useAuth();
  const admin = user?.role === 'admin';
  const [data, setData] = useState(null);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [revision, setRevision] = useState(0);
  const reload = useCallback(() => setRevision(value => value + 1), []);
  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    setLoading(true); setError('');
    (async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const response = await fetch(apiUrl(`/api/order-status?operation=referrals&page=${page}`), { signal: controller.signal, headers: { Authorization: `Bearer ${session?.access_token || ''}` } });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Unable to load referrals.');
        if (active) setData(result);
      } catch (err) { if (active) setError(err.message); }
      finally { if (active) setLoading(false); }
    })();
    return () => { active = false; controller.abort(); };
  }, [page, revision]);
  const link = data?.code ? `${(import.meta.env.VITE_SITE_URL || window.location.origin).replace(/\/$/, '')}/signup?ref=${data.code}` : '';
  async function copy(value) {
    try { await navigator.clipboard.writeText(value); showSuccess('Copied to clipboard.'); }
    catch { showError('Unable to copy. Select and copy the text below.'); }
  }
  return <div className="space-y-6" aria-busy={loading}>
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div><h1 className="text-2xl font-bold text-navy-100">{admin ? 'Student Referrals' : 'Refer & Earn'}</h1>
        <p className="text-sm text-navy-200 mt-2">{admin ? 'Track verified signups and first-purchase rewards.' : data ? `Earn ${money(data.rewardAmount)} store credit when a friend makes their first successful purchase.` : 'Earn store credit when a friend makes their first successful purchase.'}</p></div>
      <button onClick={reload} disabled={loading} className="btn-secondary flex items-center gap-2">{loading ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />} {loading ? 'Loading...' : 'Refresh'}</button>
    </div>
    {error && <p role="alert" className="card p-5">{error}</p>}
    {loading && <div role="status" aria-live="polite" className={`flex items-center justify-center gap-3 text-navy-200 ${data ? 'py-3' : 'card p-12'}`}><Loader2 className="w-6 h-6 animate-spin" aria-hidden="true" />{data ? 'Updating referrals...' : 'Loading referrals...'}</div>}
    {data && <>
      {!admin && <div className="card p-6 space-y-4">
        <h2 className="font-semibold text-navy-100">Invite your friends</h2>
        <p className="text-sm text-navy-200">Share your link or ask your friend to enter your code during signup. Rewards are credited once per friend, after payment confirmation.</p>
        <label className="block text-sm text-navy-200">Your code<input readOnly value={data.code || ''} className="input-field mt-2" /></label>
        <button onClick={() => copy(data.code)} className="btn-secondary flex items-center gap-2"><Copy size={16} /> Copy code</button>
        <label className="block text-sm text-navy-200">Referral link<input readOnly value={link} className="input-field mt-2" /></label>
        <button onClick={() => copy(link)} className="btn-primary flex items-center gap-2"><Copy size={16} /> Copy referral link</button>
        <p className="text-navy-100 font-semibold">Available store credit: {money(data.availableCredit)}</p>
        <p className="text-sm text-navy-200">Apply credit in your cart. Checkout requires at least ₹1 payable. Credit reserved by an unfinished checkout is unavailable until that order is confirmed or expires.</p>
      </div>}
      <div className="card overflow-x-auto"><table className="w-full text-sm text-navy-100" aria-label="Referrals">
        <thead><tr>{admin && <th className="table-cell text-left">Referrer</th>}<th className="table-cell text-left">Friend</th><th className="table-cell text-left">Joined</th><th className="table-cell text-left">Status</th><th className="table-cell text-left">Credit earned</th></tr></thead>
        <tbody>{data.referrals.map(row => <tr key={row.id} className="border-t border-navy-700">
          {admin && <td className="table-cell">{row.referrer?.name || 'Student'}</td>}
          <td className="table-cell">{row.referred?.name || 'Student'}</td>
          <td className="table-cell whitespace-nowrap">{new Date(row.created_at).toLocaleDateString('en-IN')}</td>
          <td className="table-cell">{row.qualified_at ? 'First purchase confirmed' : 'Awaiting first purchase'}</td>
          <td className="table-cell">{money(row.reward_amount)}</td>
        </tr>)}</tbody>
      </table>{!data.referrals.length && <div className="p-8 text-center text-navy-200"><Users className="mx-auto mb-3" /><p>No referrals yet.</p></div>}</div>
      <div className="flex items-center justify-between gap-3 text-sm text-navy-200">
        <span>{data.count} verified {data.count === 1 ? 'signup' : 'signups'}</span>
        <div className="flex gap-2"><button className="btn-secondary" disabled={loading || !page} onClick={() => setPage(value => value - 1)}>Previous</button><button className="btn-secondary" disabled={loading || (page + 1) * 25 >= data.count} onClick={() => setPage(value => value + 1)}>Next</button></div>
      </div>
    </>}
  </div>;
}
