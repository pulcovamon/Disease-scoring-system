import React from "react";
import "./home.css";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faShareFromSquare } from "@fortawesome/free-solid-svg-icons";

export default function Home() {
  return (
    <div
      className="page-content"
    >
      <div>
      <h1>Welcome to the Disease Scoring System!</h1>
      <p className="text">
        This platform allows you to predict disease outcomes based on input data. 
        Explore the different features to upload patient codes, view prediction history, 
        and analyze training results.
      </p>
      </div>
      <div className="info-boxes">
        <div className="box">
          <h4>Upload Data and Make Predictions</h4>
          <p className="text">
            Choose from two methods to input data:
            <br/>
                <strong>Manual Entry:</strong> Add patient codes individually and provide the patient’s name.
                <br/>
                <strong>Upload Dataset:</strong> Submit a CSV file containing multiple codes for batch processing.
          </p>
          <Link to={"/score"} className="page-link">
            <FontAwesomeIcon icon={faShareFromSquare} />
            <span> Get Started</span>
          </Link>
        </div>
        <div className="box">
          <h4>View Prediction History</h4>
          <p className="text">
            Review all your predictions, including both ongoing processes and completed results. 
            Track the progress of current predictions or revisit past outcomes for analysis.
          </p>
          <Link to={"/result"} className="page-link">
            <FontAwesomeIcon icon={faShareFromSquare} />
            <span> View History</span>
          </Link>
        </div>
        <div className="box">
          <h4>Analyze Training Results</h4>
          <p className="text">
            Examine training datasets and compare ground truth values with the model's predictions. 
            Gain insights into the model's accuracy and performance.
          </p>
          <Link to={"/catalog"} className="page-link">
            <FontAwesomeIcon icon={faShareFromSquare} />
            <span> Explore Catalog</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
