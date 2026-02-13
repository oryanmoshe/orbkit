import { describe, expect, it } from 'bun:test';
import type { EditorOrb, EditorState } from '../types';
import { DEFAULT_STATE, editorReducer } from './use-editor-state';

const makeOrb = (overrides?: Partial<EditorOrb>): EditorOrb => ({
  id: 'orb-1',
  color: '#ff0000',
  position: [0.5, 0.5],
  size: 0.75,
  blur: 40,
  blendMode: 'screen',
  ...overrides,
});

const stateWithOrbs = (): EditorState => ({
  ...DEFAULT_STATE,
  orbs: [makeOrb({ id: 'a' }), makeOrb({ id: 'b', color: '#00ff00' })],
  selectedOrbId: 'a',
});

describe('editorReducer', () => {
  it('sets background', () => {
    const next = editorReducer(DEFAULT_STATE, { type: 'SET_BACKGROUND', color: '#123456' });
    expect(next.background).toBe('#123456');
  });

  it('sets saturation', () => {
    const next = editorReducer(DEFAULT_STATE, { type: 'SET_SATURATION', value: 60 });
    expect(next.saturation).toBe(60);
  });

  it('sets grain', () => {
    const next = editorReducer(DEFAULT_STATE, { type: 'SET_GRAIN', value: 50 });
    expect(next.grain).toBe(50);
  });

  it('sets breathing', () => {
    const next = editorReducer(DEFAULT_STATE, { type: 'SET_BREATHING', value: 30 });
    expect(next.breathing).toBe(30);
  });

  it('sets renderer', () => {
    const next = editorReducer(DEFAULT_STATE, { type: 'SET_RENDERER', renderer: 'webgl' });
    expect(next.renderer).toBe('webgl');
  });

  it('selects an orb', () => {
    const state = stateWithOrbs();
    const next = editorReducer(state, { type: 'SELECT_ORB', id: 'b' });
    expect(next.selectedOrbId).toBe('b');
  });

  it('deselects orb with null', () => {
    const state = stateWithOrbs();
    const next = editorReducer(state, { type: 'SELECT_ORB', id: null });
    expect(next.selectedOrbId).toBeNull();
  });

  it('adds an orb and selects it', () => {
    const orb = makeOrb({ id: 'new' });
    const next = editorReducer(DEFAULT_STATE, { type: 'ADD_ORB', orb });
    expect(next.orbs).toHaveLength(1);
    expect(next.orbs[0]?.id).toBe('new');
    expect(next.selectedOrbId).toBe('new');
  });

  it('removes an orb', () => {
    const state = stateWithOrbs();
    const next = editorReducer(state, { type: 'REMOVE_ORB', id: 'a' });
    expect(next.orbs).toHaveLength(1);
    expect(next.orbs[0]?.id).toBe('b');
  });

  it('clears selection when removing selected orb', () => {
    const state = stateWithOrbs();
    const next = editorReducer(state, { type: 'REMOVE_ORB', id: 'a' });
    expect(next.selectedOrbId).toBeNull();
  });

  it('keeps selection when removing non-selected orb', () => {
    const state = stateWithOrbs();
    const next = editorReducer(state, { type: 'REMOVE_ORB', id: 'b' });
    expect(next.selectedOrbId).toBe('a');
  });

  it('updates orb properties', () => {
    const state = stateWithOrbs();
    const next = editorReducer(state, {
      type: 'UPDATE_ORB',
      id: 'a',
      changes: { color: '#0000ff', size: 0.5 },
    });
    expect(next.orbs[0]?.color).toBe('#0000ff');
    expect(next.orbs[0]?.size).toBe(0.5);
    expect(next.orbs[1]?.color).toBe('#00ff00'); // unchanged
  });

  it('moves an orb', () => {
    const state = stateWithOrbs();
    const next = editorReducer(state, { type: 'MOVE_ORB', id: 'b', position: [0.2, 0.8] });
    expect(next.orbs[1]?.position).toEqual([0.2, 0.8]);
    expect(next.orbs[0]?.position).toEqual([0.5, 0.5]); // unchanged
  });

  it('applies preset config', () => {
    const next = editorReducer(DEFAULT_STATE, {
      type: 'APPLY_PRESET',
      config: { background: '#1a1a1a', grain: 40 },
    });
    expect(next.background).toBe('#1a1a1a');
    expect(next.grain).toBe(40);
    expect(next.selectedOrbId).toBeNull();
  });

  it('randomizes with full config replacement', () => {
    const randomConfig: EditorState = {
      ...DEFAULT_STATE,
      background: '#ff00ff',
      orbs: [makeOrb({ id: 'r1' })],
    };
    const next = editorReducer(DEFAULT_STATE, { type: 'RANDOMIZE', config: randomConfig });
    expect(next.background).toBe('#ff00ff');
    expect(next.orbs).toHaveLength(1);
    expect(next.selectedOrbId).toBeNull();
  });

  it('loads config', () => {
    const config: EditorState = {
      ...DEFAULT_STATE,
      background: '#abcdef',
      saturation: 99,
    };
    const next = editorReducer(DEFAULT_STATE, { type: 'LOAD_CONFIG', config });
    expect(next.background).toBe('#abcdef');
    expect(next.saturation).toBe(99);
  });
});
