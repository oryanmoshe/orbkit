import type { JSX } from 'react';

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
  label?: string;
}

/** Hybrid color picker: native <input type="color"> + hex text input. */
export function ColorPicker({ value, onChange, label }: ColorPickerProps): JSX.Element {
  return (
    <div className="orbkit-editor-color-picker">
      {label && (
        <label className="orbkit-editor-label">
          {label}
          <input
            type="color"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="orbkit-editor-color-swatch"
          />
        </label>
      )}
      {!label && (
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="orbkit-editor-color-swatch"
        />
      )}
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="orbkit-editor-color-hex"
        maxLength={7}
        spellCheck={false}
      />
    </div>
  );
}
