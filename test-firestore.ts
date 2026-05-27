import fs from 'fs';
import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, initializeFirestore } from "firebase/firestore/lite";
const firebaseConfig = JSON.parse(fs.readFileSync('firebase-applet-config.json', 'utf-8'));
const app = initializeApp(firebaseConfig);
const db = initializeFirestore(app, {}, firebaseConfig.firestoreDatabaseId);
async function run() {
  try {
    const querySnapshot = await getDocs(collection(db, "products"));
    console.log("Found products:", querySnapshot.docs.length);
    console.log(querySnapshot.docs.map(d => d.data().name).slice(0, 3));
  } catch (e) {
    console.error(e);
  }
}
run();
