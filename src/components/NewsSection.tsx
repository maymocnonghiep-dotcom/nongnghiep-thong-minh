import { Calendar, User, Eye, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';

export default function NewsSection() {
  const news = [
    {
      title: 'Tầm quan trọng của hệ thống lọc trong tưới nhỏ giọt',
      category: 'Kỹ thuật',
      date: '18/05/2024',
      author: 'Admin',
      views: 1240,
      image: 'https://images.unsplash.com/photo-1596430349503-4552e185e9ea?w=800&q=80',
      desc: 'Nhiều bà con khi lắp đặt hệ thống thường bỏ qua bộ lọc, dẫn đến tình trạng tắc bét phun chỉ sau thời gian ngắn sử dụng...'
    },
    {
      title: 'Dự báo thị trường vật tư kim khí nông nghiệp cuối năm 2024',
      category: 'Thị trường',
      date: '15/05/2024',
      author: 'BBT',
      views: 856,
      image: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800&q=80',
      desc: 'Giá nguyên liệu sắt thép biến động lớn, bà con cần có kế hoạch nhập vật tư sớm để đảm bảo chi phí sản xuất...'
    },
    {
      title: 'Cách xử lý máy bơm nước bị nóng và có tiếng kêu lạ',
      category: 'Mẹo vặt',
      date: '10/05/2024',
      author: 'Kỹ thuật viên',
      views: 2310,
      image: 'https://images.unsplash.com/photo-1558449028-b53a39d100fc?w=800&q=80',
      desc: 'Máy bơm là "trái tim" của hệ thống tưới, việc phát hiện sớm các hư hại nhỏ sẽ giúp tiết kiệm chi phí sửa chữa lớn...'
    }
  ];

  return (
    <div className="py-12 bg-white min-h-screen pt-24 pb-20">
      <div className="max-w-7xl mx-auto px-4 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <div className="max-w-2xl">
            <h1 className="text-4xl font-bold text-slate-900 mb-4 not-italic font-sans">Tin Tức & Cẩm Nang</h1>
            <p className="text-slate-500 italic">Cập nhật tin tức thị trường, kiến thức kỹ thuật và những kinh nghiệm quý báu cho nhà nông hiện đại.</p>
          </div>
          <div className="flex gap-2">
            {['Tất cả', 'Kỹ thuật', 'Thị trường', 'Mẹo vặt'].map(cat => (
              <button key={cat} className="px-4 py-1.5 rounded-full text-sm font-medium border border-slate-200 hover:border-brand-primary hover:text-brand-primary transition-all">
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {news.map((item, idx) => (
            <motion.div 
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="group cursor-pointer"
            >
              <div className="aspect-[16/10] rounded-3xl overflow-hidden mb-6 relative">
                <img src={item.image} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                <span className="absolute top-4 left-4 bg-brand-primary text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase">
                  {item.category}
                </span>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center gap-4 text-xs text-slate-400 font-medium">
                  <span className="flex items-center gap-1.5"><Calendar size={14} /> {item.date}</span>
                  <span className="flex items-center gap-1.5"><User size={14} /> {item.author}</span>
                  <span className="flex items-center gap-1.5 ml-auto"><Eye size={14} /> {item.views}</span>
                </div>
                
                <h3 className="text-xl font-bold text-slate-800 line-clamp-2 group-hover:text-brand-primary transition-colors not-italic font-sans">
                  {item.title}
                </h3>
                
                <p className="text-slate-500 text-sm leading-relaxed line-clamp-3">
                  {item.desc}
                </p>
                
                <button className="flex items-center gap-2 text-brand-secondary font-bold text-sm group-hover:gap-3 transition-all pt-2">
                  Đọc tiếp <ArrowRight size={16} />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
