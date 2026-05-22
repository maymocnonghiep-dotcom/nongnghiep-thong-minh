import { Product } from '../types';
import { Star, ShoppingCart, ArrowLeft, Check } from 'lucide-react';
import { motion } from 'motion/react';

interface ProductDetailProps {
  product: Product;
  onBack: () => void;
  onAddToCart: (product: Product) => void;
}

export default function ProductDetail({ product, onBack, onAddToCart }: ProductDetailProps) {
  return (
    <div className="bg-white min-h-screen pt-24 pb-20">
      <div className="max-w-7xl mx-auto px-4 lg:px-8">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-slate-500 hover:text-brand-primary transition-colors mb-8 font-bold"
        >
          <ArrowLeft size={20} /> Quay lại
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
          {/* Image */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="aspect-square rounded-3xl overflow-hidden border border-slate-100 shadow-sm bg-slate-50/50 flex items-center justify-center p-4"
          >
            <img src={product.image} className="max-w-full max-h-full object-contain transition-transform duration-300 hover:scale-105" alt={product.name} />
          </motion.div>

          {/* Info */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex flex-col"
          >
            <div className="mb-6">
              <span className="text-xs uppercase font-bold text-brand-secondary tracking-widest mb-2 block">
                {product.category} {'>'} {product.group}
              </span>
              <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-2 not-italic font-sans">
                {product.name}
              </h1>
              <div className="mb-4">
                <span className="text-xs font-mono font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded">Mã: {product.sku}</span>
              </div>
              
              <div className="flex items-center gap-4 mb-6">
                <div className="flex text-yellow-400">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={18} fill={i < 4 ? "currentColor" : "none"} />
                  ))}
                </div>
                <span className="text-sm text-slate-500 font-medium">{product.reviews.length} đánh giá</span>
              </div>

              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                <div className="flex flex-col gap-1 mb-2">
                  {product.originalPrice && (
                    <div className="flex items-center gap-3">
                      <span className="text-lg text-slate-400 line-through font-bold">
                        {product.originalPrice.toLocaleString('vi-VN')} ₫
                      </span>
                      {product.discount && (
                        <span className="bg-red-500 text-white text-xs font-black px-2 py-1 rounded-lg">
                          -{product.discount}%
                        </span>
                      )}
                    </div>
                  )}
                  <div className="text-3xl font-black text-brand-primary">
                    {product.price.toLocaleString('vi-VN')} ₫ {product.unit && <span className="text-base text-slate-400 font-normal">/ {product.unit}</span>}
                  </div>
                </div>
                <p className="text-slate-600 text-sm italic">Giá chưa bao gồm VAT.</p>
              </div>
            </div>

            <div className="mb-8">
              <h3 className="font-bold text-slate-800 mb-4 uppercase text-sm tracking-widest">Mô tả sản phẩm</h3>
              <p className="text-slate-600 leading-relaxed italic whitespace-pre-wrap">
                {product.description}
              </p>
            </div>

            <button 
              onClick={() => onAddToCart(product)}
              className="mt-auto bg-brand-primary hover:bg-brand-primary/90 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-3 shadow-lg shadow-brand-primary/20 transition-all active:scale-95"
            >
              <ShoppingCart size={24} /> Thêm vào giỏ hàng
            </button>
          </motion.div>
        </div>

        {/* Specs & Reviews */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 pt-12 border-t border-slate-100">
          {/* Specs */}
          <div>
            <h3 className="text-xl font-bold text-slate-900 mb-6 not-italic font-sans flex items-center gap-2">
              <Check className="text-brand-primary" /> Thông số kỹ thuật
            </h3>
            <div className="bg-slate-50 rounded-2xl overflow-hidden border border-slate-100">
              <table className="w-full text-sm">
                <tbody>
                  {Object.entries(product.specs).map(([key, value], idx) => (
                    <tr key={key} className={idx % 2 === 0 ? 'bg-white/50' : ''}>
                      <td className="px-6 py-4 font-bold text-slate-500 w-1/3">{key}</td>
                      <td className="px-6 py-4 text-slate-800 font-medium">{value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Reviews */}
          <div>
            <h3 className="text-xl font-bold text-slate-900 mb-6 not-italic font-sans">Đánh giá từ khách hàng</h3>
            <div className="space-y-6">
              {product.reviews.length > 0 ? product.reviews.map((rev, idx) => (
                <div key={idx} className="border-b border-slate-100 pb-6 last:border-0">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-bold text-slate-800">{rev.user}</span>
                    <span className="text-xs text-slate-400 italic">{rev.date}</span>
                  </div>
                  <div className="flex text-yellow-400 mb-2">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} size={14} fill={i < rev.rating ? "currentColor" : "none"} />
                    ))}
                  </div>
                  <p className="text-slate-600 text-sm italic">"{rev.comment}"</p>
                </div>
              )) : (
                <div className="text-slate-400 italic bg-slate-50 p-8 rounded-2xl text-center">
                  Chưa có đánh giá nào cho sản phẩm này.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
