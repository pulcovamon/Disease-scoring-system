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
      <td>
        <div className="icd10-legend">
          <div className="icd10-row">Ground-truth</div>
          <div className="icd10-row">Prediction</div>
        </div>
      </td>
      {groundTruth.map((code: string | boolean, index) => {
        const match = code === prediction[index];
        const backgroundColor = match ? "lightgreen" : "lightcoral";
        const displayGroundTruth =
          typeof code === "boolean" ? (code ? "Yes" : "No") : code;
        const displayPrediction =
          typeof prediction[index] === "boolean"
            ? prediction[index]
              ? "Yes"
              : "No"
            : prediction[index];

        return (
          <td key={index} style={{ backgroundColor }}>
            <div className="icd10">
              <div className="icd10-row">{displayGroundTruth}</div>
              <div className="icd10-row">{displayPrediction}</div>
            </div>
          </td>
        );
      })}
    </tr>
  );
}
