import { useEffect, useRef, useState } from "react"

type Option = { value: string; label: string }

type CreatableSelectProps = {
  value: string
  onChange: (value: string) => void
  options: Option[]
  addLabel?: string
  placeholder?: string
}

const CUSTOM_SENTINEL = "__custom__"

export default function CreatableSelect({
  value,
  onChange,
  options,
  addLabel = "+ Add custom…",
  placeholder = "",
}: CreatableSelectProps) {
  const isKnown = options.some(o => o.value === value)
  const [customMode, setCustomMode] = useState(!isKnown && value !== "")
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (customMode) inputRef.current?.focus()
  }, [customMode])

  const selectValue = customMode ? CUSTOM_SENTINEL : value

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
      <select
        value={selectValue}
        onChange={e => {
          if (e.target.value === CUSTOM_SENTINEL) {
            setCustomMode(true)
            onChange("")
          } else {
            setCustomMode(false)
            onChange(e.target.value)
          }
        }}
      >
        <option value="" disabled>{placeholder}</option>
        {options.map(o => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
        <option value={CUSTOM_SENTINEL}>{addLabel}</option>
      </select>

      {customMode && (
        <div style={{ display: "flex", gap: "0.4rem", alignItems: "center" }}>
          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={e => onChange(e.target.value)}
            placeholder={placeholder}
            style={{ flex: 1 }}
          />
          <button
            type="button"
            onClick={() => {
              setCustomMode(false)
              onChange(options[0]?.value ?? "")
            }}
            style={{
              background: "none",
              border: "none",
              color: "var(--text-muted)",
              cursor: "pointer",
              fontSize: "0.8rem",
              padding: "0 4px",
              flexShrink: 0,
            }}
            title="Back to list"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  )
}
