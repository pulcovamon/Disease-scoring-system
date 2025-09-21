import { useEffect, useState } from "react";
import { getMethod } from "../classes/api";
import { Model } from "../classes/model";

export default function ModelList() {
  const [models, setModels] = useState<Model[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMethod<Model[]>("/model", { include_user: true })
      .then(setModels)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div>Loading models...</div>;

  return (
    <div className="model-list">
      {models.map((model) => (
        <div className="model-card" key={model._id}>
          {model.image && <img src={model.image} alt={model.name} className="model-thumbnail" />}
          <h3>{model.name}</h3>
          <p>{model.description || "No description"}</p>
          <p><strong>Disease:</strong> {model.disease}</p>
        </div>
      ))}
    </div>
  );
}
