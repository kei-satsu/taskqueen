import React from 'react';

function AddTaskModal({ 
  isOpen, 
  onClose, 
  newTask, 
  setNewTask, 
  taskCategory, 
  setTaskCategory, 
  handleAddTask,
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
            📝 လုပ်ဆောင်စရာအသစ် ထည့်ရန်
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
        <form onSubmit={(e) => { handleAddTask(e); onClose(); }}>
          <div className="space-y-4">
            <div>
              <label className={`text-[11px] font-bold uppercase tracking-wider ml-1 mb-1 block ${theme.textSub}`}>
                Task Title
              </label>
              <input
                type="text"
                autoFocus
                placeholder="ဘာတွေ ပြီးမြောက်အောင် လုပ်မလဲ..."
                value={newTask}
                onChange={(e) => setNewTask(e.target.value)}
                className={`w-full px-4 py-4 rounded-2xl transition-all outline-none text-[15px] ${theme.input}`}
              />
            </div>

            <div>
              <label className={`text-[11px] font-bold uppercase tracking-wider ml-1 mb-1 block ${theme.textSub}`}>
                Category
              </label>
              <div className="relative">
                <select
                  value={taskCategory}
                  onChange={(e) => setTaskCategory(e.target.value)}
                  className={`w-full px-4 py-3.5 rounded-2xl text-sm font-medium outline-none appearance-none ${theme.input}`}
                >
                  <option>🎯 အထွေထွေ</option>
                  <option>📚 ပညာရေး</option>
                  <option>🛍️ ဈေးဝယ်</option>
                  <option>💻 အလုပ်</option>
                </select>
                <div className={`absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-xs ${theme.textSub}`}>
                  ▼
                </div>
              </div>
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
                className={`flex-1 text-[15px] font-semibold rounded-2xl transition-all ${theme.primary}`}
              >
                Save Task
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddTaskModal;