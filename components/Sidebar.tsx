import React from 'react';
import { User, UserRole } from '../types';

interface SidebarProps {
  user: User;
  onLogout: () => void;
  currentView: string;
  onViewChange: (view: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ user, onLogout, currentView, onViewChange }) => {
  const isAdmin = user.role === UserRole.ADMIN;

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 hidden md:flex flex-col border-r border-slate-800 shrink-0 shadow-2xl">
      <div className="p-6">
        <div className="flex items-center space-x-3 text-white mb-10">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-900/20">
            <i className="fa-solid fa-headset text-white text-lg"></i>
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-bold tracking-tight leading-none">VCPC IT</span>
            <span className="text-[10px] text-blue-400 font-black uppercase tracking-widest mt-1">Helpdesk</span>
          </div>
        </div>

        <nav className="space-y-1.5">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3 ml-3">Menu chính</p>
          
          <button
            onClick={() => onViewChange('DASHBOARD')}
            className={`w-full flex items-center space-x-3 p-3.5 rounded-xl transition-all duration-200 border ${
              currentView === 'DASHBOARD'
                ? 'bg-blue-600 text-white border-blue-500 shadow-lg shadow-blue-900/40'
                : 'hover:bg-slate-800 hover:text-white border-transparent text-slate-400'
            }`}
          >
            <i className="fa-solid fa-house-chimney w-5"></i>
            <span className="font-bold text-sm">Dashboard</span>
          </button>
          
          <button
            onClick={() => onViewChange('TICKETS')}
            className={`w-full flex items-center space-x-3 p-3.5 rounded-xl transition-all duration-200 border ${
              currentView === 'TICKETS'
                ? 'bg-blue-600 text-white border-blue-500 shadow-lg shadow-blue-900/40'
                : 'hover:bg-slate-800 hover:text-white border-transparent text-slate-400'
            }`}
          >
            <i className="fa-solid fa-ticket-simple w-5"></i>
            <span className="font-bold text-sm">Yêu cầu hỗ trợ</span>
          </button>

          {isAdmin && (
            <div className="pt-6 space-y-1.5">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3 ml-3">Quản trị viên</p>
              
              <button
                onClick={() => onViewChange('ASSETS')}
                className={`w-full flex items-center space-x-3 p-3.5 rounded-xl transition-all duration-200 border ${
                  currentView === 'ASSETS'
                    ? 'bg-blue-600 text-white border-blue-500 shadow-lg shadow-blue-900/40'
                    : 'hover:bg-slate-800 hover:text-white border-transparent text-slate-400'
                }`}
              >
                <i className="fa-solid fa-laptop-code w-5"></i>
                <span className="font-bold text-sm">Quản lý tài sản</span>
              </button>

              <button
                onClick={() => onViewChange('USERS')}
                className={`w-full flex items-center space-x-3 p-3.5 rounded-xl transition-all duration-200 border ${
                  currentView === 'USERS'
                    ? 'bg-blue-600 text-white border-blue-500 shadow-lg shadow-blue-900/40'
                    : 'hover:bg-slate-800 hover:text-white border-transparent text-slate-400'
                }`}
              >
                <i className="fa-solid fa-users-gears w-5"></i>
                <span className="font-bold text-sm">Người dùng</span>
              </button>
              
              <button
                onClick={() => onViewChange('REPORTS')}
                className={`w-full flex items-center space-x-3 p-3.5 rounded-xl transition-all duration-200 border ${
                  currentView === 'REPORTS'
                    ? 'bg-blue-600 text-white border-blue-500 shadow-lg shadow-blue-900/40'
                    : 'hover:bg-slate-800 hover:text-white border-transparent text-slate-400'
                }`}
              >
                <i className="fa-solid fa-chart-pie w-5"></i>
                <span className="font-bold text-sm">Báo cáo thống kê</span>
              </button>
            </div>
          )}
        </nav>
      </div>

      <div className="mt-auto p-6 bg-slate-950/40">
        <div className="flex items-center space-x-3 mb-6 p-1">
          <div className="w-10 h-10 rounded-full bg-slate-800 border-2 border-slate-700 flex items-center justify-center text-blue-400 font-black shadow-inner">
            {user.fullName.charAt(0)}
          </div>
          <div className="overflow-hidden">
            <p className="text-sm font-bold text-white truncate">{user.fullName}</p>
            <p className="text-[9px] text-blue-500 uppercase font-black tracking-widest leading-none mt-1">{user.role}</p>
          </div>
        </div>
        <button
          onClick={onLogout}
          className="w-full flex items-center justify-center space-x-2 p-3.5 rounded-xl bg-slate-800 hover:bg-rose-600 text-slate-400 hover:text-white transition-all duration-300 text-xs font-black uppercase tracking-widest border border-slate-700 hover:border-rose-500 shadow-lg"
        >
          <i className="fa-solid fa-power-off"></i>
          <span>Đăng xuất</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;