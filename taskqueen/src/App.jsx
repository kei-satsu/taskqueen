import React, { useState, useEffect } from 'react';
import { db, auth } from './firebase'; // 👈 auth ကိုပါ တွဲပြီး Import ယူလိုက်ပါတယ်
import { 
  collection, addDoc, onSnapshot, query, doc, 
  updateDoc, deleteDoc, serverTimestamp, where // 👈 where ကို ဒေတာစစ်ထုတ်ဖို့ ထည့်ထားပါတယ်
} from 'firebase/firestore';
import { onAuthStateChanged, signOut } from 'firebase/auth'; // 👈 အကောင့်စနစ်သုံးရန် Auth Functions များ
import AddTaskModal from './components/AddTaskModal'; 
import Auth from './components/Auth'; // 👈 စောစောက ဆောက်ခိုင်းထားတဲ့ Login Component ဖိုင်

// 🎨 iOS Native Design System Colors
const THEMES = {
  iosLight: {
    name: "📱 iOS Light (Classic)",
    bg: "bg-[#F2F2F7]", 
    card: "bg-white/80 backdrop-blur-xl border border-white/50 shadow-sm",
    textHead: "text-black",
    textMain: "text-black",
    textSub: "text-gray-500",
    primary: "bg-[#007AFF] hover:bg-[#0062CC] text-white shadow-md active:scale-95",
    accent: "text-[#007AFF] bg-[#007AFF]/10",
    dock: "bg-white/70 backdrop-blur-2xl border-t border-white/60 text-gray-400 shadow-[0_8px_30px_rgb(0,0,0,0.12)]",
    dockActive: "text-[#007AFF] font-semibold",
    input: "bg-[#767680]/10 border-transparent focus:ring-2 focus:ring-[#007AFF]/30 text-black placeholder-gray-500",
    segmentBg: "bg-[#767680]/15 p-1 rounded-xl flex",
    segmentActive: "bg-white shadow-sm text-black rounded-lg",
    segmentInactive: "text-gray-500"
  },
  iosDark: {
    name: "🌙 iOS Dark (True Black)",
    bg: "bg-black", 
    card: "bg-[#1C1C1E]/80 backdrop-blur-xl border border-white/10 shadow-sm",
    textHead: "text-white",
    textMain: "text-white",
    textSub: "text-gray-400",
    primary: "bg-[#0A84FF] hover:bg-[#006EE6] text-white shadow-md active:scale-95",
    accent: "text-[#0A84FF] bg-[#0A84FF]/20",
    dock: "bg-[#1D1D1D]/80 backdrop-blur-2xl border-t border-white/10 text-gray-500",
    dockActive: "text-[#0A84FF] font-semibold",
    input: "bg-[#767680]/30 border-transparent focus:ring-2 focus:ring-[#0A84FF]/50 text-white placeholder-gray-400",
    segmentBg: "bg-[#767680]/30 p-1 rounded-xl flex",
    segmentActive: "bg-[#636366] shadow-sm text-white rounded-lg",
    segmentInactive: "text-gray-400"
  },
  roseGold: {
    name: "🌸 Rose Gold (iOS Pink)",
    bg: "bg-[#FFF9F9]",
    card: "bg-white/80 backdrop-blur-xl border border-rose-100 shadow-sm",
    textHead: "text-rose-900",
    textMain: "text-rose-900",
    textSub: "text-rose-400",
    primary: "bg-[#FF2D55] hover:bg-[#E0244A] text-white shadow-md active:scale-95",
    accent: "text-[#FF2D55] bg-[#FF2D55]/10",
    dock: "bg-white/70 backdrop-blur-2xl border-t border-rose-100 text-rose-300 shadow-[0_8px_30px_rgb(255,45,85,0.1)]",
    dockActive: "text-[#FF2D55] font-semibold",
    input: "bg-rose-900/5 border-transparent focus:ring-2 focus:ring-[#FF2D55]/30 text-rose-900 placeholder-rose-400",
    segmentBg: "bg-rose-900/10 p-1 rounded-xl flex",
    segmentActive: "bg-white shadow-sm text-rose-900 rounded-lg",
    segmentInactive: "text-rose-400"
  },
  deepPurple: {
    name: "🔮 Deep Purple",
    bg: "bg-[#0B0914]",
    card: "bg-[#1C1A2E]/80 backdrop-blur-xl border border-purple-500/20 shadow-sm",
    textHead: "text-purple-50",
    textMain: "text-purple-50",
    textSub: "text-purple-300",
    primary: "bg-[#BF5AF2] hover:bg-[#A644D6] text-white shadow-md active:scale-95",
    accent: "text-[#BF5AF2] bg-[#BF5AF2]/20",
    dock: "bg-[#1C1A2E]/80 backdrop-blur-2xl border-t border-purple-500/20 text-purple-400/50 shadow-[0_8px_30px_rgb(191,90,242,0.15)]",
    dockActive: "text-[#BF5AF2] font-semibold",
    input: "bg-purple-500/15 border-transparent focus:ring-2 focus:ring-[#BF5AF2]/50 text-white placeholder-purple-300",
    segmentBg: "bg-purple-500/20 p-1 rounded-xl flex",
    segmentActive: "bg-[#BF5AF2] shadow-sm text-white rounded-lg",
    segmentInactive: "text-purple-300"
  }
};

