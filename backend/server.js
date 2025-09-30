require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const WebSocket = require('ws');
const uuid = require('uuid');
const bcrypt = require('bcryptjs');
const bodyParser = require('body-parser');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { MongoClient } = require('mongodb');

// === MongoDB Connection ===
const uri = "mongodb+srv://mohdmustakimkazi_db_user:HugPu2kIqGxOdhNF@whatsapp.dzac4go.mongodb.net/?retryWrites=true&w=majority&appName=whatsapp";

console.log('🔗 Connecting to MongoDB...');

const client = new MongoClient(uri, {
  serverSelectionTimeoutMS: 10000,
  connectTimeoutMS: 15000,
});

let db;
let isConnected = false;

async function connectDB() {
  if (db && isConnected) return db;
  
  try {
    await client.connect();
    db = client.db('whatsapp');
    isConnected = true;
    
    console.log('✅ Connected to MongoDB Atlas - WhatsApp Database');
    
    const users = db.collection('users');
    const userCount = await users.countDocuments();
    console.log(`📊 Found ${userCount} existing users in database`);
    
    return db;
  } catch (err) {
    console.error('❌ MongoDB connection error:', err.message);
    return null;
  }
}

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Store active connections
const activeConnections = new Map(); // username -> WebSocket

// CORS setup
app.use(cors({
  origin: ['http://localhost:5173', 'https://whatsapp-n8xf.vercel.app', 'https://whatsapp-60un.onrender.com'],
  credentials: true,
}));

app.use(bodyParser.json());

// === File upload setup ===
const UPLOAD_DIR = path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});
const upload = multer({ storage });
app.use('/uploads', express.static(UPLOAD_DIR));

// === Utility functions ===
function generateToken() {
  return uuid.v4();
}

// Broadcast user status to all connected clients
function broadcastUserStatus() {
  const statusMessage = {
    type: 'userStatusUpdate',
    timestamp: new Date().toISOString()
  };
  
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(statusMessage));
    }
  });
}

// Update user status in database
async function updateUserStatus(username, status, lastSeen = null) {
  try {
    const db = await connectDB();
    if (!db) return;

    const users = db.collection('users');
    const updateData = { status };
    
    if (lastSeen) {
      updateData.lastSeen = lastSeen;
    }
    
    await users.updateOne(
      { username }, 
      { $set: updateData }
    );
    
    console.log(`👤 ${username} is now ${status}`);
  } catch (err) {
    console.error('Error updating user status:', err);
  }
}

// === Routes ===

// Health check
app.get('/api/health', async (req, res) => {
  const db = await connectDB();
  const onlineCount = activeConnections.size;
  
  res.json({ 
    status: db ? 'Connected' : 'Disconnected',
    database: 'whatsapp',
    onlineUsers: onlineCount,
    timestamp: new Date().toISOString()
  });
});

// File upload
app.post('/api/upload', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
  res.json({ url: fileUrl });
});

