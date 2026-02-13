import { describe, expect, it } from 'bun:test';
import { renderToString } from 'react-dom/server';
import { Orb } from '../components/orb';
import { OrbScene } from '../components/orb-scene';
import type { OrbSceneContextValue } from '../types';
import { useOrbSceneContext } from './orb-scene-context';

describe('OrbScene context', () => {
  it('renders children inside the scene', () => {
    const html = renderToString(
      <OrbScene background="#1a1a1a">
        <Orb color="#FF0000" />
      </OrbScene>,
    );
    expect(html).toContain('orbkit-scene');
    expect(html).toContain('orbkit-orb');
  });

  it('auto-injects Grain when grain > 0', () => {
    const html = renderToString(
      <OrbScene grain={0.35}>
        <Orb color="#FF0000" />
      </OrbScene>,
    );
    expect(html).toContain('orbkit-grain');
  });

  it('does not inject Grain when grain is 0', () => {
    const html = renderToString(
      <OrbScene grain={0}>
        <Orb color="#FF0000" />
      </OrbScene>,
    );
    expect(html).not.toContain('orbkit-grain');
  });

  it('does not inject Grain by default', () => {
    const html = renderToString(
      <OrbScene>
        <Orb color="#FF0000" />
      </OrbScene>,
    );
    expect(html).not.toContain('orbkit-grain');
  });

  it('applies background color', () => {
    const html = renderToString(<OrbScene background="#0f0f1a" />);
    expect(html).toContain('#0f0f1a');
  });

  it('renders with custom element tag', () => {
    const html = renderToString(<OrbScene as="section" />);
    expect(html).toContain('<section');
  });

  it('orb works standalone without scene', () => {
    const html = renderToString(<Orb color="#7C3AED" position={[0.2, 0.25]} />);
    expect(html).toContain('orbkit-orb');
    expect(html).toContain('#7C3AED');
  });

  it('useOrbSceneContext returns null outside scene', () => {
    let contextValue: ReturnType<typeof useOrbSceneContext> = undefined as never;

    function TestConsumer() {
      contextValue = useOrbSceneContext();
      return <div>test</div>;
    }

    renderToString(<TestConsumer />);
    expect(contextValue).toBeNull();
  });

  it('useOrbSceneContext returns values inside scene', () => {
    const captured: { value: OrbSceneContextValue | null } = { value: null };

    function TestConsumer() {
      captured.value = useOrbSceneContext();
      return <div>test</div>;
    }

    renderToString(
      <OrbScene background="#123456" grain={0.5} breathing={40} renderer="canvas">
        <TestConsumer />
      </OrbScene>,
    );

    const ctx = captured.value;
    expect(ctx).not.toBeNull();
    expect(ctx?.background).toBe('#123456');
    expect(ctx?.grain).toBe(0.5);
    expect(ctx?.breathing).toBe(40);
    expect(ctx?.renderer).toBe('canvas');
  });

  it('registerOrb returns monotonically increasing indices', () => {
    const indices: number[] = [];

    function OrbCollector() {
      const ctx = useOrbSceneContext();
      if (ctx) {
        indices.push(ctx.registerOrb());
      }
      return <div />;
    }

    renderToString(
      <OrbScene>
        <OrbCollector />
        <OrbCollector />
        <OrbCollector />
      </OrbScene>,
    );

    expect(indices).toEqual([0, 1, 2]);
  });
});
