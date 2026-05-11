import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
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
  faClock,
  faStar,
  faWandMagicSparkles,
  faXmark,
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
import { useLanguage } from "../store/language";

const EXAMPLE_PATIENT = { id: null, name: "Demo", surname: "Patient" };

const EXAMPLE_SCENARIOS: {
  id: string;
  labelKey: string;
  labelFallback: string;
  descKey: string;
  descFallback: string;
  risk: "low" | "moderate" | "high";
  codes: string[];
}[] = [
  {
    id: "low",
    labelKey: "form.example.low.label",
    labelFallback: "Low-risk case",
    descKey: "form.example.low.desc",
    descFallback: "Routine checkup visits — low suspicion pattern",
    risk: "low",
    codes: ["89131", "09543", "42022", "89513", "09543", "42023", "89131", "09543", "42023", "89131", "09543", "42022", "89131"],
  },
  {
    id: "moderate",
    labelKey: "form.example.moderate.label",
    labelFallback: "Moderate-risk case",
    descKey: "form.example.moderate.desc",
    descFallback: "Mixed presentation — borderline indicators",
    risk: "moderate",
    codes: ["89125", "89713", "89725", "89312", "89131", "89119", "89123", "89127", "89143", "89513", "89514", "89515", "96163", "96863", "09133", "96163", "89119", "89131", "89513"],
  },
  {
    id: "high",
    labelKey: "form.example.high.label",
    labelFallback: "High-risk case",
    descKey: "form.example.high.desc",
    descFallback: "Dense oncology workup — high suspicion sequence",
    risk: "high",
    codes: ["89131", "89513", "89514", "89123", "87513", "87419", "87433", "87447", "87449", "89513", "89514", "89611", "89619", "89131", "89131", "09125", "89131", "89615", "09511", "87519", "87431", "87447", "87519", "87431", "87435", "97111", "89123"],
  },
];

