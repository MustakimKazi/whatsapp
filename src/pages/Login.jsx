import React, { useState, useContext } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import { AuthContext } from "../../AuthContext"; // Adjust path as needed

const authStyles = {
  wrapper: {
    height: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#2f3136",
    fontFamily: "Segoe UI, sans-serif",
    color: "white",
  },
  box: {
    backgroundColor: "#202225",
    padding: "40px",
    borderRadius: "12px",
    boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
    width: "320px",
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  heading: { textAlign: "center", fontSize: "22px", marginBottom: "8px", fontWeight: "bold" },
  input: { padding: "10px 12px", borderRadius: "6px", border: "1px solid #444", backgroundColor: "#2f3136", color: "white", fontSize: "14px", outline: "none" },
  button: { backgroundColor: "#5865f2", color: "#fff", padding: "10px", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "bold", fontSize: "15px" },
  switchText: { textAlign: "center", fontSize: "13px", color: "#aaa" },
  link: { color: "#7289da", textDecoration: "none", marginLeft: "4px", cursor: "pointer" },
  error: { color: "#ed4245", fontSize: "12px", textAlign: "center", marginTop: "-4px" },
};

const BASE_URL = "https://backend-bl4w.onrender.com";

const Login = () => {
  const { login } = useContext(AuthContext); // Use AuthContext
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async () => {
    setError("");

    if (!formData.email || !formData.password) {
      setError("Please enter email and password");
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post(`${BASE_URL}/api/login`, formData);

      // Use AuthContext login function instead of localStorage directly
      login(res.data.user);

      console.log("✅ Login success:", res.data.user);
      navigate("/chat");
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (error) setError("");
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") handleLogin();
  };

  return (
    <div style={authStyles.wrapper}>
      <div style={authStyles.box}>
        <h2 style={authStyles.heading}>Login</h2>

        <input
          type="email"
          placeholder="Email"
          style={authStyles.input}
          value={formData.email}
          onChange={(e) => handleInputChange("email", e.target.value)}
          onKeyPress={handleKeyPress}
          disabled={loading}
        />

        <input
          type="password"
          placeholder="Password"
          style={authStyles.input}
          value={formData.password}
          onChange={(e) => handleInputChange("password", e.target.value)}
          onKeyPress={handleKeyPress}
          disabled={loading}
        />

        {error && <div style={authStyles.error}>{error}</div>}

        <button
          style={authStyles.button}
          onClick={handleLogin}
          disabled={loading}
        >
          {loading ? "Logging in..." : "Login"}
        </button>

        <p style={authStyles.switchText}>
          Don't have an account?
          <Link to="/sign_up" style={authStyles.link}>
            Sign Up
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;