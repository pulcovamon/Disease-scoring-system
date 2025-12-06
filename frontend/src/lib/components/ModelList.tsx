import { useEffect, useState } from "react";
import { getMethod } from "../classes/api";
import { Model } from "../classes/model";
import LoadingSpinner from "./LoadingSpinner";

type ModelListProps = {
  filters?: { include_user?: boolean; include_public?: boolean; include_default?: boolean };
  refreshKey?: number;
};

export default function ModelList({ filters = { include_user: true }, refreshKey = 0 }: ModelListProps) {
  const [models, setModels] = useState<Model[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    getMethod<Model[]>("/model", filters)
      .then(setModels)
      .catch((err) => {
        console.error(err);
        setError("Failed to load models. Please try again.");
      })
      .finally(() => setLoading(false));
  }, [filters.include_user, filters.include_public, filters.include_default, refreshKey]);

  if (loading) {
    return (
      <div className="section-card">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) return <div className="section-card status-banner error">{error}</div>;

  if (models.length === 0) {
    return <div className="section-card status-banner info">No models match your filters yet.</div>;
  }

  return (
    <div className="model-grid">
      {models.map((model) => (
        <div className="model-card" key={model._id || model.name}>
          {model.image && <img src={model.image} alt={model.name} />}
          <div>
            <div className="model-foot" style={{ justifyContent: "space-between" }}>
              <h3>{model.name}</h3>
              <span className="chip subtle">{model.is_public ? "Public" : "Private"}</span>
            </div>
            <p className="description">{model.description || "No description provided."}</p>
          </div>
          <div className="model-foot">
            <span className="chip">{model.disease}</span>
            {model.user && <span className="chip subtle">Owner: {model.user}</span>}
          </div>
        </div>
      ))}
    </div>
  );
}
