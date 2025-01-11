import React, { useState } from "react";

interface FilteringProps<T> {
  label: string;
  value: T | undefined;
  handleSubmit: (value: T | undefined) => void;
}

export default function Filtering<T>({
  label,
  value,
  handleSubmit,
}: FilteringProps<T>) {
  const [inputValue, setInputValue] = useState<T | undefined>(value);

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    handleSubmit(inputValue);
  }

  function onChange(event: React.ChangeEvent<HTMLInputElement>) {
    const inputValue = event.target.value;

    if (typeof value === "number") {
        setInputValue(inputValue ? parseInt(inputValue, 10) as T : undefined);
    } else {
        setInputValue(inputValue as T);
    }
  }

  return (
    <div>
      <form onSubmit={onSubmit}>
        <label>{label}</label>
        <input
          id="patient-id-input"
          type={typeof value === "number" ? "number" : "text"}
          min={typeof value === "number" ? "1" : undefined}
          value={typeof value === "number" ? value as number : value as string ?? undefined}
          onChange={onChange}
        />
        <input id="patient-id-submit" type="submit" value="Search" />
      </form>
    </div>
  );
}
