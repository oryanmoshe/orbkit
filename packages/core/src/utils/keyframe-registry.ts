/** Tracks which animation names have been injected to avoid duplicates */
const injectedKeyframes = new Set<string>();

/**
 * Inject a CSS @keyframes rule into the document head via a <style> tag.
 * Deduplicates by animation name. No-op during SSR.
 */
export function injectKeyframes(name: string, css: string): void {
  if (injectedKeyframes.has(name)) return;
  if (typeof document === 'undefined') return;

  const style = document.createElement('style');
  style.setAttribute('data-orbkit', name);
  style.textContent = css;
  document.head.appendChild(style);
  injectedKeyframes.add(name);
}

/**
 * Remove a previously injected @keyframes rule from the document.
 */
export function removeKeyframes(name: string): void {
  if (typeof document === 'undefined') return;

  const el = document.querySelector(`style[data-orbkit="${name}"]`);
  if (el) el.remove();
  injectedKeyframes.delete(name);
}
