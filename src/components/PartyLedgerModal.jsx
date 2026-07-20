import React, { useMemo } from 'react';
import { X, FileText, ArrowRightCircle, ArrowLeftCircle, Receipt } from 'lucide-react';

const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const [year, month, day] = parts;
    if (year.length === 4) {
      return `${day}-${month}-${year}`;
    }
  }
  return dateStr;
};

export default function PartyLedgerModal({ 
  isOpen, 
  onClose, 
  partyName, 
  salesBills = [], 
  purchaseBills = [], 
  receivedPayments = [], 
  vendorPayments = [] 
}) {
  
  const transactions = useMemo(() => {
    let txns = [];
    
    // Sales Bills (+ Receivable)
    salesBills.forEach(b => {
      const details = [
        b.bill_number ? `Bill #${b.bill_number}` : `Sales Bill`,
        b.vehicle_number,
        b.source && b.destination ? `${b.source} → ${b.destination}` : b.source,
        b.guest_name
      ].filter(Boolean).join(' | ');
      
      txns.push({
        id: `sale-${b.id}`,
        date: b.date || b.created_at?.split('T')[0],
        type: 'Sale',
        ref: details,
        charge: b.final_bill_amount || 0,
        credit: 0
      });
    });

    // Purchase Bills (- Receivable, i.e., Payable)
    purchaseBills.forEach(b => {
      const details = [
        b.bill_number ? `Bill #${b.bill_number}` : `Purchase Bill`,
        b.vehicle_number,
        b.source && b.destination ? `${b.source} → ${b.destination}` : b.source,
        b.guest_name
      ].filter(Boolean).join(' | ');

      txns.push({
        id: `purchase-${b.id}`,
        date: b.date || b.created_at?.split('T')[0],
        type: 'Purchase',
        ref: details,
        charge: 0,
        credit: b.final_bill_amount || 0
      });
    });

    // Received Payments (- Receivable)
    receivedPayments.forEach(p => {
      txns.push({
        id: `recv-${p.id}`,
        date: p.payment_date || p.created_at?.split('T')[0],
        type: 'Received Payment',
        ref: p.notes || p.payment_mode || '-',
        charge: 0,
        credit: p.amount || 0
      });
    });

    // Vendor Payments (+ Receivable, i.e., reduces Payable)
    vendorPayments.forEach(p => {
      txns.push({
        id: `paid-${p.id}`,
        date: p.payment_date || p.created_at?.split('T')[0],
        type: 'Vendor Payment',
        ref: p.notes || p.payment_mode || '-',
        charge: p.amount || 0,
        credit: 0
      });
    });

    // Sort chronologically
    txns.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Calculate running balance (Positive = Receivable, Negative = Payable)
    let runningBalance = 0;
    txns = txns.map(t => {
      runningBalance += t.charge;
      runningBalance -= t.credit;
      return {
        ...t,
        balance: runningBalance
      };
    });

    return txns;
  }, [salesBills, purchaseBills, receivedPayments, vendorPayments]);

  if (!isOpen) return null;

  const finalBalance = transactions.length > 0 ? transactions[transactions.length - 1].balance : 0;
  const isPayable = finalBalance < 0;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/50 shrink-0">
          <div>
            <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
              <FileText className="h-5 w-5 text-indigo-400" />
              Party Ledger: {partyName}
            </h2>
            <p className="text-sm text-slate-400 mt-1">Chronological history of all sales, purchases, and payments.</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-900 custom-scrollbar">
          
          {/* Summary Banner */}
          <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-800/50 border border-slate-700/50 p-4 rounded-xl mb-6">
            <div>
              <p className="text-sm text-slate-400 font-medium">Net Party Balance</p>
              <div className={`text-2xl font-black tracking-tight mt-1 ${isPayable ? 'text-rose-400' : 'text-emerald-400'}`}>
                ₹{Math.abs(finalBalance).toLocaleString()}
                <span className="text-sm font-semibold ml-2">
                  {isPayable ? '(Payable to them)' : finalBalance > 0 ? '(Receivable from them)' : ''}
                </span>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="bg-slate-950/50 border border-slate-800 rounded-xl overflow-x-auto shadow-inner">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/50 text-xs uppercase tracking-wider text-slate-400 font-semibold">
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Ref / Notes</th>
                  <th className="px-4 py-3 text-right text-emerald-400">Charge (+)</th>
                  <th className="px-4 py-3 text-right text-rose-400">Credit (-)</th>
                  <th className="px-4 py-3 text-right">Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50 text-sm">
                {transactions.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-4 py-12 text-center text-slate-500">
                      No transactions found for this party.
                    </td>
                  </tr>
                ) : (
                  transactions.map((txn, idx) => (
                    <tr key={txn.id || idx} className="hover:bg-slate-800/30 transition-colors">
                      <td className="px-4 py-3 text-slate-300 whitespace-nowrap">{formatDate(txn.date)}</td>
                      <td className="px-4 py-3 font-medium">
                        {txn.type === 'Sale' && <span className="text-indigo-400 flex items-center gap-1.5"><Receipt className="h-3.5 w-3.5"/> Sale</span>}
                        {txn.type === 'Purchase' && <span className="text-fuchsia-400 flex items-center gap-1.5"><Receipt className="h-3.5 w-3.5"/> Purchase</span>}
                        {txn.type === 'Received Payment' && <span className="text-emerald-400 flex items-center gap-1.5"><ArrowLeftCircle className="h-3.5 w-3.5"/> Received</span>}
                        {txn.type === 'Vendor Payment' && <span className="text-rose-400 flex items-center gap-1.5"><ArrowRightCircle className="h-3.5 w-3.5"/> Paid</span>}
                      </td>
                      <td className="px-4 py-3 text-slate-400 max-w-[300px] text-xs leading-relaxed" title={txn.ref}>{txn.ref}</td>
                      <td className="px-4 py-3 text-right font-mono text-emerald-400">
                        {txn.charge > 0 ? `₹${txn.charge.toLocaleString()}` : '—'}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-rose-400">
                        {txn.credit > 0 ? `₹${txn.credit.toLocaleString()}` : '—'}
                      </td>
                      <td className={`px-4 py-3 text-right font-mono font-bold ${txn.balance < 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                        {txn.balance < 0 ? '-' : ''}₹{Math.abs(txn.balance).toLocaleString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

        </div>

      </div>
    </div>
  );
}
