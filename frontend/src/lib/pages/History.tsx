import React, { useState, useEffect } from "react";
import { Results } from "../classes/result";
import "./history.css";
import LoadingSpinner from "../components/LoadingSpinner";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faShareFromSquare } from "@fortawesome/free-solid-svg-icons";

export default function History() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
    <div className="pagebody">
      {loading ? (
        <LoadingSpinner />
      ) : error ? (
        <div className="page-content box">
          <p className="error">{error}</p>
        </div>
      ) : tasks.length === 0 ? (
        <div className="page-content box">
          <p className="error">No tasks found.</p>
        </div>
      ) : (
        <div className="page-content">
          <table className="catalog-table">
            <thead>
              <tr>
                <th>Task ID</th>
                <th>Disease</th>
                <th>Result</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((task) => (
                <tr key={task.task_id}>
                  <td>{task.task_id}</td>
                  <td>{task.disease || "N/A"}</td>
                  <td>
                    {task.status === "SUCCESS" && task.result != null
                      ? `${(task.result * 100).toFixed(1)} %`
                      : task.status === "FAILURE"
                      ? "An error occurred"
                      : "In progress"}
                  </td>
                  <td>{task.status}</td>
                  <td className="detail-link-box">
                    <Link
                      className="detail-link"
                      to={`/result/${task.task_id}`}
                      target="_blank"
                    >
                      <FontAwesomeIcon icon={faShareFromSquare} />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
