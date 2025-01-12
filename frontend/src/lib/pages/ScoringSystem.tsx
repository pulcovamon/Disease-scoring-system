import React, { useState, ChangeEvent, KeyboardEvent } from "react";
import { DiseaseType, diseases } from "../classes/disease";
import "./scoringSystem.css";
import { DataSender } from "../classes/data";
import LinkButton from "../components/LinkButton";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFloppyDisk, faPen } from "@fortawesome/free-solid-svg-icons";

function ClasifyForm({
  disease,
  modelType,
  codes,
  handleAddCode,
  handleUpdateCode,
}: {
  disease: DiseaseType;
  modelType: string;
  codes: string[];
  handleAddCode: (code: string) => void;
  handleUpdateCode: (index: number, newCode: string) => void;
}) {
  const [newCode, setNewCode] = useState("");
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [editValue, setEditValue] = useState<string>("");

  function handleInputChange(event: ChangeEvent<HTMLInputElement>) {
    setNewCode(event.target.value);
  }

  function handleKeyPress(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter" && newCode.trim()) {
      handleAddCode(newCode.trim());
      setNewCode("");
      event.preventDefault();
    }
  }

  function handleEditCode(index: number) {
    setEditIndex(index);
    setEditValue(codes[index]);
  }

  function handleSaveEdit() {
    if (editIndex !== null && editValue.trim()) {
      handleUpdateCode(editIndex, editValue.trim());
      setEditIndex(null);
      setEditValue("");
    }
  }

  function handleEditChange(event: ChangeEvent<HTMLInputElement>) {
    setEditValue(event.target.value);
  }

  return (
    <div className="form-container">
      <h4>{modelType}</h4>
      <ul className="codes-list">
        {codes.map((code, index) => (
          <li key={index} >
            {editIndex === index ? (
              <div>
                <input className="code-input"
                  type="text"
                  value={editValue}
                  onChange={handleEditChange}
                  onKeyDown={(e) => e.key === "Enter" && handleSaveEdit()}
                />
                <button className="code-button" onClick={handleSaveEdit}>
                  <FontAwesomeIcon icon={faFloppyDisk} />
                </button>
              </div>
            ) : (
              <>
              <span className="code-item">{code}</span>
                <button className="code-button" onClick={() => handleEditCode(index)}>
                  <FontAwesomeIcon icon={faPen} />
                </button>
              </>
            )}
          </li>
        ))}
        <li>
        <input
        type="text"
        value={newCode}
        onChange={handleInputChange}
        onKeyDown={handleKeyPress}
        placeholder="Add a new code and press Enter"
        className="code-input"
      />
        </li>
      </ul>
    </div>
  );
}

export default function ScoringSystem() {
  const [disease, setDisease] = useState<DiseaseType>(DiseaseType.LungCancer);
  const [codes, setCodes] = useState<string[]>([]);
  const [message, setMessage]: [JSX.Element, Function] = useState<JSX.Element>(
    <p></p>
  );

  function handleDiseaseChange(diseaseType: DiseaseType) {
    setDisease(diseaseType);
    setCodes([]);
  }

  function handleAddCode(code: string) {
    setCodes((prevCodes) => [...prevCodes, code]);
  }

  function handleUpdateCode(index: number, newCode: string) {
    const updatedCodes = [...codes];
    updatedCodes[index] = newCode;
    setCodes(updatedCodes);
  }

  function handleSendCodes() {
    const dataSender = new DataSender(codes);
    dataSender.postData().then(() => {
      if (dataSender.message != null) {
        setMessage(<p className="error">{dataSender.message}</p>);
      } else if (dataSender.id != null) {
        setMessage(
          <LinkButton link={`/result/${dataSender.id}`}>
            See your result!
          </LinkButton>
        );
      } else {
        setMessage(<p className="error">An error occured.</p>);
      }
    });
  }

  return (
    <div className="page-body">
      <div className="tabs">
        {Object.values(DiseaseType).map((diseaseType) => (
          <button
            key={diseaseType}
            className={`tab ${disease === diseaseType ? "active" : ""}`}
            onClick={() => handleDiseaseChange(diseaseType)}
          >
            {diseases[diseaseType].name}
          </button>
        ))}
      </div>
      <div className="box">
        <ClasifyForm
          disease={disease}
          modelType="Medical codes sequence"
          codes={codes}
          handleAddCode={handleAddCode}
          handleUpdateCode={handleUpdateCode}
        />
        <button className="send" onClick={handleSendCodes}>
          Send
        </button>
        {message}
      </div>
    </div>
  );
}
