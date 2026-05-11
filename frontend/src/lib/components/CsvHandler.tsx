import { faCloudArrowDown, faFileCsv } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import FileUploader from "./FileUploader";
import { getBlob } from "../classes/api";
import { useTranslations } from "../i18n/useTranslations";

function CsvHandler({
  uploadedFile,
  handleFileUpload,
  unallowed
}: {
  uploadedFile: File | null;
  handleFileUpload: (file: File) => void;
  unallowed: boolean;
}) {
  const { t } = useTranslations();

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
      <div className="template-buttons">
        <div className="download-box" onClick={() => downloadTemplate("csv")}>
          <button className="download-button" onClick={e => { e.stopPropagation(); downloadTemplate("csv"); }}>
            <FontAwesomeIcon icon={faCloudArrowDown} />
          </button>
          <span className="download-file">template.csv</span>
        </div>
        <div className="download-box" onClick={() => downloadTemplate("json")}>
          <button className="download-button" onClick={e => { e.stopPropagation(); downloadTemplate("json"); }}>
            <FontAwesomeIcon icon={faCloudArrowDown} />
          </button>
          <span className="download-file">template.json</span>
        </div>
      </div>
      <h4>{t("form.input.file")} <FontAwesomeIcon icon={faFileCsv} /></h4>
      <div>
        <FileUploader accept=".csv,.json" onFileSelect={handleFileUpload} unallowed={unallowed && uploadedFile === null} />
      </div>
      {uploadedFile && <p>{t("form.input.uploaded")}: {uploadedFile.name}</p>}
    </div>
  );
}

export default CsvHandler;
