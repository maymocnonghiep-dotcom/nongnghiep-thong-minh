import { Tag, Calendar, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';

export default function Promotions() {
  const promos = [
    {
      title: 'Đại tiệc hệ thống tưới',
      desc: 'Giảm ngay 20% cho trọn bộ hệ thống tưới nhỏ giọt tự động cho vườn sân thượng.',
      date: 'Áp dụng đến 30/06/2024',
      image: 'https://images.unsplash.com/photo-1596430349503-4552e185e9ea?w=800&q=80',
      tag: 'HOT'
    },
    {
      title: 'Combo thiết bị điện Panasonic',
      desc: 'Mua combo 10 ổ cắm + 10 công tắc Panasonic tặng ngay 1 bút thử điện cao cấp.',
      date: 'Áp dụng đến 15/06/2024',
      image: 'https://images.unsplash.com/photo-1558449028-b53a39d100fc?w=800&q=80',
      tag: 'NEW'
    },
    {
      title: 'Miễn phí vận chuyển',
      desc: 'Miễn phí vận chuyển toàn quốc cho đơn hàng kim khí và vật tư nước từ 2.000.000đ.',
      date: 'Duy nhất trong tháng 5',
      image: 'https://images.unsplash.com/photo-1591857177580-dc82b9ac4e1e?w=800&q=80',
      tag: 'FREE SHIP'
    }
  ];

  return (
    <div className="py-12 bg-slate-50 min-h-screen pt-24">
      <div className="max-w-7xl mx-auto px-4 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-brand-primary mb-4 not-italic font-sans">Chương Trình Khuyến Mãi</h1>
          <p className="text-slate-500 max-w-2xl mx-auto italic">Cập nhật những ưu đãi hấp dẫn nhất trong tháng dành cho khách hàng của Nông Nghiệp Thông Minh.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {promos.map((promo, idx) => (
            <motion.div 
              key={idx}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.1 }}
              className="bg-white rounded-3xl overflow-hidden shadow-sm border border-slate-100 flex flex-col md:flex-row h-full group"
            >
              <div className="w-full md:w-2/5 relative h-64 md:h-auto overflow-hidden">
                <img src={promo.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                <span className="absolute top-4 left-4 bg-brand-accent text-white font-bold text-xs px-3 py-1 rounded-full shadow-lg antialiased">
                  {promo.tag}
                </span>
              </div>
              <div className="w-full md:w-3/5 p-8 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 text-brand-secondary mb-4">
                    <Tag size={18} />
                    <span className="text-sm font-bold uppercase tracking-widest">Khuyến mãi</span>
                  </div>
                  <h3 className="text-2xl font-bold text-slate-800 mb-3 not-italic font-sans">{promo.title}</h3>
                  <p className="text-slate-600 mb-6 line-clamp-3">{promo.desc}</p>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-slate-400 text-sm italic">
                    <Calendar size={16} />
                    <span>{promo.date}</span>
                  </div>
                  <button className="flex items-center gap-2 text-brand-primary font-bold group-hover:gap-3 transition-all">
                    Xem chi tiết <ArrowRight size={18} />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
