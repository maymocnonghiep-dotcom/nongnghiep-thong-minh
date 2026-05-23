import React from 'react';
import { ShieldCheck, Truck, RotateCcw, BookOpen, UserCheck, ArrowLeft, PhoneCall } from 'lucide-react';

export type PolicyTab = 'mua-hang' | 'bao-hanh' | 'van-chuyen' | 'doi-tra' | 'dai-ly';

interface PolicyViewProps {
  activeTab: PolicyTab;
  onNavigate: (view: string) => void;
}

export default function PolicyView({ activeTab, onNavigate }: PolicyViewProps) {
  const tabs = [
    {
      id: 'mua-hang' as PolicyTab,
      label: 'Hướng dẫn mua hàng',
      icon: BookOpen,
      color: 'text-emerald-600 bg-emerald-50 border-emerald-100',
    },
    {
      id: 'bao-hanh' as PolicyTab,
      label: 'Chính sách bảo hành',
      icon: ShieldCheck,
      color: 'text-blue-600 bg-blue-50 border-blue-100',
    },
    {
      id: 'van-chuyen' as PolicyTab,
      label: 'Chính sách vận chuyển',
      icon: Truck,
      color: 'text-amber-600 bg-amber-50 border-amber-100',
    },
    {
      id: 'doi-tra' as PolicyTab,
      label: 'Chính sách đổi trả',
      icon: RotateCcw,
      color: 'text-rose-600 bg-rose-50 border-rose-100',
    },
    {
      id: 'dai-ly' as PolicyTab,
      label: 'Chính sách đại lý',
      icon: UserCheck,
      color: 'text-indigo-600 bg-indigo-50 border-indigo-100',
    },
  ];

  const handleTabChange = (tabId: PolicyTab) => {
    let path = '/chinh-sach/huong-dan-mua-hang';
    if (tabId === 'bao-hanh') path = '/chinh-sach/bao-hanh';
    else if (tabId === 'van-chuyen') path = '/chinh-sach/van-chuyen';
    else if (tabId === 'doi-tra') path = '/chinh-sach/doi-tra-hoan-tien';
    else if (tabId === 'dai-ly') path = '/chinh-sach/dai-ly';

    window.history.pushState(null, '', path);
    window.dispatchEvent(new Event('popstate'));
  };

  return (
    <div className="pt-24 min-h-screen bg-slate-50 py-12">
      <div className="max-w-7xl mx-auto px-4 lg:px-8">
        {/* Back Button */}
        <button
          onClick={() => onNavigate('home')}
          className="flex items-center gap-2 text-slate-500 hover:text-brand-primary mb-8 font-bold text-sm transition-colors cursor-pointer"
        >
          <ArrowLeft size={16} /> Quay lại trang chủ
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Tabs */}
          <div className="lg:col-span-1 space-y-2">
            <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest px-4 mb-4">
              Danh mục hỗ trợ
            </h2>
            <div className="bg-white rounded-2xl border border-slate-200/60 p-2 space-y-1 shadow-sm">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => handleTabChange(tab.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all cursor-pointer text-left ${
                      isActive
                        ? 'bg-brand-primary text-white shadow-md shadow-green-600/10'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    <Icon size={18} className={isActive ? 'text-white' : 'text-slate-400'} />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Support Widget */}
            <div className="bg-emerald-50 rounded-2xl border border-emerald-100/80 p-5 shadow-sm">
              <PhoneCall className="text-emerald-600 mb-3" size={24} />
              <h4 className="font-extrabold text-slate-800 text-sm mb-1">Cần hỗ trợ trực tiếp?</h4>
              <p className="text-xs text-slate-500 mb-4 leading-relaxed">
                Đội ngũ chăm sóc khách hàng của chúng tôi luôn sẵn sàng hỗ trợ quý khách chi tiết và nhanh chóng nhất.
              </p>
              <a
                href="tel:0706583888"
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-sm"
              >
                Hotline: 0706.583.888
              </a>
            </div>
          </div>

          {/* Content Pane */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-3xl border border-slate-200/60 p-8 lg:p-10 shadow-sm min-h-[500px] flex flex-col justify-between">
              {/* Header inside pane */}
              <div>
                <div className="border-b border-slate-100 pb-6 mb-8">
                  <span className="text-xs font-black text-brand-primary uppercase tracking-widest block mb-2">
                    Chính sách và hướng dẫn
                  </span>
                  <h1 className="text-2xl lg:text-3xl font-black text-slate-800 tracking-tight">
                    {tabs.find((t) => t.id === activeTab)?.label}
                  </h1>
                </div>

                {/* Content based on tab */}
                <div className="prose prose-slate max-w-none text-slate-650 leading-relaxed text-sm space-y-6">
                  {activeTab === 'mua-hang' && (
                    <div className="space-y-6">
                      <p className="font-medium text-slate-600">
                        Chào mừng quý khách đến với Máy Móc Nông Nghiệp Thắng Lợi. Để quá trình mua sắm của quý khách diễn ra thuận lợi, nhanh gọn và an toàn nhất, chúng tôi xin cung cấp các bước hướng dẫn mua hàng chi tiết dưới đây:
                      </p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-6">
                        <div className="p-5 rounded-2xl border border-emerald-100/80 bg-emerald-50/20">
                          <span className="inline-block bg-emerald-100 text-emerald-800 text-xs font-black px-2.5 py-1 rounded-md mb-3">Bước 1</span>
                          <h4 className="font-extrabold text-slate-800 text-base mb-2">Lựa chọn sản phẩm</h4>
                          <p className="text-xs text-slate-500 leading-relaxed">
                            Quý khách tìm kiếm sản phẩm trong các danh mục, xem mô tả chi tiết, hình ảnh sắc nét và nhấn <strong>&quot;Thêm vào giỏ hàng&quot;</strong>.
                          </p>
                        </div>
                        <div className="p-5 rounded-2xl border border-blue-100/80 bg-blue-50/20">
                          <span className="inline-block bg-blue-100 text-blue-800 text-xs font-black px-2.5 py-1 rounded-md mb-3">Bước 2</span>
                          <h4 className="font-extrabold text-slate-800 text-base mb-2">Kiểm tra giỏ hàng</h4>
                          <p className="text-xs text-slate-500 leading-relaxed">
                            Nhấp vào biểu tượng giỏ hàng ở thanh tiêu đề, kiểm tra kỹ lại danh mục sản phẩm và số lượng sản phẩm mình đã chọn đặt mua.
                          </p>
                        </div>
                        <div className="p-5 rounded-2xl border border-amber-100/80 bg-amber-50/20">
                          <span className="inline-block bg-amber-100 text-amber-800 text-xs font-black px-2.5 py-1 rounded-md mb-3">Bước 3</span>
                          <h4 className="font-extrabold text-slate-800 text-base mb-2">Thanh toán & Điền thông tin</h4>
                          <p className="text-xs text-slate-500 leading-relaxed">
                            Bấm nút thanh toán, sau đó nhập đầy đủ, chính xác địa chỉ nhận hàng cùng số điện thoại liên lạc để nhân viên dễ dàng giao hàng.
                          </p>
                        </div>
                        <div className="p-5 rounded-2xl border border-rose-100/80 bg-rose-50/20">
                          <span className="inline-block bg-rose-100 text-rose-800 text-xs font-black px-2.5 py-1 rounded-md mb-3">Bước 4</span>
                          <h4 className="font-extrabold text-slate-800 text-base mb-2">Hoàn tất đặt hàng</h4>
                          <p className="text-xs text-slate-500 leading-relaxed">
                            Hệ thống sẽ ghi nhận thông tin đặt hàng của quý khách thành công. Nhân viên cửa hàng sẽ liên hệ xác nhận lại qua điện thoại.
                          </p>
                        </div>
                      </div>

                      <div className="p-5 rounded-2xl bg-red-50/40 border border-red-100/80 text-xs text-slate-650 leading-relaxed">
                        <span className="font-extrabold text-red-650 uppercase">Lưu ý quan trọng:</span> Quý khách có thể liên hệ trực tiếp hotline/zalo: <a href="tel:0706583888" className="text-emerald-700 font-extrabold hover:underline">0706.583.888</a> để được hỗ trợ hướng dẫn mua hàng nhanh hơn và nhận báo giá số lượng lớn miễn phí.
                      </div>
                    </div>
                  )}

                  {activeTab === 'bao-hanh' && (
                    <div className="space-y-6">
                      <p className="font-medium text-slate-600">
                        Chúng tôi hiểu rằng chất lượng thiết bị nông nghiệp và đồ điện là yếu tố cực kỳ quan trọng đối với hoạt động trồng trọt, sản xuất. Do đó, tất cả các sản phẩm được phân phối bởi Thắng Lợi đều được áp dụng chế độ bảo hành chuyên nghiệp.
                      </p>

                      <div className="space-y-4">
                        <div className="border-l-4 border-emerald-500 pl-4 py-1">
                          <h4 className="font-extrabold text-slate-800 text-base mb-1">Thời hạn bảo hành lâu dài</h4>
                          <p className="text-xs text-slate-500">
                            Các sản phẩm thiết bị tưới, máy bơm, hệ thống điều khiển thông minh và đèn năng lượng mặt trời thông thường được bảo hành chính hãng từ <strong>12 tháng</strong> đến <strong>24 tháng</strong> kể từ ngày mua.
                          </p>
                        </div>

                        <div className="border-l-4 border-emerald-500 pl-4 py-1">
                          <h4 className="font-extrabold text-slate-800 text-base mb-1">Điều kiện được bảo hành miễn phí</h4>
                          <p className="text-xs text-slate-500">
                            Sản phẩm phát sinh hư hỏng hoặc lỗi kỹ thuật do lỗi của nhà sản xuất, còn nguyên tem bảo hành, không có dấu hiệu bị tháo dỡ tự ý hay chập cháy do sử dụng sai nguồn điện quy định.
                          </p>
                        </div>

                        <div className="border-l-4 border-emerald-500 pl-4 py-1">
                          <h4 className="font-extrabold text-slate-800 text-base mb-1">Trường hợp không áp dụng bảo hành</h4>
                          <p className="text-xs text-slate-500">
                            Hư hỏng do các tác nhân bên ngoài như thiên tai, rơi vỡ, ngập nước (đối với dòng không chống nước), sử dụng sai quy cách trong hướng dẫn của nhà sản xuất hoặc tem bảo hành đã bị rách, tẩy xóa.
                          </p>
                        </div>
                      </div>

                      <div className="p-5 rounded-2xl bg-emerald-50/40 border border-emerald-100/80 text-xs text-slate-650">
                        Quý khách vui lòng lưu lại hóa đơn bán hàng hoặc liên hệ trực tiếp qua hotline/zalo: <a href="tel:0706583888" className="text-emerald-700 font-extrabold hover:underline">0706.583.888</a> để được tra cứu lịch sử mua hàng số điện thoại & hỗ trợ bảo hành nhanh nhất.
                      </div>
                    </div>
                  )}

                  {activeTab === 'van-chuyen' && (
                    <div className="space-y-6">
                      <p className="font-medium text-slate-600">
                        Để những đơn vị thiết bị tưới mát, linh kiện phụ kiện hay dụng cụ làm vườn đến tay bà con nhanh nhất, chúng tôi cộng tác cùng những đơn vị vận chuyển hàng đầu quốc gia và thiết lập quy định giao hàng cực kỳ minh bạch:
                      </p>

                      <div className="space-y-4">
                        <div className="border-l-4 border-yellow-500 pl-4 py-1">
                          <h4 className="font-extrabold text-slate-800 text-base mb-1">Phạm vi giao hàng</h4>
                          <p className="text-xs text-slate-500">
                            Giao hàng tận nhà tới toàn bộ 63 tỉnh thành cả nước. Đặc biệt hỗ trợ vận chuyển hỏa tốc tại khu vực các tỉnh miền Tây Nam Bộ qua chành xe nhanh như Tô Châu, Phương Trang,...
                          </p>
                        </div>

                        <div className="border-l-4 border-yellow-500 pl-4 py-1">
                          <h4 className="font-extrabold text-slate-800 text-base mb-1">Thời gian nhận hàng dự kiến</h4>
                          <p className="text-xs text-slate-500">
                            Các tỉnh thành miền Tây từ 1 - 2 ngày làm việc. Khu vực miền Trung và miền Bắc từ 3 - 5 ngày làm việc tùy thuộc đơn vị chuyển phát nhanh.
                          </p>
                        </div>

                        <div className="border-l-4 border-yellow-500 pl-4 py-1">
                          <h4 className="font-extrabold text-slate-800 text-base mb-1">Hình thức thanh toán</h4>
                          <p className="text-xs text-slate-500">
                            Hỗ trợ thanh toán khi nhận hàng (COD) cực kỳ an toàn cho bà con, hoặc chuyển khoản ngân hàng nhanh. Bà con có quyền đồng kiểm, kiểm tra hàng đầy đủ số lượng và thông số sản phẩm trước khi thanh toán.
                          </p>
                        </div>
                      </div>

                      <div className="p-5 rounded-2xl bg-amber-50/35 border border-amber-100/80 text-xs text-slate-650">
                        Mọi thắc mắc về thất lạc đơn hàng hoặc cần vận chuyển gấp qua xe khách, quý khách vui lòng liên hệ trực tiếp hotline/zalo điều phối viên: <a href="tel:0706583888" className="text-amber-700 font-extrabold hover:underline">0706.583.888</a>.
                      </div>
                    </div>
                  )}

                  {activeTab === 'doi-tra' && (
                    <div className="space-y-6">
                      <p className="font-medium text-slate-600">
                        Trải nghiệm mua sắm hài lòng của khách hàng là mục tiêu cao nhất của chúng tôi. Nếu sản phẩm nhận được không đúng cam kết hoặc móp méo lỗi, chính sách đổi trả mở rộng sẽ bảo vệ quyền lợi quý khách tốt nhất:
                      </p>

                      <div className="space-y-4">
                        <div className="border-l-4 border-rose-500 pl-4 py-1">
                          <h4 className="font-extrabold text-slate-800 text-base mb-1">Thời gian hỗ trợ đổi đổi mới</h4>
                          <p className="text-xs text-slate-500">
                            Hỗ trợ đổi mới hoàn toàn 1-đổi-1 trong vòng <strong>7 ngày</strong> kể từ khi quý khách nhận hàng thành công nếu lỗi phát sinh từ nhà sản xuất hoặc sai lệch mẫu mã đặt mua.
                          </p>
                        </div>

                        <div className="border-l-4 border-rose-500 pl-4 py-1">
                          <h4 className="font-extrabold text-slate-800 text-base mb-1">Yêu cầu trạng thái sản phẩm</h4>
                          <p className="text-xs text-slate-500">
                            Sản phẩm khi đổi trả cần được giữ nguyên bao bì hộp của nhà sản xuất, đầy đủ các phụ kiện linh kiện đi kèm và hóa đơn mua bán tại cửa hàng Thắng Lợi.
                          </p>
                        </div>

                        <div className="border-l-4 border-rose-500 pl-4 py-1">
                          <h4 className="font-extrabold text-slate-800 text-base mb-1">Quy định chi phí vận chuyển phát sinh</h4>
                          <p className="text-xs text-slate-500">
                            Nếu lỗi từ phía chúng tôi (giao sai mẫu mã, sản phẩm không đúng cấu hình miêu tả, hàng bị vỡ hỏng trong lúc vận chuyển), toàn bộ chi phí vận chuyển đổi trả sẽ do cửa hàng Thắng Lợi chi trả 100%.
                          </p>
                        </div>
                      </div>

                      <div className="p-5 rounded-2xl bg-rose-50/40 border border-rose-100/80 text-xs text-slate-650">
                        Để phản hồi dịch vụ đổi trả gấp, quý khách vui lòng gửi ảnh chụp sản phẩm hoặc video khui hàng lỗi tới zalo số: <a href="tel:0706583888" className="text-rose-700 font-extrabold hover:underline">0706.583.888</a> để xử lý nhanh nhất.
                      </div>
                    </div>
                  )}

                  {activeTab === 'dai-ly' && (
                    <div className="space-y-6">
                      <p className="font-medium text-slate-600">
                        Thắng Lợi hân hạnh đồng hành cùng hàng trăm cửa hàng vật tư xây dựng, kim khí, đồ điện cơ khắp đồng bằng Sông Cửu Long. Chúng tôi hướng tới mối quan hệ hợp tác lâu dài dựa trên sự am hiểu kỹ thuật và lòng tin cậy:
                      </p>

                      <div className="space-y-4">
                        <div className="border-l-4 border-indigo-500 pl-4 py-1">
                          <h4 className="font-extrabold text-slate-800 text-base mb-1">Chiết khấu vô cùng hấp dẫn</h4>
                          <p className="text-xs text-slate-500">
                            Chiết khấu cao đặc biệt trực tiếp theo hóa đơn cho các đại lý vật tư nông nghiệp, béc tưới tự động, cuộn ống LDPE và camera an ninh lắp đặt ngoài trời.
                          </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 pl-4 py-1">
                          <h4 className="font-extrabold text-slate-800 text-base mb-1">Hỗ trợ kỹ thuật thực chiến</h4>
                          <p className="text-xs text-slate-500">
                            Chúng tôi luôn sẵn sàng hỗ trợ tư vấn thiết kế, gửi bản vẽ sơ đồ lắp ráp hệ thống tưới bù áp phù hợp diện tích vườn rẫy, giúp đại lý tư vấn thành công hỗ trợ cho bà con yên tâm lắp đặt hiệu quả.
                          </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 pl-4 py-1">
                          <h4 className="font-extrabold text-slate-800 text-base mb-1">Cung cấp tài liệu miễn phí</h4>
                          <p className="text-xs text-slate-500">
                            Đại lý được hỗ trợ hình ảnh sản phẩm sắc nét, video demo hoạt động béc tưới, thông tin chi tiết cấu hình nâng cao để dễ dàng đăng bán hàng online hoặc offline độc quyền.
                          </p>
                        </div>
                      </div>

                      <div className="p-5 rounded-2xl bg-indigo-50/40 border border-indigo-100/80 text-xs text-slate-650">
                        Vui lòng gọi hotline hoặc gửi trực tiếp danh mục yêu cầu báo giá đại lý sỉ vào Zalo giám đốc phân phối: <a href="tel:0706583888" className="text-indigo-700 font-extrabold hover:underline">0706.583.888</a> để thiết lập cuộc hẹn hợp tác cụ thể.
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Bottom Footer Notice */}
              <div className="mt-12 pt-6 border-t border-slate-150 text-center text-xs text-slate-400">
                Hãy cùng Thắng Lợi đổi mới nông nghiệp thực chiến, nâng cao giá trị kỹ thuật và năng suất lao động!
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
