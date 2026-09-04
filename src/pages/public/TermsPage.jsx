import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

const sections = [
  {
    title: '1. Acceptance of Terms',
    body: 'By accessing or using the LMS Platform ("the Platform"), you agree to be bound by these Terms & Conditions and all applicable laws. If you do not agree with any part of these terms, you must not use the Platform.',
  },
  {
    title: '2. Accounts & Eligibility',
    body: 'You must provide accurate information when creating an account and keep your login credentials secure. You are responsible for all activity under your account. The Platform is intended for individual learners; sharing or reselling of access is prohibited.',
  },
  {
    title: '3. Paid Courses, Plans & Test Series',
    body: 'The Platform offers paid subscriptions and one-time purchases for courses and test series ("Products"). Prices are listed in Indian Rupees (INR) and are inclusive of all applicable taxes unless stated otherwise. Purchase grants you a personal, non-transferable, non-exclusive licence to access the purchased Products until revoked in accordance with these terms.',
  },
  {
    title: '4. Payments & Processing',
    body: 'Payments are processed securely through Cashfree Payments. You understand that by submitting payment you authorise the Platform to charge the applicable amount. All payments are processed in INR.',
  },
  {
    title: '5. Access Granting',
    body: 'Access to purchased Products is granted automatically once payment is confirmed by our payment processor. In rare cases where automatic granting fails, access will be granted within 24 hours of a successful payment.',
  },
  {
    title: '6. Acceptable Use',
    body: 'You agree not to misuse the Platform, attempt to gain unauthorised access, copy or redistribute course materials without permission, or use the Platform for any unlawful purpose.',
  },
  {
    title: '7. Intellectual Property',
    body: 'All course content, materials, software, and branding on the Platform are the intellectual property of the Platform owner. You may not reproduce, distribute, or create derivative works without prior written consent.',
  },
  {
    title: '8. Limitation of Liability',
    body: 'The Platform is provided "as is" without warranties of any kind. To the fullest extent permitted by law, the Platform owner shall not be liable for any indirect, incidental, or consequential damages arising from your use of the Platform or Products.',
  },
  {
    title: '9. Contact Information',
    body: 'For any questions about these Terms & Conditions, please contact us using the contact details provided on the Contact page.',
  },
];

export default function TermsPage() {
  const [open, setOpen] = useState(0);

  return (
    <div className="space-y-16">
      <section className="bg-gradient-to-r from-navy-900 to-navy-600 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-3xl sm:text-4xl font-bold">Terms &amp; Conditions</h1>
          <p className="mt-3 text-navy-100">Please read these terms carefully before using our services.</p>
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
