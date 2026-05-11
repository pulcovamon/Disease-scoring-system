import { faFloppyDisk, faNotesMedical, faPen, faTrash, faXmark } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { ChangeEvent, useEffect, useRef, useState, KeyboardEvent } from "react";
import { useTranslations } from "../i18n/useTranslations";
import { useCodeSearch } from "../hooks/useCodeSearch";
import { CodeBadge } from "./CodeBadge";

export function ClasifyForm({
  codes,
  handleAddCode,
  handleUpdateCode,
  handleRemoveCode,
  handleLoadPreset,
  unallowed
}: {
  codes: string[];
  handleAddCode: (code: string) => void;
  handleUpdateCode: (index: number, newCode: string) => void;
  handleRemoveCode: (index: number) => void;
  handleLoadPreset?: (codes: string[]) => void;
  unallowed: boolean
}) {
  const [newCode, setNewCode] = useState("");
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [editValue, setEditValue] = useState<string>("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const blurTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { t } = useTranslations();
  const { results, loading, error, hasQuery } = useCodeSearch(newCode, { debounceMs: 150, limit: 20 });

  function handleInputChange(event: ChangeEvent<HTMLInputElement>) {
    const value = event.target.value;
    setNewCode(value);
    if (value.trim()) setShowSuggestions(true);
  }

  function handleKeyPress(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter" && newCode.trim()) {
      handleAddCode(newCode.trim());
      setNewCode("");
      event.preventDefault();
    }
  }

  function handleEditCode(index: number) {
    setEditIndex(index);
    setEditValue(codes[index]);
  }

  function handleSaveEdit() {
    if (editIndex !== null && editValue.trim()) {
      handleUpdateCode(editIndex, editValue.trim());
      setEditIndex(null);
      setEditValue("");
    }
  }

  function handleEditChange(event: ChangeEvent<HTMLInputElement>) {
    setEditValue(event.target.value);
  }

  function handleSelectSuggestion(codeValue: string) {
    const normalized = codeValue.trim();
    if (!normalized) return;
    handleAddCode(normalized);
    setNewCode("");
    setShowSuggestions(false);
  }

  useEffect(() => {
    return () => {
      if (blurTimeout.current) clearTimeout(blurTimeout.current);
    };
  }, []);

  return (
    <div className="flex flex-col gap-4 w-full">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <FontAwesomeIcon icon={faNotesMedical} className="text-[var(--primary)] w-4 h-4 shrink-0" />
          <h4 className="text-lg font-semibold m-0 leading-none text-[var(--text-color)]">{t("form.codes.title", "Medical codes sequence")}</h4>
        </div>
        {codes.length > 0 && handleLoadPreset && (
          <button
            type="button"
            onClick={() => handleLoadPreset([])}
            className="flex bg-transparent items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg border border-red-300 dark:border-red-700 text-red-500 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/80 transition shrink-0"
          >
            <FontAwesomeIcon icon={faTrash} />
            {t("form.codes.clearAll", "Clear all")}
          </button>
        )}
      </div>
      <div className="space-y-3">
        <div className="flex flex-wrap gap-2">
          {codes.map((code, index) => (
            <div
              key={index}
              className="flex items-center gap-2 px-3 py-2 rounded-lg border border-[var(--border-muted)] bg-[var(--bg-surface-muted)]"
            >
              {editIndex === index ? (
                <>
                  <input
                    className="rounded-md border border-[var(--border-muted)] px-2 py-1 text-sm bg-[var(--bg-surface)] text-[var(--text-color)] placeholder:text-[var(--text-muted)]/70 focus:border-[var(--primary)] focus:outline-none"
                    type="text"
                    value={editValue}
                    placeholder="Enter code"
                    onChange={handleEditChange}
                    onKeyDown={(e) => e.key === "Enter" && handleSaveEdit()}
                  />
                  <button
                    type="button"
                    className="text-sm px-3 py-1 rounded-md bg-[var(--primary)] text-white shadow hover:bg-[var(--primary-hover)]"
                    onClick={handleSaveEdit}
                  >
                    <FontAwesomeIcon icon={faFloppyDisk} />
                  </button>
                  <button
                    type="button"
                    className="p-2 rounded-full border-0 bg-transparent text-[var(--text-muted)] hover:text-red-500 hover:bg-[var(--bg-surface-muted)] transition-colors focus:outline-none focus:ring-2 focus:ring-red-400"
                    onClick={() => handleRemoveCode(index)}
                    aria-label="Remove code"
                  >
                    <FontAwesomeIcon icon={faXmark} />
                  </button>
                </>
              ) : (
                <>
                  <CodeBadge
                    code={code}
                    pillClassName="border-0 bg-transparent px-0 py-0 text-sm font-semibold text-[var(--text-color)]"
                  />
                  <div className="flex items-center gap-2">
                    <span
                      role="button"
                      tabIndex={0}
                      className="inline-flex items-center justify-center p-2 rounded-full text-[var(--text-muted)] hover:text-[var(--primary)] hover:bg-[var(--bg-surface-muted)] transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                      onClick={() => handleEditCode(index)}
                      onKeyDown={(e) => e.key === "Enter" && handleEditCode(index)}
                      aria-label="Edit code"
                    >
                      <FontAwesomeIcon icon={faPen} />
                    </span>
                    <span
                      role="button"
                      tabIndex={0}
                      className="inline-flex items-center justify-center p-2 rounded-full text-[var(--text-muted)] hover:text-red-500 hover:bg-[var(--bg-surface-muted)] transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-red-400"
                      onClick={() => handleRemoveCode(index)}
                      onKeyDown={(e) => e.key === "Enter" && handleRemoveCode(index)}
                      aria-label="Remove code"
                    >
                      <FontAwesomeIcon icon={faXmark} />
                    </span>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
        <div className="relative">
          <input
            type="text"
            value={newCode}
            onChange={handleInputChange}
            onFocus={() => {
              if (blurTimeout.current) clearTimeout(blurTimeout.current);
              setShowSuggestions(true);
            }}
            onBlur={() => {
              blurTimeout.current = setTimeout(() => setShowSuggestions(false), 120);
            }}
            onKeyDown={handleKeyPress}
            placeholder={t("form.codes.addPlaceholder", "Add a new code and press Enter")}
            className={`w-full rounded-xl border px-3 py-3 bg-[var(--bg-surface)] text-[var(--text-color)] placeholder:text-[var(--text-muted)]/70 focus:border-[var(--primary)] focus:outline-none transition ${
              unallowed && codes.length === 0 ? "border-red-400" : "border-[var(--border-muted)]"
            }`}
          />

          {showSuggestions && hasQuery && (
            <div className="absolute left-0 right-0 mt-2 rounded-xl border border-[var(--border-muted)] bg-[var(--bg-surface)] shadow-lg z-20">
              {loading && (
                <div className="px-3 py-2 text-sm text-[var(--text-muted)]">{t("common.loading", "Loading…")}</div>
              )}
              {!loading && error && (
                <div className="px-3 py-2 text-sm text-red-500">{t("codes.search.error", "Failed to search codes.")}</div>
              )}
              {!loading && !error && results.length === 0 && (
                <div className="px-3 py-2 text-sm text-[var(--text-muted)]">{t("codes.search.empty", "No matching codes")}</div>
              )}
              {!loading && !error && results.length > 0 && (
                <ul className="max-h-64 overflow-auto divide-y divide-[var(--border-muted)]">
                  {results.map((item) => (
                    <li
                      key={item.code}
                      className="px-3 py-2 hover:bg-[var(--bg-surface-muted)] cursor-pointer"
                      onMouseDown={(event) => {
                        event.preventDefault();
                        handleSelectSuggestion(item.code);
                      }}
                    >
                      <div className="flex items-center justify-between text-sm text-[var(--text-color)]">
                        <span className="font-semibold">{item.code}</span>
                        {item.specialty && (
                          <span className="text-xs text-[var(--text-muted)]">{item.specialty}</span>
                        )}
                      </div>
                      {item.name && (
                        <p className="text-xs text-[var(--text-muted)] mt-1 truncate">{item.name}</p>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
        <p className="text-xs text-[var(--text-muted)]">{t("form.codes.help", "Type a code, Czech procedure name, or medical specialty — suggestions appear automatically. Press Enter to add.")}</p>
      </div>
    </div>
  );
}
