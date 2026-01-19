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

type ViewType = 'DASHBOARD' | 'TICKETS' | 'REPORTS' | 'USERS' | 'ASSETS';

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
      if (latest && JSON.stringify(latest) !== JSON.stringify(currentUser)) {
        setCurrentUser(latest);
      }
    }
  }, [currentUser]);

  useEffect(() => {
    const initialize = () => {
      const urlParams = new URLSearchParams(window.location.search);
      const syncData = urlParams.get('sync_data');

      if (syncData) {
        const confirmSync = window.confirm("Phát hiện dữ liệu đồng bộ từ trình duyệt khác. Bạn có muốn khôi phục toàn bộ hệ thống từ nguồn này không?");
        if (confirmSync) {
          if (db.importFromEncodedString(syncData)) {
            window.history.replaceState({}, document.title, window.location.pathname);
          }
        }
      }

      if (!db.isInitialized()) {
        db.saveTickets(MOCK_TICKETS);
        db.saveAssets(INITIAL_ASSETS);
        db.saveUsers(INITIAL_USERS);
        db.logAction('SYSTEM', 'Hệ Thống', 'DB_INIT', 'Khởi tạo dữ liệu mẫu lần đầu thành công.', 'SUCCESS');
        db.setInitialized();
      }
      
      refreshData();
      setIsLoading(false);
    };

    initialize();

    db.onSync(() => refreshData());
    window.addEventListener('local_db_update', refreshData);
    window.addEventListener('storage', (e) => {
      if (e.key?.startsWith('helpdesk_db_')) refreshData();
    });

    return () => {
      window.removeEventListener('local_db_update', refreshData);
    };
  }, [refreshData]);

  const addToast = (message: string, type: 'info' | 'success' | 'warning' | 'danger' = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  };

  const handleLogin = (u: User) => {
    setCurrentUser(u);
    setCurrentView('DASHBOARD');
    localStorage.setItem('helpdesk_user', JSON.stringify(u));
    db.logAction(u.id, u.fullName, 'LOGIN', 'Đăng nhập vào hệ thống.', 'SUCCESS');
    addToast(`Chào mừng ${u.fullName}!`, 'success');
  };

  const handleLogout = () => {
    if (currentUser) {
      db.logAction(currentUser.id, currentUser.fullName, 'LOGOUT', 'Đăng xuất khỏi hệ thống.', 'INFO');
    }
    setCurrentUser(null);
    setCurrentView('DASHBOARD');
    localStorage.removeItem('helpdesk_user');
  };

  const onAddTicket = (newTicket: Ticket) => {
    const updated = [newTicket, ...tickets];
    db.saveTickets(updated, { id: currentUser!.id, name: currentUser!.fullName }, `Tạo phiếu hỗ trợ mới: ${newTicket.id}`);
    addToast('Gửi yêu cầu thành công!', 'success');
  };

  const onUpdateTicket = (ticketId: string, updates: Partial<Ticket>) => {
    const ticket = tickets.find(t => t.id === ticketId);
    const updated = tickets.map(t => t.id === ticketId ? { ...t, ...updates, updatedAt: new Date().toISOString() } : t);
    db.saveTickets(updated, { id: currentUser!.id, name: currentUser!.fullName }, `Cập nhật phiếu ${ticketId}: ${JSON.stringify(updates)}`);
  };

  const onAddComment = (ticketId: string, message: string, attachments?: Attachment[]) => {
    if (!currentUser) return;
    const newComment: Comment = {
      id: `c-${Date.now()}`,
      senderId: currentUser.id,
      senderName: currentUser.fullName,
      senderRole: currentUser.role,
      message,
      createdAt: new Date().toISOString(),
      attachments
    };
    const updated = tickets.map(t => t.id === ticketId ? { ...t, comments: [...(t.comments || []), newComment], updatedAt: new Date().toISOString() } : t);
    db.saveTickets(updated, { id: currentUser.id, name: currentUser.fullName }, `Gửi bình luận trong phiếu ${ticketId}`);
  };

  const onAddAsset = (asset: Asset) => db.saveAssets([asset, ...assets], { id: currentUser!.id, name: currentUser!.fullName }, `Thêm tài sản mới: ${asset.name}`);
  const onAddUser = (user: User) => db.saveUsers([...systemUsers, user], { id: currentUser!.id, name: currentUser!.fullName }, `Tạo người dùng mới: ${user.username}`);

  const renderContent = () => {
    if (!currentUser) return null;
    switch (currentView) {
      case 'TICKETS': return <TicketListView tickets={tickets} user={currentUser} onUpdateTicket={onUpdateTicket} onAddComment={onAddComment} />;
      case 'USERS': return <UserManagement users={systemUsers} currentUser={currentUser} onAddUser={onAddUser} onUpdateUser={() => {}} onDeleteUser={() => {}} />;
      case 'ASSETS': return <AssetManagement assets={assets} users={systemUsers} onAddAsset={onAddAsset} onUpdateAsset={() => {}} onDeleteAsset={() => {}} />;
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