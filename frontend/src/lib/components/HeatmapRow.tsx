import React from "react";

 export default function HeatMapRow({ categoryName, groundTruth, prediction }: { categoryName: string, groundTruth: string[] | boolean[], prediction: string[] | boolean[] } ) {
    return (
        <tr>
            <th>{categoryName}</th>
            <td>
            <div className="icd10-legend">
                            Ground-truth
                            <br />
                            Prediction
                        </div>
            </td>
            {groundTruth.map((code: string | boolean, index) => {
                const match = code === prediction[index];
                const backgroundColor = match ? "lightgreen" : "lightcoral";
                const displayGroundTruth = typeof code === "boolean" ? (code ? "Yes" : "No") : code;
                const displayPrediction = typeof prediction[index] === "boolean" ? (prediction[index] ? "Yes" : "No") : prediction[index];

                return (
                    <td key={index} style={{ backgroundColor }}>
                        <div className="icd10">
                            {displayGroundTruth}
                            <br />
                            {displayPrediction}
                        </div>
                    </td>
                );
            })}
        </tr>
    );
};