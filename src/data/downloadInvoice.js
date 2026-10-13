import { supabase } from '../supabase/client';
import { apiUrl } from './api';
import logoUrl from '../assets/invoice-logo-transparent.png';

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
  sheet.style.cssText = 'position:absolute;left:-10000px;top:0;width:760px;padding:36px;background:#fff;color:#202020;font:12px Arial,sans-serif;line-height:1.5;box-sizing:border-box;';
  const add = (text, css = '', parent = sheet) => {
    const element = document.createElement('div');
    element.textContent = text;
    element.style.cssText = css;
    parent.appendChild(element);
    return element;
  };
  const header = add('', 'display:flex;justify-content:space-between;align-items:center;border-bottom:2px solid #222;padding-bottom:16px;');
  const logo = document.createElement('img');
  logo.src = logoUrl;
  logo.alt = invoice.seller;
  // Use intrinsic dimensions: html2canvas does not reliably reproduce object-fit.
  logo.style.cssText = 'display:block;width:110px;height:auto;max-width:110px;flex-shrink:0;';
  header.appendChild(logo);
  const heading = add('', 'text-align:right;', header);
  add('INVOICE', 'font-size:24px;font-weight:bold;letter-spacing:1px;', heading);
  add('Original for recipient', 'font-size:10px;color:#666;', heading);
  const date = new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeZone: 'Asia/Kolkata' }).format(new Date(invoice.date));
  const metadata = add('', 'display:flex;gap:24px;padding:18px 0;border-bottom:1px solid #ccc;');
  const reference = add('', 'flex:1;overflow-wrap:anywhere;', metadata);
  add('Invoice details', 'font-weight:bold;margin-bottom:6px;', reference);
  add(`Invoice no: ${invoice.number}`, '', reference);
  add(`Invoice date: ${date}`, '', reference);
  const payment = add('', 'flex:1;overflow-wrap:anywhere;', metadata);
  add('Order details', 'font-weight:bold;margin-bottom:6px;', payment);
  add(`Order ID: ${invoice.orderId}`, '', payment);
  add('Payment status: PAID', 'font-weight:bold;color:#167044;', payment);
  const parties = add('', 'display:flex;gap:24px;padding:20px 0;');
  const seller = add('', 'flex:1;', parties);
  add('Sold by', 'font-weight:bold;margin-bottom:6px;', seller);
  add(invoice.seller, 'font-weight:bold;', seller);
  add('Online courses and test series', 'color:#666;', seller);
  const buyer = add('', 'flex:1;overflow-wrap:anywhere;', parties);
  add('Bill to', 'font-weight:bold;margin-bottom:6px;', buyer);
  add(invoice.customer.name || 'Student', 'font-weight:bold;', buyer);
  add(invoice.customer.email || '', '', buyer);
  add('Digital delivery to student account', 'color:#666;margin-top:4px;', buyer);
  const money = value => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(value);
  const table = document.createElement('table');
  table.style.cssText = 'width:100%;border-collapse:collapse;table-layout:fixed;margin:8px 0 0;';
  sheet.appendChild(table);
  const cell = (row, text, heading = false, css = '') => {
    const element = document.createElement(heading ? 'th' : 'td');
    element.textContent = text;
    element.style.cssText = `padding:12px 10px;border:1px solid #bbb;vertical-align:top;text-align:left;overflow-wrap:anywhere;${css}`;
    row.appendChild(element);
  };
  const columnHeaders = document.createElement('tr');
  table.appendChild(columnHeaders);
  ['S.No', 'Description', 'Qty', 'Unit price', 'Amount'].forEach((text, index) => cell(columnHeaders, text, true,
    `background:#f3f3f3;${index === 0 ? 'width:42px;white-space:nowrap;text-align:center;' : index === 1 ? 'width:250px;' : index === 2 ? 'width:44px;white-space:nowrap;text-align:center;' : 'text-align:right;white-space:nowrap;'}`));
  invoice.items.forEach((item, index) => {
    const row = document.createElement('tr'); table.appendChild(row);
    cell(row, String(index + 1), false, 'text-align:center;white-space:nowrap;'); cell(row, item.name); cell(row, '1', false, 'text-align:center;white-space:nowrap;');
    cell(row, money(item.price), false, 'text-align:right;'); cell(row, money(item.price), false, 'text-align:right;');
  });
  const total = add('', 'display:flex;justify-content:flex-end;border-bottom:2px solid #222;padding:18px 0;');
  add('TOTAL PAID', 'font-weight:bold;margin-right:28px;padding-top:4px;', total);
  add(money(invoice.amount), 'font-size:20px;font-weight:bold;', total);
  add('Digital products • No physical shipment', 'font-size:10px;color:#666;margin-top:20px;');
  add('Thank you for learning with EXAMSTICK.', 'font-size:11px;color:#444;margin-top:6px;');
  document.body.appendChild(sheet);
  try {
    await logo.decode();
    logo.style.height = `${110 * logo.naturalHeight / logo.naturalWidth}px`;
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
