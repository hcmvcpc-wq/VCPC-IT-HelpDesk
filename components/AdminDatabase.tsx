
import React, { useState, useEffect } from 'react';
import { db } from '../services/dbService';
import { exportFullDatabaseToExcel } from '../services/excelService';
import { generateSQLSchema, generateSQLDataMigration } from '../services/sqlService';

const AdminDatabase: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'STEP1' | 'STEP2' | 'STEP3' | 'STEP4'>('STEP1');
  const [mysqlUrl, setMysqlUrl] = useState(db.getMysqlApiUrl() || '');
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState(db.getLastSyncTime());

  useEffect(() => {
    const syncListener = () => setLastSync(db.getLastSyncTime());
    window.addEventListener('local_db_update', syncListener);
    return () => window.removeEventListener('local_db_update', syncListener);
  }, []);

  const handleConnectMysql = async () => {
    if (!mysqlUrl.trim()) {
      alert("Vui lòng nhập URL của Server Node.js (Ví dụ: http://localhost:5000)");
      return;
    }
    
    let url = mysqlUrl.trim();
    if (url.endsWith('/')) url = url.slice(0, -1);
    const formattedUrl = url.endsWith('/api') ? url : `${url}/api`;
    
    setSyncing(true);
    try {
      db.setMysqlApiUrl(formattedUrl);
      const ok = await db.syncFromMysql();
      if (ok) {
        alert("CHÚC MỪNG! KẾT NỐI THÀNH CÔNG.\n\nỨng dụng hiện đã chạy trên nền dữ liệu MySQL.");
        setLastSync(new Date().toISOString());
      } else {
        alert("KHÔNG KẾT NỐI ĐƯỢC!\n\n1. Hãy chắc chắn bạn đã chạy lệnh 'node server.js' ở máy tính.\n2. Kiểm tra lại địa chỉ IP/URL (Ví dụ: http://localhost:5000)");
      }
    } catch (e) {
      alert("Lỗi kết nối nghiêm trọng.");
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

  const nodeCode = `const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));

const dbConfig = {
  host: 'localhost',      
  user: 'root',           
  password: 'your_password', // THAY MẬT KHẨU CỦA BẠN VÀO ĐÂY
  database: 'helpdesk_vcpc',
  port: 3306
};

let pool;
async function initDB() {
  pool = await mysql.createPool(dbConfig);
  console.log('✅ KẾT NỐI MYSQL THÀNH CÔNG!');
}

app.get('/api/pull', async (req, res) => {
  const [tickets] = await pool.query('SELECT * FROM Tickets ORDER BY createdAt DESC');
  const [users] = await pool.query('SELECT * FROM Users');
  const [assets] = await pool.query('SELECT * FROM Assets');
  res.json({ tickets, users, assets });
});

app.post('/api/push', (req, res) => res.json({ status: "success" }));

initDB().then(() => app.listen(5000, () => console.log('🚀 Server running on http://localhost:5000')));`;

  const downloadFile = (content: string, fileName: string) => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto pb-24 page-enter">
      <div className="mb-10 flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight leading-none">Cài đặt <span className="text-orange-600">MySQL</span></h1>
          <p className="text-slate-500 font-medium mt-3">Kết nối ứng dụng với cơ sở dữ liệu vật lý của bạn.</p>
        </div>
        {lastSync && (
          <div className="bg-emerald-50 text-emerald-600 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border border-emerald-100 flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
            Đang trực tuyến
          </div>
        )}
      </div>

      {/* TABS NAVIGATION */}
      <div className="flex p-1.5 bg-slate-200/50 rounded-2xl mb-10 w-full overflow-x-auto scrollbar-hide border border-slate-200">
        <button onClick={() => setActiveTab('STEP1')} className={`flex-1 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === 'STEP1' ? 'bg-white text-slate-900 shadow-md' : 'text-slate-500 hover:text-slate-700'}`}>1. Hướng dẫn</button>
        <button onClick={() => setActiveTab('STEP2')} className={`flex-1 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === 'STEP2' ? 'bg-white text-slate-900 shadow-md' : 'text-slate-500 hover:text-slate-700'}`}>2. SQL Script</button>
        <button onClick={() => setActiveTab('STEP3')} className={`flex-1 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === 'STEP3' ? 'bg-white text-slate-900 shadow-md' : 'text-slate-500 hover:text-slate-700'}`}>3. Node.js Code</button>
        <button onClick={() => setActiveTab('STEP4')} className={`flex-1 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === 'STEP4' ? 'bg-orange-600 text-white shadow-lg shadow-orange-200' : 'text-orange-600 font-black'}`}>4. KẾT NỐI NGAY</button>
      </div>

      {activeTab === 'STEP1' && (
        <div className="space-y-6 animate-in fade-in duration-500">
          <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm">
            <h3 className="text-2xl font-black text-slate-900 mb-6">Chào Admin! Thực hiện theo trình tự sau:</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
               <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-black shrink-0">1</div>
                    <div>
                       <p className="text-sm font-bold text-slate-700">Tải SQL ở tab <b>Số 2</b></p>
                       <p className="text-xs text-slate-400 mt-1">Chạy file này trong MySQL Workbench để tạo bảng.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-black shrink-0">2</div>
                    <div>
                       <p className="text-sm font-bold text-slate-700">Tải server.js ở tab <b>Số 3</b></p>
                       <p className="text-xs text-slate-400 mt-1">Chạy lệnh 'node server.js' trên máy tính của bạn.</p>
                    </div>
                  </div>
               </div>
               <div className="bg-orange-50 p-8 rounded-[2rem] border border-orange-100">
                  <p className="text-xs font-black text-orange-600 uppercase tracking-widest mb-3">Sẵn sàng kết nối?</p>
                  <p className="text-sm text-orange-800 leading-relaxed mb-6 font-medium">Nếu bạn đã chạy Server Node.js tại địa chỉ <b>http://localhost:5000</b>, hãy nhấn nút dưới đây:</p>
                  <button onClick={() => setActiveTab('STEP4')} className="w-full py-4 bg-orange-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-orange-700 transition shadow-xl shadow-orange-200 flex items-center justify-center gap-3">
                    BƯỚC KẾT NỐI <i className="fa-solid fa-arrow-right"></i>
                  </button>
               </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'STEP2' && (
        <div className="animate-in slide-in-from-bottom-4 duration-300">
          <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white">
            <div className="flex justify-between items-center mb-6">
              <h4 className="font-black text-orange-400">Dữ liệu SQL</h4>
              <button onClick={() => downloadFile(sqlCode, 'init_db.sql')} className="px-5 py-2.5 bg-orange-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-orange-700 transition">Tải file .sql</button>
            </div>
            <pre className="text-[11px] font-mono text-slate-300 bg-black/30 p-6 rounded-2xl overflow-x-auto max-h-[50vh] scrollbar-hide">
              {sqlCode}
            </pre>
          </div>
        </div>
      )}

      {activeTab === 'STEP3' && (
        <div className="animate-in slide-in-from-bottom-4 duration-300">
          <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white">
             <div className="flex justify-between items-center mb-6">
               <h4 className="font-black text-blue-400">Mã nguồn Bridge Server</h4>
               <button onClick={() => downloadFile(nodeCode, 'server.js')} className="px-5 py-2.5 bg-blue-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition">Tải file server.js</button>
             </div>
             <div className="bg-blue-500/10 p-4 rounded-xl border border-blue-500/20 text-blue-300 text-[11px] mb-4 leading-relaxed">
               Lưu ý: Bạn cần cài đặt các thư viện bằng lệnh: <br/>
               <code className="bg-black/20 px-2 py-1 rounded mt-1 inline-block">npm install express mysql2 cors body-parser</code>
             </div>
             <pre className="text-[11px] font-mono text-slate-300 bg-black/30 p-6 rounded-2xl overflow-x-auto max-h-[40vh] scrollbar-hide">
               {nodeCode}
             </pre>
          </div>
        </div>
      )}

      {activeTab === 'STEP4' && (
        <div className="space-y-8 animate-in fade-in duration-300">
          <div className="p-12 bg-white rounded-[3rem] border-2 border-orange-500 shadow-2xl relative overflow-hidden bg-gradient-to-b from-white to-orange-50/20">
              <div className="relative z-10">
                <h3 className="text-3xl font-black text-slate-900 mb-2">Nhập địa chỉ máy chủ</h3>
                <p className="text-slate-500 text-sm mb-10 font-medium">Sao chép dòng chữ bên dưới và dán vào ô nhập liệu.</p>
                
                <div className="space-y-8 max-w-xl">
                  <div className="space-y-4">
                    <label className="text-[11px] font-black uppercase tracking-widest text-orange-600 ml-1">Bridge API Server URL</label>
                    <div className="relative group">
                       <i className="fa-solid fa-link absolute left-6 top-1/2 -translate-y-1/2 text-orange-400 text-xl group-focus-within:text-orange-600 transition-colors"></i>
                       <input 
                        type="text" 
                        value={mysqlUrl}
                        onChange={(e) => setMysqlUrl(e.target.value)}
                        placeholder="http://localhost:5000"
                        className="w-full pl-16 pr-8 py-7 bg-white border-4 border-orange-100 rounded-[2.5rem] outline-none focus:border-orange-500 shadow-xl font-mono text-xl text-slate-800 placeholder:text-slate-300"
                      />
                    </div>
                    <div className="flex gap-2">
                       <button onClick={() => setMysqlUrl('http://localhost:5000')} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-[10px] font-bold text-slate-600 transition">Gợi ý: http://localhost:5000</button>
                    </div>
                  </div>
                  
                  <button onClick={handleConnectMysql} disabled={syncing} className="w-full py-7 bg-orange-600 text-white rounded-[2rem] font-black shadow-2xl shadow-orange-300 hover:bg-orange-700 transition-all active:scale-[0.98] flex items-center justify-center gap-4 text-xl tracking-tight">
                    {syncing ? <i className="fa-solid fa-spinner fa-spin"></i> : <i className="fa-solid fa-plug-circle-check"></i>}
                    <span>{syncing ? 'ĐANG KẾT NỐI...' : 'KÍCH HOẠT KẾT NỐI MYSQL'}</span>
                  </button>
                </div>

                {lastSync && (
                  <div className="mt-12 p-8 bg-emerald-500 text-white rounded-[2.5rem] flex items-center gap-6 shadow-2xl animate-in zoom-in-95">
                    <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center text-3xl">
                      <i className="fa-solid fa-database"></i>
                    </div>
                    <div>
                      <p className="font-black uppercase tracking-widest text-xs">Hệ thống đang sử dụng MySQL</p>
                      <p className="text-sm font-bold opacity-90 mt-1">Lần cuối đồng bộ: {new Date(lastSync).toLocaleString('vi-VN')}</p>
                    </div>
                  </div>
                )}
              </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDatabase;
