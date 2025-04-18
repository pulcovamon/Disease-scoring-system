import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./loginPage.css";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();

    try {
        const res = await fetch(`${process.env.REACT_APP_API_URL}/auth/token`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                username: email,
                password: password,
            }),
            });

      if (!res.ok) {
        throw new Error("Login failed");
      }

      const data = await res.json();
      localStorage.setItem("token", data.access_token);
      navigate("/models");
    } catch (err) {
      setError("Login failed. Check email and password.");
    }
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
        <button type="submit">Login</button>

        {error && <p className="error">{error}</p>}

        <p className="register-link">
          Don’t have an account?{" "}
          <Link to="/register">Create one here</Link>.
        </p>
      </form>
    </div>
  );
}
