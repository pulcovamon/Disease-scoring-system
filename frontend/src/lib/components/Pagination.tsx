import {
  faAngleLeft,
  faAngleRight,
  faAnglesLeft,
  faAnglesRight,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React, { useMemo, useState } from "react";

export default function Pagination({
  currentPage,
  handlePageChange,
  totalPages,
}: {
  currentPage: number;
  handlePageChange: (page: number) => void;
  totalPages: number;
}) {
  const [inputPage, setInputPage] = useState<string>(currentPage.toString());

  const onJump = (e: React.FormEvent) => {
    e.preventDefault();
    const pageNum = Number(inputPage);
    if (!Number.isFinite(pageNum)) return;
    const target = Math.min(Math.max(1, pageNum), totalPages);
    handlePageChange(target);
  };

  React.useEffect(() => {
    setInputPage(currentPage.toString());
  }, [currentPage]);
  const pageNumbers = useMemo(() => {
    return [...Array(totalPages).keys()].map((number) => {
      number++;
      if (number === currentPage) {
        return (
          <span
            key={number}
            className="min-w-8 px-3 py-2 rounded-full bg-[var(--primary)] text-white font-semibold shadow-sm"
          >
            {number}
          </span>
        );
      } else if (
        number === 1 ||
        number === totalPages ||
        (number - currentPage < 3 && currentPage - number < 3)
      ) {
        return (
          <span
            key={number}
            role="button"
            tabIndex={0}
            onClick={() => handlePageChange(number)}
            onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && handlePageChange(number)}
            className="min-w-8 px-3 py-2 rounded-full bg-[var(--bg-surface-muted)] text-[var(--text-color)] hover:bg-[var(--bg-surface)] border border-transparent hover:border-[var(--primary)] transition cursor-pointer select-none"
          >
            {number}
          </span>
        );
      } else if (number === currentPage - 3 || number === currentPage + 3) {
        return (
          <span key={number} className="px-2 py-2 text-[var(--text-muted)]">
            …
          </span>
        );
      }
      return null;
    });
  }, [totalPages, currentPage, handlePageChange]);

  const onNext = () => {
    if (currentPage < totalPages) {
      handlePageChange(currentPage + 1);
    }
  };

  const onPrevious = () => {
    if (currentPage > 1) {
      handlePageChange(currentPage - 1);
    }
  };

  const onFirst = () => {
    handlePageChange(1);
  };

  const onLast = () => {
    handlePageChange(totalPages);
  };

  if (totalPages === 1) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center gap-3 justify-center sm:justify-between">
      <div className="flex items-center gap-1">
        <PageControl icon={faAnglesLeft} disabled={currentPage <= 1} onClick={onFirst} label="First page" />
        <PageControl icon={faAngleLeft} disabled={currentPage <= 1} onClick={onPrevious} label="Previous page" />
      </div>
      <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-[var(--bg-surface-muted)] border border-[var(--border-muted)] text-sm">
        {pageNumbers}
      </div>
      <div className="flex items-center gap-1">
        <PageControl icon={faAngleRight} disabled={currentPage >= totalPages} onClick={onNext} label="Next page" />
        <PageControl icon={faAnglesRight} disabled={currentPage >= totalPages} onClick={onLast} label="Last page" />
      </div>
      <form onSubmit={onJump} className="inline-flex items-center gap-2 text-sm text-[var(--text-muted)] whitespace-nowrap">
        <span>Go to</span>
        <input
          type="number"
          min={1}
          max={totalPages}
          value={inputPage}
          onChange={(e) => setInputPage(e.target.value)}
          className="w-14 rounded-lg border border-[var(--border-muted)] bg-[var(--bg-surface)] px-2 py-1 text-[var(--text-color)] focus:border-[var(--primary)] focus:outline-none"
        />
        <span>/ {totalPages}</span>
      </form>
    </div>
  );
}

function PageControl({
  icon,
  disabled,
  onClick,
  label,
}: {
  icon: any;
  disabled: boolean;
  onClick: () => void;
  label: string;
}) {
  const handleKey = (e: React.KeyboardEvent<HTMLSpanElement>) => {
    if (disabled) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onClick();
    }
  };
  return (
    <span
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-label={label}
      onClick={() => !disabled && onClick()}
      onKeyDown={handleKey}
      className={`h-9 w-9 inline-flex items-center justify-center rounded-full border transition select-none ${
        disabled
          ? "border-[var(--border-muted)] text-[var(--text-muted)] opacity-40 cursor-not-allowed"
          : "border-[var(--border-muted)] bg-[var(--bg-surface)] text-[var(--text-color)] hover:border-[var(--primary)] hover:text-[var(--primary)] cursor-pointer"
      }`}
    >
      <FontAwesomeIcon icon={icon} />
    </span>
  );
}
