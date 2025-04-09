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
} from "../utils/colorUtils";

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
          const info = await codeCache.fetchOrGet(code, () =>
            getMethod<CodeInfo>(`/code/${code}`)
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
      return {
        backgroundImage: "repeating-linear-gradient(45deg, #ddd, #ddd 4px, #fff 4px, #fff 8px)",
        color: "#888",
      };
    }

    if (info === undefined) {
      return {
        backgroundColor: "#f0f0f0",
        color: "#bbb",
      };
    }

    if (colorMode === "specialty") {
      return {
        backgroundColor: getCategoricalColor(info.specialty),
        color: "#000",
      };
    }

    const value =
      colorMode === "tfidf0"
        ? info.tfidf_label_0 ?? 0
        : colorMode === "tfidf1"
        ? info.tfidf_label_1 ?? 0
        : info.frequency ?? 1;

    if (!stats) return {};

    return getColorStyleFromValue(value, stats[colorMode], colorMode);
  };

  const codes = patient.codes.map((code, index) => {
    const info = codeDetails[code] ?? codeCache.get(code);
    const style = getColorStyle(info);

    const isUnknown = info === null;

    return (
      <li
        key={index}
        className={`code ${code === currentCode ? "current-code" : ""} ${isUnknown ? "code-unknown" : ""}`}
        style={style}
        title={
          info
            ? `${info.name}${info.specialty ? ` (${info.specialty})` : ""}`
            : info === null
            ? "Unknown code"
            : "Loading..."
        }
      >
        {code}
      </li>
    );
  });

  return (
    <div className="box page-content">
      {titleVisible && <h1 className="title">Codes</h1>}
      <div className="color-mode-select">
        <label htmlFor="color-mode">Colormap: </label>
        <select
          id="color-mode"
          value={colorMode}
          onChange={(e) =>
            onColorModeChange(e.target.value as typeof colorMode)
          }
        >
          <option value="specialty">Speciality (Odbornost)</option>
          <option value="tfidf0">TF-IDF (active phase 0)</option>
          <option value="tfidf1">TF-IDF (active phase 1)</option>
          <option value="frequency">Frequency</option>
        </select>
        <Legend mode={colorMode} stats={stats} />
      </div>
      <ul className="code-list">{codes}</ul>
    </div>
  );
}
