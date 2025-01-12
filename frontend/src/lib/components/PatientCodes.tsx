import React from "react";
import { Patient } from "../classes/patient";

export default function PatientCodes({
  patient,
  titleVisible,
  currentCode,
}: {
  patient: Patient;
  titleVisible: boolean;
  currentCode: string | null;
}) {
  const codes = patient.codes.map((code) => {
    return (
      <li className={`code ${code == currentCode ? "current-code" : null}`}>
        {code}
      </li>
    );
  });
  return (
    <div className="box page-content">
      {titleVisible ? <h1 className="title">Codes</h1> : ""}
      <ul className="code-list">{codes}</ul>
    </div>
  );
}
