import React, { useState, useMemo } from 'react';
import { User, UserRole } from '../types';
import { DEPARTMENTS, SUBSIDIARIES } from '../constants';

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
    department: DEPARTMENTS[0],
    subsidiary: SUBSIDIARIES[0]
  });

  const filteredUsers = useMemo(() => {
    return users.filter(u => 
      u.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.subsidiary.toLowerCase().includes(searchTerm.toLowerCase())
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
        department: user.department,
        subsidiary: user.subsidiary || SUBSIDIARIES[0]
      });
    } else {
      setEditingUser(null);
      setFormData({
        username: '',
        fullName: '',
        password: '123',
        role: UserRole.USER,
        department: DEPARTMENTS[0],
        subsidiary: SUBSIDIARIES[0]
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
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">Quản lý <span className="text-blue-600">Nhân sự</span></h1>
          <p className="text-slate-500 font-medium mt-2">Tổng số: {users.length} người dùng trên hệ thống</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
          <div className="relative flex-1 sm:w-64">
            <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
            <input 
              type="text" 
              placeholder="Tìm tên, ID, phòng ban..." 
              className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-600/5 transition-all text-sm font-medium"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button onClick={() => handleOpenModal()} className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-2xl font-bold shadow-xl flex items-center justify-center space-x-3 transition transform active:scale-95 shrink-0">
            <i className="fa-solid fa-user-plus"></i>
            <span>Tạo tài khoản mới</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 text-slate-400 uppercase text-[10px] font-black tracking-[0.2em] border-b border-slate-100">
                <th className="px-10 py-6">Thành viên</th>
                <th className="px-10 py-6">Đơn vị / Phòng ban</th>
                <th className="px-10 py-6 text-center">Vai trò</th>
                <th className="px-10 py-6 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-10 py-20 text-center text-slate-400 font-medium italic">Không tìm thấy người dùng nào phù hợp</td>
                </tr>
              ) : (
                filteredUsers.map(u => (
                  <tr key={u.id} className="hover:bg-slate-50/80 transition-all group">
                    <td className="px-10 py-7">
                      <div className="flex items-center space-x-5">
                        <div className="w-12 h-12 rounded-xl bg-slate-900 text-white flex items-center justify-center font-black shadow-lg">
                          {u.fullName.charAt(0)}
                        </div>
                        <div>
                          <p className="font-black text-slate-800">{u.fullName}</p>
                          <p className="text-[10px] text-slate-400 font-mono">ID: {u.username}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-10 py-7">
                      <div className="flex flex-col">
                        <span className="text-xs font-black text-blue-600 uppercase tracking-wider">{u.subsidiary}</span>
                        <span className="text-sm font-bold text-slate-600 mt-0.5">{u.department}</span>
                      </div>
                    </td>
                    <td className="px-10 py-7 text-center">
                      <span className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border ${
                        u.role === UserRole.ADMIN ? 'bg-indigo-50 text-indigo-600 border-indigo-100' : 'bg-slate-50 text-slate-500 border-slate-100'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-10 py-7 text-right">
                      <div className="flex justify-end space-x-2">
                        <button onClick={() => handleOpenModal(u)} className="w-10 h-10 flex items-center justify-center text-blue-600 hover:bg-blue-50 rounded-xl transition-colors">
                          <i className="fa-solid fa-user-pen"></i>
                        </button>
                        {u.id !== currentUser.id && (
                          <button onClick={() => {if(window.confirm(`Xóa tài khoản ${u.fullName}?`)) onDeleteUser(u.id)}} className="w-10 h-10 flex items-center justify-center text-rose-500 hover:bg-rose-50 rounded-xl transition-colors">
                            <i className="fa-solid fa-trash-can"></i>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white rounded-[3rem] w-full max-w-xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="p-8 bg-blue-600 text-white flex justify-between items-center">
               <h3 className="text-2xl font-black">{editingUser ? 'Cập nhật' : 'Tạo'} tài khoản mới</h3>
               <button onClick={() => setShowModal(false)} className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center hover:bg-white/20 transition">
                 <i className="fa-solid fa-xmark"></i>
               </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-10 space-y-5">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Họ và tên</label>
                <input required type="text" value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} className="w-full px-6 py-4 rounded-2xl border-2 border-slate-50 focus:border-blue-500 outline-none font-bold text-slate-700 bg-slate-50/50" placeholder="VD: Nguyễn Văn A" />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Tên đăng nhập</label>
                <input required type="text" disabled={!!editingUser} value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} className="w-full px-6 py-4 rounded-2xl border-2 border-slate-50 focus:border-blue-500 outline-none font-bold text-slate-700 bg-slate-50/50 disabled:opacity-50" placeholder="VD: van_nguyen" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Công ty con</label>
                  <select required value={formData.subsidiary} onChange={e => setFormData({...formData, subsidiary: e.target.value})} className="w-full px-6 py-4 rounded-2xl border-2 border-slate-50 focus:border-blue-500 outline-none font-bold text-slate-700 bg-slate-50/50">
                    {SUBSIDIARIES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Phòng ban</label>
                  <select required value={formData.department} onChange={e => setFormData({...formData, department: e.target.value})} className="w-full px-6 py-4 rounded-2xl border-2 border-slate-50 focus:border-blue-500 outline-none font-bold text-slate-700 bg-slate-50/50">
                    {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Vai trò hệ thống</label>
                <div className="grid grid-cols-2 gap-3">
                   <button 
                     type="button" 
                     onClick={() => setFormData({...formData, role: UserRole.USER})}
                     className={`py-3 rounded-2xl font-black text-xs uppercase tracking-widest border-2 transition-all ${formData.role === UserRole.USER ? 'bg-blue-50 border-blue-600 text-blue-600' : 'bg-white border-slate-100 text-slate-400'}`}
                   >
                     Người dùng
                   </button>
                   <button 
                     type="button" 
                     onClick={() => setFormData({...formData, role: UserRole.ADMIN})}
                     className={`py-3 rounded-2xl font-black text-xs uppercase tracking-widest border-2 transition-all ${formData.role === UserRole.ADMIN ? 'bg-blue-50 border-blue-600 text-blue-600' : 'bg-white border-slate-100 text-slate-400'}`}
                   >
                     Quản trị viên
                   </button>
                </div>
              </div>

              <div className="pt-6 space-y-3">
                <button type="submit" className="w-full bg-slate-900 hover:bg-slate-800 text-white py-5 rounded-2xl font-black shadow-xl transition-all transform active:scale-[0.98]">
                  {editingUser ? 'Cập nhật tài khoản' : 'Xác nhận tạo tài khoản'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;