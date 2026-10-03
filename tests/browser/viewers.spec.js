import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.route('https://www.youtube.com/**', route => route.fulfill({ body: '<html></html>', contentType: 'text/html' }));
});

test('protected video controls work without clickable provider links', async ({ page }) => {
  await page.goto('/tests/viewers.html');
  await expect(page.getByRole('button', { name: 'Play lesson', exact: true }).last()).toBeEnabled();
  await page.getByRole('button', { name: 'Play lesson', exact: true }).last().click();
  await expect(page.getByRole('button', { name: 'Pause lesson' })).toBeVisible();
  await expect(page.locator('iframe')).toHaveCSS('pointer-events', 'none');
  await expect(page.locator('iframe')).toHaveAttribute('tabindex', '-1');
  await expect(page.locator('iframe')).toHaveAttribute('sandbox', 'allow-scripts allow-same-origin allow-presentation');
  await expect(page.locator('iframe')).toHaveAttribute('referrerpolicy', 'strict-origin-when-cross-origin');
  await page.getByRole('button', { name: 'Mute video' }).click();
  await expect(page.getByRole('button', { name: 'Unmute video' })).toBeVisible();
  await page.getByRole('button', { name: 'Pause lesson' }).click();
  await expect(page.getByRole('button', { name: 'Play lesson', exact: true }).last()).toBeVisible();
  await expect(page.locator('a')).toHaveCount(0);
});

test('video errors remain visible after playback starts', async ({ page }) => {
  await page.goto('/tests/viewers.html');
  await page.getByRole('button', { name: 'Play lesson', exact: true }).last().click();
  await page.evaluate(() => window.simulateVideoError(100));
  await expect(page.getByRole('alert')).toContainText('unavailable or private');
  await expect(page.getByRole('button', { name: 'Pause lesson' })).toBeDisabled();
});

test('direct videos use app controls and retain the viewer watermark', async ({ page }) => {
  // Hold the media request while exercising browser media events deterministically.
  await page.route('**/tests/lesson.mp4', () => {});
  await page.goto('/tests/viewers.html?native', { waitUntil: 'domcontentloaded' });
  await page.locator('video').evaluate(video => {
    Object.defineProperty(video, 'duration', { value: 120 });
    video.play = async () => video.dispatchEvent(new Event('play'));
    video.pause = () => video.dispatchEvent(new Event('pause'));
    video.dispatchEvent(new Event('loadedmetadata'));
  });
  await expect(page.locator('video')).not.toHaveAttribute('controls');
  await page.getByRole('button', { name: 'Play lesson', exact: true }).last().click();
  await expect(page.getByRole('button', { name: 'Pause lesson' })).toBeVisible();
  await expect(page.getByText('student@example.com')).toBeVisible();
  await page.getByRole('button', { name: 'Mute video' }).click();
  await expect.poll(() => page.locator('video').evaluate(video => video.muted)).toBe(true);
  await page.getByRole('combobox', { name: 'Playback speed' }).selectOption('1.5');
  await expect.poll(() => page.locator('video').evaluate(video => video.playbackRate)).toBe(1.5);
  await page.getByRole('button', { name: 'Pause lesson' }).click();
  await expect(page.getByRole('button', { name: 'Play lesson', exact: true }).last()).toBeVisible();
  await page.locator('video').evaluate(video => video.dispatchEvent(new Event('error')));
  await expect(page.getByRole('alert')).toContainText('could not be played');
  await expect(page.getByRole('button', { name: 'Play lesson', exact: true }).last()).toBeDisabled();
});

test('development server routes protected PDF requests to the API', async ({ request }) => {
  const response = await request.post('/api/course-pdf?fileId=1');
  expect(response.status()).toBe(405);
  expect(await response.json()).toEqual({ error: 'Method not allowed' });
});

test('PDF renders with pagination and no Drive browser-opening controls', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/tests/viewers.html');
  const canvas = page.locator('canvas');
  await expect(canvas).toBeVisible();
  await expect(canvas).toHaveAttribute('aria-label', 'Test PDF, page 1');
  await expect.poll(() => canvas.evaluate(element => element.width)).toBeGreaterThan(0);
  await page.getByRole('button', { name: 'Next PDF page' }).click();
  await expect(canvas).toHaveAttribute('aria-label', 'Test PDF, page 2');
  await expect(page.getByRole('button', { name: 'Next PDF page' })).toBeDisabled();
  await page.getByRole('button', { name: 'Zoom in' }).click();
  await expect(page.getByText('125%', { exact: true })).toBeVisible();
  await expect(page.locator('a')).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('website login renders after routing upgrade and validates empty credentials', async ({ page }) => {
  await page.goto('/login');
  await page.getByRole('button', { name: 'Sign In', exact: true }).click();
  await expect(page.getByText('Please enter username and password', { exact: true })).toBeVisible();
});
