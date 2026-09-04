import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { IndianRupee, BookOpen, PenTool, Check, Loader2, CreditCard } from 'lucide-react';
import { getSalesPlans, decoratePlanItems } from '../../data/dynamicStore';

export default function PricingPage() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        let p = await getSalesPlans();
        p = await decoratePlanItems(p);
        setPlans(p);
      } catch (err) {
        console.error('Failed to load plans:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="space-y-16">
      <section className="bg-gradient-to-r from-[#071A3D] to-navy-600 text-white dark:from-navy-900 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-3xl sm:text-4xl font-bold">Pricing</h1>
          <p className="mt-3 text-[#D6E4FA]">Choose a plan that fits your learning goals. All prices are in Indian Rupees (INR).</p>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-navy-300">
            <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading plans...
          </div>
        ) : plans.length === 0 ? (
          <div className="card p-10 text-center text-navy-300">
            <CreditCard className="w-12 h-12 mx-auto mb-3 text-navy-300" />
            <p>No plans available right now. Check back soon!</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {plans.map(plan => (
                <div key={plan.id} className="card p-6 flex flex-col">
                  <h2 className="text-lg font-bold text-navy-100 mb-1">{plan.name}</h2>
                  {plan.description && <p className="text-sm text-navy-200 mb-4">{plan.description}</p>}
                  <div className="flex items-baseline gap-1 mb-4">
                    <IndianRupee className="w-4 h-4 text-navy-200" />
                    <span className="text-3xl font-bold text-navy-100">{plan.price.toLocaleString('en-IN')}</span>
                    <span className="text-sm text-navy-300">INR</span>
                  </div>
                  <div className="space-y-2 mb-6 flex-1">
                    {plan.items.length === 0 ? (
                      <p className="flex items-center gap-2 text-sm text-navy-100">
                        <Check className="w-4 h-4 text-emerald-500" /> Full plan access
                      </p>
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
                  <Link to="/signup" className="btn-primary w-full flex items-center justify-center gap-2 text-center">
                    Get Started
                  </Link>
                </div>
              ))}
            </div>
            <p className="text-xs text-navy-300 mt-8 text-center">
              All prices are inclusive of applicable taxes. Payments are processed securely via Cashfree. See our <a className="underline" href="/terms">Terms &amp; Conditions</a> and <a className="underline" href="/refunds">Refunds &amp; Cancellations</a>.
            </p>
          </>
        )}
      </section>
    </div>
  );
}
