import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { getMethod } from "../classes/api";
import { Model } from "../classes/model";
import { Patient } from "../classes/patient";
import { DataSender } from "../classes/data";

export enum WizardStep {
  SelectModel = 0,
  SelectInputMethod = 1,
  Send = 2,
}

export enum WizardInputMethod {
  Manual = "Manual",
  CSV = "CSV",
}

type PersistedWizardState = {
  step: WizardStep;
  currentModelId: string | null;
  inputMethod: WizardInputMethod;
  codes: string[];
  patient: Patient;
  unallowed: boolean;
};

type WizardState = PersistedWizardState & {
  models: Model[];
  loadingModels: boolean;
  modelsError: string | null;
  uploadedFile: File | null;
  uploadedFileName: string | null;
  sending: boolean;
  submissionError: string | null;
};

type SubmitResult = { taskId: string | null; error: string | null };

type ScoringWizardContextValue = WizardState & {
  currentModel: Model | null;
  setInputMethod: (method: WizardInputMethod) => void;
  selectModel: (modelId: string) => void;
  addCode: (code: string) => void;
  updateCode: (index: number, newCode: string) => void;
  removeCode: (index: number) => void;
  setPatient: (patient: Patient) => void;
  setUploadedFile: (file: File | null) => void;
  nextStep: () => Promise<SubmitResult>;
  previousStep: () => void;
  isNextDisabled: () => boolean;
  resetValidation: () => void;
  setUnallowed: (value: boolean) => void;
};

const STORAGE_KEY = "scoring-wizard-state";

const defaultPersisted: PersistedWizardState = {
  step: WizardStep.SelectModel,
  currentModelId: null,
  inputMethod: WizardInputMethod.Manual,
  codes: [],
  patient: { id: null, name: "", surname: "" },
  unallowed: false,
};

const ScoringWizardContext = createContext<ScoringWizardContextValue | undefined>(undefined);

function loadPersistedState(): PersistedWizardState {
  try {
    if (typeof sessionStorage === "undefined") return defaultPersisted;
    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (!stored) return defaultPersisted;
    const parsed = JSON.parse(stored);
    return { ...defaultPersisted, ...parsed };
  } catch (error) {
    console.warn("Failed to parse persisted scoring wizard state", error);
    return defaultPersisted;
  }
}

