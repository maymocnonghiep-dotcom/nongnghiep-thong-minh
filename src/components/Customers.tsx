import { Quote } from 'lucide-react';
import { motion } from 'motion/react';

export default function Customers() {
  const testimonials = [
    {
      name: 'Anh Trần Hữu Đức',
      location: 'Hợp tác xã Công nghệ cao TP. Cần Thơ',
      desc: 'Hệ thống tưới tự động giúp giảm 70% nhân lực tưới tiêu cho vườn dưa lưới 2000m2. Độ đồng đều tuyệt vời, cây phát triển mạnh.',
      image: 'https://images.unsplash.com/photo-1596430349503-4552e185e9ea?w=400&q=80',
    },
    {
      name: 'Chị Mai Lan',
      location: 'Chủ vườn bưởi da xanh (Vĩnh Long)',
      desc: 'Dịch vụ tư vấn chuyên nghiệp, tận tâm. Phụ kiện bét phun của cửa hàng rất bền, áp lực nước mạnh và tiết kiệm nước tối đa.',
      image: 'https://images.unsplash.com/photo-1591857177580-dc82b9ac4e1e?w=400&q=80',
    },
    {
      name: 'Ông Lê Văn Hùng',
      location: 'Chủ hộ kinh doanh điện nước (Tiền Giang)',
      desc: 'Là đại lý lâu năm, tôi tin tưởng vào chất lượng kim khí và đồ điện tại đây. Giá sỉ tốt nhất thị trường Miền Tây.',
      image: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=400&q=80',
    },
    {
      name: 'Anh Quốc Bảo',
      location: 'Vườn lan cảnh nghệ thuật (Sadec)',
      desc: 'Bét phun sương mịn, giúp duy trì độ ẩm cho lan rất ổn định. Đội ngũ kỹ thuật hỗ trợ lắp đặt tận nơi cực kỳ nhiệt tình.',
      image: 'https://images.unsplash.com/photo-1590644365607-1c5a919aa435?w=400&q=80',
    }
  ];

  return (
    <div className="py-12 bg-white min-h-screen pt-24 pb-20">
      <div className="max-w-7xl mx-auto px-4 lg:px-8">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-brand-primary mb-4 not-italic font-sans">Khách Hàng Tiêu Biểu</h1>
          <p className="text-slate-500 max-w-2xl mx-auto italic">Tự hào là đối tác tin cậy của hàng nghìn hộ nông dân và đại lý trên khắp cả nước.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          {testimonials.map((t, idx) => (
            <motion.div 
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="bg-slate-50 rounded-3xl p-8 flex flex-col sm:flex-row gap-6 relative border border-slate-100 hover:bg-white hover:border-brand-primary transition-all group shadow-sm hover:shadow-xl"
            >
              <div className="absolute top-6 right-8 text-brand-primary/10 group-hover:text-brand-primary/20 transition-colors">
                <Quote size={60} />
              </div>
              
              <div className="w-24 h-24 rounded-2xl overflow-hidden shrink-0 border-4 border-white shadow-md">
                <img loading="lazy" src={t.image} className="w-full h-full object-cover" />
              </div>
              
              <div className="flex flex-col justify-center">
                <p className="text-slate-700 italic mb-4 leading-relaxed relative z-10 font-medium">
                  "{t.desc}"
                </p>
                <div>
                  <h4 className="font-bold text-slate-900 text-lg not-italic font-sans">{t.name}</h4>
                  <span className="text-brand-secondary text-sm font-medium">{t.location}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
