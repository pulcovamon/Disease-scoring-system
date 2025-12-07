import React from "react";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faShareFromSquare } from "@fortawesome/free-solid-svg-icons";
import { useTranslations } from "../i18n/useTranslations";
import { useLanguage } from "../store/language";

export default function Home() {
  const { t } = useTranslations();
  const { buildPath } = useLanguage();

  return (
    <div className="flex flex-col items-center gap-10 px-4 py-10 md:py-14">
      <div className="max-w-5xl text-center md:text-left space-y-4">
        <h1 className="text-3xl md:text-4xl font-bold text-[var(--text-color)]">
          {t("home.title", "Welcome to the Disease Scoring System!")}
        </h1>
        <p className="text-base md:text-lg leading-relaxed text-[var(--text-muted)]">
          {t(
            "home.subtitle",
            "Predict disease outcomes based on input data. Upload patient codes, view prediction history, and analyze training results — all in one place."
          )}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-6xl">
        {[
          {
            title: t("home.card.upload.title", "Upload Data and Make Predictions"),
            body: (
              <>
                {t("home.card.upload.desc1", "Choose from two methods to input data:")}
                <br />
                <strong>{t("home.card.upload.manual", "Manual Entry:")}</strong>{" "}
                {t("home.card.upload.manualDesc", "Add patient codes individually and provide the patient’s name.")}
                <br />
                <strong>{t("home.card.upload.dataset", "Upload Dataset:")}</strong>{" "}
                {t("home.card.upload.datasetDesc", "Submit a CSV file containing multiple codes for batch processing.")}
              </>
            ),
            link: buildPath("/score"),
            cta: t("home.card.upload.cta", "Get Started"),
          },
          {
            title: t("home.card.history.title", "View Prediction History"),
            body: t("home.card.history.body", "Review predictions, track progress, and revisit past outcomes for analysis."),
            link: buildPath("/result"),
            cta: t("home.card.history.cta", "View History"),
          },
          {
            title: t("home.card.catalog.title", "Analyze Training Results"),
            body: t("home.card.catalog.body", "Examine training datasets and compare ground truth values with model predictions."),
            link: buildPath("/catalog"),
            cta: t("home.card.catalog.cta", "Explore Catalog"),
          },
        ].map((card) => (
          <div
            key={card.title}
            className="flex flex-col h-full bg-[var(--bg-surface)] border border-[var(--border-muted)] rounded-2xl shadow-card p-6 gap-4"
          >
            <h4 className="text-lg font-semibold text-[var(--text-color)]">{card.title}</h4>
            <p className="text-[var(--text-muted)] text-base leading-6">{card.body}</p>
            <Link
              to={card.link}
              className="inline-flex items-center gap-2 text-[var(--primary)] font-semibold relative group w-fit"
            >
              <FontAwesomeIcon icon={faShareFromSquare} />
              <span>{card.cta}</span>
              <span className="absolute left-0 -bottom-1 w-0 h-[2px] bg-[var(--primary-hover)] transition-all duration-300 group-hover:w-full" />
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