export function ScoringWizardProvider({ children }: { children: ReactNode }) {
  const persisted = loadPersistedState();

  const [state, setState] = useState<WizardState>({
    ...defaultPersisted,
    ...persisted,
    models: [],
    loadingModels: true,
    modelsError: null,
    uploadedFile: null,
    uploadedFileName: null,
    sending: false,
    submissionError: null,
  });

  useEffect(() => {
    const persistable: PersistedWizardState = {
      step: state.step,
      currentModelId: state.currentModelId,
      inputMethod: state.inputMethod,
      codes: state.codes,
      patient: state.patient,
      unallowed: state.unallowed,
    };
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(persistable));
    } catch (error) {
      console.warn("Failed to persist scoring wizard state", error);
    }
  }, [state.step, state.currentModelId, state.inputMethod, state.codes, state.patient, state.unallowed]);

  useEffect(() => {
    setState((prev) => ({ ...prev, loadingModels: true, modelsError: null }));

    getMethod<Model[]>("/model", {
      include_default: true,
      include_user: true,
      include_public: true,
    })
      .then((models) => {
        setState((prev) => {
          const existingId = models.find((m) => m._id === prev.currentModelId)?._id || null;
          const currentModelId = existingId || models[0]?._id || null;
          return {
            ...prev,
            models,
            currentModelId,
            loadingModels: false,
          };
        });
      })
      .catch((error) => {
        console.error("Failed to load models", error);
        setState((prev) => ({
          ...prev,
          modelsError: "Failed to load models. Please try again.",
          loadingModels: false,
        }));
      });
  }, []);

  const currentModel = useMemo(() => {
    return state.models.find((model) => model._id === state.currentModelId) || null;
  }, [state.currentModelId, state.models]);

  const resetValidation = useCallback(() => {
    setState((prev) => ({ ...prev, unallowed: false }));
  }, []);

  const setInputMethod = useCallback((method: WizardInputMethod) => {
    setState((prev) => ({ ...prev, inputMethod: method, unallowed: false }));
  }, []);

  const selectModel = useCallback((modelId: string) => {
    setState((prev) => ({
      ...prev,
      currentModelId: modelId,
      codes: [],
      unallowed: false,
    }));
  }, []);

  const addCode = useCallback((code: string) => {
    setState((prev) => ({
      ...prev,
      codes: [...prev.codes, code],
      unallowed: false,
    }));
  }, []);

  const updateCode = useCallback((index: number, newCode: string) => {
    setState((prev) => {
      const updated = [...prev.codes];
      updated[index] = newCode;
      return { ...prev, codes: updated, unallowed: false };
    });
  }, []);

  const removeCode = useCallback((index: number) => {
    setState((prev) => {
      const updated = prev.codes.filter((_, idx) => idx !== index);
      return { ...prev, codes: updated, unallowed: false };
    });
  }, []);

  const setPatient = useCallback((patient: Patient) => {
    setState((prev) => ({ ...prev, patient, unallowed: false }));
  }, []);

  const setUploadedFile = useCallback((file: File | null) => {
    setState((prev) => ({
      ...prev,
      uploadedFile: file,
      uploadedFileName: file ? file.name : null,
      unallowed: false,
    }));
  }, []);

  const previousStep = useCallback(() => {
    setState((prev) => ({
      ...prev,
      step: prev.step > WizardStep.SelectModel ? (prev.step - 1) as WizardStep : prev.step,
      unallowed: false,
      submissionError: null,
    }));
  }, []);

  const isNextDisabled = useCallback(() => {
    if (state.step === WizardStep.SelectModel) return false;
    if (state.inputMethod === WizardInputMethod.Manual) {
      return state.patient.name.trim() === "" || state.codes.length === 0;
    }
    return state.uploadedFile === null;
  }, [state.codes.length, state.inputMethod, state.patient.name, state.step, state.uploadedFile]);

  const submitPrediction = useCallback(async (): Promise<SubmitResult> => {
    if (!currentModel?._id) {
      return { taskId: null, error: "Select a model before sending." };
    }

    setState((prev) => ({ ...prev, sending: true, submissionError: null }));
    const sender = new DataSender(
      state.codes,
      currentModel._id,
      state.inputMethod === WizardInputMethod.Manual ? "patient" : "dataset"
    );

    try {
      await sender.postData();
      const message = sender.message || null;
      setState((prev) => ({ ...prev, sending: false, submissionError: message }));

      if (message) {
        return { taskId: null, error: message };
      }

      return { taskId: sender.id, error: null };
    } catch (error) {
      console.error("Failed to submit prediction", error);
      setState((prev) => ({ ...prev, sending: false, submissionError: "Failed to submit prediction." }));
      return { taskId: null, error: "Failed to submit prediction." };
    }
  }, [currentModel, state.codes, state.inputMethod]);

  const nextStep = useCallback(async (): Promise<SubmitResult> => {
    if (isNextDisabled()) {
      setState((prev) => ({ ...prev, unallowed: true }));
      return { taskId: null, error: "validation" };
    }

    if (state.step === WizardStep.Send) {
      return submitPrediction();
    }

    setState((prev) => ({
      ...prev,
      step: (prev.step + 1) as WizardStep,
      unallowed: false,
      submissionError: null,
    }));
    return { taskId: null, error: null };
  }, [isNextDisabled, state.step, submitPrediction]);

  const value: ScoringWizardContextValue = {
    ...state,
    currentModel,
    setInputMethod,
    selectModel,
    addCode,
    updateCode,
    removeCode,
    setPatient,
    setUploadedFile,
    nextStep,
    previousStep,
    isNextDisabled,
    resetValidation,
    setUnallowed: (value: boolean) =>
      setState((prev) => ({
        ...prev,
        unallowed: value,
      })),
  };

  return <ScoringWizardContext.Provider value={value}>{children}</ScoringWizardContext.Provider>;
}

export function useScoringWizard(): ScoringWizardContextValue {
  const context = useContext(ScoringWizardContext);
  if (!context) {
    throw new Error("useScoringWizard must be used within a ScoringWizardProvider");
  }
  return context;
}
