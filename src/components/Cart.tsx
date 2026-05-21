import { CartItem } from '../types';
import { ShoppingCart, X, Plus, Minus, Trash2, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import React, { useState } from 'react';

interface CartProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onUpdateQuantity: (id: string, delta: number) => void;
  onRemove: (id: string) => void;
  onClear: () => void;
}

export default function Cart({ isOpen, onClose, items, onUpdateQuantity, onRemove, onClear }: CartProps) {
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    address: '',
    district: '',
    province: ''
  });

  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName || !formData.phone || !formData.address || !formData.district || !formData.province) {
      alert('Vui lòng điền đầy đủ thông tin');
      return;
    }

    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customer: formData,
          items: items.map(item => ({
            name: item.name,
            quantity: item.quantity,
            price: item.price
          })),
          total
        }),
      });

      if (response.ok) {
        setOrderSuccess(true);
        onClear();
      } else {
        alert('Có lỗi xảy ra khi đặt hàng. Vui lòng thử lại.');
      }
    } catch (error) {
      console.error('Order error:', error);
      alert('Không thể kết nối đến máy chủ. Vui lòng thử lại.');
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-[60] backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Sidebar */}
          <motion.div 
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 w-full max-w-lg h-full bg-white z-[70] shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-brand-primary text-white">
              <div className="flex items-center gap-3">
                <ShoppingCart size={24} />
                <h2 className="text-xl font-bold font-sans not-italic">Giỏ hàng ({items.length})</h2>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                <X size={24} />
              </button>
            </div>

            {/* Content */}
            <div className="flex-grow overflow-y-auto p-6">
              {orderSuccess ? (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
                  <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4">
                    <CheckCircle2 size={40} />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900">Đặt hàng thành công!</h3>
                  <p className="text-slate-500">Chúng tôi sẽ liên hệ với bạn sớm nhất để xác nhận đơn hàng.</p>
                  <button 
                    onClick={() => {
                        setOrderSuccess(false);
                        setIsCheckingOut(false);
                        onClose();
                    }}
                    className="bg-brand-primary text-white px-8 py-3 rounded-xl font-bold mt-8"
                  >
                    Tiếp tục mua sắm
                  </button>
                </div>
              ) : items.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-4">
                  <ShoppingCart size={64} className="opacity-20" />
                  <p className="italic">Giỏ hàng đang trống.</p>
                  <button onClick={onClose} className="text-brand-primary font-bold">Quay lại mua hàng</button>
                </div>
              ) : isCheckingOut ? (
                <div className="space-y-8">
                  <button 
                    onClick={() => setIsCheckingOut(false)}
                    className="text-brand-secondary text-sm font-bold flex items-center gap-2"
                  >
                    <Minus size={16} /> Quay lại giỏ hàng
                  </button>
                  <h3 className="text-2xl font-bold text-slate-800 not-italic font-sans">Thông tin nhận hàng</h3>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-widest">Họ tên</label>
                      <input 
                        required
                        type="text" 
                        value={formData.fullName}
                        onChange={e => setFormData({...formData, fullName: e.target.value})}
                        placeholder="VD: Nguyễn Văn An"
                        className="w-full border-2 border-slate-100 rounded-xl px-4 py-3 focus:border-brand-primary outline-none transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-widest">Số điện thoại</label>
                      <input 
                        required
                        type="tel" 
                        value={formData.phone}
                        onChange={e => setFormData({...formData, phone: e.target.value})}
                        placeholder="VD: 0912345678"
                        className="w-full border-2 border-slate-100 rounded-xl px-4 py-3 focus:border-brand-primary outline-none transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-widest">Địa chỉ giao hàng</label>
                      <input 
                        required
                        type="text" 
                        value={formData.address}
                        onChange={e => setFormData({...formData, address: e.target.value})}
                        placeholder="Số nhà, tên đường, thôn/xóm..."
                        className="w-full border-2 border-slate-100 rounded-xl px-4 py-3 focus:border-brand-primary outline-none transition-colors"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-widest">Huyện / Quận</label>
                        <input 
                          required
                          type="text" 
                          value={formData.district}
                          onChange={e => setFormData({...formData, district: e.target.value})}
                          placeholder="VD: Chợ Mới"
                          className="w-full border-2 border-slate-100 rounded-xl px-4 py-3 focus:border-brand-primary outline-none transition-colors"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-widest">Tỉnh / Thành phố</label>
                        <input 
                          required
                          type="text" 
                          value={formData.province}
                          onChange={e => setFormData({...formData, province: e.target.value})}
                          placeholder="VD: An Giang"
                          className="w-full border-2 border-slate-100 rounded-xl px-4 py-3 focus:border-brand-primary outline-none transition-colors"
                        />
                      </div>
                    </div>

                    <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 mt-8">
                      <div className="flex justify-between items-center font-bold text-lg mb-2">
                        <span>Tổng tiền:</span>
                        <span className="text-brand-primary">{total.toLocaleString('vi-VN')} ₫</span>
                      </div>
                      <div className="space-y-1 mb-6">
                        <p className="text-xs text-slate-500 italic flex items-center gap-1.5">• Đơn giá chưa bao gồm thuế VAT</p>
                        <p className="text-xs text-slate-500 italic flex items-center gap-1.5">• Đơn giá chưa bao gồm phí vận chuyển</p>
                      </div>
                      <button 
                        type="submit"
                        className="w-full bg-brand-accent hover:bg-brand-accent/90 text-white py-4 rounded-xl font-bold shadow-lg shadow-brand-accent/20 transition-all active:scale-95"
                      >
                        Xác nhận đặt hàng
                      </button>
                    </div>
                  </form>
                </div>
              ) : (
                <div className="space-y-6">
                  {items.map((item) => (
                    <div key={item.id} className="flex gap-4 p-4 rounded-2xl border border-slate-50 hover:bg-slate-50 transition-colors group">
                      <div className="w-20 h-20 rounded-xl overflow-hidden shrink-0">
                        <img src={item.image} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-grow">
                        <h4 className="font-bold text-slate-800 text-sm line-clamp-1 mb-1">{item.name}</h4>
                        <div className="text-brand-primary font-bold mb-2">
                          {item.price.toLocaleString('vi-VN')} ₫
                        </div>
                        <div className="flex items-center gap-3">
                          <button 
                            onClick={() => onUpdateQuantity(item.id, -1)}
                            className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center hover:bg-slate-200"
                          >
                            <Minus size={14} />
                          </button>
                          <span className="font-bold w-4 text-center">{item.quantity}</span>
                          <button 
                            onClick={() => onUpdateQuantity(item.id, 1)}
                            className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center hover:bg-slate-200"
                          >
                            <Plus size={14} />
                          </button>
                          <button 
                            onClick={() => onRemove(item.id)}
                            className="ml-auto text-slate-300 hover:text-red-500 transition-colors"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {!isCheckingOut && !orderSuccess && items.length > 0 && (
              <div className="p-6 border-t border-slate-100 bg-slate-50">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-slate-500 font-medium">Tổng số tiền:</span>
                  <span className="text-2xl font-bold text-brand-primary">{total.toLocaleString('vi-VN')} ₫</span>
                </div>
                <div className="space-y-1 mb-6">
                  <p className="text-xs text-slate-400 italic flex items-center gap-1.5">• Đơn giá chưa bao gồm thuế VAT</p>
                  <p className="text-xs text-slate-400 italic flex items-center gap-1.5">• Đơn giá chưa bao gồm phí vận chuyển</p>
                </div>
                <button 
                  onClick={() => setIsCheckingOut(true)}
                  className="w-full bg-brand-primary hover:bg-brand-primary/90 text-white py-4 rounded-2xl font-bold shadow-xl shadow-brand-primary/10 transition-all uppercase tracking-widest"
                >
                  Tiến hành thanh toán
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
