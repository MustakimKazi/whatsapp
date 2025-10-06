// Login.jsx
import React, { useState, useContext } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";

// Light theme styles
const authStyles = {
  wrapper: {
    height: '100vh',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    position: 'relative',
    overflow: 'hidden',
  },
  backgroundShape: {
    position: 'absolute',
    top: '-50%',
    right: '-50%',
    width: '100%',
    height: '100%',
    background: 'radial-gradient(circle, rgba(255,255,255,0.1) 1px, transparent 1px)',
    backgroundSize: '50px 50px',
  },
  container: {
    display: 'flex',
    width: '900px',
    maxWidth: '95vw',
    height: '550px',
    maxHeight: '90vh',
    backgroundColor: 'white',
    borderRadius: '20px',
    boxShadow: '0 20px 40px rgba(0,0,0,0.1), 0 15px 35px rgba(0,0,0,0.08)',
    overflow: 'hidden',
    position: 'relative',
    zIndex: 2,
  },
  leftPanel: {
    flex: 1,
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    padding: '40px 30px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  leftPanelOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0,0,0,0.1)',
  },
  rightPanel: {
    flex: 1,
    padding: '40px 30px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    backgroundColor: 'white',
  },
  welcomeTitle: {
    fontSize: '28px',
    fontWeight: '700',
    marginBottom: '16px',
    background: 'linear-gradient(45deg, #fff, #e2e8f0)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    position: 'relative',
    zIndex: 2,
  },
  welcomeSubtitle: {
    fontSize: '14px',
    opacity: 0.9,
    lineHeight: 1.6,
    marginBottom: '25px',
    position: 'relative',
    zIndex: 2,
  },
  featureList: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
    position: 'relative',
    zIndex: 2,
  },
  featureItem: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: '12px',
    fontSize: '13px',
    opacity: 0.9,
  },
  featureIcon: {
    marginRight: '10px',
    fontSize: '16px',
  },
  loginTitle: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#1a202c',
    marginBottom: '8px',
    textAlign: 'center',
  },
  loginSubtitle: {
    fontSize: '13px',
    color: '#718096',
    textAlign: 'center',
    marginBottom: '30px',
  },
  inputGroup: {
    marginBottom: '18px',
    position: 'relative',
  },
  label: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#4a5568',
    marginBottom: '6px',
    display: 'block',
  },
  input: {
    width: '100%',
    padding: '12px 14px',
    borderRadius: '10px',
    border: '2px solid #e2e8f0',
    backgroundColor: '#f7fafc',
    color: '#2d3748',
    fontSize: '14px',
    outline: 'none',
    transition: 'all 0.3s ease',
    boxSizing: 'border-box',
  },
  inputFocus: {
    borderColor: '#667eea',
    backgroundColor: 'white',
    boxShadow: '0 0 0 3px rgba(102, 126, 234, 0.1)',
  },
  button: {
    width: '100%',
    backgroundColor: '#667eea',
    color: 'white',
    padding: '14px',
    border: 'none',
    borderRadius: '10px',
    cursor: 'pointer',
    fontWeight: '600',
    fontSize: '14px',
    transition: 'all 0.3s ease',
    marginTop: '8px',
    boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
  },
  buttonHover: {
    backgroundColor: '#5a6fd8',
    transform: 'translateY(-1px)',
    boxShadow: '0 6px 20px rgba(102, 126, 234, 0.4)',
  },
  buttonDisabled: {
    backgroundColor: '#a0aec0',
    cursor: 'not-allowed',
    transform: 'none',
    boxShadow: 'none',
  },
  quickLoginButton: {
    backgroundColor: 'white',
    color: '#4a5568',
    padding: '10px 12px',
    border: '2px solid #e2e8f0',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: '500',
    transition: 'all 0.2s ease',
    flex: '1',
    minWidth: '90px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '4px',
  },
  quickLoginButtonHover: {
    borderColor: '#667eea',
    color: '#667eea',
    transform: 'translateY(-1px)',
  },
  switchText: {
    textAlign: 'center',
    fontSize: '13px',
    color: '#718096',
    marginTop: '20px',
  },
  link: {
    color: '#667eea',
    textDecoration: 'none',
    fontWeight: '600',
  },
  error: {
    color: '#e53e3e',
    fontSize: '12px',
    textAlign: 'center',
    padding: '10px',
    backgroundColor: '#fed7d7',
    borderRadius: '6px',
    border: '1px solid #feb2b2',
    marginBottom: '12px',
  },
  success: {
    color: '#38a169',
    fontSize: '12px',
    textAlign: 'center',
    padding: '10px',
    backgroundColor: '#c6f6d5',
    borderRadius: '6px',
    border: '1px solid #9ae6b4',
    marginBottom: '12px',
  },
  loading: {
    textAlign: 'center',
    color: '#667eea',
    fontSize: '13px',
    padding: '10px',
  },
  quickLoginContainer: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginBottom: '8px',
  },
  divider: {
    textAlign: 'center',
    color: '#a0aec0',
    margin: '20px 0',
    fontSize: '13px',
    position: 'relative',
  },
  dividerLine: {
    position: 'absolute',
    top: '50%',
    width: '100%',
    height: '1px',
    backgroundColor: '#e2e8f0',
    zIndex: 1,
  },
  dividerText: {
    backgroundColor: 'white',
    padding: '0 12px',
    position: 'relative',
    zIndex: 2,
    display: 'inline-block',
    color: '#718096',
  },
  passwordHint: {
    fontSize: '10px',
    color: '#a0aec0',
    textAlign: 'center',
    marginTop: '12px',
    fontStyle: 'italic',
  },
};

