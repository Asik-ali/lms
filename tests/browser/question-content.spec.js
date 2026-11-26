import { test, expect } from '@playwright/test';

for (const viewport of [{ width: 1280, height: 900 }, { width: 390, height: 844 }]) {
  test(`question text and zoomable image switch together at ${viewport.width}px`, async ({ page }, testInfo) => {
    test.setTimeout(60000);
    await page.setViewportSize(viewport);
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.route('**/*-question.webp', route => route.fulfill({ contentType: 'image/svg+xml', body: '<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="150"><text x="20" y="40">Original question and options</text></svg>' }));
    await page.goto('/tests/browser/fixtures/question-content.html', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('region', { name: 'Question text' })).toContainText('Find the ratio');
    await expect(page.getByText('10:1', { exact: true })).toBeVisible();
    await expect(page.getByAltText('Original source question and options')).toBeVisible();
    await page.getByRole('button', { name: 'Text', exact: true }).click();
    await expect(page.getByAltText('Original source question and options')).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Text', exact: true })).toHaveAttribute('aria-pressed', 'true');
    await page.getByRole('button', { name: 'Image', exact: true }).click();
    await expect(page.getByRole('region', { name: 'Question text' })).toHaveCount(0);
    await page.getByRole('button', { name: 'Zoom in diagram' }).click();
    await expect(page.getByRole('status')).toHaveText('125%');
    await page.getByRole('button', { name: 'Switch language' }).click();
    await expect(page.getByRole('region', { name: 'Question text' })).toContainText('விகிதத்தைக் காண்க');
    await expect(page.getByAltText('Original source question and options')).toHaveAttribute('src', /ta-question.webp$/);
    await expect(page.getByRole('status')).toHaveText('100%');
    await page.screenshot({ path: testInfo.outputPath('question-content.png'), fullPage: true });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    expect(errors).toEqual([]);
  });
}
