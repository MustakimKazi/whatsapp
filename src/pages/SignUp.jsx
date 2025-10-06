// SignUp.jsx
import React, { useState, useContext } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";

// Light theme styles (same as Login)
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
    overflowY: 'auto',
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
    marginBottom: '20px',
  },
  inputGroup: {
    marginBottom: '15px',
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
    borderLeftColor: '#667eea',
    borderRightColor: '#667eea',
    borderTopColor: '#667eea',
    borderBottomColor: '#667eea',
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
    marginTop: '10px',
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
    marginLeft: '5px',
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
  avatarSelection: {
    display: 'flex',
    gap: '8px',
    justifyContent: 'center',
    marginBottom: '15px',
    flexWrap: 'wrap',
  },
  avatarOption: {
    fontSize: '20px',
    cursor: 'pointer',
    padding: '8px',
    borderRadius: '50%',
    border: '2px solid #e2e8f0',
    transition: 'all 0.2s ease',
    backgroundColor: 'white',
  },
  avatarSelected: {
    borderColor: '#667eea',
    backgroundColor: '#f0f4ff',
    transform: 'scale(1.1)',
  },
  avatarLabel: {
    fontSize: '12px',
    color: '#4a5568',
    marginBottom: '8px',
    textAlign: 'center',
    fontWeight: '600',
  }
};

