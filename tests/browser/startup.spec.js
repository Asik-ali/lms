import { test, expect } from '@playwright/test';

test('startup import failure displays recovery instead of an empty screen', async ({ page }) => {
  await page.route('**/src/startApp.jsx*', route => route.abort());
  await page.goto('/login', { waitUntil: 'domcontentloaded' });
  await expect(page.getByText('Unable to start EXAMSTICK. Check your connection and reload.')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Reload', exact: true })).toBeVisible();
});

test('login renders without runtime errors', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/login', { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible({ timeout: 20000 });
  expect(errors).toEqual([]);
});
