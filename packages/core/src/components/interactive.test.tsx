import { describe, expect, it } from 'bun:test';
import { renderToString } from 'react-dom/server';
import { Orb } from './orb';
import { OrbScene } from './orb-scene';

describe('Interactive hover effects', () => {
  it('applies parallax transform when interactive is true', () => {
    const html = renderToString(
      <OrbScene>
        <Orb color="#FF0000" interactive />
      </OrbScene>,
    );
    expect(html).toContain('var(--orbkit-mx');
    expect(html).toContain('var(--orbkit-my');
    expect(html).toContain('transition');
  });

  it('does not apply parallax when interactive is false', () => {
    const html = renderToString(
      <OrbScene>
        <Orb color="#FF0000" interactive={false} />
      </OrbScene>,
    );
    expect(html).not.toContain('var(--orbkit-mx');
  });

  it('does not apply parallax when interactive is omitted', () => {
    const html = renderToString(
      <OrbScene>
        <Orb color="#FF0000" />
      </OrbScene>,
    );
    expect(html).not.toContain('var(--orbkit-mx');
  });

  it('scene sets initial mouse position custom properties', () => {
    const html = renderToString(
      <OrbScene>
        <Orb color="#FF0000" interactive />
      </OrbScene>,
    );
    expect(html).toContain('--orbkit-mx:0.5');
    expect(html).toContain('--orbkit-my:0.5');
  });

  it('renders wrapper div when both drift and interactive', () => {
    const html = renderToString(
      <OrbScene>
        <Orb color="#FF0000" drift interactive />
      </OrbScene>,
    );
    // Wrapper div has the drift class
    expect(html).toContain('orbkit-orb-drift');
    // Inner div has interactive transform
    expect(html).toContain('var(--orbkit-mx');
  });

  it('does not render wrapper div with only drift (no interactive)', () => {
    const html = renderToString(
      <OrbScene>
        <Orb color="#FF0000" drift />
      </OrbScene>,
    );
    expect(html).not.toContain('orbkit-orb-drift');
  });

  it('does not render wrapper div with only interactive (no drift)', () => {
    const html = renderToString(
      <OrbScene>
        <Orb color="#FF0000" interactive />
      </OrbScene>,
    );
    expect(html).not.toContain('orbkit-orb-drift');
  });

  it('uses orb position for parallax offset calculation', () => {
    const html = renderToString(
      <OrbScene>
        <Orb color="#FF0000" position={[0.3, 0.7]} interactive />
      </OrbScene>,
    );
    // The transform calc should reference the orb's position values in the parallax offset
    expect(html).toMatch(/translate\(calc\(.*0\.3.*\).*calc\(.*0\.7.*\)\)/);
  });
});
