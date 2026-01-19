
import React, { useRef, useState, useEffect } from 'react';
import { db } from '../services/dbService';
import { exportFullDatabaseToExcel } from '../services/excelService';
import { generateGoogleAppsScript, downloadScriptFile } from '../services/googleSheetsService';

const AdminDatabase: React.FC = () => {
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
    alert("Đã kết nối! Trình duyệt này hiện đã được 'Cắm' vào Cloud Database.");
  };

  const handleCopyAutoLink = () => {
    const link = db.generateAutoConnectLink();
    navigator.clipboard.writeText(link);
    setCopying(true);
    setTimeout(() => setCopying(false), 2000);
  };

  return (
    <div className="p-6 md:p-10 max-w-6xl mx-auto pb-24 page-enter">
      <div className="flex justify-between items-start mb-10">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight leading-none">Cơ sở <span className="text-blue-600">Dữ liệu</span></h1>
          <p className="text-slate-500 font-medium mt-3">Hệ thống đồng bộ hóa tự động (No-File Sync).</p>
        </div>
        <div className="flex items-center space-x-3 bg-white px-5 py-3 rounded-2xl border border-slate-100 shadow-sm">
          <div className={`w-3 h-3 rounded-full transition-opacity duration-1000 ${isLive ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.8)]' : 'bg-emerald-200'}`}></div>
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{cloudUrl ? 'Cloud Connected' : 'Local Only'}</span>
        </div>
      </div>

      {/* CLOUD CONFIG */}
      <div className="mb-8 p-10 bg-slate-900 rounded-[3rem] text-white shadow-2xl relative overflow-hidden border border-slate-800">
        <div className="relative z-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-3xl shadow-lg">
                <i className="fa-solid fa-bolt-lightning"></i>
              </div>
              <div>
                <h3 className="text-2xl font-black tracking-tight">Auto-Sync Dashboard</h3>
                <p className="text-slate-400 text-sm font-medium mt-1">Dữ liệu được nạp tự động qua API Google Sheets.</p>
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
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Google Apps Script URL</label>
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
                  className="px-10 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black transition shadow-xl"
                >
                  Kết nối
                </button>
              </div>
            </div>

            <div className="p-6 bg-white/5 rounded-2xl border border-white/10">
              <h4 className="text-sm font-bold text-white flex items-center gap-2 mb-2">
                <i className="fa-solid fa-link text-blue-400"></i>
                Link Tự động Kết nối (Share & Sync)
              </h4>
              <p className="text-xs text-slate-400 mb-4">Gửi link này cho máy tính khác để họ tự động nạp dữ liệu từ Cloud mà không cần cấu hình gì thêm.</p>
              <button 
                onClick={handleCopyAutoLink}
                disabled={!cloudUrl}
                className="w-full md:w-auto px-8 py-3 bg-white text-slate-900 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition disabled:opacity-20"
              >
                {copying ? 'Đã copy link!' : 'Copy Link Auto-Connect'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col justify-between">
           <div>
              <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-6">
                <i className="fa-solid fa-code text-2xl"></i>
              </div>
              <h3 className="text-xl font-black text-slate-800 mb-2">Bước 1: Cài đặt Cloud</h3>
              <p className="text-slate-500 text-sm mb-6 font-medium">Tải mã nguồn Apps Script, dán vào Google Sheet của bạn và Deploy dưới dạng Web App.</p>
           </div>
           <button 
             onClick={() => downloadScriptFile(generateGoogleAppsScript())}
             className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-black hover:bg-emerald-700 transition"
           >
             Tải Script về
           </button>
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col justify-between">
           <div>
              <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-6">
                <i className="fa-solid fa-rotate text-2xl"></i>
              </div>
              <h3 className="text-xl font-black text-slate-800 mb-2">Bước 2: Force Pull</h3>
              <p className="text-slate-500 text-sm mb-6 font-medium">Bắt buộc tải lại toàn bộ dữ liệu từ Cloud ngay bây giờ (Ghi đè bản cục bộ).</p>
           </div>
           <button 
             onClick={async () => {
               setSyncing(true);
               const ok = await db.syncWithCloud();
               setSyncing(false);
               if(ok) alert('Thành công!');
             }}
             disabled={!cloudUrl || syncing}
             className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black hover:bg-slate-800 transition disabled:opacity-50"
           >
             {syncing ? 'Đang tải...' : 'Kích hoạt Đồng bộ'}
           </button>
        </div>
      </div>
    </div>
  );
};

export default AdminDatabase;
