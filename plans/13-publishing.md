# Plan 13: npm Publishing Pipeline

## Problem

The packages are not published to npm yet. Need a professional publishing pipeline with provenance, changelogs, and trusted publishing.

## Publishing Strategy

### Packages

| Package | npm Name | When to Publish |
|---------|----------|----------------|
| packages/core | `orbkit` | Phase 1 complete |
| packages/editor | `@orbkit/editor` | Phase 3 complete |

### Versioning

Semantic versioning with linked versions across packages:
- `orbkit@0.1.0` + `@orbkit/editor@0.1.0` — versions stay in sync
- Use `bun version` or manual bumps (no Lerna/Changesets for now — two packages is simple enough)

When API stabilizes: `1.0.0` release.

## Build Verification

Before every publish:

```bash
# Clean build
rm -rf packages/core/dist packages/editor/dist
bun run build

# Verify outputs exist
ls packages/core/dist/esm/index.js     # ESM
ls packages/core/dist/cjs/index.cjs    # CJS
ls packages/core/dist/types/index.d.ts  # Types

# Dry-run publish
cd packages/core && npm publish --dry-run
cd packages/editor && npm publish --dry-run

# Validate with publint
npx publint packages/core
npx publint packages/editor

# Check types resolve correctly
npx attw packages/core --pack
```

## Trusted Publishing (npm OIDC)

No more long-lived npm tokens. GitHub Actions authenticates directly with npm via OIDC:

### Setup Steps

1. Go to npmjs.com → package settings → Configure Trusted Publishers
2. Add GitHub Actions as a trusted publisher:
   - Repository: `oryanmoshe/orbkit`
   - Workflow: `publish.yml`
   - Environment: `npm-publish`

### GitHub Actions Workflow

```yaml
# .github/workflows/publish.yml
name: Publish to npm

on:
  release:
    types: [published]

jobs:
  publish:
    runs-on: ubuntu-latest
    environment: npm-publish
    permissions:
      contents: read
      id-token: write  # Required for OIDC / provenance

    steps:
      - uses: actions/checkout@v4

      - uses: oven-sh/setup-bun@v2
        with:
          bun-version: latest

      - run: bun install --frozen-lockfile

      # Build both packages
      - run: bun run build

      # Run tests
      - run: bun run test

      # Typecheck
      - run: bun run typecheck

      # Validate package
      - run: npx publint packages/core
      - run: npx publint packages/editor

      # Setup npm for publishing
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          registry-url: https://registry.npmjs.org

      # Publish core first (editor depends on it)
      - run: cd packages/core && npm publish --provenance --access public

      # Publish editor
      - run: cd packages/editor && npm publish --provenance --access public

    # Note: No NPM_TOKEN needed! OIDC handles authentication.
```

### GitHub Environment

Create a `npm-publish` environment in GitHub repo settings:
- Protection rules: require approval from maintainer
- No branch restrictions (triggered only by releases)

## Release Process

1. **Update version** in both `packages/core/package.json` and `packages/editor/package.json`
2. **Update CHANGELOG.md** with release notes
3. **Commit**: `🔖 chore: release v0.1.0`
4. **Tag**: `git tag v0.1.0`
5. **Push**: `git push origin main --tags`
6. **Create GitHub Release** from the tag — this triggers the publish workflow
7. **Verify** on npmjs.com that both packages are published with provenance badge

### Future: Automated with Changesets

When the project grows, adopt [Changesets](https://github.com/changesets/changesets):
- Contributors add changeset files describing their changes
- CI aggregates changesets into version bumps + changelog
- Release PR auto-generated
- Merge release PR → auto-publish

For now, manual versioning is simpler for a two-package monorepo.

## Package Validation Checklist

Before each release, verify:

- [ ] `package.json` `exports` field is correct
- [ ] `files` field only includes `dist`
- [ ] `sideEffects: false` for tree-shaking
- [ ] `peerDependencies` are correct (react ^18 || ^19)
- [ ] No dev dependencies leaked into production
- [ ] `main`, `module`, `types` fields point to correct files
- [ ] ESM import works: `import { OrbScene } from 'orbkit'`
- [ ] CJS require works: `const { OrbScene } = require('orbkit')`
- [ ] TypeScript types resolve for both ESM and CJS consumers
- [ ] Bundle size is reasonable (< 15KB gzipped for core)
- [ ] No `console.log` in production code
- [ ] README is up-to-date with current API

## CHANGELOG

Maintain `CHANGELOG.md` in the root:

```markdown
# Changelog

## [0.1.0] - 2026-XX-XX

### Added
- `<OrbScene>` component with preset support
- `<Orb>` component with drift animation
- `<Grain>` canvas noise overlay
- 5 built-in presets: ocean, sunset, forest, aurora, minimal
- CSS renderer (default)
- Color utilities: hexToHsl, hslToHex, applySaturation
```

## npm README

The published npm package should have a focused README (can differ from the repo README):
- Quick install command
- Minimal usage example
- Link to full docs
- Badge: npm version, bundle size, license

## Files to Create

| File | Purpose |
|------|---------|
| `.github/workflows/publish.yml` | Publish workflow |
| `CHANGELOG.md` | Release changelog |

## Files to Modify

| File | Change |
|------|--------|
| `packages/core/package.json` | Verify all publish-related fields |
| `packages/editor/package.json` | Verify all publish-related fields |
