import { faGithub } from "@fortawesome/free-brands-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React from "react";
import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-content">
        <p>FBMI CTU student project</p>
        <Link to="https://github.com/pulcovamon/Disease-scoring-system/tree/main">
          <FontAwesomeIcon icon={faGithub} />
        </Link>
      </div>
    </footer>
  );
}
