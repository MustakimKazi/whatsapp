// SignUp.jsx
import React, { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";

const authStyles = {
  wrapper: {
    height: '100vh',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#2f3136',
    fontFamily: 'Segoe UI, sans-serif',
    color: 'white',
  },
  box: {
    backgroundColor: '#202225',
    padding: '40px',
    borderRadius: '12px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
    width: '320px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  heading: { textAlign: 'center', fontSize: '22px', marginBottom: '8px', fontWeight: 'bold' },
  input: { padding: '10px 12px', borderRadius: '6px', border: '1px solid #444', backgroundColor: '#2f3136', color: 'white', fontSize: '14px', outline: 'none' },
  button: { backgroundColor: '#5865f2', color: '#fff', padding: '10px', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '15px' },
  buttonDisabled: { backgroundColor: '#4f545c', cursor: 'not-allowed' },
  switchText: { textAlign: 'center', fontSize: '13px', color: '#aaa' },
  link: { color: '#7289da', textDecoration: 'none', marginLeft: '4px', cursor: 'pointer' },
  error: { color: '#ed4245', fontSize: '12px', textAlign: 'center', marginTop: '-8px' },
  success: { color: '#3ba55c', fontSize: '12px', textAlign: 'center', marginTop: '-8px' },
  loading: { textAlign: 'center', color: '#7289da' }
};

const SignUp = () => {
  const [formData, setFormData] = useState({ username: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });
  const navigate = useNavigate();

  // ⚡ Updated to Render backend
  const BASE_URL = "https://backend-bl4w.onrender.com";

  const handleSignUp = async () => {
    if (!formData.username || !formData.email || !formData.password) {
      setMessage({ text: "All fields are required", type: "error" });
      return;
    }
    if (formData.password.length < 6) {
      setMessage({ text: "Password must be at least 6 characters", type: "error" });
      return;
    }
    if (!/\S+@\S+\.\S+/.test(formData.email)) {
      setMessage({ text: "Please enter a valid email", type: "error" });
      return;
    }

    setLoading(true);
    setMessage({ text: "", type: "" });

    try {
      const res = await axios.post(`${BASE_URL}/api/quick-login`, formData, {
        headers: { "Content-Type": "application/json" },
      });

      setMessage({ text: res.data.message || "Signup successful! Please login.", type: "success" });
      setFormData({ username: "", email: "", password: "" });

      setTimeout(() => navigate("/"), 2000);
    } catch (err) {
      setMessage({ text: err.response?.data?.error || "Signup failed. Please try again.", type: "error" });
      console.error("Signup error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={authStyles.wrapper}>
      <div style={authStyles.box}>
        <h2 style={authStyles.heading}>Create Account</h2>
        <input placeholder="Username" style={authStyles.input} value={formData.username} onChange={(e) => setFormData({ ...formData, username: e.target.value })} disabled={loading} />
        <input type="email" placeholder="Email" style={authStyles.input} value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} disabled={loading} />
        <input type="password" placeholder="Password (min. 6 characters)" style={authStyles.input} value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} disabled={loading} />

        {message.text && <div style={message.type === "error" ? authStyles.error : authStyles.success}>{message.text}</div>}
        {loading && <div style={authStyles.loading}>Creating your account...</div>}

        <button style={{ ...authStyles.button, ...(loading ? authStyles.buttonDisabled : {}) }} onClick={handleSignUp} disabled={loading}>
          {loading ? "Creating Account..." : "Sign Up"}
        </button>

        <p style={authStyles.switchText}>
          Already have an account?
          <Link to="/" style={authStyles.link}>Login</Link>
        </p>
      </div>
    </div>
  );
};

export default SignUp;
