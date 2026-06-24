import React, { useState, useEffect } from 'react';
import { db, auth } from './firebase'; 
import { 
  collection, addDoc, onSnapshot, query, doc, 
  updateDoc, deleteDoc, serverTimestamp, where 
} from 'firebase/firestore';
import { onAuthStateChanged, signOut } from 'firebase/auth'; 
import AddTaskModal from './components/AddTaskModal'; 
import AddTransactionModal from './components/AddTransactionModal'; // 👈 Modal အသစ်ကို Import လုပ်လိုက်ပါပြီ
import Auth from './components/Auth'; 

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
    name: "🌸 Rose Gold", bg: "bg-[#FFF9F9]", card: "bg-white/80 backdrop-blur-xl border border-rose-100 shadow-sm", textHead: "text-rose-900", textMain: "text-rose-900", textSub: "text-rose-400", primary: "bg-[#FF2D55] hover:bg-[#E0244A] text-white shadow-md active:scale-95", accent: "text-[#FF2D55] bg-[#FF2D55]/10", dock: "bg-white/70 backdrop-blur-2xl border-t border-rose-100 text-rose-300 shadow-[0_8px_30px_rgb(255,45,85,0.1)]", dockActive: "text-[#FF2D55] font-semibold", input: "bg-rose-900/5 border-transparent focus:ring-2 focus:ring-[#FF2D55]/30 text-rose-900 placeholder-rose-400", segmentBg: "bg-rose-900/10 p-1 rounded-xl flex", segmentActive: "bg-white shadow-sm text-rose-900 rounded-lg", segmentInactive: "text-rose-400"
  },
  deepPurple: {
    name: "🔮 Deep Purple", bg: "bg-[#0B0914]", card: "bg-[#1C1A2E]/80 backdrop-blur-xl border border-purple-500/20 shadow-sm", textHead: "text-purple-50", textMain: "text-purple-50", textSub: "text-purple-300", primary: "bg-[#BF5AF2] hover:bg-[#A644D6] text-white shadow-md active:scale-95", accent: "text-[#BF5AF2] bg-[#BF5AF2]/20", dock: "bg-[#1C1A2E]/80 backdrop-blur-2xl border-t border-purple-500/20 text-purple-400/50 shadow-[0_8px_30px_rgb(191,90,242,0.15)]", dockActive: "text-[#BF5AF2] font-semibold", input: "bg-purple-500/15 border-transparent focus:ring-2 focus:ring-[#BF5AF2]/50 text-white placeholder-purple-300", segmentBg: "bg-purple-500/20 p-1 rounded-xl flex", segmentActive: "bg-[#BF5AF2] shadow-sm text-white rounded-lg", segmentInactive: "text-purple-300"
  }
};

