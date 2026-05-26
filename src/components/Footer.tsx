import { useState, useEffect } from 'react';
import { Facebook, Youtube, Phone, Mail, MapPin, Eye, Users } from 'lucide-react';
import Link from './Link';
import { getApiUrl } from '../utils';

interface FooterProps {
  onAdminClick?: () => void;
}

export default function Footer({ onAdminClick }: FooterProps) {
  const [visitorStats, setVisitorStats] = useState({ total: 12480, today: 150 });

  // Safe localStorage utility to prevent fatal browser SecurityErrors in iframes
  const safeLocalStorage = {
    getItem: (key: string): string | null => {
      try {
        return localStorage.getItem(key);
      } catch (e) {
        return (window as any).__v_fallback_local?.[key] || null;
      }
    },
    setItem: (key: string, value: string): void => {
      try {
        localStorage.setItem(key, value);
      } catch (e) {
        if (!(window as any).__v_fallback_local) {
          (window as any).__v_fallback_local = {};
        }
        (window as any).__v_fallback_local[key] = value;
      }
    }
  };

  // Safe sessionStorage utility to prevent fatal browser SecurityErrors in iframes
  const safeSessionStorage = {
    getItem: (key: string): string | null => {
      try {
        return sessionStorage.getItem(key);
      } catch (e) {
        return (window as any).__v_fallback_session?.[key] || null;
      }
    },
    setItem: (key: string, value: string): void => {
      try {
        sessionStorage.setItem(key, value);
      } catch (e) {
        if (!(window as any).__v_fallback_session) {
          (window as any).__v_fallback_session = {};
        }
        (window as any).__v_fallback_session[key] = value;
      }
    }
  };

  useEffect(() => {
    // 1. Interaction tracker: updates last activity timestamp when user interacts
    const updateActivityTimestamp = () => {
      safeLocalStorage.setItem('visitor_last_activity', String(Date.now()));
    };

    let lastInteractionTime = 0;
    const handleUserInteraction = () => {
      const now = Date.now();
      // Throttle to update at most once every 10 seconds to avoid unnecessary writes
      if (now - lastInteractionTime > 10000) {
        lastInteractionTime = now;
        updateActivityTimestamp();
      }
    };

    window.addEventListener('click', handleUserInteraction);
    window.addEventListener('keydown', handleUserInteraction);
    window.addEventListener('scroll', handleUserInteraction);
    window.addEventListener('mousemove', handleUserInteraction);

    // Initial update when script runs
    updateActivityTimestamp();

    return () => {
      window.removeEventListener('click', handleUserInteraction);
      window.removeEventListener('keydown', handleUserInteraction);
      window.removeEventListener('scroll', handleUserInteraction);
      window.removeEventListener('mousemove', handleUserInteraction);
    };
  }, []);

  useEffect(() => {
    // Load local storage cache as the initial display fallback
    const cacheToday = safeLocalStorage.getItem('cached_today_visits');
    const cacheTotal = safeLocalStorage.getItem('cached_total_visits');
    if (cacheToday && cacheTotal) {
      setVisitorStats({
        today: Number(cacheToday),
        total: Number(cacheTotal)
      });
    }

    const handleVisitorTracking = async () => {
      try {
        const now = Date.now();
        const isSessionActive = safeSessionStorage.getItem('visitor_session_active') === 'true';
        const lastActivityStr = safeLocalStorage.getItem('visitor_last_activity');
        const lastActivity = lastActivityStr ? Number(lastActivityStr) : 0;

        // Condition for new hit: 
        // Either they closed the browser (which clears sessionStorage)
        // OR more than 30 minutes (1800000 ms) has passed since their last recorded interaction.
        const isNewVisit = !isSessionActive || (now - lastActivity > 30 * 60 * 1000);

        if (isNewVisit) {
          // Increment the counter in the database
          const res = await fetch(getApiUrl('/api/visitor-tick'), { method: 'POST' });
          if (res.ok) {
            const data = await res.json();
            if (data && typeof data.today === 'number' && typeof data.total === 'number') {
              setVisitorStats({ today: data.today, total: data.total });
              safeLocalStorage.setItem('cached_today_visits', String(data.today));
              safeLocalStorage.setItem('cached_total_visits', String(data.total));
            }
          }
          safeSessionStorage.setItem('visitor_session_active', 'true');
        } else {
          // Already active session without timeout: just pull the latest live counts
          const res = await fetch(getApiUrl('/api/visitor-stats'));
          if (res.ok) {
            const data = await res.json();
            if (data && typeof data.today === 'number' && typeof data.total === 'number') {
              setVisitorStats({ today: data.today, total: data.total });
              safeLocalStorage.setItem('cached_today_visits', String(data.today));
              safeLocalStorage.setItem('cached_total_visits', String(data.total));
            }
          }
        }
      } catch (error) {
        console.error('Error tracking visitor statistics:', error);
      }
    };

    handleVisitorTracking();
  }, []);

  return (
    <footer className="bg-slate-900 text-slate-400 pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          {/* Brand */}
          <div className="space-y-6">
            <div className="flex flex-col leading-tight">
              <span className="text-2xl font-bold text-white tracking-tighter">
                Nông Cụ <span className="text-brand-primary">Thông Minh</span>
              </span>
              <span className="text-[10px] uppercase tracking-[0.2em] font-semibold text-slate-500">
                NHẸ HƠN - THÔNG MINH HƠN - HIỆU QUẢ HƠN
              </span>
            </div>
            <p className="text-sm leading-relaxed">
              Chúng tôi luôn đồng hành cùng bà con nông dân, cung cấp những sản phẩm chất lượng nhất giúp tăng năng suất và hiệu quả kinh tế.
            </p>
            <div className="flex gap-4">
              <a href="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-brand-primary hover:text-white transition-all">
                <Facebook size={20} />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-brand-primary hover:text-white transition-all">
                <Youtube size={20} />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-brand-primary hover:text-white transition-all text-slate-400 hover:text-white" title="TikTok">
                <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 448 512" className="w-[18px] h-[18px]" xmlns="http://www.w3.org/2000/svg">
                  <path d="M448,209.91a210.06,210.06,0,0,1-122.77-39.37V349.38A162.55,162.55,0,1,1,185,188.17v53.41a109.15,109.15,0,1,0,51.27,91.8V0h78.78a109,109,0,0,0,67.6,90,208.6,208.6,0,0,1,65.37,13.68Z"></path>
                </svg>
              </a>
            </div>
          </div>

          {/* Contact */}
          <div className="space-y-6">
            <h4 className="text-white text-lg font-bold not-italic font-sans underline underline-offset-8 decoration-brand-primary">
              Thông tin liên hệ
            </h4>
            <ul className="space-y-4 text-sm">
              <li className="flex gap-3">
                <MapPin className="shrink-0 text-brand-primary" size={20} />
                <span>Long Điền, X. Chợ Mới, T. An Giang</span>
              </li>
              <li className="flex gap-3">
                <Phone className="shrink-0 text-brand-primary" size={20} />
                <span>0706.583.888</span>
              </li>
              <li className="flex gap-3">
                <Mail className="shrink-0 text-brand-primary" size={20} />
                <span>maymocnonghiep@gmail.com</span>
              </li>
            </ul>
          </div>

          {/* Links */}
          <div className="space-y-6">
            <h4 className="text-white text-lg font-bold not-italic font-sans underline underline-offset-8 decoration-brand-primary">
              Chính sách
            </h4>
            <ul className="space-y-4 text-sm">
              <li><Link to="/chinh-sach/huong-dan-mua-hang" className="hover:text-brand-primary transition-colors">Hướng dẫn mua hàng</Link></li>
              <li><Link to="/chinh-sach/bao-hanh" className="hover:text-brand-primary transition-colors">Chính sách bảo hành</Link></li>
              <li><Link to="/chinh-sach/van-chuyen" className="hover:text-brand-primary transition-colors">Chính sách vận chuyển</Link></li>
              <li><Link to="/chinh-sach/doi-tra-hoan-tien" className="hover:text-brand-primary transition-colors">Đổi trả & Hoàn tiền</Link></li>
            </ul>
          </div>

          {/* Newsletter */}
          <div className="space-y-6">
            <h4 className="text-white text-lg font-bold not-italic font-sans underline underline-offset-8 decoration-brand-primary">
              Nhận tin khuyến mãi
            </h4>
            <p className="text-sm">Đăng ký để nhận thông tin sản phẩm mới và báo giá đại lý.</p>
            <div className="flex flex-col gap-4">
              <div className="flex">
                <input 
                  type="email" 
                  placeholder="Email của bạn"
                  className="bg-white/5 border border-white/10 rounded-l-lg px-4 py-2 w-full focus:outline-none focus:border-brand-primary"
                />
                <button className="bg-brand-primary text-white font-bold px-4 rounded-r-lg hover:bg-brand-primary/90 transition-all">
                  Gửi
                </button>
              </div>
              <button 
                onClick={onAdminClick}
                className="text-[10px] text-slate-600 hover:text-brand-primary transition-colors text-right mt-2 uppercase tracking-widest font-bold"
              >
                Quản trị hệ thống (Admin)
              </button>
            </div>
          </div>
        </div>

        <div id="footer-bottom-bar" className="pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6 text-xs">
          <span>© 2024 Nông Cụ Thông Minh. Tất cả quyền được bảo lưu.</span>
          
          <div className="flex flex-col sm:flex-row items-center gap-6 w-full md:w-auto md:justify-end">
            {/* Elegant Visitor Counter */}
            <div id="visitor-counter-container" className="flex flex-wrap items-center justify-center gap-4 text-slate-500 border border-white/5 rounded-xl px-4 py-2 bg-white/[0.02] text-[11px] font-medium">
              <div className="flex items-center gap-1.5">
                <Users size={13} className="text-brand-primary" />
                <span>Trong ngày: <strong id="today-visits-count" className="text-slate-300 font-bold">{visitorStats.today}</strong></span>
              </div>
              <div className="w-[1px] h-3 bg-white/10 hidden sm:block" />
              <div className="flex items-center gap-1.5">
                <Eye size={13} className="text-brand-primary" />
                <span>Tổng truy cập: <strong id="total-visits-count" className="text-slate-300 font-bold">{visitorStats.total}</strong></span>
              </div>
            </div>

            <div className="flex gap-6">
              <a href="#" className="hover:text-white transition-colors">Điều khoản</a>
              <a href="#" className="hover:text-white transition-colors">Bảo mật</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
