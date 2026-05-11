import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useState, useEffect, FormEvent } from "react";
import { Patient } from "../classes/patient";
import { faUser } from "@fortawesome/free-solid-svg-icons";
import { useTranslations } from "../i18n/useTranslations";
import { getMethod } from "../classes/api";

interface NewPatientData {
  patient: Patient;
  handlePatientChange: (patient: Patient) => void;
  unallowed: boolean
}

export function NewPatient({ patient, handlePatientChange, unallowed }: NewPatientData) {
  const [name, setName] = useState<string>(patient.name);
  const [surname, setSurname] = useState<string>(patient.surname);
  const [patients, setPatients] = useState<Patient[]>([]);
  const { t } = useTranslations();

  useEffect(() => {
    getMethod<{ id: number; name: string; surname: string | null }[]>("/auth/patient")
      .then((data) => {
        const fetched: Patient[] = data.map((p) => ({
          id: String(p.id),
          name: p.name,
          surname: p.surname ?? "",
        }));
        setPatients([{ id: null, name: "", surname: "" }, ...fetched]);
      })
      .catch(() => {
        setPatients([{ id: null, name: "", surname: "" }]);
      });
  }, []);

  function handleNameChange(e: FormEvent<HTMLInputElement>) {
    setName(e.currentTarget.value);
    handlePatientChange({ ...patient, name: e.currentTarget.value });
  }

  function handleSurnameChange(e: FormEvent<HTMLInputElement>) {
    setSurname(e.currentTarget.value);
    handlePatientChange({ ...patient, surname: e.currentTarget.value });
  }

  function handleCurrentPatientChange(e: FormEvent<HTMLSelectElement>) {
    e.preventDefault();
    const currentPatient = patients.filter((p) => {
      if (e.currentTarget.value === "new") {
        return p.id === null;
      } else {
        return e.currentTarget.value === p.id;
      }
    })[0];
    setName(currentPatient.name);
    setSurname(currentPatient.surname);
    handlePatientChange(currentPatient);
  }

  return (
    <div className="flex flex-col gap-4 w-full">
      <div className="flex items-center gap-2">
        <FontAwesomeIcon icon={faUser} className="text-[var(--primary)] w-4 h-4 shrink-0" />
        <h4 className="text-lg font-semibold mb-0! leading-none text-(--text-color)">{t("form.patient.title", "Patient")}</h4>
      </div>

      <div className="space-y-3">
        <label className="text-sm text-[var(--text-muted)] font-medium">{t("form.patient.select", "Select patient")}</label>
        <select
          className="w-full rounded-xl border border-[var(--border-muted)] bg-[var(--bg-surface)] px-3 py-3 text-[var(--text-color)] placeholder:text-[var(--text-muted)]/70 focus:border-[var(--primary)] focus:outline-none transition"
          onChange={(e) => handleCurrentPatientChange(e)}
          value={patient.id === null ? "new" : patient.id}
        >
          {patients.map((currentPatient) => {
            const value = currentPatient.id
              ? `${currentPatient.name} ${currentPatient.surname}`
              : t("form.patient.new", "New patient");
            return (
              <option
                key={currentPatient.id}
                value={currentPatient.id === null ? "new" : currentPatient.id}
              >
                {value}
              </option>
            );
          })}
        </select>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm text-[var(--text-muted)] font-medium">{t("form.patient.name", "Name *")}</label>
          <input
            className={`w-full rounded-xl border px-3 py-3 bg-[var(--bg-surface)] text-[var(--text-color)] placeholder:text-[var(--text-muted)]/70 focus:border-[var(--primary)] focus:outline-none transition ${
              unallowed && name === "" ? "border-red-400" : "border-[var(--border-muted)]"
            }`}
            type="text"
            value={name}
            placeholder="Enter name"
            onChange={(e) => handleNameChange(e)}
            disabled={patient.id !== null}
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm text-[var(--text-muted)] font-medium">{t("form.patient.surname", "Surname")}</label>
          <input
            className="w-full rounded-xl border border-[var(--border-muted)] px-3 py-3 bg-[var(--bg-surface)] text-[var(--text-color)] placeholder:text-[var(--text-muted)]/70 focus:border-[var(--primary)] focus:outline-none transition"
            type="text"
            value={surname}
            placeholder="Enter surname"
            onChange={(e) => handleSurnameChange(e)}
            disabled={patient.id !== null}
          />
        </div>
      </div>
    </div>
  );
}
