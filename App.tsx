
import React, { useState, useEffect, useCallback } from 'react';
import { User, UserRole, Ticket, TicketStatus, Comment, Asset, Attachment } from './types';
import { INITIAL_USERS, MOCK_TICKETS, INITIAL_ASSETS } from './constants';
import { db } from './services/dbService';
import LoginPage from './components/LoginPage';
import AdminDashboard from './components/AdminDashboard';
import UserDashboard from './components/UserDashboard';
import Sidebar from './components/Sidebar';
import TicketListView from './components/TicketListView';
import UserManagement from './components/UserManagement';
import AssetManagement from './components/AssetManagement';
import AdminDatabase from './components/AdminDatabase';

type ViewType = 'DASHBOARD' | 'TICKETS' | 'REPORTS' | 'USERS' | 'ASSETS' | 'DATABASE';

interface Toast {
  id: number;
  message: string;
  type: 'info' | 'success' | 'warning' | 'danger';
}

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [systemUsers, setSystemUsers] = useState<User[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentView, setCurrentView] = useState<ViewType>('DASHBOARD');
  const [toasts, setToasts] = useState<Toast[]>([]);

  const refreshData = useCallback(() => {
    const storedTickets = db.getTickets();
    const storedAssets = db.getAssets();
    const storedUsers = db.getUsers();

    setTickets(storedTickets);
    setAssets(storedAssets);
    setSystemUsers(storedUsers);

    const savedUser = localStorage.getItem('helpdesk_user');
    if (savedUser) {
      const parsed = JSON.parse(savedUser);
      const latest = storedUsers.find(u => u.id === parsed.id);
      if (latest) setCurrentUser(latest);
    }
  }, []);

  useEffect(() => {
    const initialize = async () => {
      // 1. Kiểm tra URL Sync
      const urlParams = new URLSearchParams(window.location.search);
      const syncData = urlParams.get('sync_data');
      if (syncData && db.importFromEncodedString(syncData)) {
        window.history.replaceState({}, document.title, window.location.pathname);
      }

      // 2. Tự động đồng bộ từ Cloud nếu có cấu hình
      if (db.getCloudUrl()) {
        await db.syncWithCloud();
      }

      // 3. Khởi tạo dữ liệu mẫu nếu DB trống
      if (!db.isInitialized()) {
        db.saveTickets(MOCK_TICKETS);
        db.saveAssets(INITIAL_ASSETS);
        db.saveUsers(INITIAL_USERS);
        db.setInitialized();
      }
      
      refreshData();
      setIsLoading(false);
    };

    initialize();
    db.onSync(() => refreshData());
    window.addEventListener('local_db_update', refreshData);
    return () => window.removeEventListener('local_db_update', refreshData);
  }, [refreshData]);

  const addToast = (message: string, type: 'info' | 'success' | 'warning' | 'danger' = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  };

  const handleLogin = (u: User) => {
    setCurrentUser(u);
    localStorage.setItem('helpdesk_user', JSON.stringify(u));
    db.logAction(u.id, u.fullName, 'LOGIN', 'Đăng nhập vào hệ thống.', 'SUCCESS');
    addToast(`Chào mừng ${u.fullName}!`, 'success');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('helpdesk_user');
  };

  const onAddTicket = (newTicket: Ticket) => {
    db.saveTickets([newTicket, ...tickets], { id: currentUser!.id, name: currentUser!.fullName }, `Tạo phiếu: ${newTicket.id}`);
    addToast('Gửi yêu cầu thành công!', 'success');
  };

  const onUpdateTicket = (ticketId: string, updates: Partial<Ticket>) => {
    const updated = tickets.map(t => t.id === ticketId ? { ...t, ...updates, updatedAt: new Date().toISOString() } : t);
    db.saveTickets(updated, { id: currentUser!.id, name: currentUser!.fullName }, `Cập nhật phiếu ${ticketId}`);
  };

  const onAddComment = (ticketId: string, message: string) => {
    const newComment: Comment = {
      id: `c-${Date.now()}`,
      senderId: currentUser!.id,
      senderName: currentUser!.fullName,
      senderRole: currentUser!.role,
      message,
      createdAt: new Date().toISOString()
    };
    const updated = tickets.map(t => t.id === ticketId ? { ...t, comments: [...(t.comments || []), newComment], updatedAt: new Date().toISOString() } : t);
    db.saveTickets(updated, { id: currentUser!.id, name: currentUser!.fullName }, `Bình luận phiếu ${ticketId}`);
  };

  const renderContent = () => {
    if (!currentUser) return null;
    switch (currentView) {
      case 'TICKETS': return <TicketListView tickets={tickets} user={currentUser} onUpdateTicket={onUpdateTicket} onAddComment={onAddComment} />;
      case 'USERS': return <UserManagement users={systemUsers} currentUser={currentUser} onAddUser={(u) => db.saveUsers([...systemUsers, u])} onUpdateUser={(id, up) => db.saveUsers(systemUsers.map(u => u.id === id ? {...u, ...up} : u))} onDeleteUser={(id) => db.saveUsers(systemUsers.filter(u => u.id !== id))} />;
      case 'ASSETS': return <AssetManagement assets={assets} users={systemUsers} onAddAsset={(a) => db.saveAssets([a, ...assets])} onUpdateAsset={(id, up) => db.saveAssets(assets.map(a => a.id === id ? {...a, ...up} : a))} onDeleteAsset={(id) => db.saveAssets(assets.filter(a => a.id !== id))} />;
      case 'DATABASE': return <AdminDatabase />;
      case 'DASHBOARD':
      default: return currentUser.role === UserRole.ADMIN ? <AdminDashboard tickets={tickets} onUpdateTicket={onUpdateTicket} onAddComment={onAddComment} /> : <UserDashboard tickets={tickets} user={currentUser} assets={assets} onAddTicket={onAddTicket} onAddComment={onAddComment} />;
    }
  };

  if (isLoading) return <div className="h-screen flex items-center justify-center bg-slate-100"><div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div></div>;

  if (!currentUser) return <LoginPage onLogin={handleLogin} users={systemUsers} />;

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar user={currentUser} onLogout={handleLogout} currentView={currentView} onViewChange={(v) => setCurrentView(v as ViewType)} />
      <main className="flex-1 overflow-y-auto">{renderContent()}</main>
      <div className="fixed bottom-8 right-8 z-[1000] flex flex-col gap-3">
        {toasts.map(t => (
          <div key={t.id} className={`px-6 py-4 rounded-2xl shadow-2xl text-white font-bold flex items-center gap-3 animate-in slide-in-from-right bg-slate-900 border-l-4 ${t.type === 'success' ? 'border-emerald-500' : 'border-blue-500'}`}>
            <i className={`fa-solid ${t.type === 'success' ? 'fa-circle-check text-emerald-400' : 'fa-circle-info text-blue-400'}`}></i>
            {t.message}
          </div>
        ))}
      </div>
    </div>
  );
};

export default App;
