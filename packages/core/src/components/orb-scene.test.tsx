import { describe, expect, it } from 'bun:test';
import { renderToString } from 'react-dom/server';
import { ocean, presets, registerPreset } from '../presets';
import type { Preset } from '../types';
import { Orb } from './orb';
import { OrbScene } from './orb-scene';

describe('OrbScene preset resolution', () => {
  it('renders orbs from preset="ocean"', () => {
    const html = renderToString(<OrbScene preset="ocean" />);
    // Ocean has 3 orbs with these colors
    expect(html).toContain('#4A90D9');
    expect(html).toContain('#D4836D');
    expect(html).toContain('#E8DCC8');
  });

  it('uses preset background color', () => {
    const html = renderToString(<OrbScene preset="ocean" />);
    expect(html).toContain(ocean.backgroundColor);
  });

  it('explicit background overrides preset', () => {
    const html = renderToString(<OrbScene preset="ocean" background="#FF0000" />);
    expect(html).toContain('#FF0000');
    expect(html).not.toContain(ocean.backgroundColor);
  });

  it('auto-injects grain from preset', () => {
    const html = renderToString(<OrbScene preset="ocean" />);
    // Ocean has grain=35, which becomes 0.35 — grain > 0 so Grain should render
    expect(html).toContain('orbkit-grain');
  });

  it('explicit grain=0 overrides preset grain', () => {
    const html = renderToString(<OrbScene preset="ocean" grain={0} />);
    expect(html).not.toContain('orbkit-grain');
  });

  it('preset + children composition renders both', () => {
    const html = renderToString(
      <OrbScene preset="ocean">
        <Orb color="#FF0000" />
      </OrbScene>,
    );
    // Preset orbs
    expect(html).toContain('#4A90D9');
    // Custom child orb
    expect(html).toContain('#FF0000');
  });

  it('invalid preset name renders children only', () => {
    const html = renderToString(
      <OrbScene preset="nonexistent">
        <Orb color="#ABCDEF" />
      </OrbScene>,
    );
    expect(html).toContain('#ABCDEF');
    // Should not contain any preset orb colors
    expect(html).not.toContain('#4A90D9');
  });

  it('no preset renders children only', () => {
    const html = renderToString(
      <OrbScene>
        <Orb color="#123456" />
      </OrbScene>,
    );
    expect(html).toContain('#123456');
  });

  it('registerPreset adds custom preset', () => {
    const custom: Preset = {
      name: 'test-custom',
      label: 'Test Custom',
      backgroundColor: '#AABBCC',
      points: [{ id: 'tc1', color: '#DDEEFF', position: [0.5, 0.5], radius: 0.8 }],
      saturation: 50,
      grain: 20,
      breathing: 25,
    };
    registerPreset(custom);

    const html = renderToString(<OrbScene preset="test-custom" />);
    expect(html).toContain('#AABBCC');
    expect(html).toContain('#DDEEFF');

    // Cleanup — biome noDelete: Record value can't be set to undefined
    // biome-ignore lint/performance/noDelete: test cleanup of mutable registry
    delete presets['test-custom'];
  });

  it('all 5 built-in presets render without errors', () => {
    for (const name of Object.keys(presets)) {
      const html = renderToString(<OrbScene preset={name} />);
      expect(html).toContain('orbkit-scene');
      expect(html).toContain('orbkit-orb');
    }
  });
});
