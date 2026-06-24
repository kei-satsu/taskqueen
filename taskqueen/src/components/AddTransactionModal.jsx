import React from 'react';

function AddTransactionModal({ 
  isOpen, 
  onClose, 
  editTxId,
  amount, 
  setAmount, 
  txNote, 
  setTxNote, 
  txType, 
  setTxType, 
  txCategory, 
  setTxCategory, 
  handleSaveTransaction,
  theme 
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center">
      {/* Backdrop - နောက်ခံမှောင်သွားမယ့် Layer (နှိပ်ရင် ပိတ်သွားမယ်) */}
      <div 
        className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity animate-fade-in"
        onClick={onClose}
      />

      {/* iOS Bottom Sheet Panel */}
      <div className={`w-full max-w-xl rounded-t-[2.5rem] p-6 pb-10 shadow-2xl z-10 
        transform transition-transform duration-300 animate-slide-up ${theme.card}`}
      >
        {/* Drag Indicator Bar (iOS Style) */}
        <div className="w-12 h-1.5 bg-gray-500/20 rounded-full mx-auto mb-5 cursor-pointer" onClick={onClose} />

        {/* Header */}
        <div className="flex justify-between items-center mb-5">
          <h3 className={`text-xl font-bold tracking-tight ${theme.textHead}`}>
            {editTxId ? '📝 စာရင်းပြင်ဆင်ရန်' : '💸 ငွေစာရင်းအသစ်ထည့်ရန်'}
          </h3>
          <button 
            type="button"
            onClick={onClose}
            className={`w-7 h-7 rounded-full bg-gray-500/10 flex items-center justify-center text-sm font-bold ${theme.textSub} active:scale-90 transition-all`}
          >
            ✕
          </button>
        </div>

        {/* Input Form */}
        <form onSubmit={handleSaveTransaction}>
          <div className="space-y-4">
            
            {/* 🔄 Expense / Income Segment Control */}
            <div className={`${theme.segmentBg} p-1 rounded-2xl flex`}>
              <button 
                type="button" 
                onClick={() => { setTxType("expense"); setTxCategory("🍔 အစားအသောက်"); }} 
                className={`flex-1 py-2.5 text-[13px] font-bold transition-all ${txType === 'expense' ? theme.segmentActive : theme.segmentInactive}`}
              >
                Expense
              </button>
              <button 
                type="button" 
                onClick={() => { setTxType("income"); setTxCategory("💰 လစာ/မုန့်ဖိုး"); }} 
                className={`flex-1 py-2.5 text-[13px] font-bold transition-all ${txType === 'income' ? theme.segmentActive : theme.segmentInactive}`}
              >
                Income
              </button>
            </div>

            {/* 💰 Amount Input */}
            <div>
              <label className={`text-[11px] font-bold uppercase tracking-wider ml-1 mb-1 block ${theme.textSub}`}>
                Amount (ပမာဏ)
              </label>
              <div className="relative">
                <span className={`absolute left-4 top-1/2 -translate-y-1/2 font-bold ${theme.textSub}`}>Ks</span>
                <input
                  type="number"
                  autoFocus
                  placeholder="0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className={`w-full pl-12 pr-4 py-4 rounded-2xl text-xl font-semibold outline-none transition-all ${theme.input}`}
                />
              </div>
            </div>

            {/* 🏷️ Category Dropdown */}
            <div>
              <label className={`text-[11px] font-bold uppercase tracking-wider ml-1 mb-1 block ${theme.textSub}`}>
                Category (အမျိုးအစား)
              </label>
              <div className="relative">
                <select
                  value={txCategory}
                  onChange={(e) => setTxCategory(e.target.value)}
                  className={`w-full px-4 py-3.5 rounded-2xl text-sm font-medium outline-none appearance-none transition-all ${theme.input}`}
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
                <div className={`absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-xs ${theme.textSub}`}>
                  ▼
                </div>
              </div>
            </div>

            {/* 📝 Notes Input */}
            <div>
              <label className={`text-[11px] font-bold uppercase tracking-wider ml-1 mb-1 block ${theme.textSub}`}>
                Notes (မှတ်စု)
              </label>
              <input
                type="text"
                placeholder="ဘယ်အတွက် သုံးလိုက်တာလဲ?..."
                value={txNote}
                onChange={(e) => setTxNote(e.target.value)}
                className={`w-full px-4 py-3.5 rounded-2xl text-sm outline-none transition-all ${theme.input}`}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-3">
              <button
                type="button"
                onClick={onClose}
                className={`flex-1 py-3.5 text-[15px] font-semibold rounded-2xl transition-all active:scale-95 ${theme.input}`}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className={`flex-1 text-[15px] font-semibold rounded-2xl transition-all text-white shadow-md active:scale-95 ${
                  txType === 'income' 
                    ? 'bg-[#34C759] hover:bg-[#2EB850]' 
                    : 'bg-[#FF3B30] hover:bg-[#E6352B]'
                }`}
              >
                {editTxId ? 'Save Changes' : 'Save Record'}
              </button>
            </div>

          </div>
        </form>
      </div>
    </div>
  );
}

export default AddTransactionModal;