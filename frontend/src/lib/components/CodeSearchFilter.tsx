import { useEffect, useRef, useState } from "react";
import { useCodeSearch } from "../hooks/useCodeSearch";

type CodeSearchFilterProps = {
  label: string;
  value?: string;
  placeholder?: string;
  handleSubmit: (value: string | undefined) => void;
};

export default function CodeSearchFilter({
  label,
  value,
  placeholder,
  handleSubmit,
}: CodeSearchFilterProps) {
  const [inputValue, setInputValue] = useState<string>(value ?? "");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const blurTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { results, loading, error, hasQuery } = useCodeSearch(inputValue, { debounceMs: 200, limit: 20 });

  useEffect(() => {
    setInputValue(value ?? "");
  }, [value]);

  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    handleSelect(inputValue);
  };

  const handleSelect = (code?: string) => {
    const normalized = code?.trim() || undefined;
    setInputValue(normalized || "");
    handleSubmit(normalized);
    setShowSuggestions(false);
  };

  const onInputFocus = () => {
    if (blurTimeout.current) clearTimeout(blurTimeout.current);
    setShowSuggestions(true);
  };

  const onInputBlur = () => {
    blurTimeout.current = setTimeout(() => setShowSuggestions(false), 150);
  };

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-2 relative">
      <label className="text-sm text-[var(--text-muted)] font-medium">{label}</label>
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={inputValue}
          placeholder={placeholder}
          onFocus={onInputFocus}
          onBlur={onInputBlur}
          onChange={(event) => setInputValue(event.target.value)}
          className="w-full rounded-xl border border-[var(--border-muted)] bg-[var(--bg-surface)] px-3 py-2 text-[var(--text-color)] placeholder:text-[var(--text-muted)]/70 focus:border-[var(--primary)] focus:outline-none transition"
        />
        <button
          type="submit"
          className="px-3 py-2 rounded-lg bg-[var(--primary)] text-white text-sm font-semibold hover:bg-[var(--primary-hover)] transition shadow"
        >
          Search
        </button>
      </div>

      {showSuggestions && hasQuery && (
        <div className="absolute top-full mt-2 w-full z-20 rounded-xl border border-[var(--border-muted)] bg-[var(--bg-surface)] shadow-lg">
          {loading && (
            <div className="px-3 py-2 text-sm text-[var(--text-muted)]">Loading…</div>
          )}
          {!loading && error && (
            <div className="px-3 py-2 text-sm text-red-500">Failed to search codes.</div>
          )}
          {!loading && !error && results.length === 0 && (
            <div className="px-3 py-2 text-sm text-[var(--text-muted)]">No matches</div>
          )}
          {!loading && !error && results.length > 0 && (
            <ul className="max-h-64 overflow-auto divide-y divide-[var(--border-muted)]">
              {results.map((item) => (
                <li
                  key={item.code}
                  className="px-3 py-2 hover:bg-[var(--bg-surface-muted)] cursor-pointer"
                  onMouseDown={(event) => {
                    event.preventDefault();
                    handleSelect(item.code);
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
    </form>
  );
}
