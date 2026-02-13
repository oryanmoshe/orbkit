import { Orb, OrbScene } from 'orbkit';
import { useState } from 'react';

const presetNames = ['ocean', 'sunset', 'forest', 'aurora', 'minimal'] as const;

export function App() {
  const [preset, setPreset] = useState<string>('ocean');
  const [showCustom, setShowCustom] = useState(true);

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh' }}>
      {/* Full-screen orb scene */}
      {showCustom ? (
        <OrbScene
          background="#0a0a1a"
          grain={0.3}
          breathing={30}
          style={{ position: 'absolute', inset: 0 }}
        >
          <Orb color="#7C3AED" position={[0.2, 0.3]} size={0.35} blur={30} drift interactive wavy />
          <Orb
            color="#06B6D4"
            position={[0.75, 0.25]}
            size={0.3}
            blur={35}
            drift
            interactive
            wavy={{ scale: 30, speed: 0.8 }}
          />
          <Orb color="#E07B3C" position={[0.35, 0.75]} size={0.25} blur={25} drift interactive />
          <Orb
            color="#D94F8C"
            position={[0.65, 0.65]}
            size={0.3}
            blur={28}
            drift
            interactive
            wavy={{ scale: 20 }}
          />
        </OrbScene>
      ) : (
        <OrbScene preset={preset} style={{ position: 'absolute', inset: 0 }} />
      )}

      {/* UI overlay — pointer-events: none so OrbScene receives pointermove */}
      <div
        style={{
          position: 'relative',
          zIndex: 10,
          padding: '2rem',
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          pointerEvents: 'none',
        }}
      >
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', pointerEvents: 'auto' }}>
          {presetNames.map((name) => (
            <button
              type="button"
              key={name}
              onClick={() => {
                setPreset(name);
                setShowCustom(false);
              }}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '0.5rem',
                border:
                  !showCustom && preset === name
                    ? '2px solid #fff'
                    : '1px solid rgba(255,255,255,0.2)',
                background:
                  !showCustom && preset === name ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.3)',
                color: '#fff',
                cursor: 'pointer',
                textTransform: 'capitalize',
                fontSize: '0.875rem',
                backdropFilter: 'blur(10px)',
              }}
            >
              {name}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setShowCustom(true)}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '0.5rem',
              border: showCustom ? '2px solid #fff' : '1px solid rgba(255,255,255,0.2)',
              background: showCustom ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.3)',
              color: '#fff',
              cursor: 'pointer',
              fontSize: '0.875rem',
              backdropFilter: 'blur(10px)',
            }}
          >
            custom (interactive)
          </button>
        </div>

        <div style={{ marginTop: 'auto', opacity: 0.5, fontSize: '0.75rem' }}>
          {showCustom ? 'Move your mouse — orbs follow with parallax' : `Preset: ${preset}`}
        </div>
      </div>
    </div>
  );
}
