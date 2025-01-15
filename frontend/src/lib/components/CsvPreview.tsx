import React, { useEffect, useState } from "react";
import Papa from "papaparse";

export default function CsvPreview({uploadedFile}: {uploadedFile: File|null}) {
  const [csvData, setCsvData] = useState<string[][]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (uploadedFile !== null) {
      Papa.parse(uploadedFile, {
        header: false,
        skipEmptyLines: true,
        complete: (result) => {
          const rows = result.data as string[][];
          setCsvData(rows.slice(0, 11));
          setError(null);
        },
        error: (err) => {
          setError(err.message);
        },
      });
    }
  }, [uploadedFile]);

  return (
    <div className="dataset-preview-box">
      <h4>Dataset Preview</h4>
      {error && <p style={{ color: "red" }}>Error: {error}</p>}
      {csvData.length > 0 && (
        <table className="dataset-table">
          <thead>
            <tr>
              {csvData[0].map((header, index) => (
                <th key={index}>{header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {csvData.slice(1).map((row, rowIndex) => (
              <tr key={rowIndex}>
                {row.map((cell, cellIndex) => (
                  <td key={cellIndex}>{cell}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
