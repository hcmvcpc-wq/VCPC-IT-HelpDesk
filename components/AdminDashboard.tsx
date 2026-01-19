
import React, { useState, useMemo } from 'react';
import { Ticket, TicketStatus, TicketPriority } from '../types.ts';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  Legend, Cell, AreaChart, Area, PieChart, Pie, LineChart, Line
} from 'recharts';
import { summarizeTickets } from '../services/geminiService.ts';
import TicketChatModal from './TicketChatModal.tsx';
import TicketDetailModal from './TicketDetailModal.tsx';
import { DEPARTMENTS, CATEGORIES, SUBSIDIARIES } from '../constants.tsx';

interface AdminDashboardProps {
  tickets: Ticket[];
  onUpdateTicket: (id: string, updates: Partial<Ticket>) => void;
  onAddComment: (ticketId: string, message: string) => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ tickets = [], onUpdateTicket, onAddComment }) => {
  const [filter, setFilter] = useState<TicketStatus | 'ALL'>('ALL');
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [activeTicketForChat, setActiveTicketForChat] = useState<Ticket | null>(null);
  const [activeTicketForDetail, setActiveTicketForDetail] = useState<Ticket | null>(null);

  const currentUser = JSON.parse(localStorage.getItem('helpdesk_user') || '{}');

  // Bảng màu thiết kế hiện đại
  const CHART_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316', '#14b8a6', '#f43f5e'];
  const PRIORITY_COLORS: Record<string, string> = {
    [TicketPriority.CRITICAL]: '#ef4444',
    [TicketPriority.HIGH]: '#f97316',
    [TicketPriority.MEDIUM]: '#3b82f6',
    [TicketPriority.LOW]: '#94a3b8'
  };

  // 1. Chỉ số tổng quát & KPI chuyên sâu
  const stats = useMemo(() => {
    const total = tickets.length;
    const resolvedCount = tickets.filter(t => t.status === TicketStatus.RESOLVED || t.status === TicketStatus.CLOSED).length;
    const rate = total > 0 ? Math.round((resolvedCount / total) * 100) : 0;
    
    // Giả lập tỉ lệ vi phạm SLA
    const slaComplianceCount = tickets.filter(t => t.priority !== TicketPriority.CRITICAL || t.status === TicketStatus.RESOLVED).length;
    const slaRate = total > 0 ? Math.round((slaComplianceCount / total) * 100) : 100;

    return {
      total,
      open: tickets.filter(t => t.status === TicketStatus.OPEN).length,
      inProgress: tickets.filter(t => t.status === TicketStatus.IN_PROGRESS).length,
      resolved: resolvedCount,
      critical: tickets.filter(t => t.priority === TicketPriority.CRITICAL).length,
      successRate: rate,
      avgResolutionTime: "3.8h", // Mock data
      slaCompliance: slaRate + "%"
    };
  }, [tickets]);

  // 2. Phân bổ theo DANH MỤC (Category Pie Chart)
  const categoryData = useMemo(() => {
    return CATEGORIES.map((cat, idx) => ({
      name: cat,
      value: tickets.filter(t => t.category === cat).length,
      color: CHART_COLORS[idx % CHART_COLORS.length]
    })).filter(c => c.value > 0);
  }, [tickets]);

  // 3. Thống kê theo ĐƠN VỊ (Subsidiary)
  const subsidiaryStats = useMemo(() => {
    return SUBSIDIARIES.map(sub => {
      const subTickets = tickets.filter(t => t.subsidiary === sub);
      return {
        name: sub,
        'Mở': subTickets.filter(t => t.status === TicketStatus.OPEN).length,
        'Đang làm': subTickets.filter(t => t.status === TicketStatus.IN_PROGRESS).length,
        'Hoàn tất': subTickets.filter(t => t.status === TicketStatus.RESOLVED || t.status === TicketStatus.CLOSED).length,
      };
    });
  }, [tickets]);

  // 4. Phân bổ theo MỨC ĐỘ ƯU TIÊN
  const priorityData = useMemo(() => {
    return [
      { name: 'Khẩn cấp', value: tickets.filter(t => t.priority === TicketPriority.CRITICAL).length, color: PRIORITY_COLORS[TicketPriority.CRITICAL] },
      { name: 'Cao', value: tickets.filter(t => t.priority === TicketPriority.HIGH).length, color: PRIORITY_COLORS[TicketPriority.HIGH] },
      { name: 'Trung bình', value: tickets.filter(t => t.priority === TicketPriority.MEDIUM).length, color: PRIORITY_COLORS[TicketPriority.MEDIUM] },
      { name: 'Thấp', value: tickets.filter(t => t.priority === TicketPriority.LOW).length, color: PRIORITY_COLORS[TicketPriority.LOW] },
    ].filter(p => p.value > 0);
  }, [tickets]);

  // 5. Xu hướng theo NGÀY (7 ngày qua - Area Chart)
  const dailyTrends = useMemo(() => {
    const data = [];
    const now = new Date();
    for (let i = 14; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const dateString = d.toISOString().split('T')[0];
      const displayDate = `${d.getDate()}/${d.getMonth() + 1}`;
      const created = tickets.filter(t => t.createdAt.startsWith(dateString)).length;
      const closed = tickets.filter(t => t.updatedAt.startsWith(dateString) && (t.status === TicketStatus.RESOLVED || t.status === TicketStatus.CLOSED)).length;
      data.push({ name: displayDate, 'Phiếu mới': created, 'Hoàn tất': closed });
    }
    return data;
  }, [tickets]);

  const filteredTickets = useMemo(() => {
    return filter === 'ALL' ? tickets.slice(0, 10) : tickets.filter(t => t.status === filter).slice(0, 10);
  }, [tickets, filter]);

  const handleSummarize = async () => {
    if (tickets.length === 0) return;
    setIsSummarizing(true);
    try {
      const summary = await summarizeTickets(JSON.stringify(tickets.slice(0, 25)));
      setAiSummary(summary);
    } catch (err) {
      setAiSummary("Không thể tạo tóm tắt lúc này. Vui lòng thử lại sau.");
    } finally {
      setIsSummarizing(false);
    }
  };

  return (
    <div className="p-6 md:p-10 space-y-10 max-w-[1600px] mx-auto pb-24 page-enter bg-slate-50">
      {/* Strategic Header */}
      <div className="flex flex-col xl:flex-row gap-8 items-start justify-between">
        <div className="flex-1 space-y-4">
          <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-blue-100 text-blue-700 text-[10px] font-black uppercase tracking-widest mb-2">
            Phân tích dữ liệu thời gian thực
          </div>
          <h1 className="text-5xl font-black text-slate-900 tracking-tight leading-none">Báo Cáo <span className="text-blue-600">Vận Hành</span></h1>
          <p className="text-slate-500 font-medium text-lg max-w-2xl">Phân tích chuyên sâu về luồng công việc, hiệu suất đội ngũ IT và các điểm nóng kỹ thuật trong doanh nghiệp.</p>
          
          <div className="flex flex-wrap gap-4 pt-4">
            <button 
              onClick={handleSummarize}
              className="bg-slate-900 hover:bg-slate-800 text-white px-8 py-4 rounded-2xl font-bold flex items-center space-x-3 transition transform active:scale-95 shadow-2xl shadow-slate-200 group"
            >
              <i className={`fa-solid ${isSummarizing ? 'fa-spinner fa-spin' : 'fa-wand-magic-sparkles'} group-hover:rotate-12 transition-transform`}></i>
              <span>AI Tổng hợp chiến lược</span>
            </button>
            <div className="flex items-center space-x-2 text-slate-400 text-sm font-bold bg-white px-4 py-2 rounded-xl border border-slate-100 shadow-sm">
              <i className="fa-solid fa-calendar-day"></i>
              <span>Hôm nay: {new Date().toLocaleDateString('vi-VN')}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 w-full xl:w-auto">
          {[
            { label: 'Tỉ lệ giải quyết', value: stats.successRate + '%', color: 'text-emerald-600', icon: 'fa-check-double', trend: '+2.4%' },
            { label: 'Tuân thủ SLA', value: stats.slaCompliance, color: 'text-blue-600', icon: 'fa-shield-halved', trend: 'Ổn định' },
            { label: 'Thời gian TB', value: stats.avgResolutionTime, color: 'text-indigo-600', icon: 'fa-clock', trend: '-15ph' },
            { label: 'Khẩn cấp', value: stats.critical, color: 'text-rose-600', icon: 'fa-bolt-lightning', trend: 'Cần chú ý' },
          ].map((item, idx) => (
            <div key={idx} className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col items-center justify-center text-center hover:shadow-xl transition-shadow relative overflow-hidden group">
              <div className={`w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center ${item.color} mb-4 group-hover:scale-110 transition-transform`}>
                <i className={`fa-solid ${item.icon} text-lg`}></i>
              </div>
              <p className={`text-3xl font-black ${item.color}`}>{item.value}</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1 mb-2">{item.label}</p>
              <span className="text-[9px] font-black px-2 py-0.5 rounded-md bg-slate-100 text-slate-500 uppercase">{item.trend}</span>
            </div>
          ))}
        </div>
      </div>

      {aiSummary && (
        <div className="bg-blue-600 text-white p-10 rounded-[4rem] shadow-2xl relative overflow-hidden group animate-in slide-in-from-bottom-4 duration-500">
           <div className="relative z-10 flex flex-col md:flex-row gap-8 items-start">
              <div className="w-16 h-16 rounded-3xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0 border border-white/30">
                <i className="fa-solid fa-robot text-3xl"></i>
              </div>
              <div className="space-y-4">
                <h3 className="text-2xl font-black tracking-tight">IT Strategy Insight by AI</h3>
                <p className="text-blue-50 leading-relaxed font-medium text-lg italic pr-12">"{aiSummary}"</p>
                <div className="flex items-center space-x-2 text-blue-200 text-xs font-bold uppercase tracking-widest">
                  <i className="fa-solid fa-sparkles"></i>
                  <span>Dựa trên dữ liệu 25 phiếu yêu cầu gần nhất</span>
                </div>
              </div>
           </div>
           <i className="fa-solid fa-brain absolute -right-16 -bottom-16 text-[20rem] opacity-10 group-hover:scale-110 transition-transform duration-1000"></i>
        </div>
      )}

      {/* Main Analytical Section */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Trend Area Chart */}
        <div className="xl:col-span-2 bg-white p-10 rounded-[3.5rem] shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-10">
            <div>
               <h3 className="text-2xl font-black text-slate-800 tracking-tight">Xu hướng Phiếu yêu cầu</h3>
               <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Dữ liệu 15 ngày gần nhất</p>
            </div>
            <div className="flex items-center space-x-6">
               <div className="flex items-center space-x-2">
                 <div className="w-3 h-3 rounded-full bg-blue-600"></div>
                 <span className="text-[10px] font-black text-slate-400 uppercase">Mới</span>
               </div>
               <div className="flex items-center space-x-2">
                 <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                 <span className="text-[10px] font-black text-slate-400 uppercase">Đã xử lý</span>
               </div>
            </div>
          </div>
          <div className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailyTrends}>
                <defs>
                  <linearGradient id="colorNew" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorDone" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontWeight: 800, fontSize: 10}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontWeight: 800}} />
                <Tooltip contentStyle={{borderRadius: '24px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)'}} />
                <Area type="monotone" dataKey="Phiếu mới" stroke="#3b82f6" strokeWidth={4} fillOpacity={1} fill="url(#colorNew)" />
                <Area type="monotone" dataKey="Hoàn tất" stroke="#10b981" strokeWidth={4} fillOpacity={1} fill="url(#colorDone)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="bg-white p-10 rounded-[3.5rem] shadow-sm border border-slate-100 flex flex-col">
          <h3 className="text-2xl font-black text-slate-800 mb-2 text-center tracking-tight">Phân Loại Sự Cố</h3>
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mb-8 text-center">Theo danh mục kỹ thuật</p>
          <div className="flex-1 min-h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={85}
                  outerRadius={125}
                  paddingAngle={8}
                  dataKey="value"
                  animationBegin={200}
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" align="center" iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-6 pt-6 border-t border-slate-50 space-y-3">
             {categoryData.slice(0, 3).map(cat => (
               <div key={cat.name} className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500">{cat.name}</span>
                  <span className="text-xs font-black text-slate-800">{cat.value} phiếu</span>
               </div>
             ))}
          </div>
        </div>
      </div>

      {/* Subsidiary & Operational View */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        <div className="bg-white p-10 rounded-[3.5rem] shadow-sm border border-slate-100">
           <div className="flex items-center justify-between mb-10">
             <h3 className="text-2xl font-black text-slate-800 tracking-tight">Vận hành theo Đơn vị</h3>
             <i className="fa-solid fa-building-shield text-slate-200 text-3xl"></i>
           </div>
           <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={subsidiaryStats}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontWeight: 800}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontWeight: 800}} />
                  <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '20px', border: 'none'}} />
                  <Legend verticalAlign="top" align="right" iconType="rect" iconSize={12} />
                  <Bar dataKey="Mở" stackId="a" fill="#f59e0b" barSize={45} />
                  <Bar dataKey="Đang làm" stackId="a" fill="#6366f1" />
                  <Bar dataKey="Hoàn tất" stackId="a" fill="#10b981" radius={[12, 12, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
           </div>
        </div>

        <div className="bg-white p-10 rounded-[3.5rem] shadow-sm border border-slate-100 overflow-hidden">
           <div className="flex items-center justify-between mb-8">
             <h3 className="text-2xl font-black text-slate-800 tracking-tight">Xử lý gần đây</h3>
             <div className="flex gap-1.5 p-1 bg-slate-100 rounded-xl">
               {['ALL', 'OPEN', 'RESOLVED'].map(s => (
                 <button key={s} onClick={() => setFilter(s as any)} className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${filter === s ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>
                   {s === 'ALL' ? 'Tất cả' : s === 'OPEN' ? 'Mới' : 'Xong'}
                 </button>
               ))}
             </div>
           </div>
           <div className="space-y-4">
              {filteredTickets.length === 0 ? (
                <div className="py-10 text-center text-slate-300 font-bold italic">Không có dữ liệu</div>
              ) : (
                filteredTickets.map(t => (
                  <div key={t.id} className="group p-4 rounded-2xl bg-slate-50 border border-transparent hover:border-blue-200 hover:bg-white transition-all flex items-center gap-5">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-white shrink-0 ${t.priority === 'CRITICAL' ? 'bg-rose-500' : 'bg-slate-300'}`}>
                      {t.id.slice(-2)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-slate-800 truncate group-hover:text-blue-600 transition-colors">{t.title}</h4>
                      <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-0.5">{t.department} • {t.creatorName}</p>
                    </div>
                    <div className="text-right">
                       <span className={`px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest ${t.status === 'OPEN' ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'}`}>
                          {t.status}
                       </span>
                       <p className="text-[8px] text-slate-300 font-bold mt-1.5">{new Date(t.updatedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                    </div>
                    <button onClick={() => setActiveTicketForDetail(t)} className="w-10 h-10 rounded-xl bg-white text-slate-400 hover:text-blue-600 flex items-center justify-center border border-slate-100 group-hover:border-blue-100 opacity-0 group-hover:opacity-100 transition-all">
                      <i className="fa-solid fa-chevron-right"></i>
                    </button>
                  </div>
                ))
              )}
           </div>
        </div>
      </div>

      {activeTicketForChat && <TicketChatModal ticket={activeTicketForChat} currentUser={currentUser} onClose={() => setActiveTicketForChat(null)} onSendMessage={onAddComment} />}
      {activeTicketForDetail && <TicketDetailModal ticket={activeTicketForDetail} onClose={() => setActiveTicketForDetail(null)} />}
    </div>
  );
};

export default AdminDashboard;
