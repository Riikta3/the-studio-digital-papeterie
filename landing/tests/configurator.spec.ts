import { test, expect } from '@playwright/test';

test.describe('Configurateur — tunnel complet', () => {
  test('page start charge correctement', async ({ page }) => {
    await page.goto('/fr/studio/start');
    await expect(page).toHaveURL(/studio\/start/);
    await expect(page.locator('body')).not.toBeEmpty();
  });

  test('page plan affiche les offres', async ({ page }) => {
    await page.goto('/fr/studio/plan');
    await expect(page).toHaveURL(/studio\/plan/);
    await expect(page.locator('body')).toContainText(/discovery|essential|premium/i);
  });

  test('page checkout charge avec Stripe Elements', async ({ page }) => {
    await page.goto('/fr/studio/checkout');
    await expect(page).toHaveURL(/studio\/checkout/);
    await expect(
      page.locator('[data-testid="stripe-element"], iframe[name*="stripe"], .StripeElement').first()
    ).toBeVisible({ timeout: 15_000 });
  });
});
