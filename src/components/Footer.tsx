import { Facebook, Youtube, Phone, Mail, MapPin } from 'lucide-react';
import Link from './Link';

interface FooterProps {
  onAdminClick?: () => void;
}

export default function Footer({ onAdminClick }: FooterProps) {
  return (
    <footer className="bg-slate-900 text-slate-400 pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          {/* Brand */}
          <div className="space-y-6">
            <div className="flex flex-col leading-tight">
              <span className="text-2xl font-bold text-white tracking-tighter">
                Nông Nghiệp <span className="text-brand-primary">Thông Minh</span>
              </span>
              <span className="text-[10px] uppercase tracking-[0.2em] font-semibold text-slate-500">
                Giải pháp tưới hiện đại
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

        <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4 text-xs">
          <span>© 2024 Nóng Nghiệp Thông Minh. Tất cả quyền được bảo lưu.</span>
          <div className="flex gap-6">
            <a href="#" className="hover:text-white">Điều khoản</a>
            <a href="#" className="hover:text-white">Bảo mật</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
