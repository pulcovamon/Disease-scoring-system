import { useMemo, useState, type CSSProperties } from "react";
import { useCodeInfo } from "../classes/useCodeInfo";
import { useTranslations } from "../i18n/useTranslations";
import { CodeInfo } from "../classes/data";

type CodeBadgeProps = {
  code: string;
  className?: string;
  pillClassName?: string;
  pillStyle?: CSSProperties;
  infoOverride?: CodeInfo | null;
};

export function CodeBadge({
  code,
  className = "",
  pillClassName = "",
  pillStyle,
  infoOverride,
}: CodeBadgeProps) {
  const { t } = useTranslations();
  const { info: fetchedInfo, loading: hookLoading } = useCodeInfo(code);
  const info = infoOverride !== undefined ? infoOverride : fetchedInfo;
  const loading = infoOverride !== undefined ? false : hookLoading;
  const [open, setOpen] = useState(false);

  const subtitle = useMemo(() => {
    if (loading) return t("codes.status.loading", "Loading…");
    if (info === null) return t("codes.status.unknown", "Unknown code");
    return info?.specialty || "";
  }, [info, loading, t]);

  const title = useMemo(() => {
    if (loading) return t("codes.status.loading", "Loading…");
    if (info === null) return t("codes.status.unknown", "Unknown code");
    return info?.name || "";
  }, [info, loading, t]);

  return (
    <span className={`relative inline-block ${className}`}>
      <span
        role="button"
        tabIndex={0}
        className={`px-3 py-1 rounded-full text-xs font-semibold border border-[var(--border-muted)] bg-[var(--bg-surface-muted)] text-[var(--text-color)] cursor-default select-none ${pillClassName}`}
        style={pillStyle}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onClick={() => setOpen((prev) => !prev)}
      >
        {code}
      </span>
      <div
        className={`absolute z-30 left-0 mt-2 min-w-[220px] max-w-xs rounded-xl border border-[var(--border-muted)] bg-[var(--bg-surface)] shadow-lg transition duration-150 ${
          open ? "opacity-100 translate-y-0" : "pointer-events-none opacity-0 -translate-y-1"
        }`}
      >
        <div className="px-3 py-2">
          <p className="text-sm font-semibold text-[var(--text-color)] m-0">{title || code}</p>
          <p className="text-xs text-[var(--text-muted)] m-0">{subtitle}</p>
        </div>
      </div>
    </span>
  );
}
