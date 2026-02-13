import type { JSX } from 'react';

interface SliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
}

/** Labeled range slider with current value display and filled track. */
export function Slider({ label, value, min, max, step = 1, onChange }: SliderProps): JSX.Element {
  const percent = ((value - min) / (max - min)) * 100;

  return (
    <label className="orbkit-editor-slider">
      <div className="orbkit-editor-slider-header">
        <span className="orbkit-editor-label">{label}</span>
        <span className="orbkit-editor-slider-value">{value}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="orbkit-editor-slider-input"
        style={{ '--slider-percent': `${percent}%` } as React.CSSProperties}
      />
    </label>
  );
}
