# Plan 14: Testing Strategy

## Current State

- **Unit tests exist**: `color.test.ts` (10 tests), `animation.test.ts` (11 tests)
- **No component tests**: `<Orb>`, `<OrbScene>`, `<Grain>` are untested
- **No visual regression tests**: No screenshots or snapshots
- **No integration tests**: No end-to-end scene rendering verification
- **Test runner**: `bun test` (built-in, vitest-compatible API)

## Testing Layers

### 1. Unit Tests (Already Partial)

Test pure functions in isolation:

| Module | Coverage | Status |
|--------|----------|--------|
| `utils/color.ts` | 100% | Done |
| `utils/animation.ts` | 100% | Done |
| `renderers/css-renderer.ts` | 0% | Needed |
| `utils/keyframe-registry.ts` | 0% | After Plan 02 |
| `utils/export-jsx.ts` (editor) | 0% | After Plan 09 |

**What to test**:
- CSS renderer generates valid CSS strings
- Keyframe registry injects/removes style tags
- Export utilities produce valid JSX/JSON/CSS

### 2. Component Tests

Test React components with `@testing-library/react`:

```typescript
import { render, screen } from '@testing-library/react';
import { OrbScene, Orb, Grain } from 'orbkit';

describe('OrbScene', () => {
  it('renders with correct background color', () => {
    const { container } = render(
      <OrbScene background="#1a1a1a">
        <Orb color="#4A90D9" />
      </OrbScene>
    );
    const scene = container.querySelector('.orbkit-scene');
    expect(scene?.style.backgroundColor).toBe('#1a1a1a');
  });

  it('resolves preset into orbs', () => {
    const { container } = render(<OrbScene preset="ocean" />);
    const orbs = container.querySelectorAll('.orbkit-orb');
    expect(orbs.length).toBe(3); // ocean has 3 points
  });

  it('renders as custom element', () => {
    const { container } = render(<OrbScene as="section" />);
    expect(container.querySelector('section.orbkit-scene')).toBeTruthy();
  });
});

describe('Orb', () => {
  it('applies radial gradient', () => {
    const { container } = render(<Orb color="#FF0000" />);
    const orb = container.querySelector('.orbkit-orb');
    expect(orb?.style.background).toContain('radial-gradient');
  });

  it('applies blur filter', () => {
    const { container } = render(<Orb color="#FF0000" blur={60} />);
    const orb = container.querySelector('.orbkit-orb');
    expect(orb?.style.filter).toContain('blur(60px)');
  });
});

describe('Grain', () => {
  it('renders canvas element', () => {
    const { container } = render(<Grain intensity={0.5} />);
    const canvas = container.querySelector('canvas');
    expect(canvas).toBeTruthy();
  });
});
```

**Dependencies**: `@testing-library/react` + `happy-dom` (or `jsdom`) for Bun test environment.

### 3. Snapshot Tests

Capture component output structure:

```typescript
it('matches snapshot for preset ocean', () => {
  const { container } = render(<OrbScene preset="ocean" />);
  expect(container.innerHTML).toMatchSnapshot();
});
```

**Caution**: Snapshot tests are brittle for visual components. Use sparingly — only for structure, not styles.

### 4. Visual Regression Tests

Capture screenshots of rendered orb scenes and compare against baselines:

**Tool options**:
- **Playwright** — headless browser screenshots, built-in comparison
- **Chromatic** — Storybook-based visual testing (if we adopt Storybook/Ladle)
- **Percy** — cloud-based visual diff service
- **Custom** — Playwright script that renders examples and compares PNGs

**Recommended: Playwright** (already familiar from DreamTeam testing)

```typescript
// tests/visual/orb-scene.visual.ts
import { test, expect } from '@playwright/test';

test('preset ocean renders correctly', async ({ page }) => {
  await page.goto('http://localhost:5173/presets/ocean');
  await page.waitForTimeout(1000); // Wait for animation to settle

  // Mask the animated elements for deterministic comparison
  await expect(page).toHaveScreenshot('preset-ocean.png', {
    maxDiffPixelRatio: 0.05, // Allow 5% diff for animation state
  });
});
```

**Challenge**: Orb animations make screenshots non-deterministic. Solutions:
- Freeze animations via a `paused` prop
- Use a specific `time` prop to set animation to frame 0
- Accept higher diff thresholds (5-10%)
- Only screenshot static presets (no drift)

### 5. Performance Benchmarks

Track rendering performance across changes:

```typescript
// tests/perf/render-benchmark.ts
import { performance } from 'perf_hooks';

function benchmarkRender(orbCount: number) {
  const start = performance.now();

  for (let i = 0; i < 100; i++) {
    render(
      <OrbScene background="#000">
        {Array.from({ length: orbCount }, (_, j) => (
          <Orb key={j} color="#FF0000" />
        ))}
      </OrbScene>
    );
  }

  const end = performance.now();
  return (end - start) / 100; // Average ms per render
}

// Assert performance budgets
expect(benchmarkRender(3)).toBeLessThan(5);   // 3 orbs < 5ms
expect(benchmarkRender(10)).toBeLessThan(15); // 10 orbs < 15ms
```

### 6. Bundle Size Tracking

Monitor bundle size to prevent bloat:

```yaml
# In CI
- name: Check bundle size
  run: |
    bun run build
    SIZE=$(du -b packages/core/dist/esm/index.js | cut -f1)
    GZIP=$(gzip -c packages/core/dist/esm/index.js | wc -c)
    echo "ESM: ${SIZE} bytes, gzipped: ${GZIP} bytes"
    if [ "$GZIP" -gt 15000 ]; then
      echo "::error::Bundle size exceeds 15KB gzipped limit"
      exit 1
    fi
```

## Test File Locations

```
packages/core/src/
  utils/
    color.test.ts            ✅ exists
    animation.test.ts        ✅ exists
    keyframe-registry.test.ts   (after Plan 02)
  components/
    orb.test.tsx             (new)
    orb-scene.test.tsx       (new)
    grain.test.tsx           (new)
  renderers/
    css-renderer.test.ts     (new)

tests/
  visual/                    (Playwright visual tests)
  perf/                      (Performance benchmarks)
```

## CI Integration

```yaml
# Extend .github/workflows/ci.yml
- name: Unit tests
  run: bun run test

- name: Visual tests
  run: npx playwright test tests/visual/
  if: github.event_name == 'pull_request'

- name: Bundle size check
  run: ./scripts/check-bundle-size.sh
```

## Dependencies to Add

| Package | Purpose | Where |
|---------|---------|-------|
| `@testing-library/react` | Component testing | devDependencies (core) |
| `happy-dom` | DOM environment for Bun | devDependencies (core) |
| `@playwright/test` | Visual regression | devDependencies (root) |

## Priority

1. **Component tests** — immediately after Phase 1 (validate wiring works)
2. **CSS renderer tests** — alongside component tests
3. **Bundle size tracking** — add to CI now (cheap, high value)
4. **Visual regression** — after examples are built (need a page to screenshot)
5. **Performance benchmarks** — before v1.0 release
