
import React, { useState, useMemo } from 'react';
import { User, UserRole } from '../types.ts';
import { DEPARTMENTS } from '../constants.tsx';

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

      const newUser: User = {
        id: `u-${Date.now()}`,
        ...formData
      };
      onAddUser(newUser);
    }
    setShowModal(false);
  };

  const handleResetPassword = (u: User) => {
    const confirmMsg = `Bạn có chắc muốn đặt lại mật khẩu cho ${u.fullName} về mặc định '123'?\n\nNgười dùng sẽ phải sử dụng mật khẩu này để đăng nhập lần tới.`;
    if (window.confirm(confirmMsg)) {
      onUpdateUser(u.id, { password: '123' });
    }
  };

  return (
    <div className="p-6 md:p-10 space-y-8 max-w-[1400px] mx-auto pb-24 page-enter">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">Quản lý <span className="text-blue-600">Nhân sự IT</span></h1>
          <p className="text-slate-500 font-medium text-lg mt-1">Thiết lập tài khoản, phân quyền và quản trị bảo mật hệ thống.</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-2xl font-bold shadow-xl shadow-blue-200 flex items-center space-x-3 transition transform active:scale-95"
        >
          <i className="fa-solid fa-user-plus"></i>
          <span>Tạo tài khoản mới</span>
        </button>
      </div>

      {/* Control Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 relative group">
          <i className="fa-solid fa-magnifying-glass absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors"></i>
          <input 
            type="text" 
            placeholder="Tìm kiếm theo tên hoặc mã đăng nhập..."
            className="w-full pl-14 pr-6 py-4 bg-white border-2 border-slate-100 rounded-3xl outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-600/5 transition-all shadow-sm font-medium"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="bg-white px-6 py-4 rounded-3xl border-2 border-slate-100 flex items-center justify-between shadow-sm">
           <div className="flex flex-col">
             <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Đang hoạt động</span>
             <span className="text-2xl font-black text-blue-600">{users.length} <span className="text-sm text-slate-300 font-bold ml-1">Thành viên</span></span>
           </div>
           <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600">
             <i className="fa-solid fa-users text-xl"></i>
           </div>
        </div>
      </div>

      {/* User Table */}
      <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 text-slate-400 uppercase text-[10px] font-black tracking-[0.2em] border-b border-slate-100">
                <th className="px-10 py-6">Thành viên</th>
                <th className="px-10 py-6">Phòng ban</th>
                <th className="px-10 py-6 text-center">Vai trò</th>
                <th className="px-10 py-6 text-right">Thao tác Quản trị</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-10 py-32 text-center">
                    <div className="flex flex-col items-center opacity-40">
                      <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-6 border-2 border-dashed border-slate-200">
                        <i className="fa-solid fa-user-slash text-4xl text-slate-300"></i>
                      </div>
                      <p className="font-black text-lg text-slate-400">Không tìm thấy người dùng này</p>
                      <button onClick={() => setSearchTerm('')} className="text-blue-600 font-bold mt-2 hover:underline">Hủy tìm kiếm</button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredUsers.map(u => (
                  <tr key={u.id} className={`hover:bg-slate-50/80 transition-all group ${u.id === currentUser.id ? 'bg-blue-50/30' : ''}`}>
                    <td className="px-10 py-7">
                      <div className="flex items-center space-x-5">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-white shadow-md transform transition group-hover:scale-105 ${
                          u.role === UserRole.ADMIN ? 'bg-indigo-600 shadow-indigo-200' : 'bg-slate-400'
                        }`}>
                          {u.fullName.charAt(0)}
                        </div>
                        <div>
                          <p className="text-base font-black text-slate-800">
                            {u.fullName}
                            {u.id === currentUser.id && (
                              <span className="ml-3 text-[8px] bg-slate-900 text-white px-2 py-0.5 rounded-md uppercase tracking-widest font-black">Bạn</span>
                            )}
                          </p>
                          <p className="text-xs text-slate-400 font-mono mt-0.5">ID: {u.username}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-10 py-7">
                      <p className="text-sm font-bold text-slate-600">{u.department}</p>
                      <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">Đơn vị VCPC</p>
                    </td>
                    <td className="px-10 py-7 text-center">
                      <span className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest ${
                        u.role === UserRole.ADMIN 
                        ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' 
                        : 'bg-slate-50 text-slate-500 border border-slate-100'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-10 py-7 text-right">
                      <div className="flex items-center justify-end space-x-3 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                        <button 
                          onClick={() => handleResetPassword(u)}
                          className="w-10 h-10 flex items-center justify-center rounded-xl bg-amber-50 text-amber-600 hover:bg-amber-500 hover:text-white transition shadow-sm"
                          title="Reset mật khẩu"
                        >
                          <i className="fa-solid fa-key text-xs"></i>
                        </button>
                        <button 
                          onClick={() => handleOpenModal(u)}
                          className="w-10 h-10 flex items-center justify-center rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white transition shadow-sm"
                          title="Chỉnh sửa thông tin"
                        >
                          <i className="fa-solid fa-user-pen text-xs"></i>
                        </button>
                        <button 
                          onClick={() => {
                            if (window.confirm(`CẢNH BÁO NGUY HIỂM!\n\nBạn sắp xóa vĩnh viễn tài khoản của ${u.fullName}.\nTất cả dữ liệu liên quan có thể bị ảnh hưởng. Bạn vẫn muốn tiếp tục?`)) {
                              onDeleteUser(u.id);
                            }
                          }}
                          disabled={u.id === currentUser.id}
                          className="w-10 h-10 flex items-center justify-center rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white transition shadow-sm disabled:opacity-20 disabled:cursor-not-allowed"
                          title="Xóa vĩnh viễn"
                        >
                          <i className="fa-solid fa-trash-can text-xs"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal User Edit/Add */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white rounded-[3rem] w-full max-w-xl overflow-hidden shadow-2xl transform transition-all animate-in zoom-in-95 duration-300">
            <div className="p-10 bg-slate-900 text-white relative">
              <h3 className="text-3xl font-black tracking-tight">{editingUser ? 'Cập nhật' : 'Đăng ký'} Nhân sự</h3>
              <p className="text-slate-400 font-medium mt-1">Vui lòng điền chính xác thông tin để định danh người dùng.</p>
              <button 
                onClick={() => setShowModal(false)} 
                className="absolute top-10 right-10 w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center hover:bg-white/20 transition border border-white/5"
              >
                <i className="fa-solid fa-xmark text-xl"></i>
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-10 space-y-6 bg-white">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Họ và tên nhân viên</label>
                <input
                  required
                  type="text"
                  value={formData.fullName}
                  onChange={e => setFormData({...formData, fullName: e.target.value})}
                  className="w-full px-6 py-4 rounded-2xl border-2 border-slate-100 focus:border-blue-600 outline-none transition shadow-sm font-bold text-slate-800"
                  placeholder="Họ tên đầy đủ"
                />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Tên đăng nhập (@)</label>
                  <input
                    required
                    type="text"
                    disabled={!!editingUser}
                    value={formData.username}
                    onChange={e => setFormData({...formData, username: e.target.value.toLowerCase().replace(/\s/g, '')})}
                    className="w-full px-6 py-4 rounded-2xl border-2 border-slate-100 focus:border-blue-600 outline-none transition shadow-sm disabled:bg-slate-50 disabled:text-slate-400 font-bold"
                    placeholder="nguyenvana"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Mật khẩu</label>
                  {editingUser ? (
                    <button 
                      type="button"
                      onClick={() => handleResetPassword(editingUser)}
                      className="w-full px-6 py-4 rounded-2xl bg-amber-50 text-amber-700 font-black text-xs uppercase border-2 border-amber-100 hover:bg-amber-100 transition"
                    >
                      <i className="fa-solid fa-rotate-left mr-2"></i> Reset về '123'
                    </button>
                  ) : (
                    <input
                      required
                      type="password"
                      value={formData.password}
                      onChange={e => setFormData({...formData, password: e.target.value})}
                      className="w-full px-6 py-4 rounded-2xl border-2 border-slate-100 focus:border-blue-600 outline-none transition shadow-sm font-bold"
                      placeholder="Mật khẩu"
                    />
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Vai trò hệ thống</label>
                  <select
                    value={formData.role}
                    onChange={e => setFormData({...formData, role: e.target.value as UserRole})}
                    className="w-full px-6 py-4 rounded-2xl border-2 border-slate-100 focus:border-blue-600 outline-none transition bg-white shadow-sm font-black text-slate-700 uppercase"
                  >
                    <option value={UserRole.USER}>Người dùng</option>
                    <option value={UserRole.ADMIN}>Quản trị viên</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Phòng ban làm việc</label>
                  <select
                    value={formData.department}
                    onChange={e => setFormData({...formData, department: e.target.value})}
                    className="w-full px-6 py-4 rounded-2xl border-2 border-slate-100 focus:border-blue-600 outline-none transition bg-white shadow-sm font-bold text-slate-700"
                  >
                    {DEPARTMENTS.map(dept => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="pt-6">
                <button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-5 rounded-2xl shadow-xl shadow-blue-600/20 transform transition active:scale-[0.98] flex items-center justify-center space-x-3 uppercase tracking-widest"
                >
                  <i className={`fa-solid ${editingUser ? 'fa-check-circle' : 'fa-plus-circle'}`}></i>
                  <span>{editingUser ? 'Hoàn tất cập nhật' : 'Tạo tài khoản ngay'}</span>
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
