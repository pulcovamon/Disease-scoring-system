import React, { useEffect, useMemo, useState } from "react";
import { DiseaseInfo, DiseaseType } from "../classes/disease";
import { Model } from "../classes/model";
import CsvHandler from "../components/CsvHandler";
import { getMethod } from "../classes/api";
import { ClasifyForm } from "../components/ClassifyForm";
import { NewPatient } from "../components/NewPatient";
import CsvPreview from "../components/CsvPreview";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faArrowRight,
  faGlobe,
  faLock,
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
import { useTranslations } from "../i18n/useTranslations";

export default function ScoringSystem() {
  return (
    <ScoringWizardProvider>
      <ScoringSystemView />
    </ScoringWizardProvider>
  );
}

function ScoringSystemView() {
  const navigate = useNavigate();
  const { t } = useTranslations();
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
    t("form.title.selectModel", "Select a Model"),
    t("form.title.selectInput", "Select Input Method and Fill Data"),
    t("form.title.checkAndSend", "Check and Send"),
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
          <div className="flex flex-col gap-6">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="box patient w-full">
                <SelectedModel
                  model={currentModel}
                  getDiseaseKeyFromName={getDiseaseKeyFromName}
                />
              </div>
              <div className="box patient w-full">
                <NewPatient
                  patient={patient}
                  handlePatientChange={setPatient}
                  unallowed={unallowed}
                />
              </div>
            </div>
            <div className="box code-sequence w-full">
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
          <div className="flex flex-col gap-6">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="box patient w-full">
                <SelectedModel
                  model={currentModel}
                  getDiseaseKeyFromName={getDiseaseKeyFromName}
                />
              </div>
              <div className="box patient w-full">
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
          <div className="space-y-4">
            {loadingModels ? (
              <LoadingSpinner />
            ) : modelsError ? (
              <div className="box">{modelsError}</div>
            ) : (
              <ModelShowcase
                models={models}
                currentModelId={currentModelId}
                onSelect={(id) => selectModel(id)}
                getDiseaseKeyFromName={getDiseaseKeyFromName}
              />
            )}
          </div>
        );
      case WizardStep.SelectInputMethod:
        return (
          <div className="space-y-4">
            <div className="inline-flex gap-2 rounded-xl border border-[var(--border-muted)] bg-[var(--bg-surface-muted)] p-1" role="tablist">
              {[
                { key: WizardInputMethod.Manual, label: t("form.input.manual", "Manual Input") },
                { key: WizardInputMethod.CSV, label: t("form.input.csv", "Upload CSV") },
              ].map((tab) => (
                <button
                  key={tab.key}
                  role="tab"
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                    inputMethod === tab.key
                      ? "bg-[var(--bg-surface)] text-[var(--text-color)] shadow-sm border border-[var(--primary)]"
                      : "text-[var(--text-muted)] border border-transparent hover:border-[var(--border-muted)]"
                  }`}
                  onClick={() => setInputMethod(tab.key)}
                >
                  {tab.label}
                </button>
              ))}
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
      <div className="navigation flex flex-col gap-4">
        <div className="flex justify-between items-center flex-wrap gap-3">
          <h2 className="text-2xl font-bold text-[var(--text-color)]">{titles[step]}</h2>
          <Steps currentIndex={step} />
        </div>
      </div>

      <div className="space-y-6">{renderCurrentStep()}</div>

      <div className="flex justify-between items-center gap-3 mt-6 flex-wrap">
        <button
          className="px-4 py-3 rounded-xl border border-[var(--border-muted)] bg-[var(--bg-surface)] text-[var(--text-color)] hover:border-[var(--primary)] transition"
          onClick={previousStep}
          disabled={step === WizardStep.SelectModel}
        >
          <FontAwesomeIcon icon={faArrowLeft} /> {t("form.button.back", "Back")}
        </button>
        <button
          className={`px-5 py-3 rounded-xl text-white font-semibold shadow transition ${
            isNextDisabled() ? "bg-[var(--border-muted)] cursor-not-allowed" : "bg-[var(--primary)] hover:bg-[var(--primary-hover)]"
          }`}
          onClick={handleNextButton}
          disabled={sending || isNextDisabled()}
        >
          {step === WizardStep.Send ? (
            <span>
              {sending ? t("form.button.sending", "Sending...") : t("form.button.send", "Send")} <FontAwesomeIcon icon={faPaperPlane} />
            </span>
          ) : (
            <span>
              {t("form.button.next", "Next")} <FontAwesomeIcon icon={faArrowRight} />
            </span>
          )}
        </button>
      </div>
    </div>
  );
}

type ModelShowcaseProps = {
  models: Model[];
  currentModelId: string | null | undefined;
  onSelect: (id: string) => void;
  getDiseaseKeyFromName: (name: string) => DiseaseType | undefined;
};

function ModelShowcase({
  models,
  currentModelId,
  onSelect,
  getDiseaseKeyFromName,
}: ModelShowcaseProps) {
  const [detailModel, setDetailModel] = useState<Model | null>(null);
  const [ownerNames, setOwnerNames] = useState<Record<string, string>>({});

  useEffect(() => {
    const ids = Array.from(new Set(models.map((m) => m.user).filter(Boolean) as string[]));
    if (!ids.length) return;

    getMethod<{ id: string; first_name: string; last_name: string }[]>("/auth/user")
      .then((users) => {
        const map: Record<string, string> = {};
        users.forEach((u) => {
          map[u.id] = `${u.first_name} ${u.last_name}`.trim();
        });
        setOwnerNames(map);
      })
      .catch(() => {
        // silently fail; we will fall back to the raw id/email
      });
  }, [models]);

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {models.map((model) => (
          <ModelCard
            key={model._id}
            model={model}
            isActive={currentModelId === model._id}
            onSelect={onSelect}
            getDiseaseKeyFromName={getDiseaseKeyFromName}
            ownerName={
              model.user
                ? ownerNames[model.user] ||
                  (model.user.includes("@") ? model.user : `ID: ${model.user}`)
                : "N/A"
            }
            onShowDetails={setDetailModel}
          />
        ))}
      </div>

      {detailModel && (
        <ModelDetailModal
          model={detailModel}
          onClose={() => setDetailModel(null)}
          getDiseaseKeyFromName={getDiseaseKeyFromName}
          ownerName={
            detailModel.user
              ? ownerNames[detailModel.user] ||
                (detailModel.user.includes("@") ? detailModel.user : `ID: ${detailModel.user}`)
              : "N/A"
          }
        />
      )}
    </>
  );
}

type ModelCardProps = {
  model: Model;
  isActive: boolean;
  onSelect: (id: string) => void;
  getDiseaseKeyFromName: (name: string) => DiseaseType | undefined;
  ownerName: string;
  onShowDetails: (model: Model) => void;
};

function ModelCard({
  model,
  isActive,
  onSelect,
  getDiseaseKeyFromName,
  ownerName,
  onShowDetails,
}: ModelCardProps) {
  const { t } = useTranslations();
  const diseaseKey = getDiseaseKeyFromName(model.disease);
  const diseaseInfo = diseaseKey ? DiseaseInfo[diseaseKey] : undefined;
  const handleSelect = () => {
    if (model._id) onSelect(model._id);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleSelect();
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      className={`group relative overflow-hidden rounded-2xl border backdrop-blur transition-all cursor-pointer h-full ${
        isActive
          ? "border-[var(--primary)] ring-2 ring-[var(--primary)] shadow-lg"
          : "border-[var(--border-muted)] hover:border-[var(--primary)] hover:shadow-md"
      } bg-[var(--bg-surface)]`}
      onClick={handleSelect}
      onKeyDown={handleKeyDown}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-[var(--primary)]/10 via-transparent to-[var(--secondary)]/10 pointer-events-none" />
      <div className="relative flex flex-col h-full gap-3">
        <div className="relative rounded-2xl overflow-hidden aspect-video bg-gradient-to-br from-[var(--primary)] to-[var(--secondary)]">
          {model.image ? (
            <img
              src={model.image}
              alt={model.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="flex items-center justify-center w-full h-full text-white/90">
              {diseaseInfo ? (
                <FontAwesomeIcon icon={diseaseInfo.icon} className="text-3xl drop-shadow" />
              ) : (
                <span className="text-lg font-semibold">AI</span>
              )}
            </div>
          )}
          <span
            className={`absolute top-2 right-2 flex items-center gap-2 text-xs px-3 py-1 rounded-full font-semibold ${
              model.is_public
                ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/70 dark:text-emerald-100"
                : "bg-amber-100 text-amber-800 dark:bg-amber-900/70 dark:text-amber-100"
            }`}
          >
            <FontAwesomeIcon icon={model.is_public ? faGlobe : faLock} />
            {model.is_public ? t("form.cards.model.public", "Public") : t("form.cards.model.private", "Private")}
          </span>
          {isActive && (
            <div className="absolute top-2 left-2 text-xs font-semibold px-3 py-1 rounded-full bg-[var(--primary)] text-white shadow-md">
              {t("form.cards.model.active", "Active")}
            </div>
          )}
        </div>
        <div className="px-3 pb-4 flex flex-col gap-2">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <h3 className="text-lg font-semibold text-[var(--text-color)]">
                {model.name}
              </h3>
              <p className="text-sm text-[var(--text-muted)]">{model.disease}</p>
              <p className="text-xs text-[var(--text-muted)]">Owner: {ownerName}</p>
            </div>
          </div>
          <div className="flex items-center justify-between text-sm pt-2 border-t border-[var(--border-muted)]">
            <div className="flex items-center gap-2 text-[var(--text-muted)]">
              <span
                className={`w-2 h-2 rounded-full ${
                  isActive ? "bg-[var(--primary)]" : "bg-[var(--secondary)]/80"
                }`}
              />
              <span>{isActive ? t("form.cards.model.status.selected", "Selected") : t("form.cards.model.selected", "Tap to select")}</span>
            </div>
            <button
              className={`flex items-center gap-2 font-semibold px-3 py-2 rounded-lg transition ${
                isActive
                  ? "text-[var(--primary)] bg-[var(--primary)]/10"
                  : "text-[var(--text-color)] bg-[var(--bg-surface-muted)] hover:bg-[var(--bg-surface)]"
              }`}
              onClick={(e) => {
                e.stopPropagation();
                onShowDetails(model);
              }}
            >
              {t("form.cards.model.view", "View details")} <FontAwesomeIcon icon={faArrowRight} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

type ModelDetailModalProps = {
  model: Model;
  onClose: () => void;
  getDiseaseKeyFromName: (name: string) => DiseaseType | undefined;
  ownerName: string;
};

function ModelDetailModal({ model, onClose, getDiseaseKeyFromName, ownerName }: ModelDetailModalProps) {
  const diseaseKey = getDiseaseKeyFromName(model.disease);
  const diseaseInfo = diseaseKey ? DiseaseInfo[diseaseKey] : undefined;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="relative w-full max-w-2xl rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-muted)] shadow-2xl overflow-hidden">
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-br from-[var(--primary)]/12 via-transparent to-[var(--secondary)]/16" />
        <div className="relative p-6 flex flex-col gap-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-[var(--primary)] text-white shadow">
                {diseaseInfo ? (
                  <FontAwesomeIcon icon={diseaseInfo.icon} className="text-xl" />
                ) : (
                  <span className="text-sm font-semibold">AI</span>
                )}
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-[var(--text-muted)]">Model</p>
                <h3 className="text-xl font-semibold text-[var(--text-color)]">{model.name}</h3>
                <p className="text-sm text-[var(--text-muted)]">{model.disease}</p>
              </div>
            </div>
            <button
              className="px-3 py-2 rounded-lg bg-[var(--bg-surface-muted)] text-[var(--text-color)] hover:bg-[var(--border-muted)] transition"
              onClick={onClose}
              aria-label="Close details"
            >
              Close
            </button>
          </div>
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div className="rounded-xl border border-[var(--border-muted)] bg-[var(--bg-surface-muted)] p-4 space-y-2">
              <p className="text-[var(--text-muted)]">Visibility</p>
              <div className="flex items-center gap-2 text-[var(--text-color)] font-semibold">
                <FontAwesomeIcon icon={model.is_public ? faGlobe : faLock} />
                {model.is_public ? "Public" : "Private"}
              </div>
            </div>
            <div className="rounded-xl border border-[var(--border-muted)] bg-[var(--bg-surface-muted)] p-4 space-y-2">
              <p className="text-[var(--text-muted)]">Owner</p>
              <p className="text-[var(--text-color)] font-semibold break-words">
                {ownerName}
              </p>
            </div>
          </div>
          <div className="rounded-xl border border-[var(--border-muted)] bg-[var(--bg-surface-muted)] p-4">
            <p className="text-[var(--text-muted)] mb-2">Description</p>
            <p className="text-[var(--text-color)] leading-relaxed">
              {model.description || "No description provided."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
