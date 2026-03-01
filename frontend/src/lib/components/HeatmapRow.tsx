import React from "react";
import { Patient } from "../classes/catalogData";
import { useTranslations } from "../i18n/useTranslations";

export default function HeatMapRow({
  categoryName,
  groundTruth,
  prediction,
  patients,
  mode = "detail",
  summaryType,
}: {
  categoryName: string;
  groundTruth?: string[] | boolean[];
  prediction?: string[] | boolean[];
  patients?: Patient[];
  mode?: "detail" | "summary";
  summaryType?: "icd10_multiclass" | "icd10_binary" | "active_phase";
}) {
  const { t } = useTranslations();
  
  if (mode === "summary" && patients && summaryType) {
    return (
      <tr className="heatmap-row">
        <th className="category-name">{categoryName}</th>
        {patients.map((patient, index) => {
          const summaryValue = patient.summary?.[summaryType] ?? 0;
          // Modern monochromatic purple scheme (better for accessibility)
          const lightness = 85 - (summaryValue * 0.7); // 85% lightness at 0%, 14% at 100%
          const backgroundColor = `hsl(270, 80%, ${lightness}%)`;
          
          return (
            <td
              key={`${patient._id}-${summaryType}-${index}`}
              style={{
                backgroundColor: backgroundColor,
                boxShadow: "inset 0 0 0 1px var(--border-muted)",
              }}
              className="heatmap-cell"
              title={`${t("heatmap.accuracy")}: ${summaryValue}%`}
            >
              <div className="icd10 sr-only">
                <div className="icd10-row">
                  {t("heatmap.accuracy")}: {summaryValue}%
                </div>
              </div>
              <span style={{ color: summaryValue > 50 ? 'white' : 'black' }}>
                {summaryValue}%
              </span>
            </td>
          );
        })}
      </tr>
    );
  }

  // Original detail mode
  if (groundTruth && prediction) {
    return (
      <tr className="heatmap-row">
        <th className="category-name">{categoryName}</th>
        {groundTruth.map((code: string | boolean, index) => {
          const match = code === prediction[index];
          const backgroundColor = match ? "var(--heatmap-match)" : "var(--heatmap-mismatch)";
          const displayGroundTruth =
            typeof code === "boolean" ? (code ? t("heatmap.yes") : t("heatmap.no")) : code;
          const displayPrediction =
            typeof prediction[index] === "boolean"
              ? prediction[index]
                ? t("heatmap.yes")
                : t("heatmap.no")
              : prediction[index];

          return (
            <td
              key={index}
              style={{
                backgroundColor,
                boxShadow: `inset 0 0 0 1px ${match ? "var(--heatmap-match-soft)" : "var(--heatmap-mismatch-soft)"}`,
              }}
              data-gt={displayGroundTruth}
              data-pred={displayPrediction}
              className="heatmap-cell"
              title={`${t("heatmap.gt")}: ${displayGroundTruth} | ${t("heatmap.pred")}: ${displayPrediction}`}
            >
              <div className="icd10 sr-only">
                <div className="icd10-row">
                  {t("heatmap.gt")}: {displayGroundTruth}
                </div>
                <div className="icd10-row">
                  {t("heatmap.pred")}: {displayPrediction}
                </div>
              </div>
            </td>
          );
        })}
      </tr>
    );
  }

  return null;
}
