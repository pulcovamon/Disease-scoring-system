import React, { useMemo, useState } from "react";
import { Patient } from "../classes/catalogData";
import Filtering from "../components/Filtering";
import Pagination from "../components/Pagination";
import { Link, useSearchParams } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faShareFromSquare } from "@fortawesome/free-solid-svg-icons";
import { useCatalogCount, useCatalogPatients } from "../hooks/useCatalogData";
import { useLanguage } from "../store/language";
import { useTranslations } from "../i18n/useTranslations";
import CodeSearchFilter from "../components/CodeSearchFilter";
import { CodeBadge } from "../components/CodeBadge";

export default function Catalog() {
  const { buildPath } = useLanguage();
  const { t } = useTranslations();
  const [patientId, setPatientId] = useState<number | undefined>(undefined);
  const [patientCode, setPatientCode] = useState<string | undefined>(undefined);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(20);
  const [searchParams, setSearchParams] = useSearchParams();

  React.useEffect(() => {
    const id = searchParams.get("id");
    const code = searchParams.get("code");
    const page = searchParams.get("page");
    const size = searchParams.get("size");

    setPatientId(id ? Number(id) : undefined);
    setPatientCode(code || undefined);
    setCurrentPage(page ? Number(page) : 1);
    setPageSize(size ? Number(size) : 20);
  }, [searchParams]);

  const patientQuery = useMemo(() => {
    if (patientId !== undefined) {
      return { id: patientId };
    }
    return {
      skip: currentPage * pageSize - pageSize,
      limit: pageSize,
      code: patientCode,
    };
  }, [currentPage, pageSize, patientCode, patientId]);

  const {
    patients,
    loading: loadingPatients,
    error: patientsError,
  } = useCatalogPatients(patientQuery);

  const { total, loading: loadingTotal, error: totalError } = useCatalogCount(patientCode);

  const totalPages = useMemo(() => {
    if (patientId) return 1;
    if (!total || total === 0) return 0;
    return Math.max(1, Math.ceil(total / pageSize));
  }, [pageSize, patientId, total]);

  const handlePatientId = (value: number | undefined) => {
    setPatientId(value);
    const params = new URLSearchParams(searchParams);
  
    if (value !== undefined) {
      params.set("id", value.toString());
    } else {
      params.delete("id");
    }
  
    setSearchParams(params);
  };
  
  const handlePatientCode = (value: string | undefined) => {
    setPatientCode(value);
    const params = new URLSearchParams(searchParams);
  
    if (value !== undefined) {
      params.set("code", value);
    } else {
      params.delete("code");
    }
  
    setSearchParams(params);
  };
  
  const handlePageChange = (pageId: number) => {
    setCurrentPage(pageId);
    const params = new URLSearchParams(searchParams);
  
    if (pageId !== 1) {
      params.set("page", pageId.toString());
    } else {
      params.delete("page");
    }
    params.set("size", pageSize.toString());
  
    setSearchParams(params);
  };


  const message = patientsError || totalError ? (
    <p className="text-[var(--text-color)] font-semibold">{patientsError || totalError}</p>
  ) : null;
  const emptyState =
    !loadingPatients && !patientsError && patients.length === 0 ? (
      <p className="text-[var(--text-muted)]">{t("catalog.empty")}</p>
    ) : null;

  return (
    <div className="page-body space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-[var(--text-color)]">{t("catalog.title")}</h2>
          <p className="text-[var(--text-muted)]">{t("catalog.subtitle")}</p>
        </div>
        <div className="flex items-center gap-3 text-sm text-[var(--text-muted)]">
          <span>{t("catalog.total")}</span>
          <span className="px-3 py-1 rounded-full bg-[var(--bg-surface)] border border-[var(--border-muted)] text-[var(--text-color)] font-semibold">
            {loadingTotal ? "…" : total || 0}
          </span>
        </div>
      </div>

      {message && <div className="box">{message}</div>}
      {emptyState && <div className="box">{emptyState}</div>}

      <div className="grid md:grid-cols-2 gap-4">
        <Filtering<number | undefined>
          label={t("catalog.filter.patientId")}
          value={patientId}
          placeholder={t("catalog.filter.patientId.placeholder")}
          handleSubmit={handlePatientId}
        />
        <CodeSearchFilter
          label={t("catalog.filter.code")}
          value={patientCode}
          placeholder={t("catalog.filter.code.placeholder")}
          handleSubmit={handlePatientCode}
        />
      </div>

      <div className="flex flex-wrap items-center gap-3 justify-between">
        <div className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
          <span>{t("catalog.itemsPerPage")}</span>
          <select
            value={pageSize}
            onChange={(e) => {
              const next = Number(e.target.value);
              setPageSize(next);
              setCurrentPage(1);
              const params = new URLSearchParams(searchParams);
              params.set("size", next.toString());
              params.delete("page");
              setSearchParams(params);
            }}
            className="rounded-lg border border-[var(--border-muted)] bg-[var(--bg-surface)] px-3 py-2 text-[var(--text-color)] focus:border-[var(--primary)] focus:outline-none"
          >
            {[10, 20, 50, 100].map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </div>
        <Pagination
          currentPage={currentPage}
          handlePageChange={handlePageChange}
          totalPages={patientId ? 1 : totalPages}
        />
      </div>

      <div className="rounded-2xl border border-[var(--border-muted)] bg-[var(--bg-surface)]">
        <div className="relative">
          {loadingPatients && (
            <div className="absolute inset-0 flex items-center justify-center bg-[var(--bg-surface)]/85 backdrop-blur-sm rounded-2xl z-10">
              <span className="w-10 h-10 border-4 border-[var(--primary)] border-t-transparent rounded-full animate-spin" aria-label="Loading" />
            </div>
          )}
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-[var(--border-muted)] bg-[var(--bg-surface-muted)]">
                <th className="px-4 py-3 text-sm font-semibold text-[var(--text-muted)]">{t("catalog.table.patientId")}</th>
                <th className="px-4 py-3 text-sm font-semibold text-[var(--text-muted)]">{t("catalog.table.codes")}</th>
                <th className="px-4 py-3 text-sm font-semibold text-[var(--text-muted)]">{t("catalog.table.predictions")}</th>
                <th className="px-4 py-3 text-sm font-semibold text-[var(--text-muted)]">{t("catalog.table.accuracy")}</th>
                <th className="px-4 py-3 text-sm font-semibold text-[var(--text-muted)]"></th>
              </tr>
            </thead>
            <tbody>
            {patients.map((patient) => (
              <PatientRow
                key={patient._id}
                patient={patient}
                highlightCode={patientCode}
              />
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 justify-between">
        <Pagination
          currentPage={currentPage}
          handlePageChange={handlePageChange}
          totalPages={patientId ? 1 : totalPages}
        />
      </div>
    </div>
  );
}

function PatientRow({
  patient,
  highlightCode,
}: {
  patient: Patient;
  highlightCode?: string;
}) {
  const { buildPath } = useLanguage();
  const { t } = useTranslations();
  const codes = patient.codes.slice(0, 5);
  const hasMore = patient.codes.length > codes.length;
  const predictionsCount = patient.active_phase?.prediction?.length ?? patient.codes.length;

  const accuracy = useMemo(() => {
    const compute = (gt?: boolean[], pred?: boolean[]) => {
      if (!gt || !pred || gt.length === 0 || gt.length !== pred.length) return null;
      const correct = gt.filter((val, idx) => val === pred[idx]).length;
      return Math.round((correct / gt.length) * 100);
    };
    return (
      compute(patient.active_phase?.ground_truth, patient.active_phase?.prediction) ??
      compute(patient.icd10_binary?.ground_truth as any, patient.icd10_binary?.prediction as any)
    );
  }, [patient.active_phase, patient.icd10_binary]);

  return (
    <tr className="border-b border-[var(--border-muted)] hover:bg-[var(--bg-surface-muted)]/70 transition">
      <td className="px-4 py-3 font-semibold text-[var(--text-color)] whitespace-nowrap">{patient._id}</td>
      <td className="px-4 py-3">
        <div className="flex flex-wrap gap-2">
          {codes.map((code) => {
            const isHighlight = code === highlightCode;
            return (
              <CodeBadge
                key={code}
                code={code}
                pillClassName={
                  isHighlight
                    ? "border-[var(--primary)] bg-[var(--primary)]/10 text-[var(--text-color)]"
                    : "border-[var(--border-muted)] bg-[var(--bg-surface-muted)] text-[var(--text-color)]"
                }
              />
            );
          })}
          {hasMore && (
            <span className="px-2 py-1 rounded-full text-xs bg-[var(--bg-surface-muted)] border border-[var(--border-muted)] text-[var(--text-muted)]">
              +{patient.codes.length - codes.length}
            </span>
          )}
        </div>
      </td>
      <td className="px-4 py-3 text-[var(--text-color)] text-sm">{predictionsCount}</td>
      <td className="px-4 py-3 text-[var(--text-color)] text-sm">
        {accuracy === null ? "N/A" : `${accuracy}%`}
      </td>
      <td className="px-4 py-3 text-right">
        <Link
          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--bg-surface-muted)] text-[var(--text-color)] hover:bg-[var(--border-muted)] transition text-sm font-semibold"
          to={buildPath(`/catalog/${patient._id}${highlightCode ? `?code=${highlightCode}` : ""}`)}
          target="_blank"
        >
          <FontAwesomeIcon icon={faShareFromSquare} />
          {t("catalog.detail")}
        </Link>
      </td>
    </tr>
  );
}
