import React from "react";
import { useTranslations } from "../i18n/useTranslations";

export default function HeatMapRow({
  categoryName,
  groundTruth,
  prediction,
}: {
  categoryName: string;
  groundTruth: string[] | boolean[];
  prediction: string[] | boolean[];
}) {
  const { t } = useTranslations();
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
