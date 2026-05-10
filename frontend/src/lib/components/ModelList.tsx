import { useEffect, useState } from "react";
import { getMethod, deleteMethod } from "../classes/api";
import { Model } from "../classes/model";
import LoadingSpinner from "./LoadingSpinner";
import ModelCard from "./ModelCard";
import ModelEditDialog from "./ModelEditDialog";
import { useAuth } from "../store/auth";
import { useTranslations } from "../i18n/useTranslations";

type ModelListProps = {
  filters?: { include_user?: boolean; include_public?: boolean; include_default?: boolean };
  refreshKey?: number;
  onRefresh: () => void;
};

export default function ModelList({ filters = { include_user: true }, refreshKey = 0, onRefresh }: ModelListProps) {
  const { t } = useTranslations();
  const { user } = useAuth();
  const [models, setModels] = useState<Model[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingModel, setEditingModel] = useState<Model | null>(null);
  const [deletingModel, setDeletingModel] = useState<Model | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [ownerNames, setOwnerNames] = useState<Record<string, string>>({});

  const resolveOwnerName = (userId: string | null): string | undefined => {
    if (!userId) return undefined;
    if (userId === "default") return t("form.cards.model.builtin", "Built-in");
    return ownerNames[userId] ?? undefined;
  };

  useEffect(() => {
    setLoading(true);
    setError(null);

    getMethod<Model[]>("/model", filters)
      .then((data) => {
        setModels(data);
        const ids = Array.from(new Set(data.map((m) => m.user).filter((u) => u && u !== "default"))) as string[];
        if (ids.length) {
          getMethod<{ id: string; first_name: string; last_name: string }[]>("/auth/user", undefined, { handleUnauthorized: false })
            .then((users) => {
              const map: Record<string, string> = {};
              users.forEach((u) => { map[u.id] = `${u.first_name} ${u.last_name}`.trim(); });
              setOwnerNames(map);
            })
            .catch(() => {});
        }
      })
      .catch((err) => {
        console.error(err);
        setError(t("models.list.error"));
      })
      .finally(() => setLoading(false));
  }, [filters.include_user, filters.include_public, filters.include_default, refreshKey]);

  const handleDelete = async (model: Model) => {
    if (!model._id) return;
    setDeleteError(null);
    try {
      await deleteMethod(`/model/${model._id}`, { includeAuth: true });
      setDeletingModel(null);
      onRefresh();
    } catch {
      setDeleteError(t("models.delete.error"));
    }
  };

  if (loading) {
    return (
      <div className="section-card">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) return <div className="section-card status-banner error">{error}</div>;

  if (models.length === 0) {
    return <div className="section-card status-banner info">{t("models.list.empty")}</div>;
  }

  return (
    <>
      {deleteError && <div className="status-banner error">{deleteError}</div>}

      <div className="model-grid">
        {models.map((model) => (
          <ModelCard
            key={model._id || model.name}
            model={model}
            currentUser={user}
            ownerName={resolveOwnerName(model.user)}
            onEdit={setEditingModel}
            onDelete={setDeletingModel}
          />
        ))}
      </div>

      {editingModel && (
        <ModelEditDialog
          model={editingModel}
          onClose={() => setEditingModel(null)}
          onSuccess={onRefresh}
        />
      )}

      {deletingModel && (
        <div className="dialog">
          <div className="box dialog-content" style={{ maxWidth: 420 }}>
            <p style={{ margin: "0 0 16px" }}>
              {t("models.delete.confirm").replace("{name}", deletingModel.name)}
            </p>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setDeletingModel(null)}
              >
                {t("form.button.back")}
              </button>
              <button
                type="button"
                className="btn btn-primary"
                style={{ background: "#ef4444", borderColor: "#ef4444" }}
                onClick={() => handleDelete(deletingModel)}
              >
                {t("models.card.delete")}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
