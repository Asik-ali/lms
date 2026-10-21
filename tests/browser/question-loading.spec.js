import { test, expect } from '@playwright/test';

test('question list fetches bounded pages, keeps numbering, and retries failed pages', async ({ page }) => {
  const profile = { id: '11111111-1111-4111-8111-111111111111', name: 'Admin', role: 'admin', email: 'admin@example.com' };
  const authUser = { id: profile.id, email: profile.email, user_metadata: { role: 'admin' } };
  await page.addInitScript(user => {
    localStorage.setItem('sb-lms-auth-token', JSON.stringify({access_token: 'token', refresh_token: 'refresh', expires_at: Math.floor(Date.now() / 1000) + 3600, user}));
  }, authUser);
  await page.route('**/auth/v1/**', route => route.fulfill({json: authUser}));
  let failNext = false;
  const requests = [];
  await page.route('**/rest/v1/**', route => {
    const url = new URL(route.request().url());
    const table = url.pathname.split('/').pop();
    if (table === 'questions') {
      const offset = Number(url.searchParams.get('offset') || 0);
      const limit = Number(url.searchParams.get('limit'));
      requests.push({offset, limit, select: url.searchParams.get('select')});
      if (failNext) { failNext = false; return route.fulfill({status: 500, json: {message: 'Temporarily unavailable'}}); }
      const rows = Array.from({length: Math.min(limit, 60 - offset)}, (_, i) => ({id: offset + i + 1, question: `Question ${offset + i + 1}`, option_a: 'One', option_b: 'Two', correct_answer: 'A'}));
      return route.fulfill({headers: {'content-range': `${offset}-${offset + rows.length - 1}/60`}, json: rows});
    }
    const json = table === 'profiles' ? profile : table === 'test_series' ? [{id: 1, name: 'Series One'}]
      : table === 'test_categories' ? [{id: 2, name: 'Section One', series_id: 1, parent_id: null}]
        : table === 'tests' ? [{id: 3, name: 'Test One', category_id: 2, question_count: 60, language: 'Tamil', status: 'Draft'}] : [];
    return route.fulfill({json});
  });
  await page.goto('/admin/exams/questions');
  await page.getByRole('button', {name: /Series One/}).click();
  await page.getByRole('button', {name: /^Section One/}).click();
  await page.getByRole('button', {name: /^Test One/}).click();
  await expect(page.getByText('Page 1 of 3')).toBeVisible();
  await expect(page.getByRole('row')).toHaveCount(26);
  expect(requests[0]).toMatchObject({offset: 0, limit: 25});
  expect(requests[0].select).not.toContain('explanation');
  await page.getByRole('button', {name: 'Next', exact: true}).click();
  await expect(page.getByRole('cell', {name: 'Question 26', exact: true})).toBeVisible();
  failNext = true;
  await page.getByRole('button', {name: 'Next', exact: true}).click();
  await expect(page.getByRole('alert')).toContainText('Could not load questions');
  await page.getByRole('button', {name: 'Retry', exact: true}).click();
  await expect(page.getByRole('cell', {name: 'Question 51', exact: true})).toBeVisible();
  await expect(page.getByRole('row')).toHaveCount(11);
  await expect(page.getByRole('button', {name: 'Next', exact: true})).toBeDisabled();
});
