import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUser,
  faEnvelope,
  faLock,
  faEye,
  faEyeSlash,
  faArrowRight,
  faCircleCheck,
} from "@fortawesome/free-solid-svg-icons";
import { faGoogle } from "@fortawesome/free-brands-svg-icons";
import { buildApiUrl, getMethod } from "../classes/api";
import { useLanguage } from "../store/language";
import { useTranslations } from "../i18n/useTranslations";
import { useAuth } from "../store/auth";

const PROVIDER_ICONS: Record<string, React.ReactNode> = {
  google: <FontAwesomeIcon icon={faGoogle} />,
};

const PROVIDER_COLORS: Record<string, string> = {
  google: "hover:bg-red-50 dark:hover:bg-red-950/30 border-red-200 dark:border-red-900",
};

type OAuthProvider = { id: string; name: string };

export default function Register() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string }>({});
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [providers, setProviders] = useState<OAuthProvider[]>([]);

  const navigate = useNavigate();
  const { buildPath } = useLanguage();
  const { t } = useTranslations();
  const { loginWithOAuth } = useAuth();

  useEffect(() => {
    getMethod<OAuthProvider[]>("/auth/oauth/providers")
      .then(setProviders)
      .catch(() => setProviders([]));
  }, []);

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setFieldErrors({});

    if (password !== confirmPassword) {
      setFieldErrors({
        password: "Passwords do not match",
        confirmPassword: "Passwords do not match",
      });
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(buildApiUrl("/auth/user"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ first_name: firstName, last_name: lastName, email, password }),
      });

      if (res.status === 201) {
        setSuccess(true);
        setTimeout(() => navigate(buildPath("/login")), 3000);
      } else if (res.status === 403) {
        setError("A user with this email already exists.");
      } else {
        throw new Error();
      }
    } catch {
      setError("Registration failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <div className="w-full max-w-md border border-(--border-muted) bg-(--bg-surface) rounded-2xl overflow-hidden shadow-card">

        {/* Gradient header */}
        <div className="bg-linear-to-r from-[#2b1f7a] via-(--primary) to-[#0f86c9] px-8 py-8 text-center">
          <h1 className="text-white! text-2xl font-bold m-0">Disease Scoring System</h1>
          <p className="text-white/70! text-sm mt-2 mb-0">Create your account</p>
        </div>

        {success ? (
          <div className="p-8 flex flex-col items-center gap-4 text-center">
            <div className="w-14 h-14 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <FontAwesomeIcon icon={faCircleCheck} className="text-green-500 text-2xl" />
            </div>
            <div className="flex flex-col gap-1">
              <h2 className="text-lg font-bold text-(--text-color) m-0">Registration successful!</h2>
              <p className="text-sm text-(--text-muted) m-0">{t("register.success.pending")}</p>
            </div>
            <p className="text-xs text-(--text-muted)">Redirecting to login…</p>
          </div>
        ) : (
          <div className="p-8 flex flex-col gap-5">

            {/* OAuth buttons */}
            {providers.length > 0 && (
              <>
                <div className="flex flex-col gap-3">
                  {providers.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => loginWithOAuth(p.id)}
                      className={`flex items-center justify-center gap-3 w-full py-2.5 px-4 rounded-xl border bg-(--bg-surface) text-(--text-color) font-semibold text-sm transition-colors ${PROVIDER_COLORS[p.id] ?? "hover:bg-(--bg-surface-muted) border-(--border-muted)"}`}
                    >
                      {PROVIDER_ICONS[p.id] ?? null}
                      Continue with {p.name}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-px bg-(--border-muted)" />
                  <span className="text-xs text-(--text-muted) font-medium uppercase tracking-widest">or</span>
                  <div className="flex-1 h-px bg-(--border-muted)" />
                </div>
              </>
            )}

            <form onSubmit={handleRegister} className="flex flex-col gap-4">

              {/* First / last name row */}
              <div className="grid grid-cols-2 gap-3">
                <label className="flex flex-col gap-1.5">
                  <span className="text-sm font-semibold text-(--text-color)">First name</span>
                  <div className="relative">
                    <FontAwesomeIcon
                      icon={faUser}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-(--text-muted) text-sm"
                    />
                    <input
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      required
                      placeholder="Jan"
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-(--border-muted) bg-(--bg-surface-muted) text-(--text-color) text-sm focus:outline-none focus:border-(--primary) transition-colors"
                    />
                  </div>
                </label>

                <label className="flex flex-col gap-1.5">
                  <span className="text-sm font-semibold text-(--text-color)">Last name</span>
                  <div className="relative">
                    <FontAwesomeIcon
                      icon={faUser}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-(--text-muted) text-sm"
                    />
                    <input
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      required
                      placeholder="Novák"
                      className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-(--border-muted) bg-(--bg-surface-muted) text-(--text-color) text-sm focus:outline-none focus:border-(--primary) transition-colors"
                    />
                  </div>
                </label>
              </div>

              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-semibold text-(--text-color)">Email</span>
                <div className="relative">
                  <FontAwesomeIcon
                    icon={faEnvelope}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-(--text-muted) text-sm"
                  />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="you@example.com"
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-(--border-muted) bg-(--bg-surface-muted) text-(--text-color) text-sm focus:outline-none focus:border-(--primary) transition-colors"
                  />
                </div>
              </label>

              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-semibold text-(--text-color)">Password</span>
                <div className="relative">
                  <FontAwesomeIcon
                    icon={faLock}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-(--text-muted) text-sm"
                  />
                  <input
                    type={showPassword ? "" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    className={`w-full pl-9 pr-10 py-2.5 rounded-xl border bg-(--bg-surface-muted) text-(--text-color) text-sm focus:outline-none transition-colors ${fieldErrors.password ? "border-red-400 focus:border-red-400" : "border-(--border-muted) focus:border-(--primary)"}`}
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-(--text-muted) hover:text-(--text-color) bg-transparent p-0 transition-colors"
                  >
                    <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} className="text-sm" />
                  </button>
                </div>
                {fieldErrors.password && (
                  <span className="text-xs text-red-500 font-medium">{fieldErrors.password}</span>
                )}
              </label>

              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-semibold text-(--text-color)">Confirm password</span>
                <div className="relative">
                  <FontAwesomeIcon
                    icon={faLock}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-(--text-muted) text-sm"
                  />
                  <input
                    type={showPassword ? "" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    className={`w-full pl-9 pr-4 py-2.5 rounded-xl border bg-(--bg-surface-muted) text-(--text-color) text-sm focus:outline-none transition-colors ${fieldErrors.confirmPassword ? "border-red-400 focus:border-red-400" : "border-(--border-muted) focus:border-(--primary)"}`}
                  />
                </div>
                {fieldErrors.confirmPassword && (
                  <span className="text-xs text-red-500 font-medium">{fieldErrors.confirmPassword}</span>
                )}
              </label>

              {error && (
                <p className="text-red-500 text-sm text-center font-medium">{error}</p>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-linear-to-r from-(--primary) to-[#0f86c9] text-white font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-60"
              >
                {submitting ? "Creating account…" : (
                  <>Create account <FontAwesomeIcon icon={faArrowRight} /></>
                )}
              </button>
            </form>

            <p className="text-center text-sm text-(--text-muted)">
              Already have an account?{" "}
              <Link to={buildPath("/login")} className="text-(--primary) font-semibold hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
