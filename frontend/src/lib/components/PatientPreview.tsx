import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faDatabase, faUser, faTag } from "@fortawesome/free-solid-svg-icons";
import { Patient } from "../classes/patient";
import { useCodeInfo } from "../classes/useCodeInfo";
import { useTranslations } from "../i18n/useTranslations";

function CodeRow({ code }: { code: string }) {
  const { t } = useTranslations();
  const { info, loading } = useCodeInfo(code);

  const name = loading
    ? t("codes.status.loading", "Loading…")
    : info === null
      ? t("codes.status.unknown", "Unknown code")
      : (info?.name ?? code);

  const specialty = !loading && info?.specialty ? info.specialty : null;

  return (
    <div className="flex items-start gap-3 py-2 border-b border-[var(--border-muted)] last:border-0">
      <span className="shrink-0 px-2 py-0.5 rounded-md text-xs font-mono font-semibold bg-[var(--bg-surface-muted)] border border-[var(--border-muted)] text-[var(--text-color)]">
        {code}
      </span>
      <div className="flex flex-col min-w-0">
        <span className="text-sm text-[var(--text-color)] leading-snug">{name}</span>
        {specialty && (
          <span className="text-xs text-[var(--text-muted)]">{specialty}</span>
        )}
      </div>
    </div>
  );
}

export default function PatientPreview({
  patient,
  codes,
}: {
  patient: Patient | null;
  codes: string[];
}) {
  const { t } = useTranslations();

  return (
    <div className="flex flex-col gap-4">
      <h4 className="flex items-center gap-2">
        <FontAwesomeIcon icon={faDatabase} className="text-[var(--primary)]" />
        {t("form.preview.title", "Data Preview")}
      </h4>

      {patient && (
        <div className="flex items-center gap-3 p-3 rounded-xl bg-[var(--bg-surface-muted)] border border-[var(--border-muted)]">
          <div className="w-8 h-8 rounded-full bg-[var(--primary)] flex items-center justify-center text-white shrink-0">
            <FontAwesomeIcon icon={faUser} className="text-xs" />
          </div>
          <div>
            <p className="text-xs text-[var(--text-muted)] mb-0 leading-none">
              {t("form.preview.patient", "Patient")}
            </p>
            <p className="text-sm font-semibold text-[var(--text-color)] mt-0.5 mb-0">
              {patient.name} {patient.surname}
            </p>
          </div>
        </div>
      )}

      <div className="flex flex-col">
        <div className="flex items-center gap-2 mb-2">
          <FontAwesomeIcon icon={faTag} className="text-xs text-[var(--text-muted)]" />
          <span className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide">
            {t("form.preview.codes", "Medical Codes")} ({codes.length})
          </span>
        </div>
        <div className="rounded-xl border border-[var(--border-muted)] bg-[var(--bg-surface-muted)] px-3 py-1">
          {codes.map((code) => (
            <CodeRow key={code} code={code} />
          ))}
        </div>
      </div>
    </div>
  );
}
