import React, { useState, useEffect } from "react";

interface FilteringProps<T> {
  label: string;
  value: T | undefined;
  handleSubmit: (value: T | undefined) => void;
  placeholder?: string;
}

export default function Filtering<T>({
  label,
  value,
  handleSubmit,
  placeholder,
}: FilteringProps<T>) {
  const [inputValue, setInputValue] = useState<T | undefined>(value);

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    handleSubmit(inputValue);
  }

  function onChange(event: React.ChangeEvent<HTMLInputElement>) {
    const newValue = event.target.value;

    if (typeof value === "number") {
      setInputValue(newValue ? (parseInt(newValue, 10) as T) : undefined);
    } else {
      setInputValue(newValue as T);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-2">
      <label className="text-sm text-[var(--text-muted)] font-medium">{label}</label>
      <div className="flex items-center gap-2">
        <input
          id="patient-id-input"
          type={typeof value === "number" ? "number" : "text"}
          min={typeof value === "number" ? "1" : undefined}
          value={inputValue === undefined ? "" : (inputValue as string)}
          placeholder={placeholder}
          onChange={onChange}
          className="w-full rounded-xl border border-[var(--border-muted)] bg-[var(--bg-surface)] px-3 py-2 text-[var(--text-color)] placeholder:text-[var(--text-muted)]/70 focus:border-[var(--primary)] focus:outline-none transition"
        />
        <button
          id="patient-id-submit"
          type="submit"
          className="px-3 py-2 rounded-lg bg-[var(--primary)] text-white text-sm font-semibold hover:bg-[var(--primary-hover)] transition shadow"
        >
          Search
        </button>
      </div>
    </form>
  );
}
