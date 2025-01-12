import React, { useState, useEffect, useMemo } from "react";
import { Patient, PatientList } from "../classes/patient";
import Heatmap from "../components/Heatmap";
import Filtering from "../components/Filtering";
import Pagination from "../components/Pagination";
import "./catalog.css";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faShareFromSquare } from "@fortawesome/free-solid-svg-icons";

export default function Catalog() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [message, setMessage] = useState<JSX.Element | string>("");
  const [patientId, setPatientId] = useState<number | undefined>(undefined);
  const [patientCode, setPatientCode] = useState<string | undefined>(undefined);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(0);

  const limit = useMemo(() => {
    return 15;
  }, []);
  const patientList = useMemo(() => {
    return new PatientList();
  }, []);

  useEffect(() => {
    const fetchNumberOfPatients = async () => {
      try {
        await patientList.getNumberOfPatients(patientCode);
        setTotalPages(Math.ceil(patientList.totalPatients / limit));
      } catch (error) {
        setMessage("An error occurred.");
        console.error(error);
      }
    };
    fetchNumberOfPatients();
  }, [patientList, limit, patientCode]);

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        if (patientId !== undefined) {
          await patientList.getPatients({ id: patientId });
        } else {
          const queryParams = {
            skip: currentPage * limit - limit,
            limit: limit,
            code: patientCode,
          };
          await patientList.getPatients(queryParams);
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
  }, [patientId, patientCode, currentPage, limit, patientList]);

  const handlePatientId = (value: number | undefined) => {
    setPatientId(value);
  };

  const handlePatientCode = (value: string | undefined) => {
    setPatientCode(value);
  };

  const handlePageChange = (pageId: number) => {
    setCurrentPage(pageId);
  };

  const patientTable = patients.map((patient) => {
    let highlightCode = patientCode !== undefined;
    return (
      <tr key={patient._id}>
        <td>
          <div className="detail">
            <span className="patient-id">{patient._id}</span>
            <div className="catalog-preview">
              <Heatmap patient={patient} titleVisible={false} />
            </div>
          </div>
        </td>
        <td>
          {patient.codes
            .slice(0, Math.min(patient.codes.length, 5))
            .map((code) => {
              let cssClass = "code-table";
              if (code === patientCode) {
                cssClass += " highlight-code";
                highlightCode = false;
              }
              return (
                <span key={code} className={cssClass}>
                  {code}
                </span>
              );
            })}
          <span className={highlightCode ? "highlight-code" : ""}>
            {patient.codes.length > 5 ? "..." : ""}
          </span>
        </td>
        <td>
          <Link
            to={`/catalog/${patient._id}${
              patientCode ? `?code=${patientCode}` : ""
            }`}
            target="_blank"
          >
            <FontAwesomeIcon icon={faShareFromSquare} />
          </Link>
        </td>
      </tr>
    );
  });

  return (
    <div className="catalog-pagebody">
      {message}
      <div className="filtering">
        <Filtering<number | undefined>
          label="Patient ID"
          value={patientId}
          handleSubmit={handlePatientId}
        />
        <Filtering<string | undefined>
          label="Code"
          value={patientCode}
          handleSubmit={handlePatientCode}
        />
      </div>
      <Pagination
        currentPage={currentPage}
        handlePageChange={handlePageChange}
        totalPages={patientId ? 1 : totalPages}
      />
      <table className="catalog-table">
        <thead>
          <tr>
            <th>Patient ID</th>
            <th>Codes</th>
            <th></th>
          </tr>
        </thead>
        <tbody>{patientTable}</tbody>
      </table>
    </div>
  );
}
