import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faHexagonNodes,
  faDatabase,
  faPaperPlane,
  faCheck,
} from "@fortawesome/free-solid-svg-icons";

const steps = [
  { icon: faHexagonNodes, label: "Model" },
  { icon: faDatabase, label: "Data" },
  { icon: faPaperPlane, label: "Send" },
];

export default function Steps({ currentIndex }: { currentIndex: number }) {
  return (
    <div className="flex items-center gap-3">
      {steps.map((step, idx) => {
        const isActive = currentIndex === idx;
        const isCompleted = currentIndex > idx;
        return (
          <div key={step.label} className="flex items-center gap-2">
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
              {step.label}
            </span>
            {idx < steps.length - 1 && (
              <div className="w-10 h-[2px] bg-[var(--border-muted)]" />
            )}
          </div>
        );
      })}
    </div>
  );
}
