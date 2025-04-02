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
      "Lung cancer is a serious disease in which abnormal cells grow uncontrollably in the lung tissue, often due to smoking or exposure to environmental toxins. It is one of the most common and deadly forms of cancer, but early diagnosis can greatly improve outcomes.",
    image: "lung-cancer.jpg"
  },
  [DiseaseType.MultipleSclerosis]: {
    name: "Multiple Sclerosis",
    icon: faBrain,
    description:
      "Multiple sclerosis is a chronic autoimmune disorder that affects the central nervous system, particularly the brain and spinal cord. It can lead to symptoms such as fatigue, vision problems, difficulty walking, and muscle weakness, with severity varying between individuals.",
    image: "multiple-sclerosis.jpg"
  },
  [DiseaseType.HidradenitisSuppurativa]: {
    name: "Hidradenitis Suppurativa",
    icon: faHandDots,
    description:
      "Hidradenitis suppurativa is a long-term skin condition characterized by painful, inflamed lumps and abscesses that typically occur in areas where skin rubs together. Over time, the condition can cause scarring and tunnels under the skin, significantly affecting quality of life.",
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
