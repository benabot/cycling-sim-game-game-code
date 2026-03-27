import { test, expect } from '@playwright/test';

test('l’application charge', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('body')).toBeVisible();
});
