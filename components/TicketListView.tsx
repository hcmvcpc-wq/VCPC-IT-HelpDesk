
import React, { useState, useMemo } from 'react';
import { Ticket, TicketStatus, TicketPriority, User, UserRole } from '../types.ts';
import TicketChatModal from './TicketChatModal.tsx';
import TicketDetailModal from './TicketDetailModal.tsx';

interface TicketListViewProps {
  tickets: Ticket[];
  user: User;
  onUpdateTicket: (id: string, updates: Partial<Ticket>) => void;
  onAddComment: (ticketId: string, message: string) => void;
}

const TicketListView: React.FC<TicketListViewProps> = ({ tickets, user, onUpdateTicket, onAddComment }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<TicketStatus | 'ALL'>('ALL');
  const [activeChatTicket, setActiveChatTicket] = useState<Ticket | null>(null);
  const [activeDetailTicket, setActiveDetailTicket] = useState<Ticket | null>(null);

  const displayTickets = useMemo(() => {
    let filtered = tickets;
    if (user.role === UserRole.USER) filtered = filtered.filter(t => t.creatorId === user.id);
    if (statusFilter !== 'ALL') filtered = filtered.filter(t => t.status === statusFilter);
    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      filtered = filtered.filter(t => t.title.toLowerCase().includes(lowerSearch) || t.id.toLowerCase().includes(lowerSearch));
    }
    return filtered;
  }, [tickets, user, statusFilter, searchTerm]);

  return (
    <div className="p-8 pb-20 page-enter">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-slate-800 tracking-tight">Tất cả yêu cầu</h1>
        <p className="text-slate-500 mt-1 uppercase text-[10px] font-bold tracking-widest">Quản lý và tra cứu thông tin phiếu hỗ trợ</p>
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-50 bg-slate-50/30 flex flex-col lg:flex-row gap-4">
          <div className="relative flex-1">
            <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
            <input type="text" placeholder="Tìm kiếm phiếu..." className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-600/5 transition-all shadow-sm" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
          <div className="flex p-1 bg-slate-100 rounded-2xl border border-slate-200">
            {['ALL', TicketStatus.OPEN, TicketStatus.IN_PROGRESS, TicketStatus.RESOLVED].map(s => (
              <button key={s} onClick={() => setStatusFilter(s as any)} className={`px-5 py-2 rounded-xl text-xs font-bold transition-all ${statusFilter === s ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}>{s === 'ALL' ? 'Tất cả' : s === 'OPEN' ? 'Mới' : s === 'IN_PROGRESS' ? 'Làm' : 'Xong'}</button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 text-slate-400 uppercase text-[10px] font-black tracking-[0.2em] border-b border-slate-100">
                <th className="px-8 py-5">Chủ đề</th>
                <th className="px-8 py-5 text-center">Trạng thái</th>
                <th className="px-8 py-5 text-center">Trao đổi</th>
                <th className="px-8 py-5 text-center">Chi tiết</th>
                {user.role === UserRole.ADMIN && <th className="px-8 py-5 text-right">Hành động</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {displayTickets.map(t => (
                <tr key={t.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-8 py-6">
                    <p 
                      onClick={() => setActiveDetailTicket(t)}
                      className="text-sm font-bold text-slate-800 group-hover:text-blue-600 transition cursor-pointer"
                    >
                      {t.title}
                    </p>
                    <p className="text-[10px] text-slate-400 font-mono mt-1">ID: {t.id} • {t.creatorName}</p>
                  </td>
                  <td className="px-8 py-6 text-center">
                    <span className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase border ${t.status === 'OPEN' ? 'bg-amber-50 text-amber-600 border-amber-100' : t.status === 'IN_PROGRESS' ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'}`}>{t.status}</span>
                  </td>
                  <td className="px-8 py-6 text-center">
                    <button 
                      onClick={() => setActiveChatTicket(t)}
                      className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-slate-100 text-slate-600 hover:bg-blue-600 hover:text-white transition-all transform active:scale-95 group"
                    >
                      <i className="fa-solid fa-comments"></i>
                      <span className="text-[10px] font-black uppercase">Chat {t.comments?.length ? `(${t.comments.length})` : ''}</span>
                    </button>
                  </td>
                  <td className="px-8 py-6 text-center">
                    <button 
                      onClick={() => setActiveDetailTicket(t)}
                      className="w-10 h-10 rounded-xl bg-slate-100 text-slate-500 hover:bg-slate-900 hover:text-white transition-all transform active:scale-95"
                    >
                      <i className="fa-solid fa-eye text-xs"></i>
                    </button>
                  </td>
                  {user.role === UserRole.ADMIN && (
                    <td className="px-8 py-6 text-right">
                      <select value={t.status} onChange={(e) => onUpdateTicket(t.id, { status: e.target.value as TicketStatus })} className="text-[10px] font-black uppercase border border-slate-200 rounded-xl p-2.5 outline-none cursor-pointer">
                        <option value={TicketStatus.OPEN}>Mở</option>
                        <option value={TicketStatus.IN_PROGRESS}>Làm</option>
                        <option value={TicketStatus.RESOLVED}>Xong</option>
                        <option value={TicketStatus.CLOSED}>Đóng</option>
                      </select>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {activeChatTicket && (
        <TicketChatModal 
          ticket={activeChatTicket}
          currentUser={user}
          onClose={() => setActiveChatTicket(null)}
          onSendMessage={onAddComment}
        />
      )}

      {activeDetailTicket && (
        <TicketDetailModal 
          ticket={activeDetailTicket}
          onClose={() => setActiveDetailTicket(null)}
        />
      )}
    </div>
  );
};

export default TicketListView;