function App() {
  // --- States ---
  const [user, setUser] = useState(null); // 👈 Login ဝင်ထားတဲ့ User State
  const [loading, setLoading] = useState(true); // 👈 Auth စစ်ဆေးနေဆဲ Loading State
  
  const [tasks, setTasks] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [activeTab, setActiveTab] = useState("dashboard"); 
  const [currentTheme, setCurrentTheme] = useState(() => {
    return localStorage.getItem("taskqueen-theme") || "iosLight";
  });
  const [dbError, setDbError] = useState("");

  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);

  // Form Inputs
  const [newTask, setNewTask] = useState("");
  const [taskCategory, setTaskCategory] = useState("🎯 အထွေထွေ");
  const [amount, setAmount] = useState("");
  const [txNote, setTxNote] = useState("");
  const [txType, setTxType] = useState("expense");
  const [txCategory, setTxCategory] = useState("🍔 အစားအသောက်");

  const theme = THEMES[currentTheme] || THEMES.iosLight;

  // --- 1. Auth Listener (အကောင့်ဝင်/ထွက် စောင့်ကြည့်ခြင်း) ---
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribeAuth();
  }, []);

  // --- 2. Real-time Data Sync (User အလိုက် ခွဲထုတ်ခြင်း) ---
  useEffect(() => {
    if (!user) {
      setTasks([]);
      setTransactions([]);
      return;
    }

    // 💡 query ထဲမှာ where("userId", "==", user.uid) ထည့်ပြီး မိမိဒေတာပဲ ယူပါတယ်
    const qTasks = query(collection(db, "tasks"), where("userId", "==", user.uid));
    const unsubscribeTasks = onSnapshot(qTasks, (snapshot) => {
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      list.sort((a, b) => (b.localAt || 0) - (a.localAt || 0));
      setTasks(list);
    }, (err) => setDbError(err.message));

    const qTx = query(collection(db, "transactions"), where("userId", "==", user.uid));
    const unsubscribeTx = onSnapshot(qTx, (snapshot) => {
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      list.sort((a, b) => (b.localAt || 0) - (a.localAt || 0));
      setTransactions(list);
    }, (err) => setDbError(err.message));

    return () => { unsubscribeTasks(); unsubscribeTx(); };
  }, [user]);

  const handleThemeChange = (newThemeKey) => {
    setCurrentTheme(newThemeKey);
    localStorage.setItem("taskqueen-theme", newThemeKey);
  };

  const handleAddTask = async (e) => {
    if (e) e.preventDefault();
    if (!newTask.trim() || !user) return;
    try {
      await addDoc(collection(db, "tasks"), {
        title: newTask.trim(),
        category: taskCategory,
        completed: false,
        localAt: Date.now(),
        createdAt: serverTimestamp(),
        userId: user.uid // 👈 ဘယ်သူဆောက်တာလဲဆိုတဲ့ ID ပါတွဲသိမ်းမယ်
      });
      setNewTask("");
    } catch (error) { setDbError(error.message); }
  };

  const handleAddTransaction = async (e) => {
    e.preventDefault();
    if (!amount || isNaN(amount) || Number(amount) <= 0 || !txNote.trim() || !user) return;
    try {
      await addDoc(collection(db, "transactions"), {
        note: txNote.trim(),
        amount: Number(amount),
        type: txType,
        category: txCategory,
        localAt: Date.now(),
        createdAt: serverTimestamp(),
        userId: user.uid // 👈 ဘယ်သူ့ငွေစာရင်းလဲဆိုတာ မှတ်သားမယ်
      });
      setAmount(""); setTxNote("");
    } catch (error) { setDbError(error.message); }
  };

  // --- Calculations for Budget & Dashboard ---
  const totalIncome = transactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
  const netBudget = totalIncome - totalExpense;

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.completed).length;
  const pendingTasks = totalTasks - completedTasks;
  const taskProgress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // ⏳ စနစ်စစ်ဆေးနေတုန်း ပြသမည့် Screen
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black text-white">
        <p className="text-xl font-medium animate-pulse tracking-wide">Loading TaskQueen...</p>
      </div>
    );
  }

  // ❌ အကောင့်မဝင်ရသေးရင် Login Page ကိုပဲ ပြသထားမယ်
  if (!user) {
    return <Auth />;
  }

  // ✅ အကောင့်ဝင်ပြီးမှ ပင်မ App ကြီး ပွင့်လာမယ်
  return (
    <div className={`min-h-screen ${theme.bg} ${theme.textMain} font-sans antialiased pb-32 transition-colors duration-500`}>
      
      {/* iOS Style Large Header */}
      <header className="p-6 pt-14 max-w-2xl md:max-w-5xl lg:max-w-6xl mx-auto flex justify-between items-end">
        <div>
          <h1 className={`text-4xl md:text-5xl font-bold tracking-tight ${theme.textHead}`}>
            TaskQueen
          </h1>
          <p className={`text-sm ${theme.textSub} mt-1 font-medium`}>
            {activeTab === 'dashboard' ? 'Overview & Analytics' : activeTab === 'tasks' ? 'Tasks & Reminders' : activeTab === 'budget' ? 'Financial Tracker' : 'Preferences'}
          </p>
          
          {/* 🚪 Logout ခလုတ်လေး ထည့်ပေးထားပါတယ် */}
          <button 
            onClick={() => signOut(auth)}
            className="mt-3 text-xs px-3 py-1.5 rounded-full bg-red-500/10 text-red-500 hover:bg-red-500/20 font-semibold transition-all active:scale-95"
          >
            Logout 🚪
          </button>
        </div>
        
        <div className={`px-5 py-2.5 rounded-2xl ${theme.card} text-right flex flex-col justify-center`}>
          <span className={`text-[10px] ${theme.textSub} block font-bold uppercase tracking-widest`}>Balance</span>
          <span className={`text-lg font-bold tracking-tight ${netBudget < 0 ? 'text-[#FF3B30]' : 'text-[#34C759]'}`}>
            {netBudget.toLocaleString()} Ks
          </span>
        </div>
      </header>

      {/* Main Content Container */}
      <main className="p-4 max-w-2xl md:max-w-5xl lg:max-w-6xl mx-auto">
        {dbError && <div className="bg-[#FF3B30]/10 text-[#FF3B30] p-3 rounded-2xl mb-4 text-sm font-medium border border-[#FF3B30]/20">{dbError}</div>}

        {/* ==================== 📊 DASHBOARD VIEW ==================== */}
        {activeTab === "dashboard" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            
            {/* Task Tracker Box */}
            <div className={`p-5 rounded-[2rem] ${theme.card} space-y-4 h-full`}>
              <div className="flex justify-between items-center">
                <h3 className="text-[15px] font-bold tracking-tight">🎯 လုပ်ငန်းဆောင်တာ တိုးတက်မှု</h3>
                <span className={`text-xs px-2.5 py-1 rounded-md font-semibold ${theme.accent}`}>{taskProgress}% Done</span>
              </div>
              
              <div className="w-full bg-gray-500/10 h-2.5 rounded-full overflow-hidden">
                <div 
                  className="bg-[#34C759] h-full transition-all duration-500 rounded-full" 
                  style={{ width: `${taskProgress}%` }}
                ></div>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center pt-2">
                <div className="bg-gray-500/5 p-3 rounded-2xl">
                  <span className={`text-xs block ${theme.textSub} font-medium`}>စုစုပေါင်း</span>
                  <span className="text-xl font-bold">{totalTasks}</span>
                </div>
                <div className="bg-[#34C759]/5 p-3 rounded-2xl">
                  <span className="text-xs block text-[#34C759] font-medium">ပြီးစီး</span>
                  <span className="text-xl font-bold text-[#34C759]">{completedTasks}</span>
                </div>
                <div className="bg-[#FF9500]/5 p-3 rounded-2xl">
                  <span className="text-xs block text-[#FF9500] font-medium">ကျန်ရှိ</span>
                  <span className="text-xl font-bold text-[#FF9500]">{pendingTasks}</span>
                </div>
              </div>
            </div>

            {/* Financial Overview Box */}
            <div className={`p-5 rounded-[2rem] ${theme.card} space-y-4 h-full`}>
              <h3 className="text-[15px] font-bold tracking-tight">💰 Ngwe Kyay</h3>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-[#34C759]/5 border border-[#34C759]/10 p-4 rounded-2xl flex flex-col">
                  <span className="text-[11px] text-[#34C759] font-bold uppercase tracking-wider">Total Income</span>
                  <span className="text-lg font-bold mt-1 text-[#34C759]">{totalIncome.toLocaleString()} Ks</span>
                </div>
                <div className="bg-[#FF3B30]/5 border border-[#FF3B30]/10 p-4 rounded-2xl flex flex-col">
                  <span className="text-[11px] text-[#FF3B30] font-bold uppercase tracking-wider">Total Expense</span>
                  <span className="text-lg font-bold mt-1 text-[#FF3B30]">{totalExpense.toLocaleString()} Ks</span>
                </div>
              </div>

              <div className="bg-gray-500/5 p-4 rounded-2xl text-xs font-medium leading-relaxed flex items-start gap-3">
                <span className="text-lg">💡</span>
                <p className={`${theme.textSub}`}>
                  {netBudget >= 0 
                    ? "ငွေစာရင်းအခြေအနေ မျှတကောင်းမွန်နေပါတယ်။ မလိုအပ်တဲ့ အသုံးစရိတ်တွေကို ဆက်လက်ထိန်းချုပ်ပြီး စာရင်းသွင်းပေးပါဦး။"
                    : "လက်ရှိမှာ ဝင်ငွေထက် သုံးငွေက ပိုများနေပါတယ်ဗျာ။ အသုံးစရိတ်တွေကို ပြန်လည်စိစစ်ဖို့ အကြံပြုချင်ပါတယ်။"
                  }
                </p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:col-span-2">
              <div onClick={() => setIsTaskModalOpen(true)} className={`p-5 rounded-2xl ${theme.card} cursor-pointer hover:scale-[1.01] active:scale-95 transition-all flex items-center gap-4`}>
                <div className="w-12 h-12 rounded-xl bg-[#007AFF]/10 flex items-center justify-center text-xl">📝</div>
                <div>
                  <h4 className="text-sm font-bold">Tasks စာရင်းထည့်ရန်</h4>
                  <p className={`text-xs ${theme.textSub} mt-0.5`}>{pendingTasks} items left</p>
                </div>
              </div>

              <div onClick={() => setActiveTab("budget")} className={`p-5 rounded-2xl ${theme.card} cursor-pointer hover:scale-[1.01] active:scale-95 transition-all flex items-center gap-4`}>
                <div className="w-12 h-12 rounded-xl bg-[#34C759]/10 flex items-center justify-center text-xl">💸</div>
                <div>
                  <h4 className="text-sm font-bold">ငွေစာရင်းသွင်းရန်</h4>
                  <p className={`text-xs ${theme.textSub} mt-0.5`}>{transactions.length} total entries</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ==================== 📋 TASKS VIEW ==================== */}
        {activeTab === "tasks" && (
          <div className="space-y-4 max-w-3xl mx-auto">
            <div className="flex justify-between items-center px-2 py-1">
              <h3 className={`text-xs font-bold ${theme.textSub} uppercase tracking-widest`}>
                Reminders ({tasks.filter(t=>!t.completed).length})
              </h3>
              <button 
                onClick={() => setIsTaskModalOpen(true)}
                className={`px-5 py-2.5 text-xs font-bold rounded-full transition-all flex items-center gap-1.5 ${theme.primary}`}
              >
                <span>+</span> Add New Task
              </button>
            </div>
            
            <div className={`rounded-[2rem] overflow-hidden ${theme.card}`}>
              {tasks.length === 0 ? (
                <p className={`text-center text-sm ${theme.textSub} py-14`}>လုပ်ဆောင်ရမည့်အရာ မရှိသေးပါဘူး ✨</p>
              ) : (
                <div className="divide-y divide-gray-500/10">
                  {tasks.map((task) => (
                    <div
                      key={task.id}
                      onClick={() => updateDoc(doc(db, "tasks", task.id), { completed: !task.completed })}
                      className={`flex items-center justify-between p-4 px-6 transition-all duration-300 cursor-pointer hover:bg-gray-500/5 ${task.completed ? 'opacity-50' : ''}`}
                    >
                      <div className="flex items-center gap-4 max-w-[80%]">
                        <div className={`w-6 h-6 rounded-full border-[1.5px] flex items-center justify-center transition-all duration-300 ${task.completed ? 'bg-[#34C759] border-[#34C759]' : 'border-gray-400/50 bg-transparent'}`}>
                          {task.completed && <span className="text-white text-xs font-bold">✓</span>}
                        </div>
                        <span className={`text-[15px] tracking-tight ${task.completed ? 'line-through' : 'font-medium'}`}>{task.title}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className={`text-[10px] px-2.5 py-1 rounded-md font-semibold ${theme.accent}`}>{task.category.split(" ")[0]}</span>
                        <button onClick={async (e) => { e.stopPropagation(); if(confirm("ဖျက်မှာ သေချာလား?")) await deleteDoc(doc(db, "tasks", task.id)); }} className="text-gray-400 hover:text-[#FF3B30] p-1 text-sm transition-colors active:scale-90">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ==================== 💰 BUDGET VIEW ==================== */}
        {activeTab === "budget" && (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
            
            <form onSubmit={handleAddTransaction} className={`p-5 rounded-[2rem] ${theme.card} md:col-span-5`}>
              <div className={`${theme.segmentBg} mb-5`}>
                <button type="button" onClick={() => setTxType("expense")} className={`flex-1 py-2 text-[13px] font-semibold transition-all ${txType === 'expense' ? theme.segmentActive : theme.segmentInactive}`}>
                  Expense
                </button>
                <button type="button" onClick={() => setTxType("income")} className={`flex-1 py-2 text-[13px] font-semibold transition-all ${txType === 'income' ? theme.segmentActive : theme.segmentInactive}`}>
                  Income
                </button>
              </div>

              <div className="space-y-4">
                <div className="relative">
                  <span className={`absolute left-4 top-1/2 -translate-y-1/2 font-medium ${theme.textSub}`}>Ks</span>
                  <input
                    type="number" placeholder="0" value={amount} onChange={(e) => setAmount(e.target.value)}
                    className={`w-full pl-12 pr-4 py-4 rounded-2xl text-xl font-semibold outline-none transition-all ${theme.input}`}
                  />
                </div>
                
                <div className="space-y-3">
                  <select
                    value={txCategory} onChange={(e) => setTxCategory(e.target.value)}
                    className={`w-full px-4 py-3.5 rounded-xl text-sm font-medium outline-none appearance-none ${theme.input}`}
                  >
                    {txType === 'expense' ? (
                      <>
                        <option>🍔 အစားအသောက်</option>
                        <option>💅 အလှအပ</option>
                        <option>🚌 သွားလာစရိတ်</option>
                        <option>🛍️ Shopping</option>
                        <option>💡 အထွေထွေ</option>
                      </>
                    ) : (
                      <>
                        <option>💰 လစာ/မုန့်ဖိုး</option>
                        <option>📈 Project ရရှိငွေ</option>
                        <option>🎁 လက်ဆောင်</option>
                      </>
                    )}
                  </select>
                  <input
                    type="text" placeholder="Notes..." value={txNote} onChange={(e) => setTxNote(e.target.value)}
                    className={`w-full px-4 py-3.5 rounded-xl text-sm outline-none transition-all ${theme.input}`}
                  />
                </div>
                <button type="submit" className={`w-full mt-2 py-4 text-[15px] font-semibold text-white rounded-xl shadow-md active:scale-95 transition-all ${txType === 'income' ? 'bg-[#34C759] hover:bg-[#2EB850]' : 'bg-[#FF3B30] hover:bg-[#E6352B]'}`}>
                  စာရင်းသွင်းမည်
                </button>
              </div>
            </form>

            <div className="space-y-3 md:col-span-7">
              <h3 className={`text-xs font-bold ${theme.textSub} uppercase tracking-widest px-2`}>Recent Transactions</h3>
              <div className={`rounded-[2rem] overflow-hidden ${theme.card}`}>
                {transactions.length === 0 ? (
                  <p className={`text-center text-sm ${theme.textSub} py-14`}>မှတ်တမ်းမရှိသေးပါဘူး 💸</p>
                ) : (
                  <div className="divide-y divide-gray-500/10">
                    {transactions.map((tx) => (
                      <div key={tx.id} className="flex items-center justify-between p-4 px-5 hover:bg-gray-500/5 transition-colors">
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${tx.type === 'income' ? 'bg-[#34C759]/10' : 'bg-[#FF3B30]/10'}`}>
                            {tx.category?.split(" ")[0] || "💰"}
                          </div>
                          <div>
                            <p className="text-[15px] font-semibold tracking-tight">{tx.note}</p>
                            <p className={`text-[11px] ${theme.textSub} font-medium mt-0.5`}>{tx.category?.split(" ")[1] || "စာရင်း"} • {new Date(tx.localAt).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className={`text-[15px] font-bold tracking-tight ${tx.type === 'income' ? 'text-[#34C759]' : 'text-[#FF3B30]'}`}>
                            {tx.type === 'income' ? '+' : '-'}{tx.amount.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ==================== ⚙️ SETTINGS VIEW ==================== */}
        {activeTab === "settings" && (
          <div className={`p-6 rounded-[2rem] ${theme.card} space-y-5 max-w-3xl mx-auto`}>
            <h3 className="text-[13px] font-bold uppercase tracking-widest text-gray-500">Appearance</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {Object.keys(THEMES).map((themeKey) => (
                <button
                  key={themeKey}
                  onClick={() => handleThemeChange(themeKey)}
                  className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all active:scale-[0.98] ${
                    currentTheme === themeKey 
                      ? `${THEMES[themeKey].accent} ring-1 ring-current` 
                      : `${theme.input}`
                  }`}
                >
                  <span className="text-[15px] font-medium tracking-tight">{THEMES[themeKey].name}</span>
                  {currentTheme === themeKey && (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7"></path></svg>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
      </main>

      <AddTaskModal 
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        newTask={newTask}
        setNewTask={setNewTask}
        taskCategory={taskCategory}
        setTaskCategory={setTaskCategory}
        handleAddTask={handleAddTask}
        theme={theme}
      />

      {/* ==================== 📱 iOS FLOATING BOTTOM DOCK ==================== */}
      <nav className={`fixed bottom-8 left-1/2 -translate-x-1/2 w-[90%] max-w-sm rounded-full p-2 flex justify-between items-center z-50 transition-all duration-500 ${theme.dock}`}>
        <button onClick={() => setActiveTab("dashboard")} className={`flex-1 flex flex-col items-center gap-1 py-1.5 rounded-full transition-all duration-300 active:scale-95 ${activeTab === 'dashboard' ? theme.dockActive : 'hover:text-gray-400 opacity-60'}`}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"></path></svg>
          <span className="text-[10px] font-medium tracking-tight">Home</span>
        </button>
        <button onClick={() => setActiveTab("tasks")} className={`flex-1 flex flex-col items-center gap-1 py-1.5 rounded-full transition-all duration-300 active:scale-95 ${activeTab === 'tasks' ? theme.dockActive : 'hover:text-gray-400 opacity-60'}`}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"></path></svg>
          <span className="text-[10px] font-medium tracking-tight">Tasks</span>
        </button>
        <button onClick={() => setActiveTab("budget")} className={`flex-1 flex flex-col items-center gap-1 py-1.5 rounded-full transition-all duration-300 active:scale-95 ${activeTab === 'budget' ? theme.dockActive : 'hover:text-gray-400 opacity-60'}`}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          <span className="text-[10px] font-medium tracking-tight">Budget</span>
        </button>
        <button onClick={() => setActiveTab("settings")} className={`flex-1 flex flex-col items-center gap-1 py-1.5 rounded-full transition-all duration-300 active:scale-95 ${activeTab === 'settings' ? theme.dockActive : 'hover:text-gray-400 opacity-60'}`}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
          <span className="text-[10px] font-medium tracking-tight">Settings</span>
        </button>
      </nav>

    </div>
  );
}

export default App;