import React, { useState, useEffect, useRef } from 'react';
import { Ticket, User, Comment, Attachment } from '../types';

interface TicketChatModalProps {
  ticket: Ticket;
  currentUser: User;
  onClose: () => void;
  onSendMessage: (ticketId: string, message: string, attachments?: Attachment[]) => void;
}

const TicketChatModal: React.FC<TicketChatModalProps> = ({ ticket, currentUser, onClose, onSendMessage }) => {
  const [message, setMessage] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  useEffect(() => { scrollToBottom(); }, [ticket.comments]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() || attachments.length > 0) {
      onSendMessage(ticket.id, message, attachments.length > 0 ? attachments : undefined);
      setMessage('');
      setAttachments([]);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-[2.5rem] w-full max-w-2xl h-[85vh] flex flex-col overflow-hidden shadow-2xl">
        <div className="p-6 bg-slate-900 text-white flex items-center justify-between">
          <h3 className="font-black text-lg truncate">Hỗ trợ: {ticket.title}</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center"><i className="fa-solid fa-xmark"></i></button>
        </div>
        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/50">
          {ticket.comments?.map((comment: Comment) => {
            const isMe = comment.senderId === currentUser.id;
            return (
              <div key={comment.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] px-4 py-3 rounded-2xl text-sm ${isMe ? 'bg-blue-600 text-white' : 'bg-white border border-slate-100'}`}>
                  {comment.message}
                </div>
              </div>
            );
          })}
          <div ref={chatEndRef} />
        </div>
        <form onSubmit={handleSend} className="p-6 bg-white border-t border-slate-100 flex gap-3">
          <input type="text" placeholder="Nhập nội dung..." className="flex-1 px-6 py-4 bg-slate-100 rounded-2xl outline-none" value={message} onChange={(e) => setMessage(e.target.value)} />
          <button type="submit" className="w-14 h-14 rounded-2xl bg-blue-600 text-white shadow-lg"><i className="fa-solid fa-paper-plane"></i></button>
        </form>
      </div>
    </div>
  );
};

export default TicketChatModal;