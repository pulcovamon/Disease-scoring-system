import React from "react";

export default function HeatMapRow({
  categoryName,
  groundTruth,
  prediction,
}: {
  categoryName: string;
  groundTruth: string[] | boolean[];
  prediction: string[] | boolean[];
}) {
  return (
    <tr className="heatmap-row">
      <th className="category-name">{categoryName}</th>
      {groundTruth.map((code: string | boolean, index) => {
        const match = code === prediction[index];
        const backgroundColor = match ? "var(--heatmap-match)" : "var(--heatmap-mismatch)";
        const displayGroundTruth =
          typeof code === "boolean" ? (code ? "Yes" : "No") : code;
        const displayPrediction =
          typeof prediction[index] === "boolean"
            ? prediction[index]
              ? "Yes"
              : "No"
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
            title={`GT: ${displayGroundTruth} | Pred: ${displayPrediction}`}
          >
            <div className="icd10 sr-only">
              <div className="icd10-row">GT: {displayGroundTruth}</div>
              <div className="icd10-row">Pred: {displayPrediction}</div>
            </div>
          </td>
        );
      })}
    </tr>
  );
}
