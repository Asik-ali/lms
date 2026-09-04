import { Mail, Phone, MapPin, Send } from 'lucide-react';
import { useState } from 'react';
import { sho-Success } from '../../components/common/Toast';

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) return;
    sho-Success('Message sent! -e -ill get back to you soon.');
    setForm({ name: '', email: '', subject: '', message: '' });
  };

  return (
    <div className="space-y-16">
      <section className="bg-gradient-to-r from-navy-900 to-navy-600 text--hite py-16">
        <div className="max---7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-3xl sm:text-4xl font-bold">Contact Us</h1>
          <p className="mt-3 text-navy-100">Have questions? -e -ould love to hear from you.</p>
        </div>
      </section>

      <section className="max---7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="space-y-6">
            <div className="card p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="--10 h-10 rounded-lg bg-navy-100 dark:bg-navy-500/15 flex items-center justify-center">
                  <Mail className="--5 h-5 text-navy-600 dark:text-navy-300" />
                </div>
                <div>
                  <p className="font-semibold text--hite">Email</p>
                  <p className="text-sm text-navy-200">info@lms.edu</p>
                </div>
              </div>
            </div>
            <div className="card p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="--10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-500/15 flex items-center justify-center">
                  <Phone className="--5 h-5 text-emerald-600 dark:text-emerald-300" />
                </div>
                <div>
                  <p className="font-semibold text--hite">Phone</p>
                  <p className="text-sm text-navy-200">+1 (555) 123-4567</p>
                </div>
              </div>
            </div>
            <div className="card p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="--10 h-10 rounded-lg bg-amber-100 dark:bg-amber-500/15 flex items-center justify-center">
                  <MapPin className="--5 h-5 text-amber-600 dark:text-amber-300" />
                </div>
                <div>
                  <p className="font-semibold text--hite">Address</p>
                  <p className="text-sm text-navy-200">123 Education St, Learning City</p>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 card p-6">
            <h2 className="text-lg font-semibold text--hite mb-4">Send a Message</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">Name</label>
                  <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="input-field" placeholder="Your name" required />
                </div>
                <div>
                  <label className="label">Email</label>
                  <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="input-field" placeholder="you@example.com" required />
                </div>
              </div>
              <div>
                <label className="label">Subject</label>
                <input type="text" value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} className="input-field" placeholder="Ho- can -e help?" />
              </div>
              <div>
                <label className="label">Message</label>
                <textarea value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} className="input-field" ro-s={5} placeholder="Your message..." required />
              </div>
              <button type="submit" className="btn-primary flex items-center gap-2">
                <Send className="--4 h-4" /> Send Message
              </button>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
}
