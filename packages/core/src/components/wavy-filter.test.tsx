import { describe, expect, it } from 'bun:test';
import { renderToString } from 'react-dom/server';
import { Orb } from './orb';
import { OrbScene } from './orb-scene';

describe('Wavy (Blob Morph)', () => {
  it('renders blob div when wavy is true', () => {
    const html = renderToString(
      <OrbScene>
        <Orb color="#FF0000" wavy />
      </OrbScene>,
    );
    expect(html).toContain('orbkit-orb-blob');
    expect(html).toContain('radial-gradient(circle');
    expect(html).toContain('border-radius:50%');
  });

  it('does not render blob div when wavy is false', () => {
    const html = renderToString(
      <OrbScene>
        <Orb color="#FF0000" wavy={false} />
      </OrbScene>,
    );
    expect(html).not.toContain('orbkit-orb-blob');
  });

  it('does not render blob div when wavy is omitted', () => {
    const html = renderToString(
      <OrbScene>
        <Orb color="#FF0000" />
      </OrbScene>,
    );
    expect(html).not.toContain('orbkit-orb-blob');
  });

  it('renders positioned blob with centered gradient', () => {
    const html = renderToString(
      <OrbScene>
        <Orb color="#FF0000" wavy position={[0.3, 0.7]} />
      </OrbScene>,
    );
    expect(html).toContain('left:30%');
    expect(html).toContain('top:70%');
    expect(html).toContain('translate(-50%, -50%)');
  });

  it('applies blur to blob', () => {
    const html = renderToString(
      <OrbScene>
        <Orb color="#FF0000" wavy blur={25} />
      </OrbScene>,
    );
    expect(html).toContain('blur(25px)');
  });

  it('applies blend mode to blob', () => {
    const html = renderToString(
      <OrbScene>
        <Orb color="#FF0000" wavy blendMode="overlay" />
      </OrbScene>,
    );
    expect(html).toContain('overlay');
  });

  it('renders multiple wavy orbs independently', () => {
    const html = renderToString(
      <OrbScene>
        <Orb color="#FF0000" wavy />
        <Orb color="#00FF00" wavy />
      </OrbScene>,
    );
    const blobCount = (html.match(/orbkit-orb-blob/g) ?? []).length;
    expect(blobCount).toBeGreaterThanOrEqual(2);
  });

  it('non-wavy orbs use full-bleed gradient approach', () => {
    const html = renderToString(
      <OrbScene>
        <Orb color="#FF0000" />
      </OrbScene>,
    );
    // Non-wavy uses radial-gradient with `at X% Y%` syntax
    expect(html).toContain('radial-gradient(at');
    expect(html).not.toContain('orbkit-orb-blob');
  });

  it('blob diameter scales with size prop', () => {
    const html = renderToString(
      <OrbScene>
        <Orb color="#FF0000" wavy size={1.0} />
      </OrbScene>,
    );
    // size=1.0 → blobDiameter = 1.0 * 150 = 150%
    expect(html).toContain('150%');
  });
});
