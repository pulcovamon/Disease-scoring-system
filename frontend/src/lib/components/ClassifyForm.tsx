import { faFloppyDisk, faNotesMedical, faPen } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { ChangeEvent, useState, KeyboardEvent } from "react";

export function ClasifyForm({
  codes,
  handleAddCode,
  handleUpdateCode,
  unallowed
}: {
  codes: string[];
  handleAddCode: (code: string) => void;
  handleUpdateCode: (index: number, newCode: string) => void;
  unallowed: boolean
}) {
  const [newCode, setNewCode] = useState("");
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [editValue, setEditValue] = useState<string>("");

  function handleInputChange(event: ChangeEvent<HTMLInputElement>) {
    setNewCode(event.target.value);
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

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2 text-[var(--text-color)]">
        <FontAwesomeIcon icon={faNotesMedical} className="text-[var(--primary)]" />
        <h4 className="text-lg font-semibold m-0">Medical codes sequence</h4>
      </div>
      <div className="space-y-3">
        <label className="text-sm text-[var(--text-muted)] font-medium">Codes</label>
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
                  <button className="text-sm px-3 py-1 rounded-md bg-[var(--primary)] text-white shadow hover:bg-[var(--primary-hover)]" onClick={handleSaveEdit}>
                    <FontAwesomeIcon icon={faFloppyDisk} />
                  </button>
                </>
              ) : (
                <>
                  <span className="text-sm font-semibold text-[var(--text-color)]">{code}</span>
                  <button
                    className="text-[var(--primary)] hover:text-[var(--primary-hover)] transition"
                    onClick={() => handleEditCode(index)}
                    aria-label="Edit code"
                  >
                    <FontAwesomeIcon icon={faPen} />
                  </button>
                </>
              )}
            </div>
          ))}
        </div>
        <input
          type="text"
          value={newCode}
          onChange={handleInputChange}
          onKeyDown={handleKeyPress}
          placeholder="Add a new code and press Enter"
          className={`w-full rounded-xl border px-3 py-3 bg-[var(--bg-surface)] text-[var(--text-color)] placeholder:text-[var(--text-muted)]/70 focus:border-[var(--primary)] focus:outline-none transition ${
            unallowed && codes.length === 0 ? "border-red-400" : "border-[var(--border-muted)]"
          }`}
        />
        <p className="text-xs text-[var(--text-muted)]">Enter code and press Enter to add it.</p>
      </div>
    </div>
  );
}
