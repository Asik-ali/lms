function escapePdf(value) { return String(value || '').replace(/[\\()]/g, '\\$&').replace(/[^\x20-\x7E]/g, '?'); }

export function invoicePdf({ number, orderId, student, items, amount, date }) {
  const lines = ['EXAMSTICK', 'PAYMENT INVOICE', '', `Invoice: ${number}`, `Order ID: ${orderId}`, `Date: ${date}`, 'Status: PAID', '', `Bill to: ${student || 'Student'}`, '', 'Items:', ...(items || []).map((item, index) => `${index + 1}. ${item}`), '', `TOTAL PAID: ${amount}`, '', 'Digital products - no physical shipment.', 'Thank you for learning with EXAMSTICK.'];
  const commands = ['BT', '/F1 18 Tf', '50 790 Td', `(${escapePdf(lines[0])}) Tj`, '/F1 11 Tf'];
  let y = 760;
  for (const line of lines.slice(1, 42)) { commands.push(`1 0 0 1 50 ${y} Tm`, `(${escapePdf(line)}) Tj`); y -= 16; }
  commands.push('ET'); const stream = commands.join('\n');
  const objects = ['<< /Type /Catalog /Pages 2 0 R >>', '<< /Type /Pages /Kids [3 0 R] /Count 1 >>', '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>', '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>', `<< /Length ${Buffer.byteLength(stream)} >>\nstream\n${stream}\nendstream`];
  let pdf = '%PDF-1.4\n'; const offsets = [0];
  objects.forEach((object, index) => { offsets.push(Buffer.byteLength(pdf)); pdf += `${index + 1} 0 obj\n${object}\nendobj\n`; });
  const xref = Buffer.byteLength(pdf); pdf += `xref\n0 6\n0000000000 65535 f \n${offsets.slice(1).map(offset => `${String(offset).padStart(10, '0')} 00000 n \n`).join('')}trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return Buffer.from(pdf, 'utf8');
}
