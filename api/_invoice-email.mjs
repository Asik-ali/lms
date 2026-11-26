import { buildInvoicePdf } from '../src/data/invoicePdf.js';

export function invoicePdf({ number, orderId, student, email, items, amount, date, creditApplied }) {
  const pdf = buildInvoicePdf({ number, orderId, customer: { name: student, email }, items, amount, date, creditApplied });
  return Buffer.from(pdf.output('arraybuffer'));
}
