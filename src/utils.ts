/**
 * Optimizes picture URLs from various common hosting platforms/CDNs
 * (WordPress/WooCommerce, Google Photos/Drive, Sapo, Haravan, Shopify, Unsplash, etc.)
 * to load the highest possible resolution instead of a blurry thumbnail.
 */
export function getHighResImageUrl(url: string | undefined | null): string {
  if (!url) return 'https://images.unsplash.com/photo-1615811361523-6bd03d7748e7?w=1200&q=95';

  let optimized = url.trim();

  // 1. Unsplash: optimize width and quality parameters
  if (optimized.includes('images.unsplash.com') || optimized.includes('plus.unsplash.com')) {
    optimized = optimized
      .replace(/w=\d+/, 'w=1200')
      .replace(/width=\d+/, 'width=1200')
      .replace(/q=\d+/, 'q=95');
    if (!optimized.includes('w=') && !optimized.includes('width=')) {
      optimized += (optimized.includes('?') ? '&' : '?') + 'w=1200&q=95';
    }
    return optimized;
  }

  // 2. Google User Content / Google Photos: replace size parameters like =s150, =s320, =w150-h150, =w300 with =s0 (original quality)
  if (optimized.includes('googleusercontent.com') || optimized.includes('ggpht.com')) {
    // Match patterns like =s300, =w300, =h300, =w300-h300, =w300-h300-p, =s300-c, etc. at the end of URL
    optimized = optimized.replace(/=(s|w|h)\d+([-hws\d-]*[a-zA-Z]*)?$/, '=s0');
    // Match /s150/ or /s320/ format in paths
    optimized = optimized.replace(/\/s\d+\//, '/s0/');
    return optimized;
  }

  // 3. WordPress / WooCommerce thumbnails (e.g., filename-300x300.jpg, filename-150x150.jpg, filename-600x600.jpg)
  // Strips the "-300x300" (or any size) suffix to fetch the original high-resolution picture
  const wpRegex = /-([0-9]+)x([0-9]+)\.(jpe?g|png|gif|webp|bmp|PNG|JPG|JPEG|WEBP)$/;
  if (wpRegex.test(optimized)) {
    optimized = optimized.replace(wpRegex, (match, w, h, ext) => {
      // Small check to make sure it's a typical thumbnail (usually width and height are small or medium, up to 1000px)
      const width = parseInt(w, 10);
      const height = parseInt(h, 10);
      if (width <= 1000 && height <= 1000) {
        return `.${ext}`;
      }
      return match;
    });
  }

  // 4. Sapo, Haravan, Shopify, Shopee & other platforms using common suffix-based thumbnail naming
  // Common patterns are suffix_thumb.jpg, suffix_medium.png, suffix_100x100.jpg, suffix_300x.jpg
  // We strip these suffixes or replace them with original/master
  const commonSuffixes = [
    '_thumb', '_compact', '_medium', '_large', '_grande', '_icon', '_small',
    '_100x100', '_240x240', '_300x300', '_480x480', '_600x600', '_1024x1024', '_2048x2048',
    '_300x', '_400x', '_500x', '_600x', '_800x', '_1020x', '_1200x', '_1600x'
  ];
  
  for (const suffix of commonSuffixes) {
    const regex = new RegExp(`${suffix}\\.(jpe?g|png|gif|webp|PNG|JPG|JPEG|WEBP)$`, 'i');
    if (regex.test(optimized)) {
      // For Shopify/Haravan, keeping _master or stripping suffix fetches the original
      if (optimized.includes('cdn.shopify.com') || optimized.includes('haravan.com') || optimized.includes('hstatic.net')) {
        optimized = optimized.replace(regex, '_master.$1');
      } else {
        optimized = optimized.replace(regex, '.$1');
      }
      break;
    }
  }

  return optimized;
}

/**
 * Compresses an picture file to a maximum width/height and quality
 * using Canvas API, returned as a base64 DataURL.
 */
export function compressImage(file: File, maxWidth = 1920, maxHeight = 1920, quality = 0.90): Promise<string> {
  return new Promise((resolve, reject) => {
    // Chỉ xử lý các tệp ảnh thông thường
    if (!file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (event) => resolve(event.target?.result as string || '');
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const originalWidth = img.width;
        const originalHeight = img.height;

        // Định cấu hình các bước thử nghiệm (Quality & Resolution) giảm dần để giữ độ nét tốt nhất mà vẫn < 500KB
        // Bắt đầu từ chất lượng cực sắc nét (Full HD, 90% quality)
        const passes = [
          { maxDim: 1920, q: 0.90 },
          { maxDim: 1600, q: 0.85 },
          { maxDim: 1440, q: 0.80 },
          { maxDim: 1200, q: 0.75 },
          { maxDim: 1000, q: 0.70 },
          { maxDim: 800, q: 0.65 },
          { maxDim: 640, q: 0.60 }
        ];

        let bestResult = '';
        let lastSize = Infinity;
        const MAX_BYTES = 490 * 1024; // ~ 501,760 bytes (bảo thủ dưới 500KB)

        for (let i = 0; i < passes.length; i++) {
          const { maxDim, q } = passes[i];
          
          let width = originalWidth;
          let height = originalHeight;

          // Tính toán kích thước mới dựa trên maxDim
          if (width > height) {
            if (width > maxDim) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            }
          } else {
            if (height > maxDim) {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            continue;
          }

          // Vẽ ảnh để tối ưu hóa nét vẽ trên canvas
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, width, height);

          const dataUrl = canvas.toDataURL('image/jpeg', q);
          
          // Tính toán kích thước thực tế của chuỗi base64 (3 bytes cho mỗi 4 ký tự base64)
          const base64Content = dataUrl.split(',')[1] || '';
          const byteSize = Math.floor((base64Content.length * 3) / 4);

          bestResult = dataUrl;
          lastSize = byteSize;

          // Nếu kích thước đã xuống dưới 500KB, kết thúc và lấy kết cấu ảnh tối ưu này ngay lập tức!
          if (byteSize <= MAX_BYTES) {
            console.log(`[compressImage] Đã tối ưu hóa ảnh thành công ở bước ${i+1}: kích thước ${width}x${height}, chất lượng nén ${Math.round(q * 100)}%, dung lượng thực tế: ${(byteSize / 1024).toFixed(1)}KB (Dưới mốc giới hạn 500KB).`);
            resolve(dataUrl);
            return;
          }
        }

        // Nếu tất cả các bước thử đều lớn hơn 500KB (trường hợp cực kỳ hiếm đối với ảnh JPEG độ phân giải thấp),
        // lấy kết quả cuối cùng gọn nhẹ nhất.
        console.warn(`[compressImage] Không thể ép ảnh xuống dưới 500KB dù đã thử mọi cấu hình. Lấy bản cấu hình tối thiểu chất lượng tốt nhất có thể, dung lượng: ${(lastSize / 1024).toFixed(1)}KB.`);
        resolve(bestResult || event.target?.result as string || '');
      };
      img.onerror = () => {
        resolve(event.target?.result as string || '');
      };
      img.src = event.target?.result as string || '';
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}

/**
 * Định tuyến API tự động trên các môi trường.
 * - Trả về đường dẫn relative (ví dụ: '/api/products') để trình duyệt tự động gọi về máy chủ phục vụ tương ứng.
 * - Khi chạy trên Vercel (webcuaquan.cloud) hoặc local, việc gọi cùng domain gốc loại bỏ triệt để mọi lỗi CORS và tăng tốc độ kết nối.
 */
export function getApiUrl(path: string): string {
  return path;
}

// Safe web storage helper to catch QuotaExceededError or SecurityError gracefully
export const safeLocalStorage = {
  getItem(key: string): string | null {
    try {
      return localStorage.getItem(key);
    } catch (e) {
      return (window as any).__v_fallback_local?.[key] || null;
    }
  },
  setItem(key: string, value: string): void {
    try {
      localStorage.setItem(key, value);
    } catch (e) {
      console.warn(`[safeLocalStorage] Failed to set "${key}": Limit exceeded or security error. Using in-memory fallback.`, e);
      if (!(window as any).__v_fallback_local) {
        (window as any).__v_fallback_local = {};
      }
      (window as any).__v_fallback_local[key] = value;
    }
  },
  removeItem(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch (e) {}
    if ((window as any).__v_fallback_local) {
      delete (window as any).__v_fallback_local[key];
    }
  }
};

export const safeSessionStorage = {
  getItem(key: string): string | null {
    try {
      return sessionStorage.getItem(key);
    } catch (e) {
      return (window as any).__v_fallback_session?.[key] || null;
    }
  },
  setItem(key: string, value: string): void {
    try {
      sessionStorage.setItem(key, value);
    } catch (e) {
      console.warn(`[safeSessionStorage] Failed to set "${key}": Limit exceeded or security error. Using in-memory fallback.`, e);
      if (!(window as any).__v_fallback_session) {
        (window as any).__v_fallback_session = {};
      }
      (window as any).__v_fallback_session[key] = value;
    }
  },
  removeItem(key: string): void {
    try {
      sessionStorage.removeItem(key);
    } catch (e) {}
    if ((window as any).__v_fallback_session) {
      delete (window as any).__v_fallback_session[key];
    }
  }
};



