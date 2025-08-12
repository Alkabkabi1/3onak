const mysql = require('mysql2/promise');

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'aounak',
  charset: 'utf8mb4'
};

const pool = mysql.createPool(dbConfig);

module.exports = pool; 