import { getMethod } from "./api";
import HTTPError from "./httpError";

interface PredictionData {
  ground_truth: (string | number | boolean)[];
  prediction: (string | number | boolean)[];
}

interface ActivePhase extends PredictionData {}
interface Icd10 extends PredictionData {}

export interface Summary {
  active_phase: number;
  icd10_multiclass: number;
  icd10_binary: number;
}

export interface Patient {
  _id: number;
  codes: string[];
  active_phase: ActivePhase;
  icd10_multiclass: Icd10;
  icd10_binary: Icd10;
  summary?: Summary
}

export class PatientDetail {
  private _id: number | null = null;
  public patient: Patient | null = null;
  public message: string | null = null;

  public constructor(id: number) {
    this._id = id;
  }

  public async getPatient(): Promise<void> {
    return getMethod<Patient>(`/catalog/lung-cancer/${this._id}`)
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
  public totalPatients: number = 0;

  public async getNumberOfPatients(code?: string): Promise<void> {
    return getMethod<number>("/catalog/size", code ? {"code": code} : {} )
    .then((response) => {
      this.totalPatients = response;
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

  public async getPatients(queryParams?: { limit?: number; skip?: number; code?: string; id?: string | number }): Promise<void> {
    let url = "/catalog/lung-cancer/";
    if (queryParams && queryParams.id !== undefined) {
      url += queryParams.id;
      queryParams.id = undefined;
    }
    return getMethod<Patient[] | Patient>(url, queryParams || {})
      .then((response) => {
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

export const getPatientsSummary = (patient: Patient): Summary => {
  const calculateAccuracy = (groundTruth: (string | number | boolean)[], prediction: (string | number | boolean)[]): number => {
    if (!groundTruth || !prediction || groundTruth.length === 0 || groundTruth.length !== prediction.length) {
      return 0;
    }
    
    // Convert everything to strings for comparison to handle mixed types
    const gtStrings = groundTruth.map(String);
    const predStrings = prediction.map(String);
    
    const correct = gtStrings.filter((val, idx) => val === predStrings[idx]).length;
    return Math.round((correct / groundTruth.length) * 100);
  };

  return {
    active_phase: calculateAccuracy(patient.active_phase.ground_truth, patient.active_phase.prediction),
    icd10_binary: calculateAccuracy(patient.icd10_binary.ground_truth, patient.icd10_binary.prediction),
    icd10_multiclass: calculateAccuracy(patient.icd10_multiclass.ground_truth, patient.icd10_multiclass.prediction),
  }
}
