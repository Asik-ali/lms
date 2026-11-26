import { supabase } from '../supabase/client';
import { apiUrl } from './api';
import { Capacitor, registerPlugin } from '@capacitor/core';

const InvoiceDownload = registerPlugin('InvoiceDownload');

export async function createInvoicePdf(orderId) {
  const { data: { session } } = await supabase.auth.getSession();
  const response = await fetch(apiUrl(`/api/order-status?operation=invoice&orderId=${encodeURIComponent(orderId)}`), {
    headers: { Authorization: `Bearer ${session?.access_token || ''}` },
  });
  const invoice = await response.json();
  if (!response.ok) throw new Error(invoice.error || 'Unable to generate invoice');

  const { buildInvoicePdf } = await import('./invoicePdf');
  const pdf = buildInvoicePdf(invoice);

  const filename = `${String(invoice.number || `INV-${orderId}`).replace(/[^a-zA-Z0-9_-]/g, '-')}.pdf`;
  return { pdf, filename };
}

// Kept separate from generation because Android WebView only permits its
// native share sheet from a direct user click, not after an async fetch/PDF
// generation chain has completed.
export async function saveInvoicePdf({ pdf, filename }) {
  if (Capacitor.isNativePlatform() && Capacitor.isPluginAvailable('InvoiceDownload')) {
    const dataUri = pdf.output('datauristring');
    await InvoiceDownload.savePdf({ base64: dataUri.slice(dataUri.indexOf(',') + 1), filename });
    return { saved: true, method: 'native' };
  }
  const blob = pdf.output('blob');
  const file = new File([blob], filename, { type: 'application/pdf' });
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: 'EXAMSTICK invoice' });
      return { saved: true, method: 'share' };
    } catch (error) {
      if (error.name === 'AbortError') return { saved: false };
      // A browser may advertise sharing but reject PDF files. Fall back to download.
    }
  }
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob); link.download = filename; document.body.appendChild(link); link.click(); link.remove();
  setTimeout(() => URL.revokeObjectURL(link.href), 1000);
  return { saved: true, method: 'download' };
}

export async function downloadInvoice(orderId) {
  const invoice = await createInvoicePdf(orderId);
  return saveInvoicePdf(invoice);
}
