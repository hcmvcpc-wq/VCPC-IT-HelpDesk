
import React, { useState, useRef } from 'react';
import { User, Ticket, TicketStatus, TicketPriority, Asset, Attachment } from '../types.ts';
import { CATEGORIES, SUBSIDIARIES, DEPARTMENTS } from '../constants.tsx';
import { getAITicketResponse } from '../services/geminiService.ts';
import TicketChatModal from './TicketChatModal.tsx';
import TicketDetailModal from './TicketDetailModal.tsx';
import AISupportWidget from './AISupportWidget.tsx';

interface UserDashboardProps {
  user: User;
  tickets: Ticket[];
  assets: Asset[];
  onAddTicket: (ticket: Ticket) => void;
  onAddComment: (ticketId: string, message: string) => void;
}

const UserDashboard: React.FC<UserDashboardProps> = ({ user, tickets, assets = [], onAddTicket, onAddComment }) => {
  const [showModal, setShowModal] = useState(false);
  const [activeChatTicket, setActiveChatTicket] = useState<Ticket | null>(null);
  const [activeDetailTicket, setActiveDetailTicket] = useState<Ticket | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [newTicket, setNewTicket] = useState({
    title: '',
    description: '',
    category: CATEGORIES[0],
    subsidiary: SUBSIDIARIES[0],
    department: user.department || DEPARTMENTS[0],
    priority: TicketPriority.MEDIUM
  });

  const userTickets = tickets.filter(t => t.creatorId === user.id);
  const myAssets = assets.filter(a => a.assignedToId === user.id);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    // Fix: Explicitly type 'file' as 'File' to resolve 'unknown' property access errors
    Array.from(files).forEach((file: File) => {
      if (file.size > 2 * 1024 * 1024) {
        alert(`Tệp ${file.name} quá lớn (tối đa 2MB)`);
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setAttachments(prev => [...prev, {
          id: `att-${Date.now()}-${Math.random()}`,
          name: file.name,
          type: file.type,
          data: base64String
        }]);
      };
      reader.readAsDataURL(file);
    });
    
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeAttachment = (id: string) => {
    setAttachments(prev => prev.filter(a => a.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const aiResponse = await getAITicketResponse(newTicket.title, newTicket.description);

      const ticket: Ticket = {
        id: `T-${Math.floor(1000 + Math.random() * 9000)}`,
        ...newTicket,
        status: TicketStatus.OPEN,
        creatorId: user.id,
        creatorName: user.fullName,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        location: 'N/A', 
        comments: [],
        attachments: attachments
      };

      onAddTicket(ticket);
      alert(`Đã gửi yêu cầu thành công!\n\n💡 Gợi ý từ AI IT Support:\n${aiResponse}`);
      
      setShowModal(false);
      setAttachments([]);
      setNewTicket({
        title: '',
        description: '',
        category: CATEGORIES[0],
        subsidiary: SUBSIDIARIES[0],
        department: user.department || DEPARTMENTS[0],
        priority: TicketPriority.MEDIUM
      });
    } catch (err) {
      console.error("Lỗi:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto pb-20 page-enter">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-800 tracking-tight leading-tight">Chào bạn, {user.fullName.split(' ').pop()}!</h1>
          <p className="text-slate-500 font-medium text-lg mt-1">Gửi yêu cầu hỗ trợ kỹ thuật nhanh chóng và dễ dàng.</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-10 py-5 rounded-[2rem] font-bold shadow-2xl shadow-blue-200 flex items-center space-x-3 transition transform active:scale-95"
        >
          <i className="fa-solid fa-plus text-xl"></i>
          <span className="text-lg">Tạo yêu cầu mới</span>
        </button>
      </div>

      {/* Assets Section */}
      <div className="mb-14">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-xs font-black text-slate-400 tracking-[0.2em] uppercase">Thiết bị IT được cấp cho bạn</h2>
          <div className="h-[1px] flex-1 bg-slate-100 mx-6"></div>
        </div>

        {myAssets.length === 0 ? (
          <div className="bg-slate-50 rounded-[2.5rem] p-10 border-2 border-dashed border-slate-200 text-center">
            <p className="text-slate-400 font-bold italic">Bạn hiện chưa có thiết bị nào được định danh trên hệ thống.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {myAssets.map(asset => (
              <div key={asset.id} className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all group overflow-hidden relative">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center transition-colors group-hover:bg-indigo-600 group-hover:text-white">
                    <i className={`fa-solid ${
                      asset.type === 'Laptop' ? 'fa-laptop' : 
                      asset.type === 'Monitor' ? 'fa-desktop' : 
                      asset.type === 'Mobile' ? 'fa-mobile-screen' : 'fa-box'
                    } text-xl`}></i>
                  </div>
                  <div>
                    <h4 className="font-black text-slate-800 truncate">{asset.name}</h4>
                    <p className="text-[10px] text-slate-400 font-mono mt-0.5">SN: {asset.serialNumber}</p>
                  </div>
                </div>
                <div className="mt-6 pt-6 border-t border-slate-50 flex items-center justify-between">
                   <div>
                     <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Ngày nhận</p>
                     <p className="text-xs font-bold text-slate-600 mt-1">{new Date(asset.purchaseDate).toLocaleDateString('vi-VN')}</p>
                   </div>
                   <span className="bg-emerald-50 text-emerald-600 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-tighter">
                     {asset.status.replace('_', ' ')}
                   </span>
                </div>
                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                   <i className="fa-solid fa-shield-halved text-6xl"></i>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* History Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-xs font-black text-slate-400 tracking-[0.2em] uppercase">Lịch sử hỗ trợ gần đây</h2>
          <div className="h-[1px] flex-1 bg-slate-100 mx-6"></div>
        </div>
      </div>
      
      <div className="space-y-6">
        {userTickets.length === 0 ? (
          <div className="text-center py-24 bg-white rounded-[3rem] border border-dashed border-slate-200">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <i className="fa-solid fa-ticket text-3xl text-slate-300"></i>
            </div>
            <p className="text-slate-400 font-bold italic text-lg">Bạn chưa có yêu cầu hỗ trợ nào được gửi</p>
          </div>
        ) : (
          userTickets.map(t => (
            <div 
              key={t.id} 
              className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 hover:border-blue-300 hover:shadow-2xl transition-all group relative overflow-hidden"
            >
              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 gap-4 relative z-10">
                <div className="flex items-center space-x-5">
                  <div 
                    onClick={() => setActiveDetailTicket(t)}
                    className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center shadow-inner cursor-pointer transform transition active:scale-90 ${
                    t.status === TicketStatus.RESOLVED ? 'bg-emerald-50 text-emerald-500' : 'bg-blue-50 text-blue-500'
                  }`}>
                    <i className="fa-solid fa-comment-dots text-3xl"></i>
                  </div>
                  <div>
                    <h3 
                      onClick={() => setActiveDetailTicket(t)}
                      className="text-xl font-black text-slate-800 group-hover:text-blue-600 transition cursor-pointer"
                    >
                      {t.title}
                    </h3>
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">
                      Mã: {t.id} • {t.subsidiary} / {t.department} • {new Date(t.updatedAt).toLocaleDateString('vi-VN')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  {t.attachments && t.attachments.length > 0 && (
                    <span className="flex items-center text-slate-400 text-xs font-bold bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
                      <i className="fa-solid fa-paperclip mr-2"></i>
                      {t.attachments.length} đính kèm
                    </span>
                  )}
                  <button 
                    onClick={() => setActiveDetailTicket(t)}
                    className="px-6 py-2 rounded-xl bg-slate-50 text-slate-500 hover:bg-slate-900 hover:text-white transition-all text-[10px] font-black uppercase tracking-widest"
                  >
                    Xem chi tiết
                  </button>
                  <span className={`px-5 py-2 rounded-xl text-[9px] font-black uppercase border tracking-widest ${
                    t.status === TicketStatus.OPEN ? 'bg-amber-100 text-amber-600 border-amber-200' :
                    t.status === TicketStatus.IN_PROGRESS ? 'bg-blue-100 text-blue-600 border-blue-200' :
                    'bg-emerald-100 text-emerald-600 border-emerald-200'
                  }`}>
                    {t.status}
                  </span>
                </div>
              </div>
              <p className="text-slate-500 leading-relaxed font-medium pl-20 pr-10 line-clamp-2">{t.description}</p>
              
              <div className="flex items-center justify-between mt-8 pl-20">
                <div className="flex items-center space-x-6">
                  <div className="flex items-center space-x-2">
                    <i className="fa-solid fa-layer-group text-slate-300"></i>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t.category}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <i className="fa-solid fa-building text-slate-300"></i>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t.subsidiary}</span>
                  </div>
                </div>
                <button 
                  onClick={() => setActiveChatTicket(t)}
                  className="flex items-center space-x-2 text-blue-600 font-black text-[10px] uppercase tracking-[0.2em] group-hover:translate-x-1 transition-all"
                >
                  <span>Chat ngay {t.comments?.length ? `(${t.comments.length})` : ''}</span>
                  <i className="fa-solid fa-arrow-right-long"></i>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white rounded-[2.5rem] w-full max-w-2xl overflow-hidden shadow-2xl transform animate-in zoom-in-95 duration-300">
            <div className="p-8 bg-blue-600 text-white relative">
              <h3 className="text-2xl font-black">Gửi yêu cầu hỗ trợ</h3>
              <p className="text-blue-100 text-sm mt-1 font-medium">Đính kèm ảnh hoặc video lỗi để IT xử lý nhanh nhất.</p>
              <button onClick={() => setShowModal(false)} className="absolute top-8 right-8 w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center hover:bg-white/20 transition">
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-8 space-y-5 bg-white max-h-[75vh] overflow-y-auto scrollbar-hide">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Công ty con</label>
                  <select required value={newTicket.subsidiary} onChange={e => setNewTicket({...newTicket, subsidiary: e.target.value})} className="w-full px-5 py-3 rounded-xl border-2 border-slate-50 focus:border-blue-500 outline-none bg-white font-bold text-slate-700">
                    {SUBSIDIARIES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Phòng ban</label>
                  <select required value={newTicket.department} onChange={e => setNewTicket({...newTicket, department: e.target.value})} className="w-full px-5 py-3 rounded-xl border-2 border-slate-50 focus:border-blue-500 outline-none bg-white font-bold text-slate-700">
                    {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Danh mục lỗi</label>
                <select required value={newTicket.category} onChange={e => setNewTicket({...newTicket, category: e.target.value})} className="w-full px-5 py-3 rounded-xl border-2 border-slate-50 focus:border-blue-500 outline-none bg-white font-bold text-slate-700">
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Tiêu đề yêu cầu</label>
                <input required type="text" value={newTicket.title} onChange={e => setNewTicket({...newTicket, title: e.target.value})} className="w-full px-5 py-3 rounded-xl border-2 border-slate-100 focus:border-blue-500 outline-none font-bold shadow-sm" placeholder="VD: Lỗi đăng nhập phần mềm SAP" />
              </div>
              
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Mô tả chi tiết</label>
                <textarea required rows={3} value={newTicket.description} onChange={e => setNewTicket({...newTicket, description: e.target.value})} className="w-full px-5 py-3 rounded-xl border-2 border-slate-100 focus:border-blue-500 outline-none font-medium shadow-sm" placeholder="Mô tả cụ thể triệu chứng lỗi..."></textarea>
              </div>

              {/* Attachments Section */}
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1 flex justify-between items-center">
                  <span>Ảnh / Video minh họa (Tối đa 2MB)</span>
                  <span className="text-blue-600">{attachments.length} tệp đã chọn</span>
                </label>
                
                <div className="grid grid-cols-4 gap-3">
                  {attachments.map(att => (
                    <div key={att.id} className="relative group rounded-xl overflow-hidden aspect-square border-2 border-slate-100 bg-slate-50">
                      {att.type.startsWith('image') ? (
                        <img src={att.data} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-blue-500">
                          <i className="fa-solid fa-file-video text-xl"></i>
                          <span className="text-[8px] font-bold uppercase mt-1">Video</span>
                        </div>
                      )}
                      <button 
                        type="button"
                        onClick={() => removeAttachment(att.id)}
                        className="absolute top-1 right-1 w-6 h-6 rounded-lg bg-rose-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition shadow-lg"
                      >
                        <i className="fa-solid fa-xmark text-[10px]"></i>
                      </button>
                    </div>
                  ))}
                  
                  {attachments.length < 4 && (
                    <button 
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="aspect-square rounded-xl border-2 border-dashed border-slate-200 hover:border-blue-400 hover:bg-blue-50 transition-all flex flex-col items-center justify-center text-slate-400 hover:text-blue-600"
                    >
                      <i className="fa-solid fa-cloud-arrow-up text-xl mb-1"></i>
                      <span className="text-[8px] font-black uppercase">Thêm tệp</span>
                    </button>
                  )}
                </div>
                <input 
                  type="file" 
                  multiple 
                  accept="image/*,video/*" 
                  className="hidden" 
                  ref={fileInputRef} 
                  onChange={handleFileChange}
                />
              </div>

              <button type="submit" disabled={isSubmitting} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-5 rounded-2xl shadow-xl shadow-blue-600/20 transition-all transform active:scale-[0.98]">
                {isSubmitting ? 'Đang xử lý...' : 'Gửi yêu cầu hỗ trợ'}
              </button>
            </form>
          </div>
        </div>
      )}

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

      {/* AI Assistant Widget */}
      <AISupportWidget />
    </div>
  );
};

export default UserDashboard;
