// backend/db.js
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',        // your MySQL username
  password: 'Mustakimkazi@1',        // your MySQL password
  database: 'Whatsapp',
  waitForConnections: true,
  connectionLimit: 10,
});

module.exports = pool;
