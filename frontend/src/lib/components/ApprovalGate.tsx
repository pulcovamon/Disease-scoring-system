import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faLock, faClock } from "@fortawesome/free-solid-svg-icons";
import { useAuth } from "../store/auth";
import { useLanguage } from "../store/language";
import { useTranslations } from "../i18n/useTranslations";
import LoadingSpinner from "./LoadingSpinner";

export default function ApprovalGate({ children }: { children: React.ReactNode }) {
  const { status, user } = useAuth();
  const { buildPath } = useLanguage();
  const { t } = useTranslations();

  if (status === "loading") {
    return (
      <div className="page-body flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (status === "unauthenticated") {
    return (
      <div className="page-body flex items-center justify-center p-6">
        <div className="flex flex-col items-center text-center gap-5 max-w-sm">
          <div className="w-16 h-16 rounded-full bg-linear-to-br from-(--primary) to-[#0f86c9] flex items-center justify-center shadow-lg">
            <FontAwesomeIcon icon={faLock} className="text-white text-xl" />
          </div>
          <div className="flex flex-col gap-2">
            <h2 className="text-xl font-bold text-(--text-color) m-0">
              {t("catalog.gate.login.title")}
            </h2>
            <p className="muted text-sm m-0">
              {t("catalog.gate.login.desc")}
            </p>
          </div>
          <div className="flex gap-3 flex-wrap justify-center">
            <Link
              to={buildPath("/login")}
              className="inline-flex items-center gap-2 bg-linear-to-r from-(--primary) to-[#0f86c9] text-white font-semibold px-5 py-2.5 rounded-xl hover:opacity-90 transition-opacity text-sm"
            >
              {t("catalog.gate.login.cta")}
            </Link>
            <Link
              to={buildPath("/register")}
              className="inline-flex items-center gap-2 border border-(--border-muted) text-(--text-color) font-semibold px-5 py-2.5 rounded-xl hover:bg-(--bg-surface-muted) transition-colors text-sm"
            >
              {t("catalog.gate.register.cta")}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!user?.is_approved) {
    return (
      <div className="page-body flex items-center justify-center p-6">
        <div className="flex flex-col items-center text-center gap-5 max-w-sm">
          <div className="w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
            <FontAwesomeIcon icon={faClock} className="text-amber-500 text-xl" />
          </div>
          <div className="flex flex-col gap-2">
            <h2 className="text-xl font-bold text-(--text-color) m-0">
              {t("catalog.gate.pending.title")}
            </h2>
            <p className="muted text-sm m-0">
              {t("catalog.gate.pending.desc")}
            </p>
          </div>
          <Link
            to={buildPath("/account")}
            className="text-sm text-(--primary) font-semibold hover:underline"
          >
            {t("account.title")} →
          </Link>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
