import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

const sections = [
  {
    title: '1. Overview',
    body: 'This Refunds & Cancellations Policy applies to all purchases made on the LMS Platform, including paid courses, subscriptions, and test series. Access to purchased Products is digital and delivered instantly, so our cancellation and refund policy reflects the nature of digital content.',
  },
  {
    title: '2. How to Request a Refund',
    body: 'To request a refund, contact our support team through the Contact page or Messages section within 7 days of purchase. Include your order ID (beginning with "LMS") and the reason for the request. Refund requests are reviewed on a case-by-case basis.',
  },
  {
    title: '3. No Refund for Downloaded or Fully Consumed Content',
    body: 'Because digital Products are delivered immediately, refunds are not provided once content has been substantially accessed, downloaded, or consumed. This includes fully completed courses or fully taken test series.',
  },
  {
    title: '4. When Refunds Are Granted',
    body: 'Refunds may be granted in the following situations: (a) duplicate or erroneous charges, (b) the purchased Product is defective or inaccessible due to a Platform error that we cannot resolve, or (c) you did not receive access to a purchased Product despite a successful payment.',
  },
  {
    title: '5. Refund Processing',
    body: 'Approved refunds are processed back to the original payment method and may take 5-10 business days to reflect, depending on your bank or payment provider. The Platform is not responsible for delays caused by third-party payment processors or banks.',
  },
  {
    title: '6. Cancellations',
    body: 'Recurring subscription plans may be cancelled at any time through your account. The subscription will remain active until the end of the current billing period. No partial refunds are provided for the remainder of a billing period after cancellation.',
  },
  {
    title: '7. Contact Us',
    body: 'For any questions regarding refunds or cancellations, please reach us using the contact details provided on the Contact page.',
  },
];

export default function RefundPolicyPage() {
  const [open, setOpen] = useState(0);

  return (
    <div className="space-y-16">
      <section className="bg-gradient-to-r from-navy-900 to-navy-600 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-3xl sm:text-4xl font-bold">Refunds &amp; Cancellations</h1>
          <p className="mt-3 text-navy-100">Our policy for digital course and test series purchases.</p>
        </div>
      </section>

      <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="space-y-3">
          {sections.map((s, i) => (
            <div key={i} className="card overflow-hidden">
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="w-full flex items-center justify-between p-4 sm:p-5 text-left cursor-pointer"
              >
                <span className="font-medium text-gray-900 dark:text-gray-100 pr-4">{s.title}</span>
                {open === i ? (
                  <ChevronUp className="w-5 h-5 text-gray-400 dark:text-gray-500 flex-shrink-0" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-400 dark:text-gray-500 flex-shrink-0" />
                )}
              </button>
              {open === i && (
                <div className="px-4 sm:px-5 pb-4 sm:pb-5">
                  <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{s.body}</p>
                </div>
              )}
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-8">Last updated: {new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
      </section>
    </div>
  );
}
