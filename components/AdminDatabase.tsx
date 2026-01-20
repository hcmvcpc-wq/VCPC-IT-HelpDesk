
import React, { useState, useEffect } from 'react';
import { db } from '../services/dbService';
import { exportFullDatabaseToExcel } from '../services/excelService';
import { generateSQLSchema, generateSQLDataMigration } from '../services/sqlService';

const AdminDatabase: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'CONFIG' | 'SQL' | 'BACKEND'>('CONFIG');
  const [mysqlUrl, setMysqlUrl] = useState(db.getMysqlApiUrl() || '');
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState(db.getLastSyncTime());

  useEffect(() => {
    const syncListener = () => setLastSync(db.getLastSyncTime());
    window.addEventListener('local_db_update', syncListener);
    return () => window.removeEventListener('local_db_update', syncListener);
  }, []);

  const handleConnectMysql = async () => {
    if (!mysqlUrl.startsWith('http')) {
      alert("URL phải bắt đầu bằng http:// hoặc https://");
      return;
    }
    setSyncing(true);
    try {
      db.setMysqlApiUrl(mysqlUrl);
      const ok = await db.syncFromMysql();
      if (ok) alert("Kết nối MySQL Bridge thành công!");
      else alert("Không thể lấy dữ liệu từ Bridge API. Hãy kiểm tra Backend của bạn.");
    } catch (e) {
      alert("Lỗi kết nối.");
    } finally {
      setSyncing(false);
    }
  };

  const sqlCode = generateSQLSchema() + "\n" + generateSQLDataMigration({
    users: db.getUsers(),
    assets: db.getAssets(),
    tickets: db.getTickets(),
    logs: db.getLogs()
  });

  const nodeCode = `
const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));

const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: 'your_password',
  database: 'helpdesk_db',
  waitForConnections: true
});

// PULL: Lấy dữ liệu từ MySQL về App
app.get('/api/pull', async (req, res) => {
  try {
    const [tickets] = await pool.query('SELECT * FROM Tickets');
    const [users] = await pool.query('SELECT * FROM Users');
    const [assets] = await pool.query('SELECT * FROM Assets');
    res.json({ tickets, users, assets });
  } catch (err) { res.status(500).json(err); }
});

// PUSH: Lưu dữ liệu từ App vào MySQL
app.post('/api/push', async (req, res) => {
  const { type, data } = req.body;
  // Gợi ý: Sử dụng INSERT ... ON DUPLICATE KEY UPDATE để đồng bộ
  console.log("Syncing " + type);
  res.json({ status: "ok" });
});

app.listen(5000, () => console.log('MySQL Bridge running on port 5000'));
`;

  return (
    <div className="p-6 md:p-10 max-w-6xl mx-auto pb-24 page-enter">
      <div className="flex justify-between items-start mb-10">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight leading-none">MySQL <span className="text-orange-600">Connector</span></h1>
          <p className="text-slate-500 font-medium mt-3">Thiết lập kết nối cơ sở dữ liệu doanh nghiệp.</p>
        </div>
        <div className="flex items-center space-x-3 bg-white px-5 py-3 rounded-2xl border border-slate-100 shadow-sm">
          <div className={`w-3 h-3 rounded-full transition-opacity duration-1000 ${mysqlUrl ? 'bg-orange-500 shadow-[0_0_10px_#f97316]' : 'bg-slate-300'}`}></div>
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{mysqlUrl ? 'MySQL Live' : 'Offline'}</span>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex p-1.5 bg-slate-200/50 rounded-2xl mb-8 w-fit">
        <button onClick={() => setActiveTab('CONFIG')} className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'CONFIG' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>Cấu hình</button>
        <button onClick={() => setActiveTab('SQL')} className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'SQL' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>SQL Schema</button>
        <button onClick={() => setActiveTab('BACKEND')} className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'BACKEND' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>Backend Code</button>
      </div>

      {activeTab === 'CONFIG' && (
        <div className="space-y-8 animate-in fade-in duration-300">
          <div className="p-10 bg-gradient-to-br from-orange-600 to-orange-500 rounded-[3rem] text-white shadow-2xl relative overflow-hidden">
            <div className="relative z-10">
              <h3 className="text-2xl font-black mb-2">MySQL Bridge API</h3>
              <p className="text-orange-100 text-sm mb-8">Ứng dụng sẽ đồng bộ dữ liệu qua API Bridge này.</p>
              
              <div className="space-y-4">
                <input 
                  type="text" 
                  value={mysqlUrl}
                  onChange={(e) => setMysqlUrl(e.target.value)}
                  placeholder="VD: http://192.168.1.10:5000/api"
                  className="w-full px-6 py-4 bg-white/20 border border-white/20 rounded-2xl outline-none focus:bg-white focus:text-slate-900 transition-all placeholder:text-orange-200"
                />
                <div className="flex gap-4">
                  <button onClick={handleConnectMysql} disabled={syncing} className="flex-1 py-4 bg-white text-orange-600 rounded-2xl font-black hover:bg-orange-50 transition active:scale-[0.98]">
                    {syncing ? 'Đang kết nối...' : 'Kết nối & Pull dữ liệu'}
                  </button>
                  <button onClick={() => { db.setMysqlApiUrl(''); setMysqlUrl(''); }} className="px-8 py-4 bg-black/20 text-white rounded-2xl font-black hover:bg-black/30 transition">Ngắt</button>
                </div>
              </div>

              {lastSync && (
                <p className="mt-6 text-[10px] font-black uppercase tracking-[0.2em] text-orange-200">
                  <i className="fa-solid fa-clock-rotate-left mr-2"></i>
                  Đồng bộ cuối: {new Date(lastSync).toLocaleString('vi-VN')}
                </p>
              )}
            </div>
            <div className="absolute -bottom-10 -right-10 text-white/10 text-[12rem] rotate-12">
              <i className="fa-solid fa-database"></i>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100">
              <h4 className="font-black text-slate-800 mb-4 flex items-center gap-3">
                <i className="fa-solid fa-file-excel text-emerald-500"></i>
                Dự phòng Excel
              </h4>
              <button 
                onClick={() => exportFullDatabaseToExcel({
                  tickets: db.getTickets(),
                  assets: db.getAssets(),
                  users: db.getUsers(),
                  logs: db.getLogs()
                })}
                className="w-full py-4 bg-slate-50 text-slate-600 rounded-2xl font-bold hover:bg-emerald-50 hover:text-emerald-700 transition"
              >
                Tải Excel Master (All tables)
              </button>
            </div>
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100">
              <h4 className="font-black text-slate-800 mb-4 flex items-center gap-3">
                <i className="fa-solid fa-circle-nodes text-blue-500"></i>
                Google Sheets Bridge
              </h4>
              <input 
                type="text" 
                defaultValue={db.getCloudUrl() || ''}
                onBlur={(e) => db.setCloudUrl(e.target.value)}
                placeholder="Google Script URL..."
                className="w-full px-5 py-3 bg-slate-50 border border-slate-100 rounded-xl text-xs font-medium outline-none"
              />
            </div>
          </div>
        </div>
      )}

      {activeTab === 'SQL' && (
        <div className="animate-in slide-in-from-bottom-4 duration-300">
          <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white relative">
            <div className="flex justify-between items-center mb-6">
              <p className="text-[10px] font-black uppercase tracking-widest text-orange-400">MySQL Initial Schema</p>
              <button onClick={() => navigator.clipboard.writeText(sqlCode)} className="text-xs font-bold hover:text-orange-400 transition">Copy Script</button>
            </div>
            <pre className="text-[11px] font-mono text-slate-300 bg-black/30 p-6 rounded-2xl overflow-x-auto max-h-[60vh] scrollbar-hide leading-relaxed">
              {sqlCode}
            </pre>
          </div>
        </div>
      )}

      {activeTab === 'BACKEND' && (
        <div className="animate-in slide-in-from-bottom-4 duration-300">
          <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white">
             <div className="flex justify-between items-center mb-6">
               <div>
                 <h4 className="font-black text-orange-400">Node.js Bridge API (Reference)</h4>
                 <p className="text-slate-400 text-[10px] mt-1 uppercase font-bold tracking-widest">Triển khai trên máy chủ của bạn để kết nối MySQL</p>
               </div>
               <button onClick={() => navigator.clipboard.writeText(nodeCode)} className="px-4 py-2 bg-white/10 rounded-xl text-xs font-bold hover:bg-white/20 transition">Copy Code</button>
             </div>
             <pre className="text-[11px] font-mono text-slate-300 bg-black/30 p-6 rounded-2xl overflow-x-auto max-h-[60vh] scrollbar-hide leading-relaxed">
               {nodeCode}
             </pre>
             <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
               <div className="p-6 bg-white/5 rounded-2xl border border-white/10">
                 <p className="text-[10px] font-black text-orange-400 uppercase mb-2">Cài đặt gói</p>
                 <code className="text-xs font-mono">npm install express mysql2 cors</code>
               </div>
               <div className="p-6 bg-white/5 rounded-2xl border border-white/10">
                 <p className="text-[10px] font-black text-orange-400 uppercase mb-2">Khởi chạy</p>
                 <code className="text-xs font-mono">node server.js</code>
               </div>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDatabase;
