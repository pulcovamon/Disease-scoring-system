import React, { useState } from "react";
import { DiseaseInfo, DiseaseType } from "../classes/disease";
import "./scoringSystem.css";
import { DataSender } from "../classes/data";
import CsvHandler from "../components/CsvHandler";
import { ClasifyForm } from "../components/ClassifyForm";
import { Patient } from "../classes/patient";
import { NewPatient } from "../components/NewPatient";
import CsvPreview from "../components/CsvPreview";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faArrowRight,
  faPaperPlane,
} from "@fortawesome/free-solid-svg-icons";
import Steps from "../components/Steps";
import PatientPreview from "../components/PatientPreview";
import SelectedModel from "../components/SelectedModel";

enum Step {
  SelectModel,
  SelectInputMethod,
  Send,
}

enum InputMethod {
  Manual,
  CSV,
}

export default function ScoringSystem() {
  const [step, setStep] = useState<Step>(Step.SelectModel);
  const [disease, setDisease] = useState<DiseaseType>(DiseaseType.LungCancer);
  const [codes, setCodes] = useState<string[]>([]);
  const [patient, setPatient] = useState<Patient>({
    id: null,
    name: "",
    surname: "",
  });
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [inputMethod, setInputMethod] = useState<InputMethod>(
    InputMethod.Manual
  );
  const navigate = useNavigate();

  const titles = [
    "Select a Model",
    "Select Input Method and Fill Data",
    "Ckeck and send"
  ]

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
      } else if (dataSender.id != null) {
        navigate(`/result?id=${dataSender.id}`);
      } else {
      }
    });
  }

  function handlePatientChange(patient: Patient) {
    setPatient(patient);
  }

  function handleFileUpload(file: File) {
    setUploadedFile(file);
  }

  function isNextDisabled() {
    if (step === 0) {
      return false;
    }
    if (inputMethod === InputMethod.Manual) {
      return (
        patient.name.trim() === "" ||
        patient.surname.trim() === "" ||
        codes.length === 0
      );
    }
    return uploadedFile === null;
  }

  function renderInputMethod() {
    switch (inputMethod) {
      case InputMethod.Manual:
        return (
          <div className="tab-content inputs">
            <div className="patient-info">
            <div className="box patient">
                <SelectedModel model={disease} />
              </div>
            <div className="box patient">
              <NewPatient
                patient={patient}
                handlePatientChange={handlePatientChange}
              />
            </div>
            </div>
            <div className="box code-sequence">
              <ClasifyForm
                modelType="Medical codes sequence"
                codes={codes}
                handleAddCode={handleAddCode}
                handleUpdateCode={handleUpdateCode}
              />
            </div>
          </div>
        );
      case InputMethod.CSV:
        return (
          <div className="tab-content">
            <div className="patient-info">
            <div className="box patient">
            <SelectedModel model={disease} />
              </div>
            <div className="box patient">
              <CsvHandler
                uploadedFile={uploadedFile}
                handleFileUpload={handleFileUpload}
              />
            </div>
            </div>

          </div>
        );
      default:
        return null;
    }
  }

  function renderCurrentStep() {
    switch (step) {
      case Step.SelectModel:
        return (
          <div>
            <div className="tabs">
              {Object.values(DiseaseType).map((diseaseType) => (
                <button
                  key={diseaseType}
                  className={`tab ${disease === diseaseType ? "active" : ""}`}
                  onClick={() => handleDiseaseChange(diseaseType)}
                >
                  <span>
                    {DiseaseInfo[diseaseType].name}{" "}
                    <FontAwesomeIcon icon={DiseaseInfo[diseaseType].icon} />
                  </span>
                </button>
              ))}
            </div>

            <div className="tab-content box">
              <div className="model-detail">
                <img
                  className="disease-image"
                  src={`/assets/${DiseaseInfo[disease].image}`}
                  alt={DiseaseInfo[disease].name}
                ></img>
                <div>
                  <h3>{DiseaseInfo[disease].name}</h3>
                  <p>{DiseaseInfo[disease].intro}</p>
                  <p>{DiseaseInfo[disease].description}</p>
                </div>
              </div>
            </div>
          </div>
        );
      case Step.SelectInputMethod:
        return (
          <div>
            <div className="tabs">
              <button
                className={`tab ${
                  inputMethod === InputMethod.Manual ? "active" : ""
                }`}
                onClick={() => setInputMethod(InputMethod.Manual)}
              >
                Manual Input
              </button>
              <button
                className={`tab ${
                  inputMethod === InputMethod.CSV ? "active" : ""
                }`}
                onClick={() => setInputMethod(InputMethod.CSV)}
              >
                Upload CSV
              </button>
            </div>
            {renderInputMethod()}
          </div>
        );

      case Step.Send:
        return (
          <div>
            <div className="box preview" >
            <SelectedModel model={disease} />
            </div>
            <div className="box preview">
              {inputMethod === InputMethod.Manual ? (
                <PatientPreview patient={patient} codes={codes} />
              ) : (
                <CsvPreview uploadedFile={uploadedFile} />
              )}
            </div>
          </div>
        );
      default:
        return null;
    }
  }

  return (
    <div className="page-body">
      <div className="navigation">
        <h2>{titles[step]}</h2>
        <Steps currentIndex={step} />
      </div>
      {renderCurrentStep()}
      <div className="navigation-buttons">
      <button
          className="navigation-button"
          onClick={() => setStep(step - 1)}
          disabled={step === 0}
        >
          <FontAwesomeIcon icon={faArrowLeft} /> Back
        </button>
        <button
          className="navigation-button"
          onClick={step === 2 ? handleSendCodes : () => setStep(step + 1)}
          disabled={isNextDisabled()}
        >
          {step === 2 ? (
            <span>
              Send <FontAwesomeIcon icon={faPaperPlane} />
            </span>
          ) : (
            <span>
              Next <FontAwesomeIcon icon={faArrowRight} />
            </span>
          )}
        </button>
      </div>
    </div>
  );
}
