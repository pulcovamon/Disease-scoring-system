import { faGithub } from "@fortawesome/free-brands-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React from "react";
import { Link } from "react-router-dom";
import { useTranslations } from "../i18n/useTranslations";

export default function Footer() {
  const { t } = useTranslations();
  return (
    <footer className="footer">
      <div className="footer-content">
        <p>{t("footer.text")}</p>
        <Link to="https://github.com/pulcovamon/Disease-scoring-system/tree/main">
          <FontAwesomeIcon icon={faGithub} title={t("footer.github")} />
        </Link>
      </div>
    </footer>
  );
}
