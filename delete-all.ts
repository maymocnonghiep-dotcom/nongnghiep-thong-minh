import fs from 'fs';
import path from 'path';
import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, initializeFirestore, doc, deleteDoc } from "firebase/firestore/lite";
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
      console.log("no firebase config");
      return;
  }
  const app = initializeApp(firebaseConfig);
  const db = initializeFirestore(app, {}, firebaseConfig.firestoreDatabaseId);
  try {
    const querySnapshot = await getDocs(collection(db, "products"));
    console.log("Found products:", querySnapshot.docs.length);
    for (const d of querySnapshot.docs) {
        await deleteDoc(doc(db, "products", d.id));
    }
    console.log("Done");
  } catch (e) {
    console.error(e);
  }
}
run();
