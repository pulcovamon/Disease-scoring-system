import React, { ChangeEvent } from "react";
import { DiseaseType } from "../classes/disease";

export default function ClasifyForm({
  disease,
  modelType,
  codes,
  handleChange,
  handleClick,
}: {
  disease: DiseaseType;
  modelType: string;
  codes: string[];
  handleChange: Function;
  handleClick: Function;
}) {
  function onClick() {
    handleClick(codes);
  }

  const codesElements = codes.map((code) => {
    return <li>
      <input value={code} />
    </li>
  })

  return (
    <div className="page-content">
      <h4>{modelType}</h4>
      <div className="input-field">
        <ul>
          {codesElements}
          <li>
            <input/>
          </li>
        </ul>
      </div>
    </div>
  );
}

function ClasifyButton({ text, onClick }: { text: string; onClick: Function }) {
  return (
    <div>
      <button className="classify-button" onClick={() => onClick()}>
        {text}
      </button>
    </div>
  );
}

function ClassifyTextField({
  text,
  handleChange,
}: {
  text: string;
  handleChange: Function;
}) {
  function onChange(event: ChangeEvent<HTMLInputElement>) {
    if (event.target !== null) {
      handleChange(event.target.value);
    }
  }
  return (
    <div className="input-text">
      <form>
        <label>Codes</label>
        <input type="text" value={text} onChange={onChange} />
      </form>
    </div>
  );
}
