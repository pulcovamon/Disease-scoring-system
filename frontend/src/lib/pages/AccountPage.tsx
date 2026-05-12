import { useEffect, useMemo, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCircleCheck,
  faClock,
  faEnvelope,
  faIdBadge,
  faRightFromBracket,
  faUser,
  faUserShield,
} from "@fortawesome/free-solid-svg-icons";
import "./personalPages.css";
import LoadingSpinner from "../components/LoadingSpinner";
import { useAuth } from "../store/auth";
import { useTranslations } from "../i18n/useTranslations";

export default function AccountPage() {
  const { user, status, logout, refreshUser } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const { t } = useTranslations();

  useEffect(() => {
    if (status === "authenticated" && !user) {
      refreshUser().catch(() => setError(t("history.error")));
    }
  }, [refreshUser, status, t, user]);

  const initials = useMemo(() => {
    if (!user) return "";
    const raw = `${user.first_name?.[0] || ""}${user.last_name?.[0] || ""}`.trim();
    return raw.length > 0 ? raw.toUpperCase() : user.email?.[0]?.toUpperCase() || "";
  }, [user]);

  const roleLabel = useMemo(() => {
    if (!user?.role) return t("account.role.user");
    return user.role.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
  }, [t, user]);

  if (status === "loading" || (status === "authenticated" && !user)) {
    return (
      <div className="pagebody">
        <LoadingSpinner />
      </div>
    );
  }
  if (status === "unauthenticated") return null;

  return (
    <div className="page-body p-5">
      {error ? (
        <div className="section-card status-banner error">{error}</div>
      ) : user ? (
        <div className="border border-(--border-muted) bg-(--bg-surface) rounded-2xl overflow-hidden shadow-card">

          {/* Gradient header */}
          <div className="bg-linear-to-r from-[#2b1f7a] via-(--primary) to-[#0f86c9] px-6 pt-7 pb-14 flex justify-between items-start gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-white/60! m-0">
                {t("personal.label")}
              </p>
              <h2 className="text-white! text-2xl font-bold mt-1 mb-0">
                {t("account.title")}
              </h2>
              <p className="text-white/70! text-sm mt-1 mb-0">
                {t("account.subtitle")}
              </p>
            </div>
            <button
              onClick={() => logout(true)}
              className="inline-flex items-center gap-2 border border-white/40 text-white bg-white/10 hover:bg-white/20 transition-colors rounded-xl px-4 py-2 font-semibold text-sm whitespace-nowrap"
            >
              <FontAwesomeIcon icon={faRightFromBracket} />
              {t("account.logout")}
            </button>
          </div>

          {/* Avatar row — overlaps gradient */}
          <div className="px-6 -mt-8 mb-2 flex flex-col sm:flex-row sm:items-end gap-4">
            {user.picture_url ? (
              <img
                src={user.picture_url}
                alt={initials}
                className="ring-4 ring-(--bg-surface) shrink-0 rounded-full object-cover"
                style={{ width: 72, height: 72 }}
              />
            ) : (
              <div
                className="initials-badge ring-4 ring-(--bg-surface) shrink-0"
                style={{ width: 72, height: 72, fontSize: "1.6rem" }}
              >
                {initials || "?"}
              </div>
            )}
            <div className="sm:pb-1 flex-1 min-w-0">
              <h3 className="text-lg font-bold m-0 text-white! leading-tight">
                {user.first_name} {user.last_name}
              </h3>
              <p className="muted m-0 text-sm truncate">{user.email}</p>
            </div>
            <div className="sm:pb-1 flex flex-wrap gap-2">
              <span className={`status-pill ${user.is_approved ? "success" : "warning"}`}>
                <FontAwesomeIcon icon={user.is_approved ? faCircleCheck : faClock} />
                {user.is_approved ? t("account.status.approved") : t("account.status.pending")}
              </span>
              <span className="status-pill neutral">
                <FontAwesomeIcon icon={faUserShield} />
                {roleLabel}
              </span>
            </div>
          </div>

          <div className="px-6 pb-6 flex flex-col gap-4">
            <div className="border-t border-(--border-muted)" />

            {!user.is_approved && (
              <div className="status-banner warning" style={{ margin: 0 }}>
                {t("account.notify")}
              </div>
            )}

            {/* Meta grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="meta-tile flex items-start gap-3">
                <FontAwesomeIcon icon={faEnvelope} className="text-(--primary) mt-1 shrink-0" />
                <div className="min-w-0">
                  <div className="meta-label">{t("account.email")}</div>
                  <div className="meta-value truncate">{user.email}</div>
                </div>
              </div>
              <div className="meta-tile flex items-start gap-3">
                <FontAwesomeIcon icon={faUser} className="text-(--primary) mt-1 shrink-0" />
                <div>
                  <div className="meta-label">{t("account.name")}</div>
                  <div className="meta-value">{user.first_name} {user.last_name}</div>
                </div>
              </div>
              <div className="meta-tile flex items-start gap-3">
                <FontAwesomeIcon icon={faUserShield} className="text-(--primary) mt-1 shrink-0" />
                <div>
                  <div className="meta-label">{t("account.role")}</div>
                  <div className="meta-value">{roleLabel}</div>
                </div>
              </div>
              <div className="meta-tile flex items-start gap-3">
                <FontAwesomeIcon icon={faIdBadge} className="text-(--primary) mt-1 shrink-0" />
                <div className="min-w-0">
                  <div className="meta-label">{t("account.userId")}</div>
                  <div className="meta-value text-xs font-mono break-all">{user.id}</div>
                </div>
              </div>
            </div>

            <p className="inline-help" style={{ margin: 0 }}>{t("account.sessionNote")}</p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
