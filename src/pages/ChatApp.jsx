import React, { useState, useEffect, useRef, useContext } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Send, Paperclip, Menu, X, Users, LogOut, Trash2, Circle, Clock, Wifi, WifiOff, Image, Video, Eye, Check, CheckCheck } from 'lucide-react';
import { AuthContext } from '../../AuthContext';

// Enhanced Typing Indicator Component
const TypingIndicator = ({ typingUsers, isMobile }) => {
  if (typingUsers.length === 0) return null;

  return (
    <div style={{
      padding: '12px 16px',
      margin: '8px 16px',
      background: isMobile ? 'rgba(102, 126, 234, 0.1)' : 'rgba(102, 126, 234, 0.15)',
      borderRadius: '18px',
      border: isMobile ? '1px solid rgba(102, 126, 234, 0.2)' : '1px solid rgba(102, 126, 234, 0.3)',
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      maxWidth: 'fit-content',
      animation: 'fadeIn 0.3s ease-in',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
    }}>
      <div className="typing-dots">
        <div className="typing-dot"></div>
        <div className="typing-dot"></div>
        <div className="typing-dot"></div>
      </div>
      <div style={{
        fontSize: '14px',
        fontWeight: '600',
        color: isMobile ? '#667eea' : '#a0aec0',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text'
      }}>
        {typingUsers.join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...
      </div>
    </div>
  );
};

// Enhanced User Status Component
const UserStatus = ({ user, isOnline, lastSeen, isMobile, isCurrentUser }) => {
  const formatLastSeen = (timestamp) => {
    if (!timestamp) return 'Never';
    
    const now = new Date();
    const lastSeen = new Date(timestamp);
    const diffInMinutes = Math.floor((now - lastSeen) / (1000 * 60));
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInDays < 7) return `${diffInDays}d ago`;
    
    return lastSeen.toLocaleDateString();
  };

  const statusColor = isOnline ? '#48bb78' : '#a0aec0';
  const statusText = isOnline ? 'Online' : formatLastSeen(lastSeen);

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      padding: '8px 12px',
      background: isMobile ? '#f7fafc' : 'rgba(255,255,255,0.05)',
      borderRadius: '12px',
      margin: '4px 0',
      border: isMobile ? '1px solid #e2e8f0' : '1px solid rgba(255,255,255,0.1)'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        flex: 1
      }}>
        <div style={{
          width: '10px',
          height: '10px',
          borderRadius: '50%',
          background: statusColor,
          boxShadow: isOnline ? '0 0 8px rgba(72, 187, 120, 0.6)' : 'none',
          animation: isOnline ? 'pulse 2s infinite' : 'none'
        }} />
        <span style={{
          fontWeight: '600',
          fontSize: '14px',
          color: isMobile ? '#2d3748' : '#e2e8f0'
        }}>
          {user.displayName || user.username}
          {isCurrentUser && ' (You)'}
        </span>
      </div>
      <div style={{
        fontSize: '12px',
        color: isMobile ? '#718096' : '#a0aec0',
        fontWeight: '500',
        display: 'flex',
        alignItems: 'center',
        gap: '4px'
      }}>
        {!isOnline && lastSeen && <Clock size={10} />}
        {statusText}
      </div>
    </div>
  );
};

// Seen Status Component
const SeenStatus = ({ seenBy, users, currentUser, isCurrentUser }) => {
  if (!seenBy || seenBy.length === 0) {
    return null;
  }

  const seenByUsers = seenBy.map(username => 
    users.find(u => u.username === username)
  ).filter(Boolean);

  const allUsersSeen = seenByUsers.length === users.length - 1; // Excluding current user

  if (isCurrentUser) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        fontSize: '10px',
        color: '#48bb78',
        marginTop: '4px',
        fontWeight: '600'
      }}>
        {allUsersSeen ? (
          <>
            <CheckCheck size={10} />
            <span>Seen by everyone</span>
          </>
        ) : seenByUsers.length > 0 ? (
          <>
            <Check size={10} />
            <span>Seen by {seenByUsers.length} {seenByUsers.length === 1 ? 'person' : 'people'}</span>
          </>
        ) : (
          <>
            <Check size={10} />
            <span>Sent</span>
          </>
        )}
      </div>
    );
  }

  return null;
};