const SignUp = () => {
  const [formData, setFormData] = useState({ 
    username: "", 
    email: "", 
    password: "",
    displayName: "",
    avatar: "👤"
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });
  const [focusedField, setFocusedField] = useState("");
  const [hoveredButton, setHoveredButton] = useState("");
  
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);

  // Use localhost for development to avoid server errors
  const BASE_URL = "http://localhost:10000";

  // Available avatars for selection
  const avatars = ["👤", "👨‍💻", "👩‍🎓", "😊", "🎯", "🌟", "🔥", "💫"];

  const handleSignUp = async () => {
    // Validation
    if (!formData.username || !formData.email || !formData.password) {
      setMessage({ text: "Username, email and password are required", type: "error" });
      return;
    }
    
    if (formData.username.length < 3) {
      setMessage({ text: "Username must be at least 3 characters", type: "error" });
      return;
    }
    
    if (formData.password.length < 6) {
      setMessage({ text: "Password must be at least 6 characters", type: "error" });
      return;
    }
    
    if (!/\S+@\S+\.\S+/.test(formData.email)) {
      setMessage({ text: "Please enter a valid email address", type: "error" });
      return;
    }

    setLoading(true);
    setMessage({ text: "", type: "" });

    try {
      const res = await axios.post(`${BASE_URL}/api/signup`, {
        username: formData.username,
        email: formData.email,
        password: formData.password,
        displayName: formData.displayName || formData.username,
        avatar: formData.avatar
      }, {
        headers: { 
          "Content-Type": "application/json",
        },
        timeout: 10000
      });

      console.log("Signup response:", res.data);

      if (res.data.success) {
        setMessage({ 
          text: `Welcome ${formData.displayName || formData.username}! Account created successfully.`, 
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
      console.error("Signup error:", err);
      
      if (err.code === 'ECONNABORTED') {
        setMessage({ 
          text: "Request timeout. Please try again.", 
          type: "error" 
        });
      } else if (err.response?.status === 500) {
        setMessage({ 
          text: "Server error. Please make sure your backend is running on localhost:10000", 
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
          text: "Registration failed. Please try again.", 
          type: "error" 
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !loading) {
      handleSignUp();
    }
  };

  const handleInputFocus = (fieldName) => {
    setFocusedField(fieldName);
  };

  const handleInputBlur = () => {
    setFocusedField("");
  };

  // Fixed: Use separate border properties
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

    if (loading) {
      return {
        ...baseStyle,
        ...authStyles.buttonDisabled
      };
    }

    if (hoveredButton === 'signup') {
      return {
        ...baseStyle,
        ...authStyles.buttonHover
      };
    }

    return baseStyle;
  };

  const selectAvatar = (avatar) => {
    setFormData({ ...formData, avatar });
  };

  return (
    <div style={authStyles.wrapper}>
      <div style={authStyles.backgroundShape}></div>
      
      <div style={authStyles.container}>
        {/* Left Panel - Welcome Message */}
        <div style={authStyles.leftPanel}>
          <div style={authStyles.leftPanelOverlay}></div>
          <h1 style={authStyles.welcomeTitle}>
            Join Us Today!
          </h1>
          <p style={authStyles.welcomeSubtitle}>
            Create your account and start chatting with friends and colleagues in real-time.
          </p>
          
          <ul style={authStyles.featureList}>
            <li style={authStyles.featureItem}>
              <span style={authStyles.featureIcon}>🚀</span>
              Instant real-time messaging
            </li>
            <li style={authStyles.featureItem}>
              <span style={authStyles.featureIcon}>👥</span>
              Connect with multiple rooms
            </li>
            <li style={authStyles.featureItem}>
              <span style={authStyles.featureIcon}>🔒</span>
              Secure and private chats
            </li>
            <li style={authStyles.featureItem}>
              <span style={authStyles.featureIcon}>💫</span>
              Customizable profile
            </li>
          </ul>
        </div>

        {/* Right Panel - Signup Form */}
        <div style={authStyles.rightPanel}>
          <h2 style={authStyles.loginTitle}>Create Account</h2>
          <p style={authStyles.loginSubtitle}>
            Fill in your details to get started
          </p>

          <div style={authStyles.avatarLabel}>Choose your avatar:</div>
          <div style={authStyles.avatarSelection}>
            {avatars.map((avatar) => (
              <div
                key={avatar}
                style={{
                  ...authStyles.avatarOption,
                  ...(formData.avatar === avatar ? authStyles.avatarSelected : {})
                }}
                onClick={() => selectAvatar(avatar)}
                title={`Select ${avatar}`}
              >
                {avatar}
              </div>
            ))}
          </div>

          <div style={authStyles.inputGroup}>
            <label style={authStyles.label}>Username *</label>
            <input 
              placeholder="Enter username" 
              style={getInputStyle('username')}
              value={formData.username} 
              onChange={(e) => setFormData({ ...formData, username: e.target.value })} 
              onFocus={() => handleInputFocus('username')}
              onBlur={handleInputBlur}
              disabled={loading}
              onKeyPress={handleKeyPress}
            />
          </div>

          <div style={authStyles.inputGroup}>
            <label style={authStyles.label}>Email Address *</label>
            <input 
              type="email" 
              placeholder="your@email.com" 
              style={getInputStyle('email')}
              value={formData.email} 
              onChange={(e) => setFormData({ ...formData, email: e.target.value })} 
              onFocus={() => handleInputFocus('email')}
              onBlur={handleInputBlur}
              disabled={loading}
              onKeyPress={handleKeyPress}
            />
          </div>

          <div style={authStyles.inputGroup}>
            <label style={authStyles.label}>Password *</label>
            <input 
              type="password" 
              placeholder="Minimum 6 characters" 
              style={getInputStyle('password')}
              value={formData.password} 
              onChange={(e) => setFormData({ ...formData, password: e.target.value })} 
              onFocus={() => handleInputFocus('password')}
              onBlur={handleInputBlur}
              disabled={loading}
              onKeyPress={handleKeyPress}
            />
          </div>

          <div style={authStyles.inputGroup}>
            <label style={authStyles.label}>Display Name</label>
            <input 
              placeholder="How should we call you?" 
              style={getInputStyle('displayName')}
              value={formData.displayName} 
              onChange={(e) => setFormData({ ...formData, displayName: e.target.value })} 
              onFocus={() => handleInputFocus('displayName')}
              onBlur={handleInputBlur}
              disabled={loading}
              onKeyPress={handleKeyPress}
            />
          </div>

          {message.text && (
            <div style={message.type === "error" ? authStyles.error : authStyles.success}>
              {message.text}
            </div>
          )}
          
          {loading && (
            <div style={authStyles.loading}>
              ⏳ Creating your account...
            </div>
          )}

          <button 
            style={getButtonStyle()}
            onClick={handleSignUp} 
            disabled={loading}
            onMouseEnter={() => setHoveredButton('signup')}
            onMouseLeave={() => setHoveredButton('')}
          >
            {loading ? "Creating Account..." : "Sign Up"}
          </button>

          <p style={authStyles.switchText}>
            Already have an account?
            <Link 
              to="/" 
              style={authStyles.link}
            >
              Login here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignUp;