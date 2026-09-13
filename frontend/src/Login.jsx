import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "./Auth.css";

function Login() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.email || !form.password) {
      alert("Please enter email and password.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        "http://localhost:8080/api/auth/login",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: form.email,
            password: form.password,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        alert(data || "Invalid email or password.");
        return;
      }

      // Login successful
      localStorage.setItem("lifeRPGLoggedIn", "true");

      // Save logged-in user information
      localStorage.setItem(
        "lifeRPGUser",
        JSON.stringify(data)
      );

      // Save user ID for future RPG data
      localStorage.setItem(
        "lifeRPGUserId",
        data.id
      );

      navigate("/");

    } catch (error) {
      console.error("Login error:", error);

      alert(
        "Cannot connect to backend. Make sure Spring Boot is running."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">

        <div className="auth-logo">⚔️</div>

        <p className="auth-label">
          WELCOME BACK, HERO
        </p>

        <h1>Enter Your World</h1>

        <p className="auth-subtitle">
          Login and continue your real-life adventure.
        </p>

        <form onSubmit={handleSubmit}>

          <div className="input-group">
            <label>Email</label>

            <input
              type="email"
              name="email"
              placeholder="hero@example.com"
              value={form.email}
              onChange={handleChange}
            />
          </div>

          <div className="input-group">
            <label>Password</label>

            <input
              type="password"
              name="password"
              placeholder="Enter your password"
              value={form.password}
              onChange={handleChange}
            />
          </div>

          <button
            className="auth-btn"
            type="submit"
            disabled={loading}
          >
            {loading
              ? "Entering World..."
              : "⚔️ Enter Adventure"}
          </button>

        </form>

        <p className="auth-footer">
          Don't have an account?{" "}
          <Link to="/register">
            Create Hero
          </Link>
        </p>

      </div>
    </div>
  );
}

export default Login;