// Image/Video Preview Component
const MediaPreview = ({ file, onRemove, onSend }) => {
  const [compressedFile, setCompressedFile] = useState(null);
  const [isCompressing, setIsCompressing] = useState(false);

  useEffect(() => {
    if (file) {
      compressMedia(file);
    }
  }, [file]);

  const compressMedia = async (mediaFile) => {
    setIsCompressing(true);
    
    try {
      if (mediaFile.type.startsWith('image/')) {
        await compressImage(mediaFile);
      } else if (mediaFile.type.startsWith('video/')) {
        await compressVideo(mediaFile);
      }
    } catch (error) {
      console.error('Compression error:', error);
      setCompressedFile(mediaFile);
    } finally {
      setIsCompressing(false);
    }
  };

  const compressImage = (imageFile) => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        // Set maximum dimensions for square format
        const maxSize = 400;
        let width = img.width;
        let height = img.height;
        
        // Calculate dimensions for square crop
        const size = Math.min(width, height, maxSize);
        canvas.width = size;
        canvas.height = size;
        
        // Calculate crop coordinates for center
        const sx = (width - size) / 2;
        const sy = (height - size) / 2;
        
        // Draw image cropped to square
        ctx.drawImage(img, sx, sy, size, size, 0, 0, size, size);
        
        // Convert to compressed blob
        canvas.toBlob(
          (blob) => {
            const compressedImageFile = new File([blob], imageFile.name, {
              type: 'image/jpeg',
              lastModified: Date.now()
            });
            setCompressedFile(compressedImageFile);
            resolve();
          },
          'image/jpeg',
          0.7 // 70% quality
        );
      };
      
      img.src = URL.createObjectURL(imageFile);
    });
  };

  const compressVideo = async (videoFile) => {
    // For videos, we'll just use the original file but limit display size
    setCompressedFile(videoFile);
    return Promise.resolve();
  };

  const getFileSize = (file) => {
    if (!file) return '0 KB';
    const sizeInKB = Math.round(file.size / 1024);
    return sizeInKB < 1024 ? `${sizeInKB} KB` : `${(sizeInKB / 1024).toFixed(1)} MB`;
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.8)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 2000,
      padding: '20px',
    }}>
      <div style={{
        background: '#fff',
        borderRadius: '16px',
        padding: '20px',
        maxWidth: '90vw',
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '16px',
      }}>
        <h3 style={{ margin: 0, color: '#2d3748' }}>
          {file.type.startsWith('image/') ? 'Image Preview' : 'Video Preview'}
        </h3>
        
        {isCompressing ? (
          <div style={{
            width: '300px',
            height: '300px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#f7fafc',
            borderRadius: '12px',
          }}>
            <div style={{ textAlign: 'center', color: '#718096' }}>
              <div style={{ fontSize: '14px', marginBottom: '8px' }}>Compressing...</div>
              <div className="typing-dots" style={{ justifyContent: 'center' }}>
                <div className="typing-dot"></div>
                <div className="typing-dot"></div>
                <div className="typing-dot"></div>
              </div>
            </div>
          </div>
        ) : (
          <div style={{
            width: '300px',
            height: '300px',
            borderRadius: '12px',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#f7fafc',
            border: '2px solid #e2e8f0',
          }}>
            {file.type.startsWith('image/') ? (
              <img 
                src={compressedFile ? URL.createObjectURL(compressedFile) : URL.createObjectURL(file)} 
                alt="Preview" 
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  borderRadius: '10px',
                }}
              />
            ) : (
              <video 
                controls
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  borderRadius: '10px',
                }}
              >
                <source src={URL.createObjectURL(file)} type={file.type} />
              </video>
            )}
          </div>
        )}
        
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '8px',
          color: '#718096',
          fontSize: '14px',
        }}>
          <div><strong>{file.name}</strong></div>
          <div>Original: {getFileSize(file)}</div>
          {compressedFile && <div>Compressed: {getFileSize(compressedFile)}</div>}
          {compressedFile && (
            <div style={{ color: '#48bb78', fontWeight: '600' }}>
              {Math.round((1 - compressedFile.size / file.size) * 100)}% smaller
            </div>
          )}
        </div>
        
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={onRemove}
            style={{
              padding: '10px 20px',
              borderRadius: '8px',
              border: '2px solid #e53e3e',
              background: 'transparent',
              color: '#e53e3e',
              cursor: 'pointer',
              fontWeight: '600',
            }}
          >
            Cancel
          </button>
          <button
            onClick={() => onSend(compressedFile || file)}
            disabled={isCompressing}
            style={{
              padding: '10px 20px',
              borderRadius: '8px',
              border: 'none',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              cursor: isCompressing ? 'not-allowed' : 'pointer',
              fontWeight: '600',
              opacity: isCompressing ? 0.6 : 1,
            }}
          >
            {isCompressing ? 'Compressing...' : 'Send'}
          </button>
        </div>
      </div>
    </div>
  );
};

