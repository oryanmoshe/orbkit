import { Orb, OrbScene } from 'orbkit';
import { useState } from 'react';

const presetNames = ['ocean', 'sunset', 'forest', 'aurora', 'minimal'] as const;
const renderers = ['css', 'canvas', 'webgl', 'auto'] as const;

/** Read initial state from URL search params (for Playwright test automation) */
function getUrlParams() {
  const params = new URLSearchParams(window.location.search);
  return {
    renderer: (params.get('renderer') as 'css' | 'canvas' | 'webgl' | 'auto') ?? undefined,
    wavy: params.has('wavy') ? params.get('wavy') !== 'false' : undefined,
    drift: params.has('drift') ? params.get('drift') !== 'false' : undefined,
    interactive: params.has('interactive') ? params.get('interactive') !== 'false' : undefined,
    blur: params.has('blur') ? Number(params.get('blur')) : undefined,
    grain: params.has('grain') ? Number(params.get('grain')) / 100 : undefined,
    size: params.has('size') ? Number(params.get('size')) / 100 : undefined,
    preset: params.get('preset') ?? undefined,
    hideUI: params.get('hideUI') === 'true',
  };
}

const pill = (active: boolean, accent = '#7C3AED') =>
  ({
    padding: '0.35rem 0.75rem',
    borderRadius: '0.375rem',
    border: active ? `2px solid ${accent}` : '1px solid rgba(255,255,255,0.15)',
    background: active ? `${accent}33` : 'rgba(0,0,0,0.3)',
    color: active ? '#c4b5fd' : 'rgba(255,255,255,0.6)',
    cursor: 'pointer',
    fontSize: '0.75rem',
    fontFamily: 'monospace',
    backdropFilter: 'blur(10px)',
  }) as const;

const label: React.CSSProperties = {
  color: 'rgba(255,255,255,0.5)',
  fontSize: '0.7rem',
  alignSelf: 'center',
  minWidth: '4.5rem',
};

const slider: React.CSSProperties = {
  width: '6rem',
  accentColor: '#7C3AED',
  cursor: 'pointer',
};

