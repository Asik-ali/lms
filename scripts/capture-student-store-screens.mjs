import { chromium } from '@playwright/test';
import { mkdir } from 'node:fs/promises';

const credentials = { email: process.env.STORE_CAPTURE_EMAIL, password: process.env.STORE_CAPTURE_PASSWORD };
const output = 'play-store-assets';
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
  await page.goto('https://asiklms.vercel.app/login', { waitUntil: 'domcontentloaded' });
  await page.locator('input[type="text"]').first().fill(credentials.email);
  await page.locator('input[type="password"]').fill(credentials.password);
  await page.getByRole('button', { name: 'Sign In', exact: true }).click();
  await page.waitForURL('**/student', { timeout: 45000 });
  for (const [route, file] of [['/student', 'phone-student-dashboard.png'], ['/student/courses', 'phone-student-courses.png'], ['/student/test-series', 'phone-student-tests.png'], ['/student/free-test-series', 'phone-free-tests.png']]) {
    await page.goto(`https://asiklms.vercel.app${route}`, { waitUntil: 'domcontentloaded' });
    await page.locator('main').waitFor();
    await page.waitForTimeout(2500);
    await page.evaluate(() => { document.activeElement?.blur(); for (const a of document.getAnimations()) { try { a.finish(); } catch {} } });
    await page.screenshot({ path: `${output}/${file}`, mask: route === '/student' ? [page.getByRole('heading', { name: /Welcome back/ })] : [], maskColor: '#0b2447' });
    console.log(`Captured ${file}`);
  }
  await page.goto('https://asiklms.vercel.app/student/courses', { waitUntil: 'domcontentloaded' });
  await page.getByRole('button', { name: 'View Course' }).first().click();
  await page.waitForTimeout(3000);
  await page.screenshot({ path: `${output}/phone-course-materials.png` });
  console.log('Captured phone-course-materials.png');
} catch {
  console.log('Capture failed: unable to sign in or load a student screen.');
  process.exitCode = 1;
} finally { await browser.close(); }
