
import React, { useState, useEffect, useRef } from 'react';
import { Ticket, User, UserRole, Comment, Attachment } from '../types.ts';

interface TicketChatModalProps {
  ticket: Ticket;
  currentUser: User;
  onClose: () => void;
  onSendMessage: (ticketId: string, message: string, attachments?: Attachment[]) => void;
}

const TicketChatModal: React.FC<TicketChatModalProps> = ({ ticket, currentUser, onClose, onSendMessage }) => {
  const [message, setMessage] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [selectedPreview, setSelectedPreview] = useState<Attachment | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [ticket.comments]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    // Fix: Explicitly type 'file' as 'File' to resolve 'unknown' property access errors
    Array.from(files).forEach((file: File) => {
      if (file.size > 2 * 1024 * 1024) {
        alert("Tệp quá lớn (tối đa 2MB)");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setAttachments(prev => [...prev, {
          id: `att-${Date.now()}-${Math.random()}`,
          name: file.name,
          type: file.type,
          data: reader.result as string
        }]);
      };
      reader.readAsDataURL(file);
    });
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() || attachments.length > 0) {
      // Ép kiểu lại API nếu cần, ở đây giả định App.tsx nhận thêm attachments
      // @ts-ignore - Adding attachments support in messaging
      onSendMessage(ticket.id, message, attachments.length > 0 ? attachments : undefined);
      setMessage('');
      setAttachments([]);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-[2.5rem] w-full max-w-2xl h-[85vh] flex flex-col overflow-hidden shadow-2xl transform transition-all animate-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="p-6 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-4">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg ${
              ticket.status === 'RESOLVED' ? 'bg-emerald-500' : 'bg-blue-600'
            }`}>
              <i className="fa-solid fa-headset text-xl"></i>
            </div>
            <div>
              <h3 className="font-black text-lg leading-tight truncate max-w-[300px]">{ticket.title}</h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Hội thoại hỗ trợ • ID: {ticket.id}</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-all"
          >
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        {/* Chat Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50 scrollbar-hide">
          {/* Main Request with Attachments */}
          <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm mb-4">
            <div className="flex items-center space-x-2 mb-3">
               <span className="text-[10px] font-black bg-indigo-100 text-indigo-700 px-3 py-1 rounded-lg uppercase">Yêu cầu gốc</span>
               <span className="text-[10px] text-slate-400 font-bold">{new Date(ticket.createdAt).toLocaleString('vi-VN')}</span>
            </div>
            <p className="text-slate-700 font-medium mb-4">{ticket.description}</p>
            {ticket.attachments && ticket.attachments.length > 0 && (
              <div className="grid grid-cols-4 gap-3">
                {ticket.attachments.map(att => (
                  <div key={att.id} onClick={() => setSelectedPreview(att)} className="cursor-pointer rounded-xl overflow-hidden aspect-square border border-slate-100 shadow-sm">
                    {att.type.startsWith('image') ? <img src={att.data} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-blue-50 flex items-center justify-center text-blue-500"><i className="fa-solid fa-video"></i></div>}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Chat Messages */}
          {ticket.comments?.map((comment: Comment) => {
            if (comment.isSystem) {
              return (
                <div key={comment.id} className="flex justify-center my-2">
                  <div className="bg-white/80 px-4 py-1.5 rounded-full border border-slate-100 shadow-sm">
                    <p className="text-[9px] text-slate-500 font-bold italic">
                      <i className="fa-solid fa-bolt-lightning mr-2 text-blue-500"></i>
                      {comment.message}
                    </p>
                  </div>
                </div>
              );
            }

            const isMe = comment.senderId === currentUser.id;
            return (
              <div key={comment.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                  <div className={`px-4 py-3 rounded-2xl shadow-sm text-sm ${
                    isMe ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-white border border-slate-100 text-slate-700 rounded-tl-none'
                  }`}>
                    {comment.message}
                    {/* Render Attachments in message if any */}
                    {/* @ts-ignore - Assuming attachments exist on comment */}
                    {comment.attachments && comment.attachments.length > 0 && (
                       <div className="grid grid-cols-2 gap-2 mt-3">
                         {/* @ts-ignore */}
                         {comment.attachments.map((att: Attachment) => (
                           <div key={att.id} onClick={() => setSelectedPreview(att)} className="cursor-zoom-in rounded-lg overflow-hidden border border-white/20 bg-white/10 aspect-video">
                             {att.type.startsWith('image') ? <img src={att.data} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-white"><i className="fa-solid fa-video"></i></div>}
                           </div>
                         ))}
                       </div>
                    )}
                  </div>
                  <span className="text-[8px] text-slate-400 mt-1 px-1 font-black uppercase tracking-widest">
                    {comment.senderName} • {new Date(comment.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            );
          })}
          <div ref={chatEndRef} />
        </div>

        {/* Footer Input */}
        <div className="p-6 bg-white border-t border-slate-100 shrink-0">
          {attachments.length > 0 && (
            <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
              {attachments.map(att => (
                <div key={att.id} className="relative w-16 h-16 rounded-xl border border-blue-100 overflow-hidden shrink-0">
                  {att.type.startsWith('image') ? <img src={att.data} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-blue-50 flex items-center justify-center text-blue-500"><i className="fa-solid fa-video"></i></div>}
                  <button onClick={() => setAttachments(prev => prev.filter(a => a.id !== att.id))} className="absolute top-0 right-0 w-5 h-5 bg-rose-500 text-white flex items-center justify-center text-[10px]"><i className="fa-solid fa-xmark"></i></button>
                </div>
              ))}
            </div>
          )}
          
          <form onSubmit={handleSend} className="relative flex items-center gap-3">
            <button 
              type="button" 
              onClick={() => fileInputRef.current?.click()}
              className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 hover:text-blue-600 transition flex items-center justify-center shadow-inner"
            >
              <i className="fa-solid fa-paperclip text-lg"></i>
            </button>
            <input 
              type="text" 
              placeholder="Nhập nội dung trao đổi..."
              className="flex-1 px-6 py-4 bg-slate-100 border-none rounded-2xl outline-none focus:ring-4 focus:ring-blue-600/10 transition-all font-medium text-slate-800"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
            <button 
              type="submit"
              disabled={!message.trim() && attachments.length === 0}
              className="w-14 h-14 rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-200 flex items-center justify-center transition-all hover:bg-blue-700 active:scale-95 disabled:opacity-50"
            >
              <i className="fa-solid fa-paper-plane"></i>
            </button>
            <input type="file" multiple accept="image/*,video/*" className="hidden" ref={fileInputRef} onChange={handleFileChange} />
          </form>
        </div>
      </div>

      {/* Lightbox Preview */}
      {selectedPreview && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-10 bg-black/90 animate-in fade-in duration-200">
           <button onClick={() => setSelectedPreview(null)} className="absolute top-10 right-10 w-12 h-12 rounded-full bg-white/10 text-white hover:bg-white/20 transition-all text-xl">
             <i className="fa-solid fa-xmark"></i>
           </button>
           <div className="max-w-5xl max-h-full">
             {selectedPreview.type.startsWith('image') ? <img src={selectedPreview.data} className="max-w-full max-h-full object-contain rounded-xl" /> : <video src={selectedPreview.data} controls autoPlay className="max-w-full max-h-full rounded-xl" />}
           </div>
        </div>
      )}
    </div>
  );
};

export default TicketChatModal;
