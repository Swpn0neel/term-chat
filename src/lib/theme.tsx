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

const SHARED_SPACING: SpacingTokens = { 0: 0, 1: 1, 2: 2, 3: 3, 4: 4, 6: 6, 8: 8 };
const SHARED_TYPO: TypographyTokens = { bold: true, sm: 'dim', base: '', lg: 'bold', xl: 'bold' };

export const cherryBlossomTheme: Theme = {
  name: 'cherryBlossom',
  colors: {
    primary:             "#F2A0B8",
    primaryForeground:   "#5C1E30",
    secondary:           "#96C8A8",
    secondaryForeground: "#1A4030",
    accent:              "#F7C8D4",
    accentForeground:    "#5C1E30",
    success:             "#96C8A8",
    successForeground:   "#1A4030",
    warning:             "#F5DFA0",
    warningForeground:   "#6A4A10",
    error:               "#F09898",
    errorForeground:     "#6A1A1A",
    info:                "#A8C8F0",
    infoForeground:      "#1A3E68",
    background:          "#FFF4F7",
    foreground:          "#3A1422",
    muted:               "#FAE2EA",
    mutedForeground:     "#A06070",
    border:              "#EFC0CC",
    focusRing:           "#F2A0B8",
    selection:           "#F7C8D4",
    selectionForeground: "#5C1E30",
  },
  spacing: SHARED_SPACING,
  typography: SHARED_TYPO,
  border: { style: 'round', color: '#EFC0CC', focusColor: '#F2A0B8' },
};

export const mintJulepTheme: Theme = {
  name: 'mintJulep',
  colors: {
    primary:             "#82DDB8",
    primaryForeground:   "#0E4830",
    secondary:           "#F4B48C",
    secondaryForeground: "#6A2E10",
    accent:              "#A8EECE",
    accentForeground:    "#0E4830",
    success:             "#82DDB8",
    successForeground:   "#0E4830",
    warning:             "#F4D890",
    warningForeground:   "#6A4A0E",
    error:               "#F0A0A0",
    errorForeground:     "#6A1A1A",
    info:                "#9ACCE8",
    infoForeground:      "#184C66",
    background:          "#F0FBF5",
    foreground:          "#0E2E1E",
    muted:               "#C8F0DC",
    mutedForeground:     "#4A8868",
    border:              "#A8E4C8",
    focusRing:           "#82DDB8",
    selection:           "#A8EECE",
    selectionForeground: "#0E4830",
  },
  spacing: SHARED_SPACING,
  typography: SHARED_TYPO,
  border: { style: 'round', color: '#A8E4C8', focusColor: '#82DDB8' },
};

export const lavenderDuskTheme: Theme = {
  name: 'lavenderDusk',
  colors: {
    primary:             "#BBA8E8",
    primaryForeground:   "#301858",
    secondary:           "#A8CCA0",
    secondaryForeground: "#1E4018",
    accent:              "#D0C0F8",
    accentForeground:    "#301858",
    success:             "#A8CCA0",
    successForeground:   "#1E4018",
    warning:             "#F0DCA0",
    warningForeground:   "#624A10",
    error:               "#EEA8B8",
    errorForeground:     "#6A1830",
    info:                "#A8C0F0",
    infoForeground:      "#183468",
    background:          "#F6F2FF",
    foreground:          "#241040",
    muted:               "#E4D8FA",
    mutedForeground:     "#7058A8",
    border:              "#CEC0EE",
    focusRing:           "#BBA8E8",
    selection:           "#D0C0F8",
    selectionForeground: "#301858",
  },
  spacing: SHARED_SPACING,
  typography: SHARED_TYPO,
  border: { style: 'round', color: '#CEC0EE', focusColor: '#BBA8E8' },
};

