import type { Preset } from '../types';

export const ocean: Preset = {
  name: 'ocean',
  label: 'Ocean',
  backgroundColor: '#1a1a1a',
  points: [
    { id: 'p1', color: '#4A90D9', position: [0.2, 0.25], radius: 0.8 },
    { id: 'p2', color: '#D4836D', position: [0.75, 0.5], radius: 0.75 },
    { id: 'p3', color: '#E8DCC8', position: [0.45, 0.85], radius: 0.7 },
  ],
  saturation: 70,
  grain: 35,
  breathing: 30,
};

export const sunset: Preset = {
  name: 'sunset',
  label: 'Sunset',
  backgroundColor: '#1a1018',
  points: [
    { id: 'p1', color: '#E07B3C', position: [0.3, 0.2], radius: 0.85 },
    { id: 'p2', color: '#D94F8C', position: [0.7, 0.4], radius: 0.75 },
    { id: 'p3', color: '#7B3FA0', position: [0.5, 0.8], radius: 0.7 },
  ],
  saturation: 75,
  grain: 35,
  breathing: 30,
};

export const forest: Preset = {
  name: 'forest',
  label: 'Forest',
  backgroundColor: '#0f1a14',
  points: [
    { id: 'p1', color: '#1A4D2E', position: [0.25, 0.3], radius: 0.8 },
    { id: 'p2', color: '#4A8C5C', position: [0.65, 0.55], radius: 0.75 },
    { id: 'p3', color: '#D4CDB8', position: [0.4, 0.8], radius: 0.65 },
  ],
  saturation: 60,
  grain: 35,
  breathing: 30,
};

export const aurora: Preset = {
  name: 'aurora',
  label: 'Aurora',
  backgroundColor: '#0f0f1a',
  points: [
    { id: 'p1', color: '#7C3AED', position: [0.2, 0.25], radius: 0.8 },
    { id: 'p2', color: '#06B6D4', position: [0.75, 0.5], radius: 0.75 },
    { id: 'p3', color: '#3730A3', position: [0.45, 0.85], radius: 0.7 },
  ],
  saturation: 80,
  grain: 35,
  breathing: 30,
};

export const minimal: Preset = {
  name: 'minimal',
  label: 'Minimal',
  backgroundColor: '#1a1918',
  points: [
    { id: 'p1', color: '#E8DCC8', position: [0.3, 0.3], radius: 0.8 },
    { id: 'p2', color: '#9E9E9E', position: [0.7, 0.5], radius: 0.7 },
    { id: 'p3', color: '#C4B99A', position: [0.5, 0.75], radius: 0.65 },
  ],
  saturation: 30,
  grain: 35,
  breathing: 20,
};

/** All built-in presets + any custom presets */
export const presets: Record<string, Preset> = {
  ocean,
  sunset,
  forest,
  aurora,
  minimal,
};

/**
 * Register a custom preset. Overwrites any existing preset with the same name.
 */
export function registerPreset(preset: Preset): void {
  presets[preset.name] = preset;
}
