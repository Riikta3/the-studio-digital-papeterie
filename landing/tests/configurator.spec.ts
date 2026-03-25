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
    // Pré-alimenter le store Zustand (persist key: "order-store-v2")
    // Le checkout appelle /api/create-payment-intent avec le plan du store
    await page.goto('/fr/studio/plan');
    await page.evaluate(() => {
      const storeState = {
        state: {
          plan: 'essential',
          animation: 'envelope-classic',
          theme: 'theme-floral',
          modules: [],
          primaryLanguage: 'fr',
          languages: [],
          adultsOnly: false,
          extras: [],
          weddingInfo: {
            partner1: 'Test',
            partner2: 'User',
            day: '15',
            month: 'Juin',
            year: '2027',
            venue: '',
            email: 'test@example.com',
            password: 'testpassword123',
          },
          _hasHydrated: true,
          emailExists: false,
        },
        version: 0,
      };
      localStorage.setItem('order-store-v2', JSON.stringify(storeState));
    });
    await page.goto('/fr/studio/checkout');
    await expect(page).toHaveURL(/studio\/checkout/);
    // Stripe Elements prend ~10s à charger (API call + iframe mount)
    await expect(
      page.locator('iframe[name*="__privateStripeFrame"], iframe[title*="Stripe"], iframe[src*="stripe"]').first()
    ).toBeVisible({ timeout: 20_000 });
  });
});
