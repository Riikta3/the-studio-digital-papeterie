import { test, expect } from '@playwright/test';

test.describe('Landing + RSVP routing', () => {
  test('page accueil landing charge', async ({ page }) => {
    await page.goto('/fr');
    await expect(page).toHaveURL(/\/fr/);
    await expect(page.locator('body')).not.toBeEmpty();
  });

  test('route invitation existe (404 ou 200 acceptés)', async ({ page }) => {
    const response = await page.goto('/fr/invitation/DEMO');
    expect(response?.status()).not.toBe(500);
  });
});
