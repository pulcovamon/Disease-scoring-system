import { useState } from "react"
import { faXmark } from "@fortawesome/free-solid-svg-icons"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { Model, ModelMetrics } from "../classes/model"
import { DiseaseType, DiseaseInfo } from "../classes/disease"
import { patchMethod } from "../classes/api"
import { useTranslations } from "../i18n/useTranslations"
import CreatableSelect from "./CreatableSelect"

type ModelEditDialogProps = {
  model: Model
  onClose: () => void
  onSuccess: () => void
}

const KNOWN_MODEL_TYPES = ["random_forest", "logistic_regression", "hmm"]

type MetricKey = keyof ModelMetrics

const METRIC_KEYS: MetricKey[] = ["roc_auc", "recall", "f1", "precision", "accuracy"]

function toPercent(v: number | null | undefined): string {
  if (v == null) return ""
  return String(Math.round(v * 10000) / 100)
}

function fromPercent(s: string): number | null {
  const n = parseFloat(s)
  if (isNaN(n)) return null
  return Math.round(n * 100) / 10000
}

export default function ModelEditDialog({ model, onClose, onSuccess }: ModelEditDialogProps) {
  const { t } = useTranslations()

  // Identity
  const [name, setName] = useState(model.name)
  const [summary, setSummary] = useState(model.summary ?? "")
  const [description, setDescription] = useState(model.description ?? "")

  // Classification
  const [disease, setDisease] = useState(model.disease)
  const [modelType, setModelType] = useState<string>(model.model_type ?? "")
  const [algorithm, setAlgorithm] = useState(model.algorithm ?? "")
  const [isPublic, setIsPublic] = useState(model.is_public)
  const [recommended, setRecommended] = useState(model.recommended ?? false)

  // Performance metrics — stored as percentage strings for editing
  const [metrics, setMetrics] = useState<Record<MetricKey, string>>({
    roc_auc: toPercent(model.metrics?.roc_auc),
    recall: toPercent(model.metrics?.recall),
    f1: toPercent(model.metrics?.f1),
    precision: toPercent(model.metrics?.precision),
    accuracy: toPercent(model.metrics?.accuracy),
  })

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const setMetric = (key: MetricKey, val: string) =>
    setMetrics(prev => ({ ...prev, [key]: val }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (name.trim() === "") return
    setSaving(true)
    setError(null)

    const builtMetrics: Partial<ModelMetrics> = {}
    for (const key of METRIC_KEYS) {
      const v = fromPercent(metrics[key])
      if (v !== null) builtMetrics[key] = v
    }

    try {
      await patchMethod(`/model/${model._id}`, {
        name: name.trim(),
        summary: summary.trim() || null,
        description: description.trim() || null,
        disease,
        model_type: modelType.trim() || null,
        algorithm: algorithm.trim() || null,
        is_public: isPublic,
        recommended,
        ...(Object.keys(builtMetrics).length > 0 ? { metrics: builtMetrics } : {}),
      }, { includeAuth: true })
      onSuccess()
      onClose()
    } catch {
      setError(t("models.edit.error"))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="dialog">
      <div className="page-content box dialog-content">
        <button onClick={onClose} className="dialog-close">
          <FontAwesomeIcon icon={faXmark} />
        </button>

        <h3>{t("models.edit.title")}</h3>

        {error && <div className="status-banner error">{error}</div>}

        <form onSubmit={handleSubmit}>

          {/* ── Section 1: Identity ── */}
          <div className="form-section">
            <span className="form-section-title">{t("models.edit.section.identity")}</span>

            <label>
              {t("models.upload.name")}
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
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

          <button type="submit" disabled={name.trim() === "" || saving}>
            {saving ? t("models.uploading") : t("models.edit.save")}
          </button>
        </form>
      </div>
    </div>
  )
}
