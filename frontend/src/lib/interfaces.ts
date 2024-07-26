import { getMethod, postMethod } from "./api";
import HTTPError from "./errors/httpError";

export interface ResultData {
    diseaseName: string
    value: number
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
            return getMethod<ResultData>(this.id)
                .then(response => {
                    return response as ResultData;
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