export const peachSorbetTheme: Theme = {
  name: 'peachSorbet',
  colors: {
    primary:             "#FFBC8C",
    primaryForeground:   "#6A3010",
    secondary:           "#A8AAF0",
    secondaryForeground: "#201E78",
    accent:              "#FFD4A8",
    accentForeground:    "#6A3010",
    success:             "#A4D8A8",
    successForeground:   "#1E5028",
    warning:             "#FFE088",
    warningForeground:   "#6A4E0E",
    error:               "#FFAAAA",
    errorForeground:     "#6A1A1A",
    info:                "#A8AAF0",
    infoForeground:      "#201E78",
    background:          "#FFF7F0",
    foreground:          "#3A2010",
    muted:               "#FFE4CC",
    mutedForeground:     "#A06030",
    border:              "#FFD0AA",
    focusRing:           "#FFBC8C",
    selection:           "#FFD4A8",
    selectionForeground: "#6A3010",
  },
  spacing: SHARED_SPACING,
  typography: SHARED_TYPO,
  border: { style: 'round', color: '#FFD0AA', focusColor: '#FFBC8C' },
};

export const skyMistTheme: Theme = {
  name: 'skyMist',
  colors: {
    primary:             "#90CCE8",
    primaryForeground:   "#0E3E58",
    secondary:           "#EEAAC0",
    secondaryForeground: "#5C1E38",
    accent:              "#B4DFF2",
    accentForeground:    "#0E3E58",
    success:             "#A0D8B8",
    successForeground:   "#1A4E34",
    warning:             "#F5E098",
    warningForeground:   "#5E4A0E",
    error:               "#F0A8B4",
    errorForeground:     "#5C1E2C",
    info:                "#90CCE8",
    infoForeground:      "#0E3E58",
    background:          "#F2FAFF",
    foreground:          "#0A2C40",
    muted:               "#C8E8F8",
    mutedForeground:     "#4A8098",
    border:              "#A8D8F0",
    focusRing:           "#90CCE8",
    selection:           "#B4DFF2",
    selectionForeground: "#0E3E58",
  },
  spacing: SHARED_SPACING,
  typography: SHARED_TYPO,
  border: { style: 'round', color: '#A8D8F0', focusColor: '#90CCE8' },
};

export const butterCreamTheme: Theme = {
  name: 'butterCream',
  colors: {
    primary:             "#F5E070",
    primaryForeground:   "#5A4A00",
    secondary:           "#C8A8F0",
    secondaryForeground: "#3A1868",
    accent:              "#FAF0A0",
    accentForeground:    "#5A4A00",
    success:             "#A8DCAA",
    successForeground:   "#1A5028",
    warning:             "#F5E070",
    warningForeground:   "#5A4A00",
    error:               "#F0AAAA",
    errorForeground:     "#6A1A1A",
    info:                "#B0C8F8",
    infoForeground:      "#18387A",
    background:          "#FEFCE8",
    foreground:          "#2A2400",
    muted:               "#FAF2B8",
    mutedForeground:     "#8A7830",
    border:              "#F0E490",
    focusRing:           "#F5E070",
    selection:           "#FAF0A0",
    selectionForeground: "#5A4A00",
  },
  spacing: SHARED_SPACING,
  typography: SHARED_TYPO,
  border: { style: 'round', color: '#F0E490', focusColor: '#F5E070' },
};

export const roseQuartzTheme: Theme = {
  name: 'roseQuartz',
  colors: {
    primary:             "#E0A8B4",
    primaryForeground:   "#581C2A",
    secondary:           "#88C8BC",
    secondaryForeground: "#104840",
    accent:              "#EEBEC8",
    accentForeground:    "#581C2A",
    success:             "#88C8BC",
    successForeground:   "#104840",
    warning:             "#F0D898",
    warningForeground:   "#5E4A0E",
    error:               "#E8A0A8",
    errorForeground:     "#581C2A",
    info:                "#A8CCEC",
    infoForeground:      "#183A5C",
    background:          "#FDF4F6",
    foreground:          "#3A1020",
    muted:               "#F4D8E0",
    mutedForeground:     "#9A6070",
    border:              "#EABEC8",
    focusRing:           "#E0A8B4",
    selection:           "#EEBEC8",
    selectionForeground: "#581C2A",
  },
  spacing: SHARED_SPACING,
  typography: SHARED_TYPO,
  border: { style: 'round', color: '#EABEC8', focusColor: '#E0A8B4' },
};

