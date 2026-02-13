import { Orb, OrbScene } from 'orbkit';
import { type JSX, useCallback, useRef } from 'react';
import useDrag from '../hooks/use-drag';
import type { EditorAction, EditorState } from '../types';

interface DragHandleProps {
  position: [number, number];
  color: string;
  selected: boolean;
  onSelect: () => void;
  onDrag: (pos: [number, number]) => void;
  containerRef: React.RefObject<HTMLElement | null>;
}

function DragHandle({
  position,
  color,
  selected,
  onSelect,
  onDrag,
  containerRef,
}: DragHandleProps): JSX.Element {
  const { onPointerDown } = useDrag({ onDrag, containerRef });
  const [px, py] = position;

  return (
    <button
      type="button"
      className={`orbkit-editor-drag-handle${selected ? ' orbkit-editor-drag-handle--selected' : ''}`}
      style={{
        left: `${px * 100}%`,
        top: `${py * 100}%`,
        borderColor: color,
      }}
      onPointerDown={(e) => {
        onSelect();
        onPointerDown(e);
      }}
      aria-label={`Drag orb at ${Math.round(px * 100)}%, ${Math.round(py * 100)}%`}
    />
  );
}

interface CanvasPreviewProps {
  state: EditorState;
  dispatch: (action: EditorAction) => void;
}

/** Live preview of the orb scene with draggable handles for each orb. */
export function CanvasPreview({ state, dispatch }: CanvasPreviewProps): JSX.Element {
  const containerRef = useRef<HTMLDivElement>(null);

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      // Click on empty area to add a new orb
      if (
        e.target === e.currentTarget ||
        (e.target as HTMLElement).classList.contains('orbkit-scene')
      ) {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width;
        const y = (e.clientY - rect.top) / rect.height;
        dispatch({
          type: 'ADD_ORB',
          orb: {
            id: `orb-${Date.now()}`,
            color: `#${Math.floor(Math.random() * 0xffffff)
              .toString(16)
              .padStart(6, '0')}`,
            position: [x, y],
            size: 0.6,
            blur: 40,
            opacity: 0.8,
            blendMode: 'screen',
            drift: true,
            wavy: false,
            interactive: false,
          },
        });
      }
    },
    [dispatch],
  );

  return (
    <div
      ref={containerRef}
      className="orbkit-editor-canvas"
      onClick={handleClick}
      onKeyDown={undefined}
      role="presentation"
    >
      <OrbScene
        background={state.background}
        grain={state.grain / 100}
        saturation={state.saturation}
        breathing={state.breathing}
        renderer={state.renderer}
      >
        {state.orbs.map((orb) => (
          <Orb
            key={orb.id}
            color={orb.color}
            position={orb.position}
            size={orb.size}
            blur={orb.blur}
            blendMode={orb.blendMode}
            drift={orb.drift}
            wavy={orb.wavy}
            interactive={orb.interactive}
            style={{ opacity: orb.opacity }}
          />
        ))}
      </OrbScene>

      {/* Drag handles overlay */}
      {state.orbs.map((orb) => (
        <DragHandle
          key={orb.id}
          position={orb.position}
          color={orb.color}
          selected={orb.id === state.selectedOrbId}
          onSelect={() => dispatch({ type: 'SELECT_ORB', id: orb.id })}
          onDrag={(pos) =>
            dispatch({
              type: state.locked ? 'MOVE_ORB_LOCKED' : 'MOVE_ORB',
              id: orb.id,
              position: pos,
            })
          }
          containerRef={containerRef}
        />
      ))}
    </div>
  );
}