const Login = () => {
  const [formData, setFormData] = useState({ 
    email: "", 
    password: "" 
  });
  const [loading, setLoading] = useState(false);
  const [quickLoginLoading, setQuickLoginLoading] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });
  const [focusedField, setFocusedField] = useState("");
  const [hoveredButton, setHoveredButton] = useState("");
  
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);

  // Use localhost for development to avoid CORS and server issues
  const BASE_URL = "ttps://backend-bl4w.onrender.com";

  const handleLogin = async () => {
    if (!formData.email || !formData.password) {
      setMessage({ text: "Email and password are required", type: "error" });
      return;
    }

    setLoading(true);
    setMessage({ text: "", type: "" });

    try {
      const res = await axios.post(`${BASE_URL}/api/login`, {
        email: formData.email,
        password: formData.password
      }, {
        headers: { 
          "Content-Type": "application/json",
        },
        timeout: 10000
      });

      console.log("Login response:", res.data);

      if (res.data.success) {
        setMessage({ 
          text: `Welcome back ${res.data.user.displayName}!`, 
          type: "success" 
        });
        
        localStorage.setItem("token", res.data.user.token);
        localStorage.setItem("user", JSON.stringify(res.data.user));
        login(res.data.user);
        
        setTimeout(() => {
          navigate("/chat");
        }, 1000);
      }
    } catch (err) {
      console.error("Login error:", err);
      
      if (err.code === 'ECONNABORTED') {
        setMessage({ 
          text: "Server timeout. Please try again.", 
          type: "error" 
        });
      } else if (err.response?.status === 500) {
        setMessage({ 
          text: "Server error. Please use Quick Login with test accounts.", 
          type: "error" 
        });
      } else if (err.response?.data?.error) {
        setMessage({ 
          text: err.response.data.error, 
          type: "error" 
        });
      } else if (err.message?.includes('Network Error')) {
        setMessage({ 
          text: "Cannot connect to server. Make sure backend is running on localhost:10000", 
          type: "error" 
        });
      } else {
        setMessage({ 
          text: "Login failed. Please try Quick Login instead.", 
          type: "error" 
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (username) => {
    setQuickLoginLoading(true);
    setMessage({ text: "", type: "" });

    try {
      const res = await axios.post(`${BASE_URL}/api/quick-login`, {
        username: username
      }, {
        headers: { 
          "Content-Type": "application/json",
        },
        timeout: 10000
      });

      console.log("Quick login response:", res.data);

      if (res.data.success) {
        setMessage({ 
          text: `Welcome ${res.data.user.displayName}!`, 
          type: "success" 
        });
        
        localStorage.setItem("token", res.data.user.token);
        localStorage.setItem("user", JSON.stringify(res.data.user));
        login(res.data.user);
        
        setTimeout(() => {
          navigate("/chat");
        }, 1000);
      }
    } catch (err) {
      console.error("Quick login error:", err);
      
      if (err.code === 'ECONNABORTED') {
        setMessage({ 
          text: "Server timeout. Please try again.", 
          type: "error" 
        });
      } else if (err.response?.data?.error) {
        setMessage({ 
          text: err.response.data.error, 
          type: "error" 
        });
      } else if (err.message?.includes('Network Error')) {
        setMessage({ 
          text: "Cannot connect to server. Make sure backend is running on localhost:10000", 
          type: "error" 
        });
      } else {
        setMessage({ 
          text: "Quick login failed. Please try another user.", 
          type: "error" 
        });
      }
    } finally {
      setQuickLoginLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !loading) {
      handleLogin();
    }
  };

  const handleInputFocus = (fieldName) => {
    setFocusedField(fieldName);
  };

  const handleInputBlur = () => {
    setFocusedField("");
  };

  // Fixed: Use separate border properties instead of mixing shorthand
  const getInputStyle = (fieldName) => {
    const baseStyle = {
      ...authStyles.input,
      borderLeft: '2px solid #e2e8f0',
      borderRight: '2px solid #e2e8f0', 
      borderTop: '2px solid #e2e8f0',
      borderBottom: '2px solid #e2e8f0',
    };

    if (focusedField === fieldName) {
      return {
        ...baseStyle,
        borderLeftColor: '#667eea',
        borderRightColor: '#667eea',
        borderTopColor: '#667eea', 
        borderBottomColor: '#667eea',
        backgroundColor: 'white',
        boxShadow: '0 0 0 3px rgba(102, 126, 234, 0.1)',
      };
    }

    return baseStyle;
  };

  const getButtonStyle = () => {
    const baseStyle = {
      ...authStyles.button,
    };

    if (loading || quickLoginLoading) {
      return {
        ...baseStyle,
        ...authStyles.buttonDisabled
      };
    }

    if (hoveredButton === 'login') {
      return {
        ...baseStyle,
        ...authStyles.buttonHover
      };
    }

    return baseStyle;
  };

  const getQuickLoginButtonStyle = (username) => {
    const baseStyle = {
      ...authStyles.quickLoginButton,
      borderLeft: '2px solid #e2e8f0',
      borderRight: '2px solid #e2e8f0',
      borderTop: '2px solid #e2e8f0',
      borderBottom: '2px solid #e2e8f0',
    };

    if (quickLoginLoading) {
      return {
        ...baseStyle,
        ...authStyles.buttonDisabled
      };
    }

    if (hoveredButton === username) {
      return {
        ...baseStyle,
        borderLeftColor: '#667eea',
        borderRightColor: '#667eea',
        borderTopColor: '#667eea',
        borderBottomColor: '#667eea',
        color: '#667eea',
        transform: 'translateY(-1px)',
      };
    }

    return baseStyle;
  };

  // Static users for quick login
  const staticUsers = [
    { username: 'mustakim', displayName: 'Mustakim', avatar: '👨‍💻' },
    { username: 'taniya', displayName: 'Taniya', avatar: '😎' },
    { username: 'aliya', displayName: 'Aliya', avatar: '👩‍💼' },
    { username: 'saniya', displayName: 'Saniya', avatar: '👑' }
  ];

  return (
    <div style={authStyles.wrapper}>
      <div style={authStyles.backgroundShape}></div>
      
      <div style={authStyles.container}>
        {/* Left Panel - Welcome Message */}
        <div style={authStyles.leftPanel}>
          <div style={authStyles.leftPanelOverlay}></div>
          <h1 style={authStyles.welcomeTitle}>
            Welcome Back!
          </h1>
          <p style={authStyles.welcomeSubtitle}>
            Sign in to your account and continue your conversations with friends and colleagues.
          </p>
          
          <ul style={authStyles.featureList}>
            <li style={authStyles.featureItem}>
              <span style={authStyles.featureIcon}>💬</span>
              Real-time messaging with friends
            </li>
            <li style={authStyles.featureItem}>
              <span style={authStyles.featureIcon}>👥</span>
              Multiple chat rooms and groups
            </li>
            <li style={authStyles.featureItem}>
              <span style={authStyles.featureIcon}>🔒</span>
              Secure and encrypted conversations
            </li>
            <li style={authStyles.featureItem}>
              <span style={authStyles.featureIcon}>⚡</span>
              Lightweight and fast experience
            </li>
          </ul>
        </div>

        {/* Right Panel - Login Form */}
        <div style={authStyles.rightPanel}>
          <h2 style={authStyles.loginTitle}>Sign In</h2>
          <p style={authStyles.loginSubtitle}>
            Enter your credentials to access your account
          </p>

          <div style={authStyles.inputGroup}>
            <label style={authStyles.label}>Email Address</label>
            <input 
              type="email" 
              placeholder="your@email.com" 
              style={getInputStyle('email')}
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              onFocus={() => handleInputFocus('email')}
              onBlur={handleInputBlur}
              disabled={loading || quickLoginLoading}
              onKeyPress={handleKeyPress}
            />
          </div>

          <div style={authStyles.inputGroup}>
            <label style={authStyles.label}>Password</label>
            <input 
              type="password" 
              placeholder="Enter your password" 
              style={getInputStyle('password')}
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
              onFocus={() => handleInputFocus('password')}
              onBlur={handleInputBlur}
              disabled={loading || quickLoginLoading}
              onKeyPress={handleKeyPress}
            />
          </div>

          {message.text && (
            <div style={message.type === "error" ? authStyles.error : authStyles.success}>
              {message.text}
            </div>
          )}
          
          {(loading || quickLoginLoading) && (
            <div style={authStyles.loading}>
              ⏳ Signing you in...
            </div>
          )}

          <button 
            style={getButtonStyle()}
            onClick={handleLogin} 
            disabled={loading || quickLoginLoading}
            onMouseEnter={() => setHoveredButton('login')}
            onMouseLeave={() => setHoveredButton('')}
          >
            {loading ? "Signing In..." : "Sign In"}
          </button>

          <div style={authStyles.divider}>
            <div style={authStyles.dividerLine}></div>
            <span style={authStyles.dividerText}>Quick Access</span>
          </div>

          <div style={authStyles.quickLoginContainer}>
            {staticUsers.map(user => (
              <button 
                key={user.username}
                style={getQuickLoginButtonStyle(user.username)}
                onClick={() => handleQuickLogin(user.username)}
                disabled={loading || quickLoginLoading}
                onMouseEnter={() => setHoveredButton(user.username)}
                onMouseLeave={() => setHoveredButton('')}
                title={`Login as ${user.displayName}`}
              >
                <span>{user.avatar}</span>
                {user.username}
              </button>
            ))}
          </div>

          <p style={authStyles.switchText}>
            Don't have an account?{" "}
            <Link 
              to="/signup" 
              style={authStyles.link}
            >
              Create Account
            </Link>
          </p>

          <div style={authStyles.passwordHint}>
            All test accounts password: 123456
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;