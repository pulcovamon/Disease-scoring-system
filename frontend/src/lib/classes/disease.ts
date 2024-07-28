export interface Code {
    name: string;
    value: string;
  }
  
  interface Disease {
    name: string;
    codes: Code[];
  }
  
  export enum DiseaseType {
    LungCancer = "lung_cancer",
    MultipleSclerosis = "multiple_sclerosis",
    HidradenitisSuppurativa = "hidradentis-supporativa"
  }
  
  export const diseases: Record<DiseaseType, Disease> = {
    [DiseaseType.LungCancer]: {
      name: "Lung Cancer",
      codes: [
        { name: "Complex oncology examination", value: "42021" },
        { name: "Control oncology examination", value: "42022" },
        { name: "Thorax CT", value: "89663" }
      ]
    },
    [DiseaseType.MultipleSclerosis]: {
      name: "Multiple Sclerosis",
      codes: [
        { name: "Complex neurology examination", value: "29021" },
        { name: "Control neurology examination", value: "29023" },
        { name: "EEG", value: "29113" },
        { name: "EMG", value: "29210" }
      ]
    },
    [DiseaseType.HidradenitisSuppurativa]: {
      name: "Hidradenitis Suppurativa",
      codes: [
        { name: "Complex dermatology examination", value: "44021" },
        { name: "Control dermatology examination", value: "44023" },
        { name: "Dermal phototest", value: "44111" }
      ]
    }
  };
  