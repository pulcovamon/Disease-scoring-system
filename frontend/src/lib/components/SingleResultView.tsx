import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faCircleNotch, faTriangleExclamation } from "@fortawesome/free-solid-svg-icons"
import { useTranslations } from "../i18n/useTranslations"
import { ModelInfo, PatientInfo } from "../classes/result"
import ModelInfoCard from "./ModelInfoCard"

type RiskLevel = "very-high" | "high" | "moderate" | "low" | "very-low"

function getRisk(p: number): RiskLevel {
  if (p > 0.8) return "very-high"
  if (p > 0.6) return "high"
  if (p > 0.4) return "moderate"
  if (p > 0.2) return "low"
  return "very-low"
}

const RISK_COLORS: Record<RiskLevel, string> = {
  "very-high": "#7f1d1d",
  "high":      "#dc2626",
  "moderate":  "#ca8a04",
  "low":       "#65a30d",
  "very-low":  "#16a34a",
}

const GAUGE_SIZE = 160
const STROKE = 14
const R = (GAUGE_SIZE - STROKE) / 2
const CIRC = 2 * Math.PI * R

function RiskGauge({ probability }: { probability: number }) {
  const risk = getRisk(probability)
  const color = RISK_COLORS[risk]
  const offset = CIRC * (1 - probability)

  return (
    <div className="sr-gauge-wrapper">
      <svg width={GAUGE_SIZE} height={GAUGE_SIZE} style={{ transform: "rotate(-90deg)" }}>
        <circle
          cx={GAUGE_SIZE / 2} cy={GAUGE_SIZE / 2} r={R}
          fill="none" stroke="var(--border-muted)" strokeWidth={STROKE}
        />
        <circle
          cx={GAUGE_SIZE / 2} cy={GAUGE_SIZE / 2} r={R}
          fill="none"
          stroke={color}
          strokeWidth={STROKE}
          strokeLinecap="round"
          strokeDasharray={CIRC}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 0.6s ease" }}
        />
      </svg>
      <div className="sr-gauge-label">
        <span className="sr-gauge-pct">{(probability * 100).toFixed(1)}%</span>
      </div>
    </div>
  )
}

type TaskProps = {
  status: string
  result: number | null
  task_id: string
  disease: string | null
  model_info: ModelInfo | null
  patient: PatientInfo | null
  codes: string[] | null
  is_example?: boolean | null
  error?: string | null
  created_at?: string | null
}

export default function SingleResultView({ task }: { task: TaskProps }) {
  const { t } = useTranslations()

  const isSuccess = task.status === "SUCCESS"
  const isFail = task.status === "FAILURE"
  const probability = isSuccess && task.result !== null ? task.result : null
  const risk = probability !== null ? getRisk(probability) : null

  const patientName = [task.patient?.name, task.patient?.surname]
    .filter(Boolean)
    .join(" ") || null

  const riskLabel = (r: RiskLevel) => ({
    "very-high": t("result.bulk.risk.very-high"),
    "high":      t("result.bulk.risk.high"),
    "moderate":  t("result.bulk.risk.moderate"),
    "low":       t("result.bulk.risk.low"),
    "very-low":  t("result.bulk.risk.very-low"),
  })[r]

  return (
    <div className="sr-layout">
      {task.model_info && <ModelInfoCard modelInfo={task.model_info} disease={task.disease} />}

      <div className={`sr-main${task.codes && task.codes.length > 0 ? "" : " sr-main-single"}`}>
        {/* Result card */}
        <div className="sr-result-card">
          {task.is_example && (
            <span className="sr-example-badge">{t("result.example", "Example")}</span>
          )}
          {patientName && <div className="sr-patient-name">{patientName}</div>}

          {probability !== null ? (
            <>
              <RiskGauge probability={probability} />
              <span className={`risk-badge risk-${risk}`}>
                {riskLabel(risk!)}
              </span>
              {task.disease && (
                <div className="sr-disease">{t(`disease.${task.disease}.name`, task.disease)}</div>
              )}
            </>
          ) : (
            <div className="sr-pending">
              {isFail ? (
                <>
                  <FontAwesomeIcon icon={faTriangleExclamation} className="sr-pending-icon sr-pending-fail" />
                  <p className="sr-pending-label">{t("history.status.failed")}</p>
                  {task.error && <p className="sr-error-msg">{String(task.error)}</p>}
                </>
              ) : (
                <>
                  <FontAwesomeIcon icon={faCircleNotch} className="sr-pending-icon animate-spin" />
                  <p className="sr-pending-label">{t("result.processing")}</p>
                </>
              )}
            </div>
          )}
        </div>

        {/* Code sequence card */}
        {task.codes && task.codes.length > 0 && (
          <div className="sr-codes-card">
            <p className="bulk-codes-label">
              {t("result.bulk.selected.codes")}
              <span className="bulk-codes-count">({task.codes.length})</span>
            </p>
            <div className="bulk-codes-list">
              {task.codes.map((code, i) => (
                <span key={i} className="bulk-code-chip">{code}</span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Muted footer */}
      <div className="sr-footer">
        <span className="sr-footer-task">{t("result.taskId")}: {task.task_id}</span>
        {task.created_at && (
          <>
            <span className="sr-footer-sep">·</span>
            <span>{new Date(task.created_at).toLocaleString()}</span>
          </>
        )}
      </div>
    </div>
  )
}
