import { type JSX, useCallback, useEffect, useRef, useState } from 'react';
import type { EditorState } from '../types';
import { exportCSS } from '../utils/export-css';
import { exportJSON } from '../utils/export-json';
import { exportJSX } from '../utils/export-jsx';

type ExportFormat = 'jsx' | 'json' | 'css';

interface ExportPanelProps {
  state: EditorState;
}

/** Export panel with copy-to-clipboard buttons for JSX, JSON, and CSS. */
export function ExportPanel({ state }: ExportPanelProps): JSX.Element {
  const [copiedFormat, setCopiedFormat] = useState<ExportFormat | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const getExport = useCallback(
    (format: ExportFormat): string => {
      switch (format) {
        case 'jsx':
          return exportJSX(state);
        case 'json':
          return exportJSON(state);
        case 'css':
          return exportCSS(state);
      }
    },
    [state],
  );

  const handleCopy = useCallback(
    (format: ExportFormat) => {
      const text = getExport(format);
      navigator.clipboard.writeText(text).then(
        () => {
          setCopiedFormat(format);
          if (timerRef.current) clearTimeout(timerRef.current);
          timerRef.current = setTimeout(() => setCopiedFormat(null), 2000);
        },
        () => {
          // Clipboard write failed (permissions or insecure context)
        },
      );
    },
    [getExport],
  );

  const handleDownload = useCallback(() => {
    const json = exportJSON(state);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'orbkit-scene.json';
    a.click();
    URL.revokeObjectURL(url);
  }, [state]);

  return (
    <div className="orbkit-editor-export">
      <h3 className="orbkit-editor-section-title">Export</h3>
      <div className="orbkit-editor-export-buttons">
        {(['jsx', 'json', 'css'] as const).map((format) => (
          <button
            key={format}
            type="button"
            className="orbkit-editor-btn orbkit-editor-btn--export"
            onClick={() => handleCopy(format)}
          >
            {copiedFormat === format ? 'Copied!' : `Copy ${format.toUpperCase()}`}
          </button>
        ))}
        <button
          type="button"
          className="orbkit-editor-btn orbkit-editor-btn--download"
          onClick={handleDownload}
        >
          Download JSON
        </button>
      </div>
    </div>
  );
}
