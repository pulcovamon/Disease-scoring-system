import React, { useState, useEffect, useMemo } from "react";
import { Results } from "../classes/result";
import LoadingSpinner from "../components/LoadingSpinner";
import { Link, useSearchParams } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faShareFromSquare,
  faXmark,
  faRotateRight,
  faTriangleExclamation,
  faCheckCircle,
  faClock,
  faArrowUpRightFromSquare,
} from "@fortawesome/free-solid-svg-icons";

export default function History() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchParams] = useSearchParams();
  const [taskId, setTaskId] = useState<string|null>(searchParams.get("id"));
  const [rerunId, setRerunId] = useState<string | null>(null);
  const [rerunMessage, setRerunMessage] = useState<string | null>(null);

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const results = new Results();
        await results.getAllResults();

        if (results.message) {
          setError(results.message);
        } else {
          setTasks(results.tasks);
        }
      } catch (err) {
        console.error(err);
        setError("An error occurred while fetching results.");
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, []);

  return (
    <div className="page-body">
      {loading ? (
        <LoadingSpinner />
      ) : error ? (
        <div className="box">
          <p className="text-[var(--text-color)] font-semibold">{error}</p>
        </div>
      ) : tasks.length === 0 ? (
        <div className="box">
          <p className="text-[var(--text-muted)]">No tasks found.</p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <h2 className="text-2xl font-bold text-[var(--text-color)]">Prediction History</h2>
              <p className="text-[var(--text-muted)]">Recent tasks with status, result and quick actions.</p>
            </div>
            {rerunMessage && (
              <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-[var(--bg-surface-muted)] border border-[var(--border-muted)] text-[var(--text-color)]">
                <FontAwesomeIcon icon={faRotateRight} />
                <span>{rerunMessage}</span>
                <button
                  className="ml-auto text-[var(--text-muted)] hover:text-[var(--text-color)]"
                  onClick={() => setRerunMessage(null)}
                  aria-label="Close rerun message"
                >
                  <FontAwesomeIcon icon={faXmark} />
                </button>
              </div>
            )}
          </div>

          {taskId && (
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-[var(--primary)]/10 border border-[var(--primary)] text-[var(--text-color)]">
              <span>
                You just sent task <b>{taskId}</b>. It is processing—refresh to check status.
              </span>
              <button
                onClick={() => setTaskId(null)}
                className="ml-auto text-[var(--text-muted)] hover:text-[var(--text-color)]"
                aria-label="Dismiss banner"
              >
                <FontAwesomeIcon icon={faXmark} />
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {tasks.map((task) => (
              <HistoryCard
                key={task.task_id}
                task={task}
                highlight={taskId === task.task_id}
                onRerun={() => setRerunMessage(`Task ${task.task_id} rerun requested (mock action).`)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function HistoryCard({
  task,
  highlight,
  onRerun,
}: {
  task: any;
  highlight: boolean;
  onRerun: () => void;
}) {
  const isSuccess = task.status === "SUCCESS";
  const isFail = task.status === "FAILURE";
  const isRunning = !isSuccess && !isFail;

  const statusChip = useMemo(() => {
    if (isSuccess) {
      return (
        <span className="flex items-center gap-2 px-3 py-1 rounded-full text-sm font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-100">
          <FontAwesomeIcon icon={faCheckCircle} /> Success
        </span>
      );
    }
    if (isFail) {
      return (
        <span className="flex items-center gap-2 px-3 py-1 rounded-full text-sm font-semibold bg-red-600 text-white dark:bg-red-500 dark:text-white">
          <FontAwesomeIcon icon={faTriangleExclamation} /> Failed
        </span>
      );
    }
    return (
      <span className="flex items-center gap-2 px-3 py-1 rounded-full text-sm font-semibold bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-100">
        <FontAwesomeIcon icon={faClock} /> In progress
      </span>
    );
  }, [isFail, isRunning, isSuccess]);

  return (
    <div
      className={`relative rounded-2xl border bg-[var(--bg-surface)] p-4 flex flex-col gap-3 shadow-sm transition ${
        highlight ? "border-[var(--primary)] ring-2 ring-[var(--primary)]" : "border-[var(--border-muted)]"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-1">
          <p className="text-xs uppercase tracking-wide text-[var(--text-muted)]">Task ID</p>
          <p className="text-base font-semibold text-[var(--text-color)] break-all">{task.task_id}</p>
          <p className="text-sm text-[var(--text-muted)]">Disease: {task.disease || "N/A"}</p>
        </div>
        {statusChip}
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-xl border border-[var(--border-muted)] bg-[var(--bg-surface-muted)] p-3">
          <p className="text-[var(--text-muted)] text-xs">Result</p>
          <p className="text-[var(--text-color)] font-semibold">
            {isSuccess && task.result != null
              ? `${(task.result * 100).toFixed(1)} %`
              : isFail
              ? "Error"
              : "Processing"}
          </p>
        </div>
        <div className="rounded-xl border border-[var(--border-muted)] bg-[var(--bg-surface-muted)] p-3">
          <p className="text-[var(--text-muted)] text-xs">Created</p>
          <p className="text-[var(--text-color)] font-semibold">
            {task.created_at ? new Date(task.created_at).toLocaleString() : "N/A"}
          </p>
        </div>
      </div>

      {isFail && (
        <div className="rounded-xl border border-[var(--border-muted)] bg-red-50 dark:bg-red-900/30 p-3 text-sm text-[var(--text-color)]">
          <p className="text-[var(--text-muted)] text-xs mb-1">Failure reason</p>
          <p>{task.error || "No details provided."}</p>
        </div>
      )}

      <div className="flex items-center gap-2 justify-end pt-2 border-t border-[var(--border-muted)]">
        <Link
          to={`/result/${task.task_id}`}
          target="_blank"
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--bg-surface-muted)] text-[var(--text-color)] hover:bg-[var(--border-muted)] transition text-sm font-semibold"
        >
          <FontAwesomeIcon icon={faArrowUpRightFromSquare} />
          Detail
        </Link>
        {isFail && (
          <button
            onClick={onRerun}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)] transition text-sm font-semibold shadow"
          >
            <FontAwesomeIcon icon={faRotateRight} />
            Rerun
          </button>
        )}
        {isRunning && (
          <button
            onClick={onRerun}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)] transition text-sm font-semibold shadow"
          >
            Refresh
          </button>
        )}
      </div>
    </div>
  );
}
