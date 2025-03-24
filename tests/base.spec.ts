import { test, expect } from '@playwright/test';
import { testSetup } from './utils';


test.describe("Layout functions", () => {

  // test.beforeEach(testSetup);
  // test.beforeEach

  test.beforeEach(async ({ page }) => {
    await page.goto("http://localhost:5050");
  })

  test('collapse run controls', async ({ page }) => {
      await page.click('#lock_button');

      await page.waitForTimeout(200); 

      const classList = await page.locator('#run_controls').getAttribute('class');
      expect(classList).toContain('active');
  });
});

