import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faPen, faTrash } from "@fortawesome/free-solid-svg-icons"
import { Model } from "../classes/model"
import { UserProfile } from "../store/auth"
import { useTranslations } from "../i18n/useTranslations"

type ModelCardProps = {
  model: Model
  currentUser: UserProfile | null
  onEdit: (model: Model) => void
  onDelete: (model: Model) => void
}

function canModify(model: Model, user: UserProfile | null): boolean {
  if (!user) return false
  if (user.role === "admin") return true
  return model.user === user.id
}

export default function ModelCard({ model, currentUser, onEdit, onDelete }: ModelCardProps) {
  const { t } = useTranslations()
  const modifiable = canModify(model, currentUser)

  return (
    <div className="model-card">
      {model.image && <img src={model.image} alt={model.name} />}
      <div>
        <div className="model-foot" style={{ justifyContent: "space-between" }}>
          <h3>{model.name}</h3>
          <span className="chip subtle">
            {model.is_public ? t("history.visibility.public") : t("history.visibility.private")}
          </span>
        </div>
        {model.summary && <p className="description" style={{ fontWeight: 600, marginBottom: "2px" }}>{model.summary}</p>}
        <p className="description" style={{ fontSize: "0.78rem", opacity: 0.75 }}>
          {model.description || (!model.summary && t("models.card.noDescription"))}
        </p>
      </div>
      <div className="model-foot">
        <span className="chip">{t(`disease.${model.disease}.name`, model.disease)}</span>
        {model.model_type && (
          <span className="chip subtle" title={t(`model.type.${model.model_type}.paradigm`, "")}>
            {t(`model.type.${model.model_type}`, model.model_type)}
          </span>
        )}
        {!model.model_type && model.algorithm && <span className="chip subtle">{model.algorithm}</span>}
        {model.accuracy !== null && model.accuracy !== undefined && (
          <span className="chip subtle">{Math.round(model.accuracy * 100)}%</span>
        )}
      </div>
      {model.metrics && (
        <div className="model-metrics">
          <span>{t("models.metrics.roc_auc")}: <strong>{(model.metrics.roc_auc * 100).toFixed(1)}%</strong></span>
          <span>{t("models.metrics.recall")}: <strong>{(model.metrics.recall * 100).toFixed(1)}%</strong></span>
          <span>{t("models.metrics.f1")}: <strong>{(model.metrics.f1 * 100).toFixed(1)}%</strong></span>
        </div>
      )}
      {model.user && (
        <p className="subtle" style={{ margin: 0, fontSize: "0.8rem" }}>
          {t("models.card.owner")}: {model.user}
        </p>
      )}
      {modifiable && (
        <div className="model-foot" style={{ justifyContent: "flex-end", gap: "8px" }}>
          <button
            type="button"
            className="btn-icon btn"
            onClick={() => onEdit(model)}
            title={t("models.card.edit")}
          >
            <FontAwesomeIcon icon={faPen} />
          </button>
          <button
            type="button"
            className="btn-icon btn"
            onClick={() => onDelete(model)}
            title={t("models.card.delete")}
            style={{ color: "#ef4444" }}
          >
            <FontAwesomeIcon icon={faTrash} />
          </button>
        </div>
      )}
    </div>
  )
}
