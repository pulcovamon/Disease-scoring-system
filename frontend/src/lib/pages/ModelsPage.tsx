import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus, faSliders } from "@fortawesome/free-solid-svg-icons";
import "./modelsPage.css";
import "./personalPages.css";
import ModelUpload from "../components/ModelUpload";
import { Model } from "../classes/model";
import ModelList from "../components/ModelList";
import { postFormMethod } from "../classes/api";
import { useAuth } from "../store/auth";
import LoadingSpinner from "../components/LoadingSpinner";

type UploadState = {
  type: "success" | "error" | "info" | null;
  message: string;
};

export default function ModelsPage() {
  const { status } = useAuth();

  const [modelFile, setModelFile] = useState<File | null>(null);
  const [sendDialogOpen, setSendDialogOpen] = useState<boolean>(false);
  const [uploading, setUploading] = useState(false);
  const [uploadState, setUploadState] = useState<UploadState>({ type: null, message: "" });
  const [refreshKey, setRefreshKey] = useState(0);
  const [filters, setFilters] = useState({
    include_user: true,
    include_public: true,
    include_default: true,
  });

  const toggleFilter = (key: keyof typeof filters) => {
    setFilters((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  async function sendModel(
    modelToSend: Model,
    modelFileToSend: File,
    encoderFile?: File,
    imageFile?: File
  ): Promise<boolean> {
    setUploading(true);
    setUploadState({ type: "info", message: "Uploading model..." });

    const formData = new FormData();
    formData.append("file", modelFileToSend);
    if (encoderFile) formData.append("encoder", encoderFile);
    if (imageFile) formData.append("image", imageFile);

    try {
      await postFormMethod("/model", formData, {
        includeAuth: true,
        queryParams: {
          disease: modelToSend.disease,
          model_name: modelToSend.name,
          description: modelToSend.description || "",
          is_public: modelToSend.is_public,
        },
      });

      setModelFile(null);
      setRefreshKey((key) => key + 1);
      setUploadState({
        type: "success",
        message: "Model uploaded successfully. It may take a moment to become available.",
      });
      return true;
    } catch (error) {
      console.error("Failed to upload model", error);
      setUploadState({
        type: "error",
        message: "Model upload failed. Please verify fields and try again.",
      });
      return false;
    } finally {
      setUploading(false);
    }
  }

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
          <h2>Models</h2>
          <p className="muted">Upload new models and reuse existing ones.</p>
        </div>
        <button className="primary-button" onClick={() => setSendDialogOpen(true)}>
          <FontAwesomeIcon icon={faPlus} /> New model
        </button>
      </div>

      <div className="section-card">
        <div className="filters-row">
          <span className="subtle">
            <FontAwesomeIcon icon={faSliders} /> Filters
          </span>
          <label>
            <input
              type="checkbox"
              checked={filters.include_user}
              onChange={() => toggleFilter("include_user")}
            />
            My models
          </label>
          <label>
            <input
              type="checkbox"
              checked={filters.include_default}
              onChange={() => toggleFilter("include_default")}
            />
            Default models
          </label>
          <label>
            <input
              type="checkbox"
              checked={filters.include_public}
              onChange={() => toggleFilter("include_public")}
            />
            Public models
          </label>
        </div>
        <p className="subtle">
          Public and default models remain available even if you do not upload anything yourself.
        </p>
      </div>

      {uploadState.type && (
        <div className={`status-banner ${uploadState.type}`}>
          {uploadState.message}
        </div>
      )}

      {sendDialogOpen && (
        <ModelUpload
          model={modelFile}
          uploadModel={setModelFile}
          removeModel={() => setModelFile(null)}
          setSendDialogOpen={setSendDialogOpen}
          send={sendModel}
          sending={uploading}
        />
      )}

      <ModelList filters={filters} refreshKey={refreshKey} />
    </div>
  );
}
