import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

const AuthPage = () => {
  const navigate = useNavigate();
  const { login, register } = useAuth();
  const [mode, setMode] = useState("login");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: ""
  });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      if (mode === "login") {
        await login({
          email: formData.email,
          password: formData.password
        });
      } else {
        await register(formData);
      }

      navigate("/");
    } catch (submitError) {
      setError(submitError.response?.data?.message || "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <section className="auth-hero">
        <p className="eyebrow">Student job search assistant</p>
        <h1>Track the full internship journey, not just the applications.</h1>
        <p>
          Manage interviews, notes, portfolio links, reminder digests, and success analytics from one full-stack dashboard.
        </p>
      </section>

      <section className="auth-card">
        <div className="mode-switch">
          <button type="button" className={mode === "login" ? "active-tab" : ""} onClick={() => setMode("login")}>
            Login
          </button>
          <button type="button" className={mode === "signup" ? "active-tab" : ""} onClick={() => setMode("signup")}>
            Sign up
          </button>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {mode === "signup" ? (
            <label>
              Full name
              <input name="name" value={formData.name} onChange={handleChange} required />
            </label>
          ) : null}

          <label>
            Email
            <input type="email" name="email" value={formData.email} onChange={handleChange} required />
          </label>

          <label>
            Password
            <input type="password" name="password" value={formData.password} onChange={handleChange} required />
          </label>

          {error ? <p className="error-text">{error}</p> : null}

          <button type="submit" className="primary-button" disabled={submitting}>
            {submitting ? "Please wait..." : mode === "login" ? "Login" : "Create account"}
          </button>
        </form>
      </section>
    </div>
  );
};

export default AuthPage;
