import { test, expect } from '@playwright/test';

const studentId = '11111111-1111-4111-8111-111111111111';
async function setup(page, role = 'student') {
  const profile = { id: studentId, role, name: 'Test Student', email: 'student@example.com', status: 'Active', course: '', test_series_access: '' };
  const authUser = { id: studentId, email: profile.email, user_metadata: { role } };
  await page.addInitScript(authUser => {
    localStorage.setItem('sb-lms-auth-token', JSON.stringify({ access_token: 'token', refresh_token: 'refresh', expires_at: Math.floor(Date.now() / 1000) + 3600, user: authUser }));
    window.Cashfree = () => ({ checkout: async () => ({}) });
  }, authUser);
  await page.route('**/auth/v1/**', route => route.fulfill({ json: authUser }));
  await page.route('**/rest/v1/**', route => route.fulfill({ json: new URL(route.request().url()).pathname.endsWith('profiles') ? profile : [] }));
  await page.route('**/api/order-status*', route => {
    const operation = new URL(route.request().url()).searchParams.get('operation');
    const json = operation === 'referral-balance' ? { availableCredit: 100 } : operation === 'referrals' ? {
      code: 'AB12CD34EF56', rewardAmount: 100, availableCredit: 100, count: 1,
      referrals: [{ id: 1, created_at: '2026-10-14T10:00:00Z', qualified_at: '2026-10-14T10:10:00Z', reward_amount: 100, referrer: { name: 'Inviter' }, referred: { name: 'Friend' } }],
    } : { orders: [], purchases: [] };
    return route.fulfill({ json });
  });
}

test('referral link pre-fills signup and remains in the OTP request', async ({ page }) => {
  let request;
  await page.route('**/api/send-signup-otp', route => { request = route.request().postDataJSON(); return route.fulfill({ json: { success: true } }); });
  await page.goto('/signup?ref=AB12CD34EF56');
  await expect(page.getByLabel('Referral code (optional)')).toHaveValue('AB12CD34EF56');
  await page.getByPlaceholder('Your full name').fill('Friend');
  await page.getByPlaceholder('you@example.com').fill('friend@example.com');
  await page.getByPlaceholder('At least 8 characters').fill('password123');
  await page.getByRole('button', { name: 'Send Verification Code' }).click();
  await expect(page.getByPlaceholder('6-digit code')).toBeVisible();
  expect(request.referralCode).toBe('AB12CD34EF56');
});

