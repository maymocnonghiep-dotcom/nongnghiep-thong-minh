import { initializeApp, getApps, getApp } from 'firebase/app';
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { getApiUrl } from './utils';

export async function initFirebaseClient() {
  if (getApps().length > 0) return getApp();

  try {
    const res = await fetch(getApiUrl('/api/firebase-config'));
    const data = await res.json();
    if (data.success && data.config) {
      return initializeApp(data.config);
    }
    throw new Error('Failed to load Firebase config from server');
  } catch (err) {
    console.error('Lỗi khi fetch config Firebase Client:', err);
    throw err;
  }
}

export async function uploadImageToFirebase(file: File): Promise<string> {
  let app;
  try {
    app = await initFirebaseClient();
  } catch (err) {
    throw new Error('Chưa thiết lập Firebase App trên trình duyệt');
  }

  const storage = getStorage(app);
  
  // Clean filename to prevent issues
  const cleanFilename = String(file.name || `upload-${Date.now()}`).replace(/[^a-zA-Z0-9.-]/g, "_");
  const storagePath = `products/${Date.now()}-${cleanFilename}`;
  const storageRef = ref(storage, storagePath);

  console.log(`[Storage] Uploading raw file directly to ${storagePath}...`);

  // Upload file without any Base64 encoding!
  const uploadTask = uploadBytesResumable(storageRef, file, {
    contentType: file.type || 'image/jpeg',
  });

  return new Promise((resolve, reject) => {
    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        console.log(`[Storage] Upload in progress: ${progress.toFixed(1)}%`);
      },
      (error) => {
        console.error('[Storage] Upload failed:', error);
        reject(error);
      },
      async () => {
        try {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          console.log(`[Storage] Upload success! Link: ${downloadURL}`);
          resolve(downloadURL);
        } catch (urlError) {
          console.error('[Storage] Failed to get download URL', urlError);
          reject(urlError);
        }
      }
    );
  });
}
