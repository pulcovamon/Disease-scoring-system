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
import { useTranslations } from "../i18n/useTranslations";

type UploadState = {
  type: "success" | "error" | "info" | null;
  message: string;
};

export default function ModelsPage() {
  const { status } = useAuth();
  const { t } = useTranslations();

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
    setUploadState({ type: "info", message: t("models.uploading") });

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
        message: t("models.upload.success"),
      });
      return true;
    } catch (error) {
      console.error("Failed to upload model", error);
      setUploadState({
        type: "error",
        message: t("models.upload.error"),
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
          <p className="eyebrow">{t("personal.label")}</p>
          <h2>{t("models.title")}</h2>
          <p className="muted">{t("models.subtitle")}</p>
        </div>
        <button className="primary-button" onClick={() => setSendDialogOpen(true)}>
          <FontAwesomeIcon icon={faPlus} /> {t("models.new")}
        </button>
      </div>

      <div className="section-card">
        <div className="filters-row">
          <span className="subtle">
            <FontAwesomeIcon icon={faSliders} /> {t("models.filters")}
          </span>
          <label>
            <input
              type="checkbox"
              checked={filters.include_user}
              onChange={() => toggleFilter("include_user")}
            />
            {t("models.filter.mine")}
          </label>
          <label>
            <input
              type="checkbox"
              checked={filters.include_default}
              onChange={() => toggleFilter("include_default")}
            />
            {t("models.filter.default")}
          </label>
          <label>
            <input
              type="checkbox"
              checked={filters.include_public}
              onChange={() => toggleFilter("include_public")}
            />
            {t("models.filter.public")}
          </label>
        </div>
        <p className="subtle">
          {t("models.hint")}
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
