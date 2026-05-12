import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowRight,
  faCodeBranch,
  faDatabase,
  faHashtag,
  faClockRotateLeft,
  faBrain,
  faCircleCheck,
  faPaperPlane,
} from "@fortawesome/free-solid-svg-icons";
import { useTranslations } from "../i18n/useTranslations";
import { useLanguage } from "../store/language";
import { useAuth } from "../store/auth";
import { useCatalogPatients, useCatalogCount } from "../hooks/useCatalogData";
import { useModelsCount, useUsersCount } from "../hooks/useStatsData";
import Heatmap from "../components/Heatmap";
import { Patient, getPatientsSummary } from "../classes/catalogData";

const PREVIEW_QUERY = { limit: 5, skip: 0 };

const MOCK_PATIENTS: Patient[] = [
  {
    _id: 10001,
    codes: ["51110", "51120", "56010", "82120", "32110"],
    active_phase: {
      ground_truth: [1, 0, 1, 1, 0, 1, 0, 1, 1, 0],
      prediction:   [1, 0, 1, 1, 0, 1, 0, 0, 1, 0],
    },
    icd10_multiclass: {
      ground_truth: [2, 1, 0, 2, 1, 0],
      prediction:   [2, 0, 0, 2, 1, 1],
    },
    icd10_binary: {
      ground_truth: [1, 0, 1, 1, 0, 1, 1],
      prediction:   [1, 0, 1, 1, 0, 1, 1],
    },
  },
  {
    _id: 10002,
    codes: ["41110", "41120", "73010", "73020", "73030", "11010"],
    active_phase: {
      ground_truth: [0, 1, 0, 0, 1, 1, 0, 1, 0, 1],
      prediction:   [1, 1, 0, 0, 0, 1, 0, 1, 0, 0],
    },
    icd10_multiclass: {
      ground_truth: [0, 2, 1, 0, 2, 1],
      prediction:   [0, 2, 1, 0, 2, 0],
    },
    icd10_binary: {
      ground_truth: [0, 1, 0, 1, 1, 0, 1, 1],
      prediction:   [0, 0, 0, 1, 1, 0, 0, 1],
    },
  },
  {
    _id: 10003,
    codes: ["62010", "62020", "64010", "64020", "35010"],
    active_phase: {
      ground_truth: [1, 1, 0, 1, 0, 0, 1, 1, 0, 1, 1, 0],
      prediction:   [1, 1, 0, 1, 0, 0, 1, 0, 0, 1, 1, 0],
    },
    icd10_multiclass: {
      ground_truth: [1, 2, 0, 1, 2, 0],
      prediction:   [1, 0, 0, 2, 2, 1],
    },
    icd10_binary: {
      ground_truth: [1, 1, 0, 1, 0, 1, 0, 1],
      prediction:   [1, 1, 0, 1, 0, 1, 0, 0],
    },
  },
  {
    _id: 10004,
    codes: ["71010", "71020", "91010", "91020", "91030", "91040"],
    active_phase: {
      ground_truth: [0, 0, 1, 0, 1, 1, 0, 0, 1, 0],
      prediction:   [1, 0, 1, 0, 0, 1, 0, 0, 1, 0],
    },
    icd10_multiclass: {
      ground_truth: [2, 2, 0, 1, 2, 0, 1],
      prediction:   [2, 2, 0, 1, 2, 0, 0],
    },
    icd10_binary: {
      ground_truth: [0, 1, 1, 0, 1, 0, 1],
      prediction:   [0, 0, 1, 0, 0, 0, 1],
    },
  },
  {
    _id: 10005,
    codes: ["35020", "35030", "52010", "52020", "82130"],
    active_phase: {
      ground_truth: [1, 0, 0, 1, 1, 0, 1, 0, 1, 0],
      prediction:   [1, 1, 0, 1, 0, 0, 1, 0, 0, 0],
    },
    icd10_multiclass: {
      ground_truth: [0, 1, 2, 0, 1, 2, 0],
      prediction:   [0, 1, 2, 0, 1, 1, 0],
    },
    icd10_binary: {
      ground_truth: [1, 0, 1, 0, 1, 1, 0, 1],
      prediction:   [1, 0, 1, 0, 1, 1, 0, 1],
    },
  },
].map(p => ({ ...p, summary: getPatientsSummary(p) }));

