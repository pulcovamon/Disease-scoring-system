import React, { useState, useEffect } from "react";
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
import { Model } from "../classes/model";
import { getMethod } from "../classes/api";

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
  const [models, setModels] = useState<Model[]>([]);
  const [currentModel, setCurrentModel] = useState<Model | null>(null);
  const [modelOptions, setModelOptions] = useState<{}>({
    include_default: true,
    include_user: false,
    incluse_public: false,
  });
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
  const [unallowed, setUnallowed] = useState<boolean>(false);

  const titles = [
    "Select a Model",
    "Select Input Method and Fill Data",
    "Ckeck and send",
  ];

  useEffect(() => {
    async function fetchModels() {
      try {
        const models = await getMethod<Model[]>("/model", modelOptions);
        setModels(models);
        if (models.length > 0) {
          setCurrentModel(models[0]);
        }
      } catch (err) {
        console.error("An error occurred", err);
        setModels([]);
      }
    }

    fetchModels();
  }, []);

  function handleModelChange(model: Model) {
    setCurrentModel(model);
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
    const dataSender = new DataSender(
      codes,
      currentModel!._id,
      inputMethod === InputMethod.Manual ? "patient" : "dataset"
    );
    dataSender.postData().then(() => {
      if (dataSender.message != null) {
        console.log(dataSender.message);
      } else if (dataSender.id != null) {
        navigate(`/result?id=${dataSender.id}`);
      } else {
        console.log(dataSender);
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
      return patient.name.trim() === "" || codes.length === 0;
    }
    return uploadedFile === null;
  }

  function handleNextButton() {
    if (isNextDisabled()) {
      setUnallowed(true);
    } else if (step === 2) {
      setUnallowed(false);
      handleSendCodes();
    } else {
      setUnallowed(false);
      setStep(step + 1);
    }
  }

  function getDiseaseKeyFromName(diseaseName: string): DiseaseType | undefined {
    const lower = diseaseName.toLowerCase();
    return Object.values(DiseaseType).find((key) =>
      lower.includes(key.replaceAll("_", " "))
    );
  }

  function renderInputMethod() {
    switch (inputMethod) {
      case InputMethod.Manual:
        return (
          <div className="tab-content inputs">
            <div className="patient-info">
              <div className="box patient">
                <SelectedModel
                  model={currentModel}
                  getDiseaseKeyFromName={getDiseaseKeyFromName}
                />
              </div>
              <div className="box patient">
                <NewPatient
                  patient={patient}
                  handlePatientChange={handlePatientChange}
                  unallowed={unallowed}
                />
              </div>
            </div>
            <div className="box code-sequence">
              <ClasifyForm
                codes={codes}
                handleAddCode={handleAddCode}
                handleUpdateCode={handleUpdateCode}
                unallowed={unallowed}
              />
            </div>
          </div>
        );
      case InputMethod.CSV:
        return (
          <div className="tab-content">
            <div className="patient-info">
              <div className="box patient">
                <SelectedModel
                  model={currentModel}
                  getDiseaseKeyFromName={getDiseaseKeyFromName}
                />
              </div>
              <div className="box patient">
                <CsvHandler
                  uploadedFile={uploadedFile}
                  handleFileUpload={handleFileUpload}
                  unallowed={unallowed}
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
        const diseaseKey = getDiseaseKeyFromName(currentModel?.disease || "");
        const diseaseInfo = diseaseKey ? DiseaseInfo[diseaseKey] : undefined;

        return (
          <div>
            <div className="tabs">
              {Object.values(models).map((model) => (
                <button
                  key={model._id}
                  className={`tab ${currentModel === model ? "active" : ""}`}
                  onClick={() => handleModelChange(model)}
                >
                  <span>
                    {model.name}
                    {getDiseaseKeyFromName(model.disease) && (
                      <FontAwesomeIcon
                        icon={
                          DiseaseInfo[getDiseaseKeyFromName(model.disease)!]
                            .icon
                        }
                        style={{ marginLeft: "0.5rem" }}
                      />
                    )}
                  </span>
                </button>
              ))}
            </div>

            <div className="tab-content box">
              <div className="model-detail">
                {diseaseInfo && (
                  <img
                    className="disease-image"
                    src={`/assets/${diseaseInfo.image}`}
                    alt={diseaseInfo.name}
                  />
                )}
                <div className="model-info">
                  <h2>{currentModel?.name}</h2>
                  <p>{currentModel?.description}</p>
                  <h3>{currentModel?.disease}</h3>
                  {diseaseInfo && <p>{diseaseInfo.description}</p>}
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
            <div className="box preview">
              <SelectedModel
                model={currentModel}
                getDiseaseKeyFromName={getDiseaseKeyFromName}
              />
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
          className={`navigation-button ${
            isNextDisabled() ? "navigation-button-disabled" : ""
          }`}
          onClick={handleNextButton}
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
