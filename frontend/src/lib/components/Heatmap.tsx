import { useState, useEffect } from "react";
import { Patient } from "../classes/catalogData";
import HeatMapRow from "./HeatmapRow";
import "./heatmap.css";
import { useTranslations } from "../i18n/useTranslations";

function useChunkSize(chunkSize: "auto" | number): number {
  if (chunkSize === "auto") {
    const getSize = () => (window.innerWidth < 900 || (window.innerWidth > 1024 && window.innerWidth < 2000)  ? 5 : 10);
    const [autoChunkSize, setChunkSize] = useState(getSize);
    chunkSize = autoChunkSize;
    useEffect(() => {
      const handler = () => setChunkSize(getSize());
      window.addEventListener("resize", handler);
      return () => window.removeEventListener("resize", handler);
    }, []);
  }
  return chunkSize;
}

export default function Heatmap({
  patient,
  patients,
  titleVisible = false,
  mode = "detail",
  chunkSize = "auto",
}: {
  patient?: Patient;
  patients?: Patient[];
  titleVisible?: boolean;
  mode?: "detail" | "summary",
  chunkSize?: "auto" | number,
}) {
  const { t } = useTranslations();
  const CHUNK_SIZE = useChunkSize(chunkSize);

  if (mode === "summary" && patients) {
    const chunks: Patient[][] = [];
    for (let i = 0; i < patients.length; i += CHUNK_SIZE) {
      chunks.push(patients.slice(i, i + CHUNK_SIZE));
    }

    return (
      <div className={titleVisible ? "box page-content" : ""}>
        {titleVisible ? <h1 className="title">{t("heatmap.title")}</h1> : null}
        <div className="heatmap-scroll">
          <div className="heatmap-multirow">
            {chunks.map((chunk, chunkIndex) => (
              <table
                key={chunkIndex}
                className={`heatmap-table heatmap-table--chunk${chunkIndex === 0 ? " heatmap-table--first" : ""}${chunkIndex === chunks.length - 1 ? " heatmap-table--last" : ""}`}
              >
                <thead>
                  <tr>
                    <th>{t("heatmap.header.patient")}</th>
                    {chunk.map((p, index) => (
                      <th key={`${p._id}-header-${index}`}>{p._id}</th>
                    ))}
                    {Array.from({ length: CHUNK_SIZE - chunk.length }, (_, i) => (
                      <th key={`pad-${i}`} className="heatmap-cell--empty" />
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <HeatMapRow
                    categoryName={t("heatmap.row.multiclass")}
                    patients={chunk}
                    mode="summary"
                    summaryType="icd10_multiclass"
                    padTo={CHUNK_SIZE}
                  />
                  <HeatMapRow
                    categoryName={t("heatmap.row.binary")}
                    patients={chunk}
                    mode="summary"
                    summaryType="icd10_binary"
                    padTo={CHUNK_SIZE}
                  />
                  <HeatMapRow
                    categoryName={t("heatmap.row.active")}
                    patients={chunk}
                    mode="summary"
                    summaryType="active_phase"
                    padTo={CHUNK_SIZE}
                  />
                </tbody>
              </table>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Detail mode
  if (patient) {
    const hasMulticlass = patient.icd10_multiclass.ground_truth.length > 0;
    const hasBinary = patient.icd10_binary.ground_truth.length > 0;
    const total = patient.active_phase.ground_truth.length;
    const chunks: number[] = [];
    for (let i = 0; i < total; i += CHUNK_SIZE) chunks.push(i);

    return (
      <div className={titleVisible ? "box page-content" : ""}>
        {titleVisible ? <h1 className="title">{t("heatmap.title")}</h1> : null}
        <div className="heatmap-scroll">
          <div className="heatmap-multirow">
            {chunks.map((start, chunkIndex) => {
              const end = Math.min(start + CHUNK_SIZE, total);
              const isFirst = chunkIndex === 0;
              const isLast = chunkIndex === chunks.length - 1;
              return (
                <table
                  key={chunkIndex}
                  className={`heatmap-table heatmap-table--chunk${isFirst ? " heatmap-table--first" : ""}${isLast ? " heatmap-table--last" : ""}`}
                >
                  <thead>
                    <tr>
                      <th>{t("heatmap.header.interval")}</th>
                      {Array.from({ length: end - start }, (_, i) => (
                        <th key={i}>{start + i + 1}</th>
                      ))}
                      {Array.from({ length: CHUNK_SIZE - (end - start) }, (_, i) => (
                        <th key={`pad-${i}`} className="heatmap-cell--empty" />
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {hasMulticlass && (
                      <HeatMapRow
                        categoryName={t("heatmap.row.multiclass")}
                        groundTruth={patient.icd10_multiclass.ground_truth.slice(start, end)}
                        prediction={patient.icd10_multiclass.prediction.slice(start, end)}
                        padTo={CHUNK_SIZE}
                      />
                    )}
                    {hasBinary && (
                      <HeatMapRow
                        categoryName={t("heatmap.row.binary")}
                        groundTruth={patient.icd10_binary.ground_truth.slice(start, end)}
                        prediction={patient.icd10_binary.prediction.slice(start, end)}
                        padTo={CHUNK_SIZE}
                      />
                    )}
                    <HeatMapRow
                      categoryName={t("heatmap.row.active")}
                      groundTruth={patient.active_phase.ground_truth.slice(start, end)}
                      prediction={patient.active_phase.prediction.slice(start, end)}
                      padTo={CHUNK_SIZE}
                    />
                  </tbody>
                </table>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  return null;
}
