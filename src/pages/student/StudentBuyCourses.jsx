import { ownsPlan, cartSelection, cartTotal } from '../../data/shopCart';
import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { ShoppingCart, BookOpen, PenTool, CheckCircle, CreditCard, History, Loader2, IndianRupee } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../supabase/client';
import { getSalesPlans, decoratePlanItems, getMyPurchaseHistory } from '../../data/dynamicStore';
import { apiUrl } from '../../data/api';
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
  return sdkPromise.catch(error => {
    sdkPromise = null;
    throw error;
  });
}

const statusConfig = {
  PAID: { label: 'Paid', cls: 'badge-success' },
  PENDING: { label: 'Pending', cls: 'badge-warning' },
  FAILED: { label: 'Failed', cls: 'badge-danger' },
  CANCELLED: { label: 'Cancelled', cls: 'badge-danger' },
};

function formatINR(amount) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(amount || 0);
}

export default function StudentBuyCourses() {
  const { user, refreshProfile } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [plans, setPlans] = useState([]);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [shopError, setShopError] = useState('');
  const [checkingOut, setCheckingOut] = useState('');
  const [history, setHistory] = useState({ orders: [], purchases: [] });
  const [showHistory, setShowHistory] = useState(false);
  const [cart, setCart] = useState(() => {
    try {
      const ids = JSON.parse(localStorage.getItem(`lms-cart-${user?.id}`) || '[]');
      return { owner: user?.id, ids: Array.isArray(ids) ? ids : [] };
    } catch { return { owner: user?.id, ids: [] }; }
  });
  const cartIds = cart.owner === user?.id ? cart.ids : [];
  const cartPlans = cartSelection(plans, cartIds, user);
  const total = cartTotal(cartPlans);
  const contentKeys = cartPlans.flatMap(plan => plan.items.map(item => `${item.item_type}:${item.item_id}`));
  const overlaps = new Set(contentKeys).size < contentKeys.length;

  function updateCart(ids) {
    setCart({ owner: user.id, ids });
    try { localStorage.setItem(`lms-cart-${user.id}`, JSON.stringify(ids)); } catch { /* Cart works without local storage. */ }
  }

  function addToCart(plan) {
    if (!cartIds.some(id => String(id) === String(plan.id))) updateCart([...cartIds, plan.id]);
  }


  const loadHistory = useCallback(async () => {
    if (!user?.id) return;
    try {
      const h = await getMyPurchaseHistory(user.id);
      setHistory(h);
    } catch (err) {
      console.error('Failed to load purchase history:', err);
    }
  }, [user?.id]);

  const verifyPayment = useCallback(async (orderId) => {
    const { data: { session } } = await supabase.auth.getSession();
    const response = await fetch(apiUrl(`/api/order-status?orderId=${encodeURIComponent(orderId)}`), {
      headers: { Authorization: `Bearer ${session?.access_token || ''}` },
    });
    const order = await response.json();
    if (!response.ok) throw new Error(order.error || 'Unable to verify payment');
    if (order.status === 'PAID') {
      await refreshProfile();
      const paidIds = new Set((order.cart_plans || []).map(plan => String(plan.id)));
      setCart(current => {
        const ids = current.ids.filter(id => !paidIds.has(String(id)));
        try { localStorage.setItem(`lms-cart-${current.owner}`, JSON.stringify(ids)); } catch { /* Optional persistence. */ }
        return { ...current, ids };
      });
      showSuccess('Payment successful. Your courses and tests are unlocked.');
    } else {
      showError('Payment is not confirmed yet. Access remains locked. Check payment status again shortly.');
    }
    await loadHistory();
  }, [refreshProfile, loadHistory]);

  useEffect(() => { loadHistory(); }, [loadHistory]);

  useEffect(() => {
    const orderId = searchParams.get('order_id');
    if (searchParams.get('status') !== 'return' || !orderId) return;
    setShowHistory(true);
    setSearchParams({}, { replace: true });
    verifyPayment(orderId).catch(err => showError(err.message));
  }, [searchParams, setSearchParams, verifyPayment]);

  useEffect(() => {
    (async () => {
      try {
        let p = await getSalesPlans();
        p = await decoratePlanItems(p);
        setPlans(p);
      } catch (err) {
        setShopError(err.message || 'Unable to load the shop. Please try again.');
      } finally {
        setLoadingPlans(false);
      }
    })();
  }, []);

  async function handleCheckout() {
    if (!cartPlans.length || checkingOut) return;
    setCheckingOut('cart');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token || '';
      const res = await fetch(apiUrl('/api/create-order'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ planIds: cartPlans.map(plan => plan.id) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create order');

      const Cashfree = await loadCashfreeSdk();
      const cashfree = Cashfree({ mode: data.mode || CASHFREE_MODE });
      const result = await cashfree.checkout({
        paymentSessionId: data.payment_session_id,
        redirectTarget: '_modal',
      });
      if (result?.error) throw new Error(result.error.message || 'Checkout failed');
      if (result?.paymentDetails) {
        await verifyPayment(data.order_id);
      }
    } catch (err) {
      showError(err.message);
    } finally {
      setCheckingOut('');
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-navy-100">Shop Courses & Tests</h1>
        <button
          onClick={() => setShowHistory(v => !v)}
          className="btn-secondary flex items-center gap-2"
        >
          <History className="w-4 h-4" /> {showHistory ? 'Browse Plans' : 'My Purchases'}
        </button>
      </div>

      <p className="text-navy-200">Choose a course, test series, or bundle. Pay securely to unlock its included content.</p>
      {!showHistory && cartIds.length > 0 && !loadingPlans && (
        <section aria-label="Shopping cart" className="card p-5 space-y-4">
          <h2 className="text-lg font-semibold text-navy-100">Your cart ({cartPlans.length})</h2>
          {cartPlans.map(plan => <div key={plan.id} className="flex flex-wrap items-center justify-between gap-3 text-navy-100">
            <span>{plan.name} - {formatINR(plan.price)}</span>
            <button disabled={Boolean(checkingOut)} className="btn-secondary" aria-label={`Remove ${plan.name} from cart`} onClick={() => updateCart(cartIds.filter(id => String(id) !== String(plan.id)))}>Remove</button>
          </div>)}
          {cartPlans.length !== cartIds.length && <p className="text-sm text-navy-200">Unavailable or already unlocked items are excluded from checkout.</p>}
          {overlaps && <p className="text-sm text-amber-700 dark:text-amber-300">Some selections include the same content. Each plan is charged at its listed price. Remove overlapping selections if you only need that content once.</p>}
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-navy-700 pt-4">
            <span className="text-xl font-bold text-navy-100">Total: {formatINR(total)}</span>
            <button onClick={handleCheckout} disabled={!cartPlans.length || Boolean(checkingOut)} className="btn-primary flex items-center gap-2">
              {checkingOut ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
              {checkingOut ? 'Processing payment...' : `Pay ${formatINR(total)}`}
            </button>
            <button disabled={Boolean(checkingOut)} className="btn-secondary" onClick={() => updateCart([])}>Clear cart</button>
          </div>
        </section>
      )}
      {showHistory ? (
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-semibold text-navy-100 mb-3">Order History</h2>
            {history.orders.length === 0 ? (
              <div className="card p-8 text-center text-navy-300">
                <History className="w-10 h-10 mx-auto mb-2 text-navy-300" />
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
                        <tr key={o.id} className="border-b border-navy-700">
                          <td className="table-cell text-xs"><span className="font-mono">{o.order_id}</span><p className="text-navy-200 mt-1">{(o.cart_plans || []).map(plan => plan.name).join(", ")}</p></td>
                          <td className="table-cell">{formatINR(o.amount)}</td>
                          <td className="table-cell"><span className={`badge ${cfg.cls}`}>{cfg.label}</span>{o.status !== 'PAID' && <button className="ml-2 text-xs underline" onClick={() => verifyPayment(o.order_id).catch(err => showError(err.message))}>Check payment</button>}</td>
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
            <h2 className="text-lg font-semibold text-navy-100 mb-3">My Purchases</h2>
            {history.purchases.length === 0 ? (
              <div className="card p-8 text-center text-navy-300">
                <ShoppingCart className="w-10 h-10 mx-auto mb-2 text-navy-300" />
                <p>You haven't purchased anything yet.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {history.purchases.map(p => (
                  <div key={p.id} className="card p-4 flex items-center justify-between">
                    <div>
                      <p className="font-medium text-navy-100">Order {p.order_id}</p>
                      <p className="text-xs text-navy-200">{new Date(p.created_at).toLocaleString()}</p>
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
            <div className="flex items-center justify-center py-16 text-navy-300">
              <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading plans...
            </div>
          ) : shopError ? <div className="card p-6" role="alert">{shopError}<button className="btn-secondary ml-3" onClick={() => window.location.reload()}>Try again</button></div> : plans.length === 0 ? (
            <div className="card p-10 text-center text-navy-300">
              <ShoppingCart className="w-12 h-12 mx-auto mb-3 text-navy-300" />
              <p>No plans available for purchase right now. Check back soon!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {plans.map(plan => {
                const owned = ownsPlan(plan, user);
                const inCart = cartIds.some(id => String(id) === String(plan.id));
                return (
                <div key={plan.id} className="card p-6 flex flex-col">
                  <span className="text-xs text-navy-300 mb-2">{plan.items.length > 1 ? 'Bundle' : plan.items[0]?.item_type === 'course' ? 'Course' : 'Test Series'}</span>
                  <h2 className="text-lg font-bold text-navy-100 mb-1">{plan.name}</h2>
                  {plan.description && <p className="text-sm text-navy-200 mb-4">{plan.description}</p>}

                  <div className="flex items-baseline gap-1 mb-4">
                    <IndianRupee className="w-4 h-4 text-navy-200" />
                    <span className="text-3xl font-bold text-navy-100">
                      {plan.price.toLocaleString('en-IN')}
                    </span>
                  </div>

                  <div className="space-y-2 mb-6">
                    {plan.items.length === 0 ? (
                      <p className="text-sm text-navy-300">No content available</p>
                    ) : (
                      plan.items.map((it, i) => (
                        <div key={i} className="flex items-center gap-2 text-sm text-navy-100">
                          {it.item_type === 'course'
                            ? <BookOpen className="w-4 h-4 text-navy-500 flex-shrink-0" />
                            : <PenTool className="w-4 h-4 text-emerald-500 flex-shrink-0" />}
                          <span className="truncate">{it.label}</span>
                        </div>
                      ))
                    )}
                  </div>

                  {owned ? <>
                    <span className="badge badge-success mb-3">Access unlocked</span>
                    <Link className="btn-primary text-center mt-auto" to={plan.items[0]?.item_type === 'course' ? `/student/courses/${plan.items[0].item_id}` : '/student/test-series'}>Open content</Link>
                  </> : <button
                    onClick={() => addToCart(plan)}
                    disabled={Boolean(checkingOut) || inCart || plan.price <= 0 || !plan.items.length}
                    className="btn-primary w-full flex items-center justify-center gap-2 mt-auto cursor-pointer"
                  >
                    <ShoppingCart className="w-4 h-4" /> {inCart ? 'Added to cart' : 'Add to cart'}
                  </button>}

                </div>
              ); })}
            </div>
          )}
        </>
      )}

      <p className="text-xs text-navy-300 flex items-center gap-1.5">
        <CreditCard className="w-3 h-3" /> Payments are processed securely via Cashfree. Your access is granted automatically after successful payment.
      </p>
    </div>
  );
}
