import React, { useRef, useState, DragEvent } from "react";

function FileUploader({
  accept = "*",
  onFileSelect,
  unallowed
}: {
  accept: string;
  onFileSelect: (file: File) => void;
  unallowed: boolean;
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [wrongType, setWrongType] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const isAccepted = (file: File): boolean => {
    if (accept === "*") return true;
    const ext = "." + file.name.split(".").pop()?.toLowerCase();
    return accept.split(",").map((a) => a.trim().toLowerCase()).includes(ext);
  };

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
      if (!isAccepted(file)) {
        setWrongType(true);
        setTimeout(() => setWrongType(false), 2000);
        return;
      }
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
    inputRef.current?.click();
  };

  function setBorder() {
    if (wrongType || unallowed) return "2px solid red";
    if (isDragging) return "2px dashed var(--primary)";
    return "2px dashed var(--border-muted)";
  }

  return (
    <div>
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`drag-box ${wrongType || unallowed ? "unallowed" : ""}`}
        style={{
          border: setBorder(),
          backgroundColor: isDragging ? "var(--bg-surface-muted)" : "var(--bg-surface)",
          color: "var(--text-color)",
        }}
      >
        <p style={{ margin: 0 }}>
          {wrongType ? "Unsupported file type" : "Drag and drop a file here, or click to upload"}
        </p>
        <button onClick={handleButtonClick} type="button" className="file-button">
          Select File
        </button>
        <input
          ref={inputRef}
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
