import { useEffect, useState } from "react";
import { Patient } from "../classes/catalogData";
import { getMethod } from "../classes/api";
import { CodeInfo } from "../classes/data";
import { codeCache } from "../classes/codeCache";
import Legend from "./Legend";
import {
  getColorStyleFromValue,
  getCategoricalColor,
  fetchStats,
  StatMap,
  getPalette,
  ThemeMode,
} from "../utils/colorUtils";
import { useTheme } from "../store/theme";
import { useTranslations } from "../i18n/useTranslations";

codeCache.init();

export default function PatientCodes({
  patient,
  titleVisible,
  currentCode,
  colorMode,
  onColorModeChange,
}: {
  patient: Patient;
  titleVisible: boolean;
  currentCode: string | null;
  colorMode: "specialty" | "tfidf0" | "tfidf1" | "frequency";
  onColorModeChange: (mode: "specialty" | "tfidf0" | "tfidf1" | "frequency") => void;
}) {
  const { theme } = useTheme();
  const { t } = useTranslations();
  const [codeDetails, setCodeDetails] = useState<Record<string, CodeInfo | null>>(() => {
    const fromCache: Record<string, CodeInfo | null> = {};
    for (const code of patient.codes) {
      const cached = codeCache.get(code);
      if (cached !== undefined) {
        fromCache[code] = cached;
      }
    }
    return fromCache;
  });

  const [stats, setStats] = useState<StatMap | null>(null);

  useEffect(() => {
    fetchStats()
      .then((data) => setStats(data))
      .catch(() => setStats(null));
  }, []);

  useEffect(() => {
    const fetchMissing = async () => {
      const uniqueCodes = Array.from(new Set(patient.codes));
      const results = await Promise.all(
        uniqueCodes.map(async (code) => {
          const info = await codeCache.fetchOrGet(code, () => {
            return getMethod<CodeInfo>(`/code/${code}`);
          }
          );
          return [code, info] as const;
        })
      );
      const newEntries = Object.fromEntries(results);
      setCodeDetails((prev) => ({
        ...prev,
        ...newEntries,
      }));
    };

    fetchMissing();
  }, [patient.codes]);

  const getColorStyle = (info: CodeInfo | null | undefined): React.CSSProperties => {
    if (info === null) {
      const palette = getPalette(theme as ThemeMode);
      const isDark = (theme as ThemeMode) === "dark";
      return {
        backgroundColor: palette.unknown,
        color: palette.textOnNeutral,
        backgroundImage: isDark
          ? "repeating-linear-gradient(45deg, rgba(255,255,255,0.1), rgba(255,255,255,0.1) 4px, rgba(255,255,255,0.04) 4px, rgba(255,255,255,0.04) 8px)"
          : "repeating-linear-gradient(45deg, #ddd, #ddd 4px, #fff 4px, #fff 8px)",
      };
    }

    if (info === undefined) {
      const palette = getPalette(theme as ThemeMode);
      return {
        backgroundColor: palette.unknown,
        color: palette.textOnNeutral,
      };
    }

    if (colorMode === "specialty") {
      return {
        backgroundColor: getCategoricalColor(info.specialty, theme as ThemeMode),
        color: getPalette(theme as ThemeMode).textOnColor,
      };
    }

    const value =
      colorMode === "tfidf0"
        ? info.tfidf_label_0 ?? 0
        : colorMode === "tfidf1"
        ? info.tfidf_label_1 ?? 0
        : info.frequency ?? 1;

    if (!stats) return {};

    return getColorStyleFromValue(value, stats[colorMode], colorMode, theme as ThemeMode);
  };

  const codes = patient.codes.map((code, index) => {
    const info = codeDetails[code] ?? codeCache.get(code);
    const style = getColorStyle(info);

    const isUnknown = info === null;

    return (
      <li
        key={index}
        className={`px-3 py-2 rounded-xl text-sm font-semibold border ${
          code === currentCode ? "ring-2 ring-[var(--primary)] ring-offset-1" : ""
        } ${isUnknown ? "code-unknown" : ""}`}
        style={{
          ...style,
          borderColor: code === currentCode ? "var(--primary)" : "var(--border-muted)",
        }}
        title={
          info
            ? `${info.name}${info.specialty ? ` (${info.specialty})` : ""}`
            : info === null
            ? t("codes.status.unknown")
            : t("codes.status.loading")
        }
      >
        {code}
      </li>
    );
  });

  return (
    <div className="space-y-4">
      {titleVisible && <h1 className="text-xl font-semibold text-[var(--text-color)]">{t("codes.title")}</h1>}
      <div className="space-y-3">
        <div className="flex flex-wrap gap-2">
          {[
            { key: "specialty", label: t("codes.mode.specialty") },
            { key: "tfidf0", label: t("codes.mode.tfidf0") },
            { key: "tfidf1", label: t("codes.mode.tfidf1") },
            { key: "frequency", label: t("codes.mode.frequency") },
          ].map((item) => (
            <button
              type="button"
              key={item.key}
              className="px-3 py-2 rounded-lg text-sm font-semibold border transition focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
              style={{
                backgroundColor:
                  colorMode === item.key ? "var(--primary)" : "var(--bg-surface-muted)",
                color: colorMode === item.key ? "#fff" : "var(--text-color)",
                borderColor:
                  colorMode === item.key ? "var(--primary)" : "var(--border-muted)",
              }}
              onClick={() => onColorModeChange(item.key as typeof colorMode)}
            >
              {item.label}
            </button>
          ))}
        </div>
        <Legend mode={colorMode as any} stats={stats} />
      </div>
      <ul className="flex flex-wrap gap-2">{codes}</ul>
    </div>
  );
}
