import { Droplets, Zap, Wrench, Pipette as Pipe, ArrowRight, Loader2, Camera, Sun } from 'lucide-react';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Product } from '../types';
import { getHighResImageUrl } from '../utils';

interface CategoryGridProps {
  onNavigate: (view: string) => void;
  products: Product[];
}

const categories = [
  { name: 'Thiết bị tưới', icon: Droplets, color: 'bg-blue-50 text-blue-600' },
  { name: 'Đồ điện', icon: Zap, color: 'bg-yellow-50 text-yellow-600' },
  { name: 'Vật tư nước', icon: Pipe, color: 'bg-emerald-50 text-emerald-600' },
  { name: 'Dụng cụ làm vườn', icon: Wrench, color: 'bg-orange-50 text-orange-600' },
  { name: 'Camera An Ninh', icon: Camera, color: 'bg-indigo-50 text-indigo-600' },
  { name: 'Đèn năng lượng mặt trời', icon: Sun, color: 'bg-amber-50 text-amber-600' },
];

export default function CategoryGrid({ onNavigate, products }: CategoryGridProps) {
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);

  const getProductsByCategory = (groupName: string) => {
    return products.filter(p => p.group === groupName).slice(0, 10);
  };

  return (
    <section id="category-grid" className="py-12 bg-white relative">
      <div className="max-w-7xl mx-auto px-4 lg:px-8">
        <h2 className="text-xl font-bold text-slate-800 mb-8 uppercase tracking-widest text-center">TÌM THEO NHÓM</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
          {categories.map((cat) => (
            <div 
              key={cat.name} 
              className="relative group"
              onMouseEnter={() => setHoveredCategory(cat.name)}
              onMouseLeave={() => setHoveredCategory(null)}
            >
              <button 
                onClick={() => onNavigate(`category-${cat.name}`)}
                className="w-full flex flex-col items-center p-8 rounded-3xl border border-slate-100 hover:border-brand-primary hover:shadow-xl hover:shadow-brand-primary/5 transition-all bg-white relative z-10"
              >
                <div className={`w-20 h-20 rounded-2xl ${cat.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform group-hover:rotate-3`}>
                  <cat.icon size={40} />
                </div>
                <span className="text-base font-bold text-slate-800 not-italic font-sans">{cat.name}</span>
                <span className="text-xs text-slate-400 mt-2 font-medium">Xem tất cả sản phẩm</span>
              </button>

              {/* Hover Preview Panel */}
              <AnimatePresence>
                {hoveredCategory === cat.name && products.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute top-[80%] left-1/2 -translate-x-1/2 w-[300px] md:w-[400px] bg-white shadow-2xl rounded-3xl border border-slate-100 p-5 z-50 pointer-events-auto mt-4"
                    style={{ 
                      filter: 'drop-shadow(0 25px 50px -12px rgb(0 0 0 / 0.15))'
                    }}
                  >
                    <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-50">
                      <h3 className="font-bold text-brand-primary flex items-center gap-2">
                        <cat.icon size={18} />
                        Sản phẩm mới
                      </h3>
                      <button 
                        onClick={() => onNavigate(`category-${cat.name}`)}
                        className="text-xs font-bold text-slate-400 hover:text-brand-primary flex items-center gap-1 transition-colors"
                      >
                        Xem tất cả <ArrowRight size={14} />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      {getProductsByCategory(cat.name).map(product => (
                        <div 
                          key={product.id}
                          className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors group/item"
                          onClick={() => onNavigate(`category-${cat.name}`)} // Simple for now, ideally navigate to product detail
                        >
                          <div className="w-12 h-12 rounded-lg overflow-hidden bg-slate-100 shrink-0">
                            <img loading="lazy" src={getHighResImageUrl(product.picture)} alt={product.name} className="w-full h-full object-cover" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-slate-700 truncate group-hover/item:text-brand-primary">{product.name}</p>
                            <p className="text-[10px] text-brand-accent font-bold mt-0.5">
                              {product.price.toLocaleString('vi-VN')}đ
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-6 pt-4 border-t border-slate-50">
                      <button 
                        onClick={() => onNavigate(`category-${cat.name}`)}
                        className="w-full py-2.5 bg-slate-100 hover:bg-brand-primary hover:text-white text-slate-600 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2"
                      >
                        Xem thêm 5+ mặt hàng khác <ArrowRight size={14} />
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
