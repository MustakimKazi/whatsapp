const express = require('express');
const cors = require('cors');
const http = require('http');
const WebSocket = require('ws');
const uuid = require('uuid');
const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');
const bodyParser = require('body-parser');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(bodyParser.json());

const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: 'Mustakimkazi@1',
  database: 'Whatsapp',
});

const rooms = ['general', 'random', 'help'];
let messages = [];

function generateToken() {
  return uuid.v4();
}

// === File Upload Setup ===
const UPLOAD_DIR = path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR);

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${uuid.v4()}${ext}`);
  },
});
const upload = multer({ storage });
app.use('/uploads', express.static(UPLOAD_DIR));

app.post('/api/upload', upload.single('file'), (req, res) => {
  const file = req.file;
  if (!file) return res.status(400).json({ error: 'No file uploaded' });
  const fileUrl = `http://localhost:${PORT}/uploads/${file.filename}`;
  res.json({ url: fileUrl });
});

// === SIGN UP ===
app.post('/api/sign_up', async (req, res) => {
  const { email, username, password } = req.body;
  if (!email || !username || !password) return res.status(400).json({ error: 'All fields required' });

  try {
    const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    if (rows.length > 0) return res.status(400).json({ error: 'Email already exists' });

    const password_hash = await bcrypt.hash(password, 10);
    await pool.query(
      'INSERT INTO users (email, username, password_hash, token, status) VALUES (?, ?, ?, NULL, "offline")',
      [email, username, password_hash]
    );

    res.json({ message: 'User created. Please login.' });
  } catch (err) {
    console.error(err);
    res.sendStatus(500);
  }
});

// === LOGIN ===
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    if (rows.length === 0) return res.status(404).json({ error: 'User not found' });

    const user = rows[0];
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) return res.status(400).json({ error: 'Incorrect password' });

    const token = generateToken();
    await pool.query('UPDATE users SET status = "online", token = ? WHERE email = ?', [token, email]);

    res.json({ user: { email, username: user.username, token } });
  } catch (err) {
    console.error(err);
    res.sendStatus(500);
  }
});

// === LOGOUT ===
app.post('/api/logout', async (req, res) => {
  const token = req.headers.authorization;
  await pool.query('UPDATE users SET status = "offline", token = NULL WHERE token = ?', [token]);
  res.sendStatus(200);
});

// === GET MESSAGES BY ROOM ===
app.get('/api/messages/:room', async (req, res) => {
  const token = req.headers.authorization;
  const [rows] = await pool.query('SELECT * FROM users WHERE token = ?', [token]);
  if (rows.length === 0) return res.sendStatus(401);

  const roomMessages = messages.filter((m) => m.room === req.params.room);
  res.json(roomMessages);
});

// === GET ONLINE USERS ===
const getOnlineUsers = async () => {
  const [rows] = await pool.query('SELECT username FROM users WHERE status = "online"');
  return rows;
};

// === WEBSOCKET HANDLING ===
wss.on('connection', (ws) => {
  ws.user = null;

  ws.on('message', async (msg) => {
    let data;
    try {
      data = JSON.parse(msg);
    } catch {
      return ws.send(JSON.stringify({ type: 'error', message: 'Invalid JSON' }));
    }

    if (data.type === 'auth') {
      const [rows] = await pool.query('SELECT * FROM users WHERE token = ?', [data.token]);
      if (rows.length === 0) return;

      ws.user = rows[0];
      await pool.query('UPDATE users SET status = "online" WHERE token = ?', [data.token]);

      ws.send(JSON.stringify({
        type: 'authSuccess',
        user: { username: ws.user.username },
        users: await getOnlineUsers(),
        rooms,
      }));

      broadcastUsers();
    }

    if (data.type === 'message' && ws.user) {
      const message = {
        id: uuid.v4(),
        sender: ws.user.username,
        content: data.content,
        room: data.room || 'general',
        timestamp: new Date().toISOString(),
        isFile: data.isFile || false,
        fileType: data.fileType || '',
      };
      messages.push(message);
      broadcastAll({ type: 'message', data: message });
    }

    if (data.type === 'typing' && ws.user) {
      broadcastAll({
        type: 'typing',
        username: ws.user.username,
        typing: data.typing,
        room: data.room,
      });
    }

    if (data.type === 'clear' && ws.user) {
      messages = messages.filter((m) => m.room !== data.room);
      broadcastAll({ type: 'clear', room: data.room });
    }
  });

  ws.on('close', async () => {
    if (ws.user) {
      await pool.query('UPDATE users SET status = "offline" WHERE token = ?', [ws.user.token]);
      broadcastUsers();
    }
  });
});

function broadcastUsers() {
  getOnlineUsers().then((users) => {
    broadcastAll({ type: 'users', data: users });
  });
}

function broadcastAll(data) {
  const msg = JSON.stringify(data);
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) client.send(msg);
  });
}

// === SERVER START ===
const PORT = 5000;
server.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
