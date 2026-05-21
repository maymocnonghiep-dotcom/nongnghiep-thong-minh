import { ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';

interface HeroProps {
  onBuyNowClick: () => void;
  onViewProjectsClick: () => void;
}

export default function Hero({ onBuyNowClick, onViewProjectsClick }: HeroProps) {
  return (
    <section className="relative overflow-hidden bg-slate-900 h-[400px] md:h-[500px]">
      {/* Background Image with Overlay */}
      <div 
        className="absolute inset-0 bg-cover bg-center transition-transform duration-[20s] hover:scale-110"
        style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1596430349503-4552e185e9ea?w=1600&q=80")' }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />
      </div>

      <div className="max-w-7xl mx-auto px-4 lg:px-8 h-full relative flex items-center">
        <div className="max-w-2xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-4xl md:text-6xl text-white font-bold leading-tight mb-6 not-italic font-sans">
              Giải Pháp Nông Nghiệp <br />
              <span className="text-brand-primary">Thông Minh & Hiệu Quả</span>
            </h1>
            <p className="text-slate-300 text-lg md:text-xl mb-8 leading-relaxed max-w-lg">
              Cung cấp đầy đủ thiết bị tưới tự động, dụng cụ kim khí và các giải pháp tối ưu cho trang trại của bạn.
            </p>
            <div className="flex flex-wrap gap-4">
              <button 
                onClick={onBuyNowClick}
                className="bg-brand-primary hover:bg-brand-primary/90 text-white px-8 py-3 rounded-full font-bold transition-all flex items-center gap-2 group"
              >
                Mua ngay <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </button>
              <button 
                onClick={onViewProjectsClick}
                className="bg-white/10 hover:bg-white/20 backdrop-blur-md text-white border border-white/20 px-8 py-3 rounded-full font-bold transition-all"
              >
                Xem dự án
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
