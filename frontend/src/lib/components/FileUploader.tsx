import React, { useState, DragEvent } from "react";

function FileUploader({
  accept = "*",
  onFileSelect,
  unallowed
}: {
  accept: string;
  onFileSelect: (file: File) => void;
  unallowed: boolean
}) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    if (event.dataTransfer.files.length > 0) {
      const file = event.dataTransfer.files[0];
      onFileSelect(file);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onFileSelect(file);
    }
  };

  const handleButtonClick = () => {
    document.getElementById("fileInput")?.click();
  };

  function setBorder() {
    if (isDragging) {
      return "2px dashed #4caf50"
    } 
    if (unallowed) {
      return "2px solid red"
    } 
    return "2px dashed #ccc"
  }

  return (
    <div>
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`drag-box ${unallowed ? "unallowed" : ""}`}
        style={{
          border: setBorder(),
          backgroundColor: isDragging ? "#f5f5f5" : "#fff",
        }}
      >
        <p style={{ margin: 0 }}>
          Drag and drop a file here, or click to upload
        </p>
        <button
          onClick={handleButtonClick}
          type="button"
          className="file-button"
        >
          Select File
        </button>
        <input
          id="fileInput"
          type="file"
          accept={accept}
          onChange={handleFileChange}
          style={{ display: "none" }}
        />
      </div>
    </div>
  );
}

export default FileUploader;