const SCENARIO_STYLES: Record<"low" | "moderate" | "high", { badge: string; border: string; bg: string }> = {
  low:      { badge: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200", border: "border-emerald-400 dark:border-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-900/20" },
  moderate: { badge: "bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200",         border: "border-amber-400 dark:border-amber-500",   bg: "bg-amber-50 dark:bg-amber-900/20"   },
  high:     { badge: "bg-red-100 text-red-800 dark:bg-red-900/60 dark:text-red-200",                 border: "border-red-400 dark:border-red-600",        bg: "bg-red-50 dark:bg-red-900/20"       },
};

export default function ScoringSystem() {
  return (
    <ScoringWizardProvider>
      <ScoringSystemView />
    </ScoringWizardProvider>
  );
}

function ScoringSystemView() {
  const navigate = useNavigate();
  const { buildPath } = useLanguage();
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
    removeCode,
    loadCodes,
    loadExample,
    exampleId,
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
    isGuest,
  } = useScoringWizard();

  const titles = [
    t("form.title.selectModel", "Select a Model"),
    t("form.title.selectInput", "Select Input Method and Fill Data"),
    t("form.title.checkAndSend", "Check and Send"),
  ];

  const getDiseaseKeyFromName = (diseaseName: string): DiseaseType | undefined => {
    // exact enum key match first (e.g. "lung_cancer")
    if (Object.values(DiseaseType).includes(diseaseName as DiseaseType)) {
      return diseaseName as DiseaseType;
    }
    // fallback fuzzy match for legacy display names (e.g. "Lung Cancer")
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
      const path = buildPath(`/result/${taskId}`) + (isGuest ? "?guest=1" : "");
      navigate(path);
    }
  };

  const renderInputMethod = () => {
    switch (inputMethod) {
      case WizardInputMethod.Manual:
        return (
          <div className="flex flex-col gap-6">
            {!isGuest && (
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
            )}
            {isGuest && (
              <div className="box patient w-full">
                <SelectedModel
                  model={currentModel}
                  getDiseaseKeyFromName={getDiseaseKeyFromName}
                />
              </div>
            )}
            <div className="rounded-2xl border border-[var(--border-muted)] bg-[var(--bg-surface)] p-4 flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <FontAwesomeIcon icon={faWandMagicSparkles} className="text-[var(--primary)] text-sm" />
                <span className="text-sm font-semibold text-[var(--text-color)]">{t("form.example.title", "Try a demo case")}</span>
                <span className="text-xs text-[var(--text-muted)]">{t("form.example.subtitle", "Fills patient and codes — no data is saved")}</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {EXAMPLE_SCENARIOS.map((scenario) => {
                  const styles = SCENARIO_STYLES[scenario.risk];
                  const isActive = exampleId === scenario.id;
                  return (
                    <button
                      key={scenario.id}
                      type="button"
                      onClick={() => loadExample(scenario.codes, isGuest ? null : EXAMPLE_PATIENT, scenario.id)}
                      className={`text-left rounded-xl border-2 p-3 transition-all flex flex-col gap-2 ${
                        isActive
                          ? `${styles.border} ${styles.bg}`
                          : "border-[var(--border-muted)] bg-[var(--bg-surface-muted)] hover:border-[var(--primary)]"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${styles.badge}`}>
                          {t(scenario.labelKey, scenario.labelFallback)}
                        </span>
                        <span className="text-[11px] text-[var(--text-muted)] font-mono">{scenario.codes.length} codes</span>
                      </div>
                      <p className="text-xs text-[var(--text-muted)] leading-snug">{t(scenario.descKey, scenario.descFallback)}</p>
                      <p className="text-xs font-medium text-[var(--text-color)]">Demo Patient</p>
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="box code-sequence w-full">
              <ClasifyForm
                codes={codes}
                handleAddCode={addCode}
                handleUpdateCode={updateCode}
                handleRemoveCode={removeCode}
                handleLoadPreset={loadCodes}
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
            {!isGuest && (
              <div className="inline-flex gap-2 rounded-xl border border-[var(--border-muted)] bg-[var(--bg-surface-muted)] p-1" role="tablist">
                {[
                  { key: WizardInputMethod.Manual, label: t("form.input.manual", "Manual Input") },
                  { key: WizardInputMethod.CSV, label: t("form.input.csv", "Upload CSV") },
                ].map((tab) => (
                  <button
                    key={tab.key}
                    role="tab"
                    className={`btn text-sm ${
                      inputMethod === tab.key ? "btn-primary shadow-sm" : "btn-secondary"
                    }`}
                    onClick={() => setInputMethod(tab.key)}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            )}
            {renderInputMethod()}
          </div>
        );

      case WizardStep.Send:
        return (
          <div>
            {isGuest && (
              <div className="flex items-start gap-3 rounded-xl border border-amber-300 bg-amber-50 dark:border-amber-700 dark:bg-amber-900/20 px-4 py-3 mb-2 text-sm text-amber-800 dark:text-amber-200">
                <FontAwesomeIcon icon={faClock} className="mt-0.5 shrink-0" />
                <span>{t("form.guest.ttlNotice", "Your result will be accessible via a unique link for 24 hours. No account is needed to view it.")}</span>
              </div>
            )}
            <div className="box preview">
              <SelectedModel
                model={currentModel}
                getDiseaseKeyFromName={getDiseaseKeyFromName}
              />
            </div>
            <div className="box preview">
              {inputMethod === WizardInputMethod.Manual ? (
                <PatientPreview patient={isGuest ? null : patient} codes={codes} />
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
        {step !== WizardStep.SelectModel && (
          <button
            className="px-4 py-3 rounded-xl border border-(--border-muted) bg-(--bg-surface) text-(--text-color) hover:border-(--primary) transition"
            onClick={previousStep}
          >
            <FontAwesomeIcon icon={faArrowLeft} /> {t("form.button.back", "Back")}
          </button>
        )}
        <button
          className={`ml-auto px-5 py-3 rounded-xl text-white font-semibold shadow transition ${
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
  const { t } = useTranslations();
  const [detailModel, setDetailModel] = useState<Model | null>(null);
  const [ownerNames, setOwnerNames] = useState<Record<string, string>>({});
  const [selectedDiseases, setSelectedDiseases] = useState<Set<DiseaseType>>(new Set());
  const [selectedVisibility, setSelectedVisibility] = useState<Set<"public" | "private">>(new Set());

  useEffect(() => {
    const ids = Array.from(new Set(models.map((m) => m.user).filter(Boolean) as string[]));
    if (!ids.length) return;

    getMethod<{ id: string; first_name: string; last_name: string }[]>("/auth/user", undefined, { handleUnauthorized: false })
      .then((users) => {
        const map: Record<string, string> = {};
        users.forEach((u) => { map[u.id] = `${u.first_name} ${u.last_name}`.trim(); });
        setOwnerNames(map);
      })
      .catch(() => {});
  }, [models]);

  const resolveOwnerName = (userId: string | null, t: (k: string, fb?: string) => string) => {
    if (!userId || userId === "default") return t("form.cards.model.builtin", "Built-in");
    return ownerNames[userId] || (userId.includes("@") ? userId : null);
  };

  // Derive disease options from the actual models present
  const diseaseOptions = useMemo(() => {
    const keys = new Set<DiseaseType>();
    models.forEach((m) => {
      const key = getDiseaseKeyFromName(m.disease);
      if (key) keys.add(key);
    });
    return Array.from(keys);
  }, [models, getDiseaseKeyFromName]);

  const hasActiveFilters = selectedDiseases.size > 0 || selectedVisibility.size > 0;

  const filteredModels = useMemo(() => {
    return models.filter((m) => {
      const diseaseKey = getDiseaseKeyFromName(m.disease);
      const matchesDisease =
        selectedDiseases.size === 0 || (diseaseKey != null && selectedDiseases.has(diseaseKey));
      // both selected = same as neither (show all)
      const matchesVisibility =
        selectedVisibility.size !== 1 ||
        (selectedVisibility.has("public") && m.is_public) ||
        (selectedVisibility.has("private") && !m.is_public);
      return matchesDisease && matchesVisibility;
    });
  }, [models, selectedDiseases, selectedVisibility, getDiseaseKeyFromName]);

  const toggleDisease = (key: DiseaseType) =>
    setSelectedDiseases((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });

  const toggleVisibility = (v: "public" | "private") =>
    setSelectedVisibility((prev) => {
      const next = new Set(prev);
      next.has(v) ? next.delete(v) : next.add(v);
      return next;
    });

  const clearFilters = () => {
    setSelectedDiseases(new Set());
    setSelectedVisibility(new Set());
  };

  const optionChip = "inline-flex items-center gap-1 text-[11px] px-2.5 py-1.5 rounded-full font-semibold cursor-pointer transition-colors whitespace-nowrap select-none bg-[var(--bg-surface-muted)] text-[var(--text-muted)] hover:text-[var(--text-color)]";
  const activeChip = "inline-flex items-center gap-1 text-[11px] px-2.5 py-1.5 rounded-full font-semibold whitespace-nowrap select-none";

  // All available filter options not yet selected
  const availableDiseases = diseaseOptions.filter((k) => !selectedDiseases.has(k));
  const availableVisibility = (["public", "private"] as const).filter((v) => !selectedVisibility.has(v));
  const hasAvailableOptions = availableDiseases.length > 0 || availableVisibility.length > 0;

  return (
    <>
      {/* Row 1: available options to add */}
      {hasAvailableOptions && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wide shrink-0">
            {t("form.filter.label", "Filter")}
          </span>
          {availableDiseases.map((key) => {
            const info = DiseaseInfo[key];
            return (
              <span
                key={key}
                role="button"
                tabIndex={0}
                onClick={() => toggleDisease(key)}
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggleDisease(key); } }}
                className={optionChip}
              >
                <FontAwesomeIcon icon={info.icon} />
                {t(`disease.${key}.name`, info.name)}
              </span>
            );
          })}
          {availableVisibility.map((v) => {
            const isPublic = v === "public";
            return (
              <span
                key={v}
                role="button"
                tabIndex={0}
                onClick={() => toggleVisibility(v)}
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggleVisibility(v); } }}
                className={optionChip}
              >
                <FontAwesomeIcon icon={isPublic ? faGlobe : faLock} />
                {t(`form.cards.model.${v}`)}
              </span>
            );
          })}
        </div>
      )}

      {/* Row 2: active filter tags */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wide shrink-0">
            {t("form.filter.active", "Active")}
          </span>
          {Array.from(selectedDiseases).map((key) => {
            const info = DiseaseInfo[key];
            return (
              <span key={key} className={`${activeChip} bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-200`}>
                <FontAwesomeIcon icon={info.icon} />
                {t(`disease.${key}.name`, info.name)}
                <span
                  role="button"
                  tabIndex={0}
                  onClick={() => toggleDisease(key)}
                  onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggleDisease(key); } }}
                  className="cursor-pointer opacity-50 hover:opacity-100 hover:text-red-500 transition-all ml-0.5"
                  aria-label="Remove filter"
                >
                  <FontAwesomeIcon icon={faXmark} />
                </span>
              </span>
            );
          })}
          {Array.from(selectedVisibility).map((v) => {
            const isPublic = v === "public";
            return (
              <span key={v} className={`${activeChip} ${isPublic ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/70 dark:text-emerald-100" : "bg-orange-100 text-orange-800 dark:bg-orange-900/70 dark:text-orange-100"}`}>
                <FontAwesomeIcon icon={isPublic ? faGlobe : faLock} />
                {t(`form.cards.model.${v}`)}
                <span
                  role="button"
                  tabIndex={0}
                  onClick={() => toggleVisibility(v)}
                  onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggleVisibility(v); } }}
                  className="cursor-pointer opacity-50 hover:opacity-100 hover:text-red-500 transition-all ml-0.5"
                  aria-label="Remove filter"
                >
                  <FontAwesomeIcon icon={faXmark} />
                </span>
              </span>
            );
          })}
          <span
            role="button"
            tabIndex={0}
            onClick={clearFilters}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") clearFilters(); }}
            className="text-[11px] text-[var(--text-muted)] underline underline-offset-2 hover:text-[var(--text-color)] transition-colors cursor-pointer ml-1"
          >
            {t("form.filter.clearAll")}
          </span>
        </div>
      )}


      {/* Grid */}
      {filteredModels.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredModels.map((model) => (
            <ModelCard
              key={model._id}
              model={model}
              isActive={currentModelId === model._id}
              onSelect={onSelect}
              getDiseaseKeyFromName={getDiseaseKeyFromName}
              resolveOwnerName={resolveOwnerName}
              onShowDetails={setDetailModel}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2 py-12 text-[var(--text-muted)]">
          <p className="text-sm">{t("form.filter.empty")}</p>
          <span
            role="button"
            tabIndex={0}
            onClick={clearFilters}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") clearFilters(); }}
            className="text-xs underline underline-offset-2 hover:text-[var(--text-color)] transition-colors cursor-pointer"
          >
            {t("form.filter.clearAll")}
          </span>
        </div>
      )}

      {detailModel && (
        <ModelDetailModal
          model={detailModel}
          onClose={() => setDetailModel(null)}
          getDiseaseKeyFromName={getDiseaseKeyFromName}
          resolveOwnerName={resolveOwnerName}
        />
      )}
    </>
  );
}

// Measures available container height at runtime and applies the exact line-clamp that fits.
function ClampedDescription({ summary, description }: { summary: string | null; description: string | null }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const summaryRef = useRef<HTMLParagraphElement>(null);
  const [descLines, setDescLines] = useState(10);

  useLayoutEffect(() => {
    const update = () => {
      const el = containerRef.current;
      if (!el) return;
      const totalH = el.clientHeight;
      // offsetHeight excludes margin; add mb-1 (4px) + 8px bottom safety margin
      const summaryH = summaryRef.current ? summaryRef.current.offsetHeight + 4 : 0;
      const lineH = 19; // text-[11px] leading-relaxed ≈ 17.875px, use 19 to stay safely under
      setDescLines(Math.max(1, Math.floor((totalH - summaryH - 8) / lineH)));
    };
    update();
    const ro = new ResizeObserver(update);
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, [summary, description]);

  if (!summary && !description) return null;

  return (
    <div ref={containerRef} className="flex-1 min-h-0">
      {summary && (
        <p ref={summaryRef} className="text-xs font-semibold text-[var(--text-color)] mb-1">{summary}</p>
      )}
      {description && (
        <p
          className="text-[11px] text-[var(--text-muted)] leading-relaxed"
          style={{ display: "-webkit-box", WebkitBoxOrient: "vertical", WebkitLineClamp: descLines, overflow: "hidden" }}
        >
          {description}
        </p>
      )}
    </div>
  );
}

type ResolveOwnerName = (userId: string | null, t: (k: string, fb?: string) => string) => string | null;

type ModelCardProps = {
  model: Model;
  isActive: boolean;
  onSelect: (id: string) => void;
  getDiseaseKeyFromName: (name: string) => DiseaseType | undefined;
  resolveOwnerName: ResolveOwnerName;
  onShowDetails: (model: Model) => void;
};

function ModelCard({ model, isActive, onSelect, getDiseaseKeyFromName, resolveOwnerName, onShowDetails }: ModelCardProps) {
  const { t } = useTranslations();
  const diseaseKey = getDiseaseKeyFromName(model.disease);
  const diseaseInfo = diseaseKey ? DiseaseInfo[diseaseKey] : undefined;
  const ownerName = resolveOwnerName(model.user, t);

  const handleSelect = () => { if (model._id) onSelect(model._id); };
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); handleSelect(); }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      className={`relative rounded-2xl border transition-all cursor-pointer flex flex-col bg-[var(--bg-surface)] h-[300px] sm:h-[320px] overflow-hidden ${
        isActive
          ? "border-[var(--primary)] ring-2 ring-[var(--primary)] shadow-lg"
          : "border-[var(--border-muted)] hover:border-[var(--primary)] hover:shadow-md"
      }`}
      onClick={handleSelect}
      onKeyDown={handleKeyDown}
    >
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-[var(--primary)]/5 via-transparent to-[var(--secondary)]/5 pointer-events-none" />
      <div className="relative p-4 flex flex-col gap-3 h-full">

        {/* Header: name + all chips */}
        <div>
          <h3 className="text-base font-semibold text-[var(--text-color)] leading-tight mb-2">{model.name}</h3>
          <div className="flex gap-1.5 flex-wrap">
            <span className="text-[11px] px-2.5 py-1.5 rounded-full font-semibold bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-200 whitespace-nowrap">
              {diseaseInfo && <FontAwesomeIcon icon={diseaseInfo.icon} className="align-middle mr-1" />}
              <span className="align-middle">{t(`disease.${model.disease}.name`, model.disease)}</span>
            </span>
            {model.model_type && (
              <span className="text-[11px] px-2.5 py-1.5 rounded-full font-semibold bg-violet-100 text-violet-800 dark:bg-violet-900/60 dark:text-violet-200 whitespace-nowrap">
                {t(`model.type.${model.model_type}.paradigm`, model.model_type)}
              </span>
            )}
            {model.recommended && (
              <span className="text-[11px] px-2.5 py-1.5 rounded-full font-semibold bg-amber-100 text-amber-700 dark:bg-amber-900/60 dark:text-amber-300 whitespace-nowrap">
                <FontAwesomeIcon icon={faStar} className="align-middle mr-1" />
                <span className="align-middle">{t("form.cards.model.recommended")}</span>
              </span>
            )}
            <span className={`text-[11px] px-2.5 py-1.5 rounded-full font-semibold whitespace-nowrap ${
              model.is_public
                ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/70 dark:text-emerald-100"
                : "bg-orange-100 text-orange-800 dark:bg-orange-900/70 dark:text-orange-100"
            }`}>
              <FontAwesomeIcon icon={model.is_public ? faGlobe : faLock} className="align-middle mr-1" />
              <span className="align-middle">{model.is_public ? t("form.cards.model.public") : t("form.cards.model.private")}</span>
            </span>
          </div>
        </div>

        <ClampedDescription summary={model.summary} description={model.description} />

        {/* Footer */}
        <div className="flex items-center justify-between text-sm pt-2 border-t border-[var(--border-muted)] mt-auto">
          <div className="flex items-center gap-2 text-[var(--text-muted)]">
            <span className={`w-2 h-2 rounded-full ${isActive ? "bg-[var(--primary)]" : "bg-[var(--secondary)]/60"}`} />
            <span className="text-xs">{isActive ? t("form.cards.model.status.selected") : t("form.cards.model.selected")}</span>
          </div>
          <button
            className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition ${
              isActive
                ? "text-[var(--primary)] bg-[var(--primary)]/10 hover:bg-[var(--primary)]/20"
                : "text-[var(--text-color)] bg-[var(--bg-surface-muted)] hover:bg-[var(--border-muted)]"
            }`}
            onClick={(e) => { e.stopPropagation(); onShowDetails(model); }}
          >
            {t("form.cards.model.view")} <FontAwesomeIcon icon={faArrowRight} />
          </button>
        </div>

        {/* Owner — only for non-default models */}
        {ownerName && model.user !== "default" && (
          <p className="text-[10px] text-[var(--text-muted)] -mt-1">{t("models.card.owner")}: {ownerName}</p>
        )}
      </div>
    </div>
  );
}

type ModelDetailModalProps = {
  model: Model;
  onClose: () => void;
  getDiseaseKeyFromName: (name: string) => DiseaseType | undefined;
  resolveOwnerName: ResolveOwnerName;
};

function ModelDetailModal({ model, onClose, getDiseaseKeyFromName, resolveOwnerName }: ModelDetailModalProps) {
  const { t } = useTranslations();
  const diseaseKey = getDiseaseKeyFromName(model.disease);
  const diseaseInfo = diseaseKey ? DiseaseInfo[diseaseKey] : undefined;
  const ownerName = resolveOwnerName(model.user, t);

  const allMetrics: [string, number][] = model.metrics ? [
    ["models.metrics.roc_auc", model.metrics.roc_auc],
    ["models.metrics.accuracy", model.metrics.accuracy],
    ["models.metrics.f1", model.metrics.f1],
    ["models.metrics.recall", model.metrics.recall],
    ["models.metrics.precision", model.metrics.precision],
  ].filter(([, v]) => v != null && !isNaN(v as number)) as [string, number][] : [];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-muted)] shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-br from-[var(--primary)]/10 via-transparent to-[var(--secondary)]/10" />
        <div className="relative p-6 flex flex-col gap-4">

          {/* Header */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <p className="text-xs uppercase tracking-wide text-[var(--text-muted)] mb-1">{t("form.cards.model.modelLabel")}</p>
              <h3 className="text-xl font-semibold text-[var(--text-color)] leading-tight mb-2">{model.name}</h3>
              <div className="flex gap-1.5 flex-wrap">
                <span className="text-[11px] px-2.5 py-1.5 rounded-full font-semibold bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-200 whitespace-nowrap">
                  {diseaseInfo && <FontAwesomeIcon icon={diseaseInfo.icon} className="align-middle mr-1" />}
                  <span className="align-middle">{t(`disease.${model.disease}.name`, model.disease)}</span>
                </span>
                {model.model_type && (
                  <span className="text-[11px] px-2.5 py-1.5 rounded-full font-semibold bg-violet-100 text-violet-800 dark:bg-violet-900/60 dark:text-violet-200 whitespace-nowrap">
                    {t(`model.type.${model.model_type}.paradigm`, model.model_type)}
                  </span>
                )}
                {model.recommended && (
                  <span className="text-[11px] px-2.5 py-1.5 rounded-full font-semibold bg-amber-100 text-amber-700 dark:bg-amber-900/60 dark:text-amber-300 whitespace-nowrap">
                    <FontAwesomeIcon icon={faStar} className="align-middle mr-1" />
                    <span className="align-middle">{t("form.cards.model.recommended")}</span>
                  </span>
                )}
              </div>
            </div>
            <button
              className="px-3 py-2 rounded-lg bg-[var(--bg-surface-muted)] text-[var(--text-color)] hover:bg-[var(--border-muted)] transition text-sm flex-shrink-0"
              onClick={onClose}
              aria-label="Close details"
            >
              {t("form.cards.model.close")}
            </button>
          </div>

          {/* Description */}
          <div className="rounded-xl border border-[var(--border-muted)] bg-[var(--bg-surface-muted)] p-4">
            <p className="text-xs uppercase tracking-wide text-[var(--text-muted)] mb-2">{t("form.cards.model.description")}</p>
            {model.summary && (
              <p className="text-sm font-semibold text-[var(--text-color)] mb-1">{model.summary}</p>
            )}
            <p className="text-sm text-[var(--text-color)] leading-relaxed opacity-80">
              {model.description || (!model.summary && t("models.card.noDescription"))}
            </p>
          </div>

          {/* Performance metrics — only filled values */}
          {allMetrics.length > 0 && (
            <div className="rounded-xl border border-[var(--border-muted)] bg-[var(--bg-surface-muted)] p-4">
              <p className="text-xs uppercase tracking-wide text-[var(--text-muted)] mb-3">{t("form.cards.model.metrics")}</p>
              <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${Math.min(allMetrics.length, 3)}, 1fr)` }}>
                {allMetrics.map(([key, value]) => (
                  <div key={key} title={t(`${key}.tooltip`, "")} className="text-center rounded-lg bg-[var(--bg-surface)] border border-[var(--border-muted)] p-2 cursor-help">
                    <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wide mb-1">{t(key)}</p>
                    <p className="text-sm font-bold text-[var(--text-color)]">{(value * 100).toFixed(1)}%</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Visibility + Owner */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-xl border border-[var(--border-muted)] bg-[var(--bg-surface-muted)] p-3">
              <p className="text-xs uppercase tracking-wide text-[var(--text-muted)] mb-1">{t("form.cards.model.visibility")}</p>
              <div className="flex items-center gap-2 text-[var(--text-color)] font-semibold">
                <FontAwesomeIcon icon={model.is_public ? faGlobe : faLock} />
                {model.is_public ? t("form.cards.model.public") : t("form.cards.model.private")}
              </div>
            </div>
            <div className="rounded-xl border border-[var(--border-muted)] bg-[var(--bg-surface-muted)] p-3">
              <p className="text-xs uppercase tracking-wide text-[var(--text-muted)] mb-1">{t("models.card.owner")}</p>
              <p className="text-[var(--text-color)] font-semibold break-words">{ownerName ?? t("form.cards.model.builtin")}</p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
