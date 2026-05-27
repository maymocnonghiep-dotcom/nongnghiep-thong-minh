import React, { useState, useEffect } from 'react';
import { Product } from '../types';
import { Star, ShoppingCart, ArrowLeft, Check, ChevronRight } from 'lucide-react';
import { motion } from 'motion/react';
import { getHighResImageUrl } from '../utils';
import { subcategoriesMap, getMatchedSubcategory, mainCategories } from '../categoriesData';

interface ProductDetailProps {
  product: Product;
  onBack: () => void;
  onAddToCart: (product: Product) => void;
  onNavigate?: (view: string) => void;
}

export default function ProductDetail({ product, onBack, onAddToCart, onNavigate }: ProductDetailProps) {
  const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 });
  const [isZooming, setIsZooming] = useState(false);
  const [activeImgIndex, setActiveImgIndex] = useState(0);

  useEffect(() => {
    setActiveImgIndex(0);
  }, [product.id]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setZoomPos({ x, y });
  };

  return (
    <div className="bg-white min-h-screen pt-24 pb-20">
      <div className="max-w-7xl mx-auto px-4 lg:px-8">
        
        {/* Elegant Breadcrumbs */}
        <div className="text-sm text-slate-500 mb-8 flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span 
              className="hover:text-brand-primary cursor-pointer transition-colors font-medium"
              onClick={() => onNavigate?.('home')}
            >
              Trang chủ
            </span>
            <ChevronRight size={14} className="text-slate-300" />
            <span 
              className="hover:text-brand-primary cursor-pointer transition-colors font-semibold text-slate-700"
              onClick={() => onNavigate?.(`category-${product.group}`)}
            >
              {product.group}
            </span>
            <ChevronRight size={14} className="text-slate-300" />
            <span className="text-slate-400 truncate max-w-[200px] sm:max-w-none font-normal italic">
              {product.name}
            </span>
          </div>

          <button 
            onClick={onBack}
            className="flex items-center gap-2 text-slate-500 hover:text-brand-primary transition-colors font-bold"
          >
            <ArrowLeft size={18} /> Quay lại
          </button>
        </div>

        {/* 2-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
          
          {/* Left Sidebar - Dynamic Category Tree */}
          <div className="lg:col-span-1 border-r border-slate-100 lg:pr-8">
            <div className="sticky top-28 bg-slate-50/50 lg:bg-transparent p-5 lg:p-0 rounded-2xl border border-slate-100 lg:border-0">
              <div className="mb-6">
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest font-sans">
                  Danh mục sản phẩm
                </h3>
                <div className="h-[3px] w-12 bg-brand-primary mt-2" />
              </div>

              <ul className="space-y-1 text-sm">
                {mainCategories.map((cat) => {
                  const isCurrentGroup = cat === product.group;
                  return (
                    <li key={cat}>
                      <button
                        onClick={() => onNavigate?.(`category-${cat}`)}
                        className={`w-full text-left py-2.5 px-3 rounded-xl transition-all flex items-center justify-between group cursor-pointer ${
                          isCurrentGroup 
                            ? 'font-bold text-brand-primary bg-slate-50/80 shadow-sm border border-slate-100/10' 
                            : 'text-slate-600 hover:text-brand-primary hover:bg-slate-50/50'
                        }`}
                      >
                        <span className="truncate flex items-center gap-2">
                          {isCurrentGroup && <span className="w-1.5 h-1.5 rounded-full bg-brand-primary shrink-0 animate-pulse" />}
                          {cat}
                        </span>
                      </button>

                      {/* Dynamic Expandable subcategories for the active group */}
                      {isCurrentGroup && subcategoriesMap[cat] && (
                        <ul className="pl-4 py-1.5 border-l border-slate-200 ml-3 flex flex-col gap-1 mt-1">
                          {subcategoriesMap[cat].map((subcat) => {
                            const matchedSubId = getMatchedSubcategory(product.name, subcategoriesMap[cat], product.subcategoryId);
                            const isCurrentSub = matchedSubId === subcat.id;
                            const navigateView = `category-${cat}::${subcat.id}`;

                            return (
                              <li key={subcat.id}>
                                <button
                                  onClick={() => onNavigate?.(navigateView)}
                                  className={`w-full text-left py-1.5 px-3 text-xs rounded-lg transition-all truncate cursor-pointer ${
                                    isCurrentSub
                                      ? 'text-brand-primary font-black bg-brand-primary/5 border-l-[3px] border-brand-primary pl-2'
                                      : 'text-slate-500 hover:text-brand-primary hover:bg-slate-50/40 pl-2'
                                  }`}
                                >
                                  {subcat.name}
                                </button>
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>

          {/* Right Area - Main Product Details */}
          <div className="lg:col-span-3">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-16">
              
              {/* Product Image Stage & Gallery Selector */}
              <div className="flex flex-col gap-4 self-start w-full">
                {(() => {
                  const imageList = product.images && product.images.length > 0 ? product.images : [product.image];
                  const selectedImgSrc = imageList[activeImgIndex] || product.image;
                  return (
                    <>
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="aspect-square rounded-3xl overflow-hidden border border-slate-100 shadow-sm bg-slate-50/50 relative group cursor-zoom-in self-start w-full"
                        onMouseMove={handleMouseMove}
                        onMouseEnter={() => setIsZooming(true)}
                        onMouseLeave={() => setIsZooming(false)}
                      >
                        <img 
                          src={getHighResImageUrl(selectedImgSrc)} 
                          className="w-full h-full object-cover" 
                          style={{
                            transformOrigin: `${zoomPos.x}% ${zoomPos.y}%`,
                            transform: isZooming ? 'scale(1.6)' : 'scale(1)',
                            transition: isZooming ? 'none' : 'transform 0.2s ease-out, transform-origin 0.2s ease-out',
                          }}
                          alt={product.name} 
                        />
                        
                        {/* Visual Indicator Hover Overlay */}
                        {!isZooming && (
                          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-slate-900/85 backdrop-blur-md text-white text-xs py-2 px-4 rounded-full flex items-center gap-2 shadow-lg transition-all duration-300 opacity-90 group-hover:opacity-100 group-hover:scale-105 pointer-events-none whitespace-nowrap">
                            <span className="text-sm">🔍</span>
                            <span className="font-medium tracking-wide">Rê chuột vào ảnh để phóng to chi tiết</span>
                          </div>
                        )}
                      </motion.div>

                      {/* Grid of thumbnails to select */}
                      {imageList.length > 1 && (
                        <div className="flex items-center gap-2.5 overflow-x-auto py-1.5 scrollbar-thin">
                          {imageList.map((img, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => setActiveImgIndex(idx)}
                              className={`w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden border-2 bg-slate-50 transition-all cursor-pointer shrink-0 relative ${
                                activeImgIndex === idx 
                                  ? 'border-brand-primary shadow-sm scale-105' 
                                  : 'border-slate-200/80 hover:border-slate-400'
                              }`}
                            >
                              <img 
                                src={img} 
                                alt={`${product.name} thumbnail ${idx + 1}`} 
                                referrerPolicy="no-referrer"
                                className="w-full h-full object-cover"
                              />
                            </button>
                          ))}
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>

              {/* Product Meta Info & CTA */}
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex flex-col justify-between"
              >
                <div>
                  <span className="text-xs uppercase font-bold text-slate-400 tracking-widest mb-2 block">
                    {product.group}
                  </span>
                  
                  <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-3 not-italic font-sans leading-tight">
                    {product.name}
                  </h1>

                  <div className="mb-4 flex flex-wrap items-center gap-2">
                    <span className="text-xs font-mono font-bold text-slate-500 bg-slate-100 px-2.5 py-1.5 rounded-lg">
                      Mã SKU: {product.sku}
                    </span>
                    {/* Manufacturer code hidden as requested */}
                  </div>
                  
                  <div className="flex items-center gap-4 mb-6">
                    <div className="flex text-yellow-400">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} size={16} fill={i < 4 ? "currentColor" : "none"} />
                      ))}
                    </div>
                    <span className="text-xs text-slate-400 font-bold">{product.reviews.length} đánh giá</span>
                  </div>

                  <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100/80 mb-6">
                    <div className="flex flex-col gap-1 mb-2">
                      {product.originalPrice && (
                        <div className="flex items-center gap-3">
                          <span className="text-sm text-slate-400 line-through font-bold">
                            {product.originalPrice.toLocaleString('vi-VN')} ₫
                          </span>
                          {product.discount && (
                            <span className="bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-md">
                              -{product.discount}%
                            </span>
                          )}
                        </div>
                      )}
                      
                      <div className="text-3xl font-black text-brand-primary">
                        {product.price.toLocaleString('vi-VN')} ₫ 
                        {product.unit && (
                          <span className="text-sm text-slate-400 font-normal"> / {product.unit}</span>
                        )}
                      </div>
                    </div>
                    <p className="text-slate-500 text-xs italic font-medium">Giá chưa bao gồm VAT.</p>
                  </div>
                </div>

                <div>
                  {/* Quick specs section */}
                  <div className="mb-6">
                    <h4 className="font-bold text-slate-700 text-xs uppercase tracking-wider mb-2 flex items-center gap-1.5 font-sans">
                      <Check size={14} className="text-brand-primary" /> Thông số kỹ thuật
                    </h4>
                    <div className="bg-slate-50/50 rounded-xl overflow-hidden border border-slate-100">
                      <table className="w-full text-xs">
                        <tbody>
                          {Object.entries(product.specs).map(([key, value], idx) => (
                            <tr key={key} className={idx % 2 === 0 ? 'bg-white/30 border-b border-slate-100/30' : 'border-b border-slate-100/30'}>
                              <td className="px-3 py-1.5 font-bold text-slate-500 w-1/3">{key}</td>
                              <td className="px-3 py-1.5 text-slate-700 font-semibold">{value}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <button 
                    onClick={() => onAddToCart(product)}
                    className="w-full bg-brand-primary hover:bg-brand-primary/95 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-3 shadow-lg shadow-brand-primary/15 transition-all active:scale-[0.98] cursor-pointer text-sm uppercase tracking-wider"
                  >
                    <ShoppingCart size={18} /> Thêm vào giỏ hàng
                  </button>
                </div>
              </motion.div>

            </div>

            {/* Description & Reviews block */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 pt-12 border-t border-slate-100">
              
              {/* Product Overview/Description & Purchase Guide */}
              <div className="space-y-8">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 mb-5 not-italic font-sans">
                    Mô tả sản phẩm
                  </h3>
                  <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100/60">
                    <p className="text-slate-600 leading-relaxed italic whitespace-pre-wrap text-sm">
                      {product.description}
                    </p>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-slate-900 mb-5 not-italic font-sans">
                    Hướng dẫn mua hàng
                  </h3>
                  <div className="bg-emerald-50/40 p-6 rounded-2xl border border-emerald-100/65">
                    <ul className="space-y-3.5 text-sm text-slate-700 mb-4">
                      <li className="flex items-start gap-3">
                        <span className="font-extrabold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded text-xs shrink-0 mt-0.5">Bước 1</span>
                        <span className="font-medium">Chọn sản phẩm, thêm vào giỏ hàng.</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="font-extrabold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded text-xs shrink-0 mt-0.5">Bước 2</span>
                        <span className="font-medium">Kiểm tra lại danh mục, số lượng sản phẩm.</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="font-extrabold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded text-xs shrink-0 mt-0.5">Bước 3</span>
                        <span className="font-medium">Bấm thanh toán và điền đầy đủ thông tin số điện thoại và địa chỉ.</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="font-extrabold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded text-xs shrink-0 mt-0.5">Bước 4</span>
                        <span className="font-medium">Hoàn tất.</span>
                      </li>
                    </ul>
                    <div className="pt-3 border-t border-emerald-100/90 text-xs text-slate-600 font-medium">
                      <span className="font-bold text-red-600">Lưu ý:</span> Quý khách có thể liên hệ hotline/zalo: <a href="tel:0706583888" className="text-emerald-700 hover:text-emerald-800 font-extrabold">0706.583.888</a> để được hỗ trợ hướng dẫn mua hàng nhanh hơn.
                    </div>
                  </div>
                </div>
              </div>

              {/* Customer Reviews feedback */}
              <div>
                <h3 className="text-lg font-bold text-slate-900 mb-5 not-italic font-sans">Đánh giá từ khách hàng</h3>
                <div className="space-y-6">
                  {product.reviews.length > 0 ? product.reviews.map((rev, idx) => (
                    <div key={idx} className="border-b border-slate-100 pb-5 last:border-0">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-bold text-slate-800 text-sm">{rev.user}</span>
                        <span className="text-xs text-slate-400 italic">{rev.date}</span>
                      </div>
                      <div className="flex text-yellow-400 mb-2">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} size={12} fill={i < rev.rating ? "currentColor" : "none"} />
                        ))}
                      </div>
                      <p className="text-slate-600 text-xs italic">"{rev.comment}"</p>
                    </div>
                  )) : (
                    <div className="text-slate-400 text-xs italic bg-slate-50/50 p-8 rounded-2xl text-center border border-slate-100/50">
                      Chưa có đánh giá nào cho sản phẩm này.
                    </div>
                  )}
                </div>
              </div>

            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
