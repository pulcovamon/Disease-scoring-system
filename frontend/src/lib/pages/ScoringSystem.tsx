import React, { useState } from "react";
import { DiseaseType, diseases } from "../classes/disease";
import "./scoringSystem.css";
import { DataSender } from "../classes/data";
import LinkButton from "../components/LinkButton";
import CsvHandler from "../components/CsvHandler";
import { ClasifyForm } from "../components/ClassifyForm";
import { Patient } from "../classes/patient";
import { NewPatient } from "../components/NewPatient";
import CsvPreview from "../components/CsvPreview";
import { useNavigate } from "react-router-dom";

export default function ScoringSystem() {
  const [disease, setDisease] = useState<DiseaseType>(DiseaseType.LungCancer);
  const [codes, setCodes] = useState<string[]>([]);
  const [message, setMessage]: [JSX.Element, Function] = useState<JSX.Element>(
    <p></p>
  );
  const [patient, setPatient] = useState<Patient>({
    id: null,
    name: "",
    surname: ""
  });
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const navigate = useNavigate();

  function handleDiseaseChange(diseaseType: DiseaseType) {
    setDisease(diseaseType);
    setCodes([]);
  }

  function handleAddCode(code: string) {
    setCodes((prevCodes) => [...prevCodes, code]);
  }

  function handleUpdateCode(index: number, newCode: string) {
    const updatedCodes = [...codes];
    updatedCodes[index] = newCode;
    setCodes(updatedCodes);
  }

  function handleSendCodes() {
    const dataSender = new DataSender(codes);
    dataSender.postData().then(() => {
      if (dataSender.message != null) {
        setMessage(<p className="error">{dataSender.message}</p>);
      } else if (dataSender.id != null) {
        navigate("/result");
      } else {
        setMessage(<p className="error">An error occured.</p>);
      }
    });
  }

  function handlePatientChange(patient: Patient) {
    setPatient(patient);
  }

  function handleFileUpload(file: File) {
    setUploadedFile(file);
  };

  return (
    <div className="page-body">
      <div className="tabs">
        {Object.values(DiseaseType).map((diseaseType) => (
          <button
            key={diseaseType}
            className={`tab ${disease === diseaseType ? "active" : ""}`}
            onClick={() => handleDiseaseChange(diseaseType)}
          >
            {diseases[diseaseType].name}
          </button>
        ))}
      </div>
      <div className="tab-content">
        <div className="separet-codes">
          
          <div className="box" >
            <NewPatient patient={patient} handlePatientChange={handlePatientChange} />
          </div>
        <div className="box">
        <ClasifyForm
          disease={disease}
          modelType="Medical codes sequence"
          codes={codes}
          handleAddCode={handleAddCode}
          handleUpdateCode={handleUpdateCode}
          handleSendCodes={handleSendCodes}
        />
        {patient.name}{" "}{patient.surname}
        {message}
      </div>
        </div>
        <div className="dataset">
          
        <div className="box">
        <CsvHandler uploadedFile={uploadedFile} handleFileUpload={handleFileUpload} />
      </div>
      <div className="box">
        <CsvPreview uploadedFile={uploadedFile} />
      </div>
        </div>
      </div>
    </div>
  );
}
