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
    id: number;
    codes: string[];
    active_pahse: ActivePhase;
    icd10_multiclass: Icd10;
    icd10_binary: Icd10
}

export  class PatientDetail {
    public patient: Patient | null = null;
    public message: string | null = null;
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