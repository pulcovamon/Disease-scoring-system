import React, { useMemo } from "react";
import { DiseaseInfo, DiseaseType } from "../classes/disease";
import "./scoringSystem.css";
import CsvHandler from "../components/CsvHandler";
import { ClasifyForm } from "../components/ClassifyForm";
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
import LoadingSpinner from "../components/LoadingSpinner";
import {
  ScoringWizardProvider,
  useScoringWizard,
  WizardInputMethod,
  WizardStep,
} from "../store/scoringWizard";

export default function ScoringSystem() {
  return (
    <ScoringWizardProvider>
      <ScoringSystemView />
    </ScoringWizardProvider>
  );
}

function ScoringSystemView() {
  const navigate = useNavigate();
  const {
    step,
    currentModel,
    models,
    loadingModels,
    modelsError,
    inputMethod,
    setInputMethod,
    codes,
    addCode,
    updateCode,
    patient,
    setPatient,
    uploadedFile,
    setUploadedFile,
    unallowed,
    nextStep,
    previousStep,
    isNextDisabled,
    currentModelId,
    selectModel,
    sending,
    submissionError,
  } = useScoringWizard();

  const titles = [
    "Select a Model",
    "Select Input Method and Fill Data",
    "Ckeck and send",
  ];

  const getDiseaseKeyFromName = (diseaseName: string): DiseaseType | undefined => {
    const lower = diseaseName.toLowerCase();
    return Object.values(DiseaseType).find((key) =>
      lower.includes(key.replaceAll("_", " "))
    );
  };

  const diseaseInfo = useMemo(() => {
    const key = getDiseaseKeyFromName(currentModel?.disease || "");
    return key ? DiseaseInfo[key] : undefined;
  }, [currentModel]);

  const handleNextButton = async () => {
    const { taskId, error } = await nextStep();
    if (taskId) {
      navigate(`/result?id=${taskId}`);
    }
  };

  const renderInputMethod = () => {
    switch (inputMethod) {
      case WizardInputMethod.Manual:
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
                  handlePatientChange={setPatient}
                  unallowed={unallowed}
                />
              </div>
            </div>
            <div className="box code-sequence">
              <ClasifyForm
                codes={codes}
                handleAddCode={addCode}
                handleUpdateCode={updateCode}
                unallowed={unallowed}
              />
            </div>
          </div>
        );
      case WizardInputMethod.CSV:
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
                  handleFileUpload={(file) => setUploadedFile(file)}
                  unallowed={unallowed}
                />
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  const renderCurrentStep = () => {
    switch (step) {
      case WizardStep.SelectModel:
        return (
          <div>
            <div className="tabs">
              {loadingModels ? (
                <LoadingSpinner />
              ) : modelsError ? (
                <div className="box">{modelsError}</div>
              ) : (
                models.map((model) => (
                  <button
                    key={model._id}
                    className={`tab ${currentModelId === model._id ? "active" : ""}`}
                    onClick={() => model._id && selectModel(model._id)}
                    disabled={!model._id}
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
                ))
              )}
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
      case WizardStep.SelectInputMethod:
        return (
          <div>
            <div className="tabs">
              <button
                className={`tab ${
                  inputMethod === WizardInputMethod.Manual ? "active" : ""
                }`}
                onClick={() => setInputMethod(WizardInputMethod.Manual)}
              >
                Manual Input
              </button>
              <button
                className={`tab ${
                  inputMethod === WizardInputMethod.CSV ? "active" : ""
                }`}
                onClick={() => setInputMethod(WizardInputMethod.CSV)}
              >
                Upload CSV
              </button>
            </div>
            {renderInputMethod()}
          </div>
        );

      case WizardStep.Send:
        return (
          <div>
            <div className="box preview">
              <SelectedModel
                model={currentModel}
                getDiseaseKeyFromName={getDiseaseKeyFromName}
              />
            </div>
            <div className="box preview">
              {inputMethod === WizardInputMethod.Manual ? (
                <PatientPreview patient={patient} codes={codes} />
              ) : (
                <CsvPreview uploadedFile={uploadedFile} />
              )}
            </div>
            {submissionError && (
              <div className="box">
                {submissionError}
              </div>
            )}
          </div>
        );
      default:
        return null;
    }
  };

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
          onClick={previousStep}
          disabled={step === WizardStep.SelectModel}
        >
          <FontAwesomeIcon icon={faArrowLeft} /> Back
        </button>
        <button
          className={`navigation-button ${
            isNextDisabled() ? "navigation-button-disabled" : ""
          }`}
          onClick={handleNextButton}
          disabled={sending}
        >
          {step === WizardStep.Send ? (
            <span>
              {sending ? "Sending..." : "Send"} <FontAwesomeIcon icon={faPaperPlane} />
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
