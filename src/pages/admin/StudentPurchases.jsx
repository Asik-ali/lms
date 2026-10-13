import { useCallback, useEffect, useRef, useState } from 'react';
import { RefreshCw, Search, Loader2 } from 'lucide-react';
import { supabase } from '../../supabase/client';

const pageSize = 25;
const money = amount => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount || 0);

export default function StudentPurchases() {
  const [students, setStudents] = useState([]);
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(0);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const requestVersion = useRef(0);
  useEffect(() => {
    const timer = setTimeout(() => { setPage(0); setQuery(search); }, 300);
    return () => clearTimeout(timer);
  }, [search]);
  const load = useCallback(async () => {
    const version = ++requestVersion.current;
    setLoading(true); setError('');
    let request = supabase.from('profiles').select(
      'id, name, email, orders:purchase_orders!inner(id, order_id, amount, status, created_at, cart_plans, plan:sales_plans(name))',
      { count: 'exact' },
    ).eq('role', 'student').eq('orders.status', 'PAID').gte('orders.created_at', '2026-09-30T18:30:00.000Z').order('name').order('id').range(page * pageSize, (page + 1) * pageSize - 1);
    const term = query.replace(/[^\p{L}\p{N}\s@._-]/gu, '').trim();
    if (term) request = request.or(`name.ilike.%${term}%,email.ilike.%${term}%`);
    const result = await request;
    if (version !== requestVersion.current) return;
    if (result.error) setError(result.error.message);
    else {
      const total = result.count || 0;
      const lastPage = Math.max(0, Math.ceil(total / pageSize) - 1);
      setCount(total);
      if (page > lastPage) { setPage(lastPage); return; }
      setStudents(result.data || []);
    }
    setLoading(false);
  }, [page, query]);
  useEffect(() => { load(); }, [load]);

  return <div className="space-y-6">
    <div className="flex flex-wrap justify-between items-center gap-3">
      <div><h1 className="text-2xl font-bold text-navy-100">Student Purchases</h1>
        <p className="text-sm text-navy-200 mt-2">Confirmed purchases from 1 October 2026 onward.</p></div>
      <button className="btn-secondary inline-flex items-center gap-2" onClick={load} disabled={loading}><RefreshCw size={16} /> Refresh</button>
    </div>
    <label className="flex items-center gap-3 card p-3"><Search size={18} className="text-navy-300" />
      <input aria-label="Search students by name or email" placeholder="Search student name or email" className="bg-transparent outline-none w-full text-navy-100" value={search} onChange={event => setSearch(event.target.value)} />
    </label>
    {error ? <div role="alert" className="card p-5">{error}</div> : loading ? <div role="status" className="flex justify-center gap-2 py-12"><Loader2 className="animate-spin" /> Loading purchases...</div> :
      <div className="card overflow-x-auto"><table aria-label="Confirmed student purchases" className="w-full text-sm border-collapse">
        <thead className="bg-navy-50 dark:bg-navy-900"><tr className="border-b border-navy-700"><th className="px-5 py-4 text-left text-xs uppercase tracking-wide">Student</th><th className="px-5 py-4 text-left text-xs uppercase tracking-wide">Purchases</th><th className="px-5 py-4 text-left text-xs uppercase tracking-wide">Paid total</th><th className="px-5 py-4 text-left text-xs uppercase tracking-wide">Purchased plans</th></tr></thead>
        <tbody>{students.map(student => {
          const orders = (student.orders || []).filter(order => order.status === 'PAID').sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
          const paid = orders.filter(order => order.status === 'PAID');
          return <tr key={student.id} className="border-b last:border-b-0 border-navy-700 align-top hover:bg-navy-50 dark:hover:bg-navy-900">
            <td className="table-cell"><p className="font-semibold">{student.name}</p><p className="text-xs text-navy-300 mt-1">{student.email}</p></td>
            <td className="table-cell"><span className="badge badge-success">{paid.length} confirmed {paid.length === 1 ? 'purchase' : 'purchases'}</span></td>
            <td className="table-cell whitespace-nowrap font-semibold">{money(paid.reduce((sum, order) => sum + Number(order.amount), 0))}</td>
            <td className="table-cell">{orders.length ? <details><summary className="cursor-pointer text-navy-600 dark:text-navy-300">View {orders.length} {orders.length === 1 ? 'purchase' : 'purchases'}</summary>
              <div className="mt-3 space-y-4">{orders.map(order => <div key={order.id}>
                <p className="font-semibold">{order.cart_plans?.map(plan => plan.name).join(', ') || order.plan?.name || 'Course / test purchase'}</p>
                <p className="text-xs mt-1">{order.status} · {money(order.amount)} · {new Date(order.created_at).toLocaleDateString('en-IN')}</p>
                <p className="text-xs text-navy-300 font-mono mt-1">{order.order_id}</p>
              </div>)}</div></details> : <span className="text-navy-300">No orders placed</span>}</td>
          </tr>;
        })}</tbody>
      </table>{!students.length && <p className="p-8 text-center text-navy-300">No students with confirmed purchases found.</p>}</div>}
    <div className="flex items-center justify-between gap-3 text-sm text-navy-200">
      <span>{count ? `Showing ${page * pageSize + 1}–${Math.min((page + 1) * pageSize, count)} of ${count} purchased students` : '0 purchased students'}</span>
      {count > pageSize && <nav aria-label="Purchases pagination" className="flex gap-2 items-center">
        <button className="btn-secondary disabled:opacity-40 disabled:cursor-not-allowed" disabled={loading || page === 0} onClick={() => setPage(value => Math.max(0, value - 1))}>Previous</button>
        <span>Page {page + 1} of {Math.ceil(count / pageSize)}</span>
        <button className="btn-secondary disabled:opacity-40 disabled:cursor-not-allowed" disabled={loading || (page + 1) * pageSize >= count} onClick={() => setPage(value => Math.min(Math.ceil(count / pageSize) - 1, value + 1))}>Next</button>
      </nav>}
    </div>
  </div>;
}
