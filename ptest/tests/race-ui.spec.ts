import { test, expect } from '@playwright/test';

test('l’interface principale affiche un conteneur visible', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('main, #app')).toBeVisible();
});
