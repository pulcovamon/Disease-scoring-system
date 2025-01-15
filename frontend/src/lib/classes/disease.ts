import { faBrain, faHandDots, faLungs } from "@fortawesome/free-solid-svg-icons";

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
  HidradenitisSuppurativa = "hidradenitis_suppurativa",
}

export const DiseaseInfo = {
  [DiseaseType.LungCancer]: {
    name: "Lung Cancer",
    icon: faLungs,
    description:
      "This model predicts the probability of developing lung cancer based on medical codes and patient data.",
    intro:
      "Lung cancer is a type of cancer that begins in the lungs. Early detection can significantly improve treatment outcomes.",
    image: "lung-cancer.jpg"
  },
  [DiseaseType.MultipleSclerosis]: {
    name: "Multiple Sclerosis",
    icon: faBrain,
    description:
      "This model predicts the likelihood of multiple sclerosis, a condition that affects the brain and spinal cord.",
    intro:
      "Multiple sclerosis is a chronic condition that can lead to a range of symptoms, including fatigue, vision problems, and mobility issues.",
    image: "multiple-sclerosis.jpg"
  },
  [DiseaseType.HidradenitisSuppurativa]: {
    name: "Hidradenitis Suppurativa",
    icon: faHandDots,
    description:
      "This model estimates the probability of hidradenitis suppurativa, a painful skin condition.",
    intro:
      "Hidradenitis suppurativa is a chronic skin condition that causes small, painful lumps to form under the skin, often in areas where the skin rubs together.",
    image: "hidradenitis-supporativa.jpg"
  },
};


export const diseases: Record<DiseaseType, Disease> = {
  [DiseaseType.LungCancer]: {
    name: "Lung Cancer",
    codes: [
      { name: "Complex oncology examination", value: "42021" },
      { name: "Control oncology examination", value: "42022" },
      { name: "Thorax CT", value: "89663" },
    ],
  },
  [DiseaseType.MultipleSclerosis]: {
    name: "Multiple Sclerosis",
    codes: [
      { name: "Complex neurology examination", value: "29021" },
      { name: "Control neurology examination", value: "29023" },
      { name: "EEG", value: "29113" },
      { name: "EMG", value: "29210" },
    ],
  },
  [DiseaseType.HidradenitisSuppurativa]: {
    name: "Hidradenitis Suppurativa",
    codes: [
      { name: "Complex dermatology examination", value: "44021" },
      { name: "Control dermatology examination", value: "44023" },
      { name: "Dermal phototest", value: "44111" },
    ],
  },
};
