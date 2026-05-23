import React, { useState } from 'react';
import { X, CheckCircle2, AlertCircle, Sparkles, Send, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ConsultModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ConsultModal({ isOpen, onClose }: ConsultModalProps) {
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [province, setProvince] = useState('');
  const [district, setDistrict] = useState('');
  const [area, setArea] = useState('');
  const [farmModel, setFarmModel] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [errorStatus, setErrorStatus] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !phone.trim()) {
      setErrorStatus('Vui lòng nhập đầy đủ các thông tin bắt buộc: Họ tên và Số điện thoại!');
      return;
    }

    setLoading(true);
    setErrorStatus(null);

    try {
      const response = await fetch('/api/consultations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fullName,
          phone,
          province,
          district,
          area,
          farmModel,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setSuccess(true);
        // Reset states
        setFullName('');
        setPhone('');
        setProvince('');
        setDistrict('');
        setArea('');
        setFarmModel('');
      } else {
        setErrorStatus(data.message || 'Có lỗi xảy ra, vui lòng thử lại.');
      }
    } catch (err) {
      console.error(err);
      setErrorStatus('Không thể kết nối đến máy chủ. Vui lòng kiểm tra lại mạng Internet hoặc liên hệ trực tiếp hotline.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        {/* Backdrop overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          className="relative w-full max-w-lg bg-white rounded-3xl border border-slate-200/50 shadow-2xl overflow-hidden z-10"
        >
          {/* Header Banner */}
          <div className="bg-brand-primary text-white px-6 py-6 relative">
            <button
              onClick={onClose}
              id="close-consult-modal-btn"
              className="absolute right-4 top-4 text-white/80 hover:text-white hover:bg-white/10 p-1.5 rounded-full transition-all cursor-pointer"
            >
              <X size={20} />
            </button>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/10 rounded-xl">
                <Sparkles size={24} />
              </div>
              <div>
                <span className="text-[10px] uppercase font-black tracking-widest text-emerald-250">Đồng hành cùng nhà nông</span>
                <h3 className="text-lg md:text-xl font-black">Khảo Sát & Tư Vấn Miễn Phí</h3>
              </div>
            </div>
          </div>

          <div className="p-6 md:p-8 max-h-[80vh] overflow-y-auto">
            {success ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-8 space-y-4"
              >
                <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full mb-2">
                  <CheckCircle2 size={40} className="stroke-[2.5]" />
                </div>
                <h4 className="text-xl font-black text-slate-800">Đăng ký thành công!</h4>
                <p className="text-sm text-slate-600 leading-relaxed max-w-sm mx-auto">
                  Đội ngũ kỹ thuật của <strong className="text-brand-primary">Máy Móc Nông Nghiệp Thắng Lợi</strong> đã tiếp nhận thông tin khảo sát trực tiếp khu vườn của Chú/Bác.
                </p>
                <div className="p-4 bg-emerald-50 rounded-2xl text-xs text-emerald-800 font-medium">
                  Chúng tôi sẽ liên hệ lại qua số điện thoại để trao đổi trực tiếp trong thời gian sớm nhất.
                </div>
                <button
                  onClick={() => {
                    setSuccess(false);
                    onClose();
                  }}
                  className="px-6 py-2.5 bg-brand-primary text-white rounded-xl font-bold hover:bg-brand-primary/90 transition-all text-sm shadow-md"
                >
                  Đóng cửa sổ
                </button>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <p className="text-xs text-slate-500 leading-relaxed mb-4">
                  Chú/Bác vui lòng điền các thông tin cơ bản về khu vườn dưới đây. Nhà vườn sẽ khảo sát qua bản đồ và gọi điện trao đổi phương án tối ưu nhất.
                </p>

                {errorStatus && (
                  <div className="flex items-start gap-2.5 p-3.5 bg-rose-50 border border-rose-100 rounded-xl text-xs text-rose-700">
                    <AlertCircle size={16} className="shrink-0 mt-0.5" />
                    <span>{errorStatus}</span>
                  </div>
                )}

                {/* Primary Fields Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-slate-700 block">
                      Họ tên Chú/Bác <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Ví dụ: Nguyễn Văn A"
                      className="w-full text-slate-700 bg-slate-50/50 border border-slate-200 focus:border-brand-primary focus:bg-white rounded-xl px-3.5 py-2.5 text-sm font-medium focus:ring-1 focus:ring-brand-primary"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-slate-700 block">
                      Số điện thoại <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="Ví dụ: 0912345678"
                      className="w-full text-slate-700 bg-slate-50/50 border border-slate-200 focus:border-brand-primary focus:bg-white rounded-xl px-3.5 py-2.5 text-sm font-medium focus:ring-1 focus:ring-brand-primary"
                    />
                  </div>
                </div>

                {/* Address Fields */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-slate-700 block">
                      Tỉnh / Thành phố
                    </label>
                    <input
                      type="text"
                      value={province}
                      onChange={(e) => setProvince(e.target.value)}
                      placeholder="Ví dụ: Cần Thơ, Bến Tre"
                      className="w-full text-slate-700 bg-slate-50/50 border border-slate-200 focus:border-brand-primary focus:bg-white rounded-xl px-3.5 py-2.5 text-sm font-medium focus:ring-1 focus:ring-brand-primary"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-slate-700 block">
                      Huyện / Quận
                    </label>
                    <input
                      type="text"
                      value={district}
                      onChange={(e) => setDistrict(e.target.value)}
                      placeholder="Ví dụ: Phong Điền, Mỏ Cày"
                      className="w-full text-slate-700 bg-slate-50/50 border border-slate-200 focus:border-brand-primary focus:bg-white rounded-xl px-3.5 py-2.5 text-sm font-medium focus:ring-1 focus:ring-brand-primary"
                    />
                  </div>
                </div>

                {/* Garden Details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-slate-700 block">
                      Diện tích khu vườn
                    </label>
                    <input
                      type="text"
                      value={area}
                      onChange={(e) => setArea(e.target.value)}
                      placeholder="Ví dụ: 5 công, 2000m2..."
                      className="w-full text-slate-700 bg-slate-50/50 border border-slate-200 focus:border-brand-primary focus:bg-white rounded-xl px-3.5 py-2.5 text-sm font-medium focus:ring-1 focus:ring-brand-primary"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-slate-700 block">
                      Mô hình trồng trọt
                    </label>
                    <input
                      type="text"
                      value={farmModel}
                      onChange={(e) => setFarmModel(e.target.value)}
                      placeholder="Vườn sầu riêng, cam, ruộng..."
                      className="w-full text-slate-700 bg-slate-50/50 border border-slate-200 focus:border-brand-primary focus:bg-white rounded-xl px-3.5 py-2.5 text-sm font-medium focus:ring-1 focus:ring-brand-primary"
                    />
                  </div>
                </div>

                {/* Submit action */}
                <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-5 py-2.5 border border-slate-200 text-slate-600 hover:text-slate-800 hover:bg-slate-50 rounded-xl font-bold text-xs transition-all cursor-pointer"
                  >
                    Thoát
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-2.5 bg-brand-primary hover:bg-brand-primary/95 text-white rounded-xl font-black uppercase text-xs tracking-wider flex items-center gap-2 transition-all cursor-pointer shadow-md shadow-emerald-700/10 disabled:opacity-75 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="animate-spin" size={14} /> Gửi yêu cầu...
                      </>
                    ) : (
                      <>
                        Gửi đăng ký <Send size={12} />
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
