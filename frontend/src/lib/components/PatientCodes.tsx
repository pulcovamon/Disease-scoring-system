import React from "react";
import { Patient } from "../classes/patient";

export default function Heatmap({ patient }: { patient: Patient}) {
    const codes = patient.codes.map((code) => {
        return <li className="code">{code}</li>
    })
    return <div className="page-content">
        <h1>Codes of ID {patient.catalog_id}</h1>
        <ul className="code-list">
            {codes}
        </ul>
    </div>
}   