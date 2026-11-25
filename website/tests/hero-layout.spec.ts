import { expect, test } from '@playwright/test';

for (const [width, height] of [[320, 568], [390, 844], [600, 844], [768, 1024], [1280, 720], [1512, 769], [1440, 1000], [2560, 1440]]) {
  test(`hero content stays separated through all chapters at ${width}×${height}`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    await page.goto('/');
    await expect(page.locator('.hero-story')).toHaveAttribute('data-workflow-ready', 'true');
    for (let scene = 0; scene < 5; scene++) {
      await page.locator('.scene-btn').nth(scene).click();
      await expect(page.locator('.hero-sticky')).toHaveAttribute('data-scene', String(scene));
      await page.locator('.hero-sticky').evaluate(async hero => {
        await Promise.allSettled(hero.getAnimations({ subtree: true })
          .filter(animation => animation.effect?.getTiming().iterations !== Infinity)
          .map(animation => animation.finished));
      });
      const layout = await page.locator('.hero-sticky').evaluate(hero => {
        const box = (selector: string) => hero.querySelector(selector)!.getBoundingClientRect();
        const actions = box('.ctas');
        const meta = box('.workflow-meta');
        const caption = box('.scene-description');
        const controls = box('.stage-bottom');
        const windows = Array.from(hero.querySelectorAll('.window'), window => window.getBoundingClientRect());
        return {
          actionsClear: windows.every(window => window.top >= actions.bottom + 12),
          metadataClear: windows.every(window => window.bottom <= meta.top - 12),
          controlsClear: caption.bottom + 12 <= controls.top || caption.right + 12 <= controls.left,
          controlsContained: controls.left >= 0 && controls.right <= innerWidth,
          noOverflow: document.documentElement.scrollWidth === innerWidth,
        };
      });
      expect(layout).toEqual({ actionsClear: true, metadataClear: true, controlsClear: true, controlsContained: true, noOverflow: true });
    }
  });
}

for (const height of [720, 769, 900, 1000]) {
  test(`desktop scroll animation stays active at ${height}px high`, async ({ page }) => {
    await page.setViewportSize({ width: 1512, height });
    await page.goto('/');
    await expect(page.locator('.hero-story')).toHaveAttribute('data-workflow-ready', 'true');
    expect(await page.locator('.hero-sticky').evaluate(hero => getComputedStyle(hero).position)).toBe('sticky');
    const travel = await page.locator('.hero-story').evaluate(hero => hero.clientHeight - innerHeight);
    expect(travel).toBeGreaterThan(height);
    for (const [progress, scene] of [[.2, '1'], [.45, '2'], [.67, '3'], [.9, '4'], [0, '0']] as const) {
      await page.evaluate(y => scrollTo({ top: y, behavior: 'instant' }), travel * progress);
      await expect(page.locator('.hero-sticky')).toHaveAttribute('data-scene', scene);
      expect(Math.abs((await page.locator('.hero-sticky').boundingBox())!.y)).toBeLessThan(1);
    }
  });
}
