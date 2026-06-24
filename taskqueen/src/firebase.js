import { initializeApp } from "firebase/app";
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from
"firebase/firestore";
// Firebase Console (Web App) မှရရှိŴသာ သင်၏ Config ကို ဤŴနေရာတွင် အစားထိုးပါ
const firebaseConfig = {
 apiKey: "AIzaSyBjvqSRQpfUH5HxXpYgLFhAFa_G2cYeG1o",
 authDomain: "taskqueen-ydb.firebaseapp.com",
 projectId: "taskqueen-ydb",
 storageBucket: "taskqueen-ydb.firebasestorage.app",
 messagingSenderId: "1095162017069",
 appId: "1:1095162017069:web:22758b0dd4df6d140f4fa4",
 measurementId: "G-JYLFZ5D6Q3"
};
// Firebase App အား Initialize လုပ်/ခြင်း
const app = initializeApp(firebaseConfig);
// [CRITICAL] Offline Persistent Cache အား Enable /ပုလုပ်/ခြင်း
// ဤကုဒ်ŴÆကာင့် အင်တာနေက်မရှိလည်း ဖြုနေ်းထဲက IndexedDB ထဲတွင် Ŵဒတာများကို အလိုအŴလျာက် သိမ်းÇပီး
// လိုင်း/ပနေ်ရခြျ ိနေ်တွင် Firebase က အŴနောက်ကွယ်မှ အလိုအŴလျာက် Cloud နှင့် Sync /ပုလုပ်Ŵပးသွားမည် /ဖြစ်သည်။
const db = initializeFirestore(app, {
 localCache: persistentLocalCache({
 tabManager: persistentMultipleTabManager()
 })
});
export { db };
