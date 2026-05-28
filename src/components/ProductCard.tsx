import React from 'react';
import { ShoppingCart, Heart, Info } from 'lucide-react';
import { Product } from '../types';
import { getHighResImageUrl } from '../utils';

interface ProductCardProps {
  product: Product;
  onClick: (product: Product) => void;
  onAddToCart: (product: Product) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, onClick, onAddToCart }) => {
  return (
    <div 
      className="bg-white rounded-2xl overflow-hidden border border-slate-100 transition-all duration-300 hover:shadow-xl hover:shadow-brand-primary/5 group cursor-pointer flex flex-col p-3 w-full max-w-[220px] hover:-translate-y-1"
      onClick={() => onClick(product)}
    >
      {/* Product Image */}
      <div className="w-full aspect-square relative overflow-hidden bg-slate-50 shrink-0 rounded-xl border border-slate-100 mb-3">
        <img loading="lazy" 
          src={getHighResImageUrl(product.picture)} 
          alt={product.name} 
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
          referrerPolicy="no-referrer"
        />
        <div className="absolute top-2 left-2">
          <span className="text-[8px] font-bold text-white bg-brand-primary/80 backdrop-blur-md px-1.5 py-0.5 rounded-md uppercase tracking-wider">
            {product.group}
          </span>
        </div>
        {product.discount && (
          <div className="absolute top-2 right-2">
            <span className="text-[10px] font-black text-white bg-red-500 px-2 py-1 rounded-lg shadow-sm">
              -{product.discount}%
            </span>
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="flex-grow flex flex-col">
        <div className="mb-3">
          <div className="flex flex-wrap items-center gap-1.5 mb-1">
            <span className="text-[8px] font-mono font-bold text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100 uppercase">
              SKU: {product.sku}
            </span>
            {/* Manufacturer code hidden as requested */}
          </div>
          <h3 className="font-sans font-bold text-slate-800 text-sm leading-tight line-clamp-2 group-hover:text-brand-primary transition-colors mb-1">
            {product.name}
          </h3>
          <p className="text-[10px] text-slate-500 line-clamp-2 font-medium leading-relaxed whitespace-pre-line">
            {product.description}
          </p>
        </div>
        
        <div className="flex items-center justify-between mt-auto pt-3 border-t border-slate-50">
          <div className="flex flex-col">
            {product.originalPrice && (
              <span className="text-[9px] text-slate-400 line-through font-bold">
                {product.originalPrice.toLocaleString('vi-VN')}đ
              </span>
            )}
            <span className="text-brand-primary font-black text-base">
              {product.price.toLocaleString('vi-VN')} <span className="text-[10px] font-normal">₫</span>
            </span>
          </div>
          <button 
            className="w-8 h-8 bg-brand-primary text-white rounded-xl hover:bg-brand-secondary transition-all shadow-lg shadow-brand-primary/10 flex items-center justify-center group/btn"
            onClick={(e) => {
              e.stopPropagation();
              onAddToCart(product);
            }}
          >
            <ShoppingCart size={14} className="group-hover/btn:scale-110 transition-transform" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
