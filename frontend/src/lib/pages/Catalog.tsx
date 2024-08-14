import React, { useState, useEffect } from "react";
import { Patient, PatientList } from "../classes/patient";
import Heatmap from "../components/Heatmap";
import Filtering from "../components/Filtering";

export default function Catalog() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [message, setMessage] = useState<JSX.Element | string>("");
  const [patientId, setPatientId] = useState<number | undefined>(undefined);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const patientList = new PatientList();
  
  useEffect(() => {
    const fetchPatients = async () => {
      try {
        if (patientId !== undefined) {
          await patientList.getPatients(String(patientId));
        } else {
          const limit = 20;
          await patientList.getPatients(currentPage, limit);
        }
        
        if (patientList.message != null) {
          setMessage(<p className="error">{patientList.message}</p>);
        } else if (patientList.patients.length > 0) {
          setMessage("");
          setPatients(patientList.patients);
        } else {
          setMessage(<p className="error">"An error occurred."</p>);
        }
      } catch (error) {
        setMessage("An error occurred.");
        console.error(error);
      }
    };

    fetchPatients();
  }, [patientId, currentPage]);

  const handlePatientId = (id: number | undefined) => {
    setPatientId(id);
  };

  const patientTable = patients.map((patient) => (
    <tr key={patient.catalog_id}>
      <td>
        <div className="detail">
          <span>
            <a href={`/catalog/${patient.catalog_id}`}>{patient.catalog_id}</a>
          </span>
          <div className="catalog-preview">
            <Heatmap patient={patient} titleVisible={false} />
          </div>
        </div>
      </td>
      <td>
        {patient.codes.slice(0, Math.min(patient.codes.length, 5)).map((code) => (
          <span key={code} className="code-table">{code}</span>
        ))}
        {patient.codes.length > 5 ? "..." : ""}
      </td>
    </tr>
  ));

  return (
    <div className="catalog-pagebody">
      {message}
      <Filtering handleSubmit={handlePatientId} patiendId={patientId} />
      <table className="catalog-table">
        <thead>
          <tr>
            <th>Patient ID</th>
            <th>Codes</th>
          </tr>
        </thead>
        <tbody>
          {patientTable}
        </tbody>
      </table>
    </div>
  );
}
