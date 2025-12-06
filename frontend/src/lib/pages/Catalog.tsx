import React, { useMemo, MouseEvent, useState } from "react";
import { Patient } from "../classes/catalogData";
import Heatmap from "../components/Heatmap";
import Filtering from "../components/Filtering";
import Pagination from "../components/Pagination";
import "./catalog.css";
import { Link, useSearchParams } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faShareFromSquare } from "@fortawesome/free-solid-svg-icons";
import { useCatalogCount, useCatalogPatients } from "../hooks/useCatalogData";

export default function Catalog() {
  const [position, setPosition] = useState("down");
  const [patientId, setPatientId] = useState<number | undefined>(undefined);
  const [patientCode, setPatientCode] = useState<string | undefined>(undefined);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [searchParams, setSearchParams] = useSearchParams();

  React.useEffect(() => {
    const id = searchParams.get("id");
    const code = searchParams.get("code");
    const page = searchParams.get("page");

    setPatientId(id ? Number(id) : undefined);
    setPatientCode(code || undefined);
    setCurrentPage(page ? Number(page) : 1);
  }, [searchParams]);

  const limit = useMemo(() => {
    return 25;
  }, []);

  const patientQuery = useMemo(() => {
    if (patientId !== undefined) {
      return { id: patientId };
    }
    return {
      skip: currentPage * limit - limit,
      limit,
      code: patientCode,
    };
  }, [currentPage, limit, patientCode, patientId]);

  const {
    patients,
    loading: loadingPatients,
    error: patientsError,
  } = useCatalogPatients(patientQuery);

  const { total, loading: loadingTotal, error: totalError } = useCatalogCount(patientCode);

  const totalPages = useMemo(() => {
    if (patientId) return 1;
    if (!total || total === 0) return 0;
    return Math.max(1, Math.ceil(total / limit));
  }, [limit, patientId, total]);

  const handlePatientId = (value: number | undefined) => {
    setPatientId(value);
    const params = new URLSearchParams(searchParams);
  
    if (value !== undefined) {
      params.set("id", value.toString());
    } else {
      params.delete("id");
    }
  
    setSearchParams(params);
  };
  
  const handlePatientCode = (value: string | undefined) => {
    setPatientCode(value);
    const params = new URLSearchParams(searchParams);
  
    if (value !== undefined) {
      params.set("code", value);
    } else {
      params.delete("code");
    }
  
    setSearchParams(params);
  };
  
  const handlePageChange = (pageId: number) => {
    setCurrentPage(pageId);
    const params = new URLSearchParams(searchParams);
  
    if (pageId !== 1) {
      params.set("page", pageId.toString());
    } else {
      params.delete("page");
    }
  
    setSearchParams(params);
  };


  const handleMouseEnter = (event: MouseEvent) => {
    if (event.clientY > window.innerHeight / 2) {
      setPosition("up");
    } else {
      setPosition("down");
    }
  };

  const patientTable = patients.map((patient) => {
    let highlightCode = patientCode !== undefined;
    return (
      <tr key={patient._id}>
        <td>
          <div className="detail" onMouseEnter={(e) => handleMouseEnter(e)}>
            <span className="patient-id">{patient._id}</span>
            <div
            className={`catalog-preview ${position === "up" ? "up" : "down"}`}
          >
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
                console.log(code);
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
        <td className="detail-link-box">
          <Link
            className="detail-link"
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

  const message = patientsError || totalError ? (
    <p className="error">{patientsError || totalError}</p>
  ) : null;
  const emptyState =
    !loadingPatients && !patientsError && patients.length === 0 ? (
      <p className="error">No patients found.</p>
    ) : null;

  return (
    <div className="catalog-pagebody page-content">
      {message}
      {emptyState}
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
      {(loadingPatients || loadingTotal) && <p>Loading catalog...</p>}
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
      <Pagination
        currentPage={currentPage}
        handlePageChange={handlePageChange}
        totalPages={patientId ? 1 : totalPages}
      />
    </div>
  );
}