export default function Home() {
  const { t } = useTranslations();
  const { buildPath } = useLanguage();
  const { status, user } = useAuth();

  const hasAccess = status === "authenticated" &&
    (user?.role?.toLowerCase() === "admin" || Boolean(user?.is_approved));

  const { total, loading: countLoading } = useCatalogCount();
  const { count: modelsCount, loading: modelsLoading } = useModelsCount();
  const { count: usersCount, loading: usersLoading } = useUsersCount();
  const { patients: realPatients, loading: patientsLoading } = useCatalogPatients(
    useMemo(() => (hasAccess ? PREVIEW_QUERY : null), [hasAccess])
  );

  const displayPatients = hasAccess ? realPatients : MOCK_PATIENTS;

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
      icon: faBrain,
      label: t("home.workflow.step1", "Select a model"),
    },
    {
      icon: faHashtag,
      label: t("home.workflow.step2", "Enter procedure codes"),
    },
    {
      icon: faPaperPlane,
      label: t("home.workflow.step3", "Review & submit"),
    },
  ];

  return (
    <div className="page-body">
      {/* Single unified column — hero and content share the same max-width */}
      <div className="mx-auto flex flex-col">

        {/* Hero + Stats — gradient fills the full column width */}
        <section className="bg-gradient-to-r from-[#2b1f7a] via-[var(--primary)] to-[#0f86c9] text-white">
          <div className="px-6 pt-8 pb-14 md:pt-10 md:pb-16 flex flex-col gap-6">
            <span className="text-xs font-semibold uppercase tracking-widest text-white bg-white/15 border border-white/30 rounded-full px-3 py-1 w-fit">
              FBMI CTU Prague
            </span>
            <h1 className="text-3xl md:text-5xl font-bold leading-tight text-white!">
              {t("home.hero.title", "Disease Scoring System")}
            </h1>
            <p className="text-base md:text-xl text-white/80! max-w-2xl leading-relaxed">
              {t(
                "home.hero.subtitle",
                "Predict disease outcomes from five-digit Czech health insurance procedure codes using trained machine learning models. Designed for clinical researchers and healthcare analysts."
              )}
            </p>
            <div className="flex flex-wrap gap-4">
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
          </div>

          {/* Stats bar — flush with hero gradient */}
          <div className="border-t border-white/20 px-6 py-5 grid grid-cols-2 sm:grid-cols-3 gap-6">
            <div className="flex flex-col items-center gap-1 text-center">
              <span className="text-3xl font-bold text-white">
                {countLoading ? "…" : total.toLocaleString()}
              </span>
              <span className="text-sm text-white/65">
                {t("home.stats.patients", "Patients in Catalog")}
              </span>
            </div>
            <div className="flex flex-col items-center gap-1 text-center">
              <span className="text-3xl font-bold text-white">
                {modelsLoading ? "…" : modelsCount}
              </span>
              <span className="text-sm text-white/65">
                {t("home.stats.models", "Public Models")}
              </span>
            </div>
            <div className="flex flex-col items-center gap-1 text-center">
              <span className="text-3xl font-bold text-white">
                {usersLoading ? "…" : usersCount}
              </span>
              <span className="text-sm text-white/65">
                {t("home.stats.users", "Registered Users")}
              </span>
            </div>
          </div>
        </section>

        {/* Dashboard content — normal background, same column width as hero */}
        <div className="px-6 py-6 flex flex-col gap-6">

          {/* Catalog preview + Scoring workflow */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* Catalog heatmap preview */}
            <div className="flex flex-col gap-4 border border-[var(--border-muted)] bg-[var(--bg-surface)] rounded-2xl shadow-card">
              <div className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-(--text-color)">
                    {t("home.catalog.title", "Patient Catalog Preview")}
                  </h3>
                  {!hasAccess && (
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border border-amber-200 dark:border-amber-700/50">
                      {t("home.catalog.demo", "Sample data")}
                    </span>
                  )}
                </div>
                <Link
                  to={buildPath("/catalog")}
                  className="text-sm text-[var(--primary)] font-medium hover:underline inline-flex items-center gap-1"
                >
                  {t("home.catalog.viewAll", "View all")}
                  <FontAwesomeIcon icon={faArrowRight} className="text-xs" />
                </Link>
              </div>
              <p className="text-sm text-[var(--text-muted)] -mt-2">
                {hasAccess
                  ? t("home.catalog.desc", "A sample from the training dataset — each column is a patient, rows show model prediction accuracy per category.")
                  : t("home.catalog.demoDesc", "Sign in and get approved to explore real patient records. The preview below shows sample data.")}
              </p>
              </div>
              {patientsLoading ? (
                <div className="h-40 flex items-center justify-center text-[var(--text-muted)] text-sm">
                  {t("home.catalog.loading", "Loading patients…")}
                </div>
              ) : displayPatients.length > 0 ? (
                <Heatmap patients={displayPatients} mode="summary" titleVisible={false} chunkSize={5} />
              ) : (
                <div className="h-40 flex items-center justify-center text-[var(--text-muted)] text-sm">
                  {t("home.catalog.empty", "No patient data available.")}
                </div>
              )}
            </div>

            {/* Scoring workflow */}
            <div className="flex flex-col gap-4 border border-[var(--border-muted)] rounded-2xl p-6 shadow-card bg-[var(--bg-surface)] ">
              <h3 className="font-semibold text-[var(--text-color)]">
                {t("home.workflow.title", "How to Score a Patient")}
              </h3>
              <p className="text-sm text-[var(--text-muted)] -mt-2">
                {t("home.workflow.desc", "Fill the scoring form in three steps — the result page opens automatically after submission. Processing may take a moment.")}
              </p>
              <div className="flex flex-col gap-0 mt-2">
                {steps.map((step, i) => (
                  <div key={i} className="flex items-start gap-4">
                    <div className="flex flex-col items-center">
                      <div className="w-9 h-9 rounded-full bg-[var(--primary)] flex items-center justify-center text-white shrink-0">
                        <FontAwesomeIcon icon={step.icon} className="text-sm" />
                      </div>
                      {i < steps.length - 1 && (
                        <div className="w-px h-8 bg-(--border-muted)" />
                      )}
                    </div>
                    <div className="pt-1.5 pb-4">
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

          {/* Feature cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {featureCards.map((card) => (
              <Link
                key={card.title}
                to={card.link}
                className="flex flex-col gap-3 border border-[var(--border-muted)] rounded-2xl p-6 shadow-card hover:border-[var(--primary)] hover:shadow-lg transition-all group bg-[var(--bg-surface)] "
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

          {/* Auth + GitHub */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            {/* Auth card */}
            <div className="flex flex-col gap-4 border border-[var(--border-muted)] rounded-2xl p-6 shadow-card bg-[var(--bg-surface)] ">
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
                  <div className="flex items-center gap-2">
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
            <div className="flex flex-col gap-4 border border-[var(--border-muted)] rounded-2xl p-6 shadow-card bg-[var(--bg-surface)] ">
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
        </div>

      </div>
    </div>
  );
}
