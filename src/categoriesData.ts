export interface Subcategory {
  id: string;
  name: string;
  keywords: string[];
}

export const subcategoriesMap: Record<string, Subcategory[]> = {
  'Thiết bị tưới': [
    { id: 'bec-phun', name: 'Béc & Phun mưa, Phun sương', keywords: ['bét', 'béc', 'phun', 'sương', 'màn sương'] },
    { id: 'tuoi-nho-giot', name: 'Tưới nhỏ giọt & Bù áp', keywords: ['nhỏ giọt', 'bù áp'] },
    { id: 'day-tuoi-ong', name: 'Dây tưới & Ống dẫn', keywords: ['dây tưới dẹt', 'ống dẫn', 'dây tưới', 'ống ldpe'] },
    { id: 'hen-gio-van', name: 'Hẹn giờ & Van tự động', keywords: ['hẹn giờ', 'van', 'lọc rác', 'châm phân'] },
    { id: 'phu-kien-ong', name: 'Phụ kiện kết nối ống', keywords: ['nối thẳng', 'que cắm', 'phụ kiện kết nối', 'ldpe'] },
  ],
  'Đồ điện': [
    { id: 'may-bom', name: 'Máy bơm nước', keywords: ['bơm'] },
    { id: 'tu-dien-bao-ve', name: 'Tủ điện & Thiết bị bảo vệ', keywords: ['tủ điện', 'bảo vệ', 'contactor', 'aptomat', 'rơ le', 'cầu dao', 'ổ cắm', 'quá tải', 'chống giật', 'mcb'] },
    { id: 'hen-gio-dieu-khien', name: 'Hẹn giờ & Điều khiển', keywords: ['hẹn giờ', 'điều khiển', 'timer', 'cảm biến', 'plc', 'iot'] },
    { id: 'cap-dien-den', name: 'Cáp điện & Đèn chiếu sáng', keywords: ['cáp', 'led', 'đèn', 'dây cáp'] },
    { id: 'thong-gio-khac', name: 'Thông gió & Khác', keywords: ['thông gió', 'biến tần'] },
  ],
  'Vật tư nước': [
    { id: 'ong-nuoc', name: 'Ống nước PVC & HDPE', keywords: ['ống nhựa pvc', 'ống hdpe', 'ống luồn'] },
    { id: 'khoa-van-nuoc', name: 'Khóa nước & Van nước', keywords: ['van', 'khóa water'] },
    { id: 'phu-kien-co-te', name: 'Phụ kiện co, Tê, Nối', keywords: ['co 90', 'tê chia 3', 'măng sông', 'nối trơn', 'rắc co', 'chuyển đổi', 'đầu lớn'] },
    { id: 'bang-tan-keo', name: 'Băng tan & Keo dán', keywords: ['keo dán', 'băng tan', 'chống rò rỉ'] },
    { id: 'bon-chua-phu-kien', name: 'Bồn chứa & Phụ kiện máy bơm', keywords: ['bồn chứa', 'chõ bơm', 'rọ hút'] },
  ],
  'Dụng cụ làm vườn': [
    { id: 'keo-dao-ghep', name: 'Kéo cắt tỉa & Dao ghép cành', keywords: ['kéo', 'dao', 'ghép', 'cưa'] },
    { id: 'cuoc-xeng-cao', name: 'Cuốc, Xẻng & Cào đất', keywords: ['cuốc', 'xẻng', 'bay', 'cào'] },
    { id: 'may-cat-binh-phun', name: 'Máy cắt cỏ & Bình phun pin', keywords: ['máy cắt', 'bình phun', 'pin 18v'] },
    { id: 'sot-xe-day-luoi', name: 'Sọt nhựa, Xe đẩy & Lưới che', keywords: ['rổ', 'sọt', 'xe rùa', 'thùng', 'xe đẩy', 'lưới', 'nhựa', 'khay ươm', 'độ che'] },
  ],
  'Camera An Ninh': [
    { id: 'imou', name: 'Camera IMOU', keywords: ['imou'] },
    { id: 'ezviz', name: 'Camera EZVIZ', keywords: ['ezviz'] },
    { id: 'yoosee', name: 'Camera Yoosee', keywords: ['yoosee'] },
    { id: 'solar', name: 'Camera Năng Lượng Mặt Trời', keywords: ['năng lượng mặt trời', 'solar', 'giám sát năng lượng'] },
    { id: '4g', name: 'Camera Dùng SIM 4G', keywords: ['4g'] },
  ],
  'Đèn năng lượng mặt trời': [
    { id: 'trong-nha', name: 'Đèn trong nhà', keywords: ['trong nhà'] },
    { id: 'pha', name: 'Đèn pha', keywords: ['pha'] },
    { id: 'ban-chai', name: 'Đèn bàn chải', keywords: ['bàn chải'] },
    { id: 'lien-the', name: 'Đèn liền thể', keywords: ['liền thể'] },
    { id: 'phu-kien-linh-kien', name: 'Linh kiện phụ kiện', keywords: ['phụ kiện'] },
    { id: 'quat-nang-luong', name: 'Quạt năng lượng', keywords: ['quat', 'quạt'] },
  ],
};

export const getMatchedSubcategory = (productName: string, subcategories: Subcategory[]): string | null => {
  const nameLower = productName.toLowerCase();
  for (const sub of subcategories) {
    if (sub.keywords.some(kw => nameLower.includes(kw.toLowerCase()))) {
      return sub.id;
    }
  }
  return null;
};

export const matchesSubcategoryPattern = (productName: string, productDesc: string, subId: string, subcategories: Subcategory[]): boolean => {
  if (subId === 'all') return true;
  
  const sub = subcategories.find(s => s.id === subId);
  if (!sub) return false;

  const nameLower = productName?.toLowerCase() || '';
  const descLower = productDesc?.toLowerCase() || '';

  return sub.keywords.some(kw => nameLower.includes(kw.toLowerCase()) || descLower.includes(kw.toLowerCase()));
};
