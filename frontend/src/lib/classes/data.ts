import { postMethod } from "./api";
import HTTPError from "./httpError";

export interface Code {
    name: string
    value: string
}

const modelType = {
    unordered: "unordered",
    ordered: "ordered"
} as const;

type ModelType = keyof typeof modelType;

interface Data {
    codes: string[];
    model_type: ModelType;
}

interface Identificator {
    detail: string;
}

export class DataSender {
    private data: Data;
    private disease: string;
    public id: string|null = null;
    public message: string|null = null;

    constructor(codes: string[]) {
        this.data = {
            codes: codes,
            model_type: "unordered",
        }
        this.disease = "lung_cancer";
    }
    
    public async postData() {
        return postMethod<Identificator>(this.disease, this.data)
            .then((response) => {
                const indentificator = response as Identificator;
                this.id = indentificator.detail;
            })
            .catch (error => {
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