import { chromium } from '@playwright/test';
import { mkdir, readFile } from 'node:fs/promises';
import path from 'node:path';

const output = path.resolve('play-store-assets');
await mkdir(output, { recursive: true });
const logo = `data:image/png;base64,${(await readFile('src/assets/image.png')).toString('base64')}`;
const browser = await chromium.launch({ channel: 'chrome', headless: true });
try {
  const page = await browser.newPage({ deviceScaleFactor: 1 });
  await page.setViewportSize({ width: 512, height: 512 });
  await page.setContent(`<style>body{margin:0;background:#000}img{display:block;width:512px;height:512px}</style><img src="${logo}" alt="EXAMSTICK">`);
  await page.locator('img').evaluate(img => img.decode());
  await page.screenshot({ path: path.join(output, 'app-icon-512.png') });
  await page.setViewportSize({ width: 1024, height: 500 });
  await page.setContent(`<style>*{box-sizing:border-box}body{margin:0;width:1024px;height:500px;background:linear-gradient(125deg,#040c1a,#0b2145);color:#fff;font-family:Arial,sans-serif;display:flex;align-items:center;padding:48px;gap:44px;border-bottom:8px solid #e4b43d}img{width:350px;height:350px;object-fit:contain}h1{font-size:57px;letter-spacing:1px;margin:0 0 20px}h1 span{color:#f3c955}h2{font-size:27px;color:#f3c955;margin:0 0 24px;font-weight:500}p{font-size:22px;line-height:1.7;color:#d6e4fa;margin:0}.line{width:65px;height:4px;background:#f3c955;margin-bottom:25px}</style><img src="${logo}" alt="EXAMSTICK"><div><div class="line"></div><h1>EXAM<span>STICK</span></h1><h2>Stick to Success</h2><p>Courses · Practice tests<br>Learning resources</p></div>`);
  await page.locator('img').evaluate(img => img.decode());
  await page.screenshot({ path: path.join(output, 'feature-graphic-1024x500.png') });
  const mobile = await browser.newPage({ viewport: { width: 360, height: 780 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
  for (const [route, filename] of [['login', 'phone-login.png'], ['signup', 'phone-signup.png']]) {
    await mobile.goto(`http://127.0.0.1:5173/${route}`, { waitUntil: 'domcontentloaded' });
    await mobile.locator('form').waitFor();
    await mobile.locator('img').evaluate(img => img.decode());
    await mobile.evaluate(() => { document.activeElement?.blur(); for (const animation of document.getAnimations()) animation.finish(); });
    await mobile.screenshot({ path: path.join(output, filename) });
  }
  console.log(`Created four Play Store images in ${output}`);
} finally {
  await browser.close();
}
