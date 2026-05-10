import { useState } from "react"
import { faXmark } from "@fortawesome/free-solid-svg-icons"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import FileUploader from "./FileUploader"
import { Model } from "../classes/model"
import { DiseaseType, DiseaseInfo } from "../classes/disease"
import { useTranslations } from "../i18n/useTranslations"

type ModelUploadProps = {
  setSendDialogOpen: (open: boolean) => void
  send: (modelToSend: Model, modelFile: File, encoderFile?: File, imageFile?: File) => Promise<boolean>
  sending: boolean
}

export default function ModelUpload({
  setSendDialogOpen,
  send,
  sending,
}: ModelUploadProps) {
  const { t } = useTranslations()
  const [modelName, setModelName] = useState("")
  const [disease, setDisease] = useState<DiseaseType>(DiseaseType.LungCancer)
  const [description, setDescription] = useState("")
  const [isPublic, setIsPublic] = useState(false)
  const [algorithm, setAlgorithm] = useState("")
  const [accuracy, setAccuracy] = useState("")

  const [modelFile, setModelFile] = useState<File | null>(null)
  const [image, setImage] = useState<File | null>(null)
  const [encoder, setEncoder] = useState<File | null>(null)

  return (
    <div className="dialog">
      <div className="page-content box dialog-content">
        <button onClick={() => setSendDialogOpen(false)} className="dialog-close">
          <FontAwesomeIcon icon={faXmark} />
        </button>

        <h3>{t("models.upload.title")}</h3>

        <form>
          <label>
            {t("models.upload.name")}
            <input
              type="text"
              required
              value={modelName}
              onChange={(e) => setModelName(e.target.value)}
            />
          </label>

          <label>
            {t("models.upload.disease")}
            <select
              value={disease}
              onChange={(e) => setDisease(e.target.value as DiseaseType)}
            >
              {Object.values(DiseaseType).map((d) => (
                <option key={d} value={d}>
                  {DiseaseInfo[d].name}
                </option>
              ))}
            </select>
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
            {t("models.upload.image")}
            <FileUploader
              onFileSelect={setImage}
              unallowed={false}
              accept=".jpg,.jpeg,.png,.webp"
            />
            {image && (
              <span className="uploaded-model">
                {image.name}
                <button type="button" onClick={() => setImage(null)}>
                  <FontAwesomeIcon icon={faXmark} />
                </button>
              </span>
            )}
          </label>

          <label>
            {t("models.upload.encoder")}
            <FileUploader
              onFileSelect={setEncoder}
              unallowed={false}
              accept=".pkl"
            />
            {encoder && (
              <span className="uploaded-model">
                {encoder.name}
                <button type="button" onClick={() => setEncoder(null)}>
                  <FontAwesomeIcon icon={faXmark} />
                </button>
              </span>
            )}
          </label>

          <button
            type="submit"
            onClick={async (e) => {
              e.preventDefault()
              if (!modelFile) return

              const modelToSend: Model = {
                _id: null,
                user: null,
                path: null,
                name: modelName.trim(),
                disease: disease,
                model_type: null,
                recommended: null,
                summary: null,
                description: description.trim() || null,
                image: null,
                is_public: isPublic,
                encoder: null,
                algorithm: algorithm.trim() || null,
                accuracy: accuracy !== "" ? parseFloat(accuracy) : null,
                metrics: null,
              }

              const success = await send(modelToSend, modelFile, encoder || undefined, image || undefined)
              if (success) {
                setSendDialogOpen(false)
              }
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
