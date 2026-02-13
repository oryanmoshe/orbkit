import type { BlendMode, Point, RendererType } from 'orbkit';
import type { RefObject } from 'react';

export interface EditorOrb {
  id: string;
  color: string;
  position: Point;
  size: number;
  blur: number;
  opacity: number;
  blendMode: BlendMode;
  drift: boolean;
  wavy: boolean;
  interactive: boolean;
}

export interface EditorState {
  background: string;
  saturation: number;
  grain: number;
  breathing: number;
  locked: boolean;
  orbs: EditorOrb[];
  selectedOrbId: string | null;
  renderer: RendererType;
}

export interface UseDragOptions {
  onDrag: (position: Point) => void;
  containerRef: RefObject<HTMLElement | null>;
}

export interface PresetGalleryProps {
  dispatch: (action: EditorAction) => void;
}

export type EditorAction =
  | { type: 'SET_BACKGROUND'; color: string }
  | { type: 'SET_SATURATION'; value: number }
  | { type: 'SET_GRAIN'; value: number }
  | { type: 'SET_BREATHING'; value: number }
  | { type: 'SET_RENDERER'; renderer: RendererType }
  | { type: 'SELECT_ORB'; id: string | null }
  | { type: 'ADD_ORB'; orb: EditorOrb }
  | { type: 'REMOVE_ORB'; id: string }
  | { type: 'UPDATE_ORB'; id: string; changes: Partial<Omit<EditorOrb, 'id'>> }
  | { type: 'MOVE_ORB'; id: string; position: Point }
  | { type: 'SET_LOCKED'; locked: boolean }
  | { type: 'MOVE_ORB_LOCKED'; id: string; position: Point }
  | { type: 'APPLY_PRESET'; config: Partial<EditorState> }
  | { type: 'RANDOMIZE'; config: EditorState }
  | { type: 'LOAD_CONFIG'; config: EditorState };
