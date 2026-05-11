import { useState } from "react"
import { faXmark } from "@fortawesome/free-solid-svg-icons"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import FileUploader from "./FileUploader"
import { Model, ModelMetrics } from "../classes/model"
import { DiseaseType, DiseaseInfo } from "../classes/disease"
import { useTranslations } from "../i18n/useTranslations"
import CreatableSelect from "./CreatableSelect"

const KNOWN_MODEL_TYPES = ["random_forest", "logistic_regression", "hmm"]

type MetricKey = keyof ModelMetrics
const METRIC_KEYS: MetricKey[] = ["roc_auc", "recall", "f1", "precision", "accuracy"]

function fromPercent(s: string): number | null {
  const n = parseFloat(s)
  if (isNaN(n)) return null
  return Math.round(n * 100) / 10000
}

type ModelUploadProps = {
  setSendDialogOpen: (open: boolean) => void
  send: (modelToSend: Model, modelFile: File) => Promise<boolean>
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

  // Performance metrics — stored as percentage strings for editing
  const [metrics, setMetrics] = useState<Record<MetricKey, string>>({
    roc_auc: "", recall: "", f1: "", precision: "", accuracy: "",
  })
  const setMetric = (key: MetricKey, val: string) =>
    setMetrics(prev => ({ ...prev, [key]: val }))

  // Files
  const [modelFile, setModelFile] = useState<File | null>(null)

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

          {/* ── Section 3: Performance ── */}
          <div className="form-section">
            <span className="form-section-title">{t("models.edit.section.performance")}</span>
            <span style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
              {t("models.edit.metrics.help")}
            </span>

            <div className="metrics-grid">
              {METRIC_KEYS.map(key => (
                <div className="metric-field" key={key}>
                  <label>{t(`models.metrics.${key}`)}</label>
                  <div className="metric-input-row">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      value={metrics[key]}
                      onChange={e => setMetric(key, e.target.value)}
                      placeholder="—"
                    />
                    <span className="unit">%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Section 4: Files ── */}
          <div className="form-section">
            <span className="form-section-title">{t("models.edit.section.files")}</span>

            <label>
              {t("models.upload.file")}
              <FileUploader onFileSelect={setModelFile} unallowed={false} accept=".onnx" />
              {modelFile && (
                <span className="uploaded-model">
                  {modelFile.name}
                  <button type="button" onClick={() => setModelFile(null)}>
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

              const builtMetrics: Partial<ModelMetrics> = {}
              for (const key of METRIC_KEYS) {
                const v = fromPercent(metrics[key])
                if (v !== null) builtMetrics[key] = v
              }

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
                accuracy: builtMetrics.accuracy ?? null,
                metrics: Object.keys(builtMetrics).length > 0 ? builtMetrics as ModelMetrics : null,
              }

              const success = await send(modelToSend, modelFile)
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