function App() {
  const [user, setUser] = useState(null); 
  const [loading, setLoading] = useState(true); 
  
  const [tasks, setTasks] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [activeTab, setActiveTab] = useState("dashboard"); 
  const [currentTheme, setCurrentTheme] = useState(() => localStorage.getItem("taskqueen-theme") || "iosLight");
  const [dbError, setDbError] = useState("");

  // Modals & Menus States
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isActionMenuOpen, setIsActionMenuOpen] = useState(false);
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);

  // Task Form Inputs
  const [newTask, setNewTask] = useState("");
  const [taskCategory, setTaskCategory] = useState("🎯 အထွေထွေ");

  // Transaction Form Inputs (Add & Edit)
  const [editTxId, setEditTxId] = useState(null);
  const [amount, setAmount] = useState("");
  const [txNote, setTxNote] = useState("");
  const [txType, setTxType] = useState("expense");
  const [txCategory, setTxCategory] = useState("🍔 အစားအသောက်");

  const theme = THEMES[currentTheme] || THEMES.iosLight;

  // ၁။ Auth Listener
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribeAuth();
  }, []);

  // ၂။ Firestore Data Listener
  useEffect(() => {
    if (!user) { setTasks([]); setTransactions([]); return; }
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

  // 🔥 ၃။ iOS Overscroll (Elastic Background) Sync & Complete Zoom Lock Fix
  useEffect(() => {
    // Background Color Sync (အပေါ်အောက်ဆွဲလျှင် အဖြူကွက်မပေါ်စေရန်)
    const themeBackgrounds = {
      iosLight: "#F2F2F7",
      iosDark: "#000000",
      roseGold: "#FFF9F9",
      deepPurple: "#0B0914"
    };
    const targetColor = themeBackgrounds[currentTheme] || "#F2F2F7";
    document.documentElement.style.backgroundColor = targetColor;
    document.body.style.backgroundColor = targetColor;

    // လက်နှစ်ချောင်းဖြင့် ကားပြီး Zoom ဆွဲခြင်းကို Prevent လုပ်ရန် (Pinch-to-zoom lock)
    const preventZoom = (e) => {
      if (e.touches && e.touches.length > 1) {
        e.preventDefault();
      }
    };
    document.addEventListener('gesturestart', preventZoom);

    // Screen ကို နှစ်ချက်တောက်ပြီး Zoom ဆွဲခြင်းကို တားဆီးရန် (Double-tap zoom lock)
    document.body.style.touchAction = 'manipulation';
    document.documentElement.style.touchAction = 'manipulation';

    return () => {
      document.removeEventListener('gesturestart', preventZoom);
    };
  }, [currentTheme]);

  const handleThemeChange = (newThemeKey) => {
    setCurrentTheme(newThemeKey);
    localStorage.setItem("taskqueen-theme", newThemeKey);
  };

  const handleAddTask = async (e) => {
    if (e) e.preventDefault();
    if (!newTask.trim() || !user) return;
    try {
      await addDoc(collection(db, "tasks"), {
        title: newTask.trim(), category: taskCategory, completed: false, localAt: Date.now(), createdAt: serverTimestamp(), userId: user.uid 
      });
      setNewTask(""); setIsTaskModalOpen(false);
    } catch (error) { setDbError(error.message); }
  };

  const handleSaveTransaction = async (e) => {
    e.preventDefault();
    if (!amount || isNaN(amount) || Number(amount) <= 0 || !txNote.trim() || !user) return;
    try {
      if (editTxId) {
        await updateDoc(doc(db, "transactions", editTxId), {
          note: txNote.trim(), amount: Number(amount), type: txType, category: txCategory
        });
      } else {
        await addDoc(collection(db, "transactions"), {
          note: txNote.trim(), amount: Number(amount), type: txType, category: txCategory, localAt: Date.now(), createdAt: serverTimestamp(), userId: user.uid 
        });
      }
      resetTxForm();
    } catch (error) { setDbError(error.message); }
  };

  const openEditTx = (tx) => {
    setAmount(tx.amount); setTxNote(tx.note); setTxType(tx.type); setTxCategory(tx.category); setEditTxId(tx.id); setIsTxModalOpen(true);
  };

  const deleteTx = async (id) => {
    if(window.confirm("ဒီမှတ်တမ်းကို ဖျက်မှာ သေချာလား?")) {
      await deleteDoc(doc(db, "transactions", id));
    }
  };

  const resetTxForm = () => {
    setAmount(""); setTxNote(""); setEditTxId(null); setIsTxModalOpen(false);
  };

  const totalIncome = transactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
  const netBudget = totalIncome - totalExpense;
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.completed).length;
  const pendingTasks = totalTasks - completedTasks;
  const taskProgress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  if (loading) return <div className="flex min-h-screen items-center justify-center bg-black text-white"><p className="animate-pulse">Loading TaskQueen...</p></div>;
  if (!user) return <Auth />;

  return (
    <div className={`min-h-screen ${theme.bg} ${theme.textMain} font-sans antialiased pb-32 transition-colors duration-500`}>
      
      {/* 🚀 Header */}
      <header className="p-6 pt-14 max-w-2xl md:max-w-5xl lg:max-w-6xl mx-auto flex justify-between items-end">
           <div>
          <h1 className={`text-4xl md:text-5xl font-bold tracking-tight ${theme.textHead}`}>TaskQueen</h1>
          <p className={`text-sm ${theme.textSub} mt-1 font-medium`}>
            {activeTab === 'dashboard' ? 'Overview & Analytics' : activeTab === 'tasks' ? 'Tasks & Reminders' : activeTab === 'budget' ? 'Financial Tracker' : 'Preferences'}
          </p>
        </div>
        <div className={`px-5 py-2.5 rounded-2xl ${theme.card} text-right flex flex-col justify-center`}>
          <span className={`text-[10px] ${theme.textSub} block font-bold uppercase tracking-widest`}>Balance</span>
          <span className={`text-lg font-bold tracking-tight ${netBudget < 0 ? 'text-[#FF3B30]' : 'text-[#34C759]'}`}>
            {netBudget.toLocaleString()} Ks
          </span>
        </div>
      </header>

      <main className="p-4 max-w-2xl md:max-w-5xl lg:max-w-6xl mx-auto">
        {dbError && <div className="bg-[#FF3B30]/10 text-[#FF3B30] p-3 rounded-2xl mb-4 text-sm font-medium">{dbError}</div>}

        {/* 📊 DASHBOARD VIEW */}
        {activeTab === "dashboard" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
             <div className={`p-5 rounded-[2rem] ${theme.card} space-y-4`}>
                <h3 className="text-[15px] font-bold tracking-tight">🎯 လုပ်ငန်းဆောင်တာ တိုးတက်မှု</h3>
                <div className="w-full bg-gray-500/10 h-2.5 rounded-full overflow-hidden">
                  <div className="bg-[#34C759] h-full transition-all duration-500 rounded-full" style={{ width: `${taskProgress}%` }}></div>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center pt-2">
                  <div className="bg-gray-500/5 p-3 rounded-2xl"><span className={`text-xs block ${theme.textSub}`}>စုစုပေါင်း</span><span className="text-xl font-bold">{totalTasks}</span></div>
                  <div className="bg-[#34C759]/5 p-3 rounded-2xl"><span className="text-xs block text-[#34C759]">ပြီးစီး</span><span className="text-xl font-bold text-[#34C759]">{completedTasks}</span></div>
                  <div className="bg-[#FF9500]/5 p-3 rounded-2xl"><span className="text-xs block text-[#FF9500]">ကျန်ရှိ</span><span className="text-xl font-bold text-[#FF9500]">{pendingTasks}</span></div>
                </div>
              </div>
              <div className={`p-5 rounded-[2rem] ${theme.card} space-y-4`}>
                <h3 className="text-[15px] font-bold tracking-tight">💰 Ngwe Kyay</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-[#34C759]/5 border border-[#34C759]/10 p-4 rounded-2xl flex flex-col"><span className="text-[11px] text-[#34C759] font-bold">INCOME</span><span className="text-lg font-bold mt-1 text-[#34C759]">{totalIncome.toLocaleString()} Ks</span></div>
                  <div className="bg-[#FF3B30]/5 border border-[#FF3B30]/10 p-4 rounded-2xl flex flex-col"><span className="text-[11px] text-[#FF3B30] font-bold">EXPENSE</span><span className="text-lg font-bold mt-1 text-[#FF3B30]">{totalExpense.toLocaleString()} Ks</span></div>
                </div>
              </div>
          </div>
        )}

        {/* 📋 TASKS VIEW */}
        {activeTab === "tasks" && (
           <div className="space-y-4 max-w-3xl mx-auto">
             <div className={`rounded-[2rem] overflow-hidden ${theme.card}`}>
               {tasks.length === 0 ? <p className={`text-center text-sm ${theme.textSub} py-14`}>လုပ်ဆောင်ရမည့်အရာ မရှိသေးပါဘူး ✨</p> : (
                 <div className="divide-y divide-gray-500/10">
                   {tasks.map((task) => (
                     <div key={task.id} onClick={() => updateDoc(doc(db, "tasks", task.id), { completed: !task.completed })} className={`flex items-center justify-between p-4 px-6 cursor-pointer hover:bg-gray-500/5 ${task.completed ? 'opacity-50' : ''}`}>
                       <div className="flex items-center gap-4">
                         <div className={`w-6 h-6 rounded-full border-[1.5px] flex items-center justify-center ${task.completed ? 'bg-[#34C759] border-[#34C759]' : 'border-gray-400/50'}`}>{task.completed && <span className="text-white text-xs">✓</span>}</div>
                         <span className={`text-[15px] ${task.completed ? 'line-through' : 'font-medium'}`}>{task.title}</span>
                       </div>
                       <button onClick={async (e) => { e.stopPropagation(); if(confirm("ဖျက်မှာ သေချာလား?")) await deleteDoc(doc(db, "tasks", task.id)); }} className="text-gray-400 hover:text-[#FF3B30]"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg></button>
                     </div>
                   ))}
                 </div>
               )}
             </div>
           </div>
        )}

        {/* 💰 BUDGET VIEW */}
        {activeTab === "budget" && (
          <div className="space-y-4 max-w-3xl mx-auto">
            <h3 className={`text-xs font-bold ${theme.textSub} uppercase tracking-widest px-2`}>Recent Transactions</h3>
            <div className={`rounded-[2rem] overflow-hidden ${theme.card}`}>
              {transactions.length === 0 ? <p className={`text-center text-sm ${theme.textSub} py-14`}>မှတ်တမ်းမရှိသေးပါဘူး 💸</p> : (
                <div className="divide-y divide-gray-500/10">
                  {transactions.map((tx) => (
                    <div key={tx.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 px-5 hover:bg-gray-500/5 transition-colors gap-3">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${tx.type === 'income' ? 'bg-[#34C759]/10' : 'bg-[#FF3B30]/10'}`}>
                          {tx.category?.split(" ")[0] || "💰"}
                        </div>
                        <div>
                          <p className="text-[15px] font-semibold tracking-tight">{tx.note}</p>
                          <p className={`text-[11px] ${theme.textSub} font-medium mt-0.5`}>{tx.category?.split(" ")[1] || "စာရင်း"} • {new Date(tx.localAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 ml-14 sm:ml-0">
                        <span className={`text-[15px] font-bold tracking-tight ${tx.type === 'income' ? 'text-[#34C759]' : 'text-[#FF3B30]'}`}>
                          {tx.type === 'income' ? '+' : '-'}{tx.amount.toLocaleString()}
                        </span>
                        <div className="flex items-center gap-2">
                          <button onClick={() => openEditTx(tx)} className="text-gray-400 hover:text-[#007AFF] bg-gray-500/10 p-2 rounded-full transition-colors"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg></button>
                          <button onClick={() => deleteTx(tx.id)} className="text-gray-400 hover:text-[#FF3B30] bg-gray-500/10 p-2 rounded-full transition-colors"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg></button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ⚙️ SETTINGS VIEW */}
        {activeTab === "settings" && (
          <div className="space-y-6 max-w-3xl mx-auto">
            <div className={`p-6 rounded-[2rem] ${theme.card} flex flex-col sm:flex-row items-center sm:items-start justify-between gap-4`}>
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
                <img 
                  src={user.photoURL || `https://ui-avatars.com/api/?name=${user.email}&background=random`} 
                  alt="Profile" 
                  className="w-20 h-20 rounded-full shadow-md border-2 border-white/20"
                />
                <div className="text-center sm:text-left mt-2 sm:mt-0">
                  <h3 className="text-xl font-bold tracking-tight">{user.displayName || 'TaskQueen User'}</h3>
                  <p className={`text-sm ${theme.textSub} mt-1`}>{user.email}</p>
                </div>
              </div>
              <button onClick={() => signOut(auth)} className="px-5 py-2.5 rounded-full bg-[#FF3B30]/10 text-[#FF3B30] hover:bg-[#FF3B30]/20 font-bold transition-all active:scale-95 text-sm w-full sm:w-auto">
                Logout 🚪
              </button>
            </div>

            <div className={`p-6 rounded-[2rem] ${theme.card} space-y-5`}>
              <h3 className="text-[13px] font-bold uppercase tracking-widest text-gray-500">Appearance</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {Object.keys(THEMES).map((themeKey) => (
                  <button key={themeKey} onClick={() => handleThemeChange(themeKey)} className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all active:scale-[0.98] ${currentTheme === themeKey ? `${THEMES[themeKey].accent} ring-1 ring-current` : `${theme.input}`}`}>
                    <span className="text-[15px] font-medium tracking-tight">{THEMES[themeKey].name}</span>
                    {currentTheme === themeKey && <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7"></path></svg>}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* 📝 Task Add Modal Component */}
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

      {/* 💸 Transaction Modal Component */}
      <AddTransactionModal 
        isOpen={isTxModalOpen}
        onClose={resetTxForm}
        editTxId={editTxId}
        amount={amount}
        setAmount={setAmount}
        txNote={txNote}
        setTxNote={setTxNote}
        txType={txType}
        setTxType={setTxType}
        txCategory={txCategory}
        setTxCategory={setTxCategory}
        handleSaveTransaction={handleSaveTransaction}
        theme={theme}
      />

      {/* 🔮 Minimalist Action Menu Popup */}
      {isActionMenuOpen && (
        <div 
          className="fixed inset-0 z-40 flex items-end justify-center bg-black/20 backdrop-blur-md animate-fade-in" 
          onClick={() => setIsActionMenuOpen(false)}
        >
          <div 
            className={`w-[85%] max-w-xs mb-32 p-1.5 rounded-[2rem] shadow-2xl border border-white/10 transform transition-all animate-slide-up ${theme.card}`} 
            onClick={e => e.stopPropagation()}
          >
            <div className="flex flex-col overflow-hidden rounded-[1.6rem]">
              
              {/* 📝 Task Option Row */}
              <button 
                onClick={() => { setIsTaskModalOpen(true); setIsActionMenuOpen(false); }} 
                className="flex items-center gap-3.5 w-full px-4 py-3.5 text-left transition-all active:bg-gray-500/10"
              >
                <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-[#007AFF]/10 text-[#007AFF]">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                </div>
                <span className={`text-[15px] font-medium tracking-tight flex-1 ${theme.textHead}`}>
                  Task အသစ်ထည့်ရန်
                </span>
                <svg className="w-3.5 h-3.5 text-gray-400 opacity-60" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>

              <div className="h-[0.5px] bg-gray-500/10 mx-4" />

              {/* 💸 Transaction Option Row */}
              <button 
                onClick={() => { resetTxForm(); setIsTxModalOpen(true); setIsActionMenuOpen(false); }} 
                className="flex items-center gap-3.5 w-full px-4 py-3.5 text-left transition-all active:bg-gray-500/10"
              >
                <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-[#34C759]/10 text-[#34C759]">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.214.13a1.166 1.166 0 001.533-.119L15 10.5M15 10.5a1.164 1.164 0 01-1.164 1.164h-1.671a1.164 1.164 0 01-1.164-1.164V9.164c0-.643.52-1.164 1.164-1.164h1.671c.643 0 1.164.52 1.164 1.164V10.5zm-5.5 5.5h.008v.008H9.5V16zm0-10h.008v.008H9.5V6zm10 10h.008v.008h-.008V16zm0-10h.008v.008h-.008V6z" />
                  </svg>
                </div>
                <span className={`text-[15px] font-medium tracking-tight flex-1 ${theme.textHead}`}>
                  Ref ငွေစာရင်းမှတ်ရန်
                </span>
                <svg className="w-3.5 h-3.5 text-gray-400 opacity-60" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>

            </div>
          </div>
        </div>
      )}

      {/* 📱 iOS FLOATING BOTTOM DOCK */}
      <nav className={`fixed bottom-4 left-1/2 -translate-x-1/2 w-[90%] max-w-md rounded-[2rem] px-2 py-1 flex justify-between items-center z-30 transition-all duration-500 ${theme.dock}`}>
        
        <button onClick={() => setActiveTab("dashboard")} className={`w-1/5 flex flex-col items-center gap-1 py-2 rounded-full transition-all duration-300 active:scale-95 ${activeTab === 'dashboard' ? theme.dockActive : 'hover:text-gray-400 opacity-60'}`}>
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"></path></svg>
        </button>

        <button onClick={() => setActiveTab("tasks")} className={`w-1/5 flex flex-col items-center gap-1 py-2 rounded-full transition-all duration-300 active:scale-95 ${activeTab === 'tasks' ? theme.dockActive : 'hover:text-gray-400 opacity-60'}`}>
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"></path></svg>
        </button>

        {/* 🌟 Dynamic Theme Colored Center Floating "+" Button */}
        <div className="w-1/5 flex justify-center relative -top-6">
          <button 
            onClick={() => setIsActionMenuOpen(!isActionMenuOpen)} 
            className={`w-14 h-14 flex items-center justify-center rounded-full text-white shadow-[0_8px_25px_rgba(0,0,0,0.25)] transition-all duration-300 active:scale-90 ${
              isActionMenuOpen 
                ? 'bg-[#FF3B30] rotate-45 shadow-red-500/20' 
                : `bg-gradient-to-tr ${
                    currentTheme === 'iosLight' ? 'from-[#007AFF] to-[#54A6FF]' :
                    currentTheme === 'iosDark' ? 'from-[#0A84FF] to-[#0055B3]' :
                    currentTheme === 'roseGold' ? 'from-[#FF2D55] to-[#FF6B8B]' :
                    currentTheme === 'deepPurple' ? 'from-[#BF5AF2] to-[#D68FFF]' : 
                    'from-[#007AFF] to-[#0A84FF]'
                  }`
            }`}
          >
            <svg className="w-7 h-7 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4"></path>
            </svg>
          </button>
        </div>

        <button onClick={() => setActiveTab("budget")} className={`w-1/5 flex flex-col items-center gap-1 py-2 rounded-full transition-all duration-300 active:scale-95 ${activeTab === 'budget' ? theme.dockActive : 'hover:text-gray-400 opacity-60'}`}>
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
        </button>

        <button onClick={() => setActiveTab("settings")} className={`w-1/5 flex flex-col items-center gap-1 py-2 rounded-full transition-all duration-300 active:scale-95 ${activeTab === 'settings' ? theme.dockActive : 'hover:text-gray-400 opacity-60'}`}>
          <img src={user.photoURL || `https://ui-avatars.com/api/?name=${user.email}`} alt="Profile" className={`w-7 h-7 rounded-full border-2 transition-all ${activeTab === 'settings' ? 'border-[#007AFF]' : 'border-transparent opacity-60'}`} />
        </button>
      </nav>

    </div>
  );
}

export default App;