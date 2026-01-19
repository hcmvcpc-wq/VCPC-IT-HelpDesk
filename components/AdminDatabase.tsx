
import React, { useRef, useState, useEffect } from 'react';
import { db } from '../services/dbService';
import { exportFullDatabaseToExcel } from '../services/excelService';
import { generateSQLSchema, generateSQLDataMigration, downloadSQLFile } from '../services/sqlService';
import { generateGoogleAppsScript, exportCSVForSheets, downloadScriptFile } from '../services/googleSheetsService';

const AdminDatabase: React.FC = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isLive, setIsLive] = useState(true);
  const [copying, setCopying] = useState(false);
  const [cloudUrl, setCloudUrl] = useState(db.getCloudUrl() || '');
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState(db.getLastSyncTime());

  useEffect(() => {
    const interval = setInterval(() => setIsLive(prev => !prev), 2000);
    const syncListener = () => setLastSync(db.getLastSyncTime());
    window.addEventListener('local_db_update', syncListener);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('local_db_update', syncListener);
    };
  }, []);

  const handleSaveCloudUrl = () => {
    if (!cloudUrl.startsWith('https://script.google.com')) {
      alert("Vui lòng nhập URL Web App hợp lệ từ Google Apps Script.");
      return;
    }
    db.setCloudUrl(cloudUrl);
    alert("Đã kết nối Cloud! Dữ liệu sẽ tự động đẩy lên và đồng bộ ngầm mỗi phút.");
  };

  const handlePullData = async () => {
    setSyncing(true);
    const success = await db.syncWithCloud();
    setSyncing(false);
    if (success) {
      setLastSync(db.getLastSyncTime());
      alert("Đồng bộ dữ liệu thành công!");
    } else {
      alert("Đồng bộ thất bại. Kiểm tra lại URL hoặc quyền truy cập của Web App.");
    }
  };

  return (
    <div className="p-6 md:p-10 max-w-6xl mx-auto pb-24 page-enter">
      <div className="flex justify-between items-start mb-10">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight leading-none">Cơ sở <span className="text-blue-600">Dữ liệu</span></h1>
          <p className="text-slate-500 font-medium mt-3">Hệ thống đồng bộ hóa đám mây (Cloud Bridge) tự động.</p>
        </div>
        <div className="flex items-center space-x-3 bg-white px-5 py-3 rounded-2xl border border-slate-100 shadow-sm">
          <div className={`w-3 h-3 rounded-full transition-opacity duration-1000 ${isLive ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.8)]' : 'bg-emerald-200'}`}></div>
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{cloudUrl ? 'Cloud Connected' : 'Local Only'}</span>
        </div>
      </div>

      {/* CLOUD SYNC CONFIGURATION */}
      <div className="mb-8 p-10 bg-slate-900 rounded-[3rem] text-white shadow-2xl relative overflow-hidden border border-slate-800">
        <div className="relative z-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-3xl shadow-lg">
                <i className="fa-solid fa-cloud-arrow-up"></i>
              </div>
              <div>
                <h3 className="text-2xl font-black tracking-tight">Đồng bộ đa trình duyệt</h3>
                <p className="text-slate-400 text-sm font-medium mt-1">Sử dụng Google Sheets làm cầu nối dữ liệu thời gian thực.</p>
              </div>
            </div>
            {lastSync && (
              <div className="bg-white/10 px-6 py-3 rounded-2xl border border-white/10 text-center md:text-right">
                <p className="text-[10px] font-black uppercase tracking-widest text-blue-400 mb-1">Cập nhật cuối</p>
                <p className="text-sm font-bold">{new Date(lastSync).toLocaleString('vi-VN')}</p>
              </div>
            )}
          </div>

          <div className="space-y-8">
            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Google Web App URL</label>
              <div className="flex flex-col md:flex-row gap-3">
                <input 
                  type="text" 
                  value={cloudUrl}
                  onChange={(e) => setCloudUrl(e.target.value)}
                  placeholder="https://script.google.com/macros/s/.../exec"
                  className="flex-1 px-6 py-4 bg-white/5 border border-white/10 rounded-2xl outline-none focus:border-blue-500 transition-all font-mono text-xs text-blue-300"
                />
                <button 
                  onClick={handleSaveCloudUrl}
                  className="px-10 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black transition active:scale-95 shadow-xl shadow-blue-900/40"
                >
                  Kết nối Cloud
                </button>
              </div>
            </div>

            <div className="flex flex-wrap gap-4 items-center">
              <button 
                onClick={handlePullData}
                disabled={!cloudUrl || syncing}
                className="px-8 py-4 bg-white/10 hover:bg-white/20 text-white rounded-2xl font-bold transition flex items-center gap-3 text-sm disabled:opacity-30"
              >
                {syncing ? <i className="fa-solid fa-spinner fa-spin"></i> : <i className="fa-solid fa-rotate"></i>}
                Đồng bộ ngay (Force Sync)
              </button>
              <button 
                onClick={() => downloadScriptFile(generateGoogleAppsScript())}
                className="px-8 py-4 bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30 rounded-2xl font-bold transition flex items-center gap-3 text-sm"
              >
                <i className="fa-solid fa-download"></i>
                Tải Script cho Sheets
              </button>
            </div>
          </div>
        </div>
        <div className="absolute -right-20 -top-20 w-80 h-80 bg-blue-600/5 rounded-full blur-3xl"></div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm group hover:border-blue-200 transition-all flex flex-col justify-between">
          <div>
            <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <i className="fa-solid fa-share-nodes text-2xl"></i>
            </div>
            <h3 className="text-xl font-black text-slate-800 mb-2">Đồng bộ qua Link</h3>
            <p className="text-slate-500 text-sm mb-6 font-medium">Nếu không dùng Cloud, bạn có thể gửi link chứa toàn bộ dữ liệu mã hóa để khôi phục trên trình duyệt khác.</p>
          </div>
          <button 
            onClick={() => {
              const link = db.generateSyncLink();
              navigator.clipboard.writeText(link);
              setCopying(true);
              setTimeout(() => setCopying(false), 2000);
            }}
            className="w-full py-4 bg-slate-100 text-slate-700 rounded-2xl font-black hover:bg-slate-200 transition flex items-center justify-center gap-2"
          >
            <i className={`fa-solid ${copying ? 'fa-check' : 'fa-copy'}`}></i>
            {copying ? 'Đã sao chép Link!' : 'Lấy Link Sync'}
          </button>
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm group hover:border-emerald-200 transition-all flex flex-col justify-between">
          <div>
            <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <i className="fa-solid fa-file-excel text-2xl"></i>
            </div>
            <h3 className="text-xl font-black text-slate-800 mb-2">Báo cáo Excel Master</h3>
            <p className="text-slate-500 text-sm mb-6 font-medium">Xuất dữ liệu Tickets, Assets và Người dùng thành một file Excel cấu trúc chuẩn để lưu trữ lâu dài.</p>
          </div>
          <button 
            onClick={() => exportFullDatabaseToExcel({
              tickets: db.getTickets(),
              assets: db.getAssets(),
              users: db.getUsers(),
              logs: db.getLogs()
            })}
            className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-black hover:bg-emerald-700 transition shadow-lg"
          >
            Tải Excel Master
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminDatabase;
