import { test, expect } from '@playwright/test';
import path from 'path';

test('Rendering a minified StatsigProvider', async ({ page }) => {
  await page.goto(
    `file://${path.resolve(__dirname, './minified_import_test/index.html')}`,
  );
  await expect(page.getByText('a_gate: Pass')).toBeVisible();
});
