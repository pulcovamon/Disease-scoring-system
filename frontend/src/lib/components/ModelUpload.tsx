import { useState } from "react"
import { faXmark } from "@fortawesome/free-solid-svg-icons"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import FileUploader from "./FileUploader"
import { Model } from "../classes/model"

type ModelUploadProps = {
  model: File | null
  uploadModel: (file: File) => void
  removeModel: () => void
  setSendDialogOpen: (open: boolean) => void
  send: (modelToSend: Model, modelFile: File, encoderFile?: File, imageFile?: File) => void
}

export default function ModelUpload({
  model,
  uploadModel,
  removeModel,
  setSendDialogOpen,
  send
}: ModelUploadProps) {
  const [modelName, setModelName] = useState("")
  const [disease, setDisease] = useState("")
  const [description, setDescription] = useState("")
  const [isPublic, setIsPublic] = useState(false)

  const [image, setImage] = useState<File | null>(null)
  const [encoder, setEncoder] = useState<File | null>(null)

  return (
    <div className="dialog">
      <div className="page-content box dialog-content">
        <button onClick={() => setSendDialogOpen(false)} className="dialog-close">
          <FontAwesomeIcon icon={faXmark} />
        </button>

        <h3>Upload new model</h3>

        <form>
          <label>
            Model name*:
            <input
              type="text"
              required
              value={modelName}
              onChange={(e) => setModelName(e.target.value)}
            />
          </label>

          <label>
            Disease*:
            <input
              type="text"
              required
              value={disease}
              onChange={(e) => setDisease(e.target.value)}
            />
          </label>

          <label>
            Description:
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </label>

          <label>
            Public model:
            <input
              type="checkbox"
              checked={isPublic}
              onChange={(e) => setIsPublic(e.target.checked)}
            />
          </label>

          <label>
            Model file (.pkl)*:
            <FileUploader onFileSelect={uploadModel} unallowed={false} accept=".pkl" />
            {model && (
              <span className="uploaded-model">
                {model.name}
                <button type="button" onClick={removeModel}>
                  <FontAwesomeIcon icon={faXmark} />
                </button>
              </span>
            )}
          </label>

          <label>
            Optional image (.jpg, .jpeg, .png, .webp):
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
            Optional encoder (.pkl):
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
            onClick={(e) => {
                e.preventDefault();
              
                if (!model) return;
              
                const modelToSend: Model = {
                  _id: null,
                  user: null,
                  path: null,
                  name: modelName.trim(),
                  disease: disease.trim(),
                  description: description.trim() || null,
                  image: null,
                  is_public: isPublic
                };
              
                send(modelToSend, model, encoder || undefined, image || undefined);
                setSendDialogOpen(false);
              }}
              
            disabled={!model || modelName.trim() === "" || disease.trim() === ""}
          >
            Send
          </button>
        </form>
      </div>
    </div>
  )
}