// Square Media Message Component
const MediaMessage = ({ message, isCurrentUser, isMobile, users, currentUser, onSeen }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const messageRef = useRef(null);

  // Track when message becomes visible
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !isCurrentUser) {
          // Mark message as seen
          onSeen(message.id);
        }
      },
      { threshold: 0.5 }
    );

    if (messageRef.current) {
      observer.observe(messageRef.current);
    }

    return () => {
      if (messageRef.current) {
        observer.unobserve(messageRef.current);
      }
    };
  }, [message.id, isCurrentUser, onSeen]);

  return (
    <div ref={messageRef} style={{
      maxWidth: isMobile ? '250px' : '300px',
      background: isCurrentUser ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : isMobile ? '#ffffff' : 'rgba(255,255,255,0.08)',
      padding: '12px',
      borderRadius: isCurrentUser ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
      boxShadow: isCurrentUser ? '0 4px 12px rgba(102, 126, 234, 0.3)' : isMobile ? '0 2px 8px rgba(0,0,0,0.08)' : '0 4px 12px rgba(0,0,0,0.2)',
      border: isMobile && !isCurrentUser ? '1px solid #e2e8f0' : 'none',
    }}>
      {message.fileType === 'image' ? (
        <div style={{ position: 'relative' }}>
          {isLoading && (
            <div style={{
              width: '250px',
              height: '250px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(0,0,0,0.1)',
              borderRadius: '12px',
            }}>
              <div className="typing-dots">
                <div className="typing-dot"></div>
                <div className="typing-dot"></div>
                <div className="typing-dot"></div>
              </div>
            </div>
          )}
          <img 
            src={message.content} 
            alt="Shared" 
            style={{
              width: '250px',
              height: '250px',
              objectFit: 'cover',
              borderRadius: '12px',
              display: isLoading ? 'none' : 'block',
            }}
            onLoad={() => setIsLoading(false)}
            onError={() => {
              setIsLoading(false);
              setHasError(true);
            }}
          />
          {hasError && (
            <div style={{
              width: '250px',
              height: '250px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              background: '#f7fafc',
              borderRadius: '12px',
              color: '#718096',
            }}>
              <Image size={48} />
              <div style={{ marginTop: '8px' }}>Failed to load image</div>
            </div>
          )}
        </div>
      ) : (
        <div style={{ position: 'relative' }}>
          {isLoading && (
            <div style={{
              width: '250px',
              height: '250px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(0,0,0,0.1)',
              borderRadius: '12px',
            }}>
              <div className="typing-dots">
                <div className="typing-dot"></div>
                <div className="typing-dot"></div>
                <div className="typing-dot"></div>
              </div>
            </div>
          )}
          <video 
            controls
            style={{
              width: '250px',
              height: '250px',
              objectFit: 'cover',
              borderRadius: '12px',
              display: isLoading ? 'none' : 'block',
            }}
            onLoadedData={() => setIsLoading(false)}
            onError={() => {
              setIsLoading(false);
              setHasError(true);
            }}
          >
            <source src={message.content} type="video/mp4" />
          </video>
          {hasError && (
            <div style={{
              width: '250px',
              height: '250px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              background: '#f7fafc',
              borderRadius: '12px',
              color: '#718096',
            }}>
              <Video size={48} />
              <div style={{ marginTop: '8px' }}>Failed to load video</div>
            </div>
          )}
        </div>
      )}
      
      <div style={{ marginTop: '8px' }}>
        <a 
          href={message.content} 
          download 
          style={{ 
            color: isCurrentUser ? '#fff' : isMobile ? '#667eea' : '#a0aec0', 
            fontSize: '12px', 
            textDecoration: 'underline', 
            fontWeight: '500',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}
        >
          {message.fileType === 'image' ? <Image size={12} /> : <Video size={12} />}
          Download {message.fileType === 'image' ? 'Image' : 'Video'}
        </a>
      </div>

      {/* Seen Status for Media Messages */}
      <SeenStatus 
        seenBy={message.seenBy} 
        users={users} 
        currentUser={currentUser}
        isCurrentUser={isCurrentUser}
      />
    </div>
  );
};

