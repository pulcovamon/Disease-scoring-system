import React from "react";
import { DiseaseType, diseases } from "../classes/disease";
import { useNavigate } from "react-router-dom";

interface ModelSelectionProps {
  disease: DiseaseType;
  setDisease: (diseaseType: DiseaseType) => void;
}

export default function ModelSelection({ disease, setDisease }: ModelSelectionProps) {
  const navigate = useNavigate();

  return (
    <div className="page-body">
      <h2>Vyberte model</h2>
      <div className="tabs">
        {Object.values(DiseaseType).map((diseaseType) => (
          <button
            key={diseaseType}
            className={`tab ${disease === diseaseType ? "active" : ""}`}
            onClick={() => setDisease(diseaseType)}
          >
            {diseases[diseaseType].name}
          </button>
        ))}
      </div>
      <button onClick={() => navigate("/patient")}>Pokračovat</button>
    </div>
  );
}
