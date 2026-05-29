import { initializeApp, getApps, getApp } from "firebase/app";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { getFirestore, initializeFirestore, collection, getDocs, doc, updateDoc } from "firebase/firestore/lite";
import fs from "fs";
import path from "path";

async function runMigration() {
  const configPath = path.join(process.cwd(), "firebase-applet-config.json");
  const rawConfig = fs.readFileSync(configPath, "utf8");
  const firebaseConfig = JSON.parse(rawConfig);

  const oldBucketName = "titanium-leaf-s07pf.firebasestorage.app";
  const newBucketName = "titanium-leaf-s07pf";

  // Init app
  const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

  // Storage
  const oldStorage = getStorage(app, `gs://${oldBucketName}`);
  const newStorage = getStorage(app, `gs://${newBucketName}`);

  // Firestore
  const db = initializeFirestore(app, {
    ignoreUndefinedProperties: true
  }, firebaseConfig.firestoreDatabaseId);

  console.log("=== BẮT ĐẦU MIGRATION DỮ LIỆU ===");

  const productsRef = collection(db, "products");
  const snapshot = await getDocs(productsRef);

  console.log(`Tìm thấy ${snapshot.docs.length} sản phẩm trong database.`);

  for (const docSnapshot of snapshot.docs) {
    const data = docSnapshot.data();
    let updated = false;
    const updates: any = {};

    // Xử lý trường 'picture' (ảnh đại diện)
    if (data.picture && typeof data.picture === 'string' && data.picture.includes(oldBucketName)) {
      console.log(`[${data.sku || docSnapshot.id}] Đang xử lý picture...`);
      try {
        const match = data.picture.match(/\/o\/(.+?)\?/);
        const originalPath = match ? decodeURIComponent(match[1]) : `products/migrated-${Date.now()}`;
        
        // Fetch dữ liệu ảnh cũ
        const response = await fetch(data.picture);
        const arrayBuffer = await response.arrayBuffer();
        
        // Upload sang kho mới
        const newRef = ref(newStorage, originalPath);
        await uploadBytes(newRef, arrayBuffer, {
          contentType: response.headers.get("content-type") || "image/jpeg"
        });
        
        // Lấy URL mới
        const newUrl = await getDownloadURL(newRef);
        updates.picture = newUrl;
        updated = true;
        console.log(`  -> Đã copy sang kho mới: ${newUrl}`);
      } catch (err) {
        console.error(`  -> Lỗi xử lý picture cho ${data.sku}:`, err);
      }
    }

    // Xử lý mảng 'pictures' (nếu có)
    if (Array.isArray(data.pictures) && data.pictures.length > 0) {
      const newPictures = [];
      let picturesUpdated = false;
      for (const pic of data.pictures) {
        if (typeof pic === 'string' && pic.includes(oldBucketName)) {
          console.log(`[${data.sku || docSnapshot.id}] Đang xử lý ảnh phụ...`);
          try {
            const match = pic.match(/\/o\/(.+?)\?/);
            const originalPath = match ? decodeURIComponent(match[1]) : `products/migrated-${Date.now()}`;
            
            const response = await fetch(pic);
            const arrayBuffer = await response.arrayBuffer();
            
            const newRef = ref(newStorage, originalPath);
            await uploadBytes(newRef, arrayBuffer, {
              contentType: response.headers.get("content-type") || "image/jpeg"
            });
            
            const newUrl = await getDownloadURL(newRef);
            newPictures.push(newUrl);
            picturesUpdated = true;
            console.log(`  -> Đã copy ảnh phụ sang kho mới: ${newUrl}`);
          } catch (err) {
            console.error(`  -> Lỗi xử lý ảnh phụ cho ${data.sku}:`, err);
            newPictures.push(pic); // Fallback giữ nguyên
          }
        } else {
          newPictures.push(pic);
        }
      }
      
      if (picturesUpdated) {
        updates.pictures = newPictures;
        updated = true;
      }
    }

    // Cập nhật lại vào Firestore nếu có thay đổi
    if (updated) {
      await updateDoc(doc(db, "products", docSnapshot.id), updates);
      console.log(`>>> Cập nhật thành công documents cho sản phẩm ${data.sku || docSnapshot.id}!`);
    } else {
      console.log(`[${data.sku || docSnapshot.id}] Không có link ảnh từ kho cũ, bỏ qua.`);
    }
  }

  console.log("=== HOÀN TẤT MIGRATION ===");
  process.exit(0);
}

runMigration().catch(console.error);
