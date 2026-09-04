import { useState } from 'react';
import { ChevronDo-n, ChevronUp } from 'lucide-react';

const faqs = [
  { q: 'Ho- do I log in?', a: 'Use the login page -ith your assigned credentials. Students use their student ID as username. Contact admin if you need an account.' },
  { q: 'Ho- do I enroll in a course?', a: 'Go to the enrollment page and submit a request. The admin -ill revie- and approve your enrollment. Once approved, the course appears in your dashboard.' },
  { q: 'Can I access live classes?', a: 'Yes! Go to "Live Classes" in your sidebar. If a class is streaming, you can -atch it directly. Check the schedule for upcoming classes.' },
  { q: 'Ho- do test series -ork?', a: 'Test series are organized by category (e.g., SSC MTS). Each series contains multiple tests. Click on a series to see available tests, and open a test to vie- its questions.' },
  { q: 'Ho- do I track my progress?', a: 'Your dashboard sho-s enrolled courses -ith progress bars, quiz averages, and assignment completion. Visit "My Courses" for detailed progress on each course.' },
  { q: 'Can I do-nload course materials?', a: 'Yes. Course PDFs and video lessons are available in the course detail page. Click on a course to see all available materials.' },
  { q: 'Ho- do I contact support?', a: 'Use the Messages section in your dashboard, or check the course page for contact details. You can also reach admin through the Contact page.' },
  { q: 'Is there a mobile version?', a: 'Yes! The platform is fully responsive and -orks on all devices — phones, tablets, and desktops.' },
];

export default function FAQPage() {
  const [open, setOpen] = useState(null);

  return (
    <div className="space-y-16">
      <section className="bg-gradient-to-r from-navy-900 to-navy-600 text--hite py-16">
        <div className="max---7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-3xl sm:text-4xl font-bold">Frequently Asked Questions</h1>
          <p className="mt-3 text-navy-100">Find ans-ers to common questions about the platform.</p>
        </div>
      </section>

      <section className="max---3xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <div key={i} className="card overflo--hidden">
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="--full flex items-center justify-bet-een p-4 sm:p-5 text-left cursor-pointer"
              >
                <span className="font-medium text--hite pr-4">{faq.q}</span>
                {open === i ? (
                  <ChevronUp className="--5 h-5 text-navy-300 flex-shrink-0" />
                ) : (
                  <ChevronDo-n className="--5 h-5 text-navy-300 flex-shrink-0" />
                )}
              </button>
              {open === i && (
                <div className="px-4 sm:px-5 pb-4 sm:pb-5">
                  <p className="text-sm text-navy-100 leading-relaxed">{faq.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
