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

  // Hàm load dữ liệu từ Database (Local Storage)
  const loadData = useCallback(() => {
    const storedTickets = db.getTickets();
    const storedAssets = db.getAssets();
    const storedUsers = db.getUsers();

    setTickets(storedTickets);
    setAssets(storedAssets);
    setSystemUsers(storedUsers);

    // Cập nhật session user nếu role hoặc info thay đổi ở tab khác
    const savedUser = localStorage.getItem('helpdesk_user');
    if (savedUser) {
      const parsed = JSON.parse(savedUser);
      const latestUser = storedUsers.find(u => u.id === parsed.id);
      if (latestUser) {
        // Chỉ cập nhật nếu thực sự có thay đổi để tránh re-render vô tận
        if (JSON.stringify(latestUser) !== JSON.stringify(currentUser)) {
          setCurrentUser(latestUser);
        }
      }
    }
  }, [currentUser]);

  useEffect(() => {
    const initializeData = async () => {
      try {
        if (!db.isInitialized()) {
          // Lần đầu chạy: Nạp dữ liệu mẫu
          db.saveTickets(MOCK_TICKETS);
          db.saveAssets(INITIAL_ASSETS);
          db.saveUsers(INITIAL_USERS);
          db.setInitialized();
        }
        loadData();
      } catch (err) {
        console.error("Database Init Error", err);
      } finally {
        setIsLoading(false);
      }
    };

    initializeData();

    // Lắng nghe thay đổi từ các tab khác
    window.addEventListener('storage', loadData);
    // Lắng nghe sự kiện thay đổi nội bộ tab (do dbService bắn ra)
    window.addEventListener('storage_updated', loadData);

    return () => {
      window.removeEventListener('storage', loadData);
      window.removeEventListener('storage_updated', loadData);
    };
  }, [loadData]);

  const addToast = (message: string, type: 'info' | 'success' | 'warning' | 'danger' = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  const handleLogin = (u: User) => {
    setCurrentUser(u);
    setCurrentView('DASHBOARD');
    localStorage.setItem('helpdesk_user', JSON.stringify(u));
    addToast(`Chào mừng ${u.fullName} đã quay lại!`, 'success');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setCurrentView('DASHBOARD');
    localStorage.removeItem('helpdesk_user');
  };

  const onAddTicket = (newTicket: Ticket) => {
    const updated = [newTicket, ...tickets];
    db.saveTickets(updated);
    addToast('Gửi yêu cầu thành công!', 'success');
  };

  const onUpdateTicket = (ticketId: string, updates: Partial<Ticket>) => {
    const updated = tickets.map(t => t.id === ticketId ? { ...t, ...updates, updatedAt: new Date().toISOString() } : t);
    db.saveTickets(updated);
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
    db.saveTickets(updated);
  };

  const onAddAsset = (asset: Asset) => {
    const updated = [asset, ...assets];
    db.saveAssets(updated);
    addToast('Đã thêm thiết bị', 'success');
  };

  const onAddUser = (user: User) => {
    const updated = [...systemUsers, user];
    db.saveUsers(updated);
    addToast('Đã thêm người dùng', 'success');
  };

  const renderContent = () => {
    if (!currentUser) return null;
    switch (currentView) {
      case 'TICKETS': return <TicketListView tickets={tickets} user={currentUser} onUpdateTicket={onUpdateTicket} onAddComment={onAddComment} />;
      case 'REPORTS': return <AdminDashboard tickets={tickets} onUpdateTicket={onUpdateTicket} onAddComment={onAddComment} />;
      case 'USERS': return <UserManagement users={systemUsers} currentUser={currentUser} onAddUser={onAddUser} onUpdateUser={() => {}} onDeleteUser={() => {}} />;
      case 'ASSETS': return <AssetManagement assets={assets} users={systemUsers} onAddAsset={onAddAsset} onUpdateAsset={() => {}} onDeleteAsset={() => {}} />;
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
      
      {/* Dynamic Toasts */}
      <div className="fixed bottom-8 right-8 z-[1000] flex flex-col gap-3">
        {toasts.map(t => (
          <div key={t.id} className={`px-6 py-4 rounded-2xl shadow-2xl text-white font-bold flex items-center gap-3 animate-in slide-in-from-right ${t.type === 'success' ? 'bg-emerald-600' : 'bg-slate-900'}`}>
            <i className={`fa-solid ${t.type === 'success' ? 'fa-check' : 'fa-info'}`}></i>
            {t.message}
          </div>
        ))}
      </div>
    </div>
  );
};

export default App;