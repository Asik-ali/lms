import { Link } from 'react-router-dom';

export default function DeleteAccountPage() {
  return <main className="min-h-dvh bg-navy-950 text-navy-100 px-5 py-10"><article className="max-w-3xl mx-auto space-y-6">
    <Link className="underline" to="/login">EXAMSTICK</Link>
    <h1 className="text-3xl font-bold">Request account deletion</h1>
    <p>To request deletion of your EXAMSTICK account and associated data, email <a className="underline" href="mailto:netdark583@gmail.com?subject=EXAMSTICK%20account%20deletion">netdark583@gmail.com</a> from your registered email address with the subject “EXAMSTICK account deletion”. Include your username so we can identify the account. Do not send your password or verification codes.</p>
    <p>We may verify account ownership before processing the request. Deletion removes your sign-in account, profile, enrollments, learning progress, test records and support messages associated with the account. You will lose access to that account and its learning materials.</p>
    <p>Transaction records or records needed for legal obligations, disputes or fraud prevention may be retained for the applicable required period. Backup copies may remain until replaced through the normal backup cycle. We will explain any applicable retention when handling your request.</p>
    <p>You can also submit a deletion request through Support Tickets after signing in. Uninstalling the app does not delete your account.</p>
    <Link className="underline" to="/privacy-policy">Privacy Policy</Link>
  </article></main>;
}
