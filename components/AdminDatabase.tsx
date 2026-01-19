import React, { useRef } from 'react';
import { db } from '../services/dbService';

const AdminDatabase: React.FC = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    db.exportDB();
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (db.importDB(content)) {
        alert("Khôi phục dữ liệu thành công! Ứng dụng sẽ tải lại.");
        window.location.reload();
      } else {
        alert("File không hợp lệ.");
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="p-10 max-w-4xl mx-auto page-enter">
      <div className="mb-10">
        <h1 className="text-4xl font-black text-slate-900 tracking-tight">Hệ thống <span className="text-blue-600">Dữ liệu</span></h1>
        <p className="text-slate-500 font-medium mt-2">Quản lý, sao lưu và bảo mật toàn bộ cơ sở dữ liệu IT Helpdesk.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6">
          <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
            <i className="fa-solid fa-cloud-arrow-down text-2xl"></i>
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-800">Sao lưu Dữ liệu</h3>
            <p className="text-slate-500 text-sm mt-2">Tải xuống toàn bộ Ticket, người dùng và tài sản dưới dạng JSON để lưu trữ ngoại tuyến.</p>
          </div>
          <button 
            onClick={handleExport}
            className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition shadow-lg"
          >
            Xuất dữ liệu (.json)
          </button>
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6">
          <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center">
            <i className="fa-solid fa-file-import text-2xl"></i>
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-800">Khôi phục Dữ liệu</h3>
            <p className="text-slate-500 text-sm mt-2">Nạp lại dữ liệu từ file backup. Lưu ý: Thao tác này sẽ ghi đè dữ liệu hiện tại.</p>
          </div>
          <input 
            type="file" 
            accept=".json" 
            ref={fileInputRef} 
            onChange={handleImport} 
            className="hidden" 
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-bold hover:bg-emerald-700 transition shadow-lg"
          >
            Nạp dữ liệu từ file
          </button>
        </div>
      </div>

      <div className="mt-12 p-8 bg-amber-50 rounded-[2rem] border border-amber-100 flex gap-6 items-start">
        <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center shrink-0">
          <i className="fa-solid fa-triangle-exclamation"></i>
        </div>
        <div>
          <h4 className="font-bold text-amber-900">Lưu ý bảo mật</h4>
          <p className="text-amber-700 text-sm mt-1 leading-relaxed">
            Dữ liệu chứa thông tin cá nhân và thiết bị doanh nghiệp. Vui lòng bảo quản file sao lưu ở nơi an toàn. 
            Trong môi trường thực tế, hệ thống này sẽ kết nối trực tiếp với MongoDB hoặc PostgreSQL.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminDatabase;