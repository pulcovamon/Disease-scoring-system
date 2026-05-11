import { useState } from "react"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faChevronUp, faChevronDown } from "@fortawesome/free-solid-svg-icons"
import { useTranslations } from "../i18n/useTranslations"
import { BulkPrediction, ModelInfo } from "../classes/result"
import ModelInfoCard from "./ModelInfoCard"

type RiskLevel = "very-high" | "high" | "moderate" | "low" | "very-low"
type FilterType = "all" | RiskLevel
type SortBy = "probability" | "id"

const CHART_MAX = 60

function getRisk(p: number): RiskLevel {
  if (p > 0.8) return "very-high"
  if (p > 0.6) return "high"
  if (p > 0.4) return "moderate"
  if (p > 0.2) return "low"
  return "very-low"
}

export default function BulkResultView({
  predictions,
  disease,
  modelInfo,
}: {
  predictions: BulkPrediction[]
  disease: string | null
  modelInfo: ModelInfo | null
}) {
  const { t } = useTranslations()
  const [selected, setSelected] = useState<string | null>(null)
  const [filter, setFilter] = useState<FilterType>("all")
  const [sortBy, setSortBy] = useState<SortBy>("probability")
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc")

  const sortedByProb = [...predictions].sort((a, b) => b.prediction - a.prediction)
  const chartItems = sortedByProb.slice(0, CHART_MAX)

  const veryHigh = predictions.filter(p => p.prediction > 0.8).length
  const high     = predictions.filter(p => p.prediction > 0.6 && p.prediction <= 0.8).length
  const moderate = predictions.filter(p => p.prediction > 0.4 && p.prediction <= 0.6).length
  const low      = predictions.filter(p => p.prediction > 0.2 && p.prediction <= 0.4).length
  const veryLow  = predictions.filter(p => p.prediction <= 0.2).length
  const avg = predictions.length
    ? predictions.reduce((s, p) => s + p.prediction, 0) / predictions.length
    : 0

  const selectedEntry = selected !== null
    ? predictions.find(p => String(p.id) === selected) ?? null
    : null

  const tableData = [...predictions]
    .filter(p => filter === "all" || getRisk(p.prediction) === filter)
    .sort((a, b) => {
      const mul = sortDir === "desc" ? -1 : 1
      if (sortBy === "probability") return mul * (a.prediction - b.prediction)
      const aNum = Number(a.id), bNum = Number(b.id)
      if (!isNaN(aNum) && !isNaN(bNum)) return mul * (aNum - bNum)
      return mul * String(a.id).localeCompare(String(b.id))
    })

  const toggleSort = (col: SortBy) => {
    if (sortBy === col) setSortDir(d => d === "desc" ? "asc" : "desc")
    else { setSortBy(col); setSortDir("desc") }
  }

  const riskLabel = (r: RiskLevel) => {
    if (r === "very-high") return t("result.bulk.risk.very-high")
    if (r === "high")      return t("result.bulk.risk.high")
    if (r === "moderate")  return t("result.bulk.risk.moderate")
    if (r === "low")       return t("result.bulk.risk.low")
    return t("result.bulk.risk.very-low")
  }

  const SortIcon = ({ col }: { col: SortBy }) => {
    if (sortBy !== col) return null
    return <FontAwesomeIcon icon={sortDir === "desc" ? faChevronDown : faChevronUp} style={{ marginLeft: 4, fontSize: "0.7rem" }} />
  }

  return (
    <div className="bulk-view">

      {/* ── Model info card ── */}
      {modelInfo && <ModelInfoCard modelInfo={modelInfo} disease={disease} />}

      {/* ── Summary strip ── */}
      <div className="bulk-summary">
        <div className="bulk-stat">
          <div className="bulk-stat-label">{t("result.bulk.total")}</div>
          <div className="bulk-stat-value">{predictions.length}</div>
        </div>
        <div className="bulk-stat">
          <div className="bulk-stat-label">{t("result.bulk.risk.very-high")}</div>
          <div className="bulk-stat-value very-high">{veryHigh}</div>
        </div>
        <div className="bulk-stat">
          <div className="bulk-stat-label">{t("result.bulk.risk.high")}</div>
          <div className="bulk-stat-value high">{high}</div>
        </div>
        <div className="bulk-stat">
          <div className="bulk-stat-label">{t("result.bulk.risk.moderate")}</div>
          <div className="bulk-stat-value moderate">{moderate}</div>
        </div>
        <div className="bulk-stat">
          <div className="bulk-stat-label">{t("result.bulk.risk.low")}</div>
          <div className="bulk-stat-value low">{low}</div>
        </div>
        <div className="bulk-stat">
          <div className="bulk-stat-label">{t("result.bulk.risk.very-low")}</div>
          <div className="bulk-stat-value very-low">{veryLow}</div>
        </div>
        <div className="bulk-stat">
          <div className="bulk-stat-label">{t("result.bulk.avg")}</div>
          <div className="bulk-stat-value">{(avg * 100).toFixed(1)}%</div>
        </div>
      </div>

      {/* ── Bar chart ── */}
      <div className="bulk-chart-section">
        <h4 style={{ margin: "0 0 2px" }}>{t("result.bulk.chart.title")}</h4>
        <p className="muted" style={{ margin: "0 0 12px", fontSize: "0.8rem" }}>
          {disease ? t("result.bulk.chart.hint").replace("{disease}", disease) : t("result.bulk.chart.hint.plain")}
        </p>
        <div className="bulk-chart-wrapper">
          <div className="bulk-threshold-line" />
          <span className="bulk-threshold-label">50%</span>
          <div className="bulk-chart-bars">
            {chartItems.map(p => {
              const sid = String(p.id)
              const risk = getRisk(p.prediction)
              return (
                <div
                  key={sid}
                  className={`bulk-bar-col${selected === sid ? " selected-col" : ""}`}
                  onClick={() => setSelected(selected === sid ? null : sid)}
                  title={`${sid}: ${(p.prediction * 100).toFixed(1)}%`}
                >
                  <div
                    className={`bulk-bar risk-${risk}`}
                    style={{ height: `${Math.max(p.prediction * 100, 2)}%` }}
                  />
                </div>
              )
            })}
          </div>
        </div>
        {predictions.length > CHART_MAX && (
          <p className="bulk-chart-note">
            {t("result.bulk.chart.note")
              .replace("{max}", String(CHART_MAX))
              .replace("{total}", String(predictions.length))}
          </p>
        )}
      </div>

      {/* ── Selected patient detail ── */}
      {selectedEntry ? (
        <div className="bulk-selected">
          <div className="bulk-selected-info">
            <div className="bulk-selected-label">
              {t("result.bulk.selected.patient")} <strong>{selectedEntry.id}</strong>
            </div>
            <div className="bulk-selected-prob">{(selectedEntry.prediction * 100).toFixed(1)}%</div>
            <span className={`risk-badge risk-${getRisk(selectedEntry.prediction)}`}>
              {riskLabel(getRisk(selectedEntry.prediction))}
            </span>
          </div>

          {selectedEntry.codes && selectedEntry.codes.length > 0 && (
            <div className="bulk-selected-codes">
              <p className="bulk-codes-label">
                {t("result.bulk.selected.codes")}
                <span className="bulk-codes-count">({selectedEntry.codes.length})</span>
              </p>
              <div className="bulk-codes-list">
                {selectedEntry.codes.map((code, i) => (
                  <span key={i} className="bulk-code-chip">{code}</span>
                ))}
              </div>
            </div>
          )}

          <button
            className="bulk-deselect-btn"
            onClick={() => setSelected(null)}
            title={t("result.bulk.selected.dismiss")}
          >
            ✕
          </button>
        </div>
      ) : (
        <div className="bulk-selected-placeholder">
          {t("result.bulk.selected.prompt")}
        </div>
      )}

      {/* ── Table ── */}
      <div className="bulk-table-section">
        <div className="bulk-filter-row">
          {(["all", "very-high", "high", "moderate", "low", "very-low"] as FilterType[]).map(f => {
            const count = f === "very-high" ? veryHigh : f === "high" ? high : f === "moderate" ? moderate : f === "low" ? low : f === "very-low" ? veryLow : null
            return (
              <button
                key={f}
                className={`bulk-filter-btn${filter === f ? " active" : ""}`}
                onClick={() => setFilter(f)}
              >
                {f === "all" ? t("result.bulk.filter.all") : riskLabel(f as RiskLevel)}
                {count !== null && (
                  <span style={{ marginLeft: 5, opacity: 0.65, fontSize: "0.8em" }}>({count})</span>
                )}
              </button>
            )
          })}
        </div>
        <table className="bulk-table">
          <thead>
            <tr>
              <th onClick={() => toggleSort("id")}>
                {t("result.bulk.table.id")} <SortIcon col="id" />
              </th>
              <th onClick={() => toggleSort("probability")}>
                {t("result.bulk.table.probability")} <SortIcon col="probability" />
              </th>
              <th>{t("result.bulk.table.risk")}</th>
            </tr>
          </thead>
          <tbody>
            {tableData.map(p => {
              const sid = String(p.id)
              const risk = getRisk(p.prediction)
              return (
                <tr
                  key={sid}
                  className={selected === sid ? "selected-row" : ""}
                  onClick={() => setSelected(selected === sid ? null : sid)}
                >
                  <td>{p.id}</td>
                  <td>
                    <span className="prob-bar-container">
                      <span className={`prob-bar risk-${risk}`} style={{ width: `${p.prediction * 100}%` }} />
                    </span>
                    {(p.prediction * 100).toFixed(1)}%
                  </td>
                  <td>
                    <span className={`risk-badge risk-${risk}`}>{riskLabel(risk)}</span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
