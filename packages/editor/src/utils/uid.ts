let counter = 0;

/** Generate a unique ID with counter suffix to avoid Date.now() collisions. */
export function uid(prefix = 'orb'): string {
  return `${prefix}-${Date.now()}-${(counter++).toString(36)}`;
}