// Text Message Component
const TextMessage = ({ message, isCurrentUser, isMobile, users, currentUser, onSeen }) => {
  const messageRef = useRef(null);

  // Track when message becomes visible
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !isCurrentUser) {
          // Mark message as seen
          onSeen(message.id);
        }
      },
      { threshold: 0.5 }
    );

    if (messageRef.current) {
      observer.observe(messageRef.current);
    }

    return () => {
      if (messageRef.current) {
        observer.unobserve(messageRef.current);
      }
    };
  }, [message.id, isCurrentUser, onSeen]);

  return (
    <div ref={messageRef} style={{
      background: isCurrentUser ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : isMobile ? '#ffffff' : 'rgba(255,255,255,0.08)',
      color: isCurrentUser ? '#fff' : isMobile ? '#2d3748' : '#e2e8f0',
      padding: '12px 16px',
      borderRadius: isCurrentUser ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
      boxShadow: isCurrentUser ? '0 4px 12px rgba(102, 126, 234, 0.3)' : isMobile ? '0 2px 8px rgba(0,0,0,0.08)' : '0 4px 12px rgba(0,0,0,0.2)',
      border: isMobile && !isCurrentUser ? '1px solid #e2e8f0' : 'none',
      wordBreak: 'break-word',
      maxWidth: isMobile ? '85%' : '60%',
    }}>
      <div style={{ fontSize: '11px', opacity: 0.8, marginBottom: '6px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
        {message.timestamp ? new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
      </div>
      <div style={{ fontSize: '15px', lineHeight: '1.5' }}>{message.content}</div>
      
      {/* Seen Status for Text Messages */}
      <SeenStatus 
        seenBy={message.seenBy} 
        users={users} 
        currentUser={currentUser}
        isCurrentUser={isCurrentUser}
      />
    </div>
  );
};

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
  const [staticUsers, setStaticUsers] = useState([]);
  const [showMediaPreview, setShowMediaPreview] = useState(false);

  const ws = useRef(null);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const hasConnectedRef = useRef(false);
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const BASE_URL = 'https://backend-bl4w.onrender.com';
  const WS_URL = 'wss://backend-bl4w.onrender.com';

  // Fetch static users from backend
  const fetchStaticUsers = async () => {
    try {
      console.log('📥 Fetching static users...');
      const response = await axios.get(`${BASE_URL}/api/static-users`);
      if (response.data.success) {
        setStaticUsers(response.data.users);
        console.log(`✅ Loaded ${response.data.users.length} static users`);
      }
    } catch (error) {
      console.error('❌ Error fetching static users:', error);
    }
  };

  // Fetch all users with live status
  const fetchAllUsers = async () => {
    try {
      console.log('📥 Fetching all users...');
      const response = await axios.get(`${BASE_URL}/api/users`);
      if (response.data.success) {
        setUsers(response.data.users);
        console.log(`✅ Loaded ${response.data.users.length} users (${response.data.onlineCount} online)`);
      }
    } catch (error) {
      console.error('❌ Error fetching users:', error);
    }
  };

  // Enhanced user status calculation
  const getUserStatus = (userObj) => {
    if (userObj.status === 'online') {
      return 'online';
    }
    return 'offline';
  };

  // Count online users
  const onlineUsersCount = users.filter(u => getUserStatus(u) === 'online').length;
  const totalUsersCount = users.length;

  // Handle message seen
  const handleMessageSeen = (messageId) => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({
        type: 'messageSeen',
        room: currentRoom,
        messageId: messageId
      }));
    }
  };

  // Update message seen status when received from server
  const updateMessageSeenStatus = (messageId, seenBy) => {
    setMessages(prev => prev.map(msg => 
      msg.id === messageId ? { ...msg, seenBy } : msg
    ));
  };

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
    
    // Fetch static users and all users
    fetchStaticUsers();
    fetchAllUsers();

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
        }, 25000);
      };

      ws.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('📨 WebSocket message:', data);

          switch (data.type) {
            case 'authSuccess':
              setRooms(data.rooms || ['general']);
              setUsers(data.users || []);
              console.log(`✅ Loaded ${data.users.length} users, ${data.onlineCount} online`);
              break;
            case 'message':
              // Append only messages for current room
              if (!data.data.room || data.data.room === currentRoom) {
                setMessages((prev) => [...prev, data.data]);
              }
              break;
            case 'userStatusUpdate':
              setUsers(data.users || []);
              console.log(`🔄 User status update: ${data.onlineCount} online`);
              break;
            case 'typingUpdate':
              setTypingUsers(data.typingUsers || []);
              console.log(`⌨️ Typing update: ${data.typingUsers.join(', ')}`);
              break;
            case 'messageSeen':
              updateMessageSeenStatus(data.messageId, data.seenBy);
              console.log(`👀 Message ${data.messageId} seen by ${data.seenByUser}`);
              break;
            case 'clear':
              if (data.room === currentRoom) {
                setMessages([]);
                setShowDeleteConfirm(false);
              }
              break;
            case 'pong':
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

  const handleSendMessage = async (compressedFile = null) => {
    const fileToSend = compressedFile || file;
    
    if (!inputMessage.trim() && !fileToSend) return;

    // Check WebSocket connection
    if (!ws.current || ws.current.readyState !== WebSocket.OPEN) {
      console.error('❌ WebSocket not connected');
      alert('Connection lost. Please refresh the page.');
      return;
    }

    // Handle file upload
    if (fileToSend) {
      const formData = new FormData();
      formData.append('file', fileToSend);
      try {
        const res = await axios.post(`${BASE_URL}/api/upload`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        const fileUrl = res.data.url;
        const fileType = fileToSend.type.startsWith('video') ? 'video' : 'image';

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
        setShowMediaPreview(false);
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
      ws.current.send(JSON.stringify({ 
        type: 'typing', 
        typing: false, 
        room: currentRoom 
      }));
    }
  };

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type.startsWith('image/') || selectedFile.type.startsWith('video/')) {
        setFile(selectedFile);
        setShowMediaPreview(true);
      } else {
        alert('Please select an image or video file.');
      }
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
    

      {/* Media Preview Modal */}
      {showMediaPreview && file && (
        <MediaPreview
          file={file}
          onRemove={() => {
            setShowMediaPreview(false);
            setFile(null);
            if (fileInputRef.current) fileInputRef.current.value = '';
          }}
          onSend={handleSendMessage}
        />
      )}

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

          {/* Static Users Section */}
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
                justifyContent: 'space-between',
                gap: '8px',
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Users size={14} />
                Static Users ({staticUsers.length})
              </span>
            </h4>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
                maxHeight: '200px',
                overflowY: 'auto',
              }}
            >
              {staticUsers.map((staticUser, index) => {
                // Find the live status from the users array
                const liveUser = users.find(u => u.username === staticUser.username);
                const isUserOnline = liveUser ? getUserStatus(liveUser) === 'online' : false;
                const lastSeen = liveUser?.lastSeen || staticUser.lastSeen;
                const isCurrentUser = staticUser.username === user.username;
                
                return (
                  <UserStatus
                    key={`static-${index}`}
                    user={staticUser}
                    isOnline={isUserOnline}
                    lastSeen={lastSeen}
                    isMobile={isMobile}
                    isCurrentUser={isCurrentUser}
                  />
                );
              })}
              
              {staticUsers.length === 0 && (
                <div style={{ 
                  textAlign: 'center', 
                  fontSize: '12px', 
                  color: isMobile ? '#a0aec0' : '#718096',
                  padding: '20px 0'
                }}>
                  No static users found
                </div>
              )}
            </div>
          </div>

          {/* Enhanced Online Users Section */}
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
                justifyContent: 'space-between',
                gap: '8px',
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Users size={14} />
                Online Users ({onlineUsersCount}/{totalUsersCount})
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                {isConnected ? (
                  <Wifi size={12} color="#48bb78" />
                ) : (
                  <WifiOff size={12} color="#ed8936" />
                )}
              </div>
            </h4>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
                maxHeight: '200px',
                overflowY: 'auto',
              }}
            >
              {users.map((userObj, index) => {
                const isUserOnline = getUserStatus(userObj) === 'online';
                const lastSeen = userObj.lastSeen;
                const isCurrentUser = userObj.username === user.username;
                const isStaticUser = staticUsers.some(su => su.username === userObj.username);
                
                return (
                  <UserStatus
                    key={index}
                    user={userObj}
                    isOnline={isUserOnline}
                    lastSeen={lastSeen}
                    isMobile={isMobile}
                    isCurrentUser={isCurrentUser}
                  />
                );
              })}
              
              {users.length === 0 && (
                <div style={{ 
                  textAlign: 'center', 
                  fontSize: '12px', 
                  color: isMobile ? '#a0aec0' : '#718096',
                  padding: '20px 0'
                }}>
                  No users found
                </div>
              )}
            </div>
            
            {/* Connection Status */}
            <div style={{ 
              marginTop: '12px',
              padding: '8px 12px',
              background: isMobile ? 'rgba(102, 126, 234, 0.1)' : 'rgba(255,255,255,0.05)',
              borderRadius: '8px',
              fontSize: '11px',
              color: isMobile ? '#667eea' : '#a0aec0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
              <span>Connection Status:</span>
              <span style={{ 
                color: isConnected ? '#48bb78' : '#ed8936',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}>
                {isConnected ? (
                  <>
                    <Wifi size={10} />
                    Live
                  </>
                ) : (
                  <>
                    <WifiOff size={10} />
                    Connecting...
                  </>
                )}
              </span>
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
            
            {/* Online users count in header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '13px',
              color: isMobile ? '#718096' : '#a0aec0',
              background: isMobile ? '#f7fafc' : 'rgba(255,255,255,0.05)',
              padding: '4px 10px',
              borderRadius: '12px',
            }}>
              <Users size={14} />
              <span>{onlineUsersCount} online</span>
            </div>
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
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 12px',
              background: isConnected 
                ? (isMobile ? 'rgba(72, 187, 120, 0.1)' : 'rgba(72, 187, 120, 0.2)')
                : (isMobile ? 'rgba(237, 137, 54, 0.1)' : 'rgba(237, 137, 54, 0.2)'),
              borderRadius: '20px',
              fontSize: '12px',
              fontWeight: '600',
              color: isConnected ? '#48bb78' : '#ed8936',
              border: isConnected 
                ? '1px solid rgba(72, 187, 120, 0.3)' 
                : '1px solid rgba(237, 137, 54, 0.3)'
            }}>
              <div style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: isConnected ? '#48bb78' : '#ed8936',
                boxShadow: isConnected 
                  ? '0 0 8px rgba(72, 187, 120, 0.6)' 
                  : '0 0 8px rgba(237, 137, 54, 0.6)',
                animation: isConnected ? 'pulse 2s infinite' : 'none'
              }} />
              {isConnected ? (
                <>
                  <Wifi size={12} />
                  <span>Live Connection</span>
                </>
              ) : (
                <>
                  <WifiOff size={12} />
                  <span>Connecting...</span>
                </>
              )}
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
              const isCurrentUser = msg.sender === user?.username;
              
              return (
                <div
                  key={key}
                  style={{
                    display: 'flex',
                    justifyContent: isCurrentUser ? 'flex-end' : 'flex-start',
                    alignItems: 'flex-end',
                    gap: '8px',
                  }}
                >
                  {!isCurrentUser && (
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      flexShrink: 0,
                    }}>
                      {(msg.senderName || msg.sender || 'U').charAt(0).toUpperCase()}
                    </div>
                  )}
                  
                  <div
                    style={{
                      maxWidth: isMobile ? '85%' : '60%',
                    }}
                  >
                    {!isCurrentUser && (
                      <div style={{ 
                        fontSize: '12px', 
                        opacity: 0.8, 
                        marginBottom: '4px', 
                        fontWeight: '600',
                        color: isMobile ? '#667eea' : '#a0aec0',
                        paddingLeft: '8px'
                      }}>
                        {msg.senderName || msg.sender}
                      </div>
                    )}
                    
                    {msg.isFile ? (
                      <MediaMessage 
                        message={msg} 
                        isCurrentUser={isCurrentUser}
                        isMobile={isMobile}
                      />
                    ) : (
                      <div
                        style={{
                          background: isCurrentUser ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : isMobile ? '#ffffff' : 'rgba(255,255,255,0.08)',
                          color: isCurrentUser ? '#fff' : isMobile ? '#2d3748' : '#e2e8f0',
                          padding: '12px 16px',
                          borderRadius: isCurrentUser ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                          boxShadow: isCurrentUser ? '0 4px 12px rgba(102, 126, 234, 0.3)' : isMobile ? '0 2px 8px rgba(0,0,0,0.08)' : '0 4px 12px rgba(0,0,0,0.2)',
                          border: isMobile && !isCurrentUser ? '1px solid #e2e8f0' : 'none',
                          wordBreak: 'break-word',
                        }}
                      >
                        <div style={{ fontSize: '11px', opacity: 0.8, marginBottom: '6px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                          {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                        </div>
                        <div style={{ fontSize: '15px', lineHeight: '1.5' }}>{msg.content}</div>
                      </div>
                    )}
                  </div>
                  
                  {isCurrentUser && (
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #48bb78 0%, #38a169 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      flexShrink: 0,
                    }}>
                      {(user.username || 'U').charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
              );
            })
          )}

          {/* Enhanced Typing Indicator */}
          <TypingIndicator 
            typingUsers={typingUsers} 
            isMobile={isMobile} 
          />

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
            <input 
              ref={fileInputRef} 
              type="file" 
              accept="image/*,video/*" 
              onChange={handleFileSelect}
              style={{ display: 'none' }} 
              id="file-upload" 
            />
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
              onClick={() => handleSendMessage()}
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

          {file && !showMediaPreview && (
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
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {file.type.startsWith('image/') ? <Image size={16} /> : <Video size={16} />}
                {file.name}
              </span>
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

      {/* Add enhanced CSS animations */}
      <style>{`
        @keyframes typingBounce {
          0%, 60%, 100% {
            transform: translateY(0);
            opacity: 0.7;
          }
          30% {
            transform: translateY(-10px);
            opacity: 1;
          }
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes pulse {
          0%, 100% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.7;
            transform: scale(1.05);
          }
        }

        .typing-dots {
          display: flex;
          gap: 4px;
        }

        .typing-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          animation: typingBounce 1.4s ease-in-out infinite;
        }

        .typing-dot:nth-child(2) {
          animation-delay: 0.2s;
        }

        .typing-dot:nth-child(3) {
          animation-delay: 0.4s;
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