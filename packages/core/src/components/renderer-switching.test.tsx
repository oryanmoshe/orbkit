import { describe, expect, it } from 'bun:test';
import { renderToString } from 'react-dom/server';
import { Orb } from './orb';
import { OrbScene } from './orb-scene';

describe('Renderer switching', () => {
  describe('CSS renderer (default)', () => {
    it('renders orbs as div elements', () => {
      const html = renderToString(
        <OrbScene>
          <Orb color="#FF0000" />
        </OrbScene>,
      );
      expect(html).toContain('orbkit-orb');
      expect(html).toContain('#FF0000');
    });

    it('renders grain overlay for CSS renderer', () => {
      const html = renderToString(<OrbScene grain={0.5} />);
      expect(html).toContain('orbkit-grain');
    });
  });

  describe('auto renderer', () => {
    it('falls back to CSS in SSR (no document)', () => {
      // In SSR, detectBestRenderer returns 'css' since document is undefined
      const html = renderToString(
        <OrbScene renderer="auto">
          <Orb color="#00FF00" />
        </OrbScene>,
      );
      // Should render as CSS divs since auto-detect returns 'css' in SSR
      expect(html).toContain('orbkit-orb');
      expect(html).toContain('#00FF00');
    });
  });

  describe('renderer prop', () => {
    it('accepts css renderer explicitly', () => {
      const html = renderToString(
        <OrbScene renderer="css">
          <Orb color="#0000FF" />
        </OrbScene>,
      );
      expect(html).toContain('orbkit-orb');
      expect(html).toContain('#0000FF');
    });

    it('accepts canvas renderer prop without errors in SSR', () => {
      // Canvas renderer falls back to CSS-like SSR behavior
      const html = renderToString(
        <OrbScene renderer="canvas">
          <Orb color="#AABBCC" />
        </OrbScene>,
      );
      expect(html).toContain('orbkit-scene');
    });

    it('accepts webgl renderer prop without errors in SSR', () => {
      // WebGL renderer falls back gracefully in SSR
      const html = renderToString(
        <OrbScene renderer="webgl">
          <Orb color="#DDEEFF" />
        </OrbScene>,
      );
      expect(html).toContain('orbkit-scene');
    });
  });

  describe('imperative renderer in SSR', () => {
    it('orbs render null for canvas renderer', () => {
      const html = renderToString(
        <OrbScene renderer="canvas">
          <Orb color="#FF0000" />
        </OrbScene>,
      );
      // Orb should render null (not a div) since renderer is canvas
      expect(html).not.toContain('orbkit-orb');
    });

    it('orbs render null for webgl renderer', () => {
      const html = renderToString(
        <OrbScene renderer="webgl">
          <Orb color="#FF0000" />
        </OrbScene>,
      );
      // Orb should render null since renderer is webgl
      expect(html).not.toContain('orbkit-orb');
    });

    it('does not render grain overlay for imperative renderers', () => {
      const html = renderToString(<OrbScene renderer="canvas" grain={0.5} />);
      // Grain is handled internally by the canvas renderer
      expect(html).not.toContain('orbkit-grain');
    });

    it('preset orbs render null for imperative renderers', () => {
      const html = renderToString(<OrbScene preset="ocean" renderer="canvas" />);
      // Preset orbs should also render null
      expect(html).not.toContain('orbkit-orb');
    });
  });
});
