import { useCallback, useEffect, useRef, useState } from 'react';
import { Mail, RefreshCw, Search, Loader2, XCircle } from 'lucide-react';
import { supabase } from '../../supabase/client';
import { apiUrl } from '../../data/api';
import { showError, showSuccess } from '../../components/common/Toast';

const pageSize = 25;
const money = amount => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount || 0);
const statuses = ['ALL', 'PENDING', 'CANCELLING', 'CANCELLED', 'FAILED', 'PAID'];
const followUpStatuses = new Set(['PENDING', 'CANCELLING', 'CANCELLED', 'FAILED']);

function statusClass(status) {
  if (status === 'PAID') return 'badge-success';
  if (['FAILED', 'CANCELLED'].includes(status)) return 'badge-danger';
  return 'badge-warning';
}

function planNames(order) {
  return order.cart_plans?.map(plan => plan.name).join(', ') || order.plan?.name || 'Course / test purchase';
}

export default function StudentPurchases() {
  const [orders, setOrders] = useState([]);
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('ALL');
  const [page, setPage] = useState(0);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reminding, setReminding] = useState('');
  const [cancelling, setCancelling] = useState('');
  const requestVersion = useRef(0);

  useEffect(() => {
    const timer = setTimeout(() => { setPage(0); setQuery(search); }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const load = useCallback(async () => {
    const version = ++requestVersion.current;
    setLoading(true); setError('');
    let request = supabase.from('purchase_orders').select(
      'id, order_id, amount, status, created_at, cart_plans, plan:sales_plans(name), student:profiles!purchase_orders_student_id_fkey(id, name, email)',
      { count: 'exact' },
    ).gte('created_at', '2026-09-30T18:30:00.000Z').order('created_at', { ascending: false }).range(page * pageSize, (page + 1) * pageSize - 1);
    if (status !== 'ALL') request = request.eq('status', status);
    const term = query.replace(/[^\p{L}\p{N}\s@._-]/gu, '').trim();
    if (term) request = request.ilike('order_id', `%${term}%`);
    const result = await request;
    if (version !== requestVersion.current) return;
    if (result.error) setError(result.error.message);
    else {
      const total = result.count || 0;
      const lastPage = Math.max(0, Math.ceil(total / pageSize) - 1);
      setCount(total);
      if (page > lastPage) { setPage(lastPage); return; }
      setOrders(result.data || []);
    }
    setLoading(false);
  }, [page, query, status]);
  useEffect(() => { load(); }, [load]);

  async function sendReminder(order) {
    const email = order.student?.email;
    if (!email || reminding) return showError('This student has no email address.');
    setReminding(order.id);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch(apiUrl('/api/send-email'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token || ''}` },
        body: JSON.stringify({
          recipient: email,
          subject: 'Complete your EXAMSTICK purchase',
          message: `Hello ${order.student?.name || 'Student'},\n\nYou started a purchase for ${planNames(order)} (${money(order.amount)}) but the payment was ${String(order.status || '').toLowerCase()}. You can return to Shop Courses & Tests in EXAMSTICK to complete your purchase.\n\nIf you need help, reply to this email.\n\nEXAMSTICK Team`,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Unable to send reminder');
      showSuccess(`Reminder sent to ${email}.`);
    } catch (err) {
      showError(err.message || 'Unable to send reminder.');
    } finally {
      setReminding('');
    }
  }

  async function cancelOrder(order) {
    if (order.status === 'PAID' || cancelling) return;
    if (!window.confirm(`Cancel order ${order.order_id}? The student will be able to purchase these plans again.`)) return;
    setCancelling(order.id);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch(apiUrl('/api/admin-cancel-order'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token || ''}` },
        body: JSON.stringify({ orderId: order.order_id }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Unable to cancel order');
      showSuccess('Order cancelled. The student can purchase again now.');
      await load();
    } catch (err) {
      showError(err.message || 'Unable to cancel order.');
    } finally {
      setCancelling('');
    }
  }

  return <div className="space-y-6">
    <div className="flex flex-wrap justify-between items-center gap-3">
      <div><h1 className="text-2xl font-bold text-navy-100">Payment Attempts</h1>
        <p className="text-sm text-navy-200 mt-2">See completed, pending, failed, and cancelled Cashfree payments. Send a reminder when a student needs follow-up.</p></div>
      <button className="btn-secondary inline-flex items-center gap-2" onClick={load} disabled={loading}><RefreshCw size={16} /> Refresh</button>
    </div>
    <div className="flex flex-col sm:flex-row gap-3">
      <label className="flex items-center gap-3 card p-3 flex-1"><Search size={18} className="text-navy-300" />
        <input aria-label="Search by order ID" placeholder="Search by order ID" className="bg-transparent outline-none w-full text-navy-100" value={search} onChange={event => setSearch(event.target.value)} />
      </label>
      <label className="card px-3 py-2 text-sm text-navy-100"><span className="sr-only">Payment status</span><select value={status} onChange={event => { setPage(0); setStatus(event.target.value); }} className="bg-transparent outline-none min-h-10">
        {statuses.map(value => <option key={value} value={value}>{value === 'ALL' ? 'All statuses' : value}</option>)}
      </select></label>
    </div>
    {error ? <div role="alert" className="card p-5">{error}</div> : loading ? <div role="status" className="flex justify-center gap-2 py-12"><Loader2 className="animate-spin" /> Loading payment attempts...</div> :
      <div className="card overflow-x-auto"><table aria-label="Student payment attempts" className="w-full text-sm border-collapse">
        <thead className="bg-navy-50 dark:bg-navy-900"><tr className="border-b border-navy-700"><th className="px-5 py-4 text-left text-xs uppercase tracking-wide">Student</th><th className="px-5 py-4 text-left text-xs uppercase tracking-wide">Plans</th><th className="px-5 py-4 text-left text-xs uppercase tracking-wide">Amount</th><th className="px-5 py-4 text-left text-xs uppercase tracking-wide">Status</th><th className="px-5 py-4 text-left text-xs uppercase tracking-wide">Attempted</th><th className="px-5 py-4 text-left text-xs uppercase tracking-wide">Action</th></tr></thead>
        <tbody>{orders.map(order => <tr key={order.id} className="border-b last:border-b-0 border-navy-700 align-top hover:bg-navy-50 dark:hover:bg-navy-900">
          <td className="table-cell"><p className="font-semibold">{order.student?.name || 'Student'}</p><p className="text-xs text-navy-300 mt-1">{order.student?.email || 'No email address'}</p></td>
          <td className="table-cell"><p>{planNames(order)}</p><p className="text-xs text-navy-300 font-mono mt-1">{order.order_id}</p></td>
          <td className="table-cell whitespace-nowrap font-semibold">{money(order.amount)}</td>
          <td className="table-cell"><span className={`badge ${statusClass(order.status)}`}>{order.status || 'PENDING'}</span></td>
          <td className="table-cell whitespace-nowrap">{new Date(order.created_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</td>
          <td className="table-cell"><div className="flex flex-wrap gap-2">{followUpStatuses.has(order.status) && <button className="btn-secondary inline-flex items-center gap-2 text-xs" disabled={Boolean(reminding) || !order.student?.email} onClick={() => sendReminder(order)} title={order.student?.email ? 'Send a payment reminder email' : 'Student has no email address'}>{reminding === order.id ? <Loader2 size={14} className="animate-spin" /> : <Mail size={14} />}{reminding === order.id ? 'Sending...' : 'Send reminder'}</button>}{order.status !== 'PAID' && order.status !== 'CANCELLED' && <button className="btn-secondary inline-flex items-center gap-2 text-xs" disabled={Boolean(cancelling)} onClick={() => cancelOrder(order)} title="Cancel this unpaid order so the student can purchase again">{cancelling === order.id ? <Loader2 size={14} className="animate-spin" /> : <XCircle size={14} />}{cancelling === order.id ? 'Cancelling...' : 'Cancel order'}</button>}{!followUpStatuses.has(order.status) && order.status === 'PAID' && <span className="text-navy-300">No follow-up needed</span>}</div></td>
        </tr>)}</tbody>
      </table>{!orders.length && <p className="p-8 text-center text-navy-300">No payment attempts found.</p>}</div>}
    <div className="flex items-center justify-between gap-3 text-sm text-navy-200">
      <span>{count ? `Showing ${page * pageSize + 1}-${Math.min((page + 1) * pageSize, count)} of ${count} payment attempts` : '0 payment attempts'}</span>
      {count > pageSize && <nav aria-label="Payment attempts pagination" className="flex gap-2 items-center"><button className="btn-secondary disabled:opacity-40 disabled:cursor-not-allowed" disabled={loading || page === 0} onClick={() => setPage(value => Math.max(0, value - 1))}>Previous</button><span>Page {page + 1} of {Math.ceil(count / pageSize)}</span><button className="btn-secondary disabled:opacity-40 disabled:cursor-not-allowed" disabled={loading || (page + 1) * pageSize >= count} onClick={() => setPage(value => Math.min(Math.ceil(count / pageSize) - 1, value + 1))}>Next</button></nav>}
    </div>
  </div>;
}
