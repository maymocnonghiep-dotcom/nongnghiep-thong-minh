import { Search, ShoppingCart, User, Menu, Phone, Mail, ChevronDown, ArrowRight, Droplets, Zap, Wrench, Pipette as Pipe, Camera, Sun, Layers, Battery } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useState } from 'react';
import { Product } from '../types';
import { getHighResImageUrl } from '../utils';
import { subcategoriesMap } from '../categoriesData';
import Link from './Link';
import logoImage from '../assets/images/robot_plant_logo_1779866135143.png';

interface HeaderProps {
  onNavigate: (view: string) => void;
  currentView: string;
  cartCount: number;
  onCartOpen: () => void;
  products: Product[];
  onProductClick: (product: Product) => void;
}

export default function Header({ onNavigate, currentView, cartCount, onCartOpen, products, onProductClick }: HeaderProps) {
  const [showHotlineAlert, setShowHotlineAlert] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>('Thiết bị tưới');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);

  const searchResults = searchQuery.trim().length > 0
    ? products.filter(p => 
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.manufacturerCode && p.manufacturerCode.toLowerCase().includes(searchQuery.toLowerCase()))
      ).slice(0, 6)
    : [];

  const menuItems = [
    { label: 'Danh mục sản phẩm', value: 'categories', to: '/danh-muc', hasDropdown: true },
    { label: 'Chương trình khuyến mãi', value: 'promotions', to: '/khuyen-mai' },
    { label: 'Khách hàng & Đối tác', value: 'customers', to: '/khach-hang' },
    { label: 'Dịch vụ', value: 'services', to: '/dich-vu' },
    { label: 'Tin tức', value: 'news', to: '/tin-tuc' },
  ];

  const categories = [
    { name: 'Thiết bị tưới', icon: Droplets },
    { name: 'Đồ điện', icon: Zap },
    { name: 'Vật tư nước', icon: Pipe },
    { name: 'Dụng cụ làm vườn', icon: Wrench },
    { name: 'Camera An Ninh', icon: Camera },
    { name: 'Đèn năng lượng mặt trời', icon: Sun },
    { name: 'Pin lithium & Linh kiện Pin lithium', icon: Battery },
    { name: 'Danh mục khác', icon: Layers }
  ];

  const getProductsByActiveCategory = () => {
    if (activeCategory === 'Danh mục khác') {
      const definedGroups = [
        'Thiết bị tưới',
        'Đồ điện',
        'Vật tư nước',
        'Dụng cụ làm vườn',
        'Camera An Ninh',
        'Đèn năng lượng mặt trời',
        'Pin lithium & Linh kiện Pin lithium',
      ];
      return products.filter(p => {
        const notInMain = !p.group || p.group === 'Danh mục khác' || !definedGroups.includes(p.group);
        const noSubcategory = !p.subcategoryId || p.subcategoryId.trim() === '';
        return notInMain || noSubcategory;
      }).slice(0, 10);
    }
    return products.filter(p => p.group === activeCategory).slice(0, 10);
  };

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-slate-200">
      {/* Top Bar */}
      <div className="bg-brand-primary text-white py-1 px-4 lg:px-8 hidden md:block">
        <div className="max-w-7xl mx-auto flex justify-between text-xs font-medium tracking-wide">
          <div className="flex gap-6">
            <span className="flex items-center gap-2">
              <Phone size={14} /> 0706.583.888
            </span>
            <span className="flex items-center gap-2 uppercase tracking-widest">
              <Mail size={14} /> maymocnonghiep@gmail.com
            </span>
          </div>
          <div className="flex gap-4">
            <div className="relative">
              <button 
                onClick={() => setShowHotlineAlert(!showHotlineAlert)}
                className="hover:text-white/80 transition-colors font-bold flex items-center gap-1"
              >
                Hỗ trợ 24/7
              </button>
              {showHotlineAlert && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowHotlineAlert(false)} />
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute right-0 mt-2 w-72 bg-white text-slate-800 rounded-2xl shadow-2xl border border-slate-100 p-4 z-50 text-left"
                  >
                    <div className="flex items-center gap-3 mb-3 border-b border-slate-100 pb-2">
                      <div className="p-2 bg-brand-primary/10 text-brand-primary rounded-xl">
                        <Phone size={18} />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-slate-800">Hỗ trợ đặt hàng 24/7</h4>
                        <p className="text-[10px] text-slate-400">Tư vấn kỹ thuật hoàn toàn miễn phí</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <a href="tel:0706583888" className="flex items-center justify-between p-2.5 bg-slate-50 hover:bg-brand-primary/5 rounded-xl transition-all group border border-slate-100/50">
                        <div>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Hotline chính</p>
                          <p className="text-sm font-black text-brand-primary group-hover:text-brand-primary transition-colors">0706.583.888</p>
                        </div>
                        <span className="text-xs font-bold text-brand-accent bg-brand-accent/10 px-2.5 py-1 rounded-full shrink-0">Gọi ngay</span>
                      </a>
                    </div>
                  </motion.div>
                </>
              )}
            </div>
            <Link to="/chinh-sach/dai-ly" className="hover:text-white/80 transition-colors">Chính sách đại lý</Link>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <div className="max-w-7xl mx-auto px-4 lg:px-8 py-4 flex items-center justify-between gap-4">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <Menu 
            className="md:hidden cursor-pointer" 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          />
          <button 
            onClick={() => onNavigate('home')}
            className="flex items-center gap-2.5 hover:opacity-100 transition-all p-1.5 md:p-2 rounded-2xl group text-left active:scale-[0.98] cursor-pointer"
          >
            <div className="relative flex items-center justify-center w-14 h-14 md:w-18 md:h-18 rounded-xl bg-transparent group-hover:scale-105 transition-all overflow-hidden flex-shrink-0">
              <img src={logoImage} alt="Logo" className="w-full h-full object-contain mix-blend-multiply" referrerPolicy="no-referrer" />
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-base md:text-xl font-black text-brand-primary tracking-tight font-sans">
                NÔNG CỤ <span className="text-brand-secondary">THÔNG MINH</span>
              </span>
              <span className="text-[9px] md:text-[10px] uppercase tracking-[0.2em] font-extrabold text-slate-400 group-hover:text-brand-primary transition-colors mt-0.5 hidden sm:block">
                NHẸ HƠN - THÔNG MINH HƠN - HIỆU QUẢ HƠN
              </span>
            </div>
          </button>
        </div>

        {/* Search Bar */}
        <div className="hidden md:flex flex-1 max-w-xl mx-8 relative">
          <div className="relative w-full">
            <input 
              type="text" 
              placeholder="Tìm kiếm theo tên, mã SKU..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowSearchResults(true);
              }}
              onFocus={() => setShowSearchResults(true)}
              className="w-full bg-slate-100 border-none rounded-full py-2 px-6 focus:ring-2 focus:ring-brand-primary outline-none transition-all pr-12"
            />
            <button className="absolute right-1 top-1 bg-brand-primary text-white p-1.5 rounded-full hover:bg-brand-primary/90 transition-colors">
              <Search size={18} />
            </button>
          </div>

          {/* Live Search Dropdown */}
          <AnimatePresence>
            {showSearchResults && searchQuery.trim().length > 0 && (
              <>
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden z-[60]"
                >
                  {searchResults.length > 0 ? (
                    <div className="p-2">
                      <div className="p-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-50">
                        Kết quả tìm kiếm
                      </div>
                      {searchResults.map(product => (
                        <button
                          key={product.id}
                          onClick={() => {
                            onProductClick(product);
                            setSearchQuery('');
                            setShowSearchResults(false);
                          }}
                          className="w-full flex items-center gap-4 p-3 hover:bg-slate-50 transition-colors rounded-xl text-left group/res"
                        >
                          <div className="w-12 h-12 rounded-lg overflow-hidden border border-slate-100 bg-slate-50">
                            <img src={getHighResImageUrl(product.image)} alt={product.name} className="w-full h-full object-cover" />
                          </div>
                          <div className="flex-1 overflow-hidden">
                            <h4 className="text-sm font-bold text-slate-800 truncate group-hover/res:text-brand-primary transition-colors">{product.name}</h4>
                            <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                              <span className="text-[10px] font-mono font-bold text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100">SKU: {product.sku}</span>
                              {/* Manufacturer code hidden as requested */}
                              <span className="text-xs font-bold text-brand-primary ml-1">{product.price.toLocaleString('vi-VN')}₫</span>
                            </div>
                          </div>
                          <ArrowRight size={16} className="text-slate-300 group-hover/res:text-brand-primary group-hover/res:translate-x-1 transition-all" />
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="p-8 text-center">
                      <p className="text-slate-400 text-sm font-medium">Không tìm thấy sản phẩm phù hợp</p>
                    </div>
                  )}
                </motion.div>
                <div 
                  className="fixed inset-0 z-[55]" 
                  onClick={() => setShowSearchResults(false)}
                />
              </>
            )}
          </AnimatePresence>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 md:gap-5">
          <div className="flex flex-col items-end mr-4 hidden lg:flex">
             <span className="text-xs text-slate-500">Gọi mua hàng</span>
             <span className="font-bold text-brand-accent">0706.583.888</span>
          </div>
          <button 
            onClick={onCartOpen}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors relative"
          >
            <ShoppingCart size={24} />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-brand-accent text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-bold">
                {cartCount}
              </span>
            )}
          </button>
          <button className="p-2 hover:bg-slate-100 rounded-full transition-colors hidden sm:block">
            <User size={24} />
          </button>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="border-t border-slate-100 hidden md:block">
        <div className="max-w-7xl mx-auto px-8">
          <ul className="flex gap-8">
            {menuItems.map((item) => (
              <li 
                key={item.value} 
                className="relative"
                onMouseEnter={() => item.hasDropdown && setIsDropdownOpen(true)}
                onMouseLeave={() => item.hasDropdown && setIsDropdownOpen(false)}
              >
                <Link 
                  to={item.to}
                  onClick={() => {
                    if (item.hasDropdown) setIsDropdownOpen(false);
                  }}
                  className={`flex items-center gap-1 py-4 text-sm font-bold uppercase transition-colors border-b-2 ${
                    currentView === item.value || (item.hasDropdown && currentView.startsWith('category-'))
                      ? 'text-brand-primary border-brand-primary' 
                      : 'text-slate-700 border-transparent hover:text-brand-primary'
                  }`}
                >
                  {item.label}
                  {item.hasDropdown && <ChevronDown size={14} className={`transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />}
                </Link>

                {/* Mega Menu Dropdown */}
                {item.hasDropdown && (
                  <AnimatePresence>
                    {isDropdownOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute top-full -left-20 w-[800px] bg-white shadow-2xl border border-slate-100 rounded-b-3xl z-50 p-6 flex gap-8"
                        onMouseEnter={() => setIsDropdownOpen(true)}
                        onMouseLeave={() => setIsDropdownOpen(false)}
                      >
                        {/* Sidebar Categories */}
                        <div className="w-1/3 border-r border-slate-50 pr-4">
                          <h4 className="text-[10px] uppercase tracking-widest font-bold text-slate-400 mb-4 px-2">Nhóm sản phẩm</h4>
                          <div className="flex flex-col gap-1">
                            {categories.map((cat) => (
                              <button
                                key={cat.name}
                                onMouseEnter={() => setActiveCategory(cat.name)}
                                onClick={() => {
                                  onNavigate(`category-${cat.name}`);
                                  setIsDropdownOpen(false);
                                }}
                                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                                  activeCategory === cat.name 
                                    ? 'bg-brand-primary/5 text-brand-primary' 
                                    : 'text-slate-600 hover:bg-slate-50'
                                }`}
                              >
                                <div className="flex items-center gap-3">
                                  <cat.icon size={18} />
                                  {cat.name}
                                </div>
                                <ArrowRight size={14} className={`transition-transform ${activeCategory === cat.name ? 'translate-x-0 opacity-100' : '-translate-x-2 opacity-0'}`} />
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Products Preview Grid */}
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-6">
                            <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                               {activeCategory}
                               <span className="text-[10px] bg-brand-accent/10 text-brand-accent px-2 py-0.5 rounded-full uppercase tracking-tighter">Hot</span>
                            </h4>
                            <button 
                              onClick={() => {
                                onNavigate(`category-${activeCategory}`);
                                setIsDropdownOpen(false);
                              }}
                              className="text-xs font-bold text-brand-primary hover:gap-2 flex items-center gap-1 transition-all"
                            >
                              Xem thêm <ArrowRight size={14} />
                            </button>
                          </div>

                          {subcategoriesMap[activeCategory] ? (
                            <div className="grid grid-cols-2 gap-3">
                              {subcategoriesMap[activeCategory].map(sub => (
                                <button
                                  key={sub.id}
                                  onClick={() => {
                                    onNavigate(`category-${activeCategory}::${sub.id}`);
                                    setIsDropdownOpen(false);
                                  }}
                                  className="w-full flex items-center p-3.5 rounded-2xl bg-slate-50 hover:bg-brand-primary/10 text-slate-700 hover:text-brand-primary border border-slate-100/50 hover:border-brand-primary/25 transition-all text-left font-bold text-xs uppercase tracking-wide cursor-pointer text-ellipsis overflow-hidden whitespace-nowrap"
                                >
                                  {sub.name}
                                </button>
                              ))}
                            </div>
                          ) : (
                            <div className="grid grid-cols-2 gap-3">
                              {getProductsByActiveCategory().map(product => (
                                <div 
                                  key={product.id}
                                  className="flex items-center gap-2 p-2 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors group/p"
                                  onClick={() => {
                                    onProductClick(product);
                                    setIsDropdownOpen(false);
                                  }}
                                >
                                  <div className="min-w-0 flex-1">
                                     <p className="text-xs font-bold text-slate-700 truncate group-hover/p:text-brand-primary">{product.name}</p>
                                     <p className="text-xs text-brand-accent font-bold mt-1">
                                        {product.price.toLocaleString('vi-VN')}đ
                                     </p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                )}
              </li>
            ))}
          </ul>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      {isMenuOpen && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/50 z-50 md:hidden"
          onClick={() => setIsMenuOpen(false)}
        >
          <motion.div 
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            className="bg-white w-4/5 h-full p-6 shadow-xl overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-8">
               <span className="font-bold text-xl text-brand-primary">Menu</span>
               <Menu onClick={() => setIsMenuOpen(false)} className="cursor-pointer" />
            </div>

            {/* Mobile Search */}
            <div className="mb-8 relative">
              <input 
                type="text" 
                placeholder="Tìm sản phẩm..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-100 border-none rounded-xl py-3 px-10 text-sm font-medium focus:ring-2 focus:ring-brand-primary outline-none"
              />
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              
              {searchQuery.trim().length > 0 && searchResults.length > 0 && (
                <div className="mt-4 space-y-3">
                  {searchResults.slice(0, 3).map(product => (
                    <button
                      key={product.id}
                      onClick={() => {
                        onProductClick(product);
                        setSearchQuery('');
                        setIsMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-3 p-2 hover:bg-slate-50 rounded-lg text-left"
                    >
                      <img src={getHighResImageUrl(product.image)} alt={product.name} className="w-10 h-10 rounded object-cover" />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold truncate">{product.name}</p>
                        <div className="flex flex-wrap items-center gap-1 my-0.5">
                          <span className="text-[9px] font-mono font-bold text-slate-400 bg-slate-50 px-1 rounded border border-slate-100">SKU: {product.sku}</span>
                          {/* Manufacturer code hidden as requested */}
                        </div>
                        <p className="text-[10px] text-brand-primary font-bold">{product.price.toLocaleString('vi-VN')}đ</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <ul className="space-y-4">
              <li className="border-b border-slate-100 pb-2">
                <Link to="/" onClick={() => setIsMenuOpen(false)} className="text-lg font-bold text-slate-800 hover:text-brand-primary block">Trang chủ</Link>
              </li>
              {menuItems.map((item) => (
                <li key={item.value} className="border-b border-slate-100 pb-2">
                  <div className="flex flex-col gap-2">
                    {item.hasDropdown ? (
                      <span className="text-lg font-bold text-slate-400">
                        {item.label}
                      </span>
                    ) : (
                      <Link 
                        to={item.to}
                        onClick={() => setIsMenuOpen(false)} 
                        className="text-lg font-bold text-slate-800 hover:text-brand-primary block"
                      >
                        {item.label}
                      </Link>
                    )}
                    {item.hasDropdown && (
                      <ul className="pl-4 space-y-2 mt-2">
                        {categories.map(cat => (
                          <li key={cat.name} className="space-y-1">
                            <button 
                              onClick={() => { onNavigate(`category-${cat.name}`); setIsMenuOpen(false); }}
                              className="text-slate-600 text-sm font-bold text-left block"
                            >
                              {cat.name}
                            </button>
                            {subcategoriesMap[cat.name] && (
                              <ul className="pl-4 space-y-1 font-medium border-l border-slate-100 mt-1">
                                {subcategoriesMap[cat.name].map(sub => (
                                  <li key={sub.id}>
                                    <button
                                      onClick={() => {
                                        onNavigate(`category-${cat.name}::${sub.id}`);
                                        setIsMenuOpen(false);
                                      }}
                                      className="text-slate-500 text-xs py-1 text-left block hover:text-brand-primary"
                                    >
                                      {sub.name}
                                    </button>
                                  </li>
                                ))}
                              </ul>
                            )}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </motion.div>
        </motion.div>
      )}
    </header>
  );
}
