
import React, { useState, useRef, useEffect } from 'react';
import { chatWithAI } from '../services/geminiService.ts';

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
      const history = messages.map(m => ({
        role: m.role,
        parts: [{ text: m.text }]
      }));
      
      const aiResponse = await chatWithAI(history, userMsg);
      setMessages(prev => [...prev, { role: 'model', text: aiResponse || 'Tôi không thể phản hồi lúc này.' }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'model', text: 'Có lỗi xảy ra, vui lòng thử lại.' }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="fixed bottom-8 right-8 z-[500] flex flex-col items-end">
      {/* Chat Window */}
      {isOpen && (
        <div className="mb-6 w-[380px] h-[550px] bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 flex flex-col overflow-hidden animate-in slide-in-from-bottom-10 duration-300">
          <div className="p-6 bg-blue-600 text-white flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md">
                <i className="fa-solid fa-robot text-lg"></i>
              </div>
              <div>
                <h4 className="font-black text-sm leading-none">VCPC AI Support</h4>
                <p className="text-[10px] text-blue-100 mt-1 flex items-center">
                  <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full mr-1.5 animate-pulse"></span>
                  Đang trực tuyến
                </p>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-white/60 hover:text-white transition">
              <i className="fa-solid fa-xmark text-lg"></i>
            </button>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-hide bg-slate-50/30">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] p-4 rounded-2xl text-sm leading-relaxed ${
                  msg.role === 'user' 
                    ? 'bg-blue-600 text-white rounded-tr-none shadow-md' 
                    : 'bg-white text-slate-700 border border-slate-100 rounded-tl-none shadow-sm'
                }`}>
                  {msg.text.split('\n').map((line, i) => (
                    <p key={i} className={line.startsWith('-') || line.startsWith('*') ? 'ml-2' : ''}>
                      {line}
                    </p>
                  ))}
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-white p-4 rounded-2xl rounded-tl-none border border-slate-100 flex space-x-1.5">
                  <div className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce"></div>
                  <div className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                  <div className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                </div>
              </div>
            )}
          </div>

          <form onSubmit={handleSend} className="p-4 bg-white border-t border-slate-100 flex items-center space-x-2">
            <input 
              type="text" 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Hỏi AI về lỗi máy tính, mạng..."
              className="flex-1 bg-slate-50 border-none rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-600/10 font-medium"
            />
            <button 
              type="submit"
              disabled={!input.trim() || isTyping}
              className="w-10 h-10 bg-blue-600 text-white rounded-xl flex items-center justify-center hover:bg-blue-700 transition disabled:opacity-50"
            >
              <i className="fa-solid fa-paper-plane text-xs"></i>
            </button>
          </form>
        </div>
      )}

      {/* Trigger Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`w-16 h-16 rounded-full shadow-2xl flex items-center justify-center text-2xl transition-all transform hover:scale-110 active:scale-95 ${
          isOpen ? 'bg-slate-800 text-white rotate-90' : 'bg-blue-600 text-white'
        }`}
      >
        <i className={`fa-solid ${isOpen ? 'fa-xmark' : 'fa-robot'}`}></i>
        {!isOpen && (
          <span className="absolute -top-1 -right-1 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500"></span>
          </span>
        )}
      </button>
    </div>
  );
};

export default AISupportWidget;
