import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ShoppingCart, BookOpen, PenTool, CheckCircle, CreditCard, History, Loader2, IndianRupee } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../supabase/client';
import { getSalesPlans, decoratePlanItems, getMyPurchaseHistory } from '../../data/dynamicStore';
import { showSuccess, showError } from '../../components/common/Toast';

const CASHFREE_SCRIPT = 'https://sdk.cashfree.com/js/v3/cashfree.js';
const CASHFREE_MODE = import.meta.env.VITE_CASHFREE_MODE || 'production';

let sdkPromise = null;
function loadCashfreeSdk() {
  if (window.Cashfree) return Promise.resolve(window.Cashfree);
  if (sdkPromise) return sdkPromise;
  sdkPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = CASHFREE_SCRIPT;
    script.async = true;
    script.onload = () => {
      if (window.Cashfree) resolve(window.Cashfree);
      else reject(new Error('Cashfree SDK failed to load'));
    };
    script.onerror = () => reject(new Error('Failed to load Cashfree SDK'));
    document.head.appendChild(script);
  });
  return sdkPromise;
}

const statusConfig = {
  PAID: { label: 'Paid', cls: 'badge-success' },
  PENDING: { label: 'Pending', cls: 'badge-warning' },
  FAILED: { label: 'Failed', cls: 'badge-danger' },
  CANCELLED: { label: 'Cancelled', cls: 'badge-danger' },
};

function formatINR(amount) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount || 0);
}

export default function StudentBuyCourses() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [plans, setPlans] = useState([]);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [checkingOut, setCheckingOut] = useState('');
  const [history, setHistory] = useState({ orders: [], purchases: [] });
  const [showHistory, setShowHistory] = useState(false);

  const loadHistory = useCallback(async () => {
    if (!user?.id) return;
    try {
      const h = await getMyPurchaseHistory(user.id);
      setHistory(h);
    } catch (err) {
      console.error('Failed to load purchase history:', err);
    }
  }, [user?.id]);

  useEffect(() => {
    loadHistory();
    const status = searchParams.get('status');
    const orderId = searchParams.get('order_id');
    if (status === 'return' && orderId) {
      if (window.confirm('You have been redirected back from the payment page. Check the status of your order?')) {
        setShowHistory(true);
      }
      searchParams.delete('status');
      searchParams.delete('order_id');
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams, loadHistory]);

  useEffect(() => {
    (async () => {
      try {
        let p = await getSalesPlans();
        p = await decoratePlanItems(p);
        setPlans(p);
      } catch (err) {
        console.error('Failed to load sales plans:', err);
      } finally {
        setLoadingPlans(false);
      }
    })();
  }, []);

  async function handleCheckout(plan) {
    setCheckingOut(plan.id);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token || '';
      const res = await fetch('/api/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ planId: plan.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create order');

      const Cashfree = await loadCashfreeSdk();
      const cashfree = Cashfree({ mode: CASHFREE_MODE });
      cashfree.checkout({
        paymentSessionId: data.payment_session_id,
        redirectTarget: '_self',
      });
      showSuccess('Redirecting to secure checkout...');
    } catch (err) {
      showError(err.message);
      setCheckingOut('');
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Buy Courses</h1>
        <button
          onClick={() => setShowHistory(v => !v)}
          className="btn-secondary flex items-center gap-2"
        >
          <History className="w-4 h-4" /> {showHistory ? 'Browse Plans' : 'My Purchases'}
        </button>
      </div>

      {showHistory ? (
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">Order History</h2>
            {history.orders.length === 0 ? (
              <div className="card p-8 text-center text-gray-400 dark:text-gray-500">
                <History className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                <p>No orders yet.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="table-header">
                      <th className="text-left">Order ID</th>
                      <th className="text-left">Amount</th>
                      <th className="text-left">Status</th>
                      <th className="text-left">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.orders.map(o => {
                      const cfg = statusConfig[o.status] || statusConfig.PENDING;
                      return (
                        <tr key={o.id} className="border-b border-gray-100 dark:border-gray-800">
                          <td className="table-cell font-mono text-xs">{o.order_id}</td>
                          <td className="table-cell">{formatINR(o.amount)}</td>
                          <td className="table-cell"><span className={`badge ${cfg.cls}`}>{cfg.label}</span></td>
                          <td className="table-cell">{new Date(o.created_at).toLocaleString()}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">My Purchases</h2>
            {history.purchases.length === 0 ? (
              <div className="card p-8 text-center text-gray-400 dark:text-gray-500">
                <ShoppingCart className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                <p>You haven't purchased anything yet.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {history.purchases.map(p => (
                  <div key={p.id} className="card p-4 flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-gray-100">Order {p.order_id}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{new Date(p.created_at).toLocaleString()}</p>
                    </div>
                    <span className="badge badge-success flex items-center gap-1"><CheckCircle className="w-3 h-3" /> {formatINR(p.amount)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        <>
          {loadingPlans ? (
            <div className="flex items-center justify-center py-16 text-gray-400 dark:text-gray-500">
              <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading plans...
            </div>
          ) : plans.length === 0 ? (
            <div className="card p-10 text-center text-gray-400 dark:text-gray-500">
              <ShoppingCart className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>No plans available for purchase right now. Check back soon!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {plans.map(plan => (
                <div key={plan.id} className="card p-6 flex flex-col">
                  <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-1">{plan.name}</h2>
                  {plan.description && <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{plan.description}</p>}

                  <div className="flex items-baseline gap-1 mb-4">
                    <IndianRupee className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                    <span className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                      {plan.price.toLocaleString('en-IN')}
                    </span>
                  </div>

                  <div className="space-y-2 mb-6">
                    {plan.items.length === 0 ? (
                      <p className="text-sm text-gray-400 dark:text-gray-500">Full plan access</p>
                    ) : (
                      plan.items.map((it, i) => (
                        <div key={i} className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                          {it.item_type === 'course'
                            ? <BookOpen className="w-4 h-4 text-indigo-500 flex-shrink-0" />
                            : <PenTool className="w-4 h-4 text-emerald-500 flex-shrink-0" />}
                          <span className="truncate">{it.label}</span>
                        </div>
                      ))
                    )}
                  </div>

                  <button
                    onClick={() => handleCheckout(plan)}
                    disabled={checkingOut === plan.id}
                    className="btn-primary w-full flex items-center justify-center gap-2 mt-auto cursor-pointer"
                  >
                    {checkingOut === plan.id ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Creating order...</>
                    ) : (
                      <><CreditCard className="w-4 h-4" /> Buy for {formatINR(plan.price)}</>
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      <p className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1.5">
        <CreditCard className="w-3 h-3" /> Payments are processed securely via Cashfree. Your access is granted automatically after successful payment.
      </p>
    </div>
  );
}
