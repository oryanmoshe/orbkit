import { useCallback, useEffect, useReducer, useRef } from 'react';
import type { EditorAction, EditorState } from '../types';
import { computeSymmetricalPositions } from '../utils/symmetry';

const DEFAULT_STATE: EditorState = {
  background: '#0a0a0a',
  saturation: 80,
  grain: 25,
  breathing: 20,
  locked: false,
  orbs: [],
  selectedOrbId: null,
  renderer: 'css',
};

export function editorReducer(state: EditorState, action: EditorAction): EditorState {
  switch (action.type) {
    case 'SET_BACKGROUND':
      return { ...state, background: action.color };
    case 'SET_SATURATION':
      return { ...state, saturation: action.value };
    case 'SET_GRAIN':
      return { ...state, grain: action.value };
    case 'SET_BREATHING':
      return { ...state, breathing: action.value };
    case 'SET_RENDERER':
      return { ...state, renderer: action.renderer };
    case 'SELECT_ORB':
      return { ...state, selectedOrbId: action.id };
    case 'ADD_ORB':
      return { ...state, orbs: [...state.orbs, action.orb], selectedOrbId: action.orb.id };
    case 'REMOVE_ORB': {
      const orbs = state.orbs.filter((o) => o.id !== action.id);
      return {
        ...state,
        orbs,
        selectedOrbId: state.selectedOrbId === action.id ? null : state.selectedOrbId,
      };
    }
    case 'UPDATE_ORB':
      return {
        ...state,
        orbs: state.orbs.map((o) => (o.id === action.id ? { ...o, ...action.changes } : o)),
      };
    case 'MOVE_ORB':
      return {
        ...state,
        orbs: state.orbs.map((o) => (o.id === action.id ? { ...o, position: action.position } : o)),
      };
    case 'SET_LOCKED':
      return { ...state, locked: action.locked };
    case 'MOVE_ORB_LOCKED': {
      const movedIndex = state.orbs.findIndex((o) => o.id === action.id);
      if (movedIndex === -1) return state;
      const positions = computeSymmetricalPositions(action.position, state.orbs.length, movedIndex);
      return {
        ...state,
        orbs: state.orbs.map((o, i) => ({ ...o, position: positions[i] ?? o.position })),
      };
    }
    case 'APPLY_PRESET': {
      const preset = action.config;
      return {
        ...state,
        ...preset,
        selectedOrbId: null,
      };
    }
    case 'RANDOMIZE':
      return { ...action.config, selectedOrbId: null };
    case 'LOAD_CONFIG': {
      const config = action.config;
      return {
        ...config,
        locked: config.locked ?? false,
        orbs: config.orbs.map((o) => {
          // Backward compat: older configs from JSON may lack new fields
          const raw = o as unknown as Record<string, unknown>;
          return {
            ...o,
            drift: (raw.drift as boolean) ?? true,
            wavy: (raw.wavy as boolean) ?? false,
            interactive: (raw.interactive as boolean) ?? false,
          };
        }),
      };
    }
  }
}

/**
 * Central state management for the editor.
 * Supports controlled (value/onChange) and uncontrolled (defaultValue) patterns.
 */
export default function useEditorState(
  value?: EditorState,
  defaultValue?: EditorState,
  onChange?: (state: EditorState) => void,
): [EditorState, (action: EditorAction) => void] {
  const [state, dispatch] = useReducer(editorReducer, value ?? defaultValue ?? DEFAULT_STATE);
  const isControlled = value !== undefined;
  const wasControlledRef = useRef(isControlled);

  // Warn on controlled/uncontrolled mode switch
  useEffect(() => {
    if (wasControlledRef.current !== isControlled) {
      console.warn(
        'OrbEditor: Switching between controlled and uncontrolled mode is not supported.',
      );
    }
    wasControlledRef.current = isControlled;
  }, [isControlled]);

  // Sync internal state from controlled value prop
  useEffect(() => {
    if (isControlled && value) {
      dispatch({ type: 'LOAD_CONFIG', config: value });
    }
  }, [value, isControlled]);

  // Wrap dispatch to call onChange in controlled mode
  const stableDispatch = useCallback(
    (action: EditorAction) => {
      if (isControlled && value) {
        const nextState = editorReducer(value, action);
        onChange?.(nextState);
      } else {
        dispatch(action);
      }
    },
    [isControlled, value, onChange],
  );

  return [isControlled && value ? value : state, stableDispatch];
}

export { DEFAULT_STATE };