export const sageGardenTheme: Theme = {
  name: 'sageGarden',
  colors: {
    primary:             "#A8C89C",
    primaryForeground:   "#1E4018",
    secondary:           "#E0A898",
    secondaryForeground: "#5E2010",
    accent:              "#C0D8B4",
    accentForeground:    "#1E4018",
    success:             "#A8C89C",
    successForeground:   "#1E4018",
    warning:             "#ECDCA0",
    warningForeground:   "#5E4A10",
    error:               "#E8A8A8",
    errorForeground:     "#5E1818",
    info:                "#A8C0DC",
    infoForeground:      "#1C3858",
    background:          "#F4F8F2",
    foreground:          "#182E12",
    muted:               "#D0E4C8",
    mutedForeground:     "#5A7850",
    border:              "#B8D4AC",
    focusRing:           "#A8C89C",
    selection:           "#C0D8B4",
    selectionForeground: "#1E4018",
  },
  spacing: SHARED_SPACING,
  typography: SHARED_TYPO,
  border: { style: 'round', color: '#B8D4AC', focusColor: '#A8C89C' },
};

export const lilacMistTheme: Theme = {
  name: 'lilacMist',
  colors: {
    primary:             "#CCA8E8",
    primaryForeground:   "#3C1060",
    secondary:           "#88D8CC",
    secondaryForeground: "#0C4840",
    accent:              "#DEC0F8",
    accentForeground:    "#3C1060",
    success:             "#88D8CC",
    successForeground:   "#0C4840",
    warning:             "#EEE0A4",
    warningForeground:   "#5C4C10",
    error:               "#ECA8C0",
    errorForeground:     "#5C1838",
    info:                "#A8C4F4",
    infoForeground:      "#183280",
    background:          "#FAF4FF",
    foreground:          "#280C48",
    muted:               "#EAD8FA",
    mutedForeground:     "#8060A8",
    border:              "#D8C0EE",
    focusRing:           "#CCA8E8",
    selection:           "#DEC0F8",
    selectionForeground: "#3C1060",
  },
  spacing: SHARED_SPACING,
  typography: SHARED_TYPO,
  border: { style: 'round', color: '#D8C0EE', focusColor: '#CCA8E8' },
};

export const coralReefTheme: Theme = {
  name: 'coralReef',
  colors: {
    primary:             "#F49080",
    primaryForeground:   "#5E1A10",
    secondary:           "#8AA8F4",
    secondaryForeground: "#10287A",
    accent:              "#F8AAAA",
    accentForeground:    "#5E1A10",
    success:             "#9CDCB4",
    successForeground:   "#1A5034",
    warning:             "#F8E098",
    warningForeground:   "#6A4C0E",
    error:               "#F49080",
    errorForeground:     "#5E1A10",
    info:                "#8AA8F4",
    infoForeground:      "#10287A",
    background:          "#FFF5F3",
    foreground:          "#3A1008",
    muted:               "#FAD4CC",
    mutedForeground:     "#A05040",
    border:              "#F4B8AC",
    focusRing:           "#F49080",
    selection:           "#F8AAAA",
    selectionForeground: "#5E1A10",
  },
  spacing: SHARED_SPACING,
  typography: SHARED_TYPO,
  border: { style: 'round', color: '#F4B8AC', focusColor: '#F49080' },
};

