import React, { useState, useEffect, useMemo } from "react";
import { Patient, PatientList } from "../classes/patient";
import Heatmap from "../components/Heatmap";
import Filtering from "../components/Filtering";
import Pagination from "../components/Pagination";

export default function Catalog() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [message, setMessage] = useState<JSX.Element | string>("");
  const [patientId, setPatientId] = useState<number | undefined>(undefined);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(0);

  const limit = useMemo(() => {
    return 20;
  }, []);
  const patientList = useMemo(() => {
    return new PatientList();
  }, []);

  useEffect(() => {
    const fetchNumberOfPatients = async () => {
      try {
        await patientList.getNumberOfPatients();
        setTotalPages(Math.ceil(patientList.totalPatients / limit));
      } catch (error) {
        setMessage("An error occurred.");
        console.error(error);
      }
    };
    fetchNumberOfPatients();
  }, []);

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        if (patientId !== undefined) {
          await patientList.getPatients(String(patientId));
        } else {
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

  const handlePageChange = (pageId: number) => {
    setCurrentPage(pageId);
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
        {patient.codes
          .slice(0, Math.min(patient.codes.length, 5))
          .map((code) => (
            <span key={code} className="code-table">
              {code}
            </span>
          ))}
        {patient.codes.length > 5 ? "..." : ""}
      </td>
    </tr>
  ));

  return (
    <div className="catalog-pagebody">
      {message}
      <div className="filtering">
        <Filtering handleSubmit={handlePatientId} patiendId={patientId} />
        <Pagination
          currentPage={currentPage}
          handlePageChange={handlePageChange}
          totalPages={patientId ? 1 : totalPages}
        />
      </div>
      <table className="catalog-table">
        <thead>
          <tr>
            <th>Patient ID</th>
            <th>Codes</th>
          </tr>
        </thead>
        <tbody>{patientTable}</tbody>
      </table>
    </div>
  );
}
