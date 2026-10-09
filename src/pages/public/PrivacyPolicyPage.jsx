import { Link } from 'react-router-dom';

export default function PrivacyPolicyPage() {
  const sections = [
    ['Information we collect', 'When you create an account, EXAMSTICK collects your name, email address, username, account ID, password and email verification information. We also store course enrollments, learning progress, test answers, scores, attempt history, and support tickets and replies. If you make a purchase, we process order details, purchase history and payment status. When notifications are enabled, we store push notification tokens or subscription details. Our hosting and service providers may process technical connection information, such as IP addresses and request logs, to operate and protect the service.'],
    ['How we use information', 'We use this information to create and verify accounts, authenticate sign-ins, provide access to learning materials, track progress, grade tests, process purchases, answer support requests, deliver service notifications, and prevent misuse.'],
    ['Services that process information', 'We use Supabase for authentication and data storage, Vercel for hosting and API services, Cashfree for payment processing, and Firebase Cloud Messaging and web push services for notifications. Email providers deliver verification and service messages. Embedded YouTube videos and other external learning services may process technical information when you use them under their own privacy policies. Payment credentials entered in a payment provider’s checkout are handled by that provider.'],
    ['Sharing and access', 'Authorized administrators can access information needed to manage accounts, enrollments and support. Information is provided to service providers as needed to operate EXAMSTICK and may be disclosed where required by law or to protect users and the service.'],
    ['Storage and security', 'Account and learning information is stored in our service databases. We use access controls and authentication to restrict access. No electronic service can guarantee absolute security. Keep your password private and contact us if you suspect unauthorized access.'],
    ['Retention', 'We retain account and learning information while needed to provide your account and services. After a deletion request, we remove the account and associated information that is no longer required. Some transaction, security or legal records may be retained where necessary for legal obligations, dispute resolution or fraud prevention. Backups may retain copies until they are replaced through the normal backup cycle.'],
    ['Your choices', 'You can change notification permissions in your device or browser settings and contact us to request access, correction or deletion of your information. Deleting the app from your device does not delete your account.'],
    ['Younger users', 'EXAMSTICK provides exam preparation and educational services. If you are under the age at which you can consent to use these services in your country, involve a parent or guardian. Contact us if you believe information has been collected from a child without the necessary authorization.'],
    ['Changes to this policy', 'We may update this policy as our services or data practices change. The updated policy and its revision date will be available on this page.'],
  ];
  return (
    <main className="min-h-dvh bg-navy-950 text-navy-100 px-5 py-10">
      <article className="max-w-3xl mx-auto space-y-7">
        <Link to="/login" className="text-gold-600 dark:text-gold-400 underline">EXAMSTICK</Link>
        <h1 className="text-3xl font-bold">Privacy Policy</h1>
        <p className="text-sm text-navy-200">Last updated: 9 October 2026</p>
        <p className="leading-relaxed">This policy explains how the operator of EXAMSTICK collects and handles information through the EXAMSTICK Android app (com.lms.portal) and website.</p>
        {sections.map(([title, body]) => <section key={title} className="space-y-2"><h2 className="text-xl font-semibold">{title}</h2><p className="leading-relaxed">{body}</p></section>)}
        <section className="space-y-2"><h2 className="text-xl font-semibold">Contact and deletion requests</h2><p>For privacy questions or requests, email <a className="underline" href="mailto:netdark583@gmail.com">netdark583@gmail.com</a>.</p><p><Link className="underline" to="/delete-account">How to request account and data deletion</Link></p></section>
      </article>
    </main>
  );
}
