import { supabase } from '../supabase/client';
import { apiUrl } from './api';
import logoUrl from '../assets/image.png';

export async function downloadInvoice(orderId) {
  const { data: { session } } = await supabase.auth.getSession();
  const response = await fetch(apiUrl(`/api/order-status?operation=invoice&orderId=${encodeURIComponent(orderId)}`), {
    headers: { Authorization: `Bearer ${session?.access_token || ''}` },
  });
  const invoice = await response.json();
  if (!response.ok) throw new Error(invoice.error || 'Unable to generate invoice');
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([import('html2canvas'), import('jspdf')]);
  const sheet = document.createElement('div');
  // Plain DOM text preserves Unicode titles and prevents markup injection.
  sheet.style.cssText = 'position:absolute;left:-10000px;top:0;width:760px;padding:48px;background:#fff;color:#172b46;font:15px Arial,sans-serif;line-height:1.6;box-sizing:border-box;';
  const add = (text, css = '', parent = sheet) => {
    const element = document.createElement('div');
    element.textContent = text;
    element.style.cssText = css;
    parent.appendChild(element);
    return element;
  };
  const logo = document.createElement('img');
  logo.src = logoUrl;
  logo.alt = invoice.seller;
  logo.style.cssText = 'display:block;width:160px;height:80px;object-fit:contain;object-position:left center;margin-bottom:16px;';
  sheet.appendChild(logo);
  add('PAYMENT INVOICE', 'font-size:12px;letter-spacing:2px;margin-bottom:28px;color:#62748b;');
  add(invoice.number, 'font-size:18px;font-weight:bold;overflow-wrap:anywhere;');
  add(`Issued: ${new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeZone: 'Asia/Kolkata' }).format(new Date(invoice.date))}`);
  add(`Order: ${invoice.orderId}`, 'font-size:12px;color:#62748b;overflow-wrap:anywhere;');
  add('PAID', 'margin:16px 0;color:#167044;font-weight:bold;');
  add('BILLED TO', 'font-size:11px;letter-spacing:1px;color:#62748b;margin-top:24px;');
  add(invoice.customer.name || 'Student', 'font-weight:bold;');
  add(invoice.customer.email || '', 'margin-bottom:28px;overflow-wrap:anywhere;');
  add('PURCHASE DETAILS', 'padding:12px 0;border-bottom:2px solid #d8e3f0;font-weight:bold;font-size:12px;letter-spacing:1px;');
  const money = value => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(value);
  for (const item of invoice.items) {
    const row = add('', 'display:flex;justify-content:space-between;gap:24px;padding:16px 0;border-bottom:1px solid #e5ecf4;');
    add(item.name, 'flex:1;overflow-wrap:anywhere;', row);
    add(money(item.price), 'white-space:nowrap;font-weight:bold;', row);
  }
  add(`Total paid: ${money(invoice.amount)}`, 'text-align:right;font-size:24px;font-weight:bold;padding:24px 0;');
  add('Thank you for learning with EXAMSTICK.', 'font-size:12px;color:#62748b;border-top:1px solid #d8e3f0;padding-top:20px;');
  document.body.appendChild(sheet);
  try {
    await logo.decode();
    await document.fonts.ready;
    const canvas = await html2canvas(sheet, { scale: 1.5, backgroundColor: '#ffffff', logging: false });
    const pdf = new jsPDF({ unit: 'mm', format: 'a4' });
    const pageWidth = 190;
    const sliceHeight = Math.floor(canvas.width * 277 / pageWidth);
    for (let offset = 0; offset < canvas.height; offset += sliceHeight) {
      if (offset) pdf.addPage();
      const slice = document.createElement('canvas');
      slice.width = canvas.width;
      slice.height = Math.min(sliceHeight, canvas.height - offset);
      slice.getContext('2d').drawImage(canvas, 0, offset, canvas.width, slice.height, 0, 0, slice.width, slice.height);
      pdf.addImage(slice.toDataURL('image/png'), 'PNG', 10, 10, pageWidth, slice.height * pageWidth / slice.width);
    }
    pdf.save(`${invoice.number.replace(/[^a-zA-Z0-9_-]/g, '-')}.pdf`);
  } finally {
    sheet.remove();
  }
}
