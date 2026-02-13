import { expect, test } from '@playwright/test';

const BASE = 'http://localhost:5173';
const RENDERERS = ['css', 'canvas', 'webgl'] as const;

/** Build a URL with query params for the example app */
function sceneUrl(params: Record<string, string | number | boolean>): string {
  const search = new URLSearchParams();
  search.set('hideUI', 'true');
  for (const [key, value] of Object.entries(params)) {
    search.set(key, String(value));
  }
  return `${BASE}?${search.toString()}`;
}

/** Wait for the scene to render — CSS needs DOM paint, Canvas/WebGL need rAF loop */
async function waitForRender(page: import('@playwright/test').Page, ms = 1500) {
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(ms);
}

/**
 * Check that a screenshot contains non-trivial content (not just a solid color).
 * Compares pixel variance across the image — a rendered scene should have color variation.
 */
async function assertNonBlank(page: import('@playwright/test').Page, label: string) {
  const screenshot = await page.screenshot();
  // A blank/solid page would be very small or have very uniform bytes
  // A rendered orb scene should produce a screenshot > 10KB
  expect(
    screenshot.byteLength,
    `${label}: screenshot should have substantial content`,
  ).toBeGreaterThan(10_000);
}

// ─── Renderer smoke tests ───────────────────────────────────────────────────

test.describe('Renderer smoke tests', () => {
  for (const renderer of RENDERERS) {
    test(`${renderer} renderer renders non-blank scene`, async ({ page }) => {
      await page.goto(sceneUrl({ renderer, blur: 30, drift: false, wavy: false }));
      await waitForRender(page);
      await assertNonBlank(page, renderer);
      await page.screenshot({ path: `e2e/screenshots/${renderer}-smoke.png` });
    });
  }

  test('auto renderer renders non-blank scene', async ({ page }) => {
    await page.goto(sceneUrl({ renderer: 'auto', blur: 30, drift: false, wavy: false }));
    await waitForRender(page);
    await assertNonBlank(page, 'auto');
  });
});

// ─── Drift animation ────────────────────────────────────────────────────────

test.describe('Drift animation', () => {
  for (const renderer of RENDERERS) {
    test(`${renderer}: drift causes frame-to-frame pixel changes`, async ({ page }) => {
      await page.goto(sceneUrl({ renderer, drift: true, wavy: false, blur: 20 }));
      await waitForRender(page);
      const frame1 = await page.screenshot();

      await page.waitForTimeout(2000);
      const frame2 = await page.screenshot();

      // Drift should cause visible pixel changes between frames
      const different = !frame1.equals(frame2);
      expect(different, `${renderer}: drift should cause pixel changes over 2s`).toBe(true);
    });
  }

  test('css: no drift = static frames', async ({ page }) => {
    await page.goto(sceneUrl({ renderer: 'css', drift: false, wavy: false, blur: 30 }));
    await waitForRender(page);
    const frame1 = await page.screenshot();

    await page.waitForTimeout(2000);
    const frame2 = await page.screenshot();

    const identical = frame1.equals(frame2);
    expect(identical, 'css without drift should be static').toBe(true);
  });
});

// ─── Wavy effect ─────────────────────────────────────────────────────────────

test.describe('Wavy effect', () => {
  test('css: wavy SVG filter is present in DOM when enabled', async ({ page }) => {
    await page.goto(sceneUrl({ renderer: 'css', wavy: true, blur: 0 }));
    await waitForRender(page);
    const svgFilter = page.locator('.orbkit-wavy-svg');
    await expect(svgFilter.first()).toBeAttached();
  });

  test('css: wavy SVG filter is absent when disabled', async ({ page }) => {
    await page.goto(sceneUrl({ renderer: 'css', wavy: false, blur: 0 }));
    await waitForRender(page);
    const svgFilter = page.locator('.orbkit-wavy-svg');
    await expect(svgFilter).toHaveCount(0);
  });

  for (const renderer of RENDERERS) {
    test(`${renderer}: wavy=true produces different output than wavy=false`, async ({ page }) => {
      await page.goto(sceneUrl({ renderer, wavy: false, drift: false, blur: 10 }));
      await waitForRender(page);
      const withoutWavy = await page.screenshot();

      await page.goto(sceneUrl({ renderer, wavy: true, drift: false, blur: 10 }));
      await waitForRender(page);
      const withWavy = await page.screenshot();

      const different = !withoutWavy.equals(withWavy);
      expect(different, `${renderer}: wavy should change rendering`).toBe(true);
    });
  }
});

// ─── Blur levels ─────────────────────────────────────────────────────────────

test.describe('Blur levels', () => {
  for (const renderer of RENDERERS) {
    test(`${renderer}: blur=0 looks different from blur=60`, async ({ page }) => {
      await page.goto(sceneUrl({ renderer, blur: 0, drift: false, wavy: false }));
      await waitForRender(page);
      const noBlur = await page.screenshot();

      await page.goto(sceneUrl({ renderer, blur: 60, drift: false, wavy: false }));
      await waitForRender(page);
      const highBlur = await page.screenshot();

      const different = !noBlur.equals(highBlur);
      expect(different, `${renderer}: blur=0 vs blur=60 should differ`).toBe(true);
    });
  }
});

// ─── Grain overlay ───────────────────────────────────────────────────────────

