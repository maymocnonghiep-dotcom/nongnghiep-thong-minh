import React, { useState } from 'react';
import { ShieldAlert, Key, ArrowLeft, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';

interface AdminLoginProps {
  onLogin: (email: string, password: string) => void;
  onBack: () => void;
  isLoading?: boolean;
  error?: string | null;
}

export default function AdminLogin({ onLogin, onBack, isLoading, error }: AdminLoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim() && password.trim()) {
      onLogin(email, password);
    }
  };

  return (
    <div className="min-h-screen pt-24 pb-20 bg-slate-50 flex items-center justify-center px-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100"
      >
        <div className="bg-brand-secondary p-8 text-white text-center relative overflow-hidden">
          <div className="relative z-10">
            <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center mx-auto mb-4 border border-white/30">
              <ShieldAlert size={32} />
            </div>
            <h1 className="text-2xl font-bold font-sans not-italic">Xác Thực Quản Trị</h1>
            <p className="text-blue-100 opacity-80 text-sm mt-1">Vui lòng nhập mã khóa để truy cập hệ thống</p>
          </div>
          {/* Decoration */}
          <div className="absolute -right-4 -top-4 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
        </div>

        <div className="p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Tài khoản quản trị (Email)</label>
              <div className="relative">
                <input 
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@example.com"
                  className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-brand-primary focus:border-brand-primary outline-none transition-all"
                  autoFocus
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Mật khẩu</label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                  <Key size={18} />
                </div>
                <input 
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Nhập mật khẩu..."
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-brand-primary focus:border-brand-primary outline-none transition-all font-mono"
                />
              </div>
              {error && (
                <p className="text-red-500 text-xs font-bold mt-2 flex items-center gap-1">
                  <ShieldAlert size={14} /> {error}
                </p>
              )}
            </div>

            <button 
              type="submit"
              disabled={isLoading || !password || !email}
              className="w-full py-4 bg-brand-primary text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-brand-primary/90 transition-all shadow-lg shadow-brand-primary/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  Đang kiểm tra...
                </>
              ) : (
                'Đăng nhập hệ thống'
              )}
            </button>
          </form>

          <button 
            onClick={onBack}
            className="w-full mt-6 py-2 text-slate-400 hover:text-slate-600 font-bold flex items-center justify-center gap-2 transition-colors"
          >
            <ArrowLeft size={18} /> Quay lại trang chủ
          </button>
        </div>

        <div className="p-6 bg-slate-50 border-t border-slate-100 text-center">
          <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">
            Hệ thống quản trị bảo mật bởi Agriculture Smart Solutions
          </p>
        </div>
      </motion.div>
    </div>
  );
}
