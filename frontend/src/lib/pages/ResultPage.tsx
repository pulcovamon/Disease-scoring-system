import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { Results, BulkPrediction, ModelInfo, PatientInfo } from "../classes/result";
import "./resultPage.css";
import LoadingSpinner from "../components/LoadingSpinner";
import BulkResultView from "../components/BulkResultView";
import SingleResultView from "../components/SingleResultView";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faArrowUpRightFromSquare,
  faCheckCircle,
  faCircleNotch,
  faTriangleExclamation,
  faRotateRight,
  faClock,
  faLink,
} from "@fortawesome/free-solid-svg-icons";
import { useTranslations } from "../i18n/useTranslations";
import { useLanguage } from "../store/language";

type Task = {
  status: string;
  result: number | null;
  result_type: "single" | "bulk" | null;
  predictions: BulkPrediction[] | null;
  task_id: string;
  disease: string | null;
  model_info: ModelInfo | null;
  patient: PatientInfo | null;
  codes: string[] | null;
  error?: string | null;
  created_at?: string | null;
};

export default function ResultPage() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const isGuest = searchParams.get("guest") === "1";
  const { t } = useTranslations();
  const { buildPath } = useLanguage();
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const fetchTask = useCallback(async () => {
    if (!id) {
      setError(t("result.invalid"));
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    setInfo(null);
    const results = new Results();
    try {
      const fetched = await results.getTaskById(id);
      setTask(fetched as Task);
    } catch (err: any) {
      if (err?.response?.status === 404) {
        setError(t("result.notFound"));
      } else {
        setError(t("result.fetchError"));
      }
    } finally {
      setLoading(false);
    }
  }, [id, t]);

  useEffect(() => {
    fetchTask();
  }, [fetchTask]);

  const isSuccess = task?.status === "SUCCESS";
  const isFail = task?.status === "FAILURE";
  const isProcessing = !isSuccess && !isFail;
  const isBulk = isSuccess && task?.result_type === "bulk" && Array.isArray(task?.predictions);

  const statusChip = useMemo(() => {
    if (isSuccess) {
      return (
        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-100">
          <FontAwesomeIcon icon={faCheckCircle} />
          {t("history.status.success")}
        </span>
      );
    }
    if (isFail) {
      return (
        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-semibold bg-red-600 text-white dark:bg-red-500">
          <FontAwesomeIcon icon={faTriangleExclamation} />
          {t("history.status.failed")}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-semibold bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-100">
        <FontAwesomeIcon icon={faCircleNotch} className="animate-spin" />
        {t("result.processing")}
      </span>
    );
  }, [isFail, isSuccess, t]);

  const handleRerun = () => {
    setInfo(t("result.info.rerun"));
  };

  return (
    <div className="page-body p-5">
      <div className="flex items-center gap-3 mb-4">
        <Link
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--bg-surface-muted)] text-[var(--text-color)] hover:bg-[var(--border-muted)] transition"
          to={buildPath("/result")}
        >
          <FontAwesomeIcon icon={faArrowLeft} />
          {t("result.back")}
        </Link>
        {id && (
          <span className="text-[var(--text-muted)] text-sm">
            {t("result.taskId")}: {id}
          </span>
        )}
      </div>

      {isGuest && (
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 rounded-xl border border-amber-300 bg-amber-50 dark:border-amber-700 dark:bg-amber-900/20 px-4 py-3 mb-6 text-sm text-amber-800 dark:text-amber-200">
          <FontAwesomeIcon icon={faClock} className="shrink-0 text-base" />
          <span className="flex-1">
            {t("result.guest.ttlNotice", "This result is accessible via this link for 24 hours. Save or copy the URL now — it will not appear in any history.")}
          </span>
          <button
            onClick={copyLink}
            className="flex text-[var(--text-color)] items-center gap-2 shrink-0 px-3 py-1.5 rounded-lg bg-amber-200 dark:bg-amber-800 hover:bg-amber-300 dark:hover:bg-amber-700 transition font-medium"
          >
            <FontAwesomeIcon icon={faLink} />
            {copied ? t("result.guest.copied", "Copied!") : t("result.guest.copyLink", "Copy link")}
          </button>
        </div>
      )}

      {loading ? (
        <LoadingSpinner />
      ) : error ? (
        <div className="box">
          <p className="text-[var(--text-color)] font-semibold">{error}</p>
        </div>
      ) : !task ? (
        <div className="box">
          <p className="text-[var(--text-muted)]">{t("result.noResult")}</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Header row: title + status chip */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <h2 className="text-2xl font-bold text-[var(--text-color)]">
                {isBulk
                  ? t("result.bulk.title")
                  : task.disease
                    ? t("result.titleWithDisease").replace("{disease}", t(`disease.${task.disease}.name`, task.disease))
                    : t("result.title")}
              </h2>
              <p className="text-[var(--text-muted)]">
                {isBulk ? t("result.bulk.subtitle") : t("result.subtitle")}
              </p>
            </div>
            {statusChip}
          </div>

          {isBulk ? (
            /* ── Bulk result view ── */
            <BulkResultView
              predictions={task.predictions!}
              disease={task.disease}
              modelInfo={task.model_info}
            />
          ) : (
            /* ── Single result view ── */
            <SingleResultView task={task} />
          )}

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-3">
            <Link
              to={buildPath("/score")}
              className="flex items-center gap-2 px-4 py-3 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-muted)] text-[var(--text-color)] hover:border-[var(--primary)] transition"
            >
              <FontAwesomeIcon icon={faArrowUpRightFromSquare} />
              {t("result.newPrediction")}
            </Link>
            {isFail && (
              <button
                onClick={handleRerun}
                className="flex items-center gap-2 px-4 py-3 rounded-xl bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)] transition shadow"
              >
                <FontAwesomeIcon icon={faRotateRight} />
                {t("result.rerun")}
              </button>
            )}
            {isProcessing && (
              <button
                onClick={fetchTask}
                className="flex items-center gap-2 px-4 py-3 rounded-xl bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)] transition shadow"
              >
                <FontAwesomeIcon icon={faRotateRight} className="animate-spin" />
                {t("result.refresh")}
              </button>
            )}
            {info && <span className="text-sm text-[var(--text-muted)]">{info}</span>}
          </div>
        </div>
      )}
    </div>
  );
}

