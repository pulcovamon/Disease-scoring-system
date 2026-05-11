import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faStar } from "@fortawesome/free-solid-svg-icons"
import { useTranslations } from "../i18n/useTranslations"
import { ModelInfo } from "../classes/result"

const METRIC_KEYS: { key: keyof NonNullable<ModelInfo["metrics"]>; label: string }[] = [
  { key: "roc_auc", label: "models.metrics.roc_auc" },
  { key: "recall",  label: "models.metrics.recall" },
  { key: "f1",      label: "models.metrics.f1" },
]

export default function ModelInfoCard({
  modelInfo,
  disease,
}: {
  modelInfo: ModelInfo
  disease: string | null
}) {
  const { t } = useTranslations()

  const shownMetrics = METRIC_KEYS.filter(({ key }) => {
    const v = modelInfo.metrics?.[key]
    return v != null && !isNaN(v as number)
  })

  return (
    <div className="model-info-card">
      <div className="model-info-main">
        <div className="model-info-identity">
          <div className="model-info-name">
            {modelInfo.name ?? t("result.model.unknown")}
            {modelInfo.recommended && (
              <span className="model-info-recommended" title={t("form.cards.model.recommended")}>
                <FontAwesomeIcon icon={faStar} />
              </span>
            )}
          </div>
          <div className="model-info-chips">
            {modelInfo.model_type && (
              <span className="model-info-chip">
                {t(`model.type.${modelInfo.model_type}`, modelInfo.model_type)}
              </span>
            )}
            {disease && (
              <span className="model-info-chip subtle">
                {t(`disease.${disease}.name`, disease)}
              </span>
            )}
            {modelInfo.algorithm && !modelInfo.model_type && (
              <span className="model-info-chip subtle">{modelInfo.algorithm}</span>
            )}
          </div>
          {modelInfo.summary && (
            <p className="model-info-summary">{modelInfo.summary}</p>
          )}
        </div>

        {shownMetrics.length > 0 && (
          <div className="model-info-metrics">
            {shownMetrics.map(({ key, label }) => (
              <div key={key} className="model-info-metric">
                <span className="model-info-metric-value">
                  {((modelInfo.metrics![key] as number) * 100).toFixed(1)}%
                </span>
                <span className="model-info-metric-label">{t(label)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
