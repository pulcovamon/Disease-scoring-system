import { useState } from "react"
import { faXmark } from "@fortawesome/free-solid-svg-icons"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import FileUploader from "./FileUploader"
import { Model } from "../classes/model"
import { DiseaseType, DiseaseInfo } from "../classes/disease"
import { useTranslations } from "../i18n/useTranslations"
import CreatableSelect from "./CreatableSelect"

const KNOWN_MODEL_TYPES = ["random_forest", "logistic_regression", "hmm"]

type ModelUploadProps = {
  setSendDialogOpen: (open: boolean) => void
  send: (modelToSend: Model, modelFile: File, encoderFile?: File) => Promise<boolean>
  sending: boolean
}

export default function ModelUpload({ setSendDialogOpen, send, sending }: ModelUploadProps) {
  const { t } = useTranslations()

  // Identity
  const [modelName, setModelName] = useState("")
  const [summary, setSummary] = useState("")
  const [description, setDescription] = useState("")

  // Classification
  const [disease, setDisease] = useState<string>(DiseaseType.LungCancer)
  const [modelType, setModelType] = useState<string>("")
  const [algorithm, setAlgorithm] = useState("")
  const [isPublic, setIsPublic] = useState(false)
  const [recommended, setRecommended] = useState(false)

  // Files
  const [modelFile, setModelFile] = useState<File | null>(null)
  const [encoder, setEncoder] = useState<File | null>(null)

  return (
    <div className="dialog">
      <div className="page-content box dialog-content">
        <button onClick={() => setSendDialogOpen(false)} className="dialog-close">
          <FontAwesomeIcon icon={faXmark} />
        </button>

        <h3>{t("models.upload.title")}</h3>

        <form>

          {/* ── Section 1: Identity ── */}
          <div className="form-section">
            <span className="form-section-title">{t("models.edit.section.identity")}</span>

            <label>
              {t("models.upload.name")}
              <input
                type="text"
                required
                value={modelName}
                onChange={e => setModelName(e.target.value)}
              />
            </label>

            <label>
              {t("models.edit.summary")}
              <span style={{ fontSize: "0.78rem", color: "var(--text-muted)", fontWeight: 400 }}>
                {t("models.edit.summary.help")}
              </span>
              <input
                type="text"
                value={summary}
                onChange={e => setSummary(e.target.value)}
              />
            </label>

            <label>
              {t("models.upload.description")}
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
              />
            </label>
          </div>

          {/* ── Section 2: Classification ── */}
          <div className="form-section">
            <span className="form-section-title">{t("models.edit.section.classification")}</span>

            <label>
              {t("models.edit.disease")}
              <CreatableSelect
                value={disease}
                onChange={setDisease}
                options={Object.values(DiseaseType).map(d => ({ value: d, label: DiseaseInfo[d].name }))}
                addLabel={t("models.edit.addCustom")}
                placeholder={t("models.edit.disease")}
              />
            </label>

            <label>
              {t("models.edit.model_type")}
              <CreatableSelect
                value={modelType}
                onChange={setModelType}
                options={KNOWN_MODEL_TYPES.map(mt => ({ value: mt, label: t(`model.type.${mt}`, mt) }))}
                addLabel={t("models.edit.addCustom")}
                placeholder={t("models.edit.model_type")}
              />
            </label>

            <label>
              {t("models.upload.algorithm")}
              <input
                type="text"
                value={algorithm}
                onChange={e => setAlgorithm(e.target.value)}
              />
            </label>

            <div className="toggle-row">
              <label className="toggle-label">
                <input
                  type="checkbox"
                  checked={isPublic}
                  onChange={e => setIsPublic(e.target.checked)}
                />
                {t("models.upload.public")}
              </label>
              <label className="toggle-label">
                <input
                  type="checkbox"
                  checked={recommended}
                  onChange={e => setRecommended(e.target.checked)}
                />
                {t("models.edit.recommended")}
              </label>
            </div>
          </div>

          {/* ── Section 3: Files ── */}
          <div className="form-section">
            <span className="form-section-title">{t("models.edit.section.files")}</span>

            <label>
              {t("models.upload.file")}
              <FileUploader onFileSelect={setModelFile} unallowed={false} accept=".pkl" />
              {modelFile && (
                <span className="uploaded-model">
                  {modelFile.name}
                  <button type="button" onClick={() => setModelFile(null)}>
                    <FontAwesomeIcon icon={faXmark} />
                  </button>
                </span>
              )}
            </label>

            <label>
              {t("models.upload.encoder")}
              <FileUploader onFileSelect={setEncoder} unallowed={false} accept=".pkl" />
              {encoder && (
                <span className="uploaded-model">
                  {encoder.name}
                  <button type="button" onClick={() => setEncoder(null)}>
                    <FontAwesomeIcon icon={faXmark} />
                  </button>
                </span>
              )}
            </label>
          </div>

          <button
            type="submit"
            onClick={async e => {
              e.preventDefault()
              if (!modelFile) return

              const modelToSend: Model = {
                _id: null,
                user: null,
                path: null,
                name: modelName.trim(),
                disease,
                model_type: modelType.trim() || null,
                recommended,
                summary: summary.trim() || null,
                description: description.trim() || null,
                image: null,
                is_public: isPublic,
                encoder: null,
                algorithm: algorithm.trim() || null,
                accuracy: null,
                metrics: null,
              }

              const success = await send(modelToSend, modelFile, encoder || undefined)
              if (success) setSendDialogOpen(false)
            }}
            disabled={!modelFile || modelName.trim() === "" || sending}
          >
            {sending ? t("models.uploading") : t("models.upload.send")}
          </button>
        </form>
      </div>
    </div>
  )
}
