import { getMethod, postMethod } from "./api";
import HTTPError from "./httpError";

interface Task {
    status: string;
    result: number|null;
    task_id: string;
    disease: string|null;
}

export class Result {
    public id: string;
    public value: number|null = null;
    public diseaseName: string|null = null;
    public message: string|null = null;

    constructor(id: string) {
        this.id = id;
    }

    public async getResult() {
        return getMethod<Task>(this.id)
            .then(response => {
                const task = response as Task;
                switch (task.status) {
                    case "SUCCESS":
                        this.value = task.result;
                        this.diseaseName = task.disease;
                        break;
                    case "SENT":
                        this.message = "Your request is pending, please try it later.";
                        break;
                    case "FAILURE":
                        this.message = "An error occured during computation.";
                        break;
                    default:
                        this.message = `Your request is in ${task.status} state.`;
                }
            })
            .catch (error => {
                if (error instanceof HTTPError) {
                    this.message = error.message;
                    console.error(error.message);
                } else {
                    this.message = "An error occured.";
                    console.error(error);
                }
            })
        }
}
