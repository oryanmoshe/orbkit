// Components
export { OrbScene } from './components/orb-scene';
export { Orb } from './components/orb';
export { Grain } from './components/grain';

// Context
export { useOrbSceneContext } from './context';

// Presets
export { presets, registerPreset, ocean, sunset, forest, aurora, minimal } from './presets';

// Utilities
export { hexToHsl, hslToHex, applySaturation } from './utils/color';
export {
  getOrbitParams,
  generateDriftKeyframes,
  generateDriftKeyframeCSS,
} from './utils/animation';

// Renderers
export {
  generateOrbCSS,
  generateGradientCSS,
  generateGrainIntensity,
} from './renderers/css-renderer';

// Types
export type {
  Point,
  BlendMode,
  RendererType,
  WavyConfig,
  DriftConfig,
  OrbProps,
  OrbSceneProps,
  OrbSceneElement,
  GrainProps,
  PresetPoint,
  Preset,
  HslColor,
  OrbitParams,
} from './types';
export type { OrbSceneContextValue } from './context';
