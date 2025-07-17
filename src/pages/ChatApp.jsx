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

  const ws = useRef(null);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const hasConnectedRef = useRef(false);
  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem('user'));
    if (!storedUser) {
      navigate('/');
      return;
    }
    setUser(storedUser);

    if (!hasConnectedRef.current) {
      connectWebSocket(storedUser);
      hasConnectedRef.current = true;
    }

    setTimeout(() => loadMessages(currentRoom, storedUser.token), 0);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const connectWebSocket = (userObj) => {
    ws.current = new WebSocket('ws://localhost:5000');
    ws.current.onopen = () => {
      ws.current.send(JSON.stringify({ type: 'auth', token: userObj.token }));
    };

    ws.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      switch (data.type) {
        case 'authSuccess':
          setRooms(data.rooms);
          setUsers(data.users);
          break;
        case 'message':
          setMessages((prev) => [...prev, data.data]);
          break;
        case 'users':
          setUsers(data.data);
          break;
        case 'typing':
          handleTypingIndicator(data);
          break;
        case 'clear':
          if (data.room === currentRoom) setMessages([]);
          break;
        default:
          break;
      }
    };
  };

  const loadMessages = async (room, token) => {
    try {
      const res = await axios.get(`http://localhost:5000/api/messages/${room}`, {
        headers: { Authorization: token },
      });
      setMessages(res.data);
    } catch (err) {
      console.error('Error loading messages:', err);
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() && !file) return;

    if (file) {
      const formData = new FormData();
      formData.append('file', file);
      try {
        const res = await axios.post('http://localhost:5000/api/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });

        const fileUrl = res.data.url;
        const fileType = file.type.startsWith('video') ? 'video' : 'image';

        if (ws.current && ws.current.readyState === WebSocket.OPEN) {
          ws.current.send(
            JSON.stringify({
              type: 'message',
              content: fileUrl,
              room: currentRoom,
              isFile: true,
              fileType,
            })
          );
        }
      } catch (error) {
        console.error('Upload failed', error);
      }

      setFile(null);
      setInputMessage('');
      return;
    }

    if (inputMessage.trim() && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(
        JSON.stringify({
          type: 'message',
          content: inputMessage,
          room: currentRoom,
        })
      );
      setInputMessage('');
    }

    setIsTyping(false);
    clearTimeout(typingTimeoutRef.current);
  };

  const handleInputChange = (e) => {
    setInputMessage(e.target.value);

    if (!isTyping && ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(
        JSON.stringify({
          type: 'typing',
          typing: true,
          username: user.username,
          room: currentRoom,
        })
      );
      setIsTyping(true);
    }

    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      if (ws.current && ws.current.readyState === WebSocket.OPEN) {
        ws.current.send(
          JSON.stringify({
            type: 'typing',
            typing: false,
            username: user.username,
            room: currentRoom,
          })
        );
      }
      setIsTyping(false);
    }, 2000);
  };

  const handleTypingIndicator = (data) => {
    if (data.username !== user.username) {
      if (data.typing && !typingUsers.includes(data.username)) {
        setTypingUsers((prev) => [...prev, data.username]);
      } else if (!data.typing) {
        setTypingUsers((prev) => prev.filter((u) => u !== data.username));
      }
    }
  };

  const handleLogout = async () => {
    try {
      await axios.post(
        'http://localhost:5000/api/logout',
        {},
        { headers: { Authorization: user.token } }
      );
    } catch (err) {
      console.error('Logout error:', err);
    }
    localStorage.removeItem('user');
    navigate('/');
  };

  // 🎯 Responsive Styles
  const layoutStyles = {
    container: {
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      backgroundColor: '#2f3136',
      color: '#fff',
      fontFamily: 'Segoe UI, sans-serif',
    },
    chatArea: {
      flexGrow: 1,
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: '#36393f',
      width: '100%',
    },
    header: {
      padding: 10,
      borderBottom: '1px solid #444',
      backgroundColor: '#2f3136',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      flexWrap: 'wrap',
    },
    messages: {
      flexGrow: 1,
      padding: 15,
      overflowY: 'auto',
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
      maxHeight: 'calc(100vh - 160px)',
    },
    message: (fromSelf) => ({
      alignSelf: fromSelf ? 'flex-end' : 'flex-start',
      backgroundColor: fromSelf ? '#5865f2' : '#4f545c',
      padding: 10,
      borderRadius: 8,
      maxWidth: '90%',
      wordBreak: 'break-word',
    }),
    inputArea: {
      padding: 10,
      borderTop: '1px solid #444',
      display: 'flex',
      flexWrap: 'wrap',
      gap: 10,
      alignItems: 'center',
      backgroundColor: '#2f3136',
    },
    input: {
      flex: '1 1 200px',
      padding: 10,
      borderRadius: 8,
      border: 'none',
      fontSize: 16,
      outline: 'none',
      color: 'black',
      minWidth: '150px',
    },
    sendButton: {
      backgroundColor: '#5865f2',
      color: 'white',
      padding: '10px 16px',
      border: 'none',
      borderRadius: 6,
      cursor: 'pointer',
    },
    fileInput: {
      minWidth: '100px',
    },
  };

  return (
    <div style={layoutStyles.container}>
      <div style={layoutStyles.chatArea}>
        <div style={layoutStyles.header}>
          <div>#{currentRoom}</div>
          <button onClick={handleLogout} style={layoutStyles.sendButton}>
            Logout
          </button>
        </div>

        <div style={layoutStyles.messages}>
          {messages.map((msg) => (
            <div key={msg.id} style={layoutStyles.message(msg.sender === user.username)}>
              <strong>{msg.sender}</strong>:<br />
              {msg.isFile ? (
                msg.fileType === 'image' ? (
                  <img src={msg.content} alt="sent" style={{ maxWidth: '100%', marginTop: 5 }} />
                ) : (
                  <video controls style={{ maxWidth: '100%', marginTop: 5 }}>
                    <source src={msg.content} type="video/mp4" />
                    Your browser does not support video.
                  </video>
                )
              ) : (
                msg.content
              )}
              {msg.isFile && (
                <div>
                  <a
                    href={msg.content}
                    download
                    style={{ color: '#ccc', fontSize: 12, textDecoration: 'underline' }}
                  >
                    Download
                  </a>
                </div>
              )}
            </div>
          ))}
          <div style={{ fontStyle: 'italic', fontSize: '13px', color: '#aaa' }}>
            {typingUsers.length > 0 && `${typingUsers.join(', ')} typing...`}
          </div>
          <div ref={messagesEndRef} />
        </div>

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
          <button onClick={handleSendMessage} style={layoutStyles.sendButton}>
            Send
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatApp;
