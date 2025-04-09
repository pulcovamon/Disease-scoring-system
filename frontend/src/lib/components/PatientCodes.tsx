import { useEffect, useState } from "react";
import { Patient } from "../classes/catalogData";
import { getMethod } from "../classes/api";
import { CodeInfo } from "../classes/data";
import { codeCache } from "../classes/codeCache";
import Legend from "./Legend";

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

  const getColorClass = (info: CodeInfo | null) => {
    if (!info) return "code-default";

    if (colorMode === "specialty") {
      const cls = `code-${info.specialty.replace(/\s+/g, "-").toLowerCase()}`;
      console.log("🧠 specialty:", info.specialty, "→", cls);
      return cls;
    }

    return "";
  };

  const getColorStyle = (info: CodeInfo | null) => {
    if (!info) return {};

    switch (colorMode) {
      case "tfidf0": {
        const value = info.tfidf_label_0 ?? 0;
        const intensity = Math.min(1, value * 5);
        return {
          backgroundColor: `rgba(0, 102, 204, ${intensity.toFixed(2)})`,
          color: intensity > 0.6 ? "#fff" : "#000",
        };
      }

      case "tfidf1": {
        const value = info.tfidf_label_1 ?? 0;
        const intensity = Math.min(1, value * 5);
        return {
          backgroundColor: `rgba(153, 51, 255, ${intensity.toFixed(2)})`,
          color: intensity > 0.6 ? "#fff" : "#000",
        };
      }

      case "frequency": {
        const logFreq = Math.log10(info.frequency || 1);
        const normalized = Math.min(1, logFreq / 5);
        const grey = Math.round(255 - normalized * 200);
        return {
          backgroundColor: `rgb(${grey}, ${grey}, ${grey})`,
          color: grey < 100 ? "#fff" : "#000",
        };
      }

      default:
        return {};
    }
  };

  const codes = patient.codes.map((code, index) => {
    const info = codeDetails[code] ?? codeCache.get(code);
    const colorClass = getColorClass(info!);
    const colorStyle = getColorStyle(info!);

    return (
      <li
        key={index}
        className={`code ${code === currentCode ? "current-code" : ""} ${colorClass}`}
        style={colorStyle}
        title={
          info
            ? `${info.name}${info.specialty ? ` (${info.specialty})` : ""}`
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
          <option value="frequency">Frequence</option>
        </select>
        <Legend mode={colorMode} />
      </div>
      <ul className="code-list">{codes}</ul>
    </div>
  );
}
