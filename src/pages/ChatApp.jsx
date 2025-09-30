import React, { useState, useEffect, useRef, useContext } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Send, Paperclip, Menu, X, Users, LogOut, Trash2, Circle } from 'lucide-react';
import { AuthContext } from '../../AuthContext';

const ChatApp = () => {
  const { user, logout } = useContext(AuthContext);
  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [file, setFile] = useState(null);
  const [currentRoom, setCurrentRoom] = useState('general');
  const [rooms, setRooms] = useState([]);
  const [typingUsers, setTypingUsers] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth <= 768 : false);
  const [isConnected, setIsConnected] = useState(false);

  const ws = useRef(null);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const hasConnectedRef = useRef(false);
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const BASE_URL = 'https://backend-bl4w.onrender.com';
  const WS_URL = 'wss://backend-bl4w.onrender.com';

  // Handle resize for mobile layout
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      if (!mobile) setSidebarOpen(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Initial load: auth from context, connect ws, load messages/rooms
  useEffect(() => {
    if (!user) {
      navigate('/');
      return;
    }

    if (!hasConnectedRef.current) {
      connectWebSocket(user);
      hasConnectedRef.current = true;
    }

    // Load messages for the current room
    loadMessages(currentRoom, user.token);
    loadRooms(user.token);

    // Cleanup on unmount: close ws
    return () => {
      if (ws.current) {
        try {
          ws.current.close();
        } catch (e) { /* ignore */ }
      }
      clearTimeout(typingTimeoutRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, navigate]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Close sidebar on mobile when room changes
  useEffect(() => {
    if (isMobile) setSidebarOpen(false);
  }, [currentRoom, isMobile]);

  const connectWebSocket = (userObj) => {
    try {
      // Close existing connection if any
      if (ws.current) {
        ws.current.close();
      }

      ws.current = new WebSocket(WS_URL);

      ws.current.onopen = () => {
        console.log('✅ WebSocket connected');
        setIsConnected(true);
        // Send auth immediately after connection
        ws.current?.send(JSON.stringify({ type: 'auth', token: userObj.token }));
        
        // Start ping interval for connection health
        const pingInterval = setInterval(() => {
          if (ws.current?.readyState === WebSocket.OPEN) {
            ws.current.send(JSON.stringify({ type: 'ping' }));
          } else {
            clearInterval(pingInterval);
          }
        }, 25000); // Ping every 25 seconds
      };

      ws.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('📨 WebSocket message:', data);

          switch (data.type) {
            case 'authSuccess':
              setRooms(data.rooms || ['general']);
              setUsers(data.users || []);
              break;
            case 'message':
              // Append only messages for current room
              if (!data.data.room || data.data.room === currentRoom) {
                setMessages((prev) => [...prev, data.data]);
              }
              break;
            case 'users':
              setUsers(data.data || []);
              break;
            case 'typing':
              handleTypingIndicator(data);
              break;
            case 'clear':
              if (data.room === currentRoom) {
                setMessages([]);
                setShowDeleteConfirm(false);
              }
              break;
            case 'pong':
              // Handle pong response for connection health
              break;
            case 'connection':
              console.log('🔗 Connection status:', data.message);
              break;
            default:
              console.log('Unknown message type:', data.type);
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      ws.current.onclose = (ev) => {
        console.log('🔌 WebSocket disconnected', ev);
        setIsConnected(false);
        
        // Attempt reconnection after 3 seconds
        setTimeout(() => {
          if (user) {
            console.log('🔄 Attempting to reconnect...');
            connectWebSocket(user);
          }
        }, 3000);
      };

      ws.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        setIsConnected(false);
      };
    } catch (error) {
      console.error('WebSocket connection failed:', error);
      setIsConnected(false);
    }
  };

  const loadMessages = async (room, token) => {
    if (!token) return;
    try {
      console.log(`📥 Loading messages for room: ${room}`);
      const res = await axios.get(`${BASE_URL}/api/messages/${room}`, {
        headers: { Authorization: token },
      });
      setMessages(res.data.messages || []);
      console.log('📨 Messages loaded:', (res.data.messages || []).length);
    } catch (err) {
      console.error('❌ Error loading messages:', err);
      setMessages([]);
    }
  };

  const loadRooms = async (token) => {
    if (!token) return;
    try {
      const res = await axios.get(`${BASE_URL}/api/rooms`, {
        headers: { Authorization: token },
      });
      setRooms(res.data.rooms || ['general']);
    } catch (err) {
      console.error('Error loading rooms:', err);
      setRooms(['general']);
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() && !file) return;

    // Check WebSocket connection
    if (!ws.current || ws.current.readyState !== WebSocket.OPEN) {
      console.error('❌ WebSocket not connected');
      alert('Connection lost. Please refresh the page.');
      return;
    }

    // Handle file upload
    if (file) {
      const formData = new FormData();
      formData.append('file', file);
      try {
        const res = await axios.post(`${BASE_URL}/api/upload`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        const fileUrl = res.data.url;
        const fileType = file.type.startsWith('video') ? 'video' : 'image';

        ws.current.send(
          JSON.stringify({
            type: 'message',
            content: fileUrl,
            room: currentRoom,
            isFile: true,
            fileType,
          })
        );
      } catch (error) {
        console.error('❌ Upload failed', error);
        alert('File upload failed');
      } finally {
        setFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
        setInputMessage('');
      }
      return;
    }

    // Handle plain text message
    if (inputMessage.trim()) {
      console.log('📤 Sending message:', inputMessage);
      ws.current.send(
        JSON.stringify({
          type: 'message',
          content: inputMessage,
          room: currentRoom,
        })
      );
      setInputMessage('');
    }

    // Stop typing indicator
    setIsTyping(false);
    clearTimeout(typingTimeoutRef.current);
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({ type: 'typing', typing: false, room: currentRoom }));
    }
  };

  const handleInputChange = (e) => {
    setInputMessage(e.target.value);
    
    // Start typing indicator
    if (!isTyping && ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({ 
        type: 'typing', 
        typing: true, 
        room: currentRoom 
      }));
      setIsTyping(true);
    }
    
    // Clear previous timeout
    clearTimeout(typingTimeoutRef.current);
    
    // Set new timeout to stop typing indicator
    typingTimeoutRef.current = setTimeout(() => {
      if (ws.current && ws.current.readyState === WebSocket.OPEN) {
        ws.current.send(JSON.stringify({ 
          type: 'typing', 
          typing: false, 
          room: currentRoom 
        }));
      }
      setIsTyping(false);
    }, 2000);
  };

  const handleTypingIndicator = (data) => {
    if (!user) return;
    if (data.username === user.username) return; // Ignore own typing

    if (data.typing && !typingUsers.includes(data.username)) {
      setTypingUsers((prev) => [...prev, data.username]);
    } else if (!data.typing) {
      setTypingUsers((prev) => prev.filter((u) => u !== data.username));
    }
  };

  const handleRoomChange = (room) => {
    setCurrentRoom(room);
    setMessages([]);
    setTypingUsers([]);
    if (user) {
      loadMessages(room, user.token);
    }
  };

  const handleDeleteChat = async () => {
    if (!ws.current || ws.current.readyState !== WebSocket.OPEN) {
      alert('Connection lost. Please refresh the page.');
      return;
    }

    try {
      // Send clear message via WebSocket
      ws.current.send(JSON.stringify({ 
        type: 'clear', 
        room: currentRoom 
      }));
      
      setShowDeleteConfirm(false);
    } catch (error) {
      console.error('Error clearing chat:', error);
      alert('Failed to clear chat. Please try again.');
    }
  };

  const handleLogout = async () => {
    try {
      await axios.post(`${BASE_URL}/api/logout`, {}, { 
        headers: { Authorization: user?.token } 
      });
    } catch (err) {
      console.error('Logout error:', err);
    }
    
    // Use AuthContext logout function
    logout();
    
    if (ws.current) {
      ws.current.close();
    }
  };

  // Don't render anything if user is not authenticated
  if (!user) {
    return null;
  }

  return (
    <div
      style={{
        display: 'flex',
        height: '100vh',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        background: isMobile ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : '#1a1a2e',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Mobile Menu Button */}
      {isMobile && (
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          style={{
            position: 'fixed',
            top: '16px',
            left: '16px',
            zIndex: 1001,
            background: 'rgba(255, 255, 255, 0.95)',
            border: 'none',
            color: '#667eea',
            padding: '12px',
            borderRadius: '12px',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Menu size={22} />
        </button>
      )}

      {/* Sidebar Overlay for Mobile */}
      {isMobile && sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            zIndex: 999,
            backdropFilter: 'blur(4px)',
          }}
        />
      )}

      {/* Sidebar */}
      <div
        style={{
          width: isMobile ? '85%' : '280px',
          maxWidth: isMobile ? '320px' : '280px',
          background: isMobile ? 'rgba(255, 255, 255, 0.98)' : 'linear-gradient(180deg, #16213e 0%, #0f1620 100%)',
          color: isMobile ? '#2d3748' : '#fff',
          display: 'flex',
          flexDirection: 'column',
          padding: '20px',
          gap: '20px',
          position: isMobile ? 'fixed' : 'relative',
          left: isMobile && !sidebarOpen ? '-100%' : '0',
          top: 0,
          bottom: 0,
          zIndex: 1000,
          transition: 'left 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          boxShadow: isMobile ? '4px 0 20px rgba(0,0,0,0.1)' : 'none',
          overflowY: 'auto',
          overflowX: 'hidden',
        }}
      >
        {/* Close Button for Mobile */}
        {isMobile && sidebarOpen && (
          <button
            onClick={() => setSidebarOpen(false)}
            style={{
              position: 'absolute',
              top: '16px',
              right: '16px',
              background: 'none',
              border: 'none',
              color: '#667eea',
              cursor: 'pointer',
              padding: '8px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={24} />
          </button>
        )}

        {/* Header */}
        <div
          style={{
            textAlign: 'center',
            paddingBottom: '16px',
            borderBottom: isMobile ? '2px solid #e2e8f0' : '2px solid rgba(255,255,255,0.1)',
          }}
        >
          <h3
            style={{
              margin: '0 0 8px 0',
              fontSize: '22px',
              fontWeight: '700',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            Chat Rooms
          </h3>
          <p
            style={{
              margin: 0,
              fontSize: '13px',
              color: isMobile ? '#718096' : '#a0aec0',
              fontWeight: '500',
            }}
          >
            {user?.displayName || user?.username}
          </p>
        </div>

        {/* Rooms List */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}
        >
          <h4
            style={{
              margin: '0 0 8px 0',
              fontSize: '12px',
              fontWeight: '600',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              color: isMobile ? '#a0aec0' : '#718096',
              paddingLeft: '8px',
            }}
          >
            Channels
          </h4>
          {rooms.map((room) => (
            <div
              key={room}
              onClick={() => handleRoomChange(room)}
              style={{
                padding: '14px 16px',
                borderRadius: '12px',
                cursor: 'pointer',
                background:
                  currentRoom === room
                    ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                    : isMobile
                    ? '#f7fafc'
                    : 'rgba(255,255,255,0.05)',
                color: currentRoom === room ? '#fff' : isMobile ? '#4a5568' : '#e2e8f0',
                transition: 'all 0.2s ease',
                fontSize: '15px',
                fontWeight: currentRoom === room ? '600' : '500',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                boxShadow: currentRoom === room ? '0 4px 12px rgba(102, 126, 234, 0.4)' : 'none',
                transform: currentRoom === room ? 'translateX(4px)' : 'none',
              }}
            >
              <span style={{ fontSize: '18px' }}>#</span>
              {room}
            </div>
          ))}

          {/* Online Users */}
          <div
            style={{
              marginTop: '20px',
              padding: '16px',
              background: isMobile ? '#f7fafc' : 'rgba(255,255,255,0.03)',
              borderRadius: '12px',
              border: isMobile ? '1px solid #e2e8f0' : '1px solid rgba(255,255,255,0.05)',
            }}
          >
            <h4
              style={{
                margin: '0 0 12px 0',
                fontSize: '12px',
                fontWeight: '600',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                color: isMobile ? '#a0aec0' : '#718096',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <Users size={14} />
              Online ({users.length})
            </h4>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}
            >
              {users.map((userObj, index) => (
                <div
                  key={index}
                  style={{
                    fontSize: '14px',
                    color: isMobile ? '#4a5568' : '#cbd5e0',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '4px 0',
                  }}
                >
                  <Circle size={8} fill={isMobile ? '#48bb78' : '#48bb78'} color={isMobile ? '#48bb78' : '#48bb78'} />
                  {userObj.username || userObj.displayName}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            paddingTop: '16px',
            borderTop: isMobile ? '2px solid #e2e8f0' : '2px solid rgba(255,255,255,0.1)',
          }}
        >
          <button
            onClick={() => setShowDeleteConfirm(true)}
            style={{
              padding: '12px',
              borderRadius: '10px',
              border: 'none',
              background: isMobile ? '#fed7d7' : 'rgba(245, 101, 101, 0.1)',
              color: isMobile ? '#c53030' : '#fc8181',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              transition: 'all 0.2s ease',
            }}
          >
            <Trash2 size={16} />
            Clear Chat
          </button>

          <button
            onClick={handleLogout}
            style={{
              padding: '12px',
              borderRadius: '10px',
              border: 'none',
              background: isMobile ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'linear-gradient(135deg, #f56565 0%, #e53e3e 100%)',
              color: '#fff',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              transition: 'all 0.2s ease',
              boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
            }}
          >
            <LogOut size={16} />
            Logout
          </button>
        </div>
      </div>

      {/* Main Chat Area */}
      <div
        style={{
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          background: isMobile ? '#ffffff' : '#0f0f1e',
          width: '100%',
          position: 'relative',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: isMobile ? '20px 16px 16px 16px' : '20px 30px',
            borderBottom: isMobile ? '2px solid #e2e8f0' : '1px solid rgba(255,255,255,0.05)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: isMobile ? 'rgba(255, 255, 255, 0.95)' : 'rgba(15, 15, 30, 0.8)',
            backdropFilter: 'blur(10px)',
            minHeight: '70px',
            position: 'sticky',
            top: 0,
            zIndex: 10,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              flex: 1,
              marginLeft: isMobile ? '50px' : '0',
            }}
          >
            <h2
              style={{
                margin: 0,
                fontSize: isMobile ? '20px' : '24px',
                fontWeight: '700',
                color: isMobile ? '#2d3748' : '#fff',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <span
                style={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                #
              </span>
              {currentRoom}
            </h2>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
            }}
          >
            {!isMobile && (
              <button 
                onClick={() => setShowDeleteConfirm(true)} 
                style={{
                  padding: '8px 16px',
                  borderRadius: '20px',
                  border: 'none',
                  background: 'rgba(245, 101, 101, 0.1)',
                  color: '#fc8181',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.2s ease',
                }}
              >
                <Trash2 size={14} />
                Clear Chat
              </button>
            )}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                background: isMobile ? '#f7fafc' : 'rgba(255,255,255,0.05)',
                borderRadius: '20px',
                fontSize: '12px',
                fontWeight: '600',
                color: isConnected ? (isMobile ? '#38a169' : '#48bb78') : (isMobile ? '#dd6b20' : '#ed8936'),
              }}
            >
              <div
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: isConnected ? '#48bb78' : '#ed8936',
                  boxShadow: isConnected ? '0 0 8px rgba(72, 187, 120, 0.6)' : '0 0 8px rgba(237, 137, 54, 0.6)',
                }}
              />
              {isConnected ? 'Online' : 'Connecting'}
            </div>
          </div>
        </div>

        {/* Messages Area */}
        <div
          style={{
            flexGrow: 1,
            padding: isMobile ? '20px 12px' : '24px 30px',
            overflowY: 'auto',
            overflowX: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            background: isMobile ? '#f7fafc' : 'transparent',
          }}
        >
          {messages.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                color: isMobile ? '#a0aec0' : '#718096',
                marginTop: '60px',
                fontSize: '16px',
                padding: '40px 20px',
              }}
            >
              <div style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.5 }}>💬</div>
              <p style={{ margin: 0, fontWeight: '500' }}>No messages yet</p>
              <p style={{ margin: '8px 0 0 0', fontSize: '14px', opacity: 0.7 }}>Start the conversation!</p>
            </div>
          ) : (
            messages.map((msg, index) => {
              // Fallback key when id missing
              const key = msg?.id ?? `${index}-${msg?.timestamp ?? ''}`;
              return (
                <div
                  key={key}
                  style={{
                    display: 'flex',
                    justifyContent: msg.sender === user?.username ? 'flex-end' : 'flex-start',
                    alignItems: 'flex-end',
                    gap: '8px',
                  }}
                >
                  <div
                    style={{
                      maxWidth: isMobile ? '85%' : '60%',
                      background: msg.sender === user?.username ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : isMobile ? '#ffffff' : 'rgba(255,255,255,0.08)',
                      color: msg.sender === user?.username ? '#fff' : isMobile ? '#2d3748' : '#e2e8f0',
                      padding: '12px 16px',
                      borderRadius: msg.sender === user?.username ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                      boxShadow: msg.sender === user?.username ? '0 4px 12px rgba(102, 126, 234, 0.3)' : isMobile ? '0 2px 8px rgba(0,0,0,0.08)' : '0 4px 12px rgba(0,0,0,0.2)',
                      wordBreak: 'break-word',
                      border: isMobile && msg.sender !== user?.username ? '1px solid #e2e8f0' : 'none',
                    }}
                  >
                    <div style={{ fontSize: '11px', opacity: 0.8, marginBottom: '6px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      {msg.senderName || msg.sender} • {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                    </div>

                    {msg.isFile ? (
                      msg.fileType === 'image' ? (
                        <div>
                          <img src={msg.content} alt="sent" style={{ maxWidth: '100%', borderRadius: '12px', marginTop: '8px' }} />
                          <div style={{ marginTop: '8px' }}>
                            <a href={msg.content} download style={{ color: msg.sender === user?.username ? '#fff' : isMobile ? '#667eea' : '#a0aec0', fontSize: '12px', textDecoration: 'underline', fontWeight: '500' }}>
                              Download Image
                            </a>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <video controls style={{ maxWidth: '100%', borderRadius: '12px', marginTop: '8px' }}>
                            <source src={msg.content} type="video/mp4" />
                          </video>
                          <div style={{ marginTop: '8px' }}>
                            <a href={msg.content} download style={{ color: msg.sender === user?.username ? '#fff' : isMobile ? '#667eea' : '#a0aec0', fontSize: '12px', textDecoration: 'underline', fontWeight: '500' }}>
                              Download Video
                            </a>
                          </div>
                        </div>
                      )
                    ) : (
                      <div style={{ fontSize: '15px', lineHeight: '1.5' }}>{msg.content}</div>
                    )}
                  </div>
                </div>
              );
            })
          )}

          {typingUsers.length > 0 && (
            <div style={{ fontSize: '13px', color: isMobile ? '#718096' : '#718096', fontStyle: 'italic', padding: '0 8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ display: 'flex', gap: '4px' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#667eea', animation: 'pulse 1.4s ease-in-out infinite' }} />
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#667eea', animation: 'pulse 1.4s ease-in-out 0.2s infinite' }} />
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#667eea', animation: 'pulse 1.4s ease-in-out 0.4s infinite' }} />
              </div>
              {typingUsers.join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div
          style={{
            padding: isMobile ? '16px' : '20px 30px',
            borderTop: isMobile ? '2px solid #e2e8f0' : '1px solid rgba(255,255,255,0.05)',
            background: isMobile ? '#ffffff' : 'rgba(15, 15, 30, 0.8)',
            backdropFilter: 'blur(10px)',
            position: 'sticky',
            bottom: 0,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: isMobile ? '10px' : '12px',
              background: isMobile ? '#f7fafc' : 'rgba(255,255,255,0.05)',
              padding: isMobile ? '8px' : '8px',
              borderRadius: '24px',
              border: isMobile ? '2px solid #e2e8f0' : '1px solid rgba(255,255,255,0.1)',
            }}
          >
            <input ref={fileInputRef} type="file" accept="image/*,video/*" onChange={(e) => setFile(e.target.files?.[0] ?? null)} style={{ display: 'none' }} id="file-upload" />
            <label
              htmlFor="file-upload"
              style={{
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '10px',
                borderRadius: '50%',
                background: isMobile ? 'transparent' : 'rgba(255,255,255,0.05)',
                transition: 'all 0.2s ease',
                color: isMobile ? '#667eea' : '#a0aec0',
              }}
            >
              <Paperclip size={20} />
            </label>

            <input
              placeholder="Type your message..."
              value={inputMessage}
              onChange={handleInputChange}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              style={{
                flex: 1,
                padding: '14px 16px',
                borderRadius: '20px',
                border: 'none',
                outline: 'none',
                fontSize: '15px',
                background: isMobile ? '#ffffff' : 'rgba(255,255,255,0.03)',
                color: isMobile ? '#2d3748' : '#fff',
                fontFamily: 'inherit',
              }}
            />

            <button
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() && !file}
              style={{
                padding: '12px',
                borderRadius: '50%',
                background: !inputMessage.trim() && !file ? (isMobile ? '#cbd5e0' : 'rgba(255,255,255,0.1)') : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                border: 'none',
                color: '#fff',
                cursor: !inputMessage.trim() && !file ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s ease',
                opacity: !inputMessage.trim() && !file ? 0.5 : 1,
                boxShadow: !inputMessage.trim() && !file ? 'none' : '0 4px 12px rgba(102, 126, 234, 0.4)',
                minWidth: '44px',
                minHeight: '44px',
              }}
            >
              <Send size={20} />
            </button>
          </div>

          {file && (
            <div
              style={{
                marginTop: '12px',
                padding: '10px 16px',
                background: isMobile ? '#e6fffa' : 'rgba(72, 187, 120, 0.1)',
                borderRadius: '12px',
                fontSize: '13px',
                color: isMobile ? '#2c7a7b' : '#68d391',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                border: isMobile ? '1px solid #81e6d9' : '1px solid rgba(72, 187, 120, 0.2)',
              }}
            >
              <span>📎 {file.name}</span>
              <button
                onClick={() => {
                  setFile(null);
                  if (fileInputRef.current) fileInputRef.current.value = '';
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: isMobile ? '#2c7a7b' : '#68d391',
                  cursor: 'pointer',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <X size={16} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2000,
            backdropFilter: 'blur(4px)',
            padding: '20px',
          }}
        >
          <div
            style={{
              background: isMobile ? '#ffffff' : '#1a1a2e',
              padding: '30px',
              borderRadius: '20px',
              color: isMobile ? '#2d3748' : 'white',
              textAlign: 'center',
              maxWidth: '90%',
              width: '400px',
              boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
              border: isMobile ? '2px solid #e2e8f0' : '1px solid rgba(255,255,255,0.1)',
            }}
          >
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🗑️</div>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '22px', fontWeight: '700', color: isMobile ? '#2d3748' : '#fff' }}>Clear Chat</h3>
            <p style={{ margin: '0 0 24px 0', color: isMobile ? '#718096' : '#a0aec0', fontSize: '15px', lineHeight: '1.6' }}>
              Are you sure you want to clear all messages in <strong>#{currentRoom}</strong>? This action cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                style={{
                  padding: '12px 24px',
                  borderRadius: '12px',
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: '15px',
                  background: isMobile ? '#e2e8f0' : 'rgba(255,255,255,0.1)',
                  color: isMobile ? '#4a5568' : '#e2e8f0',
                  transition: 'all 0.2s ease',
                  minWidth: '100px',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteChat}
                style={{
                  padding: '12px 24px',
                  borderRadius: '12px',
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: '15px',
                  background: 'linear-gradient(135deg, #f56565 0%, #e53e3e 100%)',
                  color: 'white',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 4px 12px rgba(245, 101, 101, 0.4)',
                  minWidth: '100px',
                }}
              >
                Clear All
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add pulse animation */}
      <style>{`
        @keyframes pulse {
          0%, 100% {
            opacity: 0.4;
            transform: scale(1);
          }
          50% {
            opacity: 1;
            transform: scale(1.2);
          }
        }
        
        /* Custom scrollbar for desktop */
        ${!isMobile ? `
          ::-webkit-scrollbar {
            width: 8px;
            height: 8px;
          }
          
          ::-webkit-scrollbar-track {
            background: rgba(255,255,255,0.05);
          }
          
          ::-webkit-scrollbar-thumb {
            background: rgba(102, 126, 234, 0.5);
            border-radius: 4px;
          }
          
          ::-webkit-scrollbar-thumb:hover {
            background: rgba(102, 126, 234, 0.7);
          }
        ` : ''}
      `}</style>
    </div>
  );
};

export default ChatApp;