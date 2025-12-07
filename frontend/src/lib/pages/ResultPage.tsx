import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import { Results } from "../classes/result";
import LoadingSpinner from "../components/LoadingSpinner";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faArrowUpRightFromSquare,
  faCheckCircle,
  faCircleNotch,
  faTriangleExclamation,
  faRotateRight,
} from "@fortawesome/free-solid-svg-icons";

type Task = {
  status: string;
  result: number | null;
  task_id: string;
  disease: string | null;
  error?: string | null;
  created_at?: string | null;
};

export default function ResultPage() {
  const { id } = useParams<{ id: string }>();
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const fetchTask = useCallback(async () => {
    if (!id) {
      setError("Invalid task ID.");
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
        setError("Task not found.");
      } else {
        setError("An error occurred while fetching the result.");
      }
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchTask();
  }, [fetchTask]);

  const isSuccess = task?.status === "SUCCESS";
  const isFail = task?.status === "FAILURE";
  const isProcessing = !isSuccess && !isFail;

  const statusChip = useMemo(() => {
    if (isSuccess) {
      return (
        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-100">
          <FontAwesomeIcon icon={faCheckCircle} />
          Success
        </span>
      );
    }
    if (isFail) {
      return (
        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-semibold bg-red-600 text-white dark:bg-red-500">
          <FontAwesomeIcon icon={faTriangleExclamation} />
          Failed
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-semibold bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-100">
        <FontAwesomeIcon icon={faCircleNotch} className="animate-spin" />
        Processing
      </span>
    );
  }, [isFail, isSuccess]);

  const probabilityText =
    isSuccess && task?.result != null ? `${(task.result * 100).toFixed(1)} %` : "—";

  const handleRerun = () => {
    setInfo("Rerun requested (mock action).");
  };

  return (
    <div className="page-body">
      <div className="flex items-center gap-3 mb-4">
        <Link
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--bg-surface-muted)] text-[var(--text-color)] hover:bg-[var(--border-muted)] transition"
          to="/result"
        >
          <FontAwesomeIcon icon={faArrowLeft} />
          Back to history
        </Link>
        {id && (
          <span className="text-[var(--text-muted)] text-sm">Task ID: {id}</span>
        )}
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : error ? (
        <div className="box">
          <p className="text-[var(--text-color)] font-semibold">{error}</p>
        </div>
      ) : !task ? (
        <div className="box">
          <p className="text-[var(--text-muted)]">No result found.</p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <h2 className="text-2xl font-bold text-[var(--text-color)]">
                {task.disease ? `${task.disease} prediction` : "Prediction result"}
              </h2>
              <p className="text-[var(--text-muted)]">
                Status, probability and quick actions for this prediction.
              </p>
            </div>
            {statusChip}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="relative rounded-2xl border border-[var(--border-muted)] bg-[var(--bg-surface)] p-6 overflow-hidden">
              <div className="absolute inset-0 pointer-events-none bg-gradient-to-br from-[var(--primary)]/10 via-transparent to-[var(--secondary)]/10" />
              <div className="relative flex flex-col gap-4">
                <p className="text-sm uppercase tracking-wide text-[var(--text-muted)]">Probability</p>
                <div className="text-4xl font-bold text-[var(--text-color)]">{probabilityText}</div>
                <p className="text-sm text-[var(--text-muted)]">
                  Probability of {task.disease || "the disease"} presence based on the selected model.
                  Results are stored for 24 hours.
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-[var(--border-muted)] bg-[var(--bg-surface)] p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <InfoCell label="Status" value={task.status} />
                <InfoCell
                  label="Created"
                  value={task.created_at ? new Date(task.created_at).toLocaleString() : "N/A"}
                />
                <InfoCell label="Task ID" value={task.task_id} />
                <InfoCell label="Disease" value={task.disease || "N/A"} />
              </div>
              {isFail && (
                <div className="rounded-xl border border-[var(--border-muted)] bg-red-50 dark:bg-red-900/20 p-3">
                  <p className="text-xs text-[var(--text-muted)] mb-1">Failure reason</p>
                  <p className="text-[var(--text-color)] text-sm">
                    {task.error || "An error occurred during computation."}
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              to="/score"
              className="flex items-center gap-2 px-4 py-3 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-muted)] text-[var(--text-color)] hover:border-[var(--primary)] transition"
            >
              <FontAwesomeIcon icon={faArrowUpRightFromSquare} />
              New prediction
            </Link>
            {isFail && (
              <button
                onClick={handleRerun}
                className="flex items-center gap-2 px-4 py-3 rounded-xl bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)] transition shadow"
              >
                <FontAwesomeIcon icon={faRotateRight} />
                Rerun
              </button>
            )}
            {isProcessing && (
              <button
                onClick={fetchTask}
                className="flex items-center gap-2 px-4 py-3 rounded-xl bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)] transition shadow"
              >
                <FontAwesomeIcon icon={faRotateRight} className="animate-spin" />
                Refresh status
              </button>
            )}
            {info && <span className="text-sm text-[var(--text-muted)]">{info}</span>}
          </div>
        </div>
      )}
    </div>
  );
}

function InfoCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[var(--border-muted)] bg-[var(--bg-surface-muted)] p-3">
      <p className="text-xs text-[var(--text-muted)] mb-1">{label}</p>
      <p className="text-[var(--text-color)] font-semibold break-words text-sm">{value}</p>
    </div>
  );
}
