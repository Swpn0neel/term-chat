/**
 * Per-group color palette and helpers.
 * Each color is visually distinct, passes on both light and dark terminals,
 * and avoids clashing with the Dracula theme's own colors.
 */

export const GROUP_COLORS = [
  '#BD93F9', // purple
  '#8BE9FD', // cyan
  '#50FA7B', // green
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

/** Pick a random color from the pool. Used when assigning a new member their initial color. */
export function getRandomColor(): string {
  return GROUP_COLORS[Math.floor(Math.random() * GROUP_COLORS.length)];
}

/** Return the next color in the pool after `current`. Cycles back to the start. */
export function getNextColor(current: string | null): string {
  if (!current) return getRandomColor();
  const idx = GROUP_COLORS.indexOf(current as typeof GROUP_COLORS[number]);
  if (idx === -1) return getRandomColor();
  return GROUP_COLORS[(idx + 1) % GROUP_COLORS.length];
}