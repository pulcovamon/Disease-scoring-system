import React from "react";
import { Patient } from "../classes/patient";
import HeatMapRow from "./HeatmapRow";

export default function Heatmap({ patient, titleVisible }: { patient: Patient, titleVisible: boolean }) {
    const header = [...Array(patient.active_phase.ground_truth.length + 1)]
    return (
        <div className="page-content">
            {titleVisible ? <h1>Ground-truth X Prediction</h1> : ""}
            <table className="heatmap">
                <thead>
                    <tr>
                        <th>Category</th>
                        {header.map((_, index) => (
                            <th key={index}>{index === 0 ? "" : index}</th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    <HeatMapRow
                        categoryName="ICD10 Multiclass"
                        groundTruth={patient.icd10_multiclass.ground_truth}
                        prediction={patient.icd10_multiclass.prediction}
                    />
                    <HeatMapRow
                        categoryName="ICD10 Binary"
                        groundTruth={patient.icd10_binary.ground_truth}
                        prediction={patient.icd10_binary.prediction}
                    />
                    <HeatMapRow
                        categoryName="Active Phase"
                        groundTruth={patient.active_phase.ground_truth}
                        prediction={patient.active_phase.prediction}
                    />
                </tbody>
            </table>
        </div>
    );
}
