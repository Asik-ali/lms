import { test, expect } from '@playwright/test';

const studentId = '11111111-1111-4111-8111-111111111111';
const plans = [
  { id: 1, name: 'Maths Course', price: 99.99, status: 'active', items: [{ plan_id: 1, item_type: 'course', item_id: 10 }] },
  { id: 2, name: 'Complete Bundle', price: 150.25, status: 'active', items: [{ plan_id: 2, item_type: 'course', item_id: 10 }, { plan_id: 2, item_type: 'test_series', item_id: 20 }] },
];
async function setup(page, role = 'student') {
  const profile = { id: studentId, name: 'Test Student', email: 'test@example.com', role, course: '', test_series_access: '', status: 'Active' };
  const authUser = { id: studentId, email: profile.email, user_metadata: { name: profile.name, role } };
  await page.addInitScript(({ authUser }) => {
    localStorage.setItem('sb-lms-auth-token', JSON.stringify({ access_token: 'test-token', refresh_token: 'test-refresh', token_type: 'bearer', expires_at: Math.floor(Date.now() / 1000) + 3600, user: authUser }));
    window.Cashfree = () => ({ checkout: async () => ({ paymentDetails: {} }) });
  }, { authUser });
  await page.route('**/auth/v1/**', route => route.fulfill({ json: authUser }));
  await page.route('**/rest/v1/**', route => {
    const table = new URL(route.request().url()).pathname.split('/').pop();
    const data = table === 'profiles' ? profile : table === 'sales_plans' ? plans : table === 'sales_plan_items' ? plans.flatMap(p => p.items)
      : table === 'courses' ? [{ id: 10, title: 'Maths', status: 'Published' }] : table === 'test_series' ? [{ id: 20, name: 'SSC' }] : [];
    return route.fulfill({ json: data });
  });
  await page.route('**/api/sales-plans*', route => route.fulfill({ json: route.request().method() === 'GET' ? plans : { id: 3 } }));
  return profile;
}

test('student cards, persistent cart and one verified payment unlock purchased content', async ({ page }) => {
  const profile = await setup(page);
  let requested;
  await page.route('**/api/create-order', route => {
    requested = route.request().postDataJSON();
    return route.fulfill({ json: { order_id: 'LMS-cart', payment_session_id: 'test-session', mode: 'sandbox', amount: 250.24 } });
  });
  await page.route('**/api/order-status*', route => {
    profile.course = 'Maths'; profile.test_series_access = 'SSC';
    return route.fulfill({ json: { order_id: 'LMS-cart', status: 'PAID', cart_plans: plans } });
  });
  await page.goto('/student/buy-courses');
  await expect(page.getByRole('heading', { name: 'Shop Courses & Tests' })).toBeVisible();
  await page.getByRole('button', { name: 'Add to cart', exact: true }).first().click();
  await page.getByRole('button', { name: 'Add to cart', exact: true }).click();
  await expect(page.getByRole('region', { name: 'Shopping cart' })).toContainText('250.24');
  await page.reload();
  await expect(page.getByRole('button', { name: /Pay .*250\.24/ })).toBeVisible();
  await page.getByRole('button', { name: 'Remove Maths Course from cart' }).click();
  await expect(page.getByRole('button', { name: /Pay .*150\.25/ })).toBeVisible();
  await page.getByRole('button', { name: 'Add to cart', exact: true }).click();
  await page.getByRole('button', { name: /Pay .*250\.24/ }).click();
  await expect.poll(() => requested).toEqual({ planIds: [1, 2] });
  await expect(page.getByText('Access unlocked', { exact: true })).toHaveCount(2);
  await expect(page.getByRole('region', { name: 'Shopping cart' })).toHaveCount(0);
});

test('unconfirmed payment retains the cart and locked access', async ({ page }) => {
  await setup(page);
  await page.route('**/api/create-order', route => route.fulfill({ json: { order_id: 'LMS-pending', payment_session_id: 'test-session' } }));
  await page.route('**/api/order-status*', route => route.fulfill({ json: { status: 'PENDING' } }));
  await page.goto('/student/buy-courses');
  await page.getByRole('button', { name: 'Add to cart', exact: true }).first().click();
  await page.getByRole('button', { name: /Pay .*99\.99/ }).click();
  await expect(page.getByText(/Payment is not confirmed yet/)).toBeVisible();
  await expect(page.getByText('Access unlocked', { exact: true })).toHaveCount(0);
  await expect(page.getByRole('region', { name: 'Shopping cart' })).toBeVisible();
});

test('admin can price individual courses and choose all-in-one or custom bundles', async ({ page }) => {
  await setup(page, 'admin');
  let saved;
  await page.route('**/api/sales-plans*', route => {
    if (route.request().method() === 'POST') saved = route.request().postDataJSON();
    return route.fulfill({ json: route.request().method() === 'GET' ? plans : { id: 3 } });
  });
  await page.goto('/admin/sales-plans');
  await page.getByRole('button', { name: 'New Plan' }).click();
  await page.getByRole('combobox', { name: 'Individual course or test series' }).selectOption('course:10');
  await expect(page.getByText(/1 items.*Individual price/)).toBeVisible();
  await page.getByRole('button', { name: 'All-in-one bundle', exact: true }).click();
  await expect(page.getByText(/2 items.*Bundle total price/)).toBeVisible();
  await page.getByRole('button', { name: 'Choose custom bundle' }).click();
  await page.getByRole('button', { name: 'Maths', exact: true }).click();
  await page.getByPlaceholder('e.g. 4999').fill('399.50');
  await page.getByRole('button', { name: 'Create Plan', exact: true }).click();
  await expect.poll(() => saved?.price).toBe(399.5);
  expect(saved.items).toEqual([{ item_type: 'course', item_id: 10 }]);
});
