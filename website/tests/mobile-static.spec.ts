import { expect, test } from '@playwright/test';

for (const width of [320, 390, 600, 900]) {
  test(`mobile pages are static and fit at ${width}px without a reduced-motion preference`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 });
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    for (const route of ['/', '/studio', '/nexus', '/sentry', '/suite', '/hardware']) {
      await page.goto(route);
      await expect(page.locator('header[data-ready]')).toHaveAttribute('data-ready', 'true');
      await expect(page.locator('main h1')).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(width);
      expect(await page.evaluate(() => document.getAnimations().filter(animation => animation.playState === 'running').length)).toBe(0);
      expect(await page.locator('.noise').evaluate(element => getComputedStyle(element).display)).toBe('none');
      if (route === '/') {
        const hero = page.locator('.hero-sticky');
        expect(await hero.evaluate(element => getComputedStyle(element).position)).toBe('relative');
        const windows = await page.locator('.preview-canvas .window').evaluateAll(elements => elements.map(element => {
          const box = element.getBoundingClientRect();
          return { top: box.top, bottom: box.bottom, left: box.left, right: box.right };
        }));
        for (let i = 0; i < windows.length; i++) {
          expect(windows[i].left).toBeGreaterThanOrEqual(8);
          expect(windows[i].right).toBeLessThanOrEqual(width - 8);
          if (i) expect(windows[i].top).toBeGreaterThan(windows[i - 1].bottom + 12);
        }
        await page.evaluate(() => scrollTo(0, 900));
        await expect(hero).toHaveAttribute('data-scene', '0');
        await page.getByRole('button', { name: 'Sentry chapter', exact: true }).click();
        await expect(hero).toHaveAttribute('data-scene', '3');
      }
      if (route === '/suite') {
        await expect(page.locator('[data-workflow-film]')).toHaveAttribute('data-motion', 'reduced');
        await expect(page.locator('[data-workflow-film]')).toBeHidden();
        await expect(page.locator('#workflow-story')).toContainText('Imagine');
        await expect(page.locator('#workflow-story')).toContainText('Evolve');
      }
      if (route === '/sentry') {
        const film = page.locator('[data-sentry-film]');
        await expect(film).toHaveAttribute('data-motion', 'reduced');
        expect(await film.evaluate(element => getComputedStyle(element.firstElementChild!).position)).toBe('relative');
        await page.getByLabel('Verification chapter', { exact: true }).selectOption('7');
        await expect(film).toHaveAttribute('data-stage', '7');
        await expect(film.locator('[data-run-report]')).toBeVisible();
        await film.getByRole('button', { name: /DeepSeek.*Partial output/ }).click();
        await expect(film.locator('[data-report-origin]')).toHaveAttribute('data-report-origin', 'deepseek');
        expect(await film.locator('[data-run-report]').evaluate(element => element.scrollHeight <= element.clientHeight + 1)).toBe(true);
      }
    }
    expect(errors).toEqual([]);
  });
}

test('mobile Nexus examples change only on selection and stay settled', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/nexus');
  for (const name of ['native', 'nova', 'context', 'registry']) {
    const section = page.locator(`[data-motion="${name}"]`);
    const controls = section.locator('[data-motion-controls]');
    await expect(controls).toHaveAttribute('data-static', 'true');
    await controls.getByRole('group').getByRole('button').last().click();
    await expect(section).toHaveAttribute('data-state', 'completed');
    const progress = await section.getAttribute('data-progress');
    await page.waitForTimeout(200);
    expect(await section.getAttribute('data-progress')).toBe(progress);
    await controls.getByRole('button', { name: /Previous|Earlier/ }).click();
    await expect(section).toHaveAttribute('data-state', 'inspecting');
    expect(await section.getAttribute('data-progress')).not.toBe(progress);
  }
});

test('mobile Studio inspections open immediately and retain editing and focus', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/studio');
  const thought = page.locator('[data-desk-object=thought]');
  await thought.click();
  await expect(page.locator('#infinite-desk')).toHaveAttribute('data-motion', 'open');
  await expect(page.getByRole('dialog')).toBeVisible();
  expect(await page.evaluate(() => document.getAnimations().filter(animation => animation.playState === 'running').length)).toBe(0);
  await page.getByLabel('Try another wording').fill('A mobile thought without motion.');
  await page.getByRole('button', { name: /Keep this wording/ }).click();
  await page.keyboard.press('Escape');
  await expect(thought).toContainText('A mobile thought without motion.');
  await expect(page.getByRole('dialog')).not.toBeVisible();
  await expect(thought).toBeFocused();
});

test('resizing from desktop removes the scroll scene and restores it when returning', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/');
  await expect(page.locator('.hero-story')).toHaveAttribute('data-workflow-ready', 'true');
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole('button', { name: 'Nexus chapter', exact: true }).click();
  await expect(page.locator('.hero-sticky')).toHaveAttribute('data-scene', '2');
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.getByRole('button', { name: 'Sentry chapter', exact: true }).click();
  await expect(page.locator('.hero-sticky')).toHaveAttribute('data-scene', '3');
  expect(await page.evaluate(() => scrollY)).toBeGreaterThan(1000);
});

test('a phone rotated to landscape stays static above the width breakpoint', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 956, height: 440 }, isMobile: true, hasTouch: true });
  const page = await context.newPage();
  await page.goto(`${process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000'}/`);
  await expect(page.locator('.hero-story')).toHaveAttribute('data-workflow-ready', 'true');
  expect(await page.locator('.hero-sticky').evaluate(element => getComputedStyle(element).position)).toBe('relative');
  await page.goto(`${process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000'}/nexus`);
  await expect(page.locator('[data-motion-controls]').first()).toHaveAttribute('data-static', 'true');
  expect(await page.evaluate(() => document.getAnimations().filter(animation => animation.playState === 'running').length)).toBe(0);
  await context.close();
});
