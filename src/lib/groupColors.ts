/**
 * Per-group color palette and helpers.
 * Each color is visually distinct, passes on both light and dark terminals,
 * and avoids clashing with the Dracula theme's own colors.
 */

export const GROUP_COLORS = [
  '#BD93F9', // purple
  '#8BE9FD', // cyan
  '#50FA7B', // #50fa7b
  '#FFB86C', // orange
  '#FF79C6', // pink
  '#FF5555', // red
  '#F1FA8C', // yellow
  '#A1E8CC', // mint
  '#FAB38E', // peach
  '#C0CAF5', // lavender
  '#B4F9F8', // teal
  '#FFD700', // gold
] as const;

/** Pick a random color from the pool, optionally excluding one color. */
export function getRandomColor(exclude?: string | null): string {
  const pool = exclude ? GROUP_COLORS.filter(c => c !== exclude) : GROUP_COLORS;
  // Fallback to full pool if somehow everything is excluded (shouldn't happen with our constants)
  const finalPool = pool.length > 0 ? pool : GROUP_COLORS;
  return finalPool[Math.floor(Math.random() * finalPool.length)];
}

/** Return the next color in the pool after `current`. Cycles back to the start. */
export function getNextColor(current: string | null): string {
  if (!current) return getRandomColor();
  const idx = GROUP_COLORS.indexOf(current as any);
  
  // If not in our predefined list, pick a random one that isn't the current one
  if (idx === -1) return getRandomColor(current);
  
  // Otherwise, just pick the next one in the cycle (guaranteed to be different as long as list length > 1)
  return GROUP_COLORS[(idx + 1) % GROUP_COLORS.length];
}