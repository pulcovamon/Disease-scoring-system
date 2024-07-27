import { getMethod, postMethod } from "./api";
import HTTPError from "./errors/httpError";

export interface Task {
    "status": string;
    "result": number|null;
    "task_id": string;
    "disease": string|null;
}

export class Result {
    public id: string;
    public value: number|null;
    public diseaseName: string|null;

    constructor(id: string) {
        this.id = id;
        this.value = null;
        this.diseaseName = null;
    }

    public async getResult() {
        try {
            return getMethod<Task>(this.id)
                .then(response => {
                    return response as Task;
                })
        }
        catch (error) {
            if (error instanceof HTTPError) {
                console.error(error.message);
            } else {
                console.error(error);
            }
        }
    }
}

export interface Code {
    name: string
    value: string
}

export class Codes {
    private codes: string[];

    constructor(codes: string[]) {
        this.codes = codes;
    }
    
}