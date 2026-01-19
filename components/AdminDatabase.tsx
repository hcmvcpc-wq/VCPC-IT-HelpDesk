
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

  useEffect(() => {
    const interval = setInterval(() => setIsLive(prev => !prev), 2000);
    return () => clearInterval(interval);
  }, []);

  const handleSaveCloudUrl = () => {
    db.setCloudUrl(cloudUrl);
    alert("Đã lưu URL Cloud! Hệ thống sẽ bắt đầu tự động đồng bộ.");
  };

  const handlePullData = async () => {
    setSyncing(true);
    const success = await db.syncWithCloud();
    setSyncing(false);
    if (success) alert("Đồng bộ dữ liệu từ Cloud thành công!");
    else alert("Không thể lấy dữ liệu từ Cloud. Vui lòng kiểm tra lại URL Web App.");
  };

  const handleExportJSON = () => db.exportDB();

  const handleExportCSV = (type: 'Tickets' | 'Assets' | 'Users') => {
    let data: any[] = [];
    if (type === 'Tickets') data = db.getTickets();
    if (type === 'Assets') data = db.getAssets();
    if (type === 'Users') data = db.getUsers();
    exportCSVForSheets(data, `it_helpdesk_${type.toLowerCase()}_google_sheets`);
  };

  const handleDownloadGAS = () => {
    const script = generateGoogleAppsScript();
    downloadScriptFile(script);
  };

  return (
    <div className="p-6 md:p-10 max-w-6xl mx-auto pb-24 page-enter">
      <div className="flex justify-between items-start mb-10">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight leading-none">Cơ sở <span className="text-blue-600">Dữ liệu</span></h1>
          <p className="text-slate-500 font-medium mt-3">Hệ thống đồng bộ hóa thời gian thực đa trình duyệt.</p>
        </div>
        <div className="flex items-center space-x-3 bg-white px-5 py-3 rounded-2xl border border-slate-100 shadow-sm">
          <div className={`w-3 h-3 rounded-full transition-opacity duration-1000 ${isLive ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.8)]' : 'bg-emerald-200'}`}></div>
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{cloudUrl ? 'Cloud Connected' : 'Local Only'}</span>
        </div>
      </div>

      {/* AUTO CLOUD SYNC CONFIGURATION */}
      <div className="mb-8 p-10 bg-slate-900 rounded-[3rem] text-white shadow-2xl relative overflow-hidden border border-slate-800">
        <div className="relative z-10">
          <div className="flex items-center gap-6 mb-8">
            <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-3xl shadow-lg">
              <i className="fa-solid fa-cloud-arrow-up"></i>
            </div>
            <div>
              <h3 className="text-2xl font-black tracking-tight">Cổng đồng bộ Tự động (Cloud Bridge)</h3>
              <p className="text-slate-400 text-sm font-medium mt-1">Sử dụng Google Apps Script làm trung tâm dữ liệu giữa các trình duyệt.</p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Google Web App URL (Endpoint)</label>
              <div className="flex gap-3">
                <input 
                  type="text" 
                  value={cloudUrl}
                  onChange={(e) => setCloudUrl(e.target.value)}
                  placeholder="https://script.google.com/macros/s/.../exec"
                  className="flex-1 px-6 py-4 bg-white/5 border border-white/10 rounded-2xl outline-none focus:border-blue-500 transition-all font-mono text-xs text-blue-300"
                />
                <button 
                  onClick={handleSaveCloudUrl}
                  className="px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black transition active:scale-95 shadow-lg"
                >
                  Kết nối
                </button>
              </div>
            </div>

            <div className="flex flex-wrap gap-4 items-center">
              <button 
                onClick={handlePullData}
                disabled={!cloudUrl || syncing}
                className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold transition flex items-center gap-2 text-xs"
              >
                {syncing ? <i className="fa-solid fa-spinner fa-spin"></i> : <i className="fa-solid fa-rotate"></i>}
                Tải dữ liệu từ Cloud (Pull)
              </button>
              <button 
                onClick={handleDownloadGAS}
                className="px-6 py-3 bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30 rounded-xl font-bold transition flex items-center gap-2 text-xs"
              >
                <i className="fa-solid fa-download"></i>
                Lấy Script cho Google Sheets
              </button>
            </div>
          </div>
        </div>
        <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-blue-600/5 rounded-full blur-3xl"></div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm group hover:border-blue-200 transition-all">
          <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
            <i className="fa-solid fa-share-nodes text-2xl"></i>
          </div>
          <h3 className="text-xl font-black text-slate-800 mb-2">Đồng bộ qua Link</h3>
          <p className="text-slate-500 text-sm mb-6 font-medium">Sao chép liên kết chứa toàn bộ mã hóa dữ liệu để khôi phục tức thì trên trình duyệt khác.</p>
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

        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm group hover:border-emerald-200 transition-all">
          <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
            <i className="fa-solid fa-file-excel text-2xl"></i>
          </div>
          <h3 className="text-xl font-black text-slate-800 mb-2">Báo cáo Excel Master</h3>
          <p className="text-slate-500 text-sm mb-6 font-medium">Xuất dữ liệu Tickets, Assets và Người dùng thành một file Excel cấu trúc chuẩn.</p>
          <button 
            onClick={() => exportFullDatabaseToExcel({
              tickets: db.getTickets(),
              assets: db.getAssets(),
              users: db.getUsers(),
              logs: db.getLogs()
            })}
            className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-black hover:bg-emerald-700 transition shadow-lg"
          >
            Tải Excel Full DB
          </button>
        </div>
      </div>

      <div className="p-8 bg-rose-50 rounded-[2.5rem] border border-rose-100 flex flex-col md:flex-row gap-6 items-center justify-between">
        <div className="flex gap-6 items-center">
           <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-xl flex items-center justify-center shrink-0">
             <i className="fa-solid fa-triangle-exclamation"></i>
           </div>
           <div>
             <h4 className="font-bold text-rose-900">Xóa sạch cơ sở dữ liệu địa phương</h4>
             <p className="text-rose-700 text-xs mt-1">Cẩn thận: Thao tác này sẽ xóa sạch Local Storage nhưng không ảnh hưởng tới Cloud.</p>
           </div>
        </div>
        <button onClick={() => {if(window.confirm('Xóa sạch DB cục bộ?')) db.clearDB()}} className="px-8 py-3 bg-rose-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-700 transition shadow-lg shrink-0">Factory Reset</button>
      </div>
    </div>
  );
};

export default AdminDatabase;
