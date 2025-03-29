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

    const locator = page.locator('#canvas_0');
    if( await locator.count() > 0 ) {
      const isVisible = await locator.isVisible();
      expect(isVisible).toBe(true);
    }

    await page.screenshot({ path: 'screenshots/after-new-lane.png' });
  });

  test('lane repeating', async ({ page }) => {
    await page.click('#add_button');
    await page.click('#add_button');

    const canvas_0_locator = page.locator('#canvas_0');
    if( await canvas_0_locator.count() > 0 ) {
      const isVisible = await canvas_0_locator.isVisible();
      expect(isVisible).toBe(true);
    }

    const canvas_1_locator = page.locator('#canvas_1');
    if( await canvas_1_locator.count() > 0 ) {
      const isVisible = await canvas_1_locator.isVisible();
      expect(isVisible).toBe(true);
    }

    await page.screenshot({ path: 'screenshots/test_repeating/lanes_created.png' });

    await page.locator('#edit_mode_button').click();
    await page.locator('canvas#canvas_0').click();
    await page.waitForTimeout(1000); 
    
    const bpmInput = page.locator('.bpm_input').first();
    const measureInput = page.locator('.measure_count_input').first();
    
    await bpmInput.fill('40');
    await measureInput.fill('2');
    
    await page.screenshot({ path: 'screenshots/test_repeating/edit_mode.png' });

    const close = page.locator('.close').first();
    await close.click(); 

    await page.locator('canvas#canvas_1').click();
    await page.waitForTimeout(1000); 
    
    await page.locator('canvas#canvas_1').click();
    await page.waitForTimeout(50); 

    const xpath = '//canvas[@id="canvas_1"]/following-sibling::div[contains(@class, "lane_editing_section")]//button[contains(@class, "repeat_button")]';
    const repeatButton = page.locator(xpath);
    await repeatButton.click();

    await page.waitForTimeout(50); 
     
    const notes = await page.evaluate(() => {
      const canvas = document.getElementById('canvas_1');
      // @ts-ignore
      return window.findLaneFromCanvas(canvas)?.notes || [];
    })
    expect(notes.length).toBe(4); 
  });
});

