import chroma from "chroma-js";
import { getMethod } from "../classes/api";

export type ColorMode = "specialty" | "tfidf0" | "tfidf1" | "frequency";

const categoryColorMap: Record<string, string> = {
  "klinická onkologie": "#f6b26b",
  "pneumologie a ftizeologie": "#6fa8dc",
  "alergologie a klinická imunologie": "#93c47d",
  "klinická osteologie": "#b4a7d6",
  "unknown": "#d9d9d9",
};

export function getCategoricalColor(specialty?: string | null): string {
  const key = specialty?.toLowerCase().trim() || "unknown";
  return categoryColorMap[key] || categoryColorMap["unknown"];
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
  mode: "tfidf0" | "tfidf1" | "frequency"
): string {
  const norm = normalizeLogSigmoid(value, stats.logMean, stats.logStd);
  switch (mode) {
    case "tfidf0":
      return chroma.scale(["#e6f0ff", "#003366"]).mode("lab")(norm).hex();
    case "tfidf1":
      return chroma.scale(["#f0e6ff", "#330066"]).mode("lab")(norm).hex();
    case "frequency":
      return chroma.scale(["#eeeeee", "#111111"]).mode("lab")(norm).hex();
    default:
      return "#ccc";
  }
}

export function getColorStyleFromValue(
  value: number,
  stats: { mean: number; std: number; logMean: number; logStd: number },
  mode: "tfidf0" | "tfidf1" | "frequency"
): React.CSSProperties {
  const bg = getContinuousColor(value, stats, mode);
  const dark = isDarkColor(bg);
  return {
    backgroundColor: bg,
    color: dark ? "#fff" : "#000",
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
