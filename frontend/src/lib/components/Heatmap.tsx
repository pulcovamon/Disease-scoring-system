import React from "react";
import { Patient } from "../classes/patient";

export default function PatientCodes({ patient }: { patient: Patient }) {
    const createRow = (categoryName: string, groundTruth: string[] | boolean[], prediction: string[] | boolean[]) => {
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

    return (
        <div className="page-content">
            <h1>Ground-truth X Prediction</h1>
            <table className="heatmap">
                <thead>
                    <tr>
                        <th>Category</th>
                        {patient.icd10_multiclass.ground_truth.map((_, index) => (
                            <th key={index}>{index === 0 ? "" : index}</th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {createRow(
                        "ICD10 Multiclass",
                        patient.icd10_multiclass.ground_truth,
                        patient.icd10_multiclass.prediction
                    )}
                    {createRow(
                        "ICD10 Binary",
                        patient.icd10_binary.ground_truth,
                        patient.icd10_binary.prediction
                    )}
                    {createRow(
                        "Active Phase",
                        patient.active_phase.ground_truth,
                        patient.active_phase.prediction
                    )}
                </tbody>
            </table>
        </div>
    );
}
