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

  // Direct text PDF avoids the slow html-to-image conversion in Android WebView.
  const { jsPDF } = await import('jspdf');
  const pdf = new jsPDF({ unit: 'mm', format: 'a4' });
  const money = value => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(value);
  const date = new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeZone: 'Asia/Kolkata' }).format(new Date(invoice.date));
  let y = 18;
  const line = (text, size = 10, bold = false, x = 15) => {
    pdf.setFont('helvetica', bold ? 'bold' : 'normal'); pdf.setFontSize(size);
    const lines = pdf.splitTextToSize(String(text), 180 - (x - 15));
    pdf.text(lines, x, y); y += lines.length * (size * 0.46) + 3;
  };
  const newPageIfNeeded = (height = 12) => { if (y + height > 280) { pdf.addPage(); y = 18; } };

  pdf.setFillColor(7, 26, 61); pdf.rect(0, 0, 210, 34, 'F');
  pdf.setTextColor(255, 255, 255); y = 16; line(invoice.seller || 'EXAMSTICK', 18, true); line('TAX INVOICE', 11, true);
  pdf.setTextColor(32, 32, 32); y = 45;
  line(`Invoice no: ${invoice.number}`, 10, true); line(`Invoice date: ${date}`); line(`Order ID: ${invoice.orderId}`); line('Payment status: PAID', 10, true); y += 4;
  line('Bill to', 11, true); line(invoice.customer?.name || 'Student'); line(invoice.customer?.email || ''); y += 4;
  pdf.setFillColor(243, 243, 243); pdf.rect(15, y - 5, 180, 8, 'F');
  pdf.setFont('helvetica', 'bold'); pdf.setFontSize(9); pdf.text('Description', 17, y); pdf.text('Amount', 190, y, { align: 'right' }); y += 9;
  for (const item of invoice.items || []) {
    newPageIfNeeded(18); pdf.setFont('helvetica', 'normal'); pdf.setFontSize(10);
    const description = pdf.splitTextToSize(item.name || 'Course / test purchase', 125);
    pdf.text(description, 17, y); pdf.text(money(item.price), 190, y, { align: 'right' });
    y += Math.max(description.length * 5, 8); pdf.setDrawColor(210); pdf.line(15, y - 3, 195, y - 3); y += 3;
  }
  if (invoice.creditApplied > 0) { newPageIfNeeded(); line(`Store credit applied: ${money(invoice.creditApplied)}`, 10, false, 105); }
  newPageIfNeeded(15); pdf.setFont('helvetica', 'bold'); pdf.setFontSize(13); pdf.text(`TOTAL PAID: ${money(invoice.amount)}`, 195, y + 5, { align: 'right' });
  y += 18; line('Digital products • No physical shipment', 9); line('Thank you for learning with EXAMSTICK.', 9);

  const filename = `${invoice.number.replace(/[^a-zA-Z0-9_-]/g, '-')}.pdf`;
  return { pdf, filename };
}

// Kept separate from generation because Android WebView only permits its
// native share sheet from a direct user click, not after an async fetch/PDF
// generation chain has completed.
export async function saveInvoicePdf({ pdf, filename }) {
  if (Capacitor.isNativePlatform() && Capacitor.isPluginAvailable('InvoiceDownload')) {
    const dataUri = pdf.output('datauristring');
    await InvoiceDownload.savePdf({ base64: dataUri.slice(dataUri.indexOf(',') + 1), filename });
    return;
  }
  const blob = pdf.output('blob');
  const file = new File([blob], filename, { type: 'application/pdf' });
  if (navigator.canShare?.({ files: [file] })) {
    await navigator.share({ files: [file], title: 'EXAMSTICK invoice' });
    return;
  }
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob); link.download = filename; link.click();
  setTimeout(() => URL.revokeObjectURL(link.href), 1000);
}

export async function downloadInvoice(orderId) {
  const invoice = await createInvoicePdf(orderId);
  await saveInvoicePdf(invoice);
}
