import React from 'react';
import { Ticket, TicketStatus, TicketPriority } from '../types';

interface TicketDetailModalProps {
  ticket: Ticket;
  onClose: () => void;
}

const TicketDetailModal: React.FC<TicketDetailModalProps> = ({ ticket, onClose }) => {
  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md">
      <div className="bg-white rounded-[3rem] w-full max-w-4xl overflow-hidden shadow-2xl">
        <div className="p-10 bg-slate-900 text-white flex justify-between">
          <div>
            <span className="px-3 py-1 rounded-lg text-[10px] font-black uppercase bg-blue-600">{ticket.status}</span>
            <h2 className="text-3xl font-black mt-4">{ticket.title}</h2>
          </div>
          <button onClick={onClose} className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center"><i className="fa-solid fa-xmark"></i></button>
        </div>
        <div className="p-10 space-y-6">
          <div className="p-8 bg-slate-50 rounded-[2rem] border border-slate-100">
            <h4 className="text-xs font-black text-slate-400 uppercase mb-4">Mô tả</h4>
            <p className="text-slate-700 leading-relaxed font-medium whitespace-pre-wrap">{ticket.description}</p>
          </div>
        </div>
        <div className="p-8 border-t flex justify-end">
          <button onClick={onClose} className="px-8 py-3 bg-slate-900 text-white rounded-xl font-black uppercase text-xs">Đóng</button>
        </div>
      </div>
    </div>
  );
};

export default TicketDetailModal;