import { test, expect } from '@playwright/test';
import { testSetup } from './utils';


test.describe("Layout functions", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("http://localhost:5050");
  })

  test('collapse run controls', async ({ page }) => {
      await page.screenshot({ path: 'screenshots/before-click.png' });

      await page.click('#lock_button');

      await page.waitForTimeout(200); 

      const classList = await page.locator('#run_controls').getAttribute('class');
      expect(classList).toContain('active');

      await page.screenshot({ path: 'screenshots/after-click.png' });
  });

  test('create new lane', async ({ page }) => {
    await page.click('#add_button');

    await page.waitForTimeout(200); 

    const locator = page.locator('#canvas_0');
    if( await locator.count() > 0 ) {
      const isVisible = await locator.isVisible();
      expect(isVisible).toBe(true);
    }

    await page.screenshot({ path: 'screenshots/after-new-lane.png' });
  });
});

