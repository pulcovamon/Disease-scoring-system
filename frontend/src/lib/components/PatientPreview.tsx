import { Patient } from "../classes/patient";

export default function PatientPreview({
  patient,
  codes,
}: {
  patient: Patient;
  codes: string[];
}) {
  return (
    <div className="data-preview">
      <h4>Data Preview</h4>
      <div className="data-input-preview">
      <span>Name: <span className="patient-value">
      {patient.name}
        </span></span>
      <span>Surname: <span className="patient-value">
      {patient.surname}
        </span></span>
      <div className="codes-preview">
        {codes.map((code) => {
          return <span className="code-list">{code}</span>;
        })}
      </div>
      </div>
    </div>
  );
}
