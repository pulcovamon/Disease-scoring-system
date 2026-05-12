import { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleCheck, faClock } from "@fortawesome/free-solid-svg-icons";
import "./personalPages.css";
import LoadingSpinner from "../components/LoadingSpinner";
import { useAuth } from "../store/auth";
import { useTranslations } from "../i18n/useTranslations";
import { getMethod, baseURL, buildApiUrl } from "../classes/api";
import { useLanguage } from "../store/language";
import { useNavigate } from "react-router-dom";

type AdminUser = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  username: string | null;
  role: string;
  is_approved: boolean;
};

export default function AdminUsersPage() {
  const { user, status } = useAuth();
  const { t } = useTranslations();
  const { buildPath } = useLanguage();
  const navigate = useNavigate();

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [rowErrors, setRowErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (status === "unauthenticated") {
      navigate(buildPath("/"));
      return;
    }
    if (status === "authenticated" && user?.role !== "admin") {
      navigate(buildPath("/"));
    }
  }, [status, user, navigate, buildPath]);

  useEffect(() => {
    if (status !== "authenticated" || user?.role !== "admin") return;
    getMethod<AdminUser[]>("/auth/user")
      .then(setUsers)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [status, user]);

  async function approveUser(userId: string) {
    setRowErrors((e) => ({ ...e, [userId]: "" }));
    const token = localStorage.getItem("token");
    const res = await fetch(buildApiUrl("/auth/user/approval"), {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ id: userId }),
    });
    if (!res.ok) {
      setRowErrors((e) => ({ ...e, [userId]: t("admin.users.approve.error") }));
      return;
    }
    setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, is_approved: true } : u)));
  }

  async function changeRole(userId: string, role: string) {
    setRowErrors((e) => ({ ...e, [userId]: "" }));
    const token = localStorage.getItem("token");
    const res = await fetch(buildApiUrl(`/auth/user/${userId}/role`), {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ role }),
    });
    if (!res.ok) {
      setRowErrors((e) => ({ ...e, [userId]: t("admin.users.role.error") }));
      return;
    }
    setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role } : u)));
  }

  if (status === "loading" || loading) {
    return (
      <div className="page-body p-5">
        <LoadingSpinner />
      </div>
    );
  }
  if (status === "unauthenticated" || user?.role !== "admin") return null;

  return (
    <div className="page-body p-5">
      <div className="page-hero">
        <div>
          <p className="eyebrow">{t("personal.label")}</p>
          <h2>{t("admin.users.title")}</h2>
          <p className="muted">{t("admin.users.subtitle")}</p>
        </div>
      </div>

      <div className="section-card">
        {users.length === 0 ? (
          <p className="muted">{t("admin.users.empty")}</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border-muted)" }}>
                  <th style={thStyle}>{t("account.name")}</th>
                  <th style={thStyle}>{t("account.email")}</th>
                  <th style={thStyle}>{t("account.role")}</th>
                  <th style={thStyle}>{t("account.status.approved")}</th>
                  <th style={thStyle}></th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} style={{ borderBottom: "1px solid var(--border-muted)" }}>
                    <td style={tdStyle}>
                      {u.first_name} {u.last_name}
                    </td>
                    <td style={tdStyle}>{u.email}</td>
                    <td style={tdStyle}>
                      {u.role === "admin" ? (
                        <span className="status-pill neutral">{u.role}</span>
                      ) : (
                        <select
                          value={u.role}
                          onChange={(e) => changeRole(u.id, e.target.value)}
                          style={selectStyle}
                        >
                          <option value="user">user</option>
                          <option value="scientist">scientist</option>
                        </select>
                      )}
                    </td>
                    <td style={tdStyle}>
                      <span className={`status-pill ${u.is_approved ? "success" : "warning"}`}>
                        <FontAwesomeIcon icon={u.is_approved ? faCircleCheck : faClock} />
                        {u.is_approved ? t("admin.users.approved") : t("admin.users.pending")}
                      </span>
                    </td>
                    <td style={tdStyle}>
                      {!u.is_approved && u.role !== "admin" && (
                        <button className="primary-button" style={{ padding: "6px 14px", fontSize: "0.85rem" }} onClick={() => approveUser(u.id)}>
                          {t("admin.users.approve")}
                        </button>
                      )}
                      {rowErrors[u.id] && (
                        <span style={{ color: "var(--error)", fontSize: "0.8rem", marginLeft: "8px" }}>
                          {rowErrors[u.id]}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

const thStyle: React.CSSProperties = {
  textAlign: "left",
  padding: "8px 12px",
  fontSize: "0.8rem",
  textTransform: "uppercase",
  letterSpacing: "0.08em",
  color: "var(--text-muted)",
};

const tdStyle: React.CSSProperties = {
  padding: "12px",
  verticalAlign: "middle",
};

const selectStyle: React.CSSProperties = {
  background: "var(--bg-surface)",
  border: "1px solid var(--border-muted)",
  borderRadius: "8px",
  padding: "4px 8px",
  color: "var(--text-color)",
  fontSize: "0.9rem",
};
