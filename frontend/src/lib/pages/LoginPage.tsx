import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import "./loginPage.css";
import { useAuth } from "../store/auth";
import { useLanguage } from "../store/language";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { login, status } = useAuth();
  const { buildPath } = useLanguage();

  const redirectTo = useMemo(() => {
    const from = (location.state as { from?: string } | undefined)?.from;
    return from && from !== "/login" ? from : buildPath("/models");
  }, [buildPath, location.state]);

  useEffect(() => {
    if (status === "authenticated") {
      navigate(redirectTo, { replace: true });
    }
  }, [navigate, redirectTo, status]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const success = await login(email, password);
    if (!success) {
      setError("Login failed. Check email and password.");
    } else {
      navigate(redirectTo, { replace: true });
    }

    setSubmitting(false);
  }

  return (
    <div className="login-page">
      <form className="login-form" onSubmit={handleLogin}>
        <h2>Login</h2>
        <label>
          Email:
          <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required />
        </label>
        <label>
          Password:
          <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" required />
        </label>
        <button type="submit" disabled={submitting}>
          {submitting ? "Logging in..." : "Login"}
        </button>

        {error && <p className="error">{error}</p>}

        <p className="register-link">
          Don’t have an account?{" "}
          <Link to={buildPath("/register")}>Create one here</Link>.
        </p>
      </form>
    </div>
  );
}
