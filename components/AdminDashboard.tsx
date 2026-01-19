import React, { useState, useMemo, useEffect } from 'react';
import { Ticket, TicketStatus, TicketPriority } from '../types';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  Legend, Cell, AreaChart, Area, PieChart, Pie
} from 'recharts';
import { summarizeTickets } from '../services/geminiService';
import TicketChatModal from './TicketChatModal';
import TicketDetailModal from './TicketDetailModal';
import { SUBSIDIARIES, CATEGORIES } from '../constants';

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

  const currentUser = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem('helpdesk_user') || '{}');
    } catch {
      return {};
    }
  }, []);

  const CHART_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316', '#14b8a6', '#f43f5e'];

  const stats = useMemo(() => {
    const total = tickets.length;
    const resolvedCount = tickets.filter(t => t.status === TicketStatus.RESOLVED || t.status === TicketStatus.CLOSED).length;
    const rate = total > 0 ? Math.round((resolvedCount / total) * 100) : 0;
    
    const slaComplianceCount = tickets.filter(t => t.priority !== TicketPriority.CRITICAL || t.status === TicketStatus.RESOLVED).length;
    const slaRate = total > 0 ? Math.round((slaComplianceCount / total) * 100) : 100;

    return {
      total,
      open: tickets.filter(t => t.status === TicketStatus.OPEN).length,
      inProgress: tickets.filter(t => t.status === TicketStatus.IN_PROGRESS).length,
      resolved: resolvedCount,
      critical: tickets.filter(t => t.priority === TicketPriority.CRITICAL).length,
      successRate: rate,
      avgResolutionTime: "3.8h",
      slaCompliance: slaRate + "%"
    };
  }, [tickets]);

  const categoryData = useMemo(() => {
    return CATEGORIES.map((cat, idx) => ({
      name: cat,
      value: tickets.filter(t => t.category === cat).length,
      color: CHART_COLORS[idx % CHART_COLORS.length]
    })).filter(c => c.value > 0);
  }, [tickets]);

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
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 w-full xl:w-auto">
          {[
            { label: 'Tỉ lệ giải quyết', value: stats.successRate + '%', color: 'text-emerald-600', icon: 'fa-check-double' },
            { label: 'Tuân thủ SLA', value: stats.slaCompliance, color: 'text-blue-600', icon: 'fa-shield-halved' },
            { label: 'Thời gian TB', value: stats.avgResolutionTime, color: 'text-indigo-600', icon: 'fa-clock' },
            { label: 'Khẩn cấp', value: stats.critical, color: 'text-rose-600', icon: 'fa-bolt-lightning' },
          ].map((item, idx) => (
            <div key={idx} className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col items-center justify-center text-center">
              <div className={`w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center ${item.color} mb-4`}>
                <i className={`fa-solid ${item.icon} text-lg`}></i>
              </div>
              <p className={`text-3xl font-black ${item.color}`}>{item.value}</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{item.label}</p>
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
                <p className="text-blue-100 leading-relaxed font-medium text-lg italic pr-12">"{aiSummary}"</p>
              </div>
           </div>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-2 bg-white p-10 rounded-[3.5rem] shadow-sm border border-slate-100">
          <h3 className="text-2xl font-black text-slate-800 tracking-tight mb-10">Xu hướng Phiếu yêu cầu</h3>
          <div className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailyTrends}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontWeight: 800}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontWeight: 800}} />
                <Tooltip />
                <Area type="monotone" dataKey="Phiếu mới" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.1} strokeWidth={4} />
                <Area type="monotone" dataKey="Hoàn tất" stroke="#10b981" fill="#10b981" fillOpacity={0.1} strokeWidth={4} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-10 rounded-[3.5rem] shadow-sm border border-slate-100">
          <h3 className="text-2xl font-black text-slate-800 mb-8 text-center tracking-tight">Phân Loại Sự Cố</h3>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={85}
                  outerRadius={110}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="bg-white p-10 rounded-[3.5rem] shadow-sm border border-slate-100">
           <h3 className="text-2xl font-black text-slate-800 tracking-tight mb-10">Vận hành theo Đơn vị</h3>
           <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={subsidiaryStats}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} />
                  <Tooltip />
                  <Bar dataKey="Mở" fill="#f59e0b" stackId="a" radius={[10, 10, 0, 0]} />
                  <Bar dataKey="Đang làm" fill="#3b82f6" stackId="a" />
                  <Bar dataKey="Hoàn tất" fill="#10b981" stackId="a" />
                </BarChart>
              </ResponsiveContainer>
           </div>
      </div>

      {activeTicketForChat && <TicketChatModal ticket={activeTicketForChat} currentUser={currentUser as any} onClose={() => setActiveTicketForChat(null)} onSendMessage={onAddComment} />}
      {activeTicketForDetail && <TicketDetailModal ticket={activeTicketForDetail} onClose={() => setActiveTicketForDetail(null)} />}
    </div>
  );
};

export default AdminDashboard;