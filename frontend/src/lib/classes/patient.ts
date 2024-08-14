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
  icd10_binary: Icd10;
}

export class PatientDetail {
  private id: number | null = null;
  public patient: Patient | null = null;
  public message: string | null = null;

  public constructor(id: number) {
    this.id = id;
  }

  public async getPatient(): Promise<void> {
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
      });
  }
}

export class PatientList {
  public patients: Patient[] = [];
  public message: string | null = null;

  public async getPatients(id: string): Promise<void>;
  public async getPatients(id?: number, limit?: number): Promise<void>;
  public async getPatients(
    id?: string | number,
    limit?: number
  ): Promise<void> {
    let url = "/catalog/lung-cancer/";
    let queryParams = {};
    if (typeof id === "string") {
      url += id;
    } else {
      if (id && limit) {
        queryParams = {
          skip: (id as number) * limit - limit,
          limit: limit,
        };
      }
    }
    return getMethod<Patient[] | Patient>(url, queryParams || {})
      .then((response) => {
        console.log(response)
        this.patients = Array.isArray(response) ? response : [response];
      })
      .catch((error) => {
        if (error instanceof HTTPError) {
          this.message = error.getMessage();
          console.error(error.getMessage());
        } else {
          this.message = "An error occured.";
          console.error(error);
        }
      });
  }
}
