
/**
 * VCPC IT HELPDESK - MYSQL BACKEND BRIDGE (Bản đầy đủ)
 * Cầu nối giữa giao diện Web và Cơ sở dữ liệu MySQL
 */

const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));

// --- CẤU HÌNH KẾT NỐI MYSQL ---
const dbConfig = {
  host: 'localhost',      // Hoặc IP của máy cài MySQL
  user: 'root',           // Tên đăng nhập
  password: 'your_password', // MẬT KHẨU MYSQL CỦA BẠN
  database: 'helpdesk_vcpc',
  port: 3306
};

let pool;

async function initDB() {
  try {
    pool = await mysql.createPool(dbConfig);
    console.log('--------------------------------------------------');
    console.log('✅ KẾT NỐI MYSQL THÀNH CÔNG!');
    console.log(`📡 Database: ${dbConfig.database}`);
    console.log('--------------------------------------------------');
  } catch (err) {
    console.error('❌ LỖI KẾT NỐI MYSQL:', err.message);
    process.exit(1);
  }
}

// 1. API LẤY DỮ LIỆU (PULL)
app.get('/api/pull', async (req, res) => {
  try {
    const [tickets] = await pool.query('SELECT * FROM Tickets ORDER BY createdAt DESC');
    const [users] = await pool.query('SELECT * FROM Users');
    const [assets] = await pool.query('SELECT * FROM Assets');
    const [logs] = await pool.query('SELECT * FROM SystemLogs ORDER BY timestamp DESC LIMIT 50');
    res.json({ tickets, users, assets, logs });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. API LƯU DỮ LIỆU (PUSH)
app.post('/api/push', async (req, res) => {
  const { type, data } = req.body;
  console.log(`[${new Date().toLocaleTimeString()}] Đang đồng bộ: ${type}`);
  
  try {
    if (type === 'TICKETS' || type === 'ALL') {
      for (const t of data.tickets) {
        await pool.query(
          `REPLACE INTO Tickets (id, title, description, status, priority, category, creatorId, creatorName, department, subsidiary, location, createdAt, updatedAt) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [t.id, t.title, t.description, t.status, t.priority, t.category, t.creatorId, t.creatorName, t.department, t.subsidiary, t.location, t.createdAt, t.updatedAt]
        );
      }
    }

    if (type === 'USERS' || type === 'ALL') {
      for (const u of data.users) {
        await pool.query(
          `REPLACE INTO Users (id, username, password, fullName, role, department, subsidiary) 
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [u.id, u.username, u.password || '123', u.fullName, u.role, u.department, u.subsidiary]
        );
      }
    }

    if (type === 'ASSETS' || type === 'ALL') {
      for (const a of data.assets) {
        await pool.query(
          `REPLACE INTO Assets (id, name, type, serialNumber, status, assignedToId, assignedToName, subsidiary, department, purchaseDate, value) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [a.id, a.name, a.type, a.serialNumber, a.status, a.assignedToId || null, a.assignedToName || null, a.subsidiary, a.department, a.purchaseDate, a.value]
        );
      }
    }

    res.json({ status: "success", timestamp: new Date() });
  } catch (err) {
    console.error('❌ Lỗi PUSH:', err.message);
    res.status(500).json({ error: err.message });
  }
});

initDB().then(() => {
  const PORT = 5000;
  app.listen(PORT, () => {
    console.log(`🚀 API BRIDGE ĐANG CHẠY TẠI: http://localhost:${PORT}`);
    console.log('Dùng địa chỉ trên nhập vào phần Kết nối trong ứng dụng.');
  });
});
