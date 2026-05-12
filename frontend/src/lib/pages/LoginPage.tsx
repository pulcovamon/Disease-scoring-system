import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEnvelope, faLock, faArrowRight } from "@fortawesome/free-solid-svg-icons";
import { faGoogle } from "@fortawesome/free-brands-svg-icons";
import { useAuth } from "../store/auth";
import { useLanguage } from "../store/language";
import { getMethod } from "../classes/api";

const PROVIDER_ICONS: Record<string, React.ReactNode> = {
  google: <FontAwesomeIcon icon={faGoogle} />,
};

const PROVIDER_COLORS: Record<string, string> = {
  google: "hover:bg-red-50 dark:hover:bg-red-950/30 border-red-200 dark:border-red-900",
};

type OAuthProvider = { id: string; name: string };

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [providers, setProviders] = useState<OAuthProvider[]>([]);

  const navigate = useNavigate();
  const location = useLocation();
  const { login, loginWithOAuth, status } = useAuth();
  const { buildPath } = useLanguage();

  const redirectTo = (() => {
    const from = (location.state as { from?: string } | undefined)?.from;
    return from && from !== buildPath("/login") ? from : buildPath("/models");
  })();

  useEffect(() => {
    if (status === "authenticated") navigate(redirectTo, { replace: true });
  }, [navigate, redirectTo, status]);

  useEffect(() => {
    getMethod<OAuthProvider[]>("/auth/oauth/providers")
      .then(setProviders)
      .catch(() => setProviders([]));
  }, []);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const success = await login(email, password);
    if (!success) setError("Invalid email or password.");
    setSubmitting(false);
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <div className="w-full max-w-md border border-(--border-muted) bg-(--bg-surface) rounded-2xl overflow-hidden shadow-card">

        {/* Gradient header */}
        <div className="bg-linear-to-r from-[#2b1f7a] via-(--primary) to-[#0f86c9] px-8 py-8 text-center">
          <h1 className="text-white! text-2xl font-bold m-0">Disease Scoring System</h1>
          <p className="text-white/70! text-sm mt-2 mb-0">Sign in to your account</p>
        </div>

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

          {/* Email/password form */}
          <form onSubmit={handleLogin} className="flex flex-col gap-4">
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
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-(--border-muted) bg-(--bg-surface-muted) text-(--text-color) text-sm focus:outline-none focus:border-(--primary) transition-colors"
                />
              </div>
            </label>

            {error && (
              <p className="text-red-500 text-sm text-center font-medium">{error}</p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-linear-to-r from-(--primary) to-[#0f86c9] text-white font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-60"
            >
              {submitting ? "Signing in…" : (
                <>Sign in <FontAwesomeIcon icon={faArrowRight} /></>
              )}
            </button>
          </form>

          <p className="text-center text-sm text-(--text-muted)">
            Don't have an account?{" "}
            <Link to={buildPath("/register")} className="text-(--primary) font-semibold hover:underline">
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
