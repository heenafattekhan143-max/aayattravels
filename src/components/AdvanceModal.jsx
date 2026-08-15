import React, { useState } from 'react';
import axios from 'axios';
import { X, Save, AlertCircle, Calendar, FileText, IndianRupee, ArrowUpRight, ArrowDownLeft } from 'lucide-react';

const API = '/api';

export default function AdvanceModal({ isOpen, onClose, partyType, partyId, partyName, onSuccess, defaultDirection = 'sent', showReceiveToggle = true }) {
  const [direction, setDirection] = useState(defaultDirection);
  const [formData, setFormData] = useState({
    amount: '',
    date: new Date().toISOString().split('T')[0],
    payment_mode: 'Cash',
    notes: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const isSent = direction === 'sent';

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.amount || isNaN(formData.amount) || Number(formData.amount) <= 0) {
      setError('Please enter a valid amount.');
      return;
    }
    if (!formData.date) {
      setError('Please select a date.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const payload = {
        party_type: partyType,
        party_id: partyId,
        party_name: partyName,
        amount: Number(formData.amount),
        date: formData.date,
        direction: direction,
        payment_mode: formData.payment_mode,
        notes: formData.notes
      };
      await axios.post(`${API}/advances`, payload);
      if (onSuccess) onSuccess();
      setFormData({ amount: '', date: new Date().toISOString().split('T')[0], payment_mode: 'Cash', notes: '' });
      setError('');
      onClose();
    } catch (err) {
      console.error('Error saving advance:', err);
      setError(err.response?.data?.detail || 'Failed to save advance.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-fade-in">
      <div className="bg-slate-900 border border-slate-700/50 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col">

        {/* Header */}
        <div className={`p-5 border-b border-slate-800 flex justify-between items-center ${isSent ? 'bg-gradient-to-r from-rose-500/10 to-transparent' : 'bg-gradient-to-r from-emerald-500/10 to-transparent'}`}>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl ${isSent ? 'bg-rose-500/20 text-rose-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
              {isSent ? <ArrowUpRight className="h-5 w-5" /> : <ArrowDownLeft className="h-5 w-5" />}
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">
                {isSent ? 'Send Advance' : 'Receive Advance'}
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">{partyName}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Direction Toggle — only shown when receive is applicable (e.g., Vendor, not Driver) */}
        {showReceiveToggle && (
          <div className="px-5 pt-4">
            <div className="flex bg-slate-950 border border-slate-800 rounded-xl p-1 gap-1">
              <button
                type="button"
                onClick={() => setDirection('sent')}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all duration-200 ${
                  isSent ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/30' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                <ArrowUpRight className="h-3.5 w-3.5" />
                Send Advance
              </button>
              <button
                type="button"
                onClick={() => setDirection('received')}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all duration-200 ${
                  !isSent ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                <ArrowDownLeft className="h-3.5 w-3.5" />
                Receive Advance
              </button>
            </div>
          </div>
        )}

        {/* Body */}
        <div className="p-5 overflow-y-auto">
          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm flex items-start gap-2">
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Amount */}
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Amount (₹) *</label>
              <div className="relative">
                <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <input
                  type="number"
                  name="amount"
                  value={formData.amount}
                  onChange={handleChange}
                  placeholder="0.00"
                  className={`w-full bg-slate-950 border rounded-xl pl-9 pr-4 py-2.5 text-slate-100 outline-none transition font-mono text-lg font-bold ${
                    isSent ? 'border-slate-700 focus:border-rose-500' : 'border-slate-700 focus:border-emerald-500'
                  }`}
                  required min="1" step="0.01" autoFocus
                />
              </div>
              {formData.amount && (
                <p className={`text-xs mt-1 font-semibold ${isSent ? 'text-rose-400' : 'text-emerald-400'}`}>
                  {isSent ? '↑ Paying out' : '↓ Receiving'} ₹{Number(formData.amount).toLocaleString('en-IN')}
                </p>
              )}
            </div>

            {/* Date */}
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Date *</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <input
                  type="date" name="date" value={formData.date} onChange={handleChange}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-4 py-2.5 text-slate-100 focus:border-indigo-500 outline-none transition [color-scheme:dark]"
                  required
                />
              </div>
            </div>

            {/* Payment Mode */}
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Payment Mode *</label>
              <div className="grid grid-cols-4 gap-2">
                {['Cash', 'UPI', 'Bank Transfer', 'Cheque'].map(mode => (
                  <button key={mode} type="button"
                    onClick={() => setFormData(prev => ({ ...prev, payment_mode: mode }))}
                    className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                      formData.payment_mode === mode
                        ? isSent ? 'bg-rose-500/20 border-rose-500/50 text-rose-300' : 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                    }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Notes <span className="font-normal text-slate-600">(optional)</span>
              </label>
              <div className="relative">
                <FileText className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                <textarea name="notes" value={formData.notes} onChange={handleChange}
                  placeholder="Any remarks..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-4 py-2.5 text-slate-100 focus:border-indigo-500 outline-none transition min-h-[72px] resize-none text-sm"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="pt-2 flex justify-end gap-3 border-t border-slate-800">
              <button type="button" onClick={onClose}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-semibold rounded-xl transition"
                disabled={loading}>
                Cancel
              </button>
              <button type="submit"
                className={`px-5 py-2 text-white text-sm font-semibold rounded-xl transition flex items-center gap-2 ${
                  isSent ? 'bg-rose-600 hover:bg-rose-500 shadow-lg shadow-rose-600/20' : 'bg-emerald-600 hover:bg-emerald-500 shadow-lg shadow-emerald-600/20'
                }`}
                disabled={loading}>
                {loading ? 'Saving...' : (
                  <><Save className="h-4 w-4" />{isSent ? 'Send Advance' : 'Record Receipt'}</>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
