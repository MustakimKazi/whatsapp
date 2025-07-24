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
  heading: {
    textAlign: 'center',
    fontSize: '22px',
    marginBottom: '8px',
    fontWeight: 'bold',
  },
  input: {
    padding: '10px 12px',
    borderRadius: '6px',
    border: '1px solid #444',
    backgroundColor: '#2f3136',
    color: 'white',
    fontSize: '14px',
    outline: 'none',
  },
  button: {
    backgroundColor: '#5865f2',
    color: '#fff',
    padding: '10px',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: 'bold',
    fontSize: '15px',
  },
  switchText: {
    textAlign: 'center',
    fontSize: '13px',
    color: '#aaa',
  },
  link: {
    color: '#7289da',
    textDecoration: 'none',
    marginLeft: '4px',
    cursor: 'pointer',
  },
};

const SignUp = () => {
  const [formData, setFormData] = useState({ username: "", email: "", password: "" });
  const navigate = useNavigate();
const BASE_URL = 'https://whatsapp-60un.onrender.com';

 const handleSignUp = async () => {
  try {
    await axios.post('https://whatsapp-60un.onrender.com/api/sign_up', formData, {
      withCredentials: true, // 👈 optional if your backend uses credentials
    });
    alert("Signup successful! Please login.");
    navigate("/");
  } catch (err) {
    alert(err.response?.data?.error || "Signup failed");
  }
};


  return (
    <div style={authStyles.wrapper}>
      <div style={authStyles.box}>
        <h2 style={authStyles.heading}>Sign Up</h2>
        <input
          placeholder="Username"
          style={authStyles.input}
          value={formData.username}
          onChange={(e) => setFormData({ ...formData, username: e.target.value })}
        />
        <input
          type="email"
          placeholder="Email"
          style={authStyles.input}
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
        />
        <input
          type="password"
          placeholder="Password"
          style={authStyles.input}
          value={formData.password}
          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
        />
        <button style={authStyles.button} onClick={handleSignUp}>
          Sign Up
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
