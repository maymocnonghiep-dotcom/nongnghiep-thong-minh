import React, { useState, useEffect } from 'react';
import { Upload, FileText, CheckCircle2, AlertCircle, ArrowLeft, Database, ShoppingBag, Eye, Calendar, User, MapPin } from 'lucide-react';
import * as XLSX from 'xlsx';
import { motion, AnimatePresence } from 'motion/react';
import { Product, Order } from '../types';

interface AdminPanelProps {
  onBack: () => void;
  onLogout?: () => void;
  onRefreshProducts?: () => void;
}

export default function AdminPanel({ onBack, onLogout, onRefreshProducts }: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState<'import' | 'orders'>('orders');
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ success: boolean; message: string; count?: number } | null>(null);
  
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  useEffect(() => {
    if (activeTab === 'orders') {
      fetchOrders();
    }
  }, [activeTab]);

  const fetchOrders = () => {
    setLoadingOrders(true);
    fetch('/api/admin/orders')
      .then(res => res.json())
      .then(data => {
        setOrders(data);
        setLoadingOrders(false);
      })
      .catch(err => {
        console.error('Error fetching orders:', err);
        setLoadingOrders(false);
      });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setImportResult(null);
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet) as any[];

        console.log('Imported Excel Raw Data:', jsonData);

        if (!jsonData || jsonData.length === 0) {
          throw new Error('File Excel rỗng hoặc không đúng định dạng.');
        }

        const parsedProducts: Product[] = jsonData.map((row, index) => {
          const getVal = (possibleKeys: string[]) => {
            for (const pk of possibleKeys) {
              const foundKey = Object.keys(row).find(k => k.trim().toLowerCase() === pk.toLowerCase());
              if (foundKey) return row[foundKey];
            }
            return undefined;
          };

          const sku = String(getVal(['Mã sản phẩm (SKU)', 'Mã sản phẩm', 'SKU', 'Mã']) || `SKU-${Date.now()}-${index}`).trim();
          const name = String(getVal(['Tên sản phẩm', 'Tên', 'Name']) || 'Sản phẩm mới').trim();
          const group = String(getVal(['Nhóm sản phẩm', 'Nhóm', 'Group']) || 'Thiết bị tưới').trim();
          const priceRaw = getVal(['Giá bán (VNĐ)', 'Giá bán', 'Giá', 'Price']);
          const price = typeof priceRaw === 'number' ? priceRaw : parseInt(String(priceRaw || '0').replace(/\D/g, '')) || 0;
          const unit = String(getVal(['Đơn vị', 'Unit']) || '').trim();
          const description = String(getVal(['Mô tả', 'Description']) || '').trim();
          const image = String(getVal(['Link hình ảnh', 'Hình ảnh', 'Image']) || '').trim() || 'https://images.unsplash.com/photo-1615811361523-6bd03d7748e7?w=500&q=80';
          
          const rawSpecs = String(getVal(['Thông số kỹ thuật', 'Thông số', 'Specs']) || '').trim();
          const specs: { [key: string]: string } = {};
          if (unit) {
            specs['Đơn vị'] = unit;
          }
          if (rawSpecs) {
            rawSpecs.split(';').forEach(pair => {
              const parts = pair.split(':');
              if (parts.length >= 2) {
                const key = parts[0].trim();
                const val = parts.slice(1).join(':').trim();
                if (key && val) {
                  specs[key] = val;
                }
              }
            });
          }

          return {
            id: sku,
            sku,
            name,
            category: 'Danh mục sản phẩm',
            group,
            price,
            image,
            description,
            unit: unit || undefined,
            specs,
            reviews: []
          };
        });

        // Post parsed products to server backend endpoint with robust fallback
        let result;
        try {
          const response = await fetch('/api/admin/products/import', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(parsedProducts)
          });

          if (response.ok) {
            const contentType = response.headers.get("content-type");
            if (contentType && contentType.includes("application/json")) {
              result = await response.json();
            } else {
              result = { fallbackToLocal: true };
            }
          } else {
            result = { fallbackToLocal: true };
          }
        } catch (fetchError) {
          console.warn("Server import endpoint failed, falling back to Local Storage client-side:", fetchError);
          result = { fallbackToLocal: true };
        }

        if (result && result.fallbackToLocal) {
          // Client-side local storage fallback
          const existingLocalStr = localStorage.getItem('local_products');
          let localProducts: Product[] = [];
          if (existingLocalStr) {
            try {
              localProducts = JSON.parse(existingLocalStr);
            } catch (e) {
              localProducts = [];
            }
          }

          let added = 0;
          let updated = 0;

          parsedProducts.forEach((newProd: Product) => {
            const skuRaw = newProd.sku !== undefined && newProd.sku !== null ? String(newProd.sku).trim() : "";
            if (!skuRaw) return;

            const idx = localProducts.findIndex(p => p.sku.trim().toLowerCase() === skuRaw.toLowerCase());
            if (idx !== -1) {
              localProducts[idx] = {
                ...localProducts[idx],
                ...newProd,
                sku: skuRaw,
                reviews: localProducts[idx].reviews || []
              };
              updated++;
            } else {
              localProducts.push({
                ...newProd,
                sku: skuRaw,
                id: newProd.id || `PROD-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`
              });
              added++;
            }
          });

          localStorage.setItem('local_products', JSON.stringify(localProducts));

          setIsImporting(false);
          setImportResult({
            success: true,
            message: `Nhập dữ liệu thành công! Hệ thống tự động lưu trữ an toàn ${parsedProducts.length} mặt hàng cục bộ trên trình duyệt thiết bị (thêm mới ${added}, cập nhật ${updated}).`,
            count: parsedProducts.length
          });

          if (onRefreshProducts) {
            onRefreshProducts();
          }
        } else if (result && result.success) {
          // Also mirror to local storage on success for extreme reliability
          const existingLocalStr = localStorage.getItem('local_products');
          let localProducts: Product[] = [];
          if (existingLocalStr) {
            try {
              localProducts = JSON.parse(existingLocalStr);
            } catch (e) { localProducts = []; }
          }
          parsedProducts.forEach((newProd: Product) => {
            const skuRaw = newProd.sku !== undefined && newProd.sku !== null ? String(newProd.sku).trim() : "";
            if (!skuRaw) return;
            const idx = localProducts.findIndex(p => p.sku.trim().toLowerCase() === skuRaw.toLowerCase());
            if (idx !== -1) {
              localProducts[idx] = { ...localProducts[idx], ...newProd, sku: skuRaw };
            } else {
              localProducts.push({
                ...newProd,
                sku: skuRaw,
                id: newProd.id || `PROD-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`
              });
            }
          });
          localStorage.setItem('local_products', JSON.stringify(localProducts));

          setIsImporting(false);
          setImportResult({
            success: true,
            message: result.message || `Nhập thành công ${parsedProducts.length} mặt hàng từ file Excel.`,
            count: parsedProducts.length
          });
          if (onRefreshProducts) {
            onRefreshProducts();
          }
        } else {
          setImportResult({
            success: false,
            message: result?.message || 'Có lỗi xảy ra khi nhập dữ liệu.'
          });
          setIsImporting(false);
        }

      } catch (error: any) {
        setIsImporting(false);
        setImportResult({
          success: false,
          message: error.message || 'Lỗi khi đọc file Excel. Vui lòng kiểm tra lại định dạng file.'
        });
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const downloadTemplate = () => {
    const template = [
      { 
        'Mã sản phẩm (SKU)': 'NS-001', 
        'Tên sản phẩm': 'Bét phun mưa xoay 360', 
        'Nhóm sản phẩm': 'Thiết bị tưới', 
        'Giá bán (VNĐ)': 15000, 
        'Đơn vị': 'cái',
        'Mô tả': 'Sản phẩm chất lượng cao, tiết kiệm nước.', 
        'Thông số kỹ thuật': 'Bán kính: 3m; Lưu lượng: 150l/h',
        'Link hình ảnh': 'https://example.com/image.jpg'
      }
    ];
    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "DanhSachMatHang");
    XLSX.writeFile(wb, "Mau_Nhap_Hang_NongNghiep.xlsx");
  };

  return (
    <div className="py-12 bg-slate-50 min-h-screen pt-24 pb-20">
      <div className="max-w-4xl mx-auto px-4 lg:px-8">
        <div className="flex items-center justify-between gap-2 mb-8">
          <button 
            onClick={onBack}
            className="flex items-center gap-2 text-slate-500 hover:text-brand-primary transition-colors font-bold"
          >
            <ArrowLeft size={20} /> Quay lại trang chủ
          </button>
          
          <button 
            onClick={onLogout}
            className="text-xs bg-red-50 text-red-600 px-3 py-1.5 rounded-lg font-bold hover:bg-red-100 transition-colors border border-red-100"
          >
            Đăng xuất
          </button>
        </div>

        <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-100">
          <div className="bg-brand-secondary p-8 text-white relative overflow-hidden">
             <div className="relative z-10">
                <h1 className="text-3xl font-bold font-sans not-italic mb-2">Bảng Điều Khiển Admin</h1>
                <p className="text-blue-100 opacity-80 uppercase tracking-widest text-xs font-bold">Quản lý kho hàng & Hệ thống</p>
             </div>
             <Database className="absolute -right-8 -bottom-8 text-white/10" size={200} />
          </div>

          <div className="p-8">
            <div className="flex border-b border-slate-100 mb-8 overflow-x-auto">
              <button 
                onClick={() => setActiveTab('orders')}
                className={`px-6 py-3 font-bold text-sm transition-all relative ${
                  activeTab === 'orders' ? 'text-brand-primary' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <span className="flex items-center gap-2">
                  <ShoppingBag size={18} /> Quản lý đơn hàng
                </span>
                {activeTab === 'orders' && <motion.div layoutId="tab-active" className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-primary" />}
              </button>
              <button 
                onClick={() => setActiveTab('import')}
                className={`px-6 py-3 font-bold text-sm transition-all relative ${
                  activeTab === 'import' ? 'text-brand-primary' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <span className="flex items-center gap-2">
                  <Upload size={18} /> Nhập hàng Excel
                </span>
                {activeTab === 'import' && <motion.div layoutId="tab-active" className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-primary" />}
              </button>
            </div>

            {activeTab === 'import' ? (
              <>
                <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2 not-italic font-sans">
                  <Upload size={24} className="text-brand-primary" /> Nhập hàng loạt từ Excel
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12 text-sm">
                    <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100">
                        <h3 className="font-bold text-blue-800 mb-2">Bước 1: Tải file mẫu</h3>
                        <p className="text-blue-600 mb-4 opacity-80">Vui lòng sử dụng file mẫu Excel đúng định dạng để hệ thống có thể nhận diện dữ liệu chính xác nhất.</p>
                        <button 
                          onClick={downloadTemplate}
                          className="flex items-center gap-2 text-brand-secondary font-bold hover:underline"
                        >
                          <FileText size={18} /> Tải file mẫu (.xlsx)
                        </button>
                    </div>
                    <div className="bg-orange-50 p-6 rounded-2xl border border-orange-100">
                        <h3 className="font-bold text-orange-800 mb-2">Bước 2: Tải lên dữ liệu</h3>
                        <p className="text-orange-600 mb-4 opacity-80">Sau khi điền đầy đủ thông tin vào file mẫu, hãy tải file lên đây để cập nhật vào hệ thống.</p>
                        <label className="inline-flex items-center gap-2 bg-brand-primary text-white px-6 py-2 rounded-xl font-bold cursor-pointer hover:bg-brand-primary/90 transition-all shadow-lg shadow-brand-primary/20">
                          <Upload size={18} /> Chọn file Excel
                          <input type="file" accept=".xlsx, .xls" className="hidden" onChange={handleFileUpload} />
                        </label>
                    </div>
                </div>

                {isImporting && (
                  <div className="flex flex-col items-center justify-center p-12 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-brand-primary border-t-transparent mb-4"></div>
                    <p className="font-bold text-slate-500">Đang xử lý dữ liệu... Vui lòng đợi trong giây lát</p>
                  </div>
                )}

                {importResult && !isImporting && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-6 rounded-2xl flex items-center gap-4 ${importResult.success ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}
                  >
                    {importResult.success ? <CheckCircle2 size={32} /> : <AlertCircle size={32} />}
                    <div>
                       <h4 className="font-bold text-lg">{importResult.success ? 'Thành công!' : 'Thất bại'}</h4>
                       <p className="opacity-80">{importResult.message}</p>
                    </div>
                  </motion.div>
                )}
              </>
            ) : (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2 not-italic font-sans">
                    <ShoppingBag size={24} className="text-brand-primary" /> Danh sách đơn hàng
                  </h2>
                  <button 
                    onClick={fetchOrders}
                    className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-brand-primary transition-all"
                    title="Làm mới"
                  >
                    <ArrowLeft className="rotate-90" size={18} />
                  </button>
                </div>

                {loadingOrders ? (
                  <div className="flex flex-col items-center justify-center py-20">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-brand-primary border-t-transparent mb-4"></div>
                    <p className="text-slate-400 font-medium">Đang tải danh sách đơn hàng...</p>
                  </div>
                ) : orders.length === 0 ? (
                  <div className="text-center py-20 bg-slate-50 rounded-3xl border border-slate-100">
                    <ShoppingBag size={48} className="mx-auto text-slate-200 mb-4" />
                    <p className="text-slate-500 font-bold">Chưa có đơn hàng nào</p>
                    <p className="text-slate-400 text-sm">Các đơn hàng mới sẽ xuất hiện ở đây khi khách hàng thanh toán.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-2xl border border-slate-100">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-100">
                          <th className="p-4 text-xs font-bold text-slate-500 uppercase">Mã đơn</th>
                          <th className="p-4 text-xs font-bold text-slate-500 uppercase">Khách hàng</th>
                          <th className="p-4 text-xs font-bold text-slate-500 uppercase">Ngày đặt</th>
                          <th className="p-4 text-xs font-bold text-slate-500 uppercase text-right">Tổng tiền</th>
                          <th className="p-4 text-xs font-bold text-slate-500 uppercase text-center">Trạng thái</th>
                          <th className="p-4 text-xs font-bold text-slate-500 uppercase text-center">Thao tác</th>
                        </tr>
                      </thead>
                      <tbody>
                        {orders.map((order) => (
                          <tr key={order.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                            <td className="p-4 font-mono text-[10px] font-bold text-slate-400">{order.id}</td>
                            <td className="p-4">
                              <div className="font-bold text-slate-800 text-sm">{order.customer.fullName}</div>
                              <div className="text-[10px] text-slate-400">{order.customer.phone}</div>
                            </td>
                            <td className="p-4">
                              <div className="text-xs text-slate-500">{new Date(order.createdAt).toLocaleDateString('vi-VN')}</div>
                              <div className="text-[10px] text-slate-400">{new Date(order.createdAt).toLocaleTimeString('vi-VN')}</div>
                            </td>
                            <td className="p-4 text-right">
                              <span className="font-black text-brand-primary">{order.total.toLocaleString('vi-VN')}₫</span>
                            </td>
                            <td className="p-4 text-center">
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-tighter ${
                                order.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                                order.status === 'completed' ? 'bg-green-100 text-green-700' :
                                'bg-slate-100 text-slate-600'
                              }`}>
                                {order.status === 'pending' ? 'Chờ xử lý' : 
                                 order.status === 'completed' ? 'Hoàn tất' : 'Đang xử lý'}
                              </span>
                            </td>
                            <td className="p-4 text-center">
                              <button 
                                onClick={() => setSelectedOrder(order)}
                                className="p-2 hover:bg-brand-primary/10 text-slate-400 hover:text-brand-primary transition-all rounded-lg"
                              >
                                <Eye size={18} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Order Detail Modal (Simple implementation) */}
            <AnimatePresence>
              {selectedOrder && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="bg-slate-50 p-6 border-b border-slate-100 flex items-center justify-between">
                       <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                         <ShoppingBag className="text-brand-primary" /> Chi tiết đơn hàng
                       </h2>
                       <button onClick={() => setSelectedOrder(null)} className="p-2 hover:bg-slate-200 rounded-full text-slate-400">
                         <Upload className="rotate-45" size={24} />
                       </button>
                    </div>
                    <div className="p-8 max-h-[70vh] overflow-y-auto">
                      <div className="grid grid-cols-2 gap-8 mb-8">
                        <div>
                          <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1">
                            <User size={12} /> Thông tin khách hàng
                          </h4>
                          <p className="font-bold text-slate-800">{selectedOrder.customer.fullName}</p>
                          <p className="text-sm text-slate-600 font-medium">{selectedOrder.customer.phone}</p>
                        </div>
                        <div>
                          <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1">
                            <MapPin size={12} /> Địa chỉ giao hàng
                          </h4>
                          <p className="text-sm text-slate-700 leading-relaxed font-medium">
                            {selectedOrder.customer.address}, {selectedOrder.customer.district}, {selectedOrder.customer.province}
                          </p>
                        </div>
                      </div>

                      <div className="mb-8 p-4 bg-blue-50/50 rounded-2xl border border-blue-100">
                        <div className="flex items-center justify-between mb-4">
                           <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                             <Calendar size={12} /> Ngày đặt: {new Date(selectedOrder.createdAt).toLocaleString('vi-VN')}
                           </h4>
                           <span className="text-[10px] font-bold text-slate-400 font-mono uppercase">ID: {selectedOrder.id}</span>
                        </div>
                        <div className="space-y-3">
                          {selectedOrder.items.map((item, idx) => (
                            <div key={idx} className="flex justify-between items-center text-sm pb-2 border-b border-blue-100/50 last:border-0 last:pb-0">
                               <div className="flex-1">
                                 <span className="font-bold text-slate-800">{item.name}</span>
                                 <span className="text-slate-400 ml-2">x{item.quantity}</span>
                               </div>
                               <span className="font-bold text-slate-600">{(item.price * item.quantity).toLocaleString('vi-VN')}₫</span>
                            </div>
                          ))}
                        </div>
                        <div className="mt-4 pt-4 border-t border-blue-200 flex justify-between items-center">
                           <span className="font-bold text-slate-500">Tổng cộng:</span>
                           <span className="text-xl font-black text-brand-primary">{selectedOrder.total.toLocaleString('vi-VN')}₫</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <button className="flex-1 py-3 bg-brand-primary text-white rounded-xl font-bold hover:bg-brand-secondary transition-all shadow-lg shadow-brand-primary/20">
                          Xử lý đơn hàng
                        </button>
                        <button onClick={() => setSelectedOrder(null)} className="px-6 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-all">
                          Đóng
                        </button>
                      </div>
                    </div>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>

            <div className="mt-12 pt-12 border-t border-slate-100">
               <h3 className="font-bold text-slate-800 mb-4 uppercase tracking-widest text-xs">Phân quyền của bạn</h3>
               <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                    <Database size={24} />
                  </div>
                  <div>
                    <div className="font-bold text-slate-900">Quản trị viên (Admin)</div>
                    <div className="text-xs text-slate-400">Tài khoản có toàn quyền truy cập & chỉnh sửa hệ thống.</div>
                  </div>
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
