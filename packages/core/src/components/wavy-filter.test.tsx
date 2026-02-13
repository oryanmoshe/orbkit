import { describe, expect, it } from 'bun:test';
import { renderToString } from 'react-dom/server';
import { Orb } from './orb';
import { OrbScene } from './orb-scene';

describe('WavyFilter', () => {
  it('renders SVG filter when wavy is true', () => {
    const html = renderToString(
      <OrbScene>
        <Orb color="#FF0000" wavy />
      </OrbScene>,
    );
    expect(html).toContain('feTurbulence');
    expect(html).toContain('feDisplacementMap');
    expect(html).toContain('orbkit-wavy-');
  });

  it('does not render SVG filter when wavy is false', () => {
    const html = renderToString(
      <OrbScene>
        <Orb color="#FF0000" wavy={false} />
      </OrbScene>,
    );
    expect(html).not.toContain('feTurbulence');
    expect(html).not.toContain('feDisplacementMap');
  });

  it('does not render SVG filter when wavy is omitted', () => {
    const html = renderToString(
      <OrbScene>
        <Orb color="#FF0000" />
      </OrbScene>,
    );
    expect(html).not.toContain('feTurbulence');
  });

  it('applies wavy config scale to displacement', () => {
    const html = renderToString(
      <OrbScene>
        <Orb color="#FF0000" wavy={{ scale: 50 }} />
      </OrbScene>,
    );
    // scale=50 → displacement scale attribute should be 50
    expect(html).toContain('scale="50"');
  });

  it('applies wavy config speed to animation duration', () => {
    const html = renderToString(
      <OrbScene>
        <Orb color="#FF0000" wavy={{ speed: 2 }} />
      </OrbScene>,
    );
    // speed=2 → duration = 8/2 = 4s
    expect(html).toContain('dur="4s"');
  });

  it('applies wavy config intensity to octaves', () => {
    const html = renderToString(
      <OrbScene>
        <Orb color="#FF0000" wavy={{ intensity: 5 }} />
      </OrbScene>,
    );
    expect(html).toContain('numOctaves="5"');
  });

  it('clamps octaves between 1 and 6', () => {
    const htmlHigh = renderToString(
      <OrbScene>
        <Orb color="#FF0000" wavy={{ intensity: 10 }} />
      </OrbScene>,
    );
    expect(htmlHigh).toContain('numOctaves="6"');

    const htmlLow = renderToString(
      <OrbScene>
        <Orb color="#FF0000" wavy={{ intensity: 0 }} />
      </OrbScene>,
    );
    expect(htmlLow).toContain('numOctaves="1"');
  });

  it('generates unique filter IDs per orb', () => {
    const html = renderToString(
      <OrbScene>
        <Orb color="#FF0000" wavy />
        <Orb color="#00FF00" wavy />
      </OrbScene>,
    );
    // Extract all orbkit-wavy-* filter IDs
    const ids = html.match(/orbkit-wavy-[^"]+/g) ?? [];
    const uniqueIds = new Set(ids);
    // Should have at least 2 unique IDs (one per wavy orb)
    expect(uniqueIds.size).toBeGreaterThanOrEqual(2);
  });

  it('combines wavy filter with blur in filter CSS', () => {
    const html = renderToString(
      <OrbScene>
        <Orb color="#FF0000" wavy blur={50} />
      </OrbScene>,
    );
    // Should have both url() reference and blur()
    expect(html).toContain('url(#orbkit-wavy-');
    expect(html).toContain('blur(50px)');
  });
});
