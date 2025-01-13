import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useState, useEffect, FormEvent } from "react";
import { Patient } from "../classes/patient";
import { faUser } from "@fortawesome/free-solid-svg-icons";

interface NewPatientData {
  patient: Patient;
  handlePatientChange: (patient: Patient) => void;
}

export function NewPatient({ patient, handlePatientChange }: NewPatientData) {
  const [name, setName] = useState<string>(patient.name);
  const [surname, setSurname] = useState<string>(patient.surname);
  const [patients, setPatients] = useState<Patient[]>([]);

  useEffect(() => {
    const allPatients = [
      {
        id: "1",
        name: "Jan",
        surname: "Novak",
      },
      {
        id: "2",
        name: "Jana",
        surname: "Novotna",
      },
    ];

    setPatients([
      {
        id: null,
        name: "",
        surname: "",
      },
      ...allPatients,
    ]);
  }, []);

  function handleNameChange(e: FormEvent<HTMLInputElement>) {
    setName(e.currentTarget.value);
    handlePatientChange({ ...patient, name: e.currentTarget.value });
  }

  function handleSurnameChange(e: FormEvent<HTMLInputElement>) {
    setSurname(e.currentTarget.value);
    handlePatientChange({ ...patient, surname: e.currentTarget.value });
  }

  function handleCurrentPatientChange(e: FormEvent<HTMLSelectElement>) {
    e.preventDefault();
    const currentPatient = patients.filter((p) => {
      if (e.currentTarget.value === "new") {
        return p.id === null;
      } else {
        return e.currentTarget.value === p.id;
      }
    })[0];
    setName(currentPatient.name);
    setSurname(currentPatient.surname);
    handlePatientChange(currentPatient);
  }

  return (
    <div className="form-container">
      <h4>
        Patient
        <FontAwesomeIcon icon={faUser} />
      </h4>
      <div className="patient-form">
        <select
          className="patient-select"
          onChange={(e) => handleCurrentPatientChange(e)}
        >
          {patients.map((currentPatient) => {
            const value = currentPatient.id
              ? `${currentPatient.name} ${currentPatient.surname}`
              : "New patient";
            return (
              <option
                value={currentPatient.id === null ? "new" : currentPatient.id}
              >
                {value}
              </option>
            );
          })}
        </select>
        <label>Name</label>
        <input
          className="code-input"
          type="text"
          value={name}
          onChange={(e) => handleNameChange(e)}
        />
        <label>Surname</label>
        <input
          className="code-input"
          type="text"
          value={surname}
          onChange={(e) => handleSurnameChange(e)}
        />
      </div>
    </div>
  );
}
