/**
 * Optimizes image URLs from various common hosting platforms/CDNs
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
  // Strips the "-300x300" (or any size) suffix to fetch the original high-resolution image
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
 * Compresses an image file to a maximum width/height and quality
 * using Canvas API, returned as a base64 DataURL.
 */
export function compressImage(file: File, maxWidth = 800, maxHeight = 800, quality = 0.75): Promise<string> {
  return new Promise((resolve, reject) => {
    // Only compress typical image MIME types
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
        let width = img.width;
        let height = img.height;

        // Calculate new dimensions to fit max box
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(event.target?.result as string || '');
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        // Convert page element to relative quality jpeg
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      };
      img.onerror = () => {
        // Fallback to original read if image load fails
        resolve(event.target?.result as string || '');
      };
      img.src = event.target?.result as string || '';
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}

/**
 * Trấn an và xử lý việc định tuyến API trên domain tùy chỉnh (ví dụ: Vercel, webcuaquan.cloud).
 * Trả về endpoint tuyệt đối trỏ trực tiếp về máy chủ backend Cloud Run để làm việc mượt mà.
 */
export function getApiUrl(path: string): string {
  if (typeof window === 'undefined') {
    return path;
  }
  
  const hostname = window.location.hostname;
  const isLocalOrInternal = 
    hostname.includes('run.app') || 
    hostname.includes('localhost') || 
    hostname === '127.0.0.1' || 
    hostname === '0.0.0.0';
    
  if (isLocalOrInternal) {
    return path;
  }

  // Nếu người dùng chạy trên tên miền riêng webcuaquan.cloud (hoặc Vercel)
  // Ta trỏ thẳng địa chỉ gọi API về Backend chạy trên Cloud Run của dự án
  const backendBase = 'https://ais-pre-iypgaasmwdebqn5f6huc5b-326482920860.asia-southeast1.run.app';
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${backendBase}${cleanPath}`;
}


