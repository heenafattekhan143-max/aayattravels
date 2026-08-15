import React, { createContext, useContext, useState, useCallback } from 'react';
import { AlertTriangle, X } from 'lucide-react';

const ConfirmContext = createContext();

export const useConfirm = () => {
  const context = useContext(ConfirmContext);
  if (!context) throw new Error('useConfirm must be used within a ConfirmProvider');
  return context;
};

export const ConfirmProvider = ({ children }) => {
  const [state, setState] = useState({ isOpen: false, message: '', subMessage: '', confirmLabel: 'Confirm', resolve: null });

  const confirm = useCallback((message, options = {}) => {
    return new Promise((resolve) => {
      setState({ isOpen: true, message, subMessage: options.subMessage || '', confirmLabel: options.confirmLabel || 'Confirm', resolve });
    });
  }, []);

  const handleConfirm = () => {
    state.resolve?.(true);
    setState({ isOpen: false, message: '', subMessage: '', confirmLabel: 'Confirm', resolve: null });
  };

  const handleCancel = () => {
    state.resolve?.(false);
    setState({ isOpen: false, message: '', subMessage: '', confirmLabel: 'Confirm', resolve: null });
  };

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {state.isOpen && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700/60 rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden" role="dialog" aria-modal="true">
            {/* Header */}
            <div className="p-5 bg-gradient-to-r from-red-500/10 to-transparent border-b border-slate-800 flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-red-500/20 rounded-xl shrink-0">
                  <AlertTriangle className="h-5 w-5 text-red-400" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-100">Confirm Action</h3>
                  <p className="text-xs text-slate-400 mt-0.5">This action cannot be undone</p>
                </div>
              </div>
              <button onClick={handleCancel} className="p-1.5 text-slate-500 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition shrink-0">
                <X className="h-4 w-4" />
              </button>
            </div>
            {/* Body */}
            <div className="p-5">
              <p className="text-sm text-slate-300 leading-relaxed">{state.message}</p>
              {state.subMessage && <p className="text-xs text-slate-500 mt-2">{state.subMessage}</p>}
            </div>
            {/* Actions */}
            <div className="px-5 pb-5 flex gap-3 justify-end">
              <button onClick={handleCancel} className="px-4 py-2 text-sm font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl transition">
                Cancel
              </button>
              <button onClick={handleConfirm} className="px-4 py-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-500 rounded-xl transition shadow-lg shadow-red-600/20">
                {state.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
};
