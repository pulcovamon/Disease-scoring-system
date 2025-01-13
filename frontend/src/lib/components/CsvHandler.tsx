import { faCloudArrowDown } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React, { useState } from "react";
import { FileField, FileInput } from "react-admin";
import FileUploader from "./FileUploader";

function CsvHandler({
  uploadedFile,
  handleFileUpload,
}: {
  uploadedFile: File | null;
  handleFileUpload: (file: File) => void;
}) {
  const downloadTemplate = () => {
    const template = "id,name,age\n1,John Doe,30\n2,Jane Smith,25";
    const blob = new Blob([template], { type: "text/csv" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "template.csv";
    a.click();

    URL.revokeObjectURL(url);
  };

  const sendFile = () => {
    if (!uploadedFile) {
      alert("No file uploaded!");
      return;
    }

    const formData = new FormData();
    formData.append("file", uploadedFile);
  };

  return (
    <div className="dataset-input">
      <div className="download-box">
        <button className="download-button" onClick={downloadTemplate}>
          <FontAwesomeIcon icon={faCloudArrowDown} />
        </button>{" "}
        template.csv
      </div>
      <h4>Dataset of codes</h4>
      <div>
        <FileUploader accept=".csv" onFileSelect={handleFileUpload} />
        <button onClick={sendFile} disabled={!uploadedFile} className="send">
          Send
        </button>
      </div>
      {uploadedFile && <p>Uploaded file: {uploadedFile.name}</p>}
    </div>
  );
}

export default CsvHandler;
