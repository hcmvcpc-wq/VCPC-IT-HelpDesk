import React, { useState, useRef, useEffect } from 'react';
import { chatWithAI } from '../services/geminiService';

const AISupportWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{role: 'user' | 'model', text: string}[]>([
    { role: 'model', text: 'Xin chào! Tôi là Trợ lý IT ảo của VCPC. Bạn cần tôi hỗ trợ vấn đề kỹ thuật nào hôm nay không?' }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isTyping) return;
    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsTyping(true);
    try {
      const history = messages.map(m => ({ role: m.role, parts: [{ text: m.text }] }));
      const aiResponse = await chatWithAI(history, userMsg);
      setMessages(prev => [...prev, { role: 'model', text: aiResponse || 'Tôi không thể phản hồi lúc này.' }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'model', text: 'Có lỗi xảy ra.' }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="fixed bottom-8 right-8 z-[500] flex flex-col items-end">
      {isOpen && (
        <div className="mb-6 w-[380px] h-[550px] bg-white rounded-[2.5rem] shadow-2xl border flex flex-col overflow-hidden animate-in slide-in-from-bottom-10">
          <div className="p-6 bg-blue-600 text-white flex justify-between">
            <span className="font-black text-sm">VCPC AI Support</span>
            <button onClick={() => setIsOpen(false)}><i className="fa-solid fa-xmark"></i></button>
          </div>
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/30">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] p-4 rounded-2xl text-sm ${msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-white border shadow-sm'}`}>
                  {msg.text}
                </div>
              </div>
            ))}
          </div>
          <form onSubmit={handleSend} className="p-4 border-t flex gap-2">
            <input type="text" value={input} onChange={(e) => setInput(e.target.value)} placeholder="Hỏi AI..." className="flex-1 px-4 py-2 bg-slate-50 outline-none" />
            <button type="submit" className="w-10 h-10 bg-blue-600 text-white rounded-xl"><i className="fa-solid fa-paper-plane text-xs"></i></button>
          </form>
        </div>
      )}
      <button onClick={() => setIsOpen(!isOpen)} className="w-16 h-16 rounded-full shadow-2xl bg-blue-600 text-white flex items-center justify-center text-2xl">
        <i className={`fa-solid ${isOpen ? 'fa-xmark' : 'fa-robot'}`}></i>
      </button>
    </div>
  );
};

export default AISupportWidget;