import { postMethod } from "./api";
import HTTPError from "./httpError";

const modelType = {
  unordered: "unordered",
  ordered: "ordered",
} as const;

type ModelType = keyof typeof modelType;

interface Data {
  codes: string[];
  model_type: ModelType;
}

interface Identificator {
  task_id: string;
}

export class DataSender {
  private data: Data;
  private disease: string;
  private modelID: string | null;
  private predictionType: "patient" | "dataset";
  public id: string | null = null;
  public message: string | null = null;

  constructor(
    codes: string[],
    modelID: string | null,
    predictionType: "patient" | "dataset" = "patient"
  ) {
    this.data = {
      codes: codes,
      model_type: "unordered",
    };
    this.modelID = modelID;
    this.predictionType = predictionType;
    this.disease = "lung-cancer";
  }

  public async postData() {
    return postMethod<Identificator>(
      `/prediction/${this.predictionType}?model_id=${this.modelID}`,
      this.data
    )
      .then((response) => {
        console.log(response);
        const indentificator = response as Identificator;
        console.log(indentificator);
        this.id = indentificator.task_id;
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

export interface CodeInfo {
  code: string;
  name: string;
  specialty: string;
  tfidf_label_0?: number;
  tfidf_label_1?: number;
  frequency?: number;
}
