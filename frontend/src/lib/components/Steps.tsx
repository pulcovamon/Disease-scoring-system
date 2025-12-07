import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faHexagonNodes,
  faDatabase,
  faPaperPlane,
  faCheck,
} from "@fortawesome/free-solid-svg-icons";
import { useTranslations } from "../i18n/useTranslations";

const stepsKeys = [
  { icon: faHexagonNodes, key: "form.step.model", fallback: "Model" },
  { icon: faDatabase, key: "form.step.data", fallback: "Data" },
  { icon: faPaperPlane, key: "form.step.send", fallback: "Send" },
];

export default function Steps({ currentIndex }: { currentIndex: number }) {
  const { t } = useTranslations();
  return (
    <div className="flex items-center gap-3">
      {stepsKeys.map((step, idx) => {
        const isActive = currentIndex === idx;
        const isCompleted = currentIndex > idx;
        return (
          <div key={step.key} className="flex items-center gap-2">
            <div
              className={`relative flex items-center justify-center w-12 h-12 rounded-full border transition ${
                isActive
                  ? "bg-[var(--primary)] text-white border-[var(--primary)] shadow"
                  : isCompleted
                  ? "bg-[var(--primary)]/80 text-white border-[var(--primary)]"
                  : "bg-[var(--bg-surface)] text-[var(--text-color)] border-[var(--border-muted)]"
              }`}
            >
              <FontAwesomeIcon icon={isCompleted ? faCheck : step.icon} />
            </div>
            <span
              className={`text-sm font-semibold ${
                isActive || isCompleted ? "text-[var(--text-color)]" : "text-[var(--text-muted)]"
              }`}
            >
              {t(step.key, step.fallback)}
            </span>
            {idx < stepsKeys.length - 1 && (
              <div className="w-10 h-[2px] bg-[var(--border-muted)]" />
            )}
          </div>
        );
      })}
    </div>
  );
}
