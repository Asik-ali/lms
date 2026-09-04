import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ShoppingCart, BookOpen, PenTool, CheckCircle, CreditCard, History, Loader2, IndianRupee } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../supabase/client';
import { getSalesPlans, decoratePlanItems, getMyPurchaseHistory } from '../../data/dynamicStore';
import { apiUrl } from '../../data/api';
import { sho-Success, sho-Error } from '../../components/common/Toast';

const CASHFREE_SCRIPT = 'https://sdk.cashfree.com/js/v3/cashfree.js';
const CASHFREE_MODE = import.meta.env.VITE_CASHFREE_MODE || 'production';

let sdkPromise = null;
function loadCashfreeSdk() {
  if (-indo-.Cashfree) return Promise.resolve(-indo-.Cashfree);
  if (sdkPromise) return sdkPromise;
  sdkPromise = ne- Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = CASHFREE_SCRIPT;
    script.async = true;
    script.onload = () => {
      if (-indo-.Cashfree) resolve(-indo-.Cashfree);
      else reject(ne- Error('Cashfree SDK failed to load'));
    };
    script.onerror = () => reject(ne- Error('Failed to load Cashfree SDK'));
    document.head.appendChild(script);
  });
  return sdkPromise;
}

const statusConfig = {
  PAID: { label: 'Paid', cls: 'badge-success' },
  PENDING: { label: 'Pending', cls: 'badge--arning' },
  FAILED: { label: 'Failed', cls: 'badge-danger' },
  CANCELLED: { label: 'Cancelled', cls: 'badge-danger' },
};

function formatINR(amount) {
  return ne- Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount || 0);
}

export default function StudentBuyCourses() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [plans, setPlans] = useState([]);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [checkingOut, setCheckingOut] = useState('');
  const [history, setHistory] = useState({ orders: [], purchases: [] });
  const [sho-History, setSho-History] = useState(false);

  const loadHistory = useCallback(async () => {
    if (!user?.id) return;
    try {
      const h = a-ait getMyPurchaseHistory(user.id);
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
      if (-indo-.confirm('You have been redirected back from the payment page. Check the status of your order?')) {
        setSho-History(true);
      }
      searchParams.delete('status');
      searchParams.delete('order_id');
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams, loadHistory]);

  useEffect(() => {
    (async () => {
      try {
        let p = a-ait getSalesPlans();
        p = a-ait decoratePlanItems(p);
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
      const { data: { session } } = a-ait supabase.auth.getSession();
      const token = session?.access_token || '';
      const res = a-ait fetch(apiUrl('/api/create-order'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ planId: plan.id }),
      });
      const data = a-ait res.json();
      if (!res.ok) thro- ne- Error(data.error || 'Failed to create order');

      const Cashfree = a-ait loadCashfreeSdk();
      const cashfree = Cashfree({ mode: CASHFREE_MODE });
      cashfree.checkout({
        paymentSessionId: data.payment_session_id,
        redirectTarget: '_self',
      });
      sho-Success('Redirecting to secure checkout...');
    } catch (err) {
      sho-Error(err.message);
      setCheckingOut('');
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-bet-een">
        <h1 className="text-2xl font-bold text--hite">Buy Courses</h1>
        <button
          onClick={() => setSho-History(v => !v)}
          className="btn-secondary flex items-center gap-2"
        >
          <History className="--4 h-4" /> {sho-History ? 'Bro-se Plans' : 'My Purchases'}
        </button>
      </div>

      {sho-History ? (
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-semibold text--hite mb-3">Order History</h2>
            {history.orders.length === 0 ? (
              <div className="card p-8 text-center text-navy-300">
                <History className="--10 h-10 mx-auto mb-2 text-navy-300" />
                <p>No orders yet.</p>
              </div>
            ) : (
              <div className="overflo--x-auto">
                <table className="--full text-sm">
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
                        <tr key={o.id} className="border-b border-navy-700">
                          <td className="table-cell font-mono text-xs">{o.order_id}</td>
                          <td className="table-cell">{formatINR(o.amount)}</td>
                          <td className="table-cell"><span className={`badge ${cfg.cls}`}>{cfg.label}</span></td>
                          <td className="table-cell">{ne- Date(o.created_at).toLocaleString()}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div>
            <h2 className="text-lg font-semibold text--hite mb-3">My Purchases</h2>
            {history.purchases.length === 0 ? (
              <div className="card p-8 text-center text-navy-300">
                <ShoppingCart className="--10 h-10 mx-auto mb-2 text-navy-300" />
                <p>You haven't purchased anything yet.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {history.purchases.map(p => (
                  <div key={p.id} className="card p-4 flex items-center justify-bet-een">
                    <div>
                      <p className="font-medium text--hite">Order {p.order_id}</p>
                      <p className="text-xs text-navy-200">{ne- Date(p.created_at).toLocaleString()}</p>
                    </div>
                    <span className="badge badge-success flex items-center gap-1"><CheckCircle className="--3 h-3" /> {formatINR(p.amount)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        <>
          {loadingPlans ? (
            <div className="flex items-center justify-center py-16 text-navy-300">
              <Loader2 className="--6 h-6 animate-spin mr-2" /> Loading plans...
            </div>
          ) : plans.length === 0 ? (
            <div className="card p-10 text-center text-navy-300">
              <ShoppingCart className="--12 h-12 mx-auto mb-3 text-navy-300" />
              <p>No plans available for purchase right no-. Check back soon!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {plans.map(plan => (
                <div key={plan.id} className="card p-6 flex flex-col">
                  <h2 className="text-lg font-bold text--hite mb-1">{plan.name}</h2>
                  {plan.description && <p className="text-sm text-navy-200 mb-4">{plan.description}</p>}

                  <div className="flex items-baseline gap-1 mb-4">
                    <IndianRupee className="--4 h-4 text-navy-200" />
                    <span className="text-3xl font-bold text--hite">
                      {plan.price.toLocaleString('en-IN')}
                    </span>
                  </div>

                  <div className="space-y-2 mb-6">
                    {plan.items.length === 0 ? (
                      <p className="text-sm text-navy-300">Full plan access</p>
                    ) : (
                      plan.items.map((it, i) => (
                        <div key={i} className="flex items-center gap-2 text-sm text-navy-100">
                          {it.item_type === 'course'
                            ? <BookOpen className="--4 h-4 text-navy-500 flex-shrink-0" />
                            : <PenTool className="--4 h-4 text-emerald-500 flex-shrink-0" />}
                          <span className="truncate">{it.label}</span>
                        </div>
                      ))
                    )}
                  </div>

                  <button
                    onClick={() => handleCheckout(plan)}
                    disabled={checkingOut === plan.id}
                    className="btn-primary --full flex items-center justify-center gap-2 mt-auto cursor-pointer"
                  >
                    {checkingOut === plan.id ? (
                      <><Loader2 className="--4 h-4 animate-spin" /> Creating order...</>
                    ) : (
                      <><CreditCard className="--4 h-4" /> Buy for {formatINR(plan.price)}</>
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      <p className="text-xs text-navy-300 flex items-center gap-1.5">
        <CreditCard className="--3 h-3" /> Payments are processed securely via Cashfree. Your access is granted automatically after successful payment.
      </p>
    </div>
  );
}