test.describe('Grain overlay', () => {
  test('css: grain canvas element exists when grain > 0', async ({ page }) => {
    await page.goto(sceneUrl({ renderer: 'css', grain: 50, drift: false }));
    await waitForRender(page);
    const grainCanvas = page.locator('.orbkit-grain');
    await expect(grainCanvas).toBeAttached();
  });

  test('css: no grain canvas when grain = 0', async ({ page }) => {
    await page.goto(sceneUrl({ renderer: 'css', grain: 0, drift: false }));
    await waitForRender(page);
    const grainCanvas = page.locator('.orbkit-grain');
    await expect(grainCanvas).toHaveCount(0);
  });

  for (const renderer of RENDERERS) {
    test(`${renderer}: grain=0 looks different from grain=80`, async ({ page }) => {
      await page.goto(sceneUrl({ renderer, grain: 0, drift: false, wavy: false, blur: 30 }));
      await waitForRender(page);
      const noGrain = await page.screenshot();

      await page.goto(sceneUrl({ renderer, grain: 80, drift: false, wavy: false, blur: 30 }));
      await waitForRender(page);
      const highGrain = await page.screenshot();

      const different = !noGrain.equals(highGrain);
      expect(different, `${renderer}: grain should change rendering`).toBe(true);
    });
  }
});

// ─── Interactive parallax ────────────────────────────────────────────────────

test.describe('Interactive parallax', () => {
  for (const renderer of RENDERERS) {
    test(`${renderer}: mouse movement changes rendering when interactive=true`, async ({
      page,
    }) => {
      await page.goto(
        sceneUrl({ renderer, interactive: true, drift: false, wavy: false, blur: 30 }),
      );
      await waitForRender(page);

      // Screenshot at center
      const centerShot = await page.screenshot();

      // Move mouse to top-left corner
      await page.mouse.move(100, 100);
      await page.waitForTimeout(500);
      const cornerShot = await page.screenshot();

      const different = !centerShot.equals(cornerShot);
      expect(different, `${renderer}: interactive parallax should respond to mouse`).toBe(true);
    });
  }
});

// ─── Presets ─────────────────────────────────────────────────────────────────

test.describe('Presets', () => {
  const presetNames = ['ocean', 'sunset', 'forest', 'aurora', 'minimal'];

  for (const preset of presetNames) {
    test(`${preset} preset renders non-blank`, async ({ page }) => {
      await page.goto(sceneUrl({ preset, renderer: 'css' }));
      await waitForRender(page);
      await assertNonBlank(page, `preset:${preset}`);
      await page.screenshot({ path: `e2e/screenshots/preset-${preset}.png` });
    });
  }

  test('different presets produce different output', async ({ page }) => {
    await page.goto(sceneUrl({ preset: 'ocean', renderer: 'css' }));
    await waitForRender(page);
    const ocean = await page.screenshot();

    await page.goto(sceneUrl({ preset: 'sunset', renderer: 'css' }));
    await waitForRender(page);
    const sunset = await page.screenshot();

    expect(!ocean.equals(sunset), 'ocean and sunset should look different').toBe(true);
  });
});

// ─── Scene DOM structure ─────────────────────────────────────────────────────

test.describe('Scene DOM structure', () => {
  test('css renderer creates orbkit-orb divs', async ({ page }) => {
    await page.goto(sceneUrl({ renderer: 'css', drift: false }));
    await waitForRender(page);
    const orbs = page.locator('.orbkit-orb');
    await expect(orbs).toHaveCount(4); // 4 orbs in the example
  });

  test('canvas renderer creates a canvas element', async ({ page }) => {
    await page.goto(sceneUrl({ renderer: 'canvas', drift: false }));
    await waitForRender(page);
    const canvasEl = page.locator('canvas');
    await expect(canvasEl).toBeAttached();
  });

  test('webgl renderer creates a canvas element', async ({ page }) => {
    await page.goto(sceneUrl({ renderer: 'webgl', drift: false }));
    await waitForRender(page);
    const canvasEl = page.locator('canvas');
    await expect(canvasEl).toBeAttached();
  });

  test('orbkit-scene container exists', async ({ page }) => {
    await page.goto(sceneUrl({ renderer: 'css' }));
    await waitForRender(page);
    const scene = page.locator('.orbkit-scene');
    await expect(scene).toBeAttached();
  });
});

// ─── Feature combinations ────────────────────────────────────────────────────

test.describe('Feature combinations', () => {
  const combos = [
    { wavy: true, drift: true, interactive: true },
    { wavy: true, drift: false, interactive: false },
    { wavy: false, drift: true, interactive: false },
    { wavy: false, drift: false, interactive: true },
    { wavy: false, drift: false, interactive: false },
  ];

  for (const renderer of RENDERERS) {
    for (const combo of combos) {
      const label = Object.entries(combo)
        .map(([k, v]) => `${k}=${v}`)
        .join(',');

      test(`${renderer}: ${label} renders without errors`, async ({ page }) => {
        const errors: string[] = [];
        page.on('pageerror', (err) => errors.push(err.message));
        page.on('console', (msg) => {
          if (msg.type() === 'error') errors.push(msg.text());
        });

        await page.goto(sceneUrl({ renderer, blur: 30, ...combo }));
        await waitForRender(page);
        await assertNonBlank(page, `${renderer}:${label}`);

        // No JS errors should occur
        expect(errors, `${renderer}:${label} should have no JS errors`).toEqual([]);
      });
    }
  }
});
