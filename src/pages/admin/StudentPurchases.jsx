import { useCallback, useEffect, useState } from 'react';
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
  useEffect(() => {
    const timer = setTimeout(() => { setPage(0); setQuery(search); }, 300);
    return () => clearTimeout(timer);
  }, [search]);
  const load = useCallback(async () => {
    setLoading(true); setError('');
    let request = supabase.from('profiles').select(
      'id, name, email, orders:purchase_orders!inner(id, order_id, amount, status, created_at, cart_plans, plan:sales_plans(name))',
      { count: 'exact' },
    ).eq('role', 'student').eq('orders.status', 'PAID').order('name').order('id').range(page * pageSize, (page + 1) * pageSize - 1);
    const term = query.replace(/[^\p{L}\p{N}\s@._-]/gu, '').trim();
    if (term) request = request.or(`name.ilike.%${term}%,email.ilike.%${term}%`);
    const result = await request;
    if (result.error) setError(result.error.message);
    else { setStudents(result.data || []); setCount(result.count || 0); }
    setLoading(false);
  }, [page, query]);
  useEffect(() => { load(); }, [load]);

  return <div className="space-y-6">
    <div className="flex flex-wrap justify-between items-center gap-3">
      <div><h1 className="text-2xl font-bold text-navy-100">Student Purchases</h1>
        <p className="text-sm text-navy-200 mt-2">Students with confirmed purchases and their purchased plans.</p></div>
      <button className="btn-secondary inline-flex items-center gap-2" onClick={load} disabled={loading}><RefreshCw size={16} /> Refresh</button>
    </div>
    <label className="flex items-center gap-3 card p-3"><Search size={18} className="text-navy-300" />
      <input aria-label="Search students by name or email" placeholder="Search student name or email" className="bg-transparent outline-none w-full text-navy-100" value={search} onChange={event => setSearch(event.target.value)} />
    </label>
    {error ? <div role="alert" className="card p-5">{error}</div> : loading ? <div role="status" className="flex justify-center gap-2 py-12"><Loader2 className="animate-spin" /> Loading purchases...</div> :
      <div className="card overflow-x-auto"><table className="w-full text-sm">
        <thead><tr className="table-header"><th className="text-left">Student</th><th className="text-left">Purchases</th><th className="text-left">Paid total</th><th className="text-left">Purchased plans</th></tr></thead>
        <tbody>{students.map(student => {
          const orders = (student.orders || []).filter(order => order.status === 'PAID').sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
          const paid = orders.filter(order => order.status === 'PAID');
          return <tr key={student.id} className="border-b border-navy-700 align-top">
            <td className="table-cell"><p className="font-semibold">{student.name}</p><p className="text-xs text-navy-300 mt-1">{student.email}</p></td>
            <td className="table-cell"><span className="badge badge-success">{paid.length} confirmed purchases</span></td>
            <td className="table-cell whitespace-nowrap font-semibold">{money(paid.reduce((sum, order) => sum + Number(order.amount), 0))}</td>
            <td className="table-cell">{orders.length ? <details><summary className="cursor-pointer text-navy-600 dark:text-navy-300">View {orders.length} purchases</summary>
              <div className="mt-3 space-y-4">{orders.map(order => <div key={order.id}>
                <p className="font-semibold">{order.cart_plans?.map(plan => plan.name).join(', ') || order.plan?.name || 'Course / test purchase'}</p>
                <p className="text-xs mt-1">{order.status} · {money(order.amount)} · {new Date(order.created_at).toLocaleDateString('en-IN')}</p>
                <p className="text-xs text-navy-300 font-mono mt-1">{order.order_id}</p>
              </div>)}</div></details> : <span className="text-navy-300">No orders placed</span>}</td>
          </tr>;
        })}</tbody>
      </table>{!students.length && <p className="p-8 text-center text-navy-300">No students with confirmed purchases found.</p>}</div>}
    <div className="flex items-center justify-between gap-3 text-sm text-navy-200">
      <span>{count} students · Page {page + 1} of {Math.max(1, Math.ceil(count / pageSize))}</span>
      <div className="flex gap-2"><button className="btn-secondary" disabled={loading || page === 0} onClick={() => setPage(value => value - 1)}>Previous</button><button className="btn-secondary" disabled={loading || (page + 1) * pageSize >= count} onClick={() => setPage(value => value + 1)}>Next</button></div>
    </div>
  </div>;
}
