function escapePdf(value) { return String(value || '').replace(/[\\()]/g, '\\$&').replace(/[^\x20-\x7E]/g, '?'); }

export function invoicePdf({ number, orderId, student, items, amount, date }) {
  // Marketplace-style design: retail-blue header, neutral cards and a green total.
  const commands = ['0.98 0.98 0.98 rg', '0 0 595 842 re f', '0.07 0.32 0.68 rg', '0 752 595 90 re f', '0.02 0.17 0.42 rg', '0 752 13 90 re f', '1 1 1 rg'];
  const text = (value, x, y, size = 10, bold = false, color = '0.12 0.12 0.12') => {
    commands.push(color, 'BT', `/${bold ? 'F2' : 'F1'} ${size} Tf`, `1 0 0 1 ${x} ${y} Tm`, `(${escapePdf(value)}) Tj`, 'ET');
  };
  text('EXAMSTICK', 48, 808, 22, true, '1 1 1 rg');
  text('LEARN • PRACTICE • SUCCEED', 50, 788, 8, false, '0.78 0.86 1 rg');
  text('PAYMENT INVOICE', 395, 805, 15, true, '1 1 1 rg');
  text('Original for recipient', 407, 788, 8, false, '0.78 0.86 1 rg');
  commands.push('1 1 1 rg', '45 660 505 66 re f', '0.82 G', '45 660 505 66 re S', '0.93 0.96 1 rg', '45 660 6 66 re f');
  text('INVOICE DETAILS', 60, 706, 10, true, '0.07 0.32 0.68 rg'); text(`Invoice no: ${number}`, 60, 686, 10); text(`Order ID: ${orderId}`, 60, 670, 9);
  text('PAYMENT DETAILS', 325, 706, 10, true, '0.07 0.32 0.68 rg'); text(`Invoice date: ${date}`, 325, 686, 10); text('Status: PAID', 325, 670, 10, true, '0.05 0.48 0.27 rg');
  commands.push('1 1 1 rg', '45 574 505 62 re f', '0.82 G', '45 574 505 62 re S', '1 0.78 0.12 rg', '45 574 6 62 re f');
  text('BILL TO', 60, 616, 10, true, '0.07 0.32 0.68 rg'); text(student || 'Student', 60, 596, 11, true); text('Digital learning access', 60, 580, 9, false, '0.35 0.35 0.35 rg');
  commands.push('0.07 0.32 0.68 rg', '45 536 505 26 re f');
  text('DESCRIPTION', 60, 545, 9, true, '1 1 1 rg'); text('QTY', 415, 545, 9, true, '1 1 1 rg'); text('AMOUNT', 485, 545, 9, true, '1 1 1 rg');
  let y = 516;
  const entries = (items?.length ? items : ['Course / test purchase']).slice(0, 12);
  entries.forEach((item, index) => {
    const cleaned = String(item).slice(0, 58);
    text(cleaned, 60, y, 10); text('1', 424, y, 10); text(index === 0 ? amount : 'Included', 530, y, 10, false, '0.12 0.12 0.12 rg');
    commands.push('0.86 G', `45 ${y - 9} m 550 ${y - 9} l S`); y -= 25;
  });
  commands.push('0.91 0.97 0.93 rg', `330 ${y - 42} 220 34 re f`, '0.15 0.60 0.31 RG', `330 ${y - 42} 220 34 re S`);
  text('TOTAL PAID', 345, y - 21, 11, true, '0.05 0.42 0.23 rg'); text(amount, 535, y - 21, 13, true, '0.05 0.42 0.23 rg');
  text('Digital products • No physical shipment', 50, 95, 9, false, '0.35 0.35 0.35 rg');
  text('This is a computer-generated invoice. No signature is required.', 50, 78, 8, false, '0.35 0.35 0.35 rg');
  text('Thank you for learning with EXAMSTICK.', 50, 58, 10, true, '0.03 0.10 0.24 rg');
  const stream = commands.join('\n');
  const objects = ['<< /Type /Catalog /Pages 2 0 R >>', '<< /Type /Pages /Kids [3 0 R] /Count 1 >>', '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>', '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>', '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>', `<< /Length ${Buffer.byteLength(stream)} >>\nstream\n${stream}\nendstream`];
  let pdf = '%PDF-1.4\n'; const offsets = [0];
  objects.forEach((object, index) => { offsets.push(Buffer.byteLength(pdf)); pdf += `${index + 1} 0 obj\n${object}\nendobj\n`; });
  const xref = Buffer.byteLength(pdf); pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n${offsets.slice(1).map(offset => `${String(offset).padStart(10, '0')} 00000 n \n`).join('')}trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return Buffer.from(pdf, 'utf8');
}
