import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const ChatApp = () => {
  const [user, setUser] = useState(null);
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
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  const ws = useRef(null);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const hasConnectedRef = useRef(false);
  const navigate = useNavigate();

  // Use your Render.com backend URL
  const BASE_URL = "https://backend-bl4w.onrender.com";
  const WS_URL = "wss://backend-bl4w.onrender.com";

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      if (!mobile) {
        setSidebarOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem('user'));
    if (!storedUser) return navigate('/');
    setUser(storedUser);
    if (!hasConnectedRef.current) {
      connectWebSocket(storedUser);
      hasConnectedRef.current = true;
    }
    loadMessages(currentRoom, storedUser.token);
    loadRooms(storedUser.token);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto-close sidebar on mobile when room changes
  useEffect(() => {
    if (isMobile) {
      setSidebarOpen(false);
    }
  }, [currentRoom, isMobile]);

  const connectWebSocket = (userObj) => {
    try {
      ws.current = new WebSocket(WS_URL);
      
      ws.current.onopen = () => {
        console.log('✅ WebSocket connected');
        ws.current.send(JSON.stringify({ type: 'auth', token: userObj.token }));
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
              setMessages((prev) => [...prev, data.data]);
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
            default:
              console.log('Unknown message type:', data.type);
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      ws.current.onclose = () => {
        console.log('🔌 WebSocket disconnected');
      };

      ws.current.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

    } catch (error) {
      console.error('WebSocket connection failed:', error);
    }
  };

  const loadMessages = async (room, token) => {
    try {
      console.log(`📥 Loading messages for room: ${room}`);
      const res = await axios.get(`${BASE_URL}/api/messages/${room}`, {
        headers: { Authorization: token },
      });
      console.log('📨 Messages loaded:', res.data.messages?.length || 0);
      setMessages(res.data.messages || []);
    } catch (err) {
      console.error('❌ Error loading messages:', err);
      setMessages([]);
    }
  };

  const loadRooms = async (token) => {
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

    if (file) {
      // Handle file upload
      const formData = new FormData();
      formData.append('file', file);
      try {
        const res = await axios.post(`${BASE_URL}/api/upload`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        const fileUrl = res.data.url;
        const fileType = file.type.startsWith('video') ? 'video' : 'image';
        
        ws.current.send(JSON.stringify({ 
          type: 'message', 
          content: fileUrl, 
          room: currentRoom, 
          isFile: true, 
          fileType 
        }));
      } catch (error) {
        console.error('❌ Upload failed', error);
        alert('File upload failed');
      }
      setFile(null);
      setInputMessage('');
      return;
    }

    // Handle text message
    if (inputMessage.trim()) {
      console.log('📤 Sending message:', inputMessage);
      ws.current.send(JSON.stringify({ 
        type: 'message', 
        content: inputMessage, 
        room: currentRoom 
      }));
      setInputMessage('');
    }

    // Stop typing indicator
    setIsTyping(false);
    clearTimeout(typingTimeoutRef.current);
    if (ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({ 
        type: 'typing', 
        typing: false, 
        room: currentRoom 
      }));
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
    if (data.username !== user?.username) {
      if (data.typing && !typingUsers.includes(data.username)) {
        setTypingUsers((prev) => [...prev, data.username]);
      } else if (!data.typing) {
        setTypingUsers((prev) => prev.filter((u) => u !== data.username));
      }
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
    localStorage.removeItem('user');
    if (ws.current) {
      ws.current.close();
    }
    navigate('/');
  };

  // 🌟 Responsive Chat Styles
  const layoutStyles = {
    container: { 
      display: 'flex', 
      height: '100vh', 
      fontFamily: 'Segoe UI, sans-serif',
      backgroundColor: '#36393f',
      position: 'relative',
      overflow: 'hidden'
    },
    sidebar: { 
      width: isMobile ? (sidebarOpen ? '100%' : 0) : 240, 
      backgroundColor: '#2f3136', 
      color: '#fff', 
      display: 'flex', 
      flexDirection: 'column', 
      padding: isMobile && sidebarOpen ? 20 : (isMobile ? 0 : 20), 
      gap: 20,
      position: isMobile ? 'absolute' : 'relative',
      left: isMobile && !sidebarOpen ? '-100%' : '0',
      top: 0,
      bottom: 0,
      zIndex: 1000,
      transition: 'left 0.3s ease, padding 0.3s ease',
      overflow: 'hidden'
    },
    mobileMenuButton: {
      display: isMobile ? 'block' : 'none',
      position: 'absolute',
      top: 15,
      left: 15,
      zIndex: 1001,
      background: '#5865f2',
      border: 'none',
      color: 'white',
      padding: '10px',
      borderRadius: '5px',
      cursor: 'pointer',
      fontSize: '16px'
    },
    room: { 
      padding: 12, 
      borderRadius: 8, 
      cursor: 'pointer', 
      backgroundColor: '#36393f', 
      marginBottom: 8, 
      transition: '0.2s', 
      textAlign: 'center',
      fontSize: isMobile ? '16px' : '14px',
      fontWeight: '500',
      '&:hover': {
        backgroundColor: '#40444b'
      }
    },
    activeRoom: { 
      backgroundColor: '#5865f2',
      color: '#fff'
    },
    usersList: { 
      flex: 1, 
      overflowY: 'auto', 
      marginTop: 20, 
      fontSize: isMobile ? '15px' : '14px' 
    },
    chatArea: { 
      flexGrow: 1, 
      display: 'flex', 
      flexDirection: 'column', 
      backgroundColor: '#36393f',
      width: '100%'
    },
    header: { 
      padding: isMobile ? '12px 15px' : '15px 20px', 
      borderBottom: '1px solid #444', 
      display: 'flex', 
      justifyContent: 'space-between', 
      alignItems: 'center', 
      background: '#2f3136',
      color: '#fff',
      position: 'relative',
      minHeight: '60px'
    },
    headerLeft: {
      display: 'flex',
      alignItems: 'center',
      gap: '15px',
      flex: 1
    },
    roomTitle: {
      margin: 0,
      fontSize: isMobile ? '20px' : '20px',
      fontWeight: '600'
    },
    headerActions: {
      display: 'flex',
      gap: '10px',
      alignItems: 'center'
    },
    deleteButton: {
      background: '#ed4245',
      border: 'none',
      color: 'white',
      padding: isMobile ? '6px 12px' : '8px 16px',
      borderRadius: '20px',
      cursor: 'pointer',
      fontSize: isMobile ? '11px' : '12px',
      fontWeight: '500',
      transition: 'background 0.2s',
      '&:hover': {
        background: '#d84040'
      }
    },
    messages: { 
      flexGrow: 1, 
      padding: isMobile ? '15px 10px' : '20px 15px', 
      overflowY: 'auto', 
      display: 'flex', 
      flexDirection: 'column', 
      gap: 12
    },
    message: (fromSelf) => ({
      alignSelf: fromSelf ? 'flex-end' : 'flex-start',
      background: fromSelf ? '#5865f2' : '#4f545c',
      color: '#fff',
      padding: isMobile ? '10px 14px' : '8px 12px',
      borderRadius: '18px',
      maxWidth: isMobile ? '90%' : '70%',
      wordBreak: 'break-word',
      boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
      fontSize: isMobile ? '16px' : '15px',
      lineHeight: '1.4'
    }),
    messageHeader: {
      fontSize: isMobile ? '12px' : '12px',
      opacity: 0.8,
      marginBottom: 4,
      fontWeight: '500'
    },
    inputArea: { 
      display: 'flex', 
      padding: isMobile ? '10px' : '15px', 
      gap: isMobile ? '8px' : '10px', 
      borderTop: '1px solid #444', 
      background: '#40444b',
      alignItems: 'center'
    },
    input: { 
      flex: 1, 
      padding: isMobile ? '14px 16px' : '12px 16px', 
      borderRadius: '25px', 
      border: 'none', 
      outline: 'none', 
      fontSize: isMobile ? '16px' : '15px',
      background: '#484c52',
      color: '#fff',
      minHeight: '20px'
    },
    sendButton: { 
      padding: isMobile ? '12px 18px' : '10px 20px', 
      borderRadius: '25px', 
      background: '#5865f2', 
      border: 'none', 
      color: '#fff', 
      cursor: 'pointer', 
      fontWeight: 'bold',
      fontSize: isMobile ? '16px' : '15px',
      minWidth: isMobile ? '70px' : '60px'
    },
    fileInput: { 
      cursor: 'pointer',
      background: '#484c52',
      color: '#fff',
      padding: isMobile ? '8px' : '10px',
      borderRadius: '5px',
      fontSize: isMobile ? '13px' : '14px'
    },
    typing: { 
      fontStyle: 'italic', 
      fontSize: isMobile ? '13px' : '13px', 
      color: '#aaa', 
      marginTop: -10,
      padding: isMobile ? '0 10px' : '0 15px'
    },
    userItem: {
      padding: '6px 0',
      fontSize: isMobile ? '14px' : '14px',
      color: '#b9bbbe'
    },
    overlay: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 2000
    },
    confirmModal: {
      background: '#36393f',
      padding: '25px',
      borderRadius: '10px',
      color: 'white',
      textAlign: 'center',
      maxWidth: '90%',
      width: '400px'
    },
    confirmButtons: {
      display: 'flex',
      gap: '15px',
      justifyContent: 'center',
      marginTop: '20px'
    },
    confirmButton: {
      padding: '10px 20px',
      borderRadius: '5px',
      border: 'none',
      cursor: 'pointer',
      fontWeight: 'bold',
      fontSize: '14px'
    },
    cancelButton: {
      background: '#4f545c',
      color: 'white'
    },
    confirmDeleteButton: {
      background: '#ed4245',
      color: 'white'
    },
    closeSidebarButton: {
      position: 'absolute',
      top: 15,
      right: 15,
      background: 'none',
      border: 'none',
      color: 'white',
      fontSize: '24px',
      cursor: 'pointer',
      zIndex: 1002
    }
  };

  return (
    <div style={layoutStyles.container}>
      {/* Mobile Menu Button */}
      {isMobile && (
        <button 
          style={layoutStyles.mobileMenuButton}
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          ☰
        </button>
      )}

      {/* Sidebar */}
      <div style={layoutStyles.sidebar}>
        {isMobile && sidebarOpen && (
          <button 
            style={layoutStyles.closeSidebarButton}
            onClick={() => setSidebarOpen(false)}
          >
            ✕
          </button>
        )}
        
        <h3 style={{ 
          color: '#fff', 
          marginBottom: 10, 
          fontSize: isMobile ? '22px' : '18px',
          textAlign: 'center',
          marginTop: isMobile ? '10px' : '0'
        }}>
          Chat Rooms
        </h3>
        
        <div style={{ overflowY: 'auto', flex: 1 }}>
          {rooms.map((room) => (
            <div
              key={room}
              style={{ 
                ...layoutStyles.room, 
                ...(currentRoom === room ? layoutStyles.activeRoom : {}) 
              }}
              onClick={() => handleRoomChange(room)}
            >
              # {room}
            </div>
          ))}
          
          <div style={layoutStyles.usersList}>
            <h4 style={{ 
              color: '#fff', 
              marginBottom: 10, 
              fontSize: isMobile ? '18px' : '14px',
              textAlign: 'center'
            }}>
              Online Users ({users.length})
            </h4>
            {users.map((userObj, index) => (
              <div key={index} style={layoutStyles.userItem}>
                ● {userObj.username || userObj.displayName}
              </div>
            ))}
          </div>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: 'auto' }}>
          <button 
            onClick={() => setShowDeleteConfirm(true)} 
            style={{
              ...layoutStyles.deleteButton,
              background: '#faa61a',
              fontSize: isMobile ? '14px' : '12px',
              padding: isMobile ? '10px' : '8px 16px'
            }}
          >
            Clear Chat
          </button>
          
          <button 
            onClick={handleLogout} 
            style={{
              ...layoutStyles.sendButton,
              background: '#ed4245',
              fontSize: isMobile ? '14px' : '15px'
            }}
          >
            Logout
          </button>
        </div>
      </div>

      {/* Main Chat Area */}
      <div style={layoutStyles.chatArea}>
        <div style={layoutStyles.header}>
          <div style={layoutStyles.headerLeft}>
            <h2 style={layoutStyles.roomTitle}># {currentRoom}</h2>
            <div style={{ 
              color: '#b9bbbe', 
              fontSize: isMobile ? '14px' : '14px' 
            }}>
              {user?.displayName || user?.username}
            </div>
          </div>
          
          <div style={layoutStyles.headerActions}>
            {!isMobile && (
              <button 
                onClick={() => setShowDeleteConfirm(true)} 
                style={layoutStyles.deleteButton}
              >
                Clear Chat
              </button>
            )}
            <div style={{ 
              width: '10px', 
              height: '10px', 
              borderRadius: '50%', 
              background: ws.current?.readyState === WebSocket.OPEN ? '#43b581' : '#faa61a' 
            }} />
          </div>
        </div>
        
        <div style={layoutStyles.messages}>
          {messages.length === 0 ? (
            <div style={{ 
              textAlign: 'center', 
              color: '#72767d', 
              marginTop: 50,
              fontSize: isMobile ? '16px' : '16px',
              padding: isMobile ? '20px' : '0'
            }}>
              No messages yet. Start the conversation!
            </div>
          ) : (
            messages.map((msg) => (
              <div key={msg.id} style={layoutStyles.message(msg.sender === user?.username)}>
                <div style={layoutStyles.messageHeader}>
                  {msg.senderName || msg.sender} • {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
                {msg.isFile ? (
                  msg.fileType === 'image' ? (
                    <div>
                      <img 
                        src={msg.content} 
                        alt="sent" 
                        style={{ 
                          maxWidth: '100%', 
                          borderRadius: 10, 
                          marginTop: 5 
                        }} 
                      />
                      <div>
                        <a 
                          href={msg.content} 
                          download 
                          style={{ 
                            color: '#ccc', 
                            fontSize: isMobile ? '13px' : '12px', 
                            textDecoration: 'underline' 
                          }}
                        >
                          Download Image
                        </a>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <video 
                        controls 
                        style={{ 
                          maxWidth: '100%', 
                          borderRadius: 10, 
                          marginTop: 5 
                        }}
                      >
                        <source src={msg.content} type="video/mp4" />
                      </video>
                      <div>
                        <a 
                          href={msg.content} 
                          download 
                          style={{ 
                            color: '#ccc', 
                            fontSize: isMobile ? '13px' : '12px', 
                            textDecoration: 'underline' 
                          }}
                        >
                          Download Video
                        </a>
                      </div>
                    </div>
                  )
                ) : (
                  msg.content
                )}
              </div>
            ))
          )}
          
          {typingUsers.length > 0 && (
            <div style={layoutStyles.typing}>
              {typingUsers.join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div style={layoutStyles.inputArea}>
          <input 
            type="file" 
            accept="image/*,video/*" 
            onChange={(e) => setFile(e.target.files[0])} 
            style={layoutStyles.fileInput} 
          />
          <input 
            placeholder="Type your message..." 
            value={inputMessage} 
            onChange={handleInputChange} 
            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()} 
            style={layoutStyles.input} 
          />
          <button 
            onClick={handleSendMessage} 
            disabled={!inputMessage.trim() && !file}
            style={{
              ...layoutStyles.sendButton,
              opacity: (!inputMessage.trim() && !file) ? 0.6 : 1
            }}
          >
            Send
          </button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div style={layoutStyles.overlay}>
          <div style={layoutStyles.confirmModal}>
            <h3 style={{ margin: '0 0 15px 0' }}>Clear Chat</h3>
            <p style={{ margin: '0 0 20px 0', color: '#b9bbbe' }}>
              Are you sure you want to clear all messages in #{currentRoom}? This action cannot be undone.
            </p>
            <div style={layoutStyles.confirmButtons}>
              <button 
                onClick={() => setShowDeleteConfirm(false)}
                style={{ ...layoutStyles.confirmButton, ...layoutStyles.cancelButton }}
              >
                Cancel
              </button>
              <button 
                onClick={handleDeleteChat}
                style={{ ...layoutStyles.confirmButton, ...layoutStyles.confirmDeleteButton }}
              >
                Clear All
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatApp;