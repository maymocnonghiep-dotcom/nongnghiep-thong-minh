import { useState, useEffect } from 'react';
import Header from './components/Header';
import Hero from './components/Hero';
import CategoryGrid from './components/CategoryGrid';
import FeaturedProducts from './components/FeaturedProducts';
import Footer from './components/Footer';
import Promotions from './components/Promotions';
import Customers from './components/Customers';
import Services from './components/Services';
import NewsSection from './components/NewsSection';
import ProductDetail from './components/ProductDetail';
import Cart from './components/Cart';
import AdminPanel from './components/AdminPanel';
import AdminLogin from './components/AdminLogin';
import { Product, CartItem } from './types';
import { ShieldCheck, Truck, Clock, Headphones, ArrowRight } from 'lucide-react';

export default function App() {
  const [currentView, setCurrentView] = useState('home');
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [adminLoginError, setAdminLoginError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [scrollPos, setScrollPos] = useState(0);

  useEffect(() => {
    if (currentView === 'home' && scrollPos > 0) {
      // Use a small timeout to ensure content is rendered
      setTimeout(() => {
        window.scrollTo(0, scrollPos);
      }, 50);
    }
  }, [currentView]);

  const fetchAndMergeProducts = () => {
    fetch('/api/products')
      .then(res => {
        if (!res.ok) {
          throw new Error('Server returned non-OK code');
        }
        return res.json();
      })
      .then(data => {
        const localStr = localStorage.getItem('local_products');
        let localProds: Product[] = [];
        if (localStr) {
          try {
            localProds = JSON.parse(localStr);
          } catch (e) {
            localProds = [];
          }
        }
        const merged = [...data];
        localProds.forEach(lp => {
          const idx = merged.findIndex(p => p.sku === lp.sku);
          if (idx !== -1) {
            merged[idx] = lp;
          } else {
            merged.push(lp);
          }
        });
        setProducts(merged);
      })
      .catch(err => {
        console.error('Error fetching products, falling back to local products:', err);
        const localStr = localStorage.getItem('local_products');
        if (localStr) {
          try {
            setProducts(JSON.parse(localStr));
          } catch (e) {}
        }
      });
  };

  useEffect(() => {
    fetchAndMergeProducts();
  }, []);

  const handleAddToCart = (product: Product) => {
    setCartItems(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...product, quantity: 1 }];
    });
    setIsCartOpen(true);
  };

  const handleUpdateQuantity = (id: string, delta: number) => {
    setCartItems(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const handleRemoveFromCart = (id: string) => {
    setCartItems(prev => prev.filter(item => item.id !== id));
  };

  const handeProductClick = (product: Product) => {
    setScrollPos(window.scrollY);
    setSelectedProduct(product);
    setCurrentView('product-detail');
    window.scrollTo(0, 0);
  };

  const handleNavigate = (view: string, resetScroll = true) => {
    setCurrentView(view);
    setSelectedProduct(null);
    setAdminLoginError(null);
    if (resetScroll) {
      window.scrollTo(0, 0);
      setScrollPos(0);
    }
  };

  const handleAdminLogin = (password: string) => {
    setIsLoggingIn(true);
    setAdminLoginError(null);
    
    // Giả lập kiểm tra mật khẩu (thực tế nên dùng backend)
    setTimeout(() => {
      if (password === 'admin123' || password === 'agriculture2024') {
        setIsAdminAuthenticated(true);
        setIsLoggingIn(false);
      } else {
        setAdminLoginError('Mã khóa không chính xác. Vui lòng thử lại.');
        setIsLoggingIn(false);
      }
    }, 1000);
  };

  const renderContent = () => {
    if (currentView === 'product-detail' && selectedProduct) {
      return (
        <ProductDetail 
          product={selectedProduct} 
          onBack={() => handleNavigate('home', false)} 
          onAddToCart={handleAddToCart}
        />
      );
    }

    switch (currentView) {
      case 'admin':
        if (!isAdminAuthenticated) {
          return (
            <AdminLogin 
              onLogin={handleAdminLogin} 
              onBack={() => handleNavigate('home')} 
              isLoading={isLoggingIn}
              error={adminLoginError}
            />
          );
        }
        return (
          <AdminPanel 
            onBack={() => handleNavigate('home')} 
            onLogout={() => {
              setIsAdminAuthenticated(false);
              handleNavigate('home');
            }}
            onRefreshProducts={fetchAndMergeProducts}
          />
        );
      case 'categories':
        return (
          <div className="pt-24 min-h-screen bg-white">
            <CategoryGrid onNavigate={handleNavigate} products={products} />
          </div>
        );
      case 'promotions':
        return <Promotions />;
      case 'customers':
        return <Customers />;
      case 'services':
        return <Services />;
      case 'news':
        return <NewsSection />;
      case 'home':
      default:
        // Handle categories as sub-views of home or separate if needed
        if (currentView.startsWith('category-')) {
          const groupRaw = currentView.replace('category-', '');
          const parts = groupRaw.split('::');
          const group = parts[0];
          const subcat = parts[1] || 'all';
          return (
            <div className="pt-24 min-h-screen bg-slate-50">
              <div className="max-w-7xl mx-auto px-4 lg:px-8 py-12">
                <button 
                  onClick={() => handleNavigate('home', false)}
                  className="flex items-center gap-2 text-slate-500 hover:text-brand-primary mb-6 font-bold"
                >
                  <ArrowRight size={18} className="rotate-180" /> Quay lại trang chủ
                </button>
                <FeaturedProducts 
                   products={products}
                   onProductClick={handeProductClick} 
                   onAddToCart={handleAddToCart}
                   categoryFilter={group}
                   initialSubcategory={subcat}
                />
              </div>
            </div>
          );
        }
        
        return (
          <>
            <Hero 
              onBuyNowClick={() => {
                const element = document.getElementById('featured-products');
                if (element) {
                  element.scrollIntoView({ behavior: 'smooth' });
                }
              }}
              onViewProjectsClick={() => handleNavigate('customers')}
            />
            
            {/* Why Choose Us */}
            <section className="bg-slate-100 py-8 border-b border-slate-200">
               <div className="max-w-7xl mx-auto px-4 lg:px-8">
                 <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 md:gap-12">
                   {[
                     { icon: ShieldCheck, title: 'Chất lượng đảm bảo', desc: '100% hàng chính hãng' },
                     { icon: Truck, title: 'Giao hàng toàn quốc', desc: 'Nhận hàng thanh toán' },
                     { icon: Clock, title: 'Đổi trả dễ dàng', desc: 'Miễn phí nếu hàng lỗi do NSX' },
                     { icon: Headphones, title: 'Hỗ trợ kỹ thuật', desc: 'Tư vấn lắp đặt miễn phí' },
                   ].map((item, idx) => (
                     <div key={idx} className="flex flex-col items-center sm:flex-row gap-4 text-center sm:text-left">
                       <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-brand-primary shadow-sm">
                         <item.icon size={24} />
                       </div>
                       <div>
                         <h4 className="font-bold text-slate-800 text-sm not-italic font-sans">{item.title}</h4>
                         <p className="text-xs text-slate-500">{item.desc}</p>
                       </div>
                     </div>
                   ))}
                 </div>
               </div>
            </section>

            <CategoryGrid onNavigate={handleNavigate} products={products} />
            
            <FeaturedProducts 
              onProductClick={handeProductClick} 
              onAddToCart={handleAddToCart}
            />

            {/* Brand Banner - Dynamic Section */}
            <section className="py-12 px-4 lg:px-8 max-w-7xl mx-auto">
              <div className="bg-brand-secondary rounded-3xl p-8 md:p-12 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8">
                <div className="relative z-10 max-w-xl text-center md:text-left">
                  <h2 className="text-3xl md:text-5xl text-white font-bold mb-4 not-italic font-sans">
                    Bạn cần tư vấn giải pháp <br className="hidden md:block" /> 
                    <span className="text-brand-accent">Tưới Thông Minh?</span>
                  </h2>
                  <p className="text-blue-100 mb-8 text-lg">
                    Để lại thông tin, đội ngũ kỹ thuật của chúng tôi sẽ liên hệ khảo sát và tư vấn trực tiếp cho trang trại của bạn.
                  </p>
                  <button className="bg-white text-brand-secondary px-8 py-3 rounded-full font-bold hover:bg-brand-accent hover:text-white transition-all">
                    Đăng ký tư vấn ngay
                  </button>
                </div>
                
                {/* Visual Decoration */}
                <div className="hidden lg:block absolute -right-20 top-0 bottom-0 w-1/2 opacity-20">
                   <div className="w-full h-full border-[40px] border-white rounded-full translate-x-1/2 scale-150" />
                </div>
                
                <div className="relative z-10 bg-white/10 backdrop-blur-md p-6 rounded-2xl border border-white/20">
                   <div className="flex flex-col gap-4 text-white">
                     <div className="text-center">
                        <span className="text-xs uppercase font-bold tracking-widest text-blue-200">Hotline kỹ thuật</span>
                        <div className="text-2xl font-bold">0706.583.888</div>
                     </div>
                     <div className="h-px bg-white/20" />
                     <div className="text-sm text-center">
                        Công ty TNHH Giải Pháp <br /> Nông Nghiệp Thông Minh
                     </div>
                   </div>
                </div>
              </div>
            </section>

            {/* Quick News Access */}
            <section className="py-12 bg-white border-t border-slate-100">
              <div className="max-w-7xl mx-auto px-4 lg:px-8">
                 <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-2">
                       <div className="w-1.5 h-8 bg-brand-primary rounded-full" />
                       <h2 className="text-2xl font-bold text-slate-800">Cẩm nang nông nghiệp</h2>
                    </div>
                    <button onClick={() => setCurrentView('news')} className="text-sm font-bold text-brand-primary flex items-center gap-1 hover:gap-2 transition-all">
                      Xem tất cả <ArrowRight size={16} />
                    </button>
                 </div>
                 
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {[
                      { 
                        title: 'Hướng dẫn lắp đặt hệ thống tưới nhỏ giọt cho dưa lưới', 
                        date: '15/05/2024',
                        image: 'https://images.unsplash.com/photo-1590644365607-1c5a919aa435?w=500&q=80'
                      },
                      { 
                        title: 'Top 5 bét phun mưa hiệu quả nhất cho cây ăn trái', 
                        date: '12/05/2024',
                        image: 'https://images.unsplash.com/photo-1591857177580-dc82b9ac4e1e?w=500&q=80'
                      },
                      { 
                        title: 'Cách lựa chọn máy bơm nước phù hợp với quy mô trang trại', 
                        date: '08/05/2024',
                        image: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=500&q=80'
                      }
                    ].map((post, i) => (
                      <div key={i} className="group cursor-pointer">
                        <div className="aspect-video rounded-xl overflow-hidden mb-4">
                          <img src={post.image} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        </div>
                        <span className="text-xs font-bold text-brand-primary uppercase tracking-widest">{post.date}</span>
                        <h3 className="text-lg font-bold text-slate-800 mt-2 line-clamp-2 group-hover:text-brand-secondary transition-colors not-italic font-sans">
                          {post.title}
                        </h3>
                      </div>
                    ))}
                 </div>
              </div>
            </section>
          </>
        );
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header 
        onNavigate={handleNavigate} 
        currentView={currentView} 
        cartCount={cartItems.reduce((s, i) => s + i.quantity, 0)}
        onCartOpen={() => setIsCartOpen(true)}
        products={products}
        onProductClick={handeProductClick}
      />
      
      <main className="flex-grow">
        {renderContent()}
      </main>

      <Cart 
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cartItems}
        onUpdateQuantity={handleUpdateQuantity}
        onRemove={handleRemoveFromCart}
        onClear={() => setCartItems([])}
      />

      <Footer onAdminClick={() => handleNavigate('admin')} />
    </div>
  );
}