test('student referrals render credits and a shareable link on mobile', async ({ page }) => {
  await setup(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/student/referrals');
  await expect(page.getByRole('main').getByRole('heading', { name: 'Refer & Earn' })).toBeVisible();
  await expect(page.getByLabel('Referral link')).toHaveValue(/\/signup\?ref=AB12CD34EF56$/);
  await expect(page.getByText('Available store credit: ₹100.00')).toBeVisible();
  await expect(page.getByRole('cell', { name: 'First purchase confirmed' })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test('admin sees referrers and purchase qualification', async ({ page }) => {
  await setup(page, 'admin');
  await page.goto('/admin/referrals');
  await expect(page.getByRole('main').getByRole('heading', { name: 'Student Referrals' })).toBeVisible();
  await expect(page.getByRole('cell', { name: 'Inviter' })).toBeVisible();
  await expect(page.getByRole('cell', { name: 'Friend', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Copy referral link' })).toHaveCount(0);
});

test('referral loading shows a spinner and keeps existing details during refresh', async ({ page }) => {
  await setup(page);
  let release;
  await page.route('**/api/order-status?operation=referrals*', async route => {
    await new Promise(resolve => { release = resolve; });
    await route.fulfill({ json: { code: 'AB12CD34EF56', rewardAmount: 100, availableCredit: 100, count: 0, referrals: [] } });
  });
  await page.goto('/student/referrals');
  await expect(page.getByRole('status')).toContainText('Loading referrals...');
  await expect(page.getByRole('status').locator('svg')).toHaveClass(/animate-spin/);
  await expect.poll(() => typeof release).toBe('function');
  release();
  await expect(page.getByLabel('Your code')).toHaveValue('AB12CD34EF56');
  release = undefined;
  await page.getByRole('button', { name: 'Refresh', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('Updating referrals...');
  await expect(page.getByLabel('Your code')).toHaveValue('AB12CD34EF56');
  await expect(page.getByRole('button', { name: 'Loading...' })).toBeDisabled();
  await expect.poll(() => typeof release).toBe('function');
  release();
  await expect(page.getByRole('status')).toHaveCount(0);
});

test('checkout applies store credit and requests server-side redemption', async ({ page }) => {
  await setup(page);
  await page.route('**/api/sales-plans*', route => route.fulfill({ json: [{ id: 1, name: 'Maths', price: 150, status: 'active', items: [{ item_type: 'course', item_id: 10 }] }] }));
  await page.route('**/rest/v1/sales_plans*', route => route.fulfill({ json: [{ id: 1, name: 'Maths', price: 150, status: 'active' }] }));
  await page.route('**/rest/v1/sales_plan_items*', route => route.fulfill({ json: [{ plan_id: 1, item_type: 'course', item_id: 10 }] }));
  await page.route('**/rest/v1/courses*', route => route.fulfill({ json: [{ id: 10, title: 'Maths', status: 'Published' }] }));
  let request;
  await page.route('**/api/create-order', route => { request = route.request().postDataJSON(); return route.fulfill({ json: { order_id: 'LMS-credit', amount: 50, credit_applied: 100, payment_session_id: 'session' } }); });
  await page.goto('/student/buy-courses');
  await page.getByRole('button', { name: 'Add to cart', exact: true }).click();
  await page.getByRole('checkbox', { name: /Use store credit/ }).check();
  await expect(page.getByRole('button', { name: /Pay .*50\.00/ })).toBeVisible();
  await page.getByRole('button', { name: /Pay .*50\.00/ }).click();
  await expect.poll(() => request).toEqual({ planIds: [1], useCredit: true });
});

for (const status of ['FAILED', 'CANCELLED']) {
  test(`${status.toLowerCase()} checkout returns its used credit and updates history`, async ({ page }) => {
    await setup(page);
    await page.addInitScript(status => {
      window.Cashfree = () => ({ checkout: async () => status === 'FAILED' ? { error: { message: 'Payment failed' } } : {} });
    }, status);
    await page.route('**/rest/v1/sales_plans*', route => route.fulfill({ json: [{ id: 1, name: 'Maths', price: 150, status: 'active' }] }));
    await page.route('**/rest/v1/sales_plan_items*', route => route.fulfill({ json: [{ plan_id: 1, item_type: 'course', item_id: 10 }] }));
    await page.route('**/rest/v1/courses*', route => route.fulfill({ json: [{ id: 10, title: 'Maths', status: 'Published' }] }));
    let created = false, returned = false, closeOperation;
    const order = () => ({ id: 1, order_id: 'LMS-credit', status: returned ? status : 'PENDING', amount: 50, credit_applied: 100, credit_released: returned, created_at: '2026-10-14T10:00:00Z', cart_plans: [{ id: 1, name: 'Maths' }] });
    await page.route('**/api/create-order', route => {
      created = true;
      return route.fulfill({ json: { order_id: 'LMS-credit', amount: 50, credit_applied: 100, payment_session_id: 'session' } });
    });
    await page.route('**/api/order-status*', route => {
      const query = new URL(route.request().url()).searchParams;
      if (query.get('operation') === 'referral-balance') return route.fulfill({ json: { availableCredit: created && !returned ? 0 : 100 } });
      if (route.request().method() === 'POST') {
        closeOperation = query.get('operation');
        expect(route.request().postDataJSON()).toEqual({ orderId: 'LMS-credit' });
        returned = true;
        return route.fulfill({ json: order() });
      }
      return route.fulfill({ json: { orders: created ? [order()] : [], purchases: [] } });
    });
    await page.goto('/student/buy-courses');
    await page.getByRole('button', { name: 'Add to cart', exact: true }).click();
    await page.getByRole('checkbox', { name: /Use store credit/ }).check();
    await page.getByRole('button', { name: /Pay .*50\.00/ }).click();
    await expect.poll(() => closeOperation).toBe(status === 'FAILED' ? 'failed' : 'cancel');
    await expect(page.getByRole('checkbox', { name: /Use store credit .*100\.00 available/ })).toBeVisible();
    await page.getByRole('button', { name: 'My Purchases' }).click();
    await expect(page.getByText(status === 'FAILED' ? 'Failed' : 'Cancelled', { exact: true })).toBeVisible();
    await expect(page.getByRole('cell').filter({ hasText: 'store credit returned' })).toContainText('100.00');
    await expect(page.getByRole('button', { name: 'Cancel order', exact: true })).toHaveCount(0);
  });
}

test('pending history explains Check payment and lets the user cancel an old order', async ({ page }) => {
  await setup(page);
  let cancelled = false;
  const order = () => ({ id: 1, order_id: 'LMS-old', status: cancelled ? 'CANCELLED' : 'PENDING', amount: 1, credit_applied: 99, credit_released: cancelled, created_at: '2026-10-13T10:00:00Z' });
  await page.route('**/api/order-status*', route => {
    if (route.request().method() === 'POST') { cancelled = true; return route.fulfill({ json: order() }); }
    if (new URL(route.request().url()).searchParams.get('operation') === 'referral-balance') return route.fulfill({ json: { availableCredit: cancelled ? 99 : 0 } });
    return route.fulfill({ json: { orders: [order()], purchases: [] } });
  });
  await page.goto('/student/buy-courses');
  await page.getByRole('button', { name: 'My Purchases' }).click();
  await expect(page.getByRole('button', { name: 'Check payment', exact: true })).toHaveAttribute('title', /does not charge you again/);
  await page.getByRole('button', { name: 'Cancel order', exact: true }).click();
  await expect(page.getByText('Cancelled', { exact: true })).toBeVisible();
  await expect(page.getByRole('cell').filter({ hasText: 'store credit returned' })).toContainText('99.00');
});
