// Per-user theme presets stored locally (no DB).
// Each preset overrides a small set of HSL CSS variables on :root.

export type ThemeId = "midnight" | "graphite" | "slate" | "dim" | "daylight" | "custom";

export interface ThemeVars {
  background: string;
  foreground: string;
  card: string;
  popover: string;
  secondary: string;
  muted: string;
  mutedForeground: string;
  accent: string;
  border: string;
  input: string;
  sidebarBg: string;
  sidebarFg: string;
  sidebarAccent: string;
  sidebarBorder: string;
  primary: string;
  primaryForeground: string;
  ring: string;
}

export interface ThemePreset {
  id: ThemeId;
  label: string;
  swatch: string; // hsl() preview
  vars: ThemeVars;
}

const make = (
  id: ThemeId,
  label: string,
  swatch: string,
  vars: ThemeVars
): ThemePreset => ({ id, label, swatch, vars });

// Original (current default)
const midnight: ThemeVars = {
  background: "0 0% 6%",
  foreground: "0 0% 96%",
  card: "0 0% 9%",
  popover: "0 0% 8%",
  secondary: "0 0% 14%",
  muted: "0 0% 12%",
  mutedForeground: "0 0% 60%",
  accent: "0 0% 18%",
  border: "0 0% 16%",
  input: "0 0% 14%",
  sidebarBg: "0 0% 4%",
  sidebarFg: "0 0% 80%",
  sidebarAccent: "0 0% 12%",
  sidebarBorder: "0 0% 14%",
  primary: "0 0% 96%",
  primaryForeground: "0 0% 8%",
  ring: "0 0% 70%",
};

// Lighter dark grey
const graphite: ThemeVars = {
  background: "0 0% 14%",
  foreground: "0 0% 96%",
  card: "0 0% 18%",
  popover: "0 0% 16%",
  secondary: "0 0% 22%",
  muted: "0 0% 20%",
  mutedForeground: "0 0% 70%",
  accent: "0 0% 26%",
  border: "0 0% 24%",
  input: "0 0% 22%",
  sidebarBg: "0 0% 11%",
  sidebarFg: "0 0% 88%",
  sidebarAccent: "0 0% 20%",
  sidebarBorder: "0 0% 22%",
  primary: "0 0% 96%",
  primaryForeground: "0 0% 12%",
  ring: "0 0% 75%",
};

// Cool blue-grey
const slate: ThemeVars = {
  background: "215 28% 12%",
  foreground: "210 30% 96%",
  card: "215 25% 16%",
  popover: "215 25% 14%",
  secondary: "215 22% 22%",
  muted: "215 20% 20%",
  mutedForeground: "215 15% 70%",
  accent: "215 25% 28%",
  border: "215 20% 24%",
  input: "215 22% 22%",
  sidebarBg: "215 30% 9%",
  sidebarFg: "210 25% 88%",
  sidebarAccent: "215 22% 20%",
  sidebarBorder: "215 20% 22%",
  primary: "210 30% 96%",
  primaryForeground: "215 28% 12%",
  ring: "215 20% 70%",
};

// Soft dim (warmer, easier on eyes)
const dim: ThemeVars = {
  background: "30 6% 18%",
  foreground: "30 15% 94%",
  card: "30 6% 22%",
  popover: "30 6% 20%",
  secondary: "30 5% 28%",
  muted: "30 5% 26%",
  mutedForeground: "30 8% 72%",
  accent: "30 5% 32%",
  border: "30 5% 30%",
  input: "30 5% 28%",
  sidebarBg: "30 6% 14%",
  sidebarFg: "30 12% 86%",
  sidebarAccent: "30 5% 26%",
  sidebarBorder: "30 5% 28%",
  primary: "30 15% 94%",
  primaryForeground: "30 6% 18%",
  ring: "30 8% 72%",
};

// Light mode
const daylight: ThemeVars = {
  background: "0 0% 98%",
  foreground: "0 0% 10%",
  card: "0 0% 100%",
  popover: "0 0% 100%",
  secondary: "0 0% 94%",
  muted: "0 0% 95%",
  mutedForeground: "0 0% 40%",
  accent: "0 0% 92%",
  border: "0 0% 88%",
  input: "0 0% 92%",
  sidebarBg: "0 0% 96%",
  sidebarFg: "0 0% 20%",
  sidebarAccent: "0 0% 92%",
  sidebarBorder: "0 0% 88%",
  primary: "0 0% 10%",
  primaryForeground: "0 0% 98%",
  ring: "0 0% 30%",
};

export const PRESETS: ThemePreset[] = [
  make("midnight", "Midnight", "hsl(0 0% 6%)", midnight),
  make("graphite", "Graphite", "hsl(0 0% 18%)", graphite),
  make("slate", "Slate Blue", "hsl(215 28% 16%)", slate),
  make("dim", "Warm Dim", "hsl(30 6% 22%)", dim),
  make("daylight", "Daylight", "hsl(0 0% 98%)", daylight),
];

