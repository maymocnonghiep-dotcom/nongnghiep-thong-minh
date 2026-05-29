import { initializeApp, getApps, getApp } from "firebase/app";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { getFirestore, initializeFirestore, collection, getDocs, doc, updateDoc } from "firebase/firestore/lite";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import fs from "fs";
import path from "path";

async function runMigration() {
  const configPath = path.join(process.cwd(), "firebase-applet-config.json");
  const rawConfig = fs.readFileSync(configPath, "utf8");
  const firebaseConfig = JSON.parse(rawConfig);

  const oldBucketName = "titanium-leaf-s07pf.firebasestorage.app";
  const newBucketName = "titanium-leaf-s07pf";

  console.log("=== BẮT ĐẦU MIGRATION DỮ LIỆU (PARALLEL) ===");

  const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
  const auth = getAuth(app);
  try {
    await signInWithEmailAndPassword(auth, "migration1@example.com", "migration1234");
  } catch (e: any) {
    if (e.code === 'auth/user-not-found' || e.code === 'auth/invalid-credential') {
      try {
        await createUserWithEmailAndPassword(auth, "migration1@example.com", "migration1234");
      } catch (err: any) {
        console.log("Failed to create user:", err.message);
      }
    }
  }

  const oldStorage = getStorage(app, `gs://${oldBucketName}`);
  const newStorage = getStorage(app, `gs://${newBucketName}`);

  const db = initializeFirestore(app, {
    ignoreUndefinedProperties: true
  }, firebaseConfig.firestoreDatabaseId || "");

  const productsRef = collection(db, "products");
  const snapshot = await getDocs(productsRef);

  console.log(`Tìm thấy ${snapshot.docs.length} sản phẩm trong database.`);

  const uploadAndGetUrl = async (url: string) => {
    if (typeof url === 'string' && url.includes("firebasestorage.googleapis.com")) {
      console.log(`Processing URL: ${url.substring(0, 50)}...`);
      const match = url.match(/\/o\/(.+?)\?/);
      const originalPath = match ? decodeURIComponent(match[1]) : `products/migrated-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      
      const response = await fetch(url);
      const arrayBuffer = await response.arrayBuffer();
      
      const newRef = ref(newStorage, originalPath);
      await uploadBytes(newRef, arrayBuffer, {
        contentType: response.headers.get("content-type") || "image/jpeg"
      });
      
      return await getDownloadURL(newRef);
    }
    return url;
  };

  const tasks = snapshot.docs.map(async (docSnapshot) => {
    const data = docSnapshot.data();
    let updated = false;
    const updates: any = {};

    if (data.picture && typeof data.picture === 'string' && data.picture.includes("firebasestorage.googleapis.com")) {
      try {
        updates.picture = await uploadAndGetUrl(data.picture);
        if (updates.picture !== data.picture) updated = true;
      } catch (err) {
        console.error(`Lỗi picture cho ${data.sku}:`, err);
      }
    }

    if (Array.isArray(data.pictures) && data.pictures.length > 0) {
      try {
        const newPictures = await Promise.all(data.pictures.map((pic: string) => uploadAndGetUrl(pic)));
        if (JSON.stringify(newPictures) !== JSON.stringify(data.pictures)) {
          updates.pictures = newPictures;
          updated = true;
        }
      } catch (err) {
        console.error(`Lỗi pictures cho ${data.sku}:`, err);
      }
    }

    if (updated) {
      await updateDoc(doc(db, "products", docSnapshot.id), updates);
      console.log(`[${data.sku || docSnapshot.id}] Đã cập nhật.`);
    }
  });

  await Promise.all(tasks);

  console.log("=== HOÀN TẤT MIGRATION ===");
  process.exit(0);
}

runMigration().catch(console.error);
