import { useEffect, useState } from 'react';
import ProductCard from './ProductCard';
import { ChevronLeft, ChevronRight, ArrowUpNarrowWide, ArrowDownWideNarrow, Percent, Filter } from 'lucide-react';
import { Product } from '../types';

interface FeaturedProductsProps {
  onProductClick: (product: Product) => void;
  onAddToCart: (product: Product) => void;
  categoryFilter?: string;
  initialSubcategory?: string;
  products?: Product[];
}

type SortOption = 'price-asc' | 'price-desc' | 'discount-desc';

export default function FeaturedProducts({ onProductClick, onAddToCart, categoryFilter, initialSubcategory, products }: FeaturedProductsProps) {
  const [allProducts, setAllProducts] = useState<Product[]>(products || []);
  const [sortBy, setSortBy] = useState<SortOption>('price-asc');
  const [loading, setLoading] = useState(!products || products.length === 0);
  const [currentPage, setCurrentPage] = useState(1);
  const [cameraSubcategory, setCameraSubcategory] = useState<string>('all');

  const cameraSubcategories = [
    { id: 'all', name: 'Tất cả' },
    { id: 'imou', name: 'Camera IMOU' },
    { id: 'ezviz', name: 'Camera EZVIZ' },
    { id: 'yoosee', name: 'Camera Yoosee' },
    { id: 'solar', name: 'Camera Năng Lượng Mặt Trời' },
    { id: '4g', name: 'Camera 4G' }
  ];

  const matchesCameraSubcategory = (product: Product, subId: string) => {
    if (subId === 'all') return true;
    
    const name = (product.name || '').toLowerCase();
    const desc = (product.description || '').toLowerCase();
    
    if (subId === 'imou') {
      return name.includes('imou') || desc.includes('imou');
    }
    if (subId === 'ezviz') {
      return name.includes('ezviz') || desc.includes('ezviz');
    }
    if (subId === 'yoosee') {
      return name.includes('yoosee') || desc.includes('yoosee');
    }
    if (subId === 'solar') {
      return name.includes('năng lượng mặt trời') || name.includes('solar') || desc.includes('năng lượng mặt trời') || desc.includes('solar');
    }
    if (subId === '4g') {
      return name.includes('4g') || desc.includes('4g');
    }
    return true;
  };

  useEffect(() => {
    if (products && products.length > 0) {
      setAllProducts(products);
      setLoading(false);
    } else {
      setLoading(true);
      fetch('/api/products')
        .then(res => {
          if (!res.ok) throw new Error('Not OK');
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
          setAllProducts(merged);
          setLoading(false);
        })
        .catch(err => {
          console.warn("Could not fetch products, reading local:", err);
          const localStr = localStorage.getItem('local_products');
          if (localStr) {
            try {
              setAllProducts(JSON.parse(localStr));
            } catch (e) {}
          }
          setLoading(false);
        });
    }
  }, [products]);

  useEffect(() => {
    setCurrentPage(1);
    if (initialSubcategory) {
      setCameraSubcategory(initialSubcategory);
    } else {
      setCameraSubcategory('all');
    }
  }, [categoryFilter, sortBy, initialSubcategory]);

  const getFilteredAndSortedProducts = () => {
    let filtered = categoryFilter 
      ? allProducts.filter(p => p.group === categoryFilter)
      : allProducts;

    if (categoryFilter === "Camera An Ninh") {
      filtered = filtered.filter(p => matchesCameraSubcategory(p, cameraSubcategory));
    }

    const sorted = [...filtered].sort((a, b) => {
      if (sortBy === 'price-asc') return a.price - b.price;
      if (sortBy === 'price-desc') return b.price - a.price;
      if (sortBy === 'discount-desc') return (b.discount || 0) - (a.discount || 0);
      return 0;
    });

    return sorted;
  };

  if (loading) {
    return (
      <div className="py-20 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-brand-primary border-t-transparent"></div>
      </div>
    );
  }

  const sortedProducts = getFilteredAndSortedProducts();
  const itemsPerPage = 20;
  const totalItems = sortedProducts.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  
  const startIndex = (currentPage - 1) * itemsPerPage;
  const productsToShow = sortedProducts.slice(startIndex, startIndex + itemsPerPage);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    const element = document.getElementById('featured-products');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section id="featured-products" className="py-12 px-4 lg:px-8 max-w-7xl mx-auto scroll-mt-24">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 pb-6 border-b border-slate-100 gap-6">
        <div>
          <h2 className="text-2xl md:text-3xl font-black text-slate-800 mb-1 tracking-tight">
            {categoryFilter ? `Nhóm: ${categoryFilter}` : 'Mặt hàng nổi bật'}
          </h2>
          <p className="text-slate-500 text-sm font-medium">Khám phá giải pháp nông nghiệp thông minh</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-400 mr-2 uppercase tracking-widest">
            <Filter size={14} /> Sắp xếp
          </div>
          
          <button 
            onClick={() => setSortBy('price-asc')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
              sortBy === 'price-asc' 
                ? 'bg-brand-primary text-white border-brand-primary shadow-lg shadow-brand-primary/20' 
                : 'bg-white text-slate-600 border-slate-100 hover:border-brand-primary/30'
            }`}
          >
            <ArrowUpNarrowWide size={14} /> Giá tăng
          </button>
          
          <button 
            onClick={() => setSortBy('price-desc')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
              sortBy === 'price-desc' 
                ? 'bg-brand-primary text-white border-brand-primary shadow-lg shadow-brand-primary/20' 
                : 'bg-white text-slate-600 border-slate-100 hover:border-brand-primary/30'
            }`}
          >
            <ArrowDownWideNarrow size={14} /> Giá giảm
          </button>
          
          <button 
            onClick={() => setSortBy('discount-desc')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
              sortBy === 'discount-desc' 
                ? 'bg-brand-primary text-white border-brand-primary shadow-lg shadow-brand-primary/20' 
                : 'bg-white text-slate-600 border-slate-100 hover:border-brand-primary/30'
            }`}
          >
            <Percent size={14} /> Khuyến mãi
          </button>
        </div>
      </div>

      {categoryFilter === 'Camera An Ninh' && (
        <div className="mb-8 p-1 bg-slate-100 rounded-2xl flex flex-wrap gap-1 md:inline-flex border border-slate-200/50">
          {cameraSubcategories.map((sub) => (
            <button
              key={sub.id}
              onClick={() => {
                setCameraSubcategory(sub.id);
                setCurrentPage(1);
              }}
              className={`px-5 py-2.5 rounded-xl text-xs font-black tracking-wide uppercase transition-all whitespace-nowrap cursor-pointer ${
                cameraSubcategory === sub.id
                  ? 'bg-white text-brand-primary shadow-sm border border-slate-200/20'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-white/50'
              }`}
            >
              {sub.name}
            </button>
          ))}
        </div>
      )}

      {productsToShow.length === 0 ? (
        <div className="text-center py-20 bg-slate-50 rounded-3xl border border-slate-100">
          <p className="text-slate-500 font-bold">Không tìm thấy sản phẩm nào</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6 justify-items-center">
          {productsToShow.map(product => (
            <ProductCard 
              key={product.id}
              product={product} 
              onClick={onProductClick}
              onAddToCart={onAddToCart}
            />
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="mt-12 flex justify-center items-center gap-2">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className={`p-2.5 rounded-xl border flex items-center justify-center transition-all ${
              currentPage === 1
                ? 'bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed'
                : 'bg-white text-slate-600 border-slate-200 hover:border-brand-primary hover:text-brand-primary active:scale-95'
            }`}
            title="Trang trước"
          >
            <ChevronLeft size={18} />
          </button>

          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              onClick={() => handlePageChange(page)}
              className={`w-10 h-10 rounded-xl border font-bold text-sm transition-all active:scale-95 ${
                currentPage === page
                  ? 'bg-brand-primary text-white border-brand-primary shadow-lg shadow-brand-primary/25'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-brand-primary/40 hover:text-brand-primary'
              }`}
            >
              {page}
            </button>
          ))}

          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className={`p-2.5 rounded-xl border flex items-center justify-center transition-all ${
              currentPage === totalPages
                ? 'bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed'
                : 'bg-white text-slate-600 border-slate-200 hover:border-brand-primary hover:text-brand-primary active:scale-95'
            }`}
            title="Trang sau"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      )}
    </section>
  );
}
