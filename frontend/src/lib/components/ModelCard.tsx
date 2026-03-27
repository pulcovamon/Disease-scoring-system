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
        <p className="description">{model.description || t("models.card.noDescription")}</p>
      </div>
      <div className="model-foot">
        <span className="chip">{model.disease}</span>
        {model.algorithm && <span className="chip subtle">{model.algorithm}</span>}
        {model.accuracy !== null && model.accuracy !== undefined && (
          <span className="chip subtle">{Math.round(model.accuracy * 100)}%</span>
        )}
      </div>
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
