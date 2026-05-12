import React, { useState, useEffect, useMemo } from "react";
import { Results, Task } from "../classes/result";
import LoadingSpinner from "../components/LoadingSpinner";
import { Link, useSearchParams } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faXmark,
  faRotateRight,
  faCheckCircle,
  faClock,
  faTriangleExclamation,
  faArrowUpRightFromSquare,
  faStar,
} from "@fortawesome/free-solid-svg-icons";
import { useTranslations } from "../i18n/useTranslations";
import { useLanguage } from "../store/language";
import "./history.css";

type TabType = "single" | "bulk";
type StatusFilter = "all" | "SUCCESS" | "FAILURE" | "processing";
type SortBy = "newest" | "oldest" | "risk" | "count";
type RiskLevel = "very-high" | "high" | "moderate" | "low" | "very-low";

function getRisk(p: number): RiskLevel {
  if (p > 0.8) return "very-high";
  if (p > 0.6) return "high";
  if (p > 0.4) return "moderate";
  if (p > 0.2) return "low";
  return "very-low";
}

const RISK_COLORS: Record<RiskLevel, string> = {
  "very-high": "#7f1d1d",
  "high":      "#dc2626",
  "moderate":  "#ca8a04",
  "low":       "#65a30d",
  "very-low":  "#16a34a",
};

function StatusChip({ status }: { status: string }) {
  const { t } = useTranslations();
  if (status === "SUCCESS")
    return <span className="hc-status success"><FontAwesomeIcon icon={faCheckCircle} />{t("history.status.success")}</span>;
  if (status === "FAILURE")
    return <span className="hc-status failed"><FontAwesomeIcon icon={faTriangleExclamation} />{t("history.status.failed")}</span>;
  return <span className="hc-status running"><FontAwesomeIcon icon={faClock} />{t("history.status.inProgress")}</span>;
}

function HistoryCard({ task, highlight }: { task: Task; highlight: boolean }) {
  const { t } = useTranslations();
  const { buildPath } = useLanguage();

  const isSuccess = task.status === "SUCCESS";
  const isFail    = task.status === "FAILURE";

  const patientName = [task.patient?.name, task.patient?.surname].filter(Boolean).join(" ")
    || t("history.unknownPatient");
  const diseaseName = task.disease ? t(`disease.${task.disease}.name`, task.disease) : null;
  const risk = isSuccess && task.result !== null ? getRisk(task.result) : null;

  const riskLabel: Record<RiskLevel, string> = {
    "very-high": t("result.bulk.risk.very-high"),
    "high":      t("result.bulk.risk.high"),
    "moderate":  t("result.bulk.risk.moderate"),
    "low":       t("result.bulk.risk.low"),
    "very-low":  t("result.bulk.risk.very-low"),
  };

  return (
    <div className={`hc-card${highlight ? " hc-highlight" : ""}`}>
      <div className="hc-header">
        <div>
          <div className="hc-name">
            {patientName}
            {task.is_example && <span className="hc-example-badge">{t("result.example", "Example")}</span>}
          </div>
          <div className="hc-meta">
            {diseaseName && <span>{diseaseName}</span>}
            {diseaseName && task.model_info?.name && <span className="hc-meta-sep">·</span>}
            {task.model_info?.name && <span>{task.model_info.name}</span>}
            {task.model_info?.recommended && (
              <FontAwesomeIcon icon={faStar} className="hc-recommended" title={t("form.cards.model.recommended")} />
            )}
          </div>
        </div>
        <StatusChip status={task.status} />
      </div>

      <div className="hc-body">
        {isSuccess && task.result !== null ? (
          <div className="hc-prob-row">
            <div className="hc-prob-track">
              <div
                className="hc-prob-fill"
                style={{ width: `${task.result * 100}%`, background: RISK_COLORS[risk!] }}
              />
            </div>
            <span className="hc-prob-pct">{(task.result * 100).toFixed(1)}%</span>
            <span className={`risk-badge risk-${risk}`}>{riskLabel[risk!]}</span>
          </div>
        ) : isFail ? (
          <p className="hc-state-msg">{typeof task.error === "string" ? task.error : t("history.noDetails")}</p>
        ) : (
          <p className="hc-state-msg">{t("history.result.processing")}</p>
        )}
      </div>

      <div className="hc-footer">
        <span className="hc-footer-meta">
          {task.created_at ? new Date(task.created_at).toLocaleString() : task.task_id}
        </span>
        <Link to={buildPath(`/result/${task.task_id}`)} className="hc-detail-link">
          <FontAwesomeIcon icon={faArrowUpRightFromSquare} />
          {t("history.detail")}
        </Link>
      </div>
    </div>
  );
}

