import { test, expect } from '@playwright/test';
import { testSetup } from './utils';

test.describe("Layout functions", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("http://localhost:5050");
  })

  test('collapse run controls', async ({ page }) => {
      await page.screenshot({ path: 'screenshots/before-click.png' });

      await page.click('#expand_button');

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

  test('Assign lane input', async ({ page }) => {
    await page.click('#add_button');

    const locator = page.locator('#canvas_0');
    if( await locator.count() > 0 ) {
      const isVisible = await locator.isVisible();
      expect(isVisible).toBe(true);
    }

    await page.locator('.change_lane_key').locator('button').click(); 

    await page.screenshot({ path: 'screenshots/button.png' });
    await page.keyboard.down('A');

    const lane = await page.evaluate(() => {
      const canvas = document.getElementById('canvas_0');
      // @ts-ignore
      return window.findLaneFromCanvas(canvas);
    })

    expect(lane.inputKey).toBe('A');
  });

  test('Add notes in individual placement mode', async ({ page }) => {
    await page.click('#add_button');

    const canvas_0_locator = page.locator('#canvas_0');
    if( await canvas_0_locator.count() > 0 ) {
      const isVisible = await canvas_0_locator.isVisible();
      expect(isVisible).toBe(true);
    }

    await page.locator('#edit_mode_button').click();
    await page.locator('canvas#canvas_0').click();
    await page.waitForTimeout(1000); 
    await page.locator('canvas#canvas_0').click();

    const notes = await page.evaluate(() => {
      const canvas = document.getElementById('canvas_0');
      // @ts-ignore
      return window.findLaneFromCanvas(canvas)?.notes || [];
    })
    expect(notes.length).toBe(1); 
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

  test('Create new pattern and load it', async ({ page }) => {
    await page.click('#add_button');

    const canvas_0_locator = page.locator('#canvas_0');
    if( await canvas_0_locator.count() > 0 ) {
      const isVisible = await canvas_0_locator.isVisible();
      expect(isVisible).toBe(true);
    }

    await page.locator('#edit_mode_button').click();
    await page.locator('canvas#canvas_0').click();
    await page.waitForTimeout(1000); 

    await page.locator('.pattern_mode_button').click(); 

    await page.locator('.create_pattern').click(); 
    await page.locator('canvas#canvas_0').click();

    await page.locator('.pattern_name').fill('pattern'); 
    await page.locator('.save_pattern').click(); 
    await page.locator('.close_pattern').click(); 
    await page.waitForTimeout(250); 

    let pattern =  page.locator('.pattern_name_container');
    await expect(pattern).toHaveText('pattern');

    await pattern.hover();
    await page.mouse.down();
    await page.locator('.pattern_drop_zone').hover();
    await page.mouse.up();

    const notes = await page.evaluate(() => {
      const canvas = document.getElementById('canvas_0');
      // @ts-ignore
      return window.findLaneFromCanvas(canvas)?.notes || [];
    })
    expect(notes.length).toBe(1); 
  });

  test('Sign in then save and load session', async ({ page }) => {
    // Signin
    await page.click('#user_button');
    await page.locator('#email').fill('user1@gmail.com');
    await page.locator('#password').fill('111111');

    await page.locator('.auth-form-button ').click(); 
    await page.waitForTimeout(1000); 
    await page.screenshot({ path: 'screenshots/signin.png' });
    await page.locator('.closeContainer ').click(); 

    // Add lane
    await page.click('#add_button');
    const canvas_0_locator = page.locator('#canvas_0');
    if( await canvas_0_locator.count() > 0 ) {
      const isVisible = await canvas_0_locator.isVisible();
      expect(isVisible).toBe(true);
    }

    // Change input
    await page.locator('.change_lane_key').locator('button').click(); 
    await page.keyboard.down('A');

    // Add note
    await page.locator('#edit_mode_button').click();
    await page.locator('canvas#canvas_0').click();
    await page.waitForTimeout(1000); 
    await page.locator('canvas#canvas_0').click();

    
    // Save session
    await page.locator('#save_workspace_button').click(); 
    await page.locator('#session_name_input').fill('saved session');
    await page.locator('#save_session_button').click(); 
    await page.screenshot({ path: 'screenshots/save.png' });

    // Load session
    await page.locator('#open_workspace_load_button').click(); 
    await page.locator('.tab').nth(1).click(); 
    await page.waitForTimeout(1000); 

    let session = await page.locator('.load_content');
    expect(session).toContainText('saved session');

    await session.click();
    await page.waitForTimeout(1000); 

    await page.screenshot({ path: 'screenshots/loaded_session.png' });
    
    const lane = await page.evaluate(() => {
      const canvas = document.getElementById('canvas_0');
      // @ts-ignore
      return window.findLaneFromCanvas(canvas);
    })

    expect(lane.inputKey).toBe('A');
    expect(lane.notes.length).toBe(1);
  });

  test('Play session and reach stats screen', async ({ page }) => {
    
  });
});
