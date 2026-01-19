import React, { useState, useMemo } from 'react';
import { User, UserRole } from '../types';
import { DEPARTMENTS } from '../constants';

interface UserManagementProps {
  users: User[];
  currentUser: User;
  onAddUser: (user: User) => void;
  onUpdateUser: (id: string, updates: Partial<User>) => void;
  onDeleteUser: (id: string) => void;
}

const UserManagement: React.FC<UserManagementProps> = ({ 
  users, 
  currentUser, 
  onAddUser, 
  onUpdateUser, 
  onDeleteUser 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  
  const [formData, setFormData] = useState({
    username: '',
    fullName: '',
    password: '123',
    role: UserRole.USER,
    department: DEPARTMENTS[0]
  });

  const filteredUsers = useMemo(() => {
    return users.filter(u => 
      u.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.department.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [users, searchTerm]);

  const handleOpenModal = (user?: User) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        username: user.username,
        fullName: user.fullName,
        password: user.password || '123',
        role: user.role,
        department: user.department
      });
    } else {
      setEditingUser(null);
      setFormData({
        username: '',
        fullName: '',
        password: '123',
        role: UserRole.USER,
        department: DEPARTMENTS[0]
      });
    }
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingUser) {
      onUpdateUser(editingUser.id, formData);
    } else {
      if (users.find(u => u.username.toLowerCase() === formData.username.toLowerCase())) {
        alert("Tên đăng nhập đã tồn tại trong hệ thống!");
        return;
      }
      const newUser: User = { id: `u-${Date.now()}`, ...formData };
      onAddUser(newUser);
    }
    setShowModal(false);
  };

  return (
    <div className="p-6 md:p-10 space-y-8 max-w-[1400px] mx-auto pb-24 page-enter">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">Quản lý <span className="text-blue-600">Nhân sự IT</span></h1>
        </div>
        <button onClick={() => handleOpenModal()} className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-2xl font-bold shadow-xl flex items-center space-x-3 transition transform active:scale-95">
          <i className="fa-solid fa-user-plus"></i>
          <span>Tạo tài khoản mới</span>
        </button>
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 text-slate-400 uppercase text-[10px] font-black tracking-[0.2em] border-b border-slate-100">
                <th className="px-10 py-6">Thành viên</th>
                <th className="px-10 py-6">Phòng ban</th>
                <th className="px-10 py-6 text-center">Vai trò</th>
                <th className="px-10 py-6 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.map(u => (
                <tr key={u.id} className="hover:bg-slate-50/80 transition-all group">
                  <td className="px-10 py-7">
                    <div className="flex items-center space-x-5">
                      <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black">{u.fullName.charAt(0)}</div>
                      <div>
                        <p className="font-black text-slate-800">{u.fullName}</p>
                        <p className="text-[10px] text-slate-400 font-mono">ID: {u.username}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-10 py-7 text-sm font-bold text-slate-600">{u.department}</td>
                  <td className="px-10 py-7 text-center">
                    <span className="px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest bg-slate-50 border border-slate-100">{u.role}</span>
                  </td>
                  <td className="px-10 py-7 text-right">
                    <button onClick={() => handleOpenModal(u)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"><i className="fa-solid fa-user-pen"></i></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
          <div className="bg-white rounded-[3rem] w-full max-w-xl overflow-hidden shadow-2xl p-10">
            <h3 className="text-2xl font-black mb-6">{editingUser ? 'Cập nhật' : 'Tạo'} tài khoản</h3>
            <form onSubmit={handleSubmit} className="space-y-6">
              <input required type="text" value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} className="w-full px-6 py-4 rounded-2xl border-2 border-slate-100 outline-none" placeholder="Họ và tên" />
              <input required type="text" disabled={!!editingUser} value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} className="w-full px-6 py-4 rounded-2xl border-2 border-slate-100 outline-none" placeholder="Tên đăng nhập" />
              <select value={formData.role} onChange={e => setFormData({...formData, role: e.target.value as UserRole})} className="w-full px-6 py-4 rounded-2xl border-2 border-slate-100 bg-white">
                <option value={UserRole.USER}>Người dùng</option>
                <option value={UserRole.ADMIN}>Quản trị viên</option>
              </select>
              <button type="submit" className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black">Xác nhận</button>
              <button type="button" onClick={() => setShowModal(false)} className="w-full text-slate-400 py-2">Hủy</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;