function BulkHistoryCard({ task, highlight }: { task: Task; highlight: boolean }) {
  const { t } = useTranslations();
  const { buildPath } = useLanguage();

  const isSuccess = task.status === "SUCCESS";
  const isFail    = task.status === "FAILURE";

  const diseaseName = task.disease ? t(`disease.${task.disease}.name`, task.disease) : null;
  const patientCount = task.predictions?.length ?? 0;

  const dist = useMemo(() => {
    if (!task.predictions || task.predictions.length === 0) return null;
    const veryHigh = task.predictions.filter(p => p.prediction > 0.8).length;
    const high     = task.predictions.filter(p => p.prediction > 0.6 && p.prediction <= 0.8).length;
    const moderate = task.predictions.filter(p => p.prediction > 0.4 && p.prediction <= 0.6).length;
    const low      = task.predictions.filter(p => p.prediction > 0.2 && p.prediction <= 0.4).length;
    const veryLow  = task.predictions.filter(p => p.prediction <= 0.2).length;
    return { veryHigh, high, moderate, low, veryLow };
  }, [task.predictions]);

  return (
    <div className={`hc-card${highlight ? " hc-highlight" : ""}`}>
      <div className="hc-header">
        <div>
          <div className="hc-name">
            {t("history.bulk.title")}
            {patientCount > 0 && (
              <span className="hc-bulk-count"> · {patientCount} {t("history.bulk.patients")}</span>
            )}
          </div>
          <div className="hc-meta">
            {diseaseName && <span>{diseaseName}</span>}
            {diseaseName && task.model_info?.name && <span className="hc-meta-sep">·</span>}
            {task.model_info?.name && <span>{task.model_info.name}</span>}
            {task.model_info?.recommended && (
              <FontAwesomeIcon icon={faStar} className="hc-recommended" title={t("form.cards.model.recommended")} />
            )}
          </div>
        </div>
        <StatusChip status={task.status} />
      </div>

      <div className="hc-body">
        {isSuccess && dist ? (
          <>
            <div className="hc-dist-bar">
              {dist.veryHigh > 0 && <div className="hc-dist-seg" style={{ flex: dist.veryHigh, background: RISK_COLORS["very-high"] }} />}
              {dist.high     > 0 && <div className="hc-dist-seg" style={{ flex: dist.high,     background: RISK_COLORS["high"]      }} />}
              {dist.moderate > 0 && <div className="hc-dist-seg" style={{ flex: dist.moderate, background: RISK_COLORS["moderate"]  }} />}
              {dist.low      > 0 && <div className="hc-dist-seg" style={{ flex: dist.low,      background: RISK_COLORS["low"]       }} />}
              {dist.veryLow  > 0 && <div className="hc-dist-seg" style={{ flex: dist.veryLow,  background: RISK_COLORS["very-low"]  }} />}
            </div>
            <div className="hc-dist-counts">
              {dist.veryHigh > 0 && <span className="hc-dist-count"><strong style={{ color: RISK_COLORS["very-high"] }}>{dist.veryHigh}</strong> {t("result.bulk.risk.very-high")}</span>}
              {dist.high     > 0 && <span className="hc-dist-count"><strong style={{ color: RISK_COLORS["high"]      }}>{dist.high}</strong>     {t("result.bulk.risk.high")}</span>}
              {dist.moderate > 0 && <span className="hc-dist-count"><strong style={{ color: RISK_COLORS["moderate"]  }}>{dist.moderate}</strong> {t("result.bulk.risk.moderate")}</span>}
              {dist.low      > 0 && <span className="hc-dist-count"><strong style={{ color: RISK_COLORS["low"]       }}>{dist.low}</strong>      {t("result.bulk.risk.low")}</span>}
              {dist.veryLow  > 0 && <span className="hc-dist-count"><strong style={{ color: RISK_COLORS["very-low"]  }}>{dist.veryLow}</strong>  {t("result.bulk.risk.very-low")}</span>}
            </div>
          </>
        ) : isFail ? (
          <p className="hc-state-msg">{typeof task.error === "string" ? task.error : t("history.noDetails")}</p>
        ) : (
          <p className="hc-state-msg">{t("history.result.processing")}</p>
        )}
      </div>

      <div className="hc-footer">
        <span className="hc-footer-meta">
          {task.created_at ? new Date(task.created_at).toLocaleString() : task.task_id}
        </span>
        <Link to={buildPath(`/result/${task.task_id}`)} className="hc-detail-link">
          <FontAwesomeIcon icon={faArrowUpRightFromSquare} />
          {t("history.detail")}
        </Link>
      </div>
    </div>
  );
}

