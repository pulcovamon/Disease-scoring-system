import { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCloudArrowDown, faDatabase, faPaperPlane } from "@fortawesome/free-solid-svg-icons";
import { useNavigate } from "react-router-dom";
import "./personalPages.css";
import { getBlob, getMethod, postFormMethod } from "../classes/api";
import { Model } from "../classes/model";
import FileUploader from "../components/FileUploader";
import LoadingSpinner from "../components/LoadingSpinner";
import { useAuth } from "../store/auth";

type UploadState = {
  type: "success" | "error" | "info" | null;
  message: string;
};

export default function DatasetsPage() {
  const { status } = useAuth();
  const [datasetFile, setDatasetFile] = useState<File | null>(null);
  const [models, setModels] = useState<Model[]>([]);
  const [selectedModelId, setSelectedModelId] = useState<string>("");
  const [loadingModels, setLoadingModels] = useState(true);
  const [modelsError, setModelsError] = useState<string | null>(null);
  const [uploadState, setUploadState] = useState<UploadState>({ type: null, message: "" });
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (status !== "authenticated") return;

    setLoadingModels(true);
    setModelsError(null);

    getMethod<Model[]>("/model", {
      include_user: true,
      include_public: true,
      include_default: true,
    })
      .then((data) => {
        setModels(data);
        if (data.length > 0 && !selectedModelId) {
          setSelectedModelId(data[0]._id || "");
        }
      })
      .catch((err) => {
        console.error(err);
        setModelsError("Unable to load models right now.");
      })
      .finally(() => setLoadingModels(false));
  }, [status]);

  const downloadTemplate = async (format: "csv" | "json") => {
    try {
      const blob = await getBlob("/prediction/template", { file_format: format });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `template.${format}`;
      anchor.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error(error);
      setUploadState({ type: "error", message: "Unable to download the template right now." });
    }
  };

  const handleSubmit = async () => {
    if (!datasetFile || !selectedModelId) {
      setUploadState({ type: "error", message: "Select a model and dataset before sending." });
      return;
    }

    setSubmitting(true);
    setUploadState({ type: "info", message: "Submitting dataset for scoring..." });

    const formData = new FormData();
    formData.append("dataset", datasetFile);

    try {
      const response = await postFormMethod<{ task_id?: string }>("/prediction/dataset", formData, {
        includeAuth: true,
        queryParams: { model_id: selectedModelId },
      });

      const taskId = response?.task_id;
      setUploadState({
        type: "success",
        message: taskId
          ? `Dataset submitted. Task ID: ${taskId}.`
          : "Dataset submitted. Track it in History.",
      });
      setDatasetFile(null);

      if (taskId) {
        navigate(`/result?id=${taskId}`);
      }
    } catch (error) {
      console.error(error);
      setUploadState({ type: "error", message: "Dataset submission failed. Try again." });
    } finally {
      setSubmitting(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="pagebody">
        <LoadingSpinner />
      </div>
    );
  }
  if (status === "unauthenticated") return null;

  return (
    <div className="pagebody personal-page">
      <div className="page-hero">
        <div>
          <p className="eyebrow">Personal</p>
          <h2>Datasets</h2>
          <p className="muted">Upload a dataset and queue a scoring task with your chosen model.</p>
        </div>
        <button
          className="primary-button"
          onClick={handleSubmit}
          disabled={!datasetFile || !selectedModelId || submitting}
        >
          <FontAwesomeIcon icon={faPaperPlane} />{" "}
          {submitting ? "Sending..." : "Send to scoring"}
        </button>
      </div>

      {uploadState.type && (
        <div className={`status-banner ${uploadState.type}`}>
          {uploadState.message}
        </div>
      )}

      <div className="dataset-layout">
        <div className="section-card">
          <h3>
            <FontAwesomeIcon icon={faDatabase} /> Dataset
          </h3>
          <p className="muted">
            Use the template to match the expected columns, then upload your CSV or JSON file.
          </p>
          <FileUploader
            accept=".csv,.json"
            onFileSelect={setDatasetFile}
            unallowed={!datasetFile && uploadState.type === "error"}
          />
          {datasetFile && <div className="file-name">{datasetFile.name}</div>}
          <p className="inline-help">We process datasets for scoring only and discard them afterwards.</p>
        </div>

        <div className="section-card">
          <h3>Model selection</h3>
          {loadingModels ? (
            <LoadingSpinner />
          ) : modelsError ? (
            <div className="status-banner error">{modelsError}</div>
          ) : models.length === 0 ? (
            <div className="status-banner info">No models available yet.</div>
          ) : (
            <>
              <label className="filters-row" style={{ gap: "8px" }}>
                <span className="subtle">Use this model:</span>
                <select
                  value={selectedModelId}
                  onChange={(e) => setSelectedModelId(e.target.value)}
                  style={{ padding: "10px", borderRadius: "10px", border: "1px solid #d1d5db" }}
                >
                  {models.map((model) => (
                    <option key={model._id || model.name} value={model._id || ""}>
                      {model.name} • {model.disease}
                    </option>
                  ))}
                </select>
              </label>
              <p className="inline-help">Only models you have access to are listed here.</p>
            </>
          )}

          <div className="dataset-actions">
            <button className="ghost-button" type="button" onClick={() => downloadTemplate("csv")}>
              <FontAwesomeIcon icon={faCloudArrowDown} /> Template (CSV)
            </button>
            <button className="ghost-button" type="button" onClick={() => downloadTemplate("json")}>
              <FontAwesomeIcon icon={faCloudArrowDown} /> Template (JSON)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
