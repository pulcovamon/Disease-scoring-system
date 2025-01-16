import { faCloudArrowDown, faFileCsv } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import FileUploader from "./FileUploader";

function CsvHandler({
  uploadedFile,
  handleFileUpload,
  unallowed
}: {
  uploadedFile: File | null;
  handleFileUpload: (file: File) => void;
  unallowed: boolean
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


  return (
    <div className="dataset-input">
      <div className="download-box" onClick={downloadTemplate}>
        <button className="download-button" onClick={downloadTemplate}>
          <FontAwesomeIcon icon={faCloudArrowDown} />
        </button>{" "}
        <span className="download-file">
        template.csv
        </span>
      </div>
      <h4>Dataset of codes{" "}
        <FontAwesomeIcon icon={faFileCsv} />
      </h4>
      <div>
        <FileUploader accept=".csv" onFileSelect={handleFileUpload} unallowed={unallowed && uploadedFile === null} />
      </div>
      {uploadedFile && <p>Uploaded file: {uploadedFile.name}</p>}
    </div>
  );
}

export default CsvHandler;
