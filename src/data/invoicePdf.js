import { jsPDF } from 'jspdf';

const amountValue = value => {
  const amount = typeof value === 'number' ? value : Number(String(value ?? 0).replace(/[^0-9.-]/g, ''));
  if (!Number.isFinite(amount) || amount < 0) throw new Error('Invalid invoice amount.');
  return amount;
};
const money = value => `INR ${amountValue(value).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export function buildInvoicePdf(invoice) {
  const pdf = new jsPDF({ unit: 'mm', format: 'a4', compress: true });
  const total = money(invoice.amount);
  const dateValue = new Date(invoice.date);
  const date = Number.isNaN(dateValue.getTime()) ? String(invoice.date || '') : new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeZone: 'Asia/Kolkata' }).format(dateValue);
  let y = 0;
  const header = () => {
    pdf.setFillColor(7, 26, 61); pdf.rect(0, 0, 210, 32, 'F');
    pdf.setFont('helvetica', 'bold'); pdf.setFontSize(20); pdf.setTextColor(255, 212, 71); pdf.text('EXAMSTICK', 15, 15);
    pdf.setFontSize(9); pdf.setTextColor(220, 231, 248); pdf.text('PAYMENT INVOICE', 15, 24);
    pdf.setTextColor(25, 43, 65); y = 44;
  };
  const ensureSpace = height => { if (y + height > 270) { pdf.addPage(); header(); } };
  const text = (value, { size = 10, bold = false, width = 180, x = 15 } = {}) => {
    pdf.setFont('helvetica', bold ? 'bold' : 'normal'); pdf.setFontSize(size);
    const lines = pdf.splitTextToSize(String(value ?? ''), width);
    for (const line of lines) {
      ensureSpace(6); pdf.setFont('helvetica', bold ? 'bold' : 'normal'); pdf.setFontSize(size); pdf.text(line, x, y); y += size * .45 + 1;
    }
    y += 2;
  };
  const tableHeader = () => {
    ensureSpace(12); pdf.setFillColor(234, 241, 250); pdf.rect(15, y - 5, 180, 9, 'F');
    pdf.setFont('helvetica', 'bold'); pdf.setFontSize(9); pdf.text('DESCRIPTION', 18, y); pdf.text('AMOUNT', 192, y, { align: 'right' }); y += 12;
  };
  header();
  text(`Invoice no: ${invoice.number || 'Invoice'}`, { bold: true });
  text(`Invoice date: ${date}`); text(`Order ID: ${invoice.orderId || ''}`); text('Payment status: PAID', { bold: true }); y += 4;
  text('BILL TO', { size: 9, bold: true }); text(invoice.customer?.name || 'Student', { bold: true }); text(invoice.customer?.email || ''); y += 4;
  tableHeader();
  for (const item of invoice.items?.length ? invoice.items : [{ name: 'Course / test purchase' }]) {
    pdf.setFont('helvetica', 'normal'); pdf.setFontSize(10);
    const name = typeof item === 'string' ? item : item.name || 'Course / test purchase';
    const lines = pdf.splitTextToSize(String(name), 125);
    if (y + Math.min(lines.length * 5 + 6, 30) > 270) { pdf.addPage(); header(); tableHeader(); }
    const price = typeof item === 'object' && item.price != null ? money(item.price) : 'Included';
    pdf.text(price, 192, y, { align: 'right' });
    for (const line of lines) {
      if (y + 6 > 270) { pdf.addPage(); header(); tableHeader(); pdf.setFont('helvetica', 'normal'); pdf.setFontSize(10); }
      pdf.text(line, 18, y); y += 5;
    }
    y += 4; pdf.setDrawColor(219, 228, 239); pdf.line(15, y, 195, y); y += 8;
  }
  ensureSpace(45);
  if (Number(invoice.creditApplied) > 0) text(`Store credit applied: ${money(invoice.creditApplied)}`, { width: 180 });
  pdf.setFillColor(234, 246, 239); pdf.rect(15, y - 4, 180, 15, 'F');
  pdf.setFont('helvetica', 'bold'); pdf.setFontSize(12); pdf.setTextColor(22, 101, 52);
  pdf.text('TOTAL PAID', 20, y + 5); pdf.text(total, 190, y + 5, { align: 'right' });
  y += 24; pdf.setTextColor(75, 90, 110); text('Digital products - No physical shipment.', { size: 9 });
  text('Thank you for learning with EXAMSTICK.', { size: 9 });
  const pages = pdf.getNumberOfPages();
  for (let page = 1; page <= pages; page++) {
    pdf.setPage(page); pdf.setFont('helvetica', 'normal'); pdf.setFontSize(8); pdf.setTextColor(95, 110, 130);
    pdf.text('Computer-generated payment invoice. No signature required.', 15, 286);
    pdf.text(`${page} / ${pages}`, 195, 286, { align: 'right' });
  }
  pdf.setProperties({ title: `${invoice.number || 'Invoice'} - EXAMSTICK`, author: 'EXAMSTICK' });
  return pdf;
}
