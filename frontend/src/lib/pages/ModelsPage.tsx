import React, { useState } from "react";
import FileUploader from "../components/FileUploader";

export default function ModelsPage() {
  const [models, setModels] = useState<File[]>([]);

  function addModel(file: File) {
    setModels([...models, file]);
  }

  return (
    <div>
      <div>
        <ul>
          {models.map((m) => (
            <li key={m.name}>{m.name}</li>
          ))}
        </ul>
      </div>
      <FileUploader onFileSelect={addModel} unallowed={false} accept=".pkl" />
    </div>
  );
}
