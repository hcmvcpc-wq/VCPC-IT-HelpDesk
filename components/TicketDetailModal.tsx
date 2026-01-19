
import React, { useState } from 'react';
import { Ticket, TicketStatus, TicketPriority, Attachment } from '../types.ts';

interface TicketDetailModalProps {
  ticket: Ticket;
  onClose: () => void;
}

const TicketDetailModal: React.FC<TicketDetailModalProps> = ({ ticket, onClose }) => {
  const [selectedMedia, setSelectedMedia] = useState<Attachment | null>(null);

  const getPriorityColor = (priority: TicketPriority) => {
    switch (priority) {
      case TicketPriority.CRITICAL: return 'bg-rose-500';
      case TicketPriority.HIGH: return 'bg-orange-500';
      case TicketPriority.MEDIUM: return 'bg-blue-500';
      default: return 'bg-slate-400';
    }
  };

  const getStatusBadge = (status: TicketStatus) => {
    switch (status) {
      case TicketStatus.OPEN: return 'bg-amber-100 text-amber-700 border-amber-200';
      case TicketStatus.IN_PROGRESS: return 'bg-blue-100 text-blue-700 border-blue-200';
      case TicketStatus.RESOLVED: return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-white rounded-[3rem] w-full max-w-4xl overflow-hidden shadow-2xl transform transition-all animate-in zoom-in-95 duration-300">
        {/* Header Section */}
        <div className="relative p-10 bg-slate-900 text-white overflow-hidden">
          <div className="relative z-10 flex justify-between items-start">
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border ${getStatusBadge(ticket.status)}`}>
                  {ticket.status}
                </span>
                <span className={`w-3 h-3 rounded-full ${getPriorityColor(ticket.priority)}`}></span>
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{ticket.priority} Priority</span>
              </div>
              <h2 className="text-3xl font-black leading-tight tracking-tight">{ticket.title}</h2>
              <p className="text-slate-400 font-mono text-sm">Ticket ID: {ticket.id}</p>
            </div>
            <button 
              onClick={onClose}
              className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center hover:bg-white/20 transition-all border border-white/5"
            >
              <i className="fa-solid fa-xmark text-xl"></i>
            </button>
          </div>
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/20 rounded-full blur-[80px] -mr-32 -mt-32"></div>
        </div>

        {/* Content Section */}
        <div className="p-10 space-y-10 max-h-[70vh] overflow-y-auto scrollbar-hide bg-white">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            <div className="lg:col-span-2 space-y-8">
              <div className="space-y-4">
                <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Nội dung mô tả</h4>
                <div className="p-8 bg-slate-50 rounded-[2rem] border border-slate-100">
                  <p className="text-slate-700 leading-relaxed text-lg font-medium whitespace-pre-wrap">
                    {ticket.description}
                  </p>
                </div>
              </div>

              {/* Attachments Display */}
              {ticket.attachments && ticket.attachments.length > 0 && (
                <div className="space-y-4">
                  <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Hình ảnh / Video đính kèm</h4>
                  <div className="grid grid-cols-3 gap-4">
                    {ticket.attachments.map((att) => (
                      <div 
                        key={att.id} 
                        onClick={() => setSelectedMedia(att)}
                        className="relative group rounded-[1.5rem] overflow-hidden aspect-video border border-slate-100 bg-slate-50 cursor-zoom-in shadow-sm hover:shadow-md transition-all"
                      >
                        {att.type.startsWith('image') ? (
                          <img src={att.data} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center text-blue-500">
                            <i className="fa-solid fa-circle-play text-4xl mb-2 opacity-80"></i>
                            <span className="text-[10px] font-black uppercase tracking-widest">Video bằng chứng</span>
                          </div>
                        )}
                        <div className="absolute inset-0 bg-slate-900/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-8">
              <div className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100 space-y-6">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 rounded-2xl bg-white text-indigo-600 flex items-center justify-center text-xl shadow-sm">
                    <i className="fa-solid fa-building"></i>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Đơn vị</p>
                    <p className="font-bold text-slate-800 text-sm">{ticket.subsidiary}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 rounded-2xl bg-white text-amber-600 flex items-center justify-center text-xl shadow-sm">
                    <i className="fa-solid fa-users-viewfinder"></i>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Phòng ban</p>
                    <p className="font-bold text-slate-800 text-sm">{ticket.department}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 rounded-2xl bg-white text-emerald-600 flex items-center justify-center text-xl shadow-sm">
                    <i className="fa-solid fa-user-pen"></i>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Người tạo</p>
                    <p className="font-bold text-slate-800 text-sm">{ticket.creatorName}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 rounded-2xl bg-white text-slate-600 flex items-center justify-center text-xl shadow-sm">
                    <i className="fa-solid fa-tags"></i>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Danh mục</p>
                    <p className="font-bold text-slate-800 text-sm">{ticket.category}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="p-8 bg-slate-50 border-t border-slate-100 flex justify-end items-center space-x-4 shrink-0">
          <p className="text-[10px] text-slate-400 font-bold italic mr-auto">Cập nhật: {new Date(ticket.updatedAt).toLocaleString('vi-VN')}</p>
          <button 
            onClick={onClose}
            className="px-12 py-4 rounded-2xl bg-slate-900 text-white font-black uppercase text-xs tracking-widest hover:bg-slate-800 transition shadow-lg shadow-slate-200"
          >
            Đóng
          </button>
        </div>
      </div>

      {/* Lightbox for Media */}
      {selectedMedia && (
        <div className="fixed inset-0 z-[400] flex items-center justify-center p-10 bg-black/95 animate-in fade-in duration-300">
           <button onClick={() => setSelectedMedia(null)} className="absolute top-10 right-10 w-14 h-14 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 text-2xl">
             <i className="fa-solid fa-xmark"></i>
           </button>
           <div className="max-w-6xl max-h-full">
             {selectedMedia.type.startsWith('image') ? (
               <img src={selectedMedia.data} className="max-w-full max-h-full rounded-2xl shadow-2xl object-contain" />
             ) : (
               <video src={selectedMedia.data} controls className="max-w-full max-h-full rounded-2xl shadow-2xl" autoPlay />
             )}
             <p className="text-white text-center mt-6 font-bold text-lg">{selectedMedia.name}</p>
           </div>
        </div>
      )}
    </div>
  );
};

export default TicketDetailModal;
