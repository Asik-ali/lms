import test from 'node:test';
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { Readable } from 'node:stream';
import { gradeAttempt } from '../src/data/gradeAttempt.js';
import { readRawBody, verifyWebhookSignature } from '../api/_webhook.mjs';
import pdfHandler from '../api/course-pdf.mjs';
import nodemailer from 'nodemailer';
import xcode from 'xcode';

test('grading counts unanswered questions and marked answers without inflating marks', () => {
  const questions = [{ id: 1, correct_answer: 'A' }, { id: 2, correct_answer: 'B' }, { id: 3, correct_answer: 'C' }];
  const result = gradeAttempt(questions, [{ question_id: 1, student_answer: ' a ', status: 'marked' }, { question_id: 2, student_answer: 'D', status: 'answered' }], 10);
  assert.equal(result.correct_count, 1);
  assert.equal(result.wrong_count, 1);
  assert.equal(result.skipped_count, 1);
  assert.equal(result.score, 10 / 3);
  assert.equal(gradeAttempt(questions, [], 10).skipped_count, 3);
});

test('grading ignores responses outside the test', () => {
  assert.equal(gradeAttempt([{ id: 1, correct_answer: 'A' }], [{ question_id: 999, student_answer: 'A' }], 5).score, 0);
});

test('Cashfree signatures authenticate exact bytes and reject tampering or missing headers', () => {
  const body = Buffer.from('{"amount":100.00}');
  const timestamp = '1700000000000';
  const signature = createHmac('sha256', 'test-secret').update(timestamp).update(body).digest('base64');
  assert.ok(verifyWebhookSignature(body, timestamp, signature, 'test-secret'));
  assert.equal(verifyWebhookSignature(Buffer.from('{"amount":100}'), timestamp, signature, 'test-secret'), false);
  assert.equal(verifyWebhookSignature(body, timestamp, signature, 'wrong-secret'), false);
  assert.equal(verifyWebhookSignature(body, timestamp, undefined, 'test-secret'), false);
});

test('raw webhook reads do not invoke a lazy JSON parser', async () => {
  const request = Readable.from([Buffer.from('{"amount":'), Buffer.from('100.00}')]);
  Object.defineProperty(request, 'body', { get() { throw new Error('Body parser must not run'); } });
  assert.equal((await readRawBody(request)).toString(), '{"amount":100.00}');
});

test('oversized webhook bodies are rejected', async () => {
  await assert.rejects(readRawBody(Readable.from([Buffer.alloc(1024 * 1024 + 1)])), /too large/);
});

test('protected PDF endpoint rejects unsupported methods without reading source links', async () => {
  const response = { setHeader() {}, status(code) { this.code = code; return this; }, json(body) { this.body = body; return this; } };
  await pdfHandler({ method: 'POST', headers: {} }, response);
  assert.equal(response.code, 405);
});

test('PDF proxy verifies course access, hides the Drive URL, and returns bounded PDF ranges', async () => {
  const previousFetch = global.fetch;
  const previousUrl = process.env.VITE_SUPABASE_URL;
  const previousKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  process.env.VITE_SUPABASE_URL = 'https://test.supabase.co';
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-key';
  let courseAccess = 'Course One';
  let upstreamCalls = 0;
  const bytes = Buffer.from('%PDF-1.4\nTest document bytes');
  global.fetch = async (url) => {
    const target = String(url);
    if (target.includes('/auth/v1/user')) return Response.json({ id: 'student-id', email: 'student@example.com' });
    if (target.includes('/rest/v1/profiles')) return Response.json({ id: 'student-id', role: 'student', course: courseAccess });
    if (target.includes('/rest/v1/course_pdfs')) return Response.json({ course_id: 1, pdf_url: 'https://drive.google.com/file/d/test-file/view' });
    if (target.includes('/rest/v1/courses')) return Response.json({ title: 'Course One' });
    if (target.startsWith('https://drive.usercontent.google.com/download?')) {
      upstreamCalls++;
      return new Response(bytes, { headers: { 'Content-Type': 'application/pdf' } });
    }
    throw new Error('Unexpected network request');
  };
  const response = () => ({ headers: {}, setHeader(key, value) { this.headers[key] = value; }, status(code) { this.code = code; return this; }, json(body) { this.body = body; return this; }, send(body) { this.body = body; return this; } });
  try {
    const request = { method: 'GET', headers: { authorization: 'Bearer student-token', range: 'bytes=0-1048575' }, query: { fileId: '1' } };
    const success = response();
    await pdfHandler(request, success);
    assert.equal(success.code, 206);
    assert.deepEqual(success.body, bytes);
    assert.equal(success.headers['Content-Range'], `bytes 0-${bytes.length - 1}/${bytes.length}`);
    assert.ok(!JSON.stringify(success.headers).includes('drive.google.com'));
    courseAccess = 'Another Course';
    const denied = response();
    await pdfHandler(request, denied);
    assert.equal(denied.code, 403);
    assert.equal(upstreamCalls, 1);
  } finally {
    global.fetch = previousFetch;
    if (previousUrl === undefined) delete process.env.VITE_SUPABASE_URL; else process.env.VITE_SUPABASE_URL = previousUrl;
    if (previousKey === undefined) delete process.env.SUPABASE_SERVICE_ROLE_KEY; else process.env.SUPABASE_SERVICE_ROLE_KEY = previousKey;
  }
});

test('patched email dependency composes messages without sending mail', async () => {
  const transport = nodemailer.createTransport({ streamTransport: true, buffer: true, newline: 'unix' });
  const message = await transport.sendMail({ from: 'sender@example.com', to: 'recipient@example.com', subject: 'Regression test', text: 'Offline message' });
  assert.match(message.message.toString(), /Subject: Regression test/);
});

test('patched UUID dependency remains compatible with Capacitor project IDs', () => {
  const project = xcode.project('test.pbxproj');
  project.hash = { project: { objects: {} } };
  assert.match(project.generateUuid(), /^[0-9A-F]{24}$/);
});
