
import React, { useState, useEffect } from 'react';
import { db } from '../services/dbService';
import { exportFullDatabaseToExcel } from '../services/excelService';
import { generateGoogleAppsScript, downloadScriptFile } from '../services/googleSheetsService';

const AdminDatabase: React.FC = () => {
  const [isLive, setIsLive] = useState(true);
  const [copying, setCopying] = useState(false);
  const [cloudUrl, setCloudUrl] = useState(db.getCloudUrl() || '');
  const [remoteUrl, setRemoteUrl] = useState(db.getRemoteJsonUrl() || '');
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
      alert("Vui lòng nhập URL Web App hợp lệ.");
      return;
    }
    db.setCloudUrl(cloudUrl);
    alert("Đã kết nối Cloud Bridge!");
  };

  const handleSaveRemoteUrl = async () => {
    if (!remoteUrl.startsWith('http')) {
      alert("Vui lòng nhập URL JSON hợp lệ.");
      return;
    }
    setSyncing(true);
    db.setRemoteJsonUrl(remoteUrl);
    const success = await db.syncFromRemoteUrl();
    setSyncing(false);
    if (success) alert("Đã nạp dữ liệu từ nguồn JSON!");
    else alert("Không thể nạp dữ liệu từ URL này. Hãy kiểm tra định dạng JSON hoặc CORS.");
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
          <p className="text-slate-500 font-medium mt-3">Đồng bộ hóa "Không chạm" (Zero-Touch Sync).</p>
        </div>
        <div className="flex items-center space-x-3 bg-white px-5 py-3 rounded-2xl border border-slate-100 shadow-sm">
          <div className={`w-3 h-3 rounded-full transition-opacity duration-1000 ${cloudUrl || remoteUrl ? 'bg-emerald-500 shadow-[0_0_10px_#10b981]' : 'bg-slate-300'}`}></div>
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{(cloudUrl || remoteUrl) ? 'Connected' : 'Standalone'}</span>
        </div>
      </div>

      {/* CLOUD BRIDGE CONFIG */}
      <div className="mb-8 p-10 bg-slate-900 rounded-[3rem] text-white shadow-2xl relative overflow-hidden border border-slate-800">
        <div className="relative z-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-3xl shadow-lg">
                <i className="fa-solid fa-cloud-bolt"></i>
              </div>
              <div>
                <h3 className="text-2xl font-black tracking-tight">Cloud Bridge (Google Sheets)</h3>
                <p className="text-slate-400 text-sm font-medium mt-1">Đồng bộ hai chiều, tự động lưu và tải dữ liệu thời gian thực.</p>
              </div>
            </div>
            {lastSync && (
              <div className="bg-white/10 px-6 py-3 rounded-2xl border border-white/10 text-center">
                <p className="text-[10px] font-black uppercase tracking-widest text-blue-400 mb-1">Đồng bộ cuối</p>
                <p className="text-sm font-bold">{new Date(lastSync).toLocaleTimeString('vi-VN')}</p>
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Apps Script Web App URL</label>
              <div className="flex flex-col md:flex-row gap-3">
                <input 
                  type="text" 
                  value={cloudUrl}
                  onChange={(e) => setCloudUrl(e.target.value)}
                  placeholder="https://script.google.com/macros/s/.../exec"
                  className="flex-1 px-6 py-4 bg-white/5 border border-white/10 rounded-2xl outline-none focus:border-blue-500 transition-all font-mono text-xs text-blue-300"
                />
                <button onClick={handleSaveCloudUrl} className="px-10 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black transition">Kết nối</button>
              </div>
            </div>

            <div className="p-6 bg-white/5 rounded-2xl border border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <i className="fa-solid fa-link text-blue-400 text-xl"></i>
                <span className="text-sm font-medium text-slate-300">Dùng link này để người khác tự nạp dữ liệu từ Cloud này:</span>
              </div>
              <button onClick={handleCopyAutoLink} disabled={!cloudUrl} className="px-6 py-3 bg-white text-slate-900 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-200 disabled:opacity-20 transition">
                {copying ? 'Đã copy!' : 'Copy Auto-Link'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        {/* REMOTE JSON SOURCE */}
        <div className="lg:col-span-2 bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center text-xl">
              <i className="fa-solid fa-file-code"></i>
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-800">Nguồn JSON Tĩnh (Static Fetch)</h3>
              <p className="text-slate-500 text-xs font-medium">Tự động nạp dữ liệu từ file JSON công khai (GitHub Gist, Server).</p>
            </div>
          </div>
          <div className="flex flex-col md:flex-row gap-3">
            <input 
              type="text" 
              value={remoteUrl}
              onChange={(e) => setRemoteUrl(e.target.value)}
              placeholder="https://gist.githubusercontent.com/.../db.json"
              className="flex-1 px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-500 font-mono text-xs"
            />
            <button onClick={handleSaveRemoteUrl} disabled={syncing} className="px-8 py-3.5 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition disabled:opacity-50">
              {syncing ? 'Đang nạp...' : 'Nạp ngay'}
            </button>
          </div>
        </div>

        {/* EXCEL MASTER */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col justify-between">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center text-xl">
              <i className="fa-solid fa-file-excel"></i>
            </div>
            <h3 className="text-lg font-black text-slate-800">Master Backup</h3>
          </div>
          <button 
            onClick={() => exportFullDatabaseToExcel({
              tickets: db.getTickets(),
              assets: db.getAssets(),
              users: db.getUsers(),
              logs: db.getLogs()
            })}
            className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-black hover:bg-emerald-700 transition"
          >
            Tải Excel Master
          </button>
        </div>
      </div>

      <div className="bg-slate-100 p-8 rounded-[2rem] border border-slate-200">
        <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
          <i className="fa-solid fa-circle-info"></i>
          Hướng dẫn tự động hóa
        </h4>
        <ul className="text-sm text-slate-600 space-y-3 font-medium">
          <li className="flex gap-3"><span className="text-blue-600 font-black">01.</span> Link kết nối nhanh: <code className="bg-white px-2 py-0.5 rounded border">?connect=BASE64_URL</code></li>
          <li className="flex gap-3"><span className="text-blue-600 font-black">02.</span> Link nạp JSON nhanh: <code className="bg-white px-2 py-0.5 rounded border">?data_url=HTTPS_JSON_URL</code></li>
          <li className="flex gap-3"><span className="text-blue-600 font-black">03.</span> Ứng dụng sẽ tự động tải lại dữ liệu mới nhất mỗi 60 giây nếu đã kết nối Cloud.</li>
        </ul>
      </div>
    </div>
  );
};

export default AdminDatabase;
