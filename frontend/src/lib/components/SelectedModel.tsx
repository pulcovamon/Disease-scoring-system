import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { DiseaseInfo, DiseaseType } from "../classes/disease";
import { Model } from "../classes/model";

interface SelectedModelProps {
  model: Model | null;
  getDiseaseKeyFromName: (name: string) => DiseaseType | undefined;
}

export default function SelectedModel({ model, getDiseaseKeyFromName }: SelectedModelProps) {
  const diseaseKey = model ? getDiseaseKeyFromName(model.disease) : undefined;
  const diseaseInfo = diseaseKey ? DiseaseInfo[diseaseKey] : null;

  return (
    <div className="selected-model">
      <h3>
        Selected model:
        <span className="selected-model-title" style={{ marginLeft: "0.5rem" }}>
          {model?.name}
          {diseaseInfo && (
            <FontAwesomeIcon
              icon={diseaseInfo.icon}
              style={{ marginLeft: "0.5rem" }}
            />
          )}
        </span>
      </h3>

      {model?.description && <p>{model.description}</p>}

      <div className="disease-details" style={{ marginTop: "1rem" }}>
        <p>
          <strong>
            {diseaseInfo ? diseaseInfo.name : model?.disease}
          </strong>
        </p>
        {diseaseInfo && <p>{diseaseInfo.description}</p>}
      </div>
    </div>
  );
}