export const pastelNightTheme: Theme = {
  name: 'pastelNight',
  colors: {
    primary:             "#FF9EB5",
    primaryForeground:   "#1E1E2E",
    secondary:           "#78BCDC",
    secondaryForeground: "#0A1E2E",
    accent:              "#FFCCD8",
    accentForeground:    "#1E1E2E",
    success:             "#78D4A0",
    successForeground:   "#061A10",
    warning:             "#F0E86A",
    warningForeground:   "#201C00",
    error:               "#FF7080",
    errorForeground:     "#FFFFFF",
    info:                "#78BCDC",
    infoForeground:      "#0A1E2E",
    background:          "#1E1E2E",
    foreground:          "#CDD6F4",
    muted:               "#2E3050",
    mutedForeground:     "#8890B8",
    border:              "#404260",
    focusRing:           "#FF9EB5",
    selection:           "#3C2E48",
    selectionForeground: "#FF9EB5",
  },
  spacing: SHARED_SPACING,
  typography: SHARED_TYPO,
  border: { style: 'round', color: '#404260', focusColor: '#FF9EB5' },
};

export const draculaTheme: Theme = {
  name: 'dracula',
  colors: {
    primary:             "#C090FA",
    primaryForeground:   "#10081C",
    secondary:           "#50E880",
    secondaryForeground: "#001808",
    accent:              "#FF80CC",
    accentForeground:    "#1C0010",
    success:             "#50E880",
    successForeground:   "#001808",
    warning:             "#FFB86C",
    warningForeground:   "#1A0A00",
    error:               "#FF6060",
    errorForeground:     "#F8F8F2",
    info:                "#80E4FF",
    infoForeground:      "#001820",
    background:          "#282A36",
    foreground:          "#F8F8F2",
    muted:               "#363849",
    mutedForeground:     "#8090B0",
    border:              "#484A60",
    focusRing:           "#C090FA",
    selection:           "#44475A",
    selectionForeground: "#F8F8F2",
  },
  spacing: SHARED_SPACING,
  typography: SHARED_TYPO,
  border: { style: 'round', color: '#484A60', focusColor: '#C090FA' },
};

export const midnightTheme: Theme = {
  name: 'midnight',
  colors: {
    primary:             "#8B5CF6",
    primaryForeground:   "#FFFFFF",
    secondary:           "#14C8B4",
    secondaryForeground: "#001814",
    accent:              "#A880FA",
    accentForeground:    "#FFFFFF",
    success:             "#14C8B4",
    successForeground:   "#001814",
    warning:             "#F8C040",
    warningForeground:   "#180E00",
    error:               "#F06060",
    errorForeground:     "#FFFFFF",
    info:                "#4AACF8",
    infoForeground:      "#001828",
    background:          "#09090B",
    foreground:          "#F4F4F5",
    muted:               "#1E1E24",
    mutedForeground:     "#9090A0",
    border:              "#303040",
    focusRing:           "#8B5CF6",
    selection:           "#3C1880",
    selectionForeground: "#E8D8FF",
  },
  spacing: SHARED_SPACING,
  typography: SHARED_TYPO,
  border: { style: 'round', color: '#303040', focusColor: '#8B5CF6' },
};

export const THEMES: Record<string, Theme> = {
  dracula: draculaTheme,
  midnight: midnightTheme,
  pastelNight: pastelNightTheme,
  cherryBlossom: cherryBlossomTheme,
  mintJulep: mintJulepTheme,
  lavenderDusk: lavenderDuskTheme,
  peachSorbet: peachSorbetTheme,
  skyMist: skyMistTheme,
  butterCream: butterCreamTheme,
  roseQuartz: roseQuartzTheme,
  sageGarden: sageGardenTheme,
  lilacMist: lilacMistTheme,
  coralReef: coralReefTheme,
};

export function getThemeByName(name: string): Theme {
  return THEMES[name] || THEMES.dracula; // Default to dracula if not found
}

// ─── ThemeContext & ThemeProvider ─────────────────────────────────────────────

interface ThemeContextValue {
  theme: Theme;
  setTheme: (t: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: midnightTheme,
  setTheme: () => {},
});

export interface ThemeProviderProps {
  theme?: Theme;
  children: ReactNode;
}

export function ThemeProvider({ theme = midnightTheme, children }: ThemeProviderProps) {
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
