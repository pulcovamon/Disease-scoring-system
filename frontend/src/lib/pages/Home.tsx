import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowRight,
  faCodeBranch,
  faDatabase,
  faChartBar,
  faMagnifyingGlass,
  faClockRotateLeft,
  faBrain,
  faCircleCheck,
  faChevronDown,
  faChevronUp,
} from "@fortawesome/free-solid-svg-icons";
import { useTranslations } from "../i18n/useTranslations";
import { useLanguage } from "../store/language";
import { useAuth } from "../store/auth";
import { useCatalogPatients, useCatalogCount } from "../hooks/useCatalogData";
import { useModelsCount, useUsersCount } from "../hooks/useStatsData";
import Heatmap from "../components/Heatmap";
import { DiseaseInfo, DiseaseType } from "../classes/disease";

const PREVIEW_QUERY = { limit: 4, skip: 0 };

export default function Home() {
  const { t } = useTranslations();
  const { buildPath } = useLanguage();
  const { status, user } = useAuth();

  const { total, loading: countLoading } = useCatalogCount();
  const { count: modelsCount, loading: modelsLoading } = useModelsCount();
  const { count: usersCount, loading: usersLoading } = useUsersCount();
  const { patients, loading: patientsLoading } = useCatalogPatients(
    useMemo(() => PREVIEW_QUERY, [])
  );

  const diseases = Object.values(DiseaseType).map((key) => ({
    key,
    ...DiseaseInfo[key],
  }));

  const [expandedDisease, setExpandedDisease] = useState<string | null>(null);

  const featureCards = [
    {
      icon: faClockRotateLeft,
      title: t("home.feature.history.title", "Prediction History"),
      desc: t("home.feature.history.desc", "Review all past predictions and track outcomes over time."),
      link: buildPath("/result"),
    },
    {
      icon: faBrain,
      title: t("home.feature.models.title", "ML Models"),
      desc: t("home.feature.models.desc", "Upload, manage, and compare machine learning models."),
      link: buildPath("/models"),
    },
    {
      icon: faDatabase,
      title: t("home.feature.datasets.title", "Datasets"),
      desc: t("home.feature.datasets.desc", "Manage training datasets and batch prediction inputs."),
      link: buildPath("/datasets"),
    },
  ];

  const steps = [
    {
      icon: faMagnifyingGlass,
      label: t("home.workflow.step1", "Enter ICD-10 codes"),
    },
    {
      icon: faBrain,
      label: t("home.workflow.step2", "Select a model"),
    },
    {
      icon: faChartBar,
      label: t("home.workflow.step3", "View result"),
    },
  ];

  return (
    <div className="flex flex-col w-full">
      {/* Hero */}
      <section className="w-full bg-gradient-to-r from-[#2b1f7a] via-[var(--primary)] to-[#0f86c9] text-white px-6 pt-8 pb-14 md:pt-10 md:pb-20">
        <div className="max-w-5xl mx-auto flex flex-col gap-6">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-xs font-semibold uppercase tracking-widest text-white bg-white/15 border border-white/30 rounded-full px-3 py-1">
              FBMI CTU Prague
            </span>
          </div>
          <h1 className="text-3xl md:text-5xl font-bold leading-tight text-white!">
            {t("home.hero.title", "Disease Scoring System")}
          </h1>
          <p className="text-base md:text-xl text-white/80! max-w-2xl leading-relaxed">
            {t(
              "home.hero.subtitle",
              "Predict disease outcomes from ICD-10 codes using trained machine learning models. Designed for clinical researchers and healthcare analysts."
            )}
          </p>
          <div className="flex flex-wrap gap-4 mt-2">
            <Link
              to={buildPath("/score")}
              className="inline-flex items-center gap-2 bg-white text-[var(--primary)] font-semibold px-6 py-3 rounded-xl hover:bg-white/90 transition-colors"
            >
              {t("home.hero.cta.score", "Start Scoring")}
              <FontAwesomeIcon icon={faArrowRight} />
            </Link>
            <Link
              to={buildPath("/catalog")}
              className="inline-flex items-center gap-2 bg-white/15 border border-white/30 text-white font-semibold px-6 py-3 rounded-xl hover:bg-white/25 transition-colors"
            >
              {t("home.hero.cta.catalog", "Explore Catalog")}
            </Link>
          </div>
          <p className="text-white/50! text-xs mt-2">
            {t("home.hero.supervisor", "Supervisor: Ing. Ondřej Klempíř, Ph.D. — ")}{" "}
            <a
              href="https://www.fbmi.cvut.cz/"
              target="_blank"
              rel="noreferrer"
              className="underline hover:text-white/80"
            >
              fbmi.cvut.cz
            </a>
          </p>
        </div>
      </section>

      {/* Stats */}
      <section className="w-full bg-[var(--bg-surface)] border-b border-[var(--border-muted)] px-6 py-5">
        <div className="max-w-5xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-6">
          <div className="flex flex-col items-center gap-1 text-center">
            <span className="text-3xl font-bold text-[var(--primary)]">
              {countLoading ? "…" : total.toLocaleString()}
            </span>
            <span className="text-sm text-[var(--text-muted)]">
              {t("home.stats.patients", "Patients in Catalog")}
            </span>
          </div>
          <div className="flex flex-col items-center gap-1 text-center">
            <span className="text-3xl font-bold text-[var(--primary)]">3</span>
            <span className="text-sm text-[var(--text-muted)]">
              {t("home.stats.diseases", "Supported Diseases")}
            </span>
          </div>
          <div className="flex flex-col items-center gap-1 text-center">
            <span className="text-3xl font-bold text-[var(--primary)]">
              {modelsLoading ? "…" : modelsCount}
            </span>
            <span className="text-sm text-[var(--text-muted)]">
              {t("home.stats.models", "Public Models")}
            </span>
          </div>
          <div className="flex flex-col items-center gap-1 text-center">
            <span className="text-3xl font-bold text-[var(--primary)]">
              {usersLoading ? "…" : usersCount}
            </span>
            <span className="text-sm text-[var(--text-muted)]">
              {t("home.stats.users", "Registered Users")}
            </span>
          </div>
        </div>
      </section>

      {/* Diseases */}
      <section className="w-full px-6 py-6">
        <div className="max-w-5xl mx-auto flex flex-col gap-3">
          <h2 className="text-xl font-bold text-[var(--text-color)] mb-0!">
            {t("home.diseases.title", "Supported Diseases")}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {diseases.map(({ key, name, icon, description }) => (
              <div
                key={key}
                className="flex flex-col gap-3 bg-[var(--bg-surface)] border border-[var(--border-muted)] rounded-2xl p-6 shadow-card"
              >
                <div className="w-10 h-10 rounded-xl bg-[var(--primary)]/10 flex items-center justify-center text-[var(--primary)]">
                  <FontAwesomeIcon icon={icon} />
                </div>
                <h3 className="font-semibold text-[var(--text-color)]">{t(`disease.${key}.name`, name)}</h3>
                <p className={`text-sm text-[var(--text-muted)] leading-relaxed ${expandedDisease === key ? "" : "line-clamp-4"}`}>
                  {t(`disease.${key}.description`, description)}
                </p>
                <button
                  onClick={() => setExpandedDisease(expandedDisease === key ? null : key)}
                  className="inline-flex items-center gap-1 text-xs text-[var(--primary)] font-medium hover:underline w-fit bg-transparent! p-0! rounded-none! shadow-none!"
                >
                  <FontAwesomeIcon icon={expandedDisease === key ? faChevronUp : faChevronDown} className="text-[10px]" />
                  {expandedDisease === key
                    ? t("common.showLess", "Show less")
                    : t("common.showMore", "Show more")}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Catalog preview + Scoring workflow — two separate boxes */}
      <section className="w-full px-6 py-6">
        <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Catalog heatmap preview */}
          <div className="flex flex-col gap-4 bg-[var(--bg-surface)] border border-[var(--border-muted)] rounded-2xl p-6 shadow-card">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-[var(--text-color)]">
                {t("home.catalog.title", "Patient Catalog Preview")}
              </h3>
              <Link
                to={buildPath("/catalog")}
                className="text-sm text-[var(--primary)] font-medium hover:underline inline-flex items-center gap-1"
              >
                {t("home.catalog.viewAll", "View all")}
                <FontAwesomeIcon icon={faArrowRight} className="text-xs" />
              </Link>
            </div>
            <p className="text-sm text-[var(--text-muted)] -mt-2">
              {t("home.catalog.desc", "A sample from the training dataset — each column is a patient, rows show model prediction accuracy per category.")}
            </p>
            {patientsLoading ? (
              <div className="h-40 flex items-center justify-center text-[var(--text-muted)] text-sm">
                {t("home.catalog.loading", "Loading patients…")}
              </div>
            ) : patients.length > 0 ? (
              <div className="flex justify-center overflow-x-auto">
                <Heatmap patients={patients} mode="summary" titleVisible={false} />
              </div>
            ) : (
              <div className="h-40 flex items-center justify-center text-[var(--text-muted)] text-sm">
                {t("home.catalog.empty", "No patient data available.")}
              </div>
            )}
          </div>

          {/* Scoring workflow */}
          <div className="flex flex-col gap-4 bg-[var(--bg-surface)] border border-[var(--border-muted)] rounded-2xl p-6 shadow-card">
            <h3 className="font-semibold text-[var(--text-color)]">
              {t("home.workflow.title", "How to Score a Patient")}
            </h3>
            <p className="text-sm text-[var(--text-muted)] -mt-2">
              {t("home.workflow.desc", "Run a disease prediction in three simple steps using the Scoring Form.")}
            </p>
            <div className="flex flex-col gap-0 mt-2">
              {steps.map((step, i) => (
                <div key={i} className="flex items-start gap-4">
                  <div className="flex flex-col items-center">
                    <div className="w-9 h-9 rounded-full bg-[var(--primary)] flex items-center justify-center text-white shrink-0">
                      <FontAwesomeIcon icon={step.icon} className="text-sm" />
                    </div>
                    {i < steps.length - 1 && (
                      <div className="w-px h-10 bg-[var(--border-muted)]" />
                    )}
                  </div>
                  <div className="pt-1.5 pb-6">
                    <span className="text-xs font-semibold text-[var(--primary)] uppercase tracking-wide">
                      {`Step ${i + 1}`}
                    </span>
                    <p className="font-medium text-[var(--text-color)] mt-0.5 text-sm">{step.label}</p>
                  </div>
                </div>
              ))}
            </div>
            <Link
              to={buildPath("/score")}
              className="inline-flex items-center gap-2 bg-[var(--primary)] text-white font-semibold px-5 py-2.5 rounded-xl hover:bg-[var(--primary-hover)] transition-colors w-fit"
            >
              {t("home.workflow.cta", "Open Scoring Form")}
              <FontAwesomeIcon icon={faArrowRight} />
            </Link>
          </div>

        </div>
      </section>

      {/* Feature cards */}
      <section className="w-full px-6 py-6">
        <div className="max-w-5xl mx-auto flex flex-col gap-3">
          <h2 className="text-xl font-bold text-[var(--text-color)] mb-0!">
            {t("home.features.title", "Explore Features")}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {featureCards.map((card) => (
              <Link
                key={card.title}
                to={card.link}
                className="flex flex-col gap-3 bg-[var(--bg-surface)] border border-[var(--border-muted)] rounded-2xl p-6 shadow-card hover:border-[var(--primary)] hover:shadow-lg transition-all group"
              >
                <div className="w-10 h-10 rounded-xl bg-[var(--primary)]/10 flex items-center justify-center text-[var(--primary)] group-hover:bg-[var(--primary)] group-hover:text-white transition-colors">
                  <FontAwesomeIcon icon={card.icon} />
                </div>
                <h3 className="font-semibold text-[var(--text-color)]">{card.title}</h3>
                <p className="text-sm text-[var(--text-muted)] leading-relaxed">{card.desc}</p>
                <span className="mt-auto text-sm text-[var(--primary)] font-medium inline-flex items-center gap-1">
                  {t("home.features.explore", "Explore")}
                  <FontAwesomeIcon icon={faArrowRight} className="text-xs" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom row: Auth + GitHub */}
      <section className="w-full px-6 py-6">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Auth card */}
          <div className="flex flex-col gap-4 bg-[var(--bg-surface)] border border-[var(--border-muted)] rounded-2xl p-6 shadow-card">
            {status === "authenticated" && user ? (
              <>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[var(--primary)] flex items-center justify-center text-white font-bold text-lg">
                    {user.first_name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold text-[var(--text-color)]">
                      {user.first_name} {user.last_name}
                    </p>
                    <p className="text-xs text-[var(--text-muted)] capitalize">{user.role}</p>
                  </div>
                </div>
                <p className="text-sm text-[var(--text-muted)]">
                  {t("home.auth.welcome", "Welcome back! You're signed in and ready to use all features.")}
                </p>
                <div className="flex gap-3">
                  <Link
                    to={buildPath("/score")}
                    className="inline-flex items-center gap-2 bg-[var(--primary)] text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-[var(--primary-hover)] transition-colors"
                  >
                    {t("home.auth.scoreNow", "Score Now")}
                  </Link>
                  <Link
                    to={buildPath("/account")}
                    className="inline-flex items-center gap-2 border border-[var(--border-muted)] text-[var(--text-color)] text-sm font-medium px-4 py-2 rounded-lg hover:bg-[var(--bg-hover)] transition-colors"
                  >
                    {t("home.auth.account", "My Account")}
                  </Link>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center gap-2 text-[var(--text-muted)]">
                  <FontAwesomeIcon icon={faCircleCheck} className="text-[var(--primary)]" />
                  <span className="font-semibold text-[var(--text-color)]">
                    {t("home.auth.signIn.title", "Sign In to Unlock All Features")}
                  </span>
                </div>
                <p className="text-sm text-[var(--text-muted)] leading-relaxed">
                  {t(
                    "home.auth.signIn.desc",
                    "Create an account or log in to upload models, manage datasets, and access the full scoring workflow."
                  )}
                </p>
                <div className="flex gap-3">
                  <Link
                    to={buildPath("/login")}
                    className="inline-flex items-center gap-2 bg-[var(--primary)] text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-[var(--primary-hover)] transition-colors"
                  >
                    {t("home.auth.login", "Log In")}
                  </Link>
                  <Link
                    to={buildPath("/register")}
                    className="inline-flex items-center gap-2 border border-[var(--border-muted)] text-[var(--text-color)] text-sm font-medium px-4 py-2 rounded-lg hover:bg-[var(--bg-hover)] transition-colors"
                  >
                    {t("home.auth.register", "Register")}
                  </Link>
                </div>
              </>
            )}
          </div>

          {/* GitHub / thesis card */}
          <div className="flex flex-col gap-4 bg-[var(--bg-surface)] border border-[var(--border-muted)] rounded-2xl p-6 shadow-card">
            <div className="flex items-center gap-2 text-[var(--text-color)]">
              <FontAwesomeIcon icon={faCodeBranch} className="text-[var(--primary)]" />
              <span className="font-semibold">
                {t("home.thesis.title", "Master's Thesis")}
              </span>
            </div>
            <p className="text-sm font-medium text-[var(--text-color)] leading-snug">
              {t("home.thesis.thesisName", "Data Catalog: A Web Application for Visualization and Analysis of Longitudinal Administrative Data")}
            </p>
            <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-xs text-[var(--text-muted)]">
              <dt className="font-medium text-[var(--text-color)] whitespace-nowrap">{t("home.thesis.faculty", "Faculty")}</dt>
              <dd>{t("home.thesis.facultyValue", "Faculty of Biomedical Engineering, CTU Prague")}</dd>
              <dt className="font-medium text-[var(--text-color)] whitespace-nowrap">{t("home.thesis.department", "Department")}</dt>
              <dd>{t("home.thesis.departmentValue", "Department of Biomedical Informatics")}</dd>
              <dt className="font-medium text-[var(--text-color)] whitespace-nowrap">{t("home.thesis.program", "Programme")}</dt>
              <dd>{t("home.thesis.programValue", "Biomedical and Clinical Informatics")}</dd>
              <dt className="font-medium text-[var(--text-color)] whitespace-nowrap">{t("home.thesis.specialization", "Specialization")}</dt>
              <dd>{t("home.thesis.specializationValue", "Software Technologies")}</dd>
              <dt className="font-medium text-[var(--text-color)] whitespace-nowrap">{t("home.thesis.supervisor", "Supervisor")}</dt>
              <dd>Ing. Ondřej Klempíř, Ph.D.</dd>
            </dl>
            <a
              href="https://github.com/pulcovamon/Disease-scoring-system"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 border border-[var(--border-muted)] text-[var(--text-color)] text-sm font-medium px-4 py-2 rounded-lg hover:bg-[var(--bg-hover)] transition-colors w-fit"
            >
              <FontAwesomeIcon icon={faCodeBranch} />
              {t("home.github.cta", "View on GitHub")}
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
