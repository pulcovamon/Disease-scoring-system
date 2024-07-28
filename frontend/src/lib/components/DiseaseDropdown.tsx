import React, { useState, ChangeEvent } from "react";
import { diseases, DiseaseType } from "../classes/disease";

export default function DiseaseDropdown({
  currentDisease,
  handleChange,
}: {
  currentDisease: DiseaseType;
  handleChange: Function;
}) {
  function onChange(event: ChangeEvent<HTMLSelectElement>) {
    handleChange(event.target.value);
  }
  const diseasesOptions = Object.entries(diseases).map(([key, disease]) => {
    return (
      <option className="disease" value={key} key={key}>
        {disease.name}
      </option>
    );
  });
  return (
    <div className="page-content">
      <select
        className="diseases"
        value={currentDisease}
        onChange={(event) => onChange(event)}
      >
        {diseasesOptions}
      </select>
    </div>
  );
}
