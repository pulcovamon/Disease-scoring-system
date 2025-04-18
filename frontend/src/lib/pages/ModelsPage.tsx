import { useState } from "react";
import "./modelsPage.css";
import ModelUpload from "../components/ModelUpload";
import { Model } from "../classes/model";
import ModelList from "../components/ModelList";
import { useAuthGuard } from "../hooks/useAuthGuard";

export default function ModelsPage() {
  const isReady = useAuthGuard();

  const [model, setModel] = useState<File | null>(null);
  const [sendDialogOpen, setSendDialogOpen] = useState<boolean>(false);

  function sendModel(modelToSend: Model, modelFile: File, encoderFile?: File, imageFile?: File) {}

  if (!isReady) return <div>Checking authentication...</div>;

  return (
    <div className="models-page">
      <button className="open-send-dialog" onClick={() => setSendDialogOpen(true)}>New model</button>
      {sendDialogOpen && (
        <ModelUpload
          model={model}
          uploadModel={setModel}
          removeModel={() => setModel(null)}
          setSendDialogOpen={setSendDialogOpen}
          send={sendModel}
        />
      )}
      <ModelList />
    </div>
  );
}
