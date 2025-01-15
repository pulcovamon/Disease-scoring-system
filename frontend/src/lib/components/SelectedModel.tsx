import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { DiseaseInfo, DiseaseType } from "../classes/disease";

export default function SelectedModel({ model }: { model: DiseaseType }) {
  return (
    <div className="selected-model">
      <h4>
        Selected model: <span className="selected-model-title">
        {DiseaseInfo[model].name}{" "}
        <FontAwesomeIcon icon={DiseaseInfo[model].icon} />
        </span>
      </h4>
      <span>{DiseaseInfo[model].description}</span>
    </div>
  );
}
