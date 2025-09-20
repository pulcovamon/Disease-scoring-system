import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Patient } from "../classes/patient";
import { faDatabase } from "@fortawesome/free-solid-svg-icons";

export default function PatientPreview({
  patient,
  codes,
}: {
  patient: Patient;
  codes: string[];
}) {
  return (
    <div className="data-preview">
      <h4>Data Preview{" "}
        <FontAwesomeIcon icon={faDatabase} />
      </h4>
      <div className="data-input-preview">
      <span>Name: <span className="patient-value">
      {patient.name}
        </span></span>
      <span>Surname: <span className="patient-value">
      {patient.surname}
        </span></span>
      <div className="codes-preview">
        {codes.map((code, index) => {
          return <span key={index} className="code-list">{code}</span>;
        })}
      </div>
      </div>
    </div>
  );
}
