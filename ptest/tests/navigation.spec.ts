import { test, expect } from '@playwright/test';

test('la page d’accueil est accessible', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveURL(/localhost:5173/);
});
