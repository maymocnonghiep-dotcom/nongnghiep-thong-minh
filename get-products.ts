import fs from 'fs';
import path from 'path';
import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, initializeFirestore } from "firebase/firestore/lite";
import "dotenv/config";
import { createRequire } from "module";

const require = createRequire(import.meta.url);

async function run() {
  let firebaseConfig: any = null;

  try {
    const rawConfig = fs.readFileSync(path.join(process.cwd(), "firebase-applet-config.json"), "utf8");
    firebaseConfig = JSON.parse(rawConfig);
  } catch(e) {
    try {
      firebaseConfig = require("./firebase-applet-config.json");
    } catch(e2) {}
  }

  if (!firebaseConfig) {
    console.log("No Firebase config found on disk.");
    return;
  }
  const app = initializeApp(firebaseConfig);
  const db = initializeFirestore(app, {}, firebaseConfig.firestoreDatabaseId);
  try {
    console.log("Fetching products from Firestore...");
    const querySnapshot = await getDocs(collection(db, "products"));
    console.log("Found products:", querySnapshot.docs.length);
    const list: any[] = [];
    querySnapshot.forEach((doc) => {
      list.push(doc.data());
    });
    
    if (list.length > 0) {
      fs.writeFileSync(path.join(process.cwd(), "products_db.json"), JSON.stringify(list, null, 2), "utf-8");
      console.log("Successfully offline-cached products into products_db.json!");
    } else {
      console.log("No products found in Firestore collection.");
    }
  } catch (e) {
    console.error("Error fetching products from Firestore:", e);
  }
}
run();
