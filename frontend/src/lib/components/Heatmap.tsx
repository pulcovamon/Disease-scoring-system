import React from "react";
import { Patient } from "../classes/catalogData";
import HeatMapRow from "./HeatmapRow";
import "./heatmap.css";
import { useTranslations } from "../i18n/useTranslations";

export default function Heatmap({ patient, titleVisible }: { patient: Patient; titleVisible: boolean }) {
  const { t } = useTranslations();
  const header = [...Array(patient.active_phase.ground_truth.length)];
  return (
    <div className={titleVisible ? "box page-content" : ""}>
      {titleVisible ? <h1 className="title">{t("heatmap.title")}</h1> : null}
      <div className="heatmap-wrapper">
        <table className="heatmap-table">
          <thead>
            <tr>
              <th>{t("heatmap.header.category")}</th>
              {header.map((_, index) => (
                <th key={index}>{index + 1}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            <HeatMapRow
              categoryName={t("heatmap.row.multiclass")}
              groundTruth={patient.icd10_multiclass.ground_truth}
              prediction={patient.icd10_multiclass.prediction}
            />
            <HeatMapRow
              categoryName={t("heatmap.row.binary")}
              groundTruth={patient.icd10_binary.ground_truth}
              prediction={patient.icd10_binary.prediction}
            />
            <HeatMapRow
              categoryName={t("heatmap.row.active")}
              groundTruth={patient.active_phase.ground_truth}
              prediction={patient.active_phase.prediction}
            />
          </tbody>
        </table>
      </div>
    </div>
  );
}