export function App() {
  const urlParams = getUrlParams();

  const [preset, setPreset] = useState<string>(urlParams.preset ?? 'ocean');
  const [showCustom, setShowCustom] = useState(!urlParams.preset);
  const [renderer, setRenderer] = useState<'css' | 'canvas' | 'webgl' | 'auto'>(
    urlParams.renderer ?? 'css',
  );

  // Feature controls (URL params override defaults)
  const [wavy, setWavy] = useState(urlParams.wavy ?? true);
  const [wavyScale, setWavyScale] = useState(25);
  const [drift, setDrift] = useState(urlParams.drift ?? true);
  const [interactive, setInteractive] = useState(urlParams.interactive ?? true);
  const [blur, setBlur] = useState(urlParams.blur ?? 30);
  const [grain, setGrain] = useState(urlParams.grain ?? 0.3);
  const [size, setSize] = useState(urlParams.size ?? 0.3);

  const wavyProp = wavy ? { scale: wavyScale } : false;

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh' }}>
      {/* Full-screen orb scene */}
      {showCustom ? (
        <OrbScene
          background="#0a0a1a"
          grain={grain}
          breathing={30}
          renderer={renderer}
          style={{ position: 'absolute', inset: 0 }}
        >
          <Orb
            color="#7C3AED"
            position={[0.2, 0.3]}
            size={size + 0.05}
            blur={blur}
            drift={drift}
            interactive={interactive}
            wavy={wavyProp}
          />
          <Orb
            color="#06B6D4"
            position={[0.75, 0.25]}
            size={size}
            blur={blur + 5}
            drift={drift}
            interactive={interactive}
            wavy={wavy ? { scale: wavyScale, speed: 0.8 } : false}
          />
          <Orb
            color="#E07B3C"
            position={[0.35, 0.75]}
            size={size - 0.05}
            blur={blur - 5}
            drift={drift}
            interactive={interactive}
            wavy={wavyProp}
          />
          <Orb
            color="#D94F8C"
            position={[0.65, 0.65]}
            size={size}
            blur={blur - 2}
            drift={drift}
            interactive={interactive}
            wavy={wavyProp}
          />
        </OrbScene>
      ) : (
        <OrbScene preset={preset} renderer={renderer} style={{ position: 'absolute', inset: 0 }} />
      )}

      {/* UI overlay — hidden when hideUI=true (for Playwright screenshots) */}
      {!urlParams.hideUI && (
        <div
          style={{
            position: 'relative',
            zIndex: 10,
            padding: '1.5rem',
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            pointerEvents: 'none',
          }}
        >
          {/* Controls panel */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem',
              pointerEvents: 'auto',
              maxWidth: '32rem',
            }}
          >
            {/* Renderer */}
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <span style={label}>Renderer</span>
              {renderers.map((r) => (
                <button
                  type="button"
                  key={r}
                  onClick={() => setRenderer(r)}
                  style={pill(renderer === r)}
                >
                  {r}
                </button>
              ))}
            </div>

            {/* Presets / custom */}
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
              <span style={label}>Scene</span>
              {presetNames.map((name) => (
                <button
                  type="button"
                  key={name}
                  onClick={() => {
                    setPreset(name);
                    setShowCustom(false);
                  }}
                  style={pill(!showCustom && preset === name, '#fff')}
                >
                  {name}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setShowCustom(true)}
                style={pill(showCustom, '#fff')}
              >
                custom
              </button>
            </div>

            {/* Feature toggles — only for custom mode */}
            {showCustom && (
              <>
                <div
                  style={{
                    height: '1px',
                    background: 'rgba(255,255,255,0.1)',
                    margin: '0.25rem 0',
                  }}
                />

                {/* Toggles row */}
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                  <span style={label}>Features</span>
                  <button type="button" onClick={() => setWavy((v) => !v)} style={pill(wavy)}>
                    wavy
                  </button>
                  <button type="button" onClick={() => setDrift((v) => !v)} style={pill(drift)}>
                    drift
                  </button>
                  <button
                    type="button"
                    onClick={() => setInteractive((v) => !v)}
                    style={pill(interactive)}
                  >
                    interactive
                  </button>
                </div>

                {/* Wavy scale slider */}
                {wavy && (
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <span style={label}>Wavy scale</span>
                    <input
                      type="range"
                      min={5}
                      max={60}
                      value={wavyScale}
                      onChange={(e) => setWavyScale(Number(e.target.value))}
                      style={slider}
                    />
                    <span style={{ ...label, minWidth: '2rem' }}>{wavyScale}</span>
                  </div>
                )}

                {/* Blur slider */}
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <span style={label}>Blur</span>
                  <input
                    type="range"
                    min={0}
                    max={80}
                    value={blur}
                    onChange={(e) => setBlur(Number(e.target.value))}
                    style={slider}
                  />
                  <span style={{ ...label, minWidth: '2rem' }}>{blur}px</span>
                </div>

                {/* Size slider */}
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <span style={label}>Size</span>
                  <input
                    type="range"
                    min={10}
                    max={60}
                    value={Math.round(size * 100)}
                    onChange={(e) => setSize(Number(e.target.value) / 100)}
                    style={slider}
                  />
                  <span style={{ ...label, minWidth: '2rem' }}>{Math.round(size * 100)}%</span>
                </div>

                {/* Grain slider */}
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <span style={label}>Grain</span>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={Math.round(grain * 100)}
                    onChange={(e) => setGrain(Number(e.target.value) / 100)}
                    style={slider}
                  />
                  <span style={{ ...label, minWidth: '2rem' }}>{Math.round(grain * 100)}%</span>
                </div>
              </>
            )}
          </div>

          {/* Status bar */}
          <div style={{ marginTop: 'auto', opacity: 0.5, fontSize: '0.7rem' }}>
            {showCustom
              ? `Renderer: ${renderer} · Blur: ${blur}px · Size: ${Math.round(size * 100)}% · Grain: ${Math.round(grain * 100)}%${wavy ? ` · Wavy: ${wavyScale}` : ''}${drift ? ' · Drift' : ''}${interactive ? ' · Interactive' : ''}`
              : `Renderer: ${renderer} · Preset: ${preset}`}
          </div>
        </div>
      )}
    </div>
  );
}
