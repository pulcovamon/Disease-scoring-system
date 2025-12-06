import { useEffect, useMemo, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCircleCheck,
  faClock,
  faRightFromBracket,
  faUserShield,
} from "@fortawesome/free-solid-svg-icons";
import "./personalPages.css";
import LoadingSpinner from "../components/LoadingSpinner";
import { useAuth } from "../store/auth";

export default function AccountPage() {
  const { user, status, logout, refreshUser } = useAuth();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === "authenticated" && !user) {
      refreshUser().catch(() => setError("Unable to load your profile right now."));
    }
  }, [refreshUser, status, user]);

  const initials = useMemo(() => {
    if (!user) return "";
    const raw = `${user.first_name?.[0] || ""}${user.last_name?.[0] || ""}`.trim();
    return raw.length > 0 ? raw.toUpperCase() : user.email?.[0]?.toUpperCase() || "";
  }, [user]);

  const roleLabel = useMemo(() => {
    if (!user?.role) return "User";
    return user.role.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
  }, [user]);

  if (status === "loading" || (status === "authenticated" && !user)) {
    return (
      <div className="pagebody">
        <LoadingSpinner />
      </div>
    );
  }
  if (status === "unauthenticated") return null;

  return (
    <div className="pagebody personal-page">
      <div className="page-hero">
        <div>
          <p className="eyebrow">Personal</p>
          <h2>Account</h2>
          <p className="muted">Manage your profile and see your approval status.</p>
        </div>
        <button className="ghost-button" onClick={() => logout(true)}>
          <FontAwesomeIcon icon={faRightFromBracket} /> Log out
        </button>
      </div>

      {error ? (
        <div className="section-card status-banner error">{error}</div>
      ) : user ? (
        <div className="section-card">
          <div className="filters-row" style={{ justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div className="initials-badge">{initials || "?"}</div>
              <div>
                <h3 style={{ margin: "0" }}>
                  {user.first_name} {user.last_name}
                </h3>
                <p className="muted" style={{ margin: "4px 0 0" }}>
                  {user.email}
                </p>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px", alignItems: "flex-end" }}>
              <span className={`status-pill ${user.is_approved ? "success" : "warning"}`}>
                <FontAwesomeIcon icon={user.is_approved ? faCircleCheck : faClock} />
                {user.is_approved ? "Approved" : "Awaiting approval"}
              </span>
              <span className="status-pill neutral">
                <FontAwesomeIcon icon={faUserShield} />
                {roleLabel}
              </span>
            </div>
          </div>

          {!user.is_approved && (
            <div className="status-banner warning">
              We&apos;ll notify you once an administrator approves your account. You can still explore public
              models and prepare datasets.
            </div>
          )}

          <div className="meta-grid">
            <div className="meta-tile">
              <div className="meta-label">Email</div>
              <div className="meta-value">{user.email}</div>
            </div>
            <div className="meta-tile">
              <div className="meta-label">Name</div>
              <div className="meta-value">
                {user.first_name} {user.last_name}
              </div>
            </div>
            <div className="meta-tile">
              <div className="meta-label">Role</div>
              <div className="meta-value">{roleLabel}</div>
            </div>
            <div className="meta-tile">
              <div className="meta-label">User ID</div>
              <div className="meta-value">{user.id}</div>
            </div>
          </div>

          <p className="inline-help">
            Your session token is stored locally. If you shared this device, log out to clear your token.
          </p>
        </div>
      ) : null}
    </div>
  );
}
