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
        alert("Khôi phục dữ liệu thành công! Hệ thống đã đồng bộ.");
        window.location.reload();
      } else {
        alert("File không hợp lệ.");
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="p-10 max-w-5xl mx-auto page-enter">
      <div className="mb-10">
        <h1 className="text-4xl font-black text-slate-900 tracking-tight">Hệ thống <span className="text-blue-600">Dữ liệu</span></h1>
        <p className="text-slate-500 font-medium mt-2">Quản lý, sao lưu và bảo mật toàn bộ cơ sở dữ liệu IT Helpdesk.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6">
          <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
            <i className="fa-solid fa-cloud-arrow-down text-2xl"></i>
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-800">Sao lưu Dữ liệu</h3>
            <p className="text-slate-500 text-sm mt-2">Tải xuống toàn bộ Ticket, người dùng và tài sản dưới dạng JSON để lưu trữ hoặc chuyển sang trình duyệt khác.</p>
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
            <p className="text-slate-500 text-sm mt-2">Nạp lại dữ liệu từ file backup. Dữ liệu sẽ được đồng bộ ngay lập tức trên các tab đang mở.</p>
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

      <div className="space-y-6">
        <div className="p-8 bg-blue-50 rounded-[2rem] border border-blue-100 flex gap-6 items-start">
          <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center shrink-0">
            <i className="fa-solid fa-sync"></i>
          </div>
          <div>
            <h4 className="font-bold text-blue-900">Đồng bộ Đa Tab</h4>
            <p className="text-blue-700 text-sm mt-1 leading-relaxed">
              Hệ thống hiện đã hỗ trợ đồng bộ thời gian thực giữa các Tab trong cùng một trình duyệt. 
              Mọi thay đổi về Ticket hoặc Account sẽ được cập nhật ngay lập tức mà không cần tải lại trang.
            </p>
          </div>
        </div>

        <div className="p-8 bg-amber-50 rounded-[2rem] border border-amber-100 flex gap-6 items-start">
          <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center shrink-0">
            <i className="fa-solid fa-globe"></i>
          </div>
          <div>
            <h4 className="font-bold text-amber-900">Tại sao dữ liệu không hiện ở Trình duyệt khác?</h4>
            <p className="text-amber-700 text-sm mt-1 leading-relaxed">
              Hiện tại ứng dụng đang sử dụng <b>Local Storage</b> (Dữ liệu nằm tại máy của bạn). 
              Để sử dụng dữ liệu chung giữa Chrome, Safari, Điện thoại và Máy tính khác, bạn cần:
              <ul className="list-disc ml-5 mt-2 space-y-1">
                <li>Sử dụng tính năng <b>Xuất/Nhập dữ liệu</b> ở trên.</li>
                <li>Hoặc nâng cấp lên <b>Cloud Database</b> (Supabase/Firebase/MongoDB) để dữ liệu được lưu trữ trên máy chủ.</li>
              </ul>
            </p>
          </div>
        </div>

        <div className="p-8 bg-rose-50 rounded-[2rem] border border-rose-100 flex gap-6 items-start">
          <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-xl flex items-center justify-center shrink-0">
            <i className="fa-solid fa-trash-can"></i>
          </div>
          <div>
            <h4 className="font-bold text-rose-900">Xóa sạch Dữ liệu Hệ thống</h4>
            <p className="text-rose-700 text-sm mt-1 leading-relaxed">
              Thao tác này sẽ xóa toàn bộ Ticket, Tài sản và cấu hình người dùng về trạng thái mặc định ban đầu.
            </p>
            <button 
              onClick={() => {if(window.confirm('CẢNH BÁO: Toàn bộ dữ liệu sẽ bị xóa sạch! Bạn có chắc chắn?')) db.clearDB()}}
              className="mt-4 px-6 py-2 bg-rose-600 text-white rounded-xl text-xs font-bold hover:bg-rose-700 transition"
            >
              Reset hệ thống ngay
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDatabase;