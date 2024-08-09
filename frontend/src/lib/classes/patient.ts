import { getMethod } from "./api";
import HTTPError from "./httpError";

interface ActivePhase {
    ground_truth: boolean[];
    prediction: boolean[];
}

interface Icd10 {
    ground_truth: string[];
    prediction: string[];
}

export interface Patient {
    catalog_id: number;
    codes: string[];
    active_phase: ActivePhase;
    icd10_multiclass: Icd10;
    icd10_binary: Icd10
}

export  class PatientDetail {
    private id: number | null = null;
    public patient: Patient | null = null;
    public message: string | null = null;

    public constructor(id: number) {
      this.id = id;
    }

    public async getPatient() {
      return getMethod<Patient>(`/catalog/lung-cancer/${this.id}`)
        .then((response) => {
          this.patient = response;
        })
        .catch((error) => {
          if (error instanceof HTTPError) {
              this.message = error.getMessage();
              console.error(error.getMessage());
            } else {
              this.message = "An error occured.";
              console.error(error);
            }
        })
  }
}

export class PatientList {
    public patients: number[] = [];
    public message: string | null = null;

    public async getPatients() {
        return getMethod<number[]>("/catalog/lung-cancer")
          .then((response) => {
            this.patients = response;
          })
          .catch((error) => {
            if (error instanceof HTTPError) {
                this.message = error.getMessage();
                console.error(error.getMessage());
              } else {
                this.message = "An error occured.";
                console.error(error);
              }
          })
    }
}