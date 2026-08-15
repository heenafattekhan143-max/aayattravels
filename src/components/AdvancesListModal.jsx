import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { X, Trash2, Calendar, CreditCard, RefreshCw, ArrowUpRight, ArrowDownLeft, IndianRupee } from 'lucide-react';
import { useConfirm } from '../context/ConfirmContext';

const API = '/api';

const formatDate = (d) => {
  if (!d) return '-';
  const parts = d.split('-');
  if (parts.length === 3 && parts[0].length === 4) return `${parts[2]}-${parts[1]}-${parts[0]}`;
  return d;
};

export default function AdvancesListModal({ isOpen, onClose, partyType, partyId, partyName, showReceiveToggle = true }) {
  const confirm = useConfirm();
  const [advances, setAdvances] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('sent');

  const fetchAdvances = async () => {
    if (!partyType || !partyId) return;
    setLoading(true);
    setError('');
    try {
      const res = await axios.get(`${API}/advances/party/${partyType}/${partyId}`);
      setAdvances(res.data);
    } catch (err) {
      setError('Failed to load advances.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) fetchAdvances();
  }, [isOpen, partyType, partyId]);

  const handleDelete = async (adv) => {
    const ok = await confirm(
      `Delete advance of ₹${adv.amount.toLocaleString('en-IN')} dated ${formatDate(adv.date)}?`,
      { subMessage: 'This will reverse the advance adjustment in the net balance.', confirmLabel: 'Delete' }
    );
    if (!ok) return;
    try {
      await axios.delete(`${API}/advances/${adv.id}`);
      setAdvances(prev => prev.filter(a => a.id !== adv.id));
    } catch (err) {
      setError('Failed to delete advance.');
    }
  };

  if (!isOpen) return null;

  const sentList = advances.filter(a => a.direction !== 'received');
  const receivedList = advances.filter(a => a.direction === 'received');
  const totalSent = sentList.reduce((s, a) => s + a.amount, 0);
  const totalReceived = receivedList.reduce((s, a) => s + a.amount, 0);

  const displayList = activeTab === 'sent' ? sentList : receivedList;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-fade-in">
      <div className="bg-slate-900 border border-slate-700/50 w-full max-w-2xl max-h-[90vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col">

        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex justify-between items-center bg-gradient-to-r from-indigo-500/10 to-transparent">
          <div>
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <IndianRupee className="h-5 w-5 text-indigo-400" />
              Advance History
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">{partyName}</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={fetchAdvances} className="p-2 text-indigo-400 hover:text-indigo-300 hover:bg-slate-800 rounded-lg transition" title="Refresh">
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className={`grid ${showReceiveToggle ? 'grid-cols-2' : 'grid-cols-1'} gap-3 px-5 pt-4`}>
          <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-3 text-center">
            <div className="flex items-center justify-center gap-1.5 text-rose-400 mb-1">
              <ArrowUpRight className="h-3.5 w-3.5" />
              <span className="text-[10px] font-bold uppercase tracking-wider">Total Sent</span>
            </div>
            <div className="text-lg font-black text-rose-300 font-mono">₹{totalSent.toLocaleString('en-IN')}</div>
            <div className="text-[10px] text-rose-500 mt-0.5">{sentList.length} transactions</div>
          </div>
          {showReceiveToggle && (
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 text-center">
              <div className="flex items-center justify-center gap-1.5 text-emerald-400 mb-1">
                <ArrowDownLeft className="h-3.5 w-3.5" />
                <span className="text-[10px] font-bold uppercase tracking-wider">Total Received</span>
              </div>
              <div className="text-lg font-black text-emerald-300 font-mono">₹{totalReceived.toLocaleString('en-IN')}</div>
              <div className="text-[10px] text-emerald-500 mt-0.5">{receivedList.length} transactions</div>
            </div>
          )}
        </div>

        {/* Tab Toggle */}
        {showReceiveToggle && (
          <div className="px-5 pt-4">
          <div className="flex bg-slate-950 border border-slate-800 rounded-xl p-1 gap-1">
            <button
              onClick={() => setActiveTab('sent')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all duration-200 ${
                activeTab === 'sent' ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/30' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <ArrowUpRight className="h-3.5 w-3.5" />
              Sent ({sentList.length})
            </button>
            <button
              onClick={() => setActiveTab('received')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all duration-200 ${
                activeTab === 'received' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <ArrowDownLeft className="h-3.5 w-3.5" />
              Received ({receivedList.length})
            </button>
          </div>
        </div>
        )}

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5">
          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">{error}</div>
          )}

          {loading && advances.length === 0 ? (
            <div className="text-center py-10 text-slate-500">Loading...</div>
          ) : displayList.length === 0 ? (
            <div className="text-center py-12 text-slate-500 border border-dashed border-slate-800 rounded-xl flex flex-col items-center gap-3">
              {activeTab === 'sent' ? <ArrowUpRight className="h-8 w-8 text-slate-700" /> : <ArrowDownLeft className="h-8 w-8 text-slate-700" />}
              <p className="text-sm font-semibold">No {activeTab} advances found</p>
              <p className="text-xs text-slate-600">Records will appear here once added</p>
            </div>
          ) : (
            <div className="space-y-3">
              {displayList.map(adv => (
                <div key={adv.id}
                  className={`rounded-xl p-4 border flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all hover:shadow-lg ${
                    adv.direction !== 'received'
                      ? 'bg-rose-500/5 border-rose-500/20 hover:border-rose-500/40'
                      : 'bg-emerald-500/5 border-emerald-500/20 hover:border-emerald-500/40'
                  }`}>
                  <div className="flex items-start gap-3 flex-1">
                    <div className={`p-2 rounded-xl shrink-0 ${adv.direction !== 'received' ? 'bg-rose-500/15 text-rose-400' : 'bg-emerald-500/15 text-emerald-400'}`}>
                      {adv.direction !== 'received' ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownLeft className="h-4 w-4" />}
                    </div>
                    <div className="space-y-1 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-slate-200 flex items-center gap-1 text-sm">
                          <Calendar className="h-3.5 w-3.5 text-slate-500" />
                          {formatDate(adv.date)}
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 font-semibold flex items-center gap-1">
                          <CreditCard className="h-3 w-3" />
                          {adv.payment_mode}
                        </span>
                      </div>
                      {adv.notes && (
                        <p className="text-xs text-slate-400 italic bg-slate-900/50 px-3 py-1.5 rounded-lg">
                          "{adv.notes}"
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-between sm:justify-end gap-4 border-t border-slate-800/50 sm:border-0 pt-3 sm:pt-0">
                    <span className={`text-xl font-black font-mono ${adv.direction !== 'received' ? 'text-rose-400' : 'text-emerald-400'}`}>
                      {adv.direction !== 'received' ? '-' : '+'}₹{adv.amount.toLocaleString('en-IN')}
                    </span>
                    <button
                      onClick={() => handleDelete(adv)}
                      className="p-1.5 text-slate-600 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition"
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
