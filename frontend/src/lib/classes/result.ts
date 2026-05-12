import { getMethod } from "./api";
import HTTPError from "./httpError";

export interface BulkPrediction {
  id: string | number;
  prediction: number;
  codes?: string[];
}

export interface ModelMetrics {
  accuracy?: number | null;
  precision?: number | null;
  recall?: number | null;
  f1?: number | null;
  roc_auc?: number | null;
}

export interface ModelInfo {
  name: string | null;
  model_type: string | null;
  algorithm: string | null;
  summary: string | null;
  recommended: boolean;
  metrics: ModelMetrics | null;
}

export interface PatientInfo {
  id: number | null;
  name: string | null;
  surname: string | null;
}

export interface Task {
  status: string;
  result: number | null;
  result_type: "single" | "bulk" | null;
  predictions: BulkPrediction[] | null;
  task_id: string;
  disease: string | null;
  model_info: ModelInfo | null;
  patient: PatientInfo | null;
  codes: string[] | null;
  is_example?: boolean | null;
  error?: string | null;
  created_at?: string | null;
}

export class Results {
  public tasks: Task[] = [];
  public message: string | null = null;

  public async getAllResults() {
    return getMethod<Task[]>("/prediction/result")
      .then((response) => {
        const tasks = response as Task[];
        this.tasks = tasks.map((task) => ({
          status: task.status,
          result: task.result,
          result_type: task.result_type ?? null,
          predictions: task.predictions ?? null,
          task_id: task.task_id,
          disease: task.disease,
          model_info: task.model_info ?? null,
          patient: task.patient ?? null,
          codes: task.codes ?? null,
          is_example: task.is_example ?? false,
          created_at: task.created_at ?? null,
          error: task.error ?? null,
        }));
      })
      .catch((error) => {
        if (error instanceof HTTPError) {
          this.message = error.getMessage();
          console.error(error.getMessage());
        } else {
          this.message = "An error occurred.";
          console.error(error);
        }
      });
  }

  public async getTaskById(taskId: string): Promise<Task> {
    try {
      const task = await getMethod<Task>(`/prediction/result/${taskId}`);
      return task;
    } catch (error) {
      console.error(`Failed to fetch task with ID ${taskId}:`, error);
      throw error;
    }
  }

  public getCompletedTasks(): Task[] {
    return this.tasks.filter((task) => task.status === "SUCCESS");
  }

  public getFailedTasks(): Task[] {
    return this.tasks.filter((task) => task.status === "FAILURE");
  }

  public getPendingTasks(): Task[] {
    return this.tasks.filter((task) => task.status === "PENDING");
  }
}
