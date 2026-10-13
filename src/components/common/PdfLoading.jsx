import { FileText, Loader2 } from 'lucide-react';

export default function PdfLoading({ message = 'Loading PDF...' }) {
  return <div role="status" aria-live="polite" className="flex min-h-52 flex-col items-center justify-center gap-4 p-6 text-navy-200">
    <div className="relative rounded-2xl bg-navy-50 dark:bg-navy-900 p-5">
      <FileText className="h-9 w-9 text-navy-600 dark:text-navy-300" aria-hidden="true" />
      <Loader2 className="absolute -right-2 -bottom-2 h-7 w-7 animate-spin motion-reduce:animate-none text-navy-600 dark:text-navy-300" aria-hidden="true" />
    </div>
    <p className="text-sm font-medium">{message}</p>
    <div aria-hidden="true" className="h-1 w-28 animate-pulse motion-reduce:animate-none rounded-full bg-navy-200/30" />
  </div>;
}
