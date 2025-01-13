import React, { useState, useEffect, useMemo, MouseEvent } from "react";
import { Patient, PatientList } from "../classes/catalogData";
import Heatmap from "../components/Heatmap";
import Filtering from "../components/Filtering";
import Pagination from "../components/Pagination";
import "./catalog.css";
import { Link, useSearchParams } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faShareFromSquare } from "@fortawesome/free-solid-svg-icons";

export default function Catalog() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [message, setMessage] = useState<JSX.Element | string>("");
  const [patientId, setPatientId] = useState<number | undefined>(undefined);
  const [patientCode, setPatientCode] = useState<string | undefined>(undefined);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [searchParams, setSearchParams] = useSearchParams();
  const [position, setPosition] = useState("down");
  
  useEffect(() => {
    const id = searchParams.get("id");
    const code = searchParams.get("code");
    const page = searchParams.get("page");
  
    if (id) {
      setPatientId(Number(id));
    } else {
      setPatientId(undefined);
    }
  
    if (code) {
      setPatientCode(code);
    } else {
      setPatientCode(undefined);
    }
  
    if (page) {
      setCurrentPage(Number(page));
    } else {
      setCurrentPage(1);
    }
  }, [searchParams]);

  const limit = useMemo(() => {
    return 25;
  }, []);

  const patientList = useMemo(() => {
    return new PatientList();
  }, []);

  useEffect(() => {
    setMessage("");
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
    setMessage("");
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
    if (event.clientY > window.innerHeight/2) {
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

  return (
    <div className="catalog-pagebody page-content">
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
      <Pagination
        currentPage={currentPage}
        handlePageChange={handlePageChange}
        totalPages={patientId ? 1 : totalPages}
      />
    </div>
  );
}
