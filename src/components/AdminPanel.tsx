import React, { useState, useEffect, useRef } from 'react';
import { Upload, FileText, CheckCircle2, AlertCircle, ArrowLeft, Database, ShoppingBag, Eye, Calendar, User, MapPin, PlusCircle, Trash2, Plus } from 'lucide-react';
import * as XLSX from 'xlsx';
import { motion, AnimatePresence } from 'motion/react';
import { Product, Order } from '../types';
import { subcategoriesMap } from '../categoriesData';

interface AdminPanelProps {
  onBack: () => void;
  onLogout?: () => void;
  onRefreshProducts?: () => void;
}

export default function AdminPanel({ onBack, onLogout, onRefreshProducts }: AdminPanelProps) {
  const [activeTab, setActiveTab ] = useState<'import' | 'orders' | 'consultations' | 'add_product'>('orders');
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ success: boolean; message: string; count?: number } | null>(null);
  
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders ] = useState(false);
  const [selectedOrder, setSelectedOrder ] = useState<Order | null>(null);

  const [consultations, setConsultations] = useState<any[]>([]);
  const [loadingConsultations, setLoadingConsultations] = useState(false);

  // States for single product creation form
  const defaultCategoriesList = [
    "Thiết bị tưới",
    "Đồ điện",
    "Camera An Ninh",
    "Vật tư nước",
    "Dụng cụ làm vườn",
    "Đèn năng lượng mặt trời"
  ];
  const [categories, setCategories] = useState<string[]>(defaultCategoriesList);
  const [newSku, setNewSku] = useState('');
  const [newManufacturerCode, setNewManufacturerCode] = useState('');
  const [newName, setNewName] = useState('');
  const [newGroup, setNewGroup] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Thiết bị tưới');
  const [selectedSubcategoryId, setSelectedSubcategoryId] = useState<string>('bec-phun');
  const [customCategory, setCustomCategory] = useState('');

  useEffect(() => {
    if (selectedCategory && subcategoriesMap[selectedCategory]) {
      const subs = subcategoriesMap[selectedCategory];
      if (subs.length > 0) {
        setSelectedSubcategoryId(subs[0].id);
        setNewGroup(subs[0].name);
      } else {
        setSelectedSubcategoryId('');
        setNewGroup('');
      }
    } else {
      setSelectedSubcategoryId('');
      setNewGroup('');
    }
  }, [selectedCategory]);
  const [isNewCategory, setIsNewCategory] = useState(false);
  const [newPrice, setNewPrice] = useState('');
  const [newOriginalPrice, setNewOriginalPrice] = useState('');
  const [newUnit, setNewUnit] = useState('Bộ');
  const [newImage, setNewImage] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newSpecs, setNewSpecs] = useState<{ key: string; value: string }[]>([
    { key: 'Thương hiệu', value: 'Thắng Lợi' },
    { key: 'Chất liệu', value: 'Nhựa cao cấp' }
  ]);
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [productSuccessMessage, setProductSuccessMessage] = useState<string | null>(null);
  const [productErrorMessage, setProductErrorMessage] = useState<string | null>(null);
  const [newImagesList, setNewImagesList] = useState<string[]>([]);
  const [imageInputVal, setImageInputVal] = useState('');
  const [isCategoryHovered, setIsCategoryHovered] = useState(false);
  const [isCategoryInputFocused, setIsCategoryInputFocused] = useState(false);
  const [isCustomCategoryFocused, setIsCustomCategoryFocused] = useState(false);
  
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchCategories();

    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (activeTab === 'orders') {
      fetchOrders();
    } else if (activeTab === 'consultations') {
      fetchConsultations();
    } else if (activeTab === 'add_product') {
      fetchCategories();
    }
  }, [activeTab]);

  const fetchConsultations = () => {
    setLoadingConsultations(true);
    fetch('/api/admin/consultations')
      .then(res => res.json())
      .then(data => {
        setConsultations(data);
        setLoadingConsultations(false);
      })
      .catch(err => {
        console.error('Error fetching consultations:', err);
        setLoadingConsultations(false);
      });
  };

  const fetchCategories = () => {
    fetch('/api/categories')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setCategories(prev => {
            const merged = Array.from(new Set([...prev, ...data]));
            return merged;
          });
          setSelectedCategory(prev => prev || data[0]);
        }
      })
      .catch(err => console.error('Error fetching categories:', err));
  };

  const handleProductImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        setNewImage(reader.result);
        setNewImagesList(prev => [...prev, reader.result as string]);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleProductImagesUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file) {
        const reader = new FileReader();
        reader.onloadend = () => {
          if (typeof reader.result === 'string') {
            setNewImagesList(prev => [...prev, reader.result as string]);
          }
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const handlePushImageUrl = () => {
    if (imageInputVal.trim()) {
      setNewImagesList(prev => [...prev, imageInputVal.trim()]);
      setImageInputVal('');
    }
  };

  const handleAddSpecRow = () => {
    setNewSpecs([...newSpecs, { key: '', value: '' }]);
  };

  const handleUpdateSpecRow = (index: number, key: 'key' | 'value', text: string) => {
    const updated = [...newSpecs];
    updated[index][key] = text;
    setNewSpecs(updated);
  };

  const handleRemoveSpecRow = (index: number) => {
    setNewSpecs(newSpecs.filter((_, i) => i !== index));
  };

  const handleAddProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProductSuccessMessage(null);
    setProductErrorMessage(null);

    if (!newSku.trim()) {
      setProductErrorMessage('Mã sản phẩm (SKU) không được để trống!');
      return;
    }
    if (!newName.trim()) {
      setProductErrorMessage('Tên sản phẩm không được để trống!');
      return;
    }

    const finalCategory = selectedCategory;
    if (!finalCategory || !finalCategory.trim()) {
      setProductErrorMessage('Vui lòng chọn hoặc điền thông tin nhóm hàng (Danh mục)!');
      return;
    }

    setIsAddingProduct(true);

    let finalSubcategoryId = selectedSubcategoryId;
    let finalSubcategoryName = '';

    if (subcategoriesMap[finalCategory]) {
      if (finalSubcategoryId === 'custom') {
        const nameVal = newGroup.trim();
        if (!nameVal) {
          setProductErrorMessage('Vui lòng điền tên thư mục con mới!');
          setIsAddingProduct(false);
          return;
        }
        finalSubcategoryName = nameVal;
        finalSubcategoryId = nameVal.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-');
      } else {
        const found = subcategoriesMap[finalCategory].find(s => s.id === finalSubcategoryId);
        if (found) {
          finalSubcategoryName = found.name;
        } else {
          finalSubcategoryName = newGroup.trim() || finalCategory;
        }
      }
    } else {
      const nameVal = newGroup.trim();
      if (!nameVal) {
        setProductErrorMessage('Vui lòng điền tên thư mục con!');
        setIsAddingProduct(false);
        return;
      }
      finalSubcategoryName = nameVal;
      finalSubcategoryId = nameVal.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-');
    }

    const specsObject: Record<string, string> = {};
    newSpecs.forEach(spec => {
      if (spec.key.trim() && spec.value.trim()) {
        specsObject[spec.key.trim()] = spec.value.trim();
      }
    });

    // Extract first image from list as main image, or default to fallback or main newImage state
    const cleanImages = newImagesList.filter(u => u.trim() !== '');
    const fallbackImage = "https://images.unsplash.com/photo-1592417817098-8f3d6eb19675?w=500&auto=format&fit=crop&q=60";
    const primaryImage = cleanImages.length > 0 ? cleanImages[0] : (newImage.trim() || fallbackImage);
    const finalImagesToSend = cleanImages.length > 0 ? cleanImages : [primaryImage];

    const bodyData = {
      sku: newSku.trim(),
      manufacturerCode: newManufacturerCode.trim(),
      name: newName.trim(),
      category: "Danh mục sản phẩm", // Keep category standard so general listing stays happy
      group: finalCategory.trim(), // Keep this as the main Group (e.g. "Camera An Ninh")
      subcategoryId: finalSubcategoryId,
      subcategoryName: finalSubcategoryName,
      price: parseFloat(newPrice) || 0,
      originalPrice: newOriginalPrice ? parseFloat(newOriginalPrice) : undefined,
      description: newDescription.trim(),
      image: primaryImage,
      images: finalImagesToSend,
      unit: newUnit.trim(),
      specs: specsObject
    };

    try {
      const res = await fetch('/api/admin/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(bodyData)
      });
      const data = await res.json();
      if (data.success) {
        setProductSuccessMessage(data.message || 'Thêm sản phẩm thành công!');
        onRefreshProducts?.();
        
        // Reset states
        setNewSku('');
        setNewManufacturerCode('');
        setNewName('');
        setNewGroup('');
        setNewPrice('');
        setNewOriginalPrice('');
        setNewDescription('');
        setNewImage('');
        setNewImagesList([]);
        setImageInputVal('');
        setNewSpecs([
          { key: 'Thương hiệu', value: 'Thắng Lợi' },
          { key: 'Chất liệu', value: 'Nhựa cao cấp' }
        ]);

        fetchCategories();
      } else {
        setProductErrorMessage(data.message || 'Có lỗi xảy ra khi lưu sản phẩm.');
      }
    } catch (err) {
      console.error(err);
      setProductErrorMessage('Lỗi mạng, kiểm tra lại kết nối!');
    } finally {
      setIsAddingProduct(false);
    }
  };

  const handleUpdateConsultationStatus = (id: string, newStatus: string) => {
    fetch(`/api/admin/consultations/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ status: newStatus })
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          fetchConsultations();
        }
      })
      .catch(err => {
        console.error('Error updating status:', err);
      });
  };

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
          const rawDesc = String(getVal(['Mô tả', 'Description']) || '');
          const description = rawDesc.replace(/\\n/g, '\n').replace(/\r\n/g, '\n').trim();
          let image = String(getVal(['Link hình ảnh', 'Hình ảnh', 'Image']) || '').trim() || 'https://images.unsplash.com/photo-1615811361523-6bd03d7748e7?w=1200&q=95';
          if (image.includes('images.unsplash.com')) {
            image = image.replace(/w=\d+/, 'w=1200').replace(/q=\d+/, 'q=95');
            if (!image.includes('w=')) {
              image += (image.includes('?') ? '&' : '?') + 'w=1200&q=95';
            }
          }
          
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
              <button 
                onClick={() => setActiveTab('consultations')}
                className={`px-6 py-3 font-bold text-sm transition-all relative shrink-0 ${
                  activeTab === 'consultations' ? 'text-brand-primary' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <span className="flex items-center gap-2">
                  <Database size={18} /> Yêu cầu tư vấn ({consultations.length})
                </span>
                {activeTab === 'consultations' && <motion.div layoutId="tab-active" className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-primary" />}
              </button>
              <button 
                onClick={() => {
                  setActiveTab('add_product');
                  setProductSuccessMessage(null);
                  setProductErrorMessage(null);
                }}
                className={`px-6 py-3 font-bold text-sm transition-all relative shrink-0 ${
                  activeTab === 'add_product' ? 'text-brand-primary' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <span className="flex items-center gap-2">
                  <PlusCircle size={18} /> Thêm sản phẩm
                </span>
                {activeTab === 'add_product' && <motion.div layoutId="tab-active" className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-primary" />}
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
            ) : activeTab === 'consultations' ? (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2 not-italic font-sans">
                    <Database size={24} className="text-brand-primary" /> Yêu cầu tư vấn thiết kế vườn của Khách hàng
                  </h2>
                  <button 
                    onClick={fetchConsultations}
                    className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-brand-primary transition-all cursor-pointer"
                    title="Làm mới"
                  >
                    <ArrowLeft className="rotate-90" size={18} />
                  </button>
                </div>

                {loadingConsultations ? (
                  <div className="flex flex-col items-center justify-center py-20">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-brand-primary border-t-transparent mb-4"></div>
                    <p className="text-slate-400 font-medium font-sans">Đang tải danh sách yêu cầu tư vấn...</p>
                  </div>
                ) : consultations.length === 0 ? (
                  <div className="text-center py-20 bg-slate-50 rounded-3xl border border-slate-100">
                    <Database size={48} className="mx-auto text-slate-200 mb-4" />
                    <p className="text-slate-500 font-bold font-sans">Chưa có yêu cầu tư vấn nào</p>
                    <p className="text-slate-400 text-sm">Thông tin các khách hàng đăng ký tư vấn sẽ xuất hiện ở đây.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-2xl border border-slate-100">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-100">
                          <th className="p-4 text-xs font-bold text-slate-500 uppercase">Mã yêu cầu</th>
                          <th className="p-4 text-xs font-bold text-slate-500 uppercase">Khách hàng</th>
                          <th className="p-4 text-xs font-bold text-slate-500 uppercase">Địa chỉ</th>
                          <th className="p-4 text-xs font-bold text-slate-500 uppercase">Khu vườn (DT/Mô hình)</th>
                          <th className="p-4 text-xs font-bold text-slate-500 uppercase">Ngày đăng ký</th>
                          <th className="p-4 text-xs font-bold text-slate-500 uppercase text-center">Trạng thái</th>
                          <th className="p-4 text-xs font-bold text-slate-500 uppercase text-center">Hành động</th>
                        </tr>
                      </thead>
                      <tbody>
                        {consultations.map((item) => (
                          <tr key={item.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                            <td className="p-4 font-mono text-[10px] font-bold text-slate-400">{item.id}</td>
                            <td className="p-4">
                              <div className="font-bold text-slate-800 text-sm">{item.fullName}</div>
                              <div className="text-slate-600 font-bold text-xs">
                                <a href={`tel:${item.phone}`} className="hover:underline text-brand-primary">{item.phone}</a>
                              </div>
                            </td>
                            <td className="p-4">
                              <div className="text-xs text-slate-500">{item.district || "---"}</div>
                              <div className="text-[10px] text-slate-400 font-bold">{item.province || "---"}</div>
                            </td>
                            <td className="p-4">
                              <div className="text-xs text-slate-800 font-semibold">DT: {item.area || "Chưa rõ"}</div>
                              <div className="text-[10px] text-slate-500 italic">Mô hình: {item.farmModel || "Chưa rõ"}</div>
                            </td>
                            <td className="p-4">
                              <div className="text-xs text-slate-500">{new Date(item.createdAt).toLocaleDateString('vi-VN')}</div>
                              <div className="text-[10px] text-slate-400">{new Date(item.createdAt).toLocaleTimeString('vi-VN')}</div>
                            </td>
                            <td className="p-4 text-center">
                              <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-tighter ${
                                item.status === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'
                              }`}>
                                {item.status === 'pending' ? 'Chờ liên hệ' : 'Đã tư vấn'}
                              </span>
                            </td>
                            <td className="p-4 text-center">
                              <button
                                onClick={() => handleUpdateConsultationStatus(item.id, item.status === 'pending' ? 'completed' : 'pending')}
                                className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                                  item.status === 'pending' 
                                    ? 'bg-brand-primary hover:bg-brand-primary/90 text-white shadow-sm' 
                                    : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                                }`}
                              >
                                {item.status === 'pending' ? 'Xử lý xong ✔' : 'Đặt lại Chờ ↺'}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ) : activeTab === 'add_product' ? (
              <div className="space-y-8 text-sm text-slate-700">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2 not-italic font-sans">
                    <PlusCircle size={24} className="text-brand-primary" /> Thêm sản phẩm thủ công mới
                  </h2>
                </div>

                <form onSubmit={handleAddProductSubmit} className="space-y-6">
                  {/* Row 1: SKU & Name */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-1.5">
                      <label className="text-xs font-black text-slate-700 block uppercase tracking-wider">
                        Mã sản phẩm (SKU) <span className="text-rose-500">*</span>
                      </label>
                      <input 
                        type="text" 
                        required 
                        value={newSku}
                        onChange={(e) => setNewSku(e.target.value)}
                        placeholder="Ví dụ: BE-BU-50L, BOMB-3HP"
                        className="w-full text-slate-800 bg-slate-50/50 border border-slate-200 focus:border-brand-primary focus:bg-white rounded-xl px-4 py-3 font-medium transition-all"
                      />
                      <span className="text-[10px] text-slate-400 block italic font-bold">Lưu ý: Nếu nhập SKU đã tồn tại, hệ thống sẽ tự động cập nhật đè thông tin lên sản phẩm đó.</span>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-black text-slate-700 block uppercase tracking-wider flex items-center gap-1">
                        Mã của hãng / Nhà SX <span className="text-[10px] text-slate-400 bg-slate-100 px-1 py-0.5 rounded font-black lowercase normal-case">Tùy chọn</span>
                      </label>
                      <input 
                        type="text" 
                        value={newManufacturerCode}
                        onChange={(e) => setNewManufacturerCode(e.target.value)}
                        placeholder="Ví dụ: SPK-5201, 89352..."
                        className="w-full text-slate-800 bg-slate-50/50 border border-slate-200 focus:border-brand-primary focus:bg-white rounded-xl px-4 py-3 font-medium transition-all"
                      />
                      <span className="text-[10px] text-emerald-600 block italic font-bold">🔎 Bạn có thể dùng mã này hoặc SKU để tìm kiếm song song.</span>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-black text-slate-700 block uppercase tracking-wider">
                        Tên sản phẩm <span className="text-rose-500">*</span>
                      </label>
                      <input 
                        type="text" 
                        required 
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        placeholder="Ví dụ: Béc phun sương bù áp Super Spurt"
                        className="w-full text-slate-800 bg-slate-50/50 border border-slate-200 focus:border-brand-primary focus:bg-white rounded-xl px-4 py-3 font-medium transition-all"
                      />
                    </div>
                  </div>

                  {/* Row 2: Category selection & Custom input */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50/40 p-5 rounded-2xl border border-slate-100 animate-fadeIn">
                    <div 
                      ref={dropdownRef}
                      className="space-y-1.5 relative"
                    >
                      <label className="text-xs font-black text-slate-700 block uppercase tracking-wider">
                        Danh mục chính (Nhóm hàng chính) <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <input 
                          type="text"
                          required
                          value={selectedCategory}
                          onChange={(e) => {
                            setSelectedCategory(e.target.value);
                            setIsDropdownOpen(true);
                          }}
                          onFocus={() => {
                            setIsDropdownOpen(true);
                          }}
                          onClick={() => {
                            setIsDropdownOpen(true);
                          }}
                          placeholder="Nhấp vào để chọn trong các nhóm mặt hàng..."
                          className="w-full text-slate-800 bg-white border border-slate-200 focus:border-brand-primary focus:ring-1 focus:ring-brand-primary rounded-xl px-4 py-3 font-bold transition-all cursor-pointer text-sm shadow-sm"
                        />
                        <div className="absolute right-4 top-3.5 text-slate-400 pointer-events-none">
                          <Plus size={16} />
                        </div>
                      </div>

                      {/* Hover / Focused Dropdown of groups */}
                      <AnimatePresence>
                        {isDropdownOpen && (
                          <motion.div 
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 5 }}
                            className="absolute left-0 right-0 top-full z-50 bg-white border border-slate-200 rounded-2xl shadow-xl mt-1.5 max-h-[360px] overflow-y-auto flex flex-col"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="p-2 flex-1 overflow-y-auto max-h-52">
                              <div className="text-[10px] font-bold text-slate-400 px-3 py-1 mb-1 border-b border-slate-100 uppercase tracking-widest">
                                Danh sách danh mục chính hiện có (Bấm để chọn nhanh)
                              </div>
                              {categories.filter(cat => cat !== "Danh mục sản phẩm" && cat.trim() !== "").length > 0 ? (
                                categories
                                  .filter(cat => cat !== "Danh mục sản phẩm" && cat.trim() !== "")
                                  .map((cat, idx) => {
                                    const isSelected = selectedCategory === cat;
                                    return (
                                      <button
                                        type="button"
                                        key={idx}
                                        onClick={() => {
                                          setSelectedCategory(cat);
                                          setIsDropdownOpen(false);
                                        }}
                                        className={`w-full text-left font-bold text-xs px-3 py-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-between my-0.5 ${
                                          isSelected 
                                            ? 'bg-brand-primary text-white shadow-sm' 
                                            : 'text-slate-700 hover:text-white hover:bg-brand-primary/95 bg-transparent'
                                        }`}
                                      >
                                        <span>{cat}</span>
                                        {isSelected ? (
                                          <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded font-black font-sans">✓ Đang chọn</span>
                                        ) : (
                                          <span className="text-[9px] font-extrabold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">Chọn</span>
                                        )}
                                      </button>
                                    );
                                  })
                              ) : (
                                <div className="p-3 text-xs text-slate-400 italic">
                                  Đang tải danh sách...
                                </div>
                              )}
                            </div>

                            {/* Creating a brand new custom category */}
                            <div className="border-t border-slate-100 p-3 bg-slate-50/80 rounded-b-2xl flex flex-col gap-1.5">
                              <span className="text-[10px] font-black text-brand-primary uppercase tracking-widest block">
                                ➕ Thêm danh mục chính hoàn toàn mới
                              </span>
                              <div className="flex gap-2">
                                <input 
                                  type="text"
                                  placeholder="Ví dụ: Máy bơm, Phụ kiện..."
                                  value={customCategory}
                                  onChange={(e) => setCustomCategory(e.target.value)}
                                  className="flex-1 bg-white border border-slate-250 focus:border-brand-primary focus:ring-1 focus:ring-brand-primary rounded-xl px-3 py-1.5 text-xs font-semibold shadow-sm text-slate-800"
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (customCategory.trim()) {
                                      const trimmed = customCategory.trim();
                                      setSelectedCategory(trimmed);
                                      if (!categories.includes(trimmed)) {
                                        setCategories(prev => [...prev, trimmed]);
                                      }
                                      setCustomCategory('');
                                      setIsDropdownOpen(false);
                                    }
                                  }}
                                  className="bg-brand-primary hover:bg-brand-secondary text-white text-xs px-3 py-1.5 rounded-xl font-bold transition-all shadow-sm cursor-pointer shrink-0"
                                >
                                  Tạo mới
                                </button>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-black text-slate-700 block uppercase tracking-wider">
                        Thư mục con (Ví dụ: camera imou, camera ezviz, ...) <span className="text-rose-500">*</span>
                      </label>
                      {subcategoriesMap[selectedCategory] && subcategoriesMap[selectedCategory].length > 0 ? (
                        <div className="space-y-3">
                          <select
                            value={selectedSubcategoryId}
                            onChange={(e) => {
                              setSelectedSubcategoryId(e.target.value);
                              if (e.target.value !== 'custom') {
                                const matched = subcategoriesMap[selectedCategory].find(s => s.id === e.target.value);
                                setNewGroup(matched ? matched.name : '');
                              } else {
                                setNewGroup('');
                              }
                            }}
                            className="w-full text-slate-800 bg-white border border-slate-200 focus:border-brand-primary focus:ring-1 focus:ring-brand-primary rounded-xl px-4 py-3 font-semibold transition-all text-sm cursor-pointer shadow-sm"
                          >
                            {subcategoriesMap[selectedCategory].map((sub) => (
                              <option key={sub.id} value={sub.id}>
                                {sub.name}
                              </option>
                            ))}
                            <option value="custom">✍️ Tự nhập thư mục con mới/khác...</option>
                          </select>

                          {selectedSubcategoryId === 'custom' && (
                            <motion.div
                              initial={{ opacity: 0, y: -5 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="relative"
                            >
                              <input 
                                type="text" 
                                required
                                value={newGroup}
                                onChange={(e) => setNewGroup(e.target.value)}
                                placeholder="Nhập tên nhóm con (Ví dụ: camera imou, béc tưới xịn...)"
                                className="w-full text-slate-850 bg-white border border-slate-200 focus:border-brand-primary rounded-xl px-4 py-2.5 text-xs font-semibold transition-all shadow-inner"
                              />
                            </motion.div>
                          )}
                        </div>
                      ) : (
                        <div>
                          <input 
                            type="text" 
                            required
                            value={newGroup}
                            onChange={(e) => setNewGroup(e.target.value)}
                            placeholder="Nhập tên thư mục con (Ví dụ: Camera IMOU, Đầu tưới sương...)"
                            className="w-full text-slate-850 bg-white border border-slate-200 focus:border-brand-primary focus:ring-1 focus:ring-brand-primary rounded-xl px-4 py-3 font-semibold transition-all text-sm shadow-sm"
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Row 3: Pricing and Unit */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    <div className="space-y-1.5">
                      <label className="text-xs font-black text-slate-700 block uppercase tracking-wider">
                        Giá bán (VNĐ) <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <input 
                          type="number" 
                          required 
                          value={newPrice}
                          onChange={(e) => setNewPrice(e.target.value)}
                          placeholder="Ví dụ: 150000"
                          className="w-full text-slate-800 bg-slate-50/50 border border-slate-200 focus:border-brand-primary focus:bg-white rounded-xl px-4 py-3 font-bold transition-all"
                        />
                        <span className="absolute right-4 top-3 text-slate-400 font-bold text-xs">₫</span>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-black text-slate-500 block uppercase tracking-wider">
                        Giá gốc (Để hiển thị giảm giá)
                      </label>
                      <div className="relative">
                        <input 
                          type="number" 
                          value={newOriginalPrice}
                          onChange={(e) => setNewOriginalPrice(e.target.value)}
                          placeholder="Ví dụ: 180000"
                          className="w-full text-slate-800 bg-slate-50/50 border border-slate-200 focus:border-brand-primary focus:bg-white rounded-xl px-4 py-3 font-medium transition-all"
                        />
                        <span className="absolute right-4 top-3 text-slate-400 font-bold text-xs">₫</span>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-black text-slate-700 block uppercase tracking-wider">
                        Đơn vị tính <span className="text-rose-500">*</span>
                      </label>
                      <input 
                        type="text" 
                        required 
                        value={newUnit}
                        onChange={(e) => setNewUnit(e.target.value)}
                        placeholder="Bộ, Cái, Mét, Cuộn..."
                        className="w-full text-slate-800 bg-slate-50/50 border border-slate-200 focus:border-brand-primary focus:bg-white rounded-xl px-4 py-3 font-medium transition-all"
                      />
                    </div>
                  </div>

                  {/* Row 4: Image Code */}
                  <div className="bg-slate-50/40 p-5 rounded-2xl border border-slate-100 space-y-4">
                    <label className="text-xs font-black text-slate-700 block uppercase tracking-wider mb-2">
                      Hình ảnh sản phẩm (Có thể thêm nhiều ảnh)
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div className="space-y-1.5">
                          <span className="text-xs text-slate-500 font-bold">Cách 1: Nhập liên kết (URL) ảnh</span>
                          <div className="flex gap-2">
                            <input 
                              type="text" 
                              value={imageInputVal}
                              onChange={(e) => setImageInputVal(e.target.value)}
                              placeholder="Dán liên kết hình ảnh..."
                              className="flex-1 text-slate-850 bg-white border border-slate-200 focus:border-brand-primary rounded-xl px-4 py-2.5 text-xs font-medium transition-all"
                            />
                            <button
                              type="button"
                              onClick={handlePushImageUrl}
                              className="bg-brand-primary hover:bg-brand-secondary text-white text-xs px-4 py-2 rounded-xl font-extrabold transition-all shrink-0 cursor-pointer"
                            >
                              Thêm
                            </button>
                          </div>
                        </div>
                        <div className="space-y-1.55">
                          <span className="text-xs text-slate-500 font-bold">Cách 2: Tải lên từ máy tính của bạn (Chọn nhiều ảnh được)</span>
                          <label className="flex items-center justify-center gap-2 border-2 border-dashed border-slate-200 hover:border-brand-primary bg-white hover:bg-slate-50 rounded-xl py-3 px-4 cursor-pointer transition-all">
                            <Upload size={16} className="text-slate-400" />
                            <span className="text-xs text-slate-600 font-bold">Chọn các ảnh thiết bị...</span>
                            <input 
                              type="file" 
                              multiple
                              accept="image/*" 
                              onChange={handleProductImagesUpload} 
                              className="hidden" 
                            />
                          </label>
                        </div>
                      </div>

                      <div className="bg-white border border-slate-150 rounded-2xl p-4 min-h-40 flex flex-col justify-start">
                        <span className="text-[11px] font-extrabold text-slate-400 mb-2 block uppercase tracking-wider">
                          Danh sách ảnh ({newImagesList.length} ảnh):
                        </span>
                        
                        {newImagesList.length === 0 ? (
                          <div className="flex-1 flex flex-col items-center justify-center text-center text-slate-400 py-6">
                            <Plus size={28} className="text-slate-300" />
                            <span className="text-xs font-bold block mt-1">Chưa có ảnh nào</span>
                            <span className="text-[10px] text-slate-400 block max-w-[180px] leading-relaxed">Kéo/chọn ảnh từ máy hoặc dán liên kết để xem</span>
                          </div>
                        ) : (
                          <div className="grid grid-cols-3 gap-2 max-h-44 overflow-y-auto">
                            {newImagesList.map((img, idx) => (
                              <div key={idx} className="aspect-square relative group rounded-lg border border-slate-200 overflow-hidden bg-slate-50/50 flex items-center justify-center">
                                <img 
                                  src={img} 
                                  alt={`Product image ${idx + 1}`} 
                                  referrerPolicy="no-referrer"
                                  title="Bấm để xếp làm ảnh đại diện chính"
                                  onClick={() => {
                                    // Make primary
                                    const updated = [...newImagesList];
                                    const selectItem = updated.splice(idx, 1)[0];
                                    updated.unshift(selectItem);
                                    setNewImagesList(updated);
                                  }}
                                  className="max-h-full max-w-full object-contain cursor-pointer"
                                />

                                {idx === 0 ? (
                                  <span className="absolute bottom-1 left-1 bg-brand-primary text-[8px] text-white font-extrabold px-1.5 py-0.5 rounded shadow-sm">
                                    Ảnh chính 🌟
                                  </span>
                                ) : (
                                  <span className="absolute bottom-1 left-1 bg-slate-800/80 text-[8px] text-white font-extrabold px-1 py-0.5 rounded shadow-sm opacity-0 group-hover:opacity-100 transition-opacity">
                                    Xếp #{(idx)}
                                  </span>
                                )}

                                <button 
                                  type="button" 
                                  onClick={() => {
                                    setNewImagesList(newImagesList.filter((_, i) => i !== idx));
                                  }}
                                  className="absolute top-1 right-1 bg-rose-100 hover:bg-rose-200 text-rose-600 p-1 rounded-full transition-all cursor-pointer opacity-0 group-hover:opacity-100"
                                  title="Xóa ảnh"
                                >
                                  <Trash2 size={10} />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Row 5: Description */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-slate-700 block uppercase tracking-wider">
                      Mô tả sản phẩm
                    </label>
                    <textarea 
                      rows={4}
                      value={newDescription}
                      onChange={(e) => setNewDescription(e.target.value)}
                      placeholder="Nhập mô tả chi tiết của sản phẩm. Ví dụ: Được dùng chuyên biệt lắp đặt hệ thống bù áp cho hộ gia đình tại miền tây..."
                      className="w-full text-slate-800 bg-slate-50/50 border border-slate-200 focus:border-brand-primary focus:bg-white rounded-xl px-4 py-3 font-medium transition-all"
                    />
                  </div>

                  {/* Row 6: Technical Specifications */}
                  <div className="space-y-4 bg-slate-50/40 p-5 rounded-2xl border border-slate-100">
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-xs font-black text-slate-700 block uppercase tracking-wider">
                          Thông số kỹ thuật sản phẩm
                        </label>
                        <span className="text-[10px] text-slate-400 block font-semibold">Cung cấp cặp thuộc tính kỹ thuật để bà con dễ theo dõi</span>
                      </div>
                      <button 
                        type="button" 
                        onClick={handleAddSpecRow}
                        className="flex items-center gap-1 text-xs bg-brand-primary/10 hover:bg-brand-primary/20 text-brand-primary px-3 py-1.5 rounded-lg font-black transition-all cursor-pointer animate-none"
                      >
                        <Plus size={14} /> Thêm thông số
                      </button>
                    </div>

                    {newSpecs.length === 0 ? (
                      <div className="text-center py-6 text-xs text-slate-400 font-bold bg-white rounded-xl border border-slate-150 border-dashed">
                        Chưa có thông số kỹ thuật nào. Bấm nút phía trên để bắt đầu thêm.
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {newSpecs.map((spec, index) => (
                          <div key={index} className="flex items-center gap-3">
                            <input 
                              type="text" 
                              required
                              value={spec.key}
                              onChange={(e) => handleUpdateSpecRow(index, 'key', e.target.value)}
                              placeholder="Tên thông số (Ví dụ: Lưu lượng, Áp lực)"
                              className="flex-1 text-slate-800 bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold"
                            />
                            <input 
                              type="text" 
                              required
                              value={spec.value}
                              onChange={(e) => handleUpdateSpecRow(index, 'value', e.target.value)}
                              placeholder="Giá trị (Ví dụ: 30 lít/giờ, 1.5 bar)"
                              className="flex-1 text-slate-800 bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-medium"
                            />
                            <button 
                              type="button"
                              onClick={() => handleRemoveSpecRow(index)}
                              className="bg-red-50 hover:bg-red-100 text-red-600 p-2.5 rounded-xl transition-all cursor-pointer"
                              title="Xóa dòng này"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Status Messages */}
                  {(productSuccessMessage || productErrorMessage) && (
                    <div className="pt-4 space-y-4">
                      {productSuccessMessage && (
                        <motion.div 
                          initial={{ opacity: 0, y: 10 }} 
                          animate={{ opacity: 1, y: 0 }}
                          className="p-4 bg-green-50 text-green-800 rounded-2xl border border-green-150 flex items-start gap-3"
                        >
                          <CheckCircle2 size={20} className="text-green-600 shrink-0 mt-0.5" />
                          <div>
                            <h4 className="font-extrabold text-green-900 mb-1 text-sm">Thêm sản phẩm thành công!</h4>
                            <p className="text-xs text-green-700 opacity-90 font-medium">{productSuccessMessage}</p>
                          </div>
                        </motion.div>
                      )}

                      {productErrorMessage && (
                        <motion.div 
                          initial={{ opacity: 0, y: 10 }} 
                          animate={{ opacity: 1, y: 0 }}
                          className="p-4 bg-rose-50 text-rose-800 rounded-2xl border border-rose-150 flex items-start gap-3"
                        >
                          <AlertCircle size={20} className="text-rose-600 shrink-0 mt-0.5" />
                          <div>
                            <h4 className="font-extrabold text-rose-900 mb-1 text-sm">Cảnh báo lỗi!</h4>
                            <p className="text-xs text-rose-700 opacity-90 font-medium">{productErrorMessage}</p>
                          </div>
                        </motion.div>
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="pt-6 border-t border-slate-100 flex items-center justify-end gap-3 font-sans">
                    <button 
                      type="button"
                      onClick={() => {
                        setActiveTab('orders');
                        setProductSuccessMessage(null);
                        setProductErrorMessage(null);
                      }}
                      className="px-6 py-3 border border-slate-200 text-slate-600 hover:text-slate-800 hover:bg-slate-50 rounded-xl font-bold transition-all text-xs cursor-pointer"
                    >
                      Hủy & Thôi
                    </button>
                    <button 
                      type="submit"
                      disabled={isAddingProduct}
                      className="px-8 py-3 bg-brand-primary hover:bg-brand-secondary text-white rounded-xl font-black uppercase text-xs tracking-wider flex items-center gap-2 transition-all cursor-pointer shadow-lg shadow-brand-primary/20 disabled:opacity-75 disabled:cursor-not-allowed"
                    >
                      {isAddingProduct ? (
                        <>
                          <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-white border-t-transparent inline-block" /> Đang lưu sản phẩm...
                        </>
                      ) : (
                        <>
                          Lưu & Đăng bán <CheckCircle2 size={14} />
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
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