export default function History() {
  const { t } = useTranslations();
  const { buildPath } = useLanguage();
  const [searchParams] = useSearchParams();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [taskId, setTaskId] = useState<string | null>(searchParams.get("id"));
  const [rerunMessage, setRerunMessage] = useState<string | null>(null);

  const [tab, setTab]             = useState<TabType>("single");
  const [diseaseFilter, setDiseaseFilter] = useState("all");
  const [statusFilter, setStatusFilter]   = useState<StatusFilter>("all");
  const [sortBy, setSortBy]       = useState<SortBy>("newest");

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const results = new Results();
        await results.getAllResults();
        if (results.message) setError(results.message);
        else setTasks(results.tasks);
      } catch {
        setError(t("history.error"));
      } finally {
        setLoading(false);
      }
    };
    fetchResults();
  }, [t]);

  // Switch sort to valid option when changing tabs
  const handleTabChange = (next: TabType) => {
    setTab(next);
    if (next === "single" && sortBy === "count") setSortBy("newest");
    if (next === "bulk"   && sortBy === "risk")  setSortBy("newest");
  };

  const singleTasks = useMemo(() => tasks.filter(t => t.result_type !== "bulk"), [tasks]);
  const bulkTasks   = useMemo(() => tasks.filter(t => t.result_type === "bulk"), [tasks]);

  const diseases = useMemo(() =>
    [...new Set(tasks.map(t => t.disease).filter((d): d is string => !!d))],
    [tasks]
  );

  const pool = tab === "bulk" ? bulkTasks : singleTasks;

  const filtered = useMemo(() => {
    return pool
      .filter(t => diseaseFilter === "all" || t.disease === diseaseFilter)
      .filter(t => {
        if (statusFilter === "all") return true;
        if (statusFilter === "processing") return t.status !== "SUCCESS" && t.status !== "FAILURE";
        return t.status === statusFilter;
      })
      .sort((a, b) => {
        if (sortBy === "newest" || sortBy === "oldest") {
          const ta = a.created_at ? new Date(a.created_at).getTime() : 0;
          const tb = b.created_at ? new Date(b.created_at).getTime() : 0;
          return sortBy === "newest" ? tb - ta : ta - tb;
        }
        if (sortBy === "risk")  return (b.result ?? -1) - (a.result ?? -1);
        if (sortBy === "count") return (b.predictions?.length ?? 0) - (a.predictions?.length ?? 0);
        return 0;
      });
  }, [pool, diseaseFilter, statusFilter, sortBy]);

  return (
    <div className="page-body p-5">
      {loading ? (
        <LoadingSpinner />
      ) : error ? (
        <div className="box">
          <p className="text-[var(--text-color)] font-semibold">{error}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Page header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <h2 className="text-2xl font-bold text-[var(--text-color)]">{t("history.title")}</h2>
              <p className="text-[var(--text-muted)]">{t("history.subtitle")}</p>
            </div>
            {rerunMessage && (
              <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-[var(--bg-surface-muted)] border border-[var(--border-muted)] text-[var(--text-color)] text-sm">
                <FontAwesomeIcon icon={faRotateRight} />
                <span>{rerunMessage}</span>
                <button className="ml-auto text-[var(--text-muted)] hover:text-[var(--text-color)]" onClick={() => setRerunMessage(null)}>
                  <FontAwesomeIcon icon={faXmark} />
                </button>
              </div>
            )}
          </div>

          {/* Just-sent banner */}
          {taskId && (
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-[var(--primary)]/10 border border-[var(--primary)] text-[var(--text-color)] text-sm">
              <span>{t("history.banner.justSent").replace("{id}", taskId)}</span>
              <button onClick={() => setTaskId(null)} className="ml-auto text-[var(--text-muted)] hover:text-[var(--text-color)]">
                <FontAwesomeIcon icon={faXmark} />
              </button>
            </div>
          )}

          {tasks.length === 0 ? (
            <div className="hist-empty" style={{ flexDirection: "column", gap: "12px", padding: "48px 24px" }}>
              <p style={{ margin: 0 }}>{t("history.empty.none")}</p>
              <Link to={buildPath("/score")} className="primary-button" style={{ display: "inline-flex", alignItems: "center", gap: "6px", textDecoration: "none" }}>
                {t("history.empty.cta")}
              </Link>
            </div>
          ) : (
            <>
              {/* Tabs */}
              <div className="hist-tabs">
                <button className={`rounded-none hist-tab${tab === "single" ? " active" : ""}`} onClick={() => handleTabChange("single")}>
                  {t("history.tab.single")}
                  <span className="hist-tab-count">({singleTasks.length})</span>
                </button>
                <button className={`rounded-none hist-tab${tab === "bulk" ? " active" : ""}`} onClick={() => handleTabChange("bulk")}>
                  {t("history.tab.bulk")}
                  <span className="hist-tab-count">({bulkTasks.length})</span>
                </button>
              </div>

              {/* Filter / sort controls */}
              <div className="hist-controls">
                <select className="hist-select" value={diseaseFilter} onChange={e => setDiseaseFilter(e.target.value)}>
                  <option value="all">{t("history.filter.disease")}</option>
                  {diseases.map(d => (
                    <option key={d} value={d}>{t(`disease.${d}.name`, d)}</option>
                  ))}
                </select>
                <select className="hist-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value as StatusFilter)}>
                  <option value="all">{t("history.filter.status")}</option>
                  <option value="SUCCESS">{t("history.status.success")}</option>
                  <option value="FAILURE">{t("history.status.failed")}</option>
                  <option value="processing">{t("history.status.inProgress")}</option>
                </select>
                <select className="hist-select" value={sortBy} onChange={e => setSortBy(e.target.value as SortBy)}>
                  <option value="newest">{t("history.sort.newest")}</option>
                  <option value="oldest">{t("history.sort.oldest")}</option>
                  {tab === "single" && <option value="risk">{t("history.sort.risk")}</option>}
                  {tab === "bulk"   && <option value="count">{t("history.sort.count")}</option>}
                </select>
                <span className="hist-results-count">{filtered.length} {t("history.sort.results")}</span>
              </div>

              {/* Cards */}
              {filtered.length === 0 ? (
                <div className="hist-empty">{t("history.empty")}</div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {filtered.map(task =>
                    tab === "bulk"
                      ? <BulkHistoryCard key={task.task_id} task={task} highlight={taskId === task.task_id} />
                      : <HistoryCard     key={task.task_id} task={task} highlight={taskId === task.task_id} />
                  )}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
