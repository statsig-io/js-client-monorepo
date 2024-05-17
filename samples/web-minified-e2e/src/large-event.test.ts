import { expect, test } from '@playwright/test';

test('gets green', async ({ page }) => {
  await page.goto('http://localhost:4200/assets/large-event-body.html');

  await new Promise((r) => setTimeout(r, 100));

  const div = page.getByTestId('logged the large_event event');
  expect(await div.getAttribute('x-test-did-pass')).toContain('true');
});
