/**
 * theme.tsx
 *
 * Drop-in replacement for the termui hooks and theme utilities used in this
 * project.  All APIs are compatible with the originals but depend only on
 * `ink` (already a direct dependency) and React — no `termui` required.
 */

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  type ReactNode,
} from 'react';

// ─── Re-export ink primitives directly ───────────────────────────────────────

export { useInput } from 'ink';
export { useFocus } from 'ink';

// ─── Theme types ─────────────────────────────────────────────────────────────

export interface ColorTokens {
  primary: string;
  primaryForeground: string;
  secondary: string;
  secondaryForeground: string;
  accent: string;
  accentForeground: string;
  success: string;
  successForeground: string;
  warning: string;
  warningForeground: string;
  error: string;
  errorForeground: string;
  info: string;
  infoForeground: string;
  background: string;
  foreground: string;
  muted: string;
  mutedForeground: string;
  border: string;
  focusRing: string;
  selection: string;
  selectionForeground: string;
}

export interface SpacingTokens {
  0: number;
  1: number;
  2: number;
  3: number;
  4: number;
  6: number;
  8: number;
}

export interface TypographyTokens {
  bold: boolean;
  sm: string;
  base: string;
  lg: string;
  xl: string;
}

export interface BorderTokens {
  style: 'single' | 'double' | 'round' | 'bold' | 'singleDouble' | 'doubleSingle' | 'classic';
  color: string;
  focusColor: string;
}

export interface Theme {
  name: string;
  colors: ColorTokens;
  spacing: SpacingTokens;
  typography: TypographyTokens;
  border: BorderTokens;
}

// ─── Built-in themes ──────────────────────────────────────────────────────────

export const defaultTheme: Theme = {
  name: 'default',
  colors: {
    primary:             '#7C3AED',
    primaryForeground:   '#FFFFFF',
    secondary:           '#6B7280',
    secondaryForeground: '#FFFFFF',
    accent:              '#8B5CF6',
    accentForeground:    '#FFFFFF',
    success:             '#10B981',
    successForeground:   '#FFFFFF',
    warning:             '#F59E0B',
    warningForeground:   '#000000',
    error:               '#EF4444',
    errorForeground:     '#FFFFFF',
    info:                '#3B82F6',
    infoForeground:      '#FFFFFF',
    background:          '#000000',
    foreground:          '#FFFFFF',
    muted:               '#374151',
    mutedForeground:     '#9CA3AF',
    border:              '#4B5563',
    focusRing:           '#8B5CF6',
    selection:           '#7C3AED',
    selectionForeground: '#FFFFFF',
  },
  spacing: { 0: 0, 1: 1, 2: 2, 3: 3, 4: 4, 6: 6, 8: 8 },
  typography: { bold: true, sm: 'dim', base: '', lg: 'bold', xl: 'bold' },
  border: { style: 'round', color: '#4B5563', focusColor: '#8B5CF6' },
};

/** Dracula colour scheme — dark purple with vibrant accents. */
export const draculaTheme: Theme = {
  name: 'dracula',
  colors: {
    primary:             '#BD93F9',
    primaryForeground:   '#282A36',
    secondary:           '#6272A4',
    secondaryForeground: '#F8F8F2',
    accent:              '#FF79C6',
    accentForeground:    '#282A36',
    success:             '#50FA7B',
    successForeground:   '#282A36',
    warning:             '#FFB86C',
    warningForeground:   '#282A36',
    error:               '#FF5555',
    errorForeground:     '#F8F8F2',
    info:                '#8BE9FD',
    infoForeground:      '#282A36',
    background:          '#282A36',
    foreground:          '#F8F8F2',
    muted:               '#44475A',
    mutedForeground:     '#6272A4',
    border:              '#44475A',
    focusRing:           '#BD93F9',
    selection:           '#44475A',
    selectionForeground: '#F8F8F2',
  },
  spacing: { 0: 0, 1: 1, 2: 2, 3: 3, 4: 4, 6: 6, 8: 8 },
  typography: { bold: true, sm: 'dim', base: '', lg: 'bold', xl: 'bold' },
  border: { style: 'round', color: '#44475A', focusColor: '#BD93F9' },
};

// ─── ThemeContext & ThemeProvider ─────────────────────────────────────────────

interface ThemeContextValue {
  theme: Theme;
  setTheme: (t: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: defaultTheme,
  setTheme: () => {},
});

export interface ThemeProviderProps {
  theme?: Theme;
  children: ReactNode;
}

export function ThemeProvider({ theme = defaultTheme, children }: ThemeProviderProps) {
  const [activeTheme, setActiveTheme] = useState<Theme>(theme);

  // Sync if the parent passes a new theme object
  useEffect(() => {
    setActiveTheme(theme);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme: activeTheme, setTheme: setActiveTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

/** Returns the active theme. Falls back to defaultTheme outside a ThemeProvider. */
export function useTheme(): Theme {
  return useContext(ThemeContext).theme;
}

// ─── useAnimation ────────────────────────────────────────────────────────────

// Shared interval registry — all callers at the same fps share one timer.
interface SharedTicker {
  id: ReturnType<typeof setInterval>;
  tick: number;
  subs: Set<(tick: number) => void>;
}
const tickers = new Map<number, SharedTicker>();

function subscribeTicker(intervalMs: number, cb: (tick: number) => void) {
  if (!tickers.has(intervalMs)) {
    const ticker: SharedTicker = { id: null as any, tick: 0, subs: new Set() };
    ticker.id = setInterval(() => {
      ticker.tick++;
      for (const sub of ticker.subs) sub(ticker.tick);
    }, intervalMs);
    tickers.set(intervalMs, ticker);
  }
  tickers.get(intervalMs)!.subs.add(cb);
}

function unsubscribeTicker(intervalMs: number, cb: (tick: number) => void) {
  const ticker = tickers.get(intervalMs);
  if (!ticker) return;
  ticker.subs.delete(cb);
  if (ticker.subs.size === 0) {
    clearInterval(ticker.id);
    tickers.delete(intervalMs);
  }
}

/**
 * Drive frame-based animations at a configurable fps.
 *
 * Returns a monotonically increasing frame counter. Use `frame % frames.length`
 * to cycle through animation frames.
 *
 * @param fps Frames per second (default: 12).
 */
export function useAnimation(fps: number = 12): number {
  const [frame, setFrame] = useState(0);

  useEffect(() => {
    const intervalMs = Math.round(1000 / fps);
    const handler = (tick: number) => setFrame(tick);
    subscribeTicker(intervalMs, handler);
    return () => unsubscribeTicker(intervalMs, handler);
  }, [fps]);

  return frame;
}

// ─── useInterval ─────────────────────────────────────────────────────────────

/**
 * React-safe setInterval with automatic cleanup.
 *
 * Pass `null` as `delay` to pause the interval without unmounting.
 */
export function useInterval(callback: () => void, delay: number | null): void {
  const savedCallback = useRef<() => void>(callback);

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    if (delay === null) return;
    const id = setInterval(() => savedCallback.current(), delay);
    return () => clearInterval(id);
  }, [delay]);
}
