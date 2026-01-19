import React, { useRef, useState, useEffect } from 'react';
import { db } from '../services/dbService';

const AdminDatabase: React.FC = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isLive, setIsLive] = useState(true);
  const [copying, setCopying] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => setIsLive(prev => !prev), 2000);
    return () => clearInterval(interval);
  }, []);

  const handleExport = () => db.exportDB();

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      if (db.importDB(event.target?.result as string)) {
        alert("Khôi phục thành công! Tất cả các tab đã được đồng bộ.");
        window.location.reload();
      }
    };
    reader.readAsText(file);
  };

  const handleCopySyncLink = () => {
    const link = db.generateSyncLink();
    navigator.clipboard.writeText(link).then(() => {
      setCopying(true);
      setTimeout(() => setCopying(false), 2000);
    });
  };

  return (
    <div className="p-10 max-w-5xl mx-auto page-enter">
      <div className="flex justify-between items-start mb-10">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">Hệ thống <span className="text-blue-600">Dữ liệu</span></h1>
          <p className="text-slate-500 font-medium mt-2">Quản lý và đồng bộ hóa dữ liệu đa nền tảng.</p>
        </div>
        <div className="flex items-center space-x-3 bg-white px-5 py-3 rounded-2xl border border-slate-100 shadow-sm">
          <div className={`w-3 h-3 rounded-full transition-opacity duration-1000 ${isLive ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.8)]' : 'bg-emerald-200'}`}></div>
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Live Sync Active</span>
        </div>
      </div>

      {/* Feature: Cross-Browser Sync Link */}
      <div className="mb-12 p-8 bg-blue-600 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden group">
        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
              <i className="fa-solid fa-share-nodes text-xl"></i>
            </div>
            <h3 className="text-2xl font-black tracking-tight">Đồng bộ sang trình duyệt khác</h3>
          </div>
          <p className="text-blue-100 mb-6 max-w-2xl leading-relaxed">
            Vì hệ thống chạy offline trên trình duyệt, dữ liệu của bạn không tự động xuất hiện ở các máy tính khác. 
            Hãy tạo <b>Liên kết đồng bộ</b> để chuyển toàn bộ Ticket và Tài sản sang một trình duyệt hoặc thiết bị mới ngay lập tức.
          </p>
          <button 
            onClick={handleCopySyncLink}
            className="px-8 py-4 bg-white text-blue-600 rounded-2xl font-black shadow-lg hover:bg-slate-50 transition transform active:scale-95 flex items-center gap-3"
          >
            <i className={`fa-solid ${copying ? 'fa-check' : 'fa-copy'}`}></i>
            {copying ? 'Đã sao chép liên kết!' : 'Sao chép liên kết đồng bộ'}
          </button>
        </div>
        <div className="absolute -right-10 -top-10 w-48 h-48 bg-white/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-1000"></div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6 group hover:border-blue-200 transition-all">
          <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
            <i className="fa-solid fa-cloud-arrow-down text-2xl"></i>
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-800">Xuất file dự phòng</h3>
            <p className="text-slate-500 text-sm mt-2 leading-relaxed">Lưu trữ dữ liệu dưới dạng file .json để cất giữ an toàn trên máy tính cá nhân.</p>
          </div>
          <button onClick={handleExport} className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition shadow-lg">Tải file JSON</button>
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6 group hover:border-emerald-200 transition-all">
          <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
            <i className="fa-solid fa-file-import text-2xl"></i>
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-800">Nhập dữ liệu từ file</h3>
            <p className="text-slate-500 text-sm mt-2 leading-relaxed">Nạp lại hệ thống từ file backup đã xuất trước đó.</p>
          </div>
          <input type="file" accept=".json" ref={fileInputRef} onChange={handleImport} className="hidden" />
          <button onClick={() => fileInputRef.current?.click()} className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-bold hover:bg-emerald-700 transition shadow-lg">Nạp file sao lưu</button>
        </div>
      </div>

      <div className="p-8 bg-rose-50 rounded-[2.5rem] border border-rose-100 flex gap-6 items-center justify-between">
        <div className="flex gap-6 items-center">
           <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-xl flex items-center justify-center shrink-0">
             <i className="fa-solid fa-trash-can"></i>
           </div>
           <div>
             <h4 className="font-bold text-rose-900">Xóa sạch toàn bộ dữ liệu</h4>
             <p className="text-rose-700 text-xs mt-1">Cẩn thận: Thao tác này sẽ đưa hệ thống về trạng thái trắng.</p>
           </div>
        </div>
        <button onClick={() => {if(window.confirm('Xóa sạch dữ liệu?')) db.clearDB()}} className="px-8 py-3 bg-rose-600 text-white rounded-xl text-xs font-bold hover:bg-rose-700 transition shadow-lg shadow-rose-200">Reset System</button>
      </div>
    </div>
  );
};

export default AdminDatabase;