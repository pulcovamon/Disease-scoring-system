import { faFloppyDisk, faPen } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { ChangeEvent, useState, KeyboardEvent } from "react";
import { DiseaseType } from "../classes/disease";

export function ClasifyForm({
  disease,
  modelType,
  codes,
  handleAddCode,
  handleUpdateCode,
  handleSendCodes
}: {
  disease: DiseaseType;
  modelType: string;
  codes: string[];
  handleAddCode: (code: string) => void;
  handleUpdateCode: (index: number, newCode: string) => void;
  handleSendCodes: () => void;
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
      <button className="send" onClick={handleSendCodes}>
          Send
        </button>
    </div>
  );
}