// === SIGNUP ===
app.post('/api/sign_up', async (req, res) => {
  const { email, username, password } = req.body;
  
  if (!email || !username || !password) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  try {
    const db = await connectDB();
    if (!db) return res.status(503).json({ error: 'Database unavailable' });

    const users = db.collection('users');

    if (await users.findOne({ email })) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    const password_hash = await bcrypt.hash(password, 10);
    
    await users.insertOne({ 
      email, 
      username, 
      password_hash,
      token: null, 
      status: "offline",
      lastSeen: new Date().toISOString(),
      createdAt: new Date().toISOString()
    });

    console.log('👤 New user registered:', username);
    res.json({ message: 'User created successfully. Please login.' });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// === LOGIN ===
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }

  try {
    const db = await connectDB();
    if (!db) return res.status(503).json({ error: 'Database unavailable' });

    const users = db.collection('users');
    const user = await users.findOne({ email });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check password - handle both hashed and plain text
    let isPasswordValid = false;
    
    if (user.password_hash) {
      isPasswordValid = await bcrypt.compare(password, user.password_hash);
    } else if (user.password_ba81d) {
      isPasswordValid = (password === user.password_ba81d);
      
      if (isPasswordValid) {
        const password_hash = await bcrypt.hash(password, 10);
        await users.updateOne({ email }, { 
          $set: { password_hash },
          $unset: { password_ba81d: "" }
        });
      }
    }

    if (!isPasswordValid) {
      return res.status(400).json({ error: 'Incorrect password' });
    }

    const token = generateToken();
    await users.updateOne({ email }, { 
      $set: { 
        token, 
        status: "online",
        lastLogin: new Date().toISOString()
      } 
    });

    console.log('🔑 User logged in:', user.username);
    res.json({ 
      user: { 
        email: user.email, 
        username: user.username, 
        token,
        status: "online"
      } 
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// === GET ALL USERS (with online status) ===
app.get('/api/users', async (req, res) => {
  try {
    const db = await connectDB();
    if (!db) return res.status(503).json({ error: 'Database unavailable' });

    const users = db.collection('users');
    const allUsers = await users.find({})
      .project({ password_hash: 0, password_ba81d: 0, token: 0 })
      .sort({ username: 1 })
      .toArray();
    
    // Enhance with real-time online status from active connections
    const usersWithRealTimeStatus = allUsers.map(user => ({
      ...user,
      // User is actually online if they have an active WebSocket connection
      isOnline: activeConnections.has(user.username),
      // Use real-time status if online, otherwise use database status
      status: activeConnections.has(user.username) ? 'online' : user.status
    }));
    
    res.json(usersWithRealTimeStatus);
  } catch (err) {
    console.error('Get users error:', err);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// === GET ONLINE USERS COUNT ===
app.get('/api/online-users', async (req, res) => {
  try {
    const db = await connectDB();
    if (!db) return res.status(503).json({ error: 'Database unavailable' });

    const users = db.collection('users');
    const onlineUsers = await users.find({ status: 'online' })
      .project({ username: 1, lastSeen: 1 })
      .toArray();

    res.json({
      onlineCount: activeConnections.size,
      activeUsers: Array.from(activeConnections.keys()),
      databaseOnlineUsers: onlineUsers
    });
  } catch (err) {
    console.error('Get online users error:', err);
    res.status(500).json({ error: 'Failed to fetch online users' });
  }
});

// === GET MESSAGES ===
app.get('/api/messages/:room', async (req, res) => {
  const token = req.headers.authorization;
  if (!token) return res.status(401).json({ error: 'Authentication required' });

  try {
    const db = await connectDB();
    if (!db) return res.status(503).json({ error: 'Database unavailable' });

    const users = db.collection('users');
    const messagesCollection = db.collection('messages');

    const user = await users.findOne({ token });
    if (!user) return res.status(401).json({ error: 'Invalid token' });

    const roomMessages = await messagesCollection
      .find({ room: req.params.room })
      .sort({ timestamp: 1 })
      .toArray();

    res.json(roomMessages);
  } catch (err) {
    console.error('Get messages error:', err);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// === WEBSOCKET ===
wss.on('connection', (ws) => {
  console.log('🔌 New WebSocket connection');
  ws.user = null;

  ws.on('message', async (data) => {
    try {
      const message = JSON.parse(data);
      
      if (message.type === 'auth') {
        // Authentication
        const db = await connectDB();
        if (db) {
          const users = db.collection('users');
          const user = await users.findOne({ token: message.token });
          if (user) {
            ws.user = user;
            
            // Add to active connections
            activeConnections.set(user.username, ws);
            
            // Update user status to online
            await updateUserStatus(user.username, 'online');
            
            // Broadcast status update to all clients
            broadcastUserStatus();
            
            ws.send(JSON.stringify({ 
              type: 'authSuccess', 
              user: { 
                username: user.username,
                status: 'online'
              } 
            }));
            
            console.log(`✅ ${user.username} authenticated via WebSocket`);
          }
        }
      }
      
      if (message.type === 'message' && ws.user) {
        const db = await connectDB();
        const messagesCollection = db.collection('messages');
        
        const newMessage = {
          id: uuid.v4(),
          sender: ws.user.username,
          content: message.content,
          room: message.room || 'general',
          timestamp: new Date().toISOString(),
        };

        await messagesCollection.insertOne(newMessage);

        // Broadcast to all clients
        wss.clients.forEach(client => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({
              type: 'message',
              data: newMessage
            }));
          }
        });
      }
      
      // Handle typing indicators
      if (message.type === 'typing' && ws.user) {
        wss.clients.forEach(client => {
          if (client !== ws && client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({
              type: 'typing',
              user: ws.user.username,
              isTyping: message.isTyping,
              room: message.room
            }));
          }
        });
      }
      
    } catch (err) {
      console.error('WebSocket error:', err);
    }
  });

  // Handle connection close
  ws.on('close', async () => {
    if (ws.user) {
      const username = ws.user.username;
      
      // Remove from active connections
      activeConnections.delete(username);
      
      // Update user status to offline with last seen timestamp
      const lastSeen = new Date().toISOString();
      await updateUserStatus(username, 'offline', lastSeen);
      
      // Broadcast status update to all clients
      broadcastUserStatus();
      
      console.log(`❌ ${username} disconnected. Last seen: ${lastSeen}`);
    }
  });

  // Handle connection errors
  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });
});

// Clean up inactive connections periodically
setInterval(() => {
  const now = Date.now();
  wss.clients.forEach(client => {
    // You can add ping/pong logic here for more accurate connection tracking
    if (client.isAlive === false) {
      return client.terminate();
    }
    client.isAlive = false;
    client.ping(() => {});
  });
}, 30000);

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('🔄 Shutting down server...');
  
  // Update all online users to offline
  try {
    const db = await connectDB();
    if (db) {
      const users = db.collection('users');
      await users.updateMany(
        { status: 'online' }, 
        { 
          $set: { 
            status: 'offline',
            lastSeen: new Date().toISOString()
          } 
        }
      );
      console.log('✅ All users set to offline');
    }
  } catch (err) {
    console.error('Error during shutdown:', err);
  }
  
  process.exit(0);
});

// === START SERVER ===
const PORT = process.env.PORT || 5000;
server.listen(PORT, async () => {
  console.log('='.repeat(50));
  console.log(`✅ WhatsApp Server running on port ${PORT}`);
  
  const db = await connectDB();
  if (db) {
    console.log('✅ Connected to your existing WhatsApp database');
    
    // Initialize all users as offline on server start
    const users = db.collection('users');
    await users.updateMany(
      { status: 'online' }, 
      { 
        $set: { 
          status: 'offline',
          lastSeen: new Date().toISOString()
        } 
      }
    );
    console.log('✅ All users initialized as offline');
  } else {
    console.log('❌ Database connection failed');
  }
  
  console.log(`✅ Health: http://localhost:${PORT}/api/health`);
  console.log(`✅ Online users: http://localhost:${PORT}/api/online-users`);
  console.log('='.repeat(50));
});