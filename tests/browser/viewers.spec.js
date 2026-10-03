import { test, expect } from '@playwright/test';

test('protected video controls work without clickable provider links', async ({ page }) => {
  await page.goto('/tests/viewers.html');
  await expect(page.getByRole('button', { name: 'Play lesson', exact: true }).last()).toBeEnabled();
  await page.getByRole('button', { name: 'Play lesson', exact: true }).last().click();
  await expect(page.getByRole('button', { name: 'Pause lesson' })).toBeVisible();
  await expect(page.locator('iframe')).toHaveCSS('pointer-events', 'none');
  await expect(page.locator('iframe')).toHaveAttribute('tabindex', '-1');
  await expect(page.locator('iframe')).toHaveAttribute('sandbox', 'allow-scripts allow-same-origin');
  await page.getByRole('button', { name: 'Mute video' }).click();
  await expect(page.getByRole('button', { name: 'Unmute video' })).toBeVisible();
  await page.getByRole('button', { name: 'Pause lesson' }).click();
  await expect(page.getByRole('button', { name: 'Play lesson', exact: true }).last()).toBeVisible();
  await expect(page.locator('a')).toHaveCount(0);
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
