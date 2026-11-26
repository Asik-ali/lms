import test from 'node:test';
import assert from 'node:assert/strict';
import { buildInvoicePdf } from '../src/data/invoicePdf.js';
import { invoicePdf } from '../api/_invoice-email.mjs';

test('invoice generation supports long descriptions and every item across pages',()=>{
 const pdf=buildInvoicePdf({number:'INV-TEST',orderId:'ORDER-TEST',date:'2026-11-26T00:00:00Z',amount:1234.5,creditApplied:50,customer:{name:'Test Student'},items:Array.from({length:48},(_,i)=>({name:`Course ${i+1}: ${'Long course description '.repeat(10)}`,price:30}))});
 assert.ok(pdf.getNumberOfPages()>2);
 assert.ok(pdf.output('arraybuffer').byteLength>1000);
});
test('email invoices are valid PDF files with more than twelve items',()=>{
 const bytes=invoicePdf({number:'INV-EMAIL',orderId:'EMAIL-ORDER',student:'Student',items:Array.from({length:30},(_,i)=>({name:`Lesson ${i+1}`,price:50})),amount:'INR 1,500.00',date:'2026-11-26'});
 assert.equal(bytes.subarray(0,5).toString(),'%PDF-');assert.ok(bytes.length>1000);
 assert.throws(()=>buildInvoicePdf({amount:NaN}),/Invalid invoice amount/);
});
