import chroma from "chroma-js";
import { getMethod } from "../classes/api";

export type ColorMode = "specialty" | "tfidf0" | "tfidf1" | "frequency";
export type ThemeMode = "light" | "dark";

type ThemePalette = {
  specialty: Record<string, string>;
  unknown: string;
  textOnColor: string;
  textOnNeutral: string;
};

const paletteLight: ThemePalette = {
  specialty: {
    "klinická onkologie": "#a855f7",
    "pneumologie a ftizeologie": "#0ea5e9",
    "alergologie a klinická imunologie": "#22c55e",
    "klinická osteologie": "#f59e0b",
  },
  unknown: "#e2e8f0",
  textOnColor: "#0f172a",
  textOnNeutral: "#0f172a",
};

const paletteDark: ThemePalette = {
  specialty: {
    "klinická onkologie": "#7c3aed",
    "pneumologie a ftizeologie": "#0891b2",
    "alergologie a klinická imunologie": "#16a34a",
    "klinická osteologie": "#d97706",
  },
  unknown: "#0b1220",
  textOnColor: "#f8fafc",
  textOnNeutral: "#f8fafc",
};

function isDarkTheme(): boolean {
  if (typeof document === "undefined") return false;
  return document.documentElement.classList.contains("dark");
}

function resolvePalette(theme?: ThemeMode): ThemePalette {
  const isDark = theme ? theme === "dark" : isDarkTheme();
  return isDark ? paletteDark : paletteLight;
}

export function getCategoricalColor(specialty?: string | null, theme?: ThemeMode): string {
  const key = specialty?.toLowerCase().trim() || "unknown";
  const palette = resolvePalette(theme);
  return palette.specialty[key] || palette.unknown;
}

export function getPalette(theme?: ThemeMode): ThemePalette {
  return resolvePalette(theme);
}
function normalizeSigmoid(value: number, mean: number, std: number): number {
  if (std === 0) return 0.5;
  const z = (value - mean) / std;
  return 1 / (1 + Math.exp(-z));
}

function normalizeLogSigmoid(value: number, logMean: number, logStd: number): number {
  const logVal = Math.log1p(value);
  return normalizeSigmoid(logVal, logMean, logStd);
}

export function getContinuousColor(
  value: number,
  stats: { mean: number; std: number; logMean: number; logStd: number },
  mode: "tfidf0" | "tfidf1" | "frequency",
  theme?: ThemeMode
): string {
  const norm = normalizeLogSigmoid(value, stats.logMean, stats.logStd);
  const dark = theme ? theme === "dark" : isDarkTheme();
  switch (mode) {
    case "tfidf0":
      return chroma
        .scale(dark ? ["#0b1220", "#0284c7"] : ["#e0f2fe", "#06b6d4"])
        .mode("lab")(norm)
        .hex(); // cyan gradient tuned per theme
    case "tfidf1":
      return chroma
        .scale(dark ? ["#1b1325", "#7c3aed"] : ["#f1e9ff", "#8b5cf6"])
        .mode("lab")(norm)
        .hex(); // violet gradient tuned per theme
    case "frequency":
      return chroma
        .scale(dark ? ["#0b1220", "#1f2937", "#94a3b8"] : ["#f8fafc", "#cbd5e1", "#1f2937"])
        .mode("lab")(norm)
        .hex(); // cool neutral
    default:
      return "#ccc";
  }
}

export function getColorStyleFromValue(
  value: number,
  stats: { mean: number; std: number; logMean: number; logStd: number },
  mode: "tfidf0" | "tfidf1" | "frequency",
  theme?: ThemeMode
): React.CSSProperties {
  const bg = getContinuousColor(value, stats, mode, theme);
  const palette = getPalette(theme);
  const textColor = palette.textOnColor;
  return {
    backgroundColor: bg,
    color: textColor,
  };
}

function isDarkColor(color: string): boolean {
  return chroma(color).luminance() < 0.5;
}

export type StatMap = {
  tfidf0: Stats;
  tfidf1: Stats;
  frequency: Stats;
};

export type Stats = {
  mean: number;
  std: number;
  logMean: number;
  logStd: number;
};

export async function fetchStats(): Promise<StatMap> {
  return getMethod<StatMap>("/code/aggregated-params");
}
