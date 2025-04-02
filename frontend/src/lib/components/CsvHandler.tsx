import { faCloudArrowDown, faFileCsv } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import FileUploader from "./FileUploader";
import { getBlob } from "../classes/api";

function CsvHandler({
  uploadedFile,
  handleFileUpload,
  unallowed
}: {
  uploadedFile: File | null;
  handleFileUpload: (file: File) => void;
  unallowed: boolean
}) {

  const downloadTemplate = async (fileFormat: "csv" | "json" = "csv") => {
    try {
      const blob = await getBlob("/prediction/template", { file_format: fileFormat });
      const url = URL.createObjectURL(blob);
  
      const a = document.createElement("a");
      a.href = url;
      a.download = `template.${fileFormat}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Failed to download template:", err);
    }
  };  

  return (
    <div className="dataset-input">
      <div className="download-box" onClick={() => downloadTemplate("csv")}>
        <button className="download-button" onClick={() => downloadTemplate("csv")}>
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
