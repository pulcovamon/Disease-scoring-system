import React, { useState, useEffect, useMemo } from "react";
import { Patient, PatientDetail } from "../classes/catalogData";
import { Link, useParams, useSearchParams } from "react-router-dom";
import Heatmap from "../components/Heatmap";
import PatientCodes from "../components/PatientCodes";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronLeft } from "@fortawesome/free-solid-svg-icons";
import { useTranslations } from "../i18n/useTranslations";
import { useLanguage } from "../store/language";

export default function PatientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const code = searchParams.get("code");
  const [patient, setPatient] = useState<Patient | null>(null);
  const [message, setMessage] = useState<JSX.Element | string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [colorMode, setColorMode] = useState<"specialty" | "tfidf0" | "tfidf1" | "frequency">("specialty");  
  const { t } = useTranslations();
  const { buildPath } = useLanguage();

  useEffect(() => {
    async function fetchPatient() {
      setLoading(true);
      if (id) {
        try {
          const patientDetail = new PatientDetail(Number(id));
          await patientDetail.getPatient();

          if (patientDetail.message != null) {
            setMessage(<p className="error">{patientDetail.message}</p>);
            setPatient(null);
          } else if (patientDetail.patient) {
            setPatient(patientDetail.patient);
            setMessage("");
          } else {
            setMessage(<p className="error">{t("catalog.error")}</p>);
            setPatient(null);
          }
        } catch (error) {
          setMessage(<p className="error">{t("catalog.error")}</p>);
          console.error(error);
        }
      } else {
        setMessage(<p>{t("catalog.noId")}</p>);
      }
      setLoading(false);
    }

    fetchPatient();
  }, [id, t]);

  const handleColorModeChange = (newMode: typeof colorMode) => {
    setColorMode(newMode);
  };

  const stats = useMemo(() => {
    if (!patient) return null;
    const predictions = patient.active_phase?.prediction?.length ?? 0;
    const codeCount = patient.codes.length;
    const distinctCodes = new Set(patient.codes).size;
    const accuracy = (() => {
      const gt = patient.active_phase?.ground_truth;
      const pred = patient.active_phase?.prediction;
      if (!gt || !pred || gt.length === 0 || gt.length !== pred.length) return null;
      const correct = gt.filter((val, idx) => val === pred[idx]).length;
      return `${Math.round((correct / gt.length) * 100)}%`;
    })();
    return { predictions, codeCount, distinctCodes, accuracy };
  }, [patient]);

  return (
    <div className="page-body space-y-6">
      <div className="flex items-center gap-3">
        <Link
          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--bg-surface-muted)] text-[var(--text-color)] hover:bg-[var(--border-muted)] transition"
          to={buildPath("/catalog")}
        >
          <FontAwesomeIcon icon={faChevronLeft} /> {t("catalog.back")}
        </Link>
        {patient && (
          <span className="px-3 py-2 rounded-full bg-[var(--primary)]/10 text-[var(--text-color)] border border-[var(--primary)] text-sm font-semibold">
            {t("catalog.patientTag").replace("{id}", String(patient._id))}
          </span>
        )}
      </div>

      {message && !patient ? (
        <div className="box">{message}</div>
      ) : loading ? (
        <div className="box">
          <p className="text-[var(--text-muted)]">{t("catalog.loadingPatient")}</p>
        </div>
      ) : (
        <>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="rounded-2xl border border-[var(--border-muted)] bg-[var(--bg-surface)] p-4 space-y-2 shadow-sm">
              <p className="text-xs uppercase tracking-wide text-[var(--text-muted)]">{t("catalog.stats.codes")}</p>
              <p className="text-2xl font-bold text-[var(--text-color)]">{stats?.codeCount ?? "…"}</p>
            </div>
            <div className="rounded-2xl border border-[var(--border-muted)] bg-[var(--bg-surface)] p-4 space-y-2 shadow-sm">
              <p className="text-xs uppercase tracking-wide text-[var(--text-muted)]">{t("catalog.stats.distinct")}</p>
              <p className="text-2xl font-bold text-[var(--text-color)]">{stats?.distinctCodes ?? "…"}</p>
            </div>
            <div className="rounded-2xl border border-[var(--border-muted)] bg-[var(--bg-surface)] p-4 space-y-2 shadow-sm">
              <p className="text-xs uppercase tracking-wide text-[var(--text-muted)]">{t("catalog.stats.predictions")}</p>
              <p className="text-2xl font-bold text-[var(--text-color)]">{stats?.predictions ?? "…"}</p>
            </div>
            <div className="rounded-2xl border border-[var(--border-muted)] bg-[var(--bg-surface)] p-4 space-y-2 shadow-sm">
              <p className="text-xs uppercase tracking-wide text-[var(--text-muted)]">{t("catalog.stats.accuracy")}</p>
              <p className="text-2xl font-bold text-[var(--text-color)]">
                {stats?.accuracy ?? "N/A"}
              </p>
            </div>
          </div>

          <div className="grid gap-4">
            <div className="rounded-2xl border border-[var(--border-muted)] bg-[var(--bg-surface)] p-4 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-semibold text-[var(--text-color)]">{t("catalog.section.heatmap")}</h2>
              </div>
              {patient && <Heatmap patient={patient} titleVisible={false} />}
            </div>
            <div className="rounded-2xl border border-[var(--border-muted)] bg-[var(--bg-surface)] p-4 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-[var(--text-color)]">{t("catalog.section.codes")}</h2>
              </div>
              {patient && (
                <PatientCodes
                  patient={patient}
                  titleVisible={false}
                  currentCode={code}
                  colorMode={colorMode}
                  onColorModeChange={handleColorModeChange}
                />
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
