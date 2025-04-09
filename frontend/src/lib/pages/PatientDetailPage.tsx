import React, { useState, useEffect } from "react";
import { Patient, PatientDetail } from "../classes/catalogData";
import { Link, useParams, useSearchParams } from "react-router-dom";
import Heatmap from "../components/Heatmap";
import PatientCodes from "../components/PatientCodes";
import "./patientDetailPage.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowRightToBracket } from "@fortawesome/free-solid-svg-icons";

export default function PatientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const code = searchParams.get("code");
  const [patient, setPatient] = useState<Patient | null>(null);
  const [message, setMessage] = useState<JSX.Element | string>("");
  const [colorMode, setColorMode] = useState<"specialty" | "tfidf0" | "tfidf1" | "frequency">("specialty");  

  useEffect(() => {
    async function fetchPatient() {
      if (id) {
        try {
          const patientDetail = new PatientDetail(Number(id));
          await patientDetail.getPatient();

          if (patientDetail.message != null) {
            setMessage(<p className="error">{patientDetail.message}</p>);
          } else if (patientDetail.patient) {
            setPatient(patientDetail.patient);
            setMessage("");
          } else {
            setMessage(<p className="error">An error occurred.</p>);
          }
        } catch (error) {
          setMessage(<p className="error">An error occurred.</p>);
          console.error(error);
        }
      } else {
        setMessage(<p>No id provided.</p>);
      }
    }

    fetchPatient();
  }, [id]);

  const handleColorModeChange = (newMode: typeof colorMode) => {
    setColorMode(newMode);
  };

  const content = patient ? (
    <>
      <Heatmap patient={patient} titleVisible={true} />
      <PatientCodes
      patient={patient}
      titleVisible={true}
      currentCode={code}
      colorMode={colorMode}
      onColorModeChange={handleColorModeChange}
    />
    </>
  ) : (
    message
  );

  return (
    <div className="page-content">
      <Link className="back-button" to={"/catalog"}>
        <FontAwesomeIcon icon={faArrowRightToBracket} /> Back to Catalog
      </Link>
      <h1 className="title">Patient ID {patient?._id}</h1>
      <div className="patient-detail-page">{content}</div>
    </div>
  );
}
