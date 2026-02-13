# Plan 12: Demo & Showcase Site

## Problem

Beyond documentation, OrbKit needs a visual showcase that demonstrates what's possible — a "wow factor" site that makes developers want to use the library. Think: what Framer Motion's website does for animations, or what Stripe's gradient header does for… well, exactly what we're building.

## Concept

A standalone showcase site (could be the landing page of orbkit.dev) that IS the demo:

### Sections (Scroll-Based)

1. **Hero** — Full-viewport flowing WebGL orb background with the library name. The orbs react to mouse movement. Feels alive.

2. **Presets Gallery** — Grid of cards, each with a live-rendered orb scene. Hover a card to see the animation. Click to see it full-screen.

3. **One-Line Magic** — Shows `<OrbScene preset="aurora" />` and the result renders live next to it. "This is all you need."

4. **Composable Power** — Code on the left, live preview on the right. Step through building up a scene: add first orb, add second, change blend mode, add grain, enable drift. Each step updates the preview.

5. **Renderer Comparison** — Three panels side-by-side: CSS, Canvas, WebGL. Same config, different renderers. Shows the quality/performance tradeoff.

6. **Editor Playground** — Embedded `@orbkit/editor` with live preview. "Design your own."

7. **Copy & Go** — Generated code from the playground, ready to paste into your project.

8. **Community Gallery** — User-submitted configurations rendered live.

### Background Transitions

Each section has a different orb background that crossfades as you scroll. Use Intersection Observer:

```tsx
function ScrollSection({ preset, children }) {
  const ref = useRef();
  const isVisible = useIntersectionObserver(ref, { threshold: 0.5 });

  return (
    <section ref={ref}>
      <OrbScene
        preset={preset}
        style={{ opacity: isVisible ? 1 : 0, transition: 'opacity 0.8s' }}
      />
      {children}
    </section>
  );
}
```

## Tech Stack

- **Framework**: Next.js (App Router)
- **Styling**: Vanilla CSS (dogfooding our zero-deps philosophy)
- **Animations**: OrbKit itself + CSS transitions for scroll effects
- **Deployment**: Vercel

## Key Interactions

### Mouse-Reactive Hero
The hero orbs respond to mouse position — subtle parallax that draws the user in:

```tsx
<OrbScene renderer="webgl" breathing={40}>
  <Orb color="#7C3AED" position={[0.3, 0.3]} size={0.8} interactive drift />
  <Orb color="#06B6D4" position={[0.7, 0.6]} size={0.7} interactive drift wavy />
  <Orb color="#3730A3" position={[0.5, 0.8]} size={0.6} interactive drift />
</OrbScene>
```

### Interactive Code Editor
The composable section has a code editor (Monaco or CodeMirror) that executes live:

```tsx
// User edits this:
<OrbScene background="#0f0f1a">
  <Orb color="#FF6B35" position={[0.3, 0.4]} blur={40} />
</OrbScene>

// Preview updates in real-time
```

Alternatively, simpler: predefined steps with a "stepper" UI instead of a full code editor.

### Shareable Gallery

Users can submit their configs via:
1. Export JSON from the playground
2. Submit via GitHub PR (JSON file in a gallery/ directory)
3. Renders live on the showcase site

## Open Questions

- Combine showcase with docs site (orbkit.dev) or separate?
- How heavy is the full showcase (SSR + WebGL + editor)? May need code splitting.
- Should the showcase work without JS (progressive enhancement)?

## Dependencies

- Requires Phase 1 + Phase 2 for the full showcase
- Hero section needs WebGL renderer
- Editor section needs Phase 3
- Can launch a basic version after Phase 1 (CSS renderer only)

## Priority

This is a medium-priority marketing/adoption effort. Start after core features are solid. The docs site (plan 11) comes first since it serves existing users; the showcase attracts new users.
