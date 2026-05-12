import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./registerPage.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faE, faEye, faEyeSlash } from "@fortawesome/free-solid-svg-icons";
import { baseURL, buildApiUrl } from "../classes/api";
import { useLanguage } from "../store/language";
import { useTranslations } from "../i18n/useTranslations";

export default function Register() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string }>({});
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const navigate = useNavigate();
  const { buildPath } = useLanguage();
  const { t } = useTranslations();

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (password !== confirmPassword) {
        setFieldErrors({
          password: "Passwords do not match",
          confirmPassword: "Passwords do not match",
        });
        return;
      }      

    try {
      const res = await fetch(buildApiUrl("/auth/user"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          first_name: firstName,
          last_name: lastName,
          email,
          password,
        }),
      });

      if (res.status === 201) {
        setSuccess(true);
        setTimeout(() => navigate(buildPath("/login")), 2000);
      } else if (res.status === 403) {
        setError("User with this email already exists.");
      } else {
        throw new Error("Registration failed");
      }
    } catch (err) {
      setError("Registration failed. Please try again.");
    }
  }

  return (
    <div className="register-page">
      <form className="register-form" onSubmit={handleRegister}>
        <h2>Create account</h2>

        <label>
          First name:
          <input
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            required
          />
        </label>

        <label>
          Last name:
          <input
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            required
          />
        </label>

        <label>
          Email:
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>

        <label>
        Password:
        <div className="input-wrapper">
            <input
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className={fieldErrors.password ? "input-error" : ""}
            />
            <button
            type="button"
            className="toggle-password"
            onClick={() => setShowPassword((prev) => !prev)}
            tabIndex={-1}
            >
            {showPassword ? <FontAwesomeIcon icon={faEyeSlash} /> : <FontAwesomeIcon icon={faEye} />}
            </button>
        </div>
        {fieldErrors.password && <span className="field-error">{fieldErrors.password}</span>}
        </label>

        <label>
            Confirm password:
            <input
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className={fieldErrors.confirmPassword ? "input-error" : ""}
            />
            {fieldErrors.confirmPassword && <span className="field-error">{fieldErrors.confirmPassword}</span>}
        </label>

        <button type="submit">Register</button>

        {error && <p className="error">{error}</p>}
        {success && <p className="success">{t("register.success.pending")}</p>}

        <p className="login-link">
          Already have an account?{" "}
          <Link to={buildPath("/login")}>Log in here</Link>.
        </p>
      </form>
    </div>
  );
}
