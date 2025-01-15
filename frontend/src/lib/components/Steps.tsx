import {
    faCheck,
  faDatabase,
  faEllipsis,
  faHexagonNodes,
  faPaperPlane,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

export default function Steps({ currentIndex }: { currentIndex: number }) {
  return (
    <div className="steps-box">
      <div className={`step ${currentIndex === 0 ? "current-step" : ""}`}>
        <FontAwesomeIcon icon={faHexagonNodes} />
        {currentIndex > 0 ?
        <FontAwesomeIcon icon={faCheck} className="check" />
        : null
        }
      </div>
      <div className="line">
        <FontAwesomeIcon icon={faEllipsis} />
      </div>
      <div className={`step ${currentIndex === 1 ? "current-step" : ""}`}>
        <FontAwesomeIcon icon={faDatabase} />
        {currentIndex > 1 ?
        <FontAwesomeIcon icon={faCheck} className="check" />
        : null
        }
      </div>
      <div className="line">
        <FontAwesomeIcon icon={faEllipsis} />
      </div>
      <div className={`step ${currentIndex === 2 ? "current-step" : ""}`}>
        <FontAwesomeIcon icon={faPaperPlane} />
      </div>
    </div>
  );
}
