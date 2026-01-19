import React, { useState, useEffect } from 'react';
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

  useEffect(() => {
    const initializeData = async () => {
      try {
        // Load Tickets
        const storedTickets = db.getTickets();
        if (storedTickets.length > 0) {
          setTickets(storedTickets);
        } else {
          db.saveTickets(MOCK_TICKETS);
          setTickets(MOCK_TICKETS);
        }

        // Load Assets
        const storedAssets = db.getAssets();
        if (storedAssets.length > 0) {
          setAssets(storedAssets);
        } else {
          db.saveAssets(INITIAL_ASSETS);
          setAssets(INITIAL_ASSETS);
        }

        // Load Users
        const storedUsers = db.getUsers();
        let activeUsers = INITIAL_USERS;
        if (storedUsers.length > 0) {
          activeUsers = storedUsers;
          setSystemUsers(storedUsers);
        } else {
          db.saveUsers(INITIAL_USERS);
          setSystemUsers(INITIAL_USERS);
        }

        // Session Check
        const savedUser = localStorage.getItem('helpdesk_user');
        if (savedUser) {
          const parsed = JSON.parse(savedUser);
          const valid = activeUsers.find(u => u.id === parsed.id);
          if (valid) setCurrentUser(valid);
        }
      } catch (err) {
        console.error("Database Init Error", err);
      } finally {
        setIsLoading(false);
      }
    };

    initializeData();
  }, []);

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
    setTickets(updated);
    db.saveTickets(updated);
    addToast('Gửi yêu cầu thành công!', 'success');
  };

  const onUpdateTicket = (ticketId: string, updates: Partial<Ticket>) => {
    const updated = tickets.map(t => t.id === ticketId ? { ...t, ...updates, updatedAt: new Date().toISOString() } : t);
    setTickets(updated);
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
    setTickets(updated);
    db.saveTickets(updated);
  };

  const onAddAsset = (asset: Asset) => {
    const updated = [asset, ...assets];
    setAssets(updated);
    db.saveAssets(updated);
    addToast('Đã thêm thiết bị', 'success');
  };

  const onAddUser = (user: User) => {
    const updated = [...systemUsers, user];
    setSystemUsers(updated);
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