import type { JSX } from 'react';

const HEX_PATTERN = /^#[0-9a-fA-F]{0,6}$/;

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
  label?: string;
}

/** Hybrid color picker: native <input type="color"> + hex text input. */
export function ColorPicker({ value, onChange, label }: ColorPickerProps): JSX.Element {
  const colorInput = (
    <input
      type="color"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="orbkit-editor-color-swatch"
    />
  );

  return (
    <div className="orbkit-editor-color-picker">
      {label ? (
        // biome-ignore lint/a11y/noLabelWithoutControl: color input is rendered as child via JSX variable
        <label className="orbkit-editor-label">
          {label}
          {colorInput}
        </label>
      ) : (
        colorInput
      )}
      <input
        type="text"
        value={value}
        onChange={(e) => {
          const v = e.target.value;
          if (HEX_PATTERN.test(v)) onChange(v);
        }}
        className="orbkit-editor-color-hex"
        maxLength={7}
        spellCheck={false}
      />
    </div>
  );
}
