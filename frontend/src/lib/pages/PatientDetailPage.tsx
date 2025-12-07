import React, { useState, useEffect, useMemo } from "react";
import { Patient, PatientDetail } from "../classes/catalogData";
import { Link, useParams, useSearchParams } from "react-router-dom";
import Heatmap from "../components/Heatmap";
import PatientCodes from "../components/PatientCodes";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronLeft } from "@fortawesome/free-solid-svg-icons";

export default function PatientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const code = searchParams.get("code");
  const [patient, setPatient] = useState<Patient | null>(null);
  const [message, setMessage] = useState<JSX.Element | string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [colorMode, setColorMode] = useState<"specialty" | "tfidf0" | "tfidf1" | "frequency">("specialty");  

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
            setMessage(<p className="error">An error occurred.</p>);
            setPatient(null);
          }
        } catch (error) {
          setMessage(<p className="error">An error occurred.</p>);
          console.error(error);
        }
      } else {
        setMessage(<p>No id provided.</p>);
      }
      setLoading(false);
    }

    fetchPatient();
  }, [id]);

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
          to={"/catalog"}
        >
          <FontAwesomeIcon icon={faChevronLeft} /> Back to Catalog
        </Link>
        {patient && (
          <span className="px-3 py-2 rounded-full bg-[var(--primary)]/10 text-[var(--text-color)] border border-[var(--primary)] text-sm font-semibold">
            Patient ID {patient._id}
          </span>
        )}
      </div>

      {message && !patient ? (
        <div className="box">{message}</div>
      ) : loading ? (
        <div className="box">
          <p className="text-[var(--text-muted)]">Loading patient details...</p>
        </div>
      ) : (
        <>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="rounded-2xl border border-[var(--border-muted)] bg-[var(--bg-surface)] p-4 space-y-2 shadow-sm">
              <p className="text-xs uppercase tracking-wide text-[var(--text-muted)]">Codes</p>
              <p className="text-2xl font-bold text-[var(--text-color)]">{stats?.codeCount ?? "…"}</p>
            </div>
            <div className="rounded-2xl border border-[var(--border-muted)] bg-[var(--bg-surface)] p-4 space-y-2 shadow-sm">
              <p className="text-xs uppercase tracking-wide text-[var(--text-muted)]">Distinct codes</p>
              <p className="text-2xl font-bold text-[var(--text-color)]">{stats?.distinctCodes ?? "…"}</p>
            </div>
            <div className="rounded-2xl border border-[var(--border-muted)] bg-[var(--bg-surface)] p-4 space-y-2 shadow-sm">
              <p className="text-xs uppercase tracking-wide text-[var(--text-muted)]">Predictions</p>
              <p className="text-2xl font-bold text-[var(--text-color)]">{stats?.predictions ?? "…"}</p>
            </div>
            <div className="rounded-2xl border border-[var(--border-muted)] bg-[var(--bg-surface)] p-4 space-y-2 shadow-sm">
              <p className="text-xs uppercase tracking-wide text-[var(--text-muted)]">Estimated accuracy</p>
              <p className="text-2xl font-bold text-[var(--text-color)]">
                {stats?.accuracy ?? "N/A"}
              </p>
            </div>
          </div>

          <div className="grid gap-4">
            <div className="rounded-2xl border border-[var(--border-muted)] bg-[var(--bg-surface)] p-4 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-semibold text-[var(--text-color)]">Heatmap</h2>
              </div>
              {patient && <Heatmap patient={patient} titleVisible={false} />}
            </div>
            <div className="rounded-2xl border border-[var(--border-muted)] bg-[var(--bg-surface)] p-4 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-[var(--text-color)]">Codes</h2>
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