export interface StoredTheme {
  id: ThemeId;
  custom?: ThemeVars;
}

const STORAGE_KEY = "bumble-theme-v1";

export const loadTheme = (): StoredTheme => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { id: "midnight" };
    const parsed = JSON.parse(raw) as StoredTheme;
    return parsed?.id ? parsed : { id: "midnight" };
  } catch {
    return { id: "midnight" };
  }
};

export const saveTheme = (t: StoredTheme) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(t));
};

export const getVars = (t: StoredTheme): ThemeVars => {
  if (t.id === "custom" && t.custom) return t.custom;
  const preset = PRESETS.find((p) => p.id === t.id) ?? PRESETS[0];
  return preset.vars;
};

export const applyTheme = (t: StoredTheme) => {
  const v = getVars(t);
  const root = document.documentElement;
  const set = (k: string, val: string) => root.style.setProperty(k, val);

  set("--background", v.background);
  set("--foreground", v.foreground);
  set("--card", v.card);
  set("--card-foreground", v.foreground);
  set("--popover", v.popover);
  set("--popover-foreground", v.foreground);
  set("--primary", v.primary);
  set("--primary-foreground", v.primaryForeground);
  set("--secondary", v.secondary);
  set("--secondary-foreground", v.foreground);
  set("--muted", v.muted);
  set("--muted-foreground", v.mutedForeground);
  set("--accent", v.accent);
  set("--accent-foreground", v.foreground);
  set("--border", v.border);
  set("--input", v.input);
  set("--ring", v.ring);
  set("--sidebar-background", v.sidebarBg);
  set("--sidebar-foreground", v.sidebarFg);
  set("--sidebar-primary", v.primary);
  set("--sidebar-primary-foreground", v.primaryForeground);
  set("--sidebar-accent", v.sidebarAccent);
  set("--sidebar-accent-foreground", v.foreground);
  set("--sidebar-border", v.sidebarBorder);
  set("--sidebar-ring", v.ring);
};

// Convert a hex color (#rrggbb) to "H S% L%" for HSL CSS vars
export const hexToHsl = (hex: string): string => {
  const m = hex.replace("#", "");
  const r = parseInt(m.substring(0, 2), 16) / 255;
  const g = parseInt(m.substring(2, 4), 16) / 255;
  const b = parseInt(m.substring(4, 6), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h *= 60;
  }
  return `${Math.round(h)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
};

// Build a theme from a single base color (chooses light/dark surfaces from L)
export const buildCustomFromBase = (hex: string): ThemeVars => {
  const baseHsl = hexToHsl(hex);
  const [hStr, sStr, lStr] = baseHsl.split(" ");
  const h = parseInt(hStr, 10);
  const s = Math.min(parseInt(sStr, 10), 30); // mute saturation for surfaces
  const l = parseInt(lStr, 10);
  const isLight = l > 60;

  if (isLight) {
    return {
      background: `${h} ${s}% 96%`,
      foreground: `${h} 10% 12%`,
      card: `${h} ${s}% 100%`,
      popover: `${h} ${s}% 100%`,
      secondary: `${h} ${s}% 92%`,
      muted: `${h} ${s}% 93%`,
      mutedForeground: `${h} 8% 40%`,
      accent: `${h} ${s}% 88%`,
      border: `${h} ${s}% 84%`,
      input: `${h} ${s}% 90%`,
      sidebarBg: `${h} ${s}% 94%`,
      sidebarFg: `${h} 10% 20%`,
      sidebarAccent: `${h} ${s}% 88%`,
      sidebarBorder: `${h} ${s}% 84%`,
      primary: `${h} 10% 12%`,
      primaryForeground: `${h} ${s}% 98%`,
      ring: `${h} 10% 30%`,
    };
  }
  return {
    background: `${h} ${s}% 14%`,
    foreground: `${h} 15% 96%`,
    card: `${h} ${s}% 18%`,
    popover: `${h} ${s}% 16%`,
    secondary: `${h} ${s}% 22%`,
    muted: `${h} ${s}% 20%`,
    mutedForeground: `${h} 10% 70%`,
    accent: `${h} ${s}% 26%`,
    border: `${h} ${s}% 24%`,
    input: `${h} ${s}% 22%`,
    sidebarBg: `${h} ${s}% 11%`,
    sidebarFg: `${h} 12% 88%`,
    sidebarAccent: `${h} ${s}% 20%`,
    sidebarBorder: `${h} ${s}% 22%`,
    primary: `${h} 15% 96%`,
    primaryForeground: `${h} ${s}% 14%`,
    ring: `${h} 10% 75%`,
  };
};
