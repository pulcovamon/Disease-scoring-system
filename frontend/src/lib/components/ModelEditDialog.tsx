import { useState } from "react"
import { faXmark } from "@fortawesome/free-solid-svg-icons"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { Model } from "../classes/model"
import { patchMethod } from "../classes/api"
import { useTranslations } from "../i18n/useTranslations"

type ModelEditDialogProps = {
  model: Model
  onClose: () => void
  onSuccess: () => void
}

export default function ModelEditDialog({ model, onClose, onSuccess }: ModelEditDialogProps) {
  const { t } = useTranslations()
  const [name, setName] = useState(model.name)
  const [description, setDescription] = useState(model.description ?? "")
  const [isPublic, setIsPublic] = useState(model.is_public)
  const [algorithm, setAlgorithm] = useState(model.algorithm ?? "")
  const [accuracy, setAccuracy] = useState(model.accuracy !== null && model.accuracy !== undefined ? String(model.accuracy) : "")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (name.trim() === "") return
    setSaving(true)
    setError(null)
    try {
      await patchMethod(`/model/${model._id}`, {
        name: name.trim(),
        description: description.trim() || null,
        is_public: isPublic,
        algorithm: algorithm.trim() || null,
        accuracy: accuracy !== "" ? parseFloat(accuracy) : null,
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
          <label>
            {t("models.upload.name")}
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </label>

          <label>
            {t("models.upload.description")}
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </label>

          <label>
            {t("models.upload.algorithm")}
            <input
              type="text"
              value={algorithm}
              onChange={(e) => setAlgorithm(e.target.value)}
            />
          </label>

          <label>
            {t("models.upload.accuracy")}
            <input
              type="number"
              min="0"
              max="1"
              step="0.01"
              value={accuracy}
              onChange={(e) => setAccuracy(e.target.value)}
            />
          </label>

          <label>
            {t("models.upload.public")}
            <input
              type="checkbox"
              checked={isPublic}
              onChange={(e) => setIsPublic(e.target.checked)}
            />
          </label>

          <button type="submit" disabled={name.trim() === "" || saving}>
            {saving ? t("models.uploading") : t("models.edit.save")}
          </button>
        </form>
      </div>
    </div>
  )
}
