import React, { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { Results } from "../classes/result";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowRightToBracket } from "@fortawesome/free-solid-svg-icons";

export default function ResultPage() {
  const { id } = useParams<{ id: string }>();
  console.log(id);
  const [message, setMessage] = useState<JSX.Element>(<p></p>);

  useEffect(() => {
    if (!id) {
      setMessage(<p className="error">Invalid task ID.</p>);
      return;
    }

    const results = new Results();
    results
      .getTaskById(id)
      .then((task) => {
        switch (task.status) {
          case "SUCCESS":
            setMessage(
              <>
                <p className="result-value">{`Probability of ${
                  task.disease || "the disease"
                } presence is ${(task.result! * 100).toFixed(1)} %.`}</p>
                <p className="note">Your result will be available for 24 hours.</p>
              </>
            );
            break;
          case "FAILURE":
            setMessage(
              <p className="error">An error occurred during computation.</p>
            );
            break;
          default:
            setMessage(
              <p className="pending">
                {`Your request is in ${task.status} state. Please try again later.`}
              </p>
            );
        }
      })
      .catch((error) => {
        if (error.response && error.response.status === 404) {
          setMessage(<p className="error">Task not found.</p>);
        } else {
          setMessage(<p className="error">An error occurred.</p>);
        }
        console.error(error);
      });
  }, [id]);

  return (
    <div className="pagebody">
    <Link className="back-button" to={"/result"} >
    <FontAwesomeIcon icon={faArrowRightToBracket} />
    {" "}Back to History
    </Link>
      <div className="page-content box">{message}</div>
    </div>
  );
}
