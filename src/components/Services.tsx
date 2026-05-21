import { CheckCircle2, ChevronRight, Droplets, Zap, Wrench, Sprout } from 'lucide-react';
import { motion } from 'motion/react';

export default function Services() {
  const services = [
    {
      title: 'Tư vấn & Lắp đặt hệ thống tưới',
      icon: Droplets,
      desc: 'Thiết kế trọn gói hệ thống tưới nhỏ giọt, phun sương, phun mưa cho mọi loại cây trồng và quy mô trang trại.',
      features: ['Khảo sát địa hình tận nơi', 'Tính toán lưu lượng nước tối ưu', 'Vận hành và bàn giao kỹ thuật']
    },
    {
      title: 'Thi công hệ thống điện nông nghiệp',
      icon: Zap,
      desc: 'Lắp đặt tủ điện điều khiển, hệ thống bảo vệ an toàn và tự động hóa các thiết bị điện trong sản xuất.',
      features: ['Lắp đặt tủ điện thông minh', 'Giải pháp tiết kiệm điện năng', 'Bảo trì hệ thống định kỳ']
    },
    {
      title: 'Bảo trì & Sửa chữa thiết bị',
      icon: Wrench,
      desc: 'Dịch vụ sửa chữa tận nơi cho máy bơm, đường ống và các thiết bị kim khí dùng trong nông nghiệp.',
      features: ['Phụ kiện thay thế chính hãng', 'Kỹ thuật viên chuyên nghiệp', 'Xử lý nhanh chóng 24/7']
    },
    {
      title: 'Cung cấp vật tư trọn gói cho đại lý',
      icon: Sprout,
      desc: 'Chính sách giá sỉ đặc biệt cho các đại lý vật tư nông nghiệp, kim khí và đồ điện tại khu vực Miền Tây.',
      features: ['Chiết khấu hấp dẫn', 'Hỗ trợ marketing & bảng hiệu', 'Hỗ trợ vận chuyển tận kho']
    }
  ];

  return (
    <div className="py-12 bg-slate-900 min-h-screen pt-24 pb-20 text-white">
      <div className="max-w-7xl mx-auto px-4 lg:px-8">
        <div className="text-center mb-16">
          <span className="text-brand-accent font-bold uppercase tracking-widest text-sm">Chuyên nghiệp - Tận tâm</span>
          <h1 className="text-4xl md:text-5xl font-bold text-white mt-4 mb-4 not-italic font-sans">Dịch Vụ Của Chúng Tôi</h1>
          <p className="text-slate-400 max-w-2xl mx-auto italic">Mang đến giải pháp kỹ thuật hiện đại, giúp bà con tối ưu hóa sản xuất và giảm thiểu rủi ro.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
          {services.map((s, idx) => (
            <motion.div 
              key={idx}
              initial={{ opacity: 0, x: idx % 2 === 0 ? -20 : 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="bg-white/5 backdrop-blur-md rounded-3xl p-8 border border-white/10 hover:bg-white/10 transition-all group"
            >
              <div className="w-16 h-16 rounded-2xl bg-brand-primary/20 flex items-center justify-center text-brand-primary mb-6 group-hover:scale-110 transition-transform">
                <s.icon size={32} />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4 not-italic font-sans">{s.title}</h3>
              <p className="text-slate-400 mb-8 leading-relaxed italic">{s.desc}</p>
              
              <ul className="space-y-3 mb-8">
                {s.features.map(f => (
                  <li key={f} className="flex items-center gap-3 text-sm text-slate-300">
                    <CheckCircle2 size={18} className="text-brand-primary shrink-0" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              
              <button className="flex items-center gap-2 text-brand-accent font-bold hover:gap-3 transition-all uppercase tracking-widest text-xs">
                Liên hệ tư vấn <ChevronRight size={16} />
              </button>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
