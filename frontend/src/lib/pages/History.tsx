import React, { useState, useEffect } from "react";
import { Results } from "../classes/result";
import "./history.css";
import LoadingSpinner from "../components/LoadingSpinner";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faShareFromSquare } from "@fortawesome/free-solid-svg-icons";

export default function History() {
  const [content, setContent]: [JSX.Element, Function] = useState<JSX.Element>(
    <LoadingSpinner />
  );
  const [tasks, setTasks]: [JSX.Element[], Function] = useState<JSX.Element[]>(
    []
  );

  useEffect(() => {
    const results = new Results();
    results
      .getAllResults()
      .then(() => {
        if (results.message != null) {
          setContent(
            <div className="page-content box">
              <p className="error">{results.message}</p>
            </div>
          );
        } else if (results.tasks.length > 0) {
          setTasks(
            results.tasks.map((task) => {
              const taskRow = (
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
              );
              return taskRow;
            })
          );
          setContent(
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
                <tbody>{tasks}</tbody>
              </table>
            </div>
          );
        } else {
          setContent(
            <div className="page-content box">
              <p className="error">No tasks found.</p>
            </div>
          );
        }
      })
      .catch((error) => {
        setContent(
          <div className="page-content box">
            <p className="error">An error occurred.</p>
          </div>
        );
        console.error(error);
      });
  }, [tasks]);

  return <div className="pagebody">
    {content}
    </div>;
}
