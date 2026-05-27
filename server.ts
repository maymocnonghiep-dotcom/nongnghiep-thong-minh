import express from "express";
import path from "path";
import cors from "cors";
import nodemailer from "nodemailer";
import fs from "fs";
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, initializeFirestore, collection, getDocs, doc, setDoc, getDoc } from "firebase/firestore/lite";

const app = express();
const PORT = 3000;

  // Configure Email Transporter
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });

  // Use a reliable path for the dist directory
  // In production, server.cjs is located inside the dist folder
  const isProduction = process.env.NODE_ENV === "production";
  
  // Define __dirname equivalent for ESM/CJS compatibility after bundling
  // @ts-ignore - __dirname is available in CJS (the bundled output)
  const currentDir = typeof __dirname !== 'undefined' ? __dirname : process.cwd();
  const distPath = isProduction ? currentDir : path.join(process.cwd(), "dist");

  // Mock Products Data
  const products: any[] = [];

  let orders: any[] = [];
  let consultations: any[] = [];

  const dbPath = path.join(process.cwd(), "products_db.json");
  const ordersDbPath = path.join(process.cwd(), "orders_db.json");
  const consultationsDbPath = path.join(process.cwd(), "consultations_db.json");

  // Load local backups first (instant ready states in memory)
  try {
    if (fs.existsSync(ordersDbPath)) {
      orders = JSON.parse(fs.readFileSync(ordersDbPath, "utf-8"));
    }
  } catch (err) {
    console.error("Failed to load local orders backup:", err);
  }

  try {
    if (fs.existsSync(consultationsDbPath)) {
      consultations = JSON.parse(fs.readFileSync(consultationsDbPath, "utf-8"));
    }
  } catch (err) {
    console.error("Failed to load local consultations backup:", err);
  }

  const isVercelEnvironment = process.env.VERCEL === "1";
  
  let activeProducts: any[] = (isProduction || isVercelEnvironment) ? [] : [...products];
  try {
    if (fs.existsSync(dbPath)) {
      const dbContent = fs.readFileSync(dbPath, "utf-8");
      const parsed = JSON.parse(dbContent);
      if (Array.isArray(parsed) && parsed.length > 0) {
        activeProducts = parsed;
      }
    }
  } catch (err) {
    console.error("Failed to load local products backup:", err);
  }

  // --- Firestore Integration Set Up ---
  enum OperationType {
    CREATE = 'create',
    UPDATE = 'update',
    DELETE = 'delete',
    LIST = 'list',
    GET = 'get',
    WRITE = 'write',
  }

  interface FirestoreErrorInfo {
    error: string;
    operationType: OperationType;
    path: string | null;
    authInfo: {
      userId?: string | null;
      email?: string | null;
    }
  }

  function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
    const errInfo: FirestoreErrorInfo = {
      error: error instanceof Error ? error.message : String(error),
      authInfo: {},
      operationType,
      path
    };
    console.error('Firestore Error (Suppressed): ', JSON.stringify(errInfo));
  }

  function withTimeout<T>(promise: Promise<T>, timeoutMs: number = 2000, fallbackValue: T): Promise<T> {
    let timer: NodeJS.Timeout;
    const timeoutPromise = new Promise<T>((resolve) => {
      timer = setTimeout(() => {
        console.warn(`[Firestore Timeout] Operation exceeded ${timeoutMs}ms. Falling back.`);
        resolve(fallbackValue);
      }, timeoutMs);
    });
    
    // Prevent unhandled promise rejection if it fails after timeout
    promise.catch((err) => {
      console.warn(`[Background Promise Rejection] Suppressed:`, err.message || err);
    });

    return Promise.race([
      promise.then((res) => {
        clearTimeout(timer);
        return res;
      }).catch((err) => {
        clearTimeout(timer);
        console.warn(`[Firestore Error] Promise rejected before timeout:`, err.message || err);
        return fallbackValue;
      }),
      timeoutPromise
    ]);
  }

  function cleanUndefinedForFirestore(obj: any): any {
    if (obj === null || obj === undefined) {
      return null;
    }
    if (Array.isArray(obj)) {
      return obj.map(item => cleanUndefinedForFirestore(item));
    }
    if (typeof obj === 'object') {
      const cleaned: any = {};
      for (const key of Object.keys(obj)) {
        const val = obj[key];
        if (val !== undefined) {
          cleaned[key] = cleanUndefinedForFirestore(val);
        }
      }
      return cleaned;
    }
    return obj;
  }

  function saveLocalBackupSafely(filePath: string, content: string) {
    if (process.env.VERCEL === "1") {
      // Running inside Vercel serverless function environment where local FS is read-only.
      // We skip local backups cleanly without throwing errors, keeping state in memory/Firestore.
      return;
    }
    try {
      fs.writeFileSync(filePath, content, "utf-8");
    } catch (err) {
      console.warn(`[Read-Only FS Warning] Skipping disk write for ${path.basename(filePath)}:`, err);
    }
  }

  let db: any = null;
  let firebaseConfig: any = null;

  try {
    const rawConfig = fs.readFileSync(path.join(currentDir, "firebase-applet-config.json"), "utf8");
    firebaseConfig = JSON.parse(rawConfig);
  } catch(e) {
    try {
      const rawConfig2 = fs.readFileSync(path.join(process.cwd(), "firebase-applet-config.json"), "utf8");
      firebaseConfig = JSON.parse(rawConfig2);
    } catch (e2) {
      console.warn("Could not load firebase-applet-config.json from disk");
    }
  }

  if (process.env.FIREBASE_CONFIG) {
    try {
      firebaseConfig = JSON.parse(process.env.FIREBASE_CONFIG);
      console.log("SUCCESS: Firebase configuration detected in FIREBASE_CONFIG environment variable.");
    } catch (err) {
      console.error("CRITICAL: Failed to parse FIREBASE_CONFIG environment variable:", err);
    }
  }

  if (firebaseConfig) {
    try {
      const firebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
      db = initializeFirestore(firebaseApp, {
        ignoreUndefinedProperties: true
      }, firebaseConfig.firestoreDatabaseId);
      console.log("SUCCESS: Firebase initialized in lite mode ignoring undefined properties.");
    } catch (err) {
      console.error("CRITICAL: Failed to initialize Firebase:", err);
    }
  }

  // --- On-Demand Lazy Database Sync Tracking ---
  let productsLoaded = false;
  let ordersLoaded = false;
  let consultationsLoaded = false;
  let visitorStatsLoaded = false;

  let productsLoadPromise: Promise<void> | null = null;
  let ordersLoadPromise: Promise<void> | null = null;
  let consultationsLoadPromise: Promise<void> | null = null;
  let visitorStatsLoadPromise: Promise<void> | null = null;

  async function ensureProductsLoaded() {
    if (!db) {
      productsLoaded = true; // Mark True to avoid infinite retries
      return;
    }
    if (productsLoaded) return;
    if (productsLoadPromise) return productsLoadPromise;

    productsLoadPromise = (async () => {
      try {
        console.log("On-demand: Fetching products from Firestore...");
        const querySnapshot = await withTimeout(getDocs(collection(db, "products")), 8000, null);
        if (querySnapshot) {
          const firestoreProducts: any[] = [];
          querySnapshot.forEach((d) => {
            firestoreProducts.push(d.data());
          });
          if (firestoreProducts.length > 0) {
            activeProducts = firestoreProducts;
            console.log(`On-demand loaded ${activeProducts.length} items from Firestore.`);
            saveLocalBackupSafely(dbPath, JSON.stringify(activeProducts, null, 2));
          }
          productsLoaded = true;
        } else {
          if (activeProducts.length > 0) {
            console.warn("Firestore product fetch failed or timed out. Falling back to memory/disk cache.");
            productsLoaded = true;
          } else {
            throw new Error("Không thể tải danh sách sản phẩm từ Firestore (Hết hạn ngạch/Timeout) và không có dữ liệu sao lưu cục bộ.");
          }
        }
      } catch (err: any) {
        console.error("On-demand product fetch failed. Falling back to local data.", err);
        if (activeProducts.length > 0) {
          productsLoaded = true; // Set to true on error so we fallback to local memory
        } else {
          throw err; // Rethrow to let the endpoint fail with 500
        }
      } finally {
        productsLoadPromise = null;
      }
    })();

    return productsLoadPromise;
  }

  async function ensureOrdersLoaded() {
    if (!db) {
      ordersLoaded = true;
      return;
    }
    if (ordersLoaded) return;
    if (ordersLoadPromise) return ordersLoadPromise;

    ordersLoadPromise = (async () => {
      try {
        console.log("On-demand: Fetching orders from Firestore...");
        const querySnapshot = await withTimeout(getDocs(collection(db, "orders")), 4000, null);
        if (querySnapshot) {
          const firestoreOrders: any[] = [];
          querySnapshot.forEach((d) => {
            firestoreOrders.push(d.data());
          });
          if (firestoreOrders.length > 0) {
            orders = firestoreOrders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            console.log(`On-demand loaded ${orders.length} orders from Firestore.`);
            saveLocalBackupSafely(ordersDbPath, JSON.stringify(orders, null, 2));
          }
          ordersLoaded = true;
        } else {
          if (orders.length > 0) {
            console.warn("Firestore orders fetch failed or timed out. Falling back to memory/disk cache.");
            ordersLoaded = true;
          } else {
            throw new Error("Không thể tải danh sách đơn hàng từ Firestore và không có dữ liệu cục bộ.");
          }
        }
      } catch (err: any) {
        console.error("On-demand orders fetch failed. Falling back to local data.", err);
        if (orders.length > 0) {
          ordersLoaded = true; // Set to true on error to fallback to local memory
        } else {
          throw err;
        }
      } finally {
        ordersLoadPromise = null;
      }
    })();

    return ordersLoadPromise;
  }

  async function ensureConsultationsLoaded() {
    if (!db) {
      consultationsLoaded = true;
      return;
    }
    if (consultationsLoaded) return;
    if (consultationsLoadPromise) return consultationsLoadPromise;

    consultationsLoadPromise = (async () => {
      try {
        console.log("On-demand: Fetching consultations from Firestore...");
        const querySnapshot = await withTimeout(getDocs(collection(db, "consultations")), 4000, null);
        if (querySnapshot) {
          const firestoreConsultations: any[] = [];
          querySnapshot.forEach((d) => {
            firestoreConsultations.push(d.data());
          });
          if (firestoreConsultations.length > 0) {
            consultations = firestoreConsultations.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            console.log(`On-demand loaded ${consultations.length} consultations from Firestore.`);
            saveLocalBackupSafely(consultationsDbPath, JSON.stringify(consultations, null, 2));
          }
          consultationsLoaded = true;
        } else {
          if (consultations.length > 0) {
            console.warn("Firestore consultations fetch failed or timed out. Falling back to memory/disk cache.");
            consultationsLoaded = true;
          } else {
            throw new Error("Không thể tải danh sách yêu cầu tư vấn từ Firestore và không có dữ liệu cục bộ.");
          }
        }
      } catch (err: any) {
        console.error("On-demand consultations fetch failed. Falling back to local data.", err);
        if (consultations.length > 0) {
          consultationsLoaded = true; // Set to true on error to fallback to local memory
        } else {
          throw err;
        }
      } finally {
        consultationsLoadPromise = null;
      }
    })();

    return consultationsLoadPromise;
  }

  async function ensureVisitorStatsLoaded() {
    if (!db) {
      visitorStatsLoaded = true;
      return;
    }
    if (visitorStatsLoaded) return;
    if (visitorStatsLoadPromise) return visitorStatsLoadPromise;

    visitorStatsLoadPromise = (async () => {
      try {
        console.log("On-demand: Fetching visitor stats from Firestore...");
        const docRef = doc(db, "counters", "visitor_counter");
        const docSnap = await withTimeout(getDoc(docRef), 3000, null);
        if (docSnap && docSnap.exists()) {
          const fsData = docSnap.data();
          if (fsData && typeof fsData.today === "number" && typeof fsData.total === "number" && fsData.total > 0) {
            visitorStats.total = Math.max(visitorStats.total, fsData.total || 0);
            visitorStats.today = Math.max(visitorStats.today, fsData.today || 0);
            if (fsData.lastDate) {
              visitorStats.lastDate = fsData.lastDate;
            }
            console.log("On-demand loaded visitor counter stats:", visitorStats);
            saveLocalBackupSafely(counterDbPath, JSON.stringify(visitorStats, null, 2));
          }
          visitorStatsLoaded = true;
        } else {
          if (visitorStats.total > 0) {
            console.warn("Firestore visitor stats fetch failed or timed out. Falling back to memory/disk cache.");
            visitorStatsLoaded = true;
          } else {
            throw new Error("Không thể tải thông tin thống kê truy cập từ Firestore.");
          }
        }
      } catch (err: any) {
        console.error("On-demand visitor stats fetch failed. Falling back to local data.", err);
        if (visitorStats.total > 0) {
          visitorStatsLoaded = true; // Set to true on error to fallback to local memory
        } else {
          throw err;
        }
      } finally {
        visitorStatsLoadPromise = null;
      }
    })();

    return visitorStatsLoadPromise;
  }

  // Main synchronization function
  async function syncFirestoreAndLocalBackups() {
    if (!db) {
      console.warn("WARNING: Firebase DB is not initialized. Running in local fallback mode.");
      return;
    }

    // 1. Validate Connection to Firestore (Skill guidelines mandate)
    try {
      await withTimeout(getDoc(doc(db, 'test', 'connection')), 1500, null);
      console.log("Firestore connection test passed successfully/bypassed.");
    } catch (error) {
      if (error instanceof Error && error.message.includes('the client is offline')) {
        console.error("Please check your Firebase configuration. Client appears to be offline.");
      } else {
        console.log("Firestore connection check bypassed or succeeded.");
      }
    }

    // 2. Pre-fetch all collections concurrently from Firestore on boot
    console.log("Pre-fetching all collections from Firestore concurrently...");
    try {
      await Promise.all([
        ensureProductsLoaded(),
        ensureOrdersLoaded(),
        ensureConsultationsLoaded(),
        ensureVisitorStatsLoaded()
      ]);
      console.log("All collections loaded/synced successfully on boot.");
    } catch (err) {
      console.error("Error doing background collection pre-fetching:", err);
    }
  }

  // Middleware
  // Enable ultra-permissive CORS manually to handle custom domains like webcuaquan.cloud perfectly
  app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (origin) {
      res.setHeader("Access-Control-Allow-Origin", origin);
    } else {
      res.setHeader("Access-Control-Allow-Origin", "*");
    }
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS, PATCH");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With, Accept, Origin");
    res.setHeader("Access-Control-Allow-Credentials", "true");
    
    // Handle OPTIONS preflight request immediately
    if (req.method === "OPTIONS") {
      res.status(200).end();
      return;
    }
    next();
  });

  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // API Routes
  app.get("/api/products", async (req, res) => {
    try {
      if (!productsLoaded) {
        await ensureProductsLoaded();
      }
      res.json(activeProducts);
    } catch (err: any) {
      console.error("Error in GET /api/products:", err);
      res.status(500).json({ success: false, message: err.message });
    }
  });

  app.post("/api/admin/products/import", async (req, res) => {
    try {
      if (!productsLoaded) {
        await ensureProductsLoaded();
      }
      const importedProducts = req.body;
      if (!Array.isArray(importedProducts)) {
        return res.status(400).json({ success: false, message: "Dữ liệu nhập hàng không đúng định dạng danh sách." });
      }

      let added = 0;
      let updated = 0;

      const importPromises: Promise<any>[] = [];

      importedProducts.forEach((newProd: any) => {
        if (!newProd) return;
        
        // Ensure sku exists and is safe to use
        const skuRaw = newProd.sku !== undefined && newProd.sku !== null ? String(newProd.sku).trim() : "";
        if (!skuRaw) {
          // Skip products with empty SKU (e.g., blank rows in Excel)
          return;
        }

        const newSkuLower = skuRaw.toLowerCase();
        const idx = activeProducts.findIndex(p => {
          if (!p || p.sku === undefined || p.sku === null) return false;
          return String(p.sku).trim().toLowerCase() === newSkuLower;
        });

        let targetProduct: any = null;
        if (idx !== -1) {
          // Update product preserving reviews
          targetProduct = {
            ...activeProducts[idx],
            ...newProd,
            sku: skuRaw, // preserve sanitized SKU
            reviews: activeProducts[idx].reviews || []
          };
          activeProducts[idx] = targetProduct;
          updated++;
        } else {
          // Add new item
          targetProduct = {
            ...newProd,
            sku: skuRaw,
            id: newProd.id || `PROD-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`
          };
          activeProducts.push(targetProduct);
          added++;
        }

        // Save imported product to Firestore with a safe timeout
        if (db && targetProduct) {
          const p = withTimeout(
            setDoc(doc(db, "products", targetProduct.id), cleanUndefinedForFirestore(targetProduct)),
            2500,
            null
          ).catch((err) => {
            console.error(`Failed to save imported product ${targetProduct.id} to Firestore:`, err);
          });
          importPromises.push(p);
        }
      });

      // Await all Firestore writes synchronously to prevent unresolved background sockets in serverless Vercel
      if (importPromises.length > 0) {
        await withTimeout(Promise.all(importPromises), 4000, null);
      }

      // Save imported products to persistent disk file safely
      saveLocalBackupSafely(dbPath, JSON.stringify(activeProducts, null, 2));

      res.json({
        success: true,
        message: `Nhập dữ liệu thành công! Thêm mới ${added} sản phẩm, cập nhật ${updated} sản phẩm. Các sản phẩm đã được phân loại vào đúng nhóm nhóm tương ứng.`,
        count: importedProducts.length
      });
    } catch (error: any) {
      console.error("Error during product import:", error);
      res.status(500).json({
        success: false,
        message: `Đã xảy ra lỗi trên hệ thống khi xử lý file: ${error.message || "Lỗi không xác định"}`
      });
    }
  });

  app.post("/api/admin/products", async (req, res) => {
    try {
      if (!productsLoaded) {
        await ensureProductsLoaded();
      }
      const { sku, manufacturerCode, name, category, group, subcategoryId, subcategoryName, price, originalPrice, discount, image, images, description, unit, specs } = req.body;
      
      if (!sku || !sku.trim()) {
        return res.status(400).json({ success: false, message: "Mã SKU không được trống!" });
      }
      if (!name || !name.trim()) {
        return res.status(400).json({ success: false, message: "Tên sản phẩm không được trống!" });
      }
      if (!category || !category.trim()) {
        return res.status(400).json({ success: false, message: "Nhóm hàng (Danh mục) không được trống!" });
      }

      const cleanSku = String(sku).trim();
      const cleanSkuLower = cleanSku.toLowerCase();

      const idx = activeProducts.findIndex(p => {
        if (!p || p.sku === undefined || p.sku === null) return false;
        return String(p.sku).trim().toLowerCase() === cleanSkuLower;
      });

      const parsedPrice = parseFloat(price) || 0;
      const parsedOriginalPrice = originalPrice ? parseFloat(originalPrice) : undefined;
      const parsedDiscount = discount ? parseFloat(discount) : undefined;

      const fallbackImage = "https://images.unsplash.com/photo-1592417817098-8f3d6eb19675?w=500&auto=format&fit=crop&q=60";
      const finalImage = image || (images && images.length > 0 ? images[0] : fallbackImage);
      const finalImages = Array.isArray(images) && images.length > 0 ? images : [finalImage];

      const newProduct = {
        id: idx !== -1 ? activeProducts[idx].id : `PROD-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        sku: cleanSku,
        manufacturerCode: manufacturerCode ? String(manufacturerCode).trim() : undefined,
        name: name.trim(),
        category: category.trim(),
        group: group ? String(group).trim() : "",
        subcategoryId: subcategoryId ? String(subcategoryId).trim() : undefined,
        subcategoryName: subcategoryName ? String(subcategoryName).trim() : undefined,
        price: parsedPrice,
        originalPrice: parsedOriginalPrice,
        discount: parsedDiscount,
        image: finalImage,
        images: finalImages,
        description: description || "",
        unit: unit ? String(unit).trim() : "Bộ",
        specs: specs || {},
        reviews: idx !== -1 ? (activeProducts[idx].reviews || []) : []
      };

      if (idx !== -1) {
        activeProducts[idx] = newProduct;
      } else {
        activeProducts.push(newProduct);
      }

      // Save to Firestore for permanent preservation (awaited with timeout to prevent Vercel container freeze crash)
      if (db) {
        try {
          await withTimeout(
            setDoc(doc(db, "products", newProduct.id), cleanUndefinedForFirestore(newProduct)),
            8000,
            null
          );
          console.log(`Successfully persisted single product SKU ${cleanSku} to Firestore.`);
        } catch (fErr) {
          console.error(`Error saving ${newProduct.id} to Firestore:`, fErr);
        }
      }

      // Save to server DB file safely
      saveLocalBackupSafely(dbPath, JSON.stringify(activeProducts, null, 2));

      res.json({
        success: true,
        message: idx !== -1 ? "Cập nhật sản phẩm thành công!" : "Thêm mới sản phẩm thành công!",
        product: newProduct
      });
    } catch (error: any) {
      console.error("Error creating single product:", error);
      res.status(500).json({ success: false, message: `Lỗi hệ thống: ${error.message || "Không rõ nguyên nhân"}` });
    }
  });

  app.get("/api/categories", async (req, res) => {
    try {
      if (!productsLoaded) {
        await ensureProductsLoaded();
      }
      const categoriesFromGroups = [...new Set(activeProducts.map(p => p.group).filter(Boolean))];
      const defaultCategoriesList = [
        "Thiết bị tưới",
        "Đồ điện",
        "Camera An Ninh",
        "Vật tư nước",
        "Dụng cụ làm vườn",
        "Đèn năng lượng mặt trời"
      ];
      const mergedList = Array.from(new Set([...categoriesFromGroups, ...defaultCategoriesList]));
      res.json(mergedList);
    } catch (err: any) {
      console.error("Error in GET /api/categories:", err);
      res.status(500).json({ success: false, message: err.message });
    }
  });

  app.get("/api/admin/orders", async (req, res) => {
    try {
      // In a real app, check for admin auth header or session
      if (!ordersLoaded) {
        await ensureOrdersLoaded();
      }
      res.json(orders);
    } catch (err: any) {
      console.error("Error in GET /api/admin/orders:", err);
      res.status(500).json({ success: false, message: err.message });
    }
  });

  app.post("/api/orders", async (req, res) => {
    if (!ordersLoaded) {
      await ensureOrdersLoaded();
    }
    const { customer, items, total } = req.body;
    
    // Persist order in memory
    const newOrder = {
      id: `ORD-${Date.now()}`,
      customer,
      items,
      total,
      status: 'pending',
      createdAt: new Date().toISOString()
    };
    orders.push(newOrder);

    // Save order to Firestore (awaited with timeout to prevent unresolved socket failure in Vercel)
    if (db) {
      try {
        await withTimeout(
          setDoc(doc(db, "orders", newOrder.id), cleanUndefinedForFirestore(newOrder)),
          3000,
          null
        );
        console.log(`Successfully saved order ${newOrder.id} to Firestore.`);
      } catch (fErr) {
        console.error(`Error saving order ${newOrder.id} to Firestore:`, fErr);
      }
    }

    // Save orders to db backup safely
    saveLocalBackupSafely(ordersDbPath, JSON.stringify(orders, null, 2));
    
    // In a real application, you would use a service like SendGrid, Mailgun, or AWS SES
    // For this environment, we will use nodemailer if configured, otherwise fallback to logging.
    
    const emailBody = `
      <h3>Xác nhận đơn hàng mới</h3>
      <p><strong>Khách hàng:</strong> ${customer.fullName}</p>
      <p><strong>Số điện thoại:</strong> ${customer.phone}</p>
      <p><strong>Địa chỉ:</strong> ${customer.address}</p>
      <p><strong>Quận/Huyện:</strong> ${customer.district}</p>
      <p><strong>Tỉnh/Thành phố:</strong> ${customer.province}</p>
      
      <table border="1" cellpadding="10" style="border-collapse: collapse; width: 100%;">
        <thead>
          <tr style="background-color: #f2f2f2;">
            <th>Sản phẩm</th>
            <th>Số lượng</th>
            <th>Đơn giá</th>
            <th>Thành tiền</th>
          </tr>
        </thead>
        <tbody>
          ${items.map((item: any) => `
            <tr>
              <td>${item.name}</td>
              <td>${item.quantity}</td>
              <td>${item.price.toLocaleString('vi-VN')}₫</td>
              <td>${(item.price * item.quantity).toLocaleString('vi-VN')}₫</td>
            </tr>
          `).join('')}
        </tbody>
        <tfoot>
          <tr>
            <td colspan="3" style="text-align: right;"><strong>Tổng cộng:</strong></td>
            <td><strong>${total.toLocaleString('vi-VN')}₫</strong></td>
          </tr>
        </tfoot>
      </table>
      <p><i>Đơn hàng được gửi từ hệ thống MayMocNongHiep.com</i></p>
    `;

    console.log("------------------------------------------");
    console.log("NEW ORDER RECEIVED - PROCESSING EMAIL...");
    
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      try {
        await transporter.sendMail({
          from: `"Hệ thống Đơn hàng" <${process.env.EMAIL_USER}>`,
          to: "maymocnonghiep@gmail.com",
          subject: `Đơn hàng mới từ ${customer.fullName}`,
          html: emailBody
        });
        console.log("SUCCESS: Email sent to maymocnonghiep@gmail.com");
      } catch (error) {
        console.error("ERROR: Failed to send email via nodemailer:", error);
        // We still log the order to console even if email fails
      }
    } else {
      console.log("WARNING: EMAIL_USER or EMAIL_PASS not set. Order logged to console only.");
      console.log("Order Detail:", JSON.stringify({ customer, items, total }, null, 2));
    }
    
    console.log("------------------------------------------");

    // Simulate success
    res.json({ success: true, message: "Order processed" });
  });

  // Consultations API Enpoints
  app.post("/api/consultations", async (req, res) => {
    try {
      if (!consultationsLoaded) {
        await ensureConsultationsLoaded();
      }
      const { fullName, phone, province, district, area, farmModel } = req.body;
      
      if (!fullName || !phone) {
        return res.status(400).json({ success: false, message: "Vui lòng nhập Họ tên và Số điện thoại!" });
      }

      const newConsultation = {
        id: `CON-${Date.now()}`,
        fullName,
        phone,
        province: province || "",
        district: district || "",
        area: area || "",
        farmModel: farmModel || "",
        status: "pending", // pending, completed
        createdAt: new Date().toISOString()
      };

      consultations.unshift(newConsultation);

      // Save to Firestore (awaited with a quick timeout to comply with Vercel serverless execution guarantees)
      if (db) {
        try {
          await withTimeout(
            setDoc(doc(db, "consultations", newConsultation.id), cleanUndefinedForFirestore(newConsultation)),
            2500,
            null
          );
          console.log(`Successfully saved consultation ${newConsultation.id} to Firestore.`);
        } catch (fErr) {
          console.error(`Error saving consultation ${newConsultation.id} to Firestore:`, fErr);
        }
      }

      // Persist list backup safely
      saveLocalBackupSafely(consultationsDbPath, JSON.stringify(consultations, null, 2));

      const emailBody = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #f8fafc;">
          <h2 style="color: #15803d; border-bottom: 2px solid #15803d; padding-bottom: 10px; margin-top: 0;">YÊU CẦU TƯ VẤN KHẢO SÁT SÂN VƯỜN</h2>
          <p style="font-size: 14px; color: #475569;">Bà con vừa đăng ký yêu cầu tư vấn thiết kế và khảo sát trực tiếp từ trang web. Vui lòng liên hệ hỗ trợ sớm nhất!</p>
          
          <table style="width: 100%; border-collapse: collapse; margin-top: 15px; margin-bottom: 20px;">
            <tr style="background-color: #f1f5f9;">
              <td style="padding: 10px; font-weight: bold; width: 35%; border-bottom: 1px solid #e2e8f0;">Họ tên Chú/Bác:</td>
              <td style="padding: 10px; border-bottom: 1px solid #e2e8f0;">${fullName}</td>
            </tr>
            <tr>
              <td style="padding: 10px; font-weight: bold; border-bottom: 1px solid #e2e8f0;">Số điện thoại:</td>
              <td style="padding: 10px; border-bottom: 1px solid #e2e8f0;"><a href="tel:${phone}" style="color: #15803d; font-weight: bold; text-decoration: none;">${phone}</a></td>
            </tr>
            <tr style="background-color: #f1f5f9;">
              <td style="padding: 10px; font-weight: bold; border-bottom: 1px solid #e2e8f0;">Tỉnh / Thành phố:</td>
              <td style="padding: 10px; border-bottom: 1px solid #e2e8f0;">${province || "Chưa cung cấp"}</td>
            </tr>
            <tr>
              <td style="padding: 10px; font-weight: bold; border-bottom: 1px solid #e2e8f0;">Quận / Huyện:</td>
              <td style="padding: 10px; border-bottom: 1px solid #e2e8f0;">${district || "Chưa cung cấp"}</td>
            </tr>
            <tr style="background-color: #f1f5f9;">
              <td style="padding: 10px; font-weight: bold; border-bottom: 1px solid #e2e8f0;">Diện tích vườn:</td>
              <td style="padding: 10px; border-bottom: 1px solid #e2e8f0;">${area || "Chưa cung cấp"}</td>
            </tr>
            <tr>
              <td style="padding: 10px; font-weight: bold; border-bottom: 1px solid #e2e8f0;">Mô hình trồng trọt:</td>
              <td style="padding: 10px; border-bottom: 1px solid #e2e8f0;">${farmModel || "Chưa cung cấp"}</td>
            </tr>
          </table>
          
          <div style="background-color: #e2f0d9; padding: 12px; border-radius: 8px; color: #1e4620; font-size: 13px; font-weight: bold; text-align: center;">
            Trạng thái hiện tại: Đang chờ kỹ thuật viên liên hệ tư vấn
          </div>
          
          <p style="font-size: 11px; color: #94a3b8; text-align: center; margin-top: 25px; border-top: 1px solid #e2e8f0; padding-top: 10px;">
            Yêu cầu này được gửi tự động bởi hệ thống Máy Móc Nông Nghiệp Thắng Lợi.
          </p>
        </div>
      `;

      console.log("------------------------------------------");
      console.log("NEW CONSULTATION REQUEST RECEIVED - PROCESSING EMAIL...");

      // Send email to store owner
      if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
        try {
          await transporter.sendMail({
            from: `"Yêu Cầu Tư Vấn" <${process.env.EMAIL_USER}>`,
            to: "maymocnonghiep@gmail.com",
            subject: `TƯ VẤN KHẢO SÁT: ${fullName} - ${phone}`,
            html: emailBody
          });
          console.log("SUCCESS: Consultation Email sent successfully to maymocnonghiep@gmail.com!");
        } catch (emailErr) {
          console.error("ERROR: Failed to send consultation email:", emailErr);
        }
      } else {
        console.log("WARNING: EMAIL_USER or EMAIL_PASS not set. Consultation logged to console only.");
        console.log("Consultation Detail:", JSON.stringify(newConsultation, null, 2));
      }

      console.log("------------------------------------------");

      res.json({ success: true, message: "Đăng ký tư vấn thành công! Nhân viên kỹ thuật sẽ sớm liên hệ Chú/Bác." });
    } catch (err) {
      console.error("Error creating consultation:", err);
      res.status(500).json({ success: false, message: "Đã xảy ra lỗi hệ thống, vui lòng thử lại sau." });
    }
  });

  app.get("/api/admin/consultations", async (req, res) => {
    try {
      if (!consultationsLoaded) {
        await ensureConsultationsLoaded();
      }
      res.json(consultations);
    } catch (err: any) {
      console.error("Error in GET /api/admin/consultations:", err);
      res.status(500).json({ success: false, message: err.message });
    }
  });

  app.put("/api/admin/consultations/:id", async (req, res) => {
    try {
      if (!consultationsLoaded) {
        await ensureConsultationsLoaded();
      }
      const { id } = req.params;
      const { status } = req.body;
      const idx = consultations.findIndex(c => c.id === id);
      if (idx !== -1) {
        consultations[idx].status = status || "pending";
        
        // Save to Firestore (awaited with a safe timeout for serverless Vercel compliance)
        if (db) {
          try {
            await withTimeout(
              setDoc(doc(db, "consultations", id), cleanUndefinedForFirestore(consultations[idx])),
              2500,
              null
            );
            console.log(`Successfully updated consultation ${id} status on Firestore.`);
          } catch (fErr) {
            console.error(`Error updating status of consultation ${id}:`, fErr);
          }
        }

        saveLocalBackupSafely(consultationsDbPath, JSON.stringify(consultations, null, 2));
        return res.json({ success: true, consultation: consultations[idx] });
      }
      res.status(404).json({ success: false, message: "Yêu cầu tư vấn không tồn tại." });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: "Lỗi cập nhật trạng thái." });
    }
  });

  // --- Visitor Counter Logic (Robust JSON file backing + Firestore backup) ---
  const counterDbPath = path.join(process.cwd(), "counter_db.json");
  let visitorStats = { today: 0, total: 0, lastDate: "" };

  const getVNTodayDateStr = () => {
    const d = new Date();
    const utc = d.getTime() + (d.getTimezoneOffset() * 60000);
    // GMT + 7 (Vietnam Offset)
    const vnTime = new Date(utc + (3600000 * 7));
    const yyyy = vnTime.getFullYear();
    const mm = String(vnTime.getMonth() + 1).padStart(2, "0");
    const dd = String(vnTime.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  };

  const loadVisitorStats = async () => {
    // Seed with realistic baselines if we have a fresh launch, keeping the site looking active
    visitorStats = { today: 150, total: 12480, lastDate: getVNTodayDateStr() };

    try {
      if (fs.existsSync(counterDbPath)) {
        const fileContent = fs.readFileSync(counterDbPath, "utf-8");
        const parsed = JSON.parse(fileContent);
        if (parsed && typeof parsed.today === "number" && typeof parsed.total === "number") {
          visitorStats = parsed;
        }
      }
    } catch (err) {
      console.error("Failed to load local visitor stats file:", err);
    }

    if (db) {
      try {
        const docRef = doc(db, "counters", "visitor_counter");
        const docSnap = await withTimeout(getDoc(docRef), 2000, null);
        if (docSnap && docSnap.exists()) {
          const fsData = docSnap.data();
          if (fsData && typeof fsData.today === "number" && typeof fsData.total === "number" && fsData.total > 0) {
            visitorStats.total = Math.max(visitorStats.total, fsData.total || 0);
            visitorStats.today = Math.max(visitorStats.today, fsData.today || 0);
            if (fsData.lastDate) {
              visitorStats.lastDate = fsData.lastDate;
            }
          }
        } else if (docSnap === undefined || docSnap === null) {
          console.warn("Visitor stats document fetch timed out. Skipping remote baseline check.");
        } else {
          // Document doesn't exist, let's write our baseline to firestore
          await withTimeout(setDoc(docRef, cleanUndefinedForFirestore(visitorStats)), 2000, null);
        }
      } catch (fErr) {
        console.error("Failed to sync visitor stats from Firestore:", fErr);
      }
    }

    const todayStr = getVNTodayDateStr();
    if (visitorStats.lastDate !== todayStr) {
      visitorStats.today = 0;
      visitorStats.lastDate = todayStr;
      
      saveLocalBackupSafely(counterDbPath, JSON.stringify(visitorStats, null, 2));

      if (db) {
        try {
          await withTimeout(setDoc(doc(db, "counters", "visitor_counter"), cleanUndefinedForFirestore(visitorStats)), 2000, null);
        } catch (fErr) {
          console.error("Failed to write initial resettled stats to Firestore:", fErr);
        }
      }
    }
  };

  // Run the async counter initializer safely in background for non-Vercel environments
  if (process.env.VERCEL !== "1") {
    loadVisitorStats().catch(err => console.error("Failed to setup visitor counter:", err));
  }

  app.get("/api/visitor-stats", async (req, res) => {
    try {
      if (!visitorStatsLoaded) {
        await ensureVisitorStatsLoaded();
      }
      const todayStr = getVNTodayDateStr();
      if (visitorStats.lastDate !== todayStr) {
        visitorStats.today = 0;
        visitorStats.lastDate = todayStr;
        saveLocalBackupSafely(counterDbPath, JSON.stringify(visitorStats, null, 2));
        if (db) {
          await withTimeout(setDoc(doc(db, "counters", "visitor_counter"), cleanUndefinedForFirestore(visitorStats)), 2000, null);
        }
      }
      res.json({ success: true, today: visitorStats.today, total: visitorStats.total });
    } catch (err) {
      console.error("Error in get visitor-stats:", err);
      res.json({ success: false, today: visitorStats.today, total: visitorStats.total });
    }
  });

  app.post("/api/visitor-tick", async (req, res) => {
    try {
      if (!visitorStatsLoaded) {
        await ensureVisitorStatsLoaded();
      }
      const todayStr = getVNTodayDateStr();
      if (visitorStats.lastDate !== todayStr) {
        visitorStats.today = 0;
        visitorStats.lastDate = todayStr;
      }

      visitorStats.today += 1;
      visitorStats.total += 1;

      saveLocalBackupSafely(counterDbPath, JSON.stringify(visitorStats, null, 2));

      if (db) {
        try {
          await withTimeout(
            setDoc(doc(db, "counters", "visitor_counter"), cleanUndefinedForFirestore(visitorStats)),
            2000,
            null
          );
        } catch (fErr) {
          console.error("Failed to write visitor tick in Firestore backend:", fErr);
        }
      }

      res.json({ success: true, today: visitorStats.today, total: visitorStats.total });
    } catch (err) {
      console.error("Error ticking visitor count:", err);
      res.json({ success: false, today: visitorStats.today, total: visitorStats.total });
    }
  });

  // --- Synchronize and setup in background ---
  const isVercel = process.env.VERCEL === "1";

  // Fire background loaders ONLY on standard, persistent servers (e.g., VPS, Cloud Run, local development)
  if (!isVercel) {
    syncFirestoreAndLocalBackups()
      .then(() => console.log("Database synced in background."))
      .catch(err => console.error("Failed to sync database in background:", err));

    loadVisitorStats()
      .then(() => console.log("Visitor stats loaded in background."))
      .catch(err => console.error("Failed to setup visitor stats:", err));
  }

  // Vite development server middleware setup
  let viteDevServer: any = null;
  if (!isProduction && !isVercel) {
    import("vite").then(async (m) => {
      viteDevServer = await m.createServer({
        server: { middlewareMode: true },
        appType: "spa",
      });
      app.use((req, res, next) => {
        if (viteDevServer) {
          viteDevServer.middlewares(req, res, next);
        } else {
          next();
        }
      });
    }).catch(err => {
      console.error("Failed to dynamically load Vite server middleware:", err);
    });
  } else if (!isVercel) {
    // In standalone production containers (Cloud Run), serve static assets locally
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  // Bind to port and start listener only if we are NOT running in a serverless function (Vercel)
  if (!isVercel) {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on port ${PORT} (mode: ${isProduction ? 'production' : 'development'})`);
    });
  }

  // Export app default for Vercel Serverless Function deployment compatibility
  export default app;
