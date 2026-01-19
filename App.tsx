
import React, { useState, useEffect } from 'react';
import { User, UserRole, Ticket, TicketStatus, Comment, Asset, Attachment } from './types.ts';
import { INITIAL_USERS, MOCK_TICKETS, INITIAL_ASSETS } from './constants.tsx';
import LoginPage from './components/LoginPage.tsx';
import AdminDashboard from './components/AdminDashboard.tsx';
import UserDashboard from './components/UserDashboard.tsx';
import Sidebar from './components/Sidebar.tsx';
import TicketListView from './components/TicketListView.tsx';
import UserManagement from './components/UserManagement.tsx';
import AssetManagement from './components/AssetManagement.tsx';

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

  useEffect(() => {
    try {
      const savedTickets = localStorage.getItem('helpdesk_tickets');
      if (savedTickets) {
        setTickets(JSON.parse(savedTickets));
      } else {
        const initialWithComments = MOCK_TICKETS.map(t => ({ ...t, comments: [] }));
        setTickets(initialWithComments);
        localStorage.setItem('helpdesk_tickets', JSON.stringify(initialWithComments));
      }

      const savedAssets = localStorage.getItem('helpdesk_assets');
      if (savedAssets) {
        setAssets(JSON.parse(savedAssets));
      } else {
        setAssets(INITIAL_ASSETS);
        localStorage.setItem('helpdesk_assets', JSON.stringify(INITIAL_ASSETS));
      }

      const savedSystemUsers = localStorage.getItem('helpdesk_system_users');
      let currentSystemUsers = INITIAL_USERS;
      if (savedSystemUsers) {
        currentSystemUsers = JSON.parse(savedSystemUsers);
        setSystemUsers(currentSystemUsers);
      } else {
        setSystemUsers(INITIAL_USERS);
        localStorage.setItem('helpdesk_system_users', JSON.stringify(INITIAL_USERS));
      }

      const savedUser = localStorage.getItem('helpdesk_user');
      if (savedUser) {
        const parsedUser = JSON.parse(savedUser);
        const validUser = currentSystemUsers.find(u => u.id === parsedUser.id);
        if (validUser) {
          setCurrentUser(validUser);
        } else {
          localStorage.removeItem('helpdesk_user');
        }
      }
    } catch (err) {
      console.error("Storage error:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const addToast = (message: string, type: 'info' | 'success' | 'warning' | 'danger' = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  const saveTickets = (newTickets: Ticket[]) => {
    setTickets(newTickets);
    localStorage.setItem('helpdesk_tickets', JSON.stringify(newTickets));
  };

  const saveAssets = (newAssets: Asset[]) => {
    setAssets(newAssets);
    localStorage.setItem('helpdesk_assets', JSON.stringify(newAssets));
  };

  const saveSystemUsers = (newUsers: User[]) => {
    setSystemUsers(newUsers);
    localStorage.setItem('helpdesk_system_users', JSON.stringify(newUsers));
  };

  const handleLogin = (u: User) => {
    setCurrentUser(u);
    setCurrentView('DASHBOARD');
    localStorage.setItem('helpdesk_user', JSON.stringify(u));
    addToast(`Chào mừng ${u.fullName} đã quay trở lại!`, 'success');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setCurrentView('DASHBOARD');
    localStorage.removeItem('helpdesk_user');
  };

  const addTicket = (newTicket: Ticket) => {
    const updated = [{ ...newTicket, comments: [] }, ...tickets];
    saveTickets(updated);
    addToast('Gửi yêu cầu thành công!', 'success');
  };

  const updateTicket = (ticketId: string, updates: Partial<Ticket>) => {
    if (!currentUser) return;
    const oldTicket = tickets.find(t => t.id === ticketId);
    if (!oldTicket) return;
    const systemComments: Comment[] = [];
    if (updates.status && updates.status !== oldTicket.status) {
      const msg = `Trạng thái thay đổi: ${oldTicket.status} ➔ ${updates.status}`;
      systemComments.push({
        id: `sys-${Date.now()}-status`,
        senderId: 'SYSTEM', senderName: 'Hệ thống', senderRole: 'SYSTEM',
        message: msg, createdAt: new Date().toISOString(), isSystem: true
      });
      addToast(msg, 'info');
    }
    const updated = tickets.map(t => t.id === ticketId ? { ...t, ...updates, updatedAt: new Date().toISOString(), comments: [...(t.comments || []), ...systemComments] } : t);
    saveTickets(updated);
  };

  const addComment = (ticketId: string, message: string, attachments?: Attachment[]) => {
    if (!currentUser) return;
    const newComment: Comment = {
      id: `c-${Date.now()}`, 
      senderId: currentUser.id, 
      senderName: currentUser.fullName, 
      senderRole: currentUser.role,
      message, 
      createdAt: new Date().toISOString(), 
      isSystem: false,
      attachments: attachments
    };
    const updated = tickets.map(t => t.id === ticketId ? { ...t, comments: [...(t.comments || []), newComment], updatedAt: new Date().toISOString() } : t);
    saveTickets(updated);
  };

  const handleAddAsset = (newAsset: Asset) => {
    const updated = [newAsset, ...assets];
    saveAssets(updated);
    addToast(`Đã thêm tài sản ${newAsset.name}`, 'success');
  };

  const handleUpdateAsset = (assetId: string, updates: Partial<Asset>) => {
    const updated = assets.map(a => a.id === assetId ? { ...a, ...updates } : a);
    saveAssets(updated);
    addToast(`Cập nhật tài sản thành công`, 'success');
  };

  const handleDeleteAsset = (assetId: string) => {
    const updated = assets.filter(a => a.id !== assetId);
    saveAssets(updated);
    addToast(`Đã xóa tài sản khỏi hệ thống`, 'warning');
  };

  const handleAddUser = (newUser: User) => {
    const updated = [...systemUsers, newUser];
    saveSystemUsers(updated);
    addToast(`Đã thêm thành viên ${newUser.fullName}`, 'success');
  };

  const handleUpdateUser = (userId: string, updates: Partial<User>) => {
    const updated = systemUsers.map(u => u.id === userId ? { ...u, ...updates } : u);
    saveSystemUsers(updated);
    addToast(`Đã cập nhật tài khoản thành công`, 'success');
  };

  const handleDeleteUser = (userId: string) => {
    if (userId === currentUser?.id) return;
    const updated = systemUsers.filter(u => u.id !== userId);
    saveSystemUsers(updated);
    addToast(`Đã xóa vĩnh viễn tài khoản`, 'danger');
  };

  const renderContent = () => {
    if (!currentUser) return null;
    switch (currentView) {
      case 'TICKETS': return <TicketListView tickets={tickets} user={currentUser} onUpdateTicket={updateTicket} onAddComment={addComment} />;
      case 'REPORTS': return <AdminDashboard tickets={tickets} onUpdateTicket={updateTicket} onAddComment={addComment} />;
      case 'USERS': return <UserManagement users={systemUsers} currentUser={currentUser} onAddUser={handleAddUser} onUpdateUser={handleUpdateUser} onDeleteUser={handleDeleteUser} />;
      case 'ASSETS': return <AssetManagement assets={assets} users={systemUsers} onAddAsset={handleAddAsset} onUpdateAsset={handleUpdateAsset} onDeleteAsset={handleDeleteAsset} />;
      case 'DASHBOARD':
      default: return currentUser.role === UserRole.ADMIN ? <AdminDashboard tickets={tickets} onUpdateTicket={updateTicket} onAddComment={addComment} /> : <UserDashboard tickets={tickets} user={currentUser} assets={assets} onAddTicket={addTicket} onAddComment={addComment} />;
    }
  };

  if (isLoading) return <div className="min-h-screen flex items-center justify-center bg-slate-100"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div></div>;
  if (!currentUser) return <LoginPage onLogin={handleLogin} users={systemUsers} />;

  return (
    <div className="flex min-h-screen bg-slate-50 relative">
      <Sidebar user={currentUser} onLogout={handleLogout} currentView={currentView} onViewChange={(v) => setCurrentView(v as ViewType)} />
      <main className="flex-1 overflow-y-auto">{renderContent()}</main>
      <div className="fixed bottom-8 right-8 z-[200] flex flex-col gap-3 pointer-events-none">
        {toasts.map(toast => (
          <div key={toast.id} className={`pointer-events-auto px-6 py-5 rounded-[2rem] shadow-2xl border-2 flex items-center gap-4 animate-in slide-in-from-right duration-500 ${toast.type === 'success' ? 'bg-emerald-600 border-emerald-500 text-white' : toast.type === 'danger' ? 'bg-rose-600 border-rose-500 text-white' : toast.type === 'warning' ? 'bg-amber-50 text-amber-400 text-white' : 'bg-slate-900 border-slate-800 text-white'}`}>
            <i className={`fa-solid ${toast.type === 'success' ? 'fa-check' : toast.type === 'danger' ? 'fa-trash-can' : toast.type === 'warning' ? 'fa-triangle-exclamation' : 'fa-circle-info'} text-lg`}></i>
            <span className="font-bold text-sm tracking-tight">{toast.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default App;
