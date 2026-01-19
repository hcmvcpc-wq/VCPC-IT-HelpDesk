import React, { useState } from 'react';
import { User } from '../types';

interface LoginPageProps {
  onLogin: (user: User) => void;
  users: User[];
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin, users }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const normalizedUser = username.trim().toLowerCase();
    const user = users.find(u => u.username.toLowerCase() === normalizedUser && u.password === password);
    
    if (user) {
      onLogin(user);
    } else {
      setError('Tên đăng nhập hoặc mật khẩu không đúng. Vui lòng kiểm tra lại.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      <div className="hidden lg:flex lg:w-1/2 bg-blue-600 items-center justify-center p-12 text-white relative overflow-hidden">
        <div className="relative z-10 max-w-lg">
          <div className="w-20 h-20 bg-white/20 rounded-3xl flex items-center justify-center mb-8 backdrop-blur-md">
             <i className="fa-solid fa-headset text-4xl"></i>
          </div>
          <h2 className="text-5xl font-extrabold mb-6 leading-tight tracking-tight">IT Helpdesk VCPC </h2>
          <p className="text-blue-100 text-lg leading-relaxed mb-10">
            Hệ thống hỗ trợ kỹ thuật tập trung. Đăng nhập để bắt đầu quản lý các yêu cầu của bạn.
          </p>
          <div className="grid grid-cols-2 gap-8 pt-8 border-t border-white/20">
            <div>
              <p className="text-3xl font-bold">Admin</p>
              <p className="text-blue-200 text-sm italic">Quản lý toàn diện</p>
            </div>
            <div>
              <p className="text-3xl font-bold">User</p>
              <p className="text-blue-200 text-sm italic">Gửi yêu cầu nhanh</p>
            </div>
          </div>
        </div>
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 md:p-12 bg-white lg:bg-transparent">
        <div className="w-full max-w-md bg-white p-8 md:p-10 rounded-[2.5rem] shadow-2xl lg:shadow-none border border-slate-100 lg:border-none">
          <div className="mb-10 lg:hidden text-center">
            <i className="fa-solid fa-headset text-4xl text-blue-600 mb-4"></i>
            <h1 className="text-3xl font-bold text-slate-800 tracking-tight">IT Helpdesk Pro</h1>
          </div>

          <div className="mb-8">
            <h2 className="text-3xl font-bold text-slate-800 mb-2">Đăng nhập</h2>
            <p className="text-slate-500 font-medium">Chào mừng bạn quay lại!</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Tên đăng nhập</label>
              <div className="relative">
                <i className="fa-solid fa-user absolute left-4 top-1/2 -translate-y-1/2 text-slate-300"></i>
                <input
                  required
                  type="text"
                  value={username}
                  autoComplete="username"
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-600/5 focus:border-blue-600 focus:bg-white transition-all text-slate-800 shadow-sm"
                  placeholder="Nhập tên đăng nhập"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Mật khẩu</label>
              <div className="relative">
                <i className="fa-solid fa-lock absolute left-4 top-1/2 -translate-y-1/2 text-slate-300"></i>
                <input
                  required
                  type="password"
                  value={password}
                  autoComplete="current-password"
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-600/5 focus:border-blue-600 focus:bg-white transition-all text-slate-800 shadow-sm"
                  placeholder="Nhập mật khẩu"
                />
              </div>
            </div>

            {error && (
              <div className="bg-rose-50 border border-rose-100 text-rose-600 px-5 py-4 rounded-2xl text-sm font-bold flex items-center animate-in fade-in slide-in-from-top-2">
                <i className="fa-solid fa-circle-exclamation mr-3 text-lg"></i>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-5 rounded-2xl shadow-xl shadow-blue-600/20 transform transition active:scale-[0.98] flex items-center justify-center space-x-3 disabled:opacity-50"
            >
              {isSubmitting ? (
                <i className="fa-solid fa-circle-notch fa-spin text-xl"></i>
              ) : (
                <>
                  <span className="text-lg">Đăng nhập ngay</span>
                  <i className="fa-solid fa-arrow-right"></i>
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;