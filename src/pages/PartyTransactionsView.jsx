import React, { useState, useMemo } from 'react';
import axios from 'axios';
import { Search, Printer, FileSpreadsheet, MoreVertical, Edit2, CheckCircle, Eye, Trash2, X } from 'lucide-react';
import * as XLSX from 'xlsx-js-style';
import CustomSelect from '../components/CustomSelect';
import { useConfirm } from '../context/ConfirmContext';

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

export default function PartyTransactionsView({ title, type, bills, transactionLabel, onStatusChange, navigateTo, setEditingBillId }) {
  const confirm = useConfirm();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPartyName, setSelectedPartyName] = useState(null);
  const [openDropdownId, setOpenDropdownId] = useState(null);
  const [filterMonth, setFilterMonth] = useState('');
  const [filterYear, setFilterYear] = useState('');

  // Modals state
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [payingTxn, setPayingTxn] = useState(null);
  const [payAmount, setPayAmount] = useState('');
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewingTxn, setViewingTxn] = useState(null);
  const [customerDetails, setCustomerDetails] = useState(null);
  const [payError, setPayError] = useState('');

  React.useEffect(() => {
    if (viewingTxn && viewingTxn.bill && viewingTxn.bill.customer_id) {
      axios.get(`/api/customers/${viewingTxn.bill.customer_id}`)
        .then(res => setCustomerDetails(res.data))
        .catch(err => {
          console.error("Error fetching customer details:", err);
          setCustomerDetails(null);
        });
    } else {
      setCustomerDetails(null);
    }
  }, [viewingTxn]);

  const [payments, setPayments] = useState([]);

  React.useEffect(() => {
    if (type === 'vendor') {
      axios.get('/api/payments')
        .then(res => setPayments(res.data))
        .catch(console.error);
    }
  }, [type, bills]);

  // Derive unique parties and their total amounts
  const parties = useMemo(() => {
    const partyMap = {};
    bills.forEach(bill => {
      // Apply month/year filter to the left pane list
      if (bill.date) {
        const [year, month] = bill.date.split('-');
        if (filterYear && year !== filterYear) return;
        if (filterMonth && month !== filterMonth) return;
      } else {
        if (filterYear || filterMonth) return;
      }

      const name = type === 'customer' ? bill.customer_name : bill.vendor_name;
      if (!name) return;

      if (!partyMap[name]) {
        partyMap[name] = {
          name: name,
          phone: bill.phone_number || '',
          totalAmount: 0,
          transactions: [],
          rawBills: []
        };
      }
      partyMap[name].rawBills.push(bill);
    });

    Object.values(partyMap).forEach(party => {
      // Sort oldest first for FIFO
      const sortedBills = [...party.rawBills].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      if (type === 'vendor') {
        // FIFO logic for vendor payments
        const partyPayments = payments.filter(p => p.vendor_name === party.name);
        let remainingPayment = partyPayments.reduce((sum, p) => sum + (p.amount || 0), 0);

        sortedBills.forEach(bill => {
          const billTotal = bill.final_bill_amount || 0;
          let paidForThisBill = 0;

          if (remainingPayment >= billTotal) {
            paidForThisBill = billTotal;
            remainingPayment -= billTotal;
          } else if (remainingPayment > 0) {
            paidForThisBill = remainingPayment;
            remainingPayment = 0;
          }

          let computedStatus = 'Pending';
          if (paidForThisBill === billTotal && billTotal > 0) computedStatus = 'Paid';
          else if (paidForThisBill > 0) computedStatus = 'Partial';

          const remaining = billTotal - paidForThisBill;
          if (computedStatus !== 'Paid') {
            party.totalAmount += remaining;
          }

          party.transactions.push({
            id: bill.id,
            type: transactionLabel,
            number: bill.bill_no || bill.vehicle_number || bill.id.substring(0, 6).toUpperCase(),
            date: bill.date,
            total: billTotal,
            paid_amount: paidForThisBill,
            remaining_amount: remaining,
            status: computedStatus,
            bill: bill
          });
        });
      } else {
        // Standard logic for customer bills
        sortedBills.forEach(bill => {
          const billTotal = bill.final_bill_amount || 0;
          const paidForThisBill = bill.paid_amount || 0;
          const remaining = billTotal - paidForThisBill;
          const computedStatus = bill.status || 'Pending';

          if (computedStatus !== 'Paid') {
            party.totalAmount += remaining;
          }

          party.transactions.push({
            id: bill.id,
            type: transactionLabel,
            number: bill.bill_no || bill.vehicle_number || bill.id.substring(0, 6).toUpperCase(),
            date: bill.date,
            total: billTotal,
            paid_amount: paidForThisBill,
            remaining_amount: remaining,
            status: computedStatus,
            bill: bill
          });
        });
      }
      
      // Sort newest first for display
      party.transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    });

    return Object.values(partyMap).sort((a, b) => a.name.localeCompare(b.name));
  }, [bills, type, transactionLabel, filterMonth, filterYear, payments]);

  const filteredParties = parties.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));

  // Auto-select first party or adjust selection based on filtered list
  React.useEffect(() => {
    if (filteredParties.length > 0) {
      const exists = filteredParties.some(p => p.name === selectedPartyName);
      if (!exists) {
        setSelectedPartyName(filteredParties[0].name);
      }
    } else {
      setSelectedPartyName(null);
    }
  }, [filteredParties, selectedPartyName]);

  const selectedParty = parties.find(p => p.name === selectedPartyName);

  // Filter transactions by month/year
  const filteredTransactions = useMemo(() => {
    if (!selectedParty) return [];
    return selectedParty.transactions.filter(txn => {
      if (!txn.date) return true;
      const [year, month] = txn.date.split('-');
      if (filterYear && year !== filterYear) return false;
      if (filterMonth && month !== filterMonth) return false;
      return true;
    }).sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [selectedParty, filterMonth, filterYear]);

  const totalSale = filteredTransactions.reduce((sum, t) => sum + (t.total || 0), 0);
  const totalProfit = filteredTransactions.reduce((sum, t) => sum + (t.bill.profit || 0), 0);

  // Total across ALL parties filtered by month/year
  const totalBusinessAmount = useMemo(() => {
    return bills.filter(bill => {
      if (!bill.date) return true;
      const [year, month] = bill.date.split('-');
      if (filterYear && year !== filterYear) return false;
      if (filterMonth && month !== filterMonth) return false;
      return true;
    }).reduce((sum, bill) => sum + (bill.final_bill_amount || 0), 0);
  }, [bills, filterMonth, filterYear]);

  const getTaxSummary = () => {
    if (!viewingTxn || !viewingTxn.bill || !viewingTxn.bill.table_items) return [];
    const summaryMap = {};
    viewingTxn.bill.table_items.forEach(item => {
      const gstRate = parseFloat(item.gst_rate) || 0;
      if (gstRate === 0) return;
      const amountWithoutGst = parseFloat(item.amount_without_gst) || 0;
      const amountWithGst = parseFloat(item.amount_with_gst) || 0;
      const taxAmt = amountWithGst - amountWithoutGst;

      if (!summaryMap[gstRate]) {
        summaryMap[gstRate] = {
          hsn: "9964",
          taxableAmount: 0,
          cgstRate: gstRate / 2,
          cgstAmount: 0,
          sgstRate: gstRate / 2,
          sgstAmount: 0,
          totalTax: 0
        };
      }
      summaryMap[gstRate].taxableAmount += amountWithoutGst;
      summaryMap[gstRate].cgstAmount += taxAmt / 2;
      summaryMap[gstRate].sgstAmount += taxAmt / 2;
      summaryMap[gstRate].totalTax += taxAmt;
    });
    return Object.values(summaryMap);
  };

  const printSubtotalExclTax = viewingTxn && viewingTxn.bill ? (viewingTxn.bill.table_items || []).reduce((sum, item) => sum + (item.amount_without_gst || 0), 0) : 0;
  const printGstAmount = viewingTxn && viewingTxn.bill ? (viewingTxn.bill.table_items || []).reduce((sum, item) => sum + ((item.amount_with_gst || 0) - (item.amount_without_gst || 0)), 0) : 0;

  const handlePrint = () => {
    window.print();
  };

  const handleExport = () => {
    if (!selectedParty) return;
    const rows = filteredTransactions.map(t => ({
      Type: t.type,
      Number: t.number,
      Date: t.date,
      Total: t.total,
      Status: t.status
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Transactions");
    XLSX.writeFile(wb, `${selectedParty.name}_Transactions.xlsx`);
  };

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    if (!payingTxn) return;
    const amt = parseFloat(payAmount);
    if (isNaN(amt) || amt <= 0) {
      setPayError("Please enter a valid positive payment amount.");
      return;
    }
    
    if (type === 'vendor') {
      try {
        await axios.post('/api/payments', {
          vendor_id: payingTxn.bill.customer_id || payingTxn.bill.vendor_id || '', 
          vendor_name: selectedParty.name,
          amount: amt,
          payment_date: new Date().toISOString().split('T')[0],
          payment_mode: 'Cash',
          notes: 'Recorded from Party View'
        });
        
        setIsPayModalOpen(false);
        setPayAmount('');
        setPayingTxn(null);
        setPayError('');
        
        // Refresh local payments to trigger FIFO recalculation
        const res = await axios.get('/api/payments');
        setPayments(res.data);
        
        if (onStatusChange) onStatusChange();
      } catch (err) {
        console.error("Payment failed:", err);
        setPayError("Failed to record vendor payment.");
      }
      return;
    }

    const currentPaid = payingTxn.paid_amount || 0;
    const maxAllowed = payingTxn.total - currentPaid;
    if (amt > maxAllowed) {
      setPayError(`Payment amount cannot exceed the remaining balance of ₹${maxAllowed.toLocaleString(undefined, { minimumFractionDigits: 2 })}`);
      return;
    }

    const newPaidAmount = currentPaid + amt;
    let newStatus = 'Partial';
    if (newPaidAmount >= payingTxn.total) {
      newStatus = 'Paid';
    }

    try {
      await axios.patch(`/api/bills/${payingTxn.id}/status`, {
        status: newStatus,
        paid_amount: newPaidAmount
      });
      setIsPayModalOpen(false);
      setPayAmount('');
      setPayingTxn(null);
      setPayError('');
      if (onStatusChange) onStatusChange();
    } catch (err) {
      console.error("Payment failed:", err);
      setPayError("Failed to record payment. Please try again.");
    }
  };

  const handleDelete = async (txnId) => {
    const isConfirmed = await confirm("Are you sure you want to delete this bill record permanently?");
    if (!isConfirmed) return;
    try {
      await axios.delete(`/api/bills/${txnId}`);
      if (onStatusChange) onStatusChange();
    } catch (err) {
      console.error("Delete failed:", err);
      alert("Failed to delete bill record.");
    }
  };

  const handleMarkPaid = async (txnId) => {
    try {
      const fullBill = bills.find(b => b.id === txnId);
      const totalAmount = fullBill ? (fullBill.final_bill_amount || 0) : 0;
      await axios.patch(`/api/bills/${txnId}/status`, {
        status: 'Paid',
        paid_amount: totalAmount
      });
      if (onStatusChange) onStatusChange();
    } catch (err) {
      console.error("Failed to update status:", err);
      alert("Failed to mark transaction as paid.");
    }
  };

  const handleRevertStatus = async (txnId) => {
    try {
      await axios.patch(`/api/bills/${txnId}/status`, {
        status: 'Pending',
        paid_amount: 0
      });
      setOpenDropdownId(null);
      if (onStatusChange) onStatusChange();
    } catch (err) {
      console.error("Failed to update status:", err);
      alert("Failed to revert transaction status.");
    }
  };

  return (
    <div className="h-full flex bg-slate-900 overflow-hidden text-slate-100 rounded-lg border border-slate-800">

      {/* LEFT PANE - Parties List */}
      <div className="w-80 border-r border-slate-800 flex flex-col bg-slate-950/50 shrink-0">
        <div className="p-4 border-b border-slate-800 bg-slate-900/50">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-slate-200">{title} <span className="text-slate-500 text-xs">v</span></h2>
          </div>
          <div className="relative mb-3">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search Party Name"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-full pl-9 pr-4 py-2 text-sm outline-none focus:border-indigo-500 transition"
            />
          </div>
          {/* Month / Year filter + Total Business */}
          <div className="flex gap-2 mb-3">
            <div className="flex-1">
              <CustomSelect
                value={filterMonth}
                onChange={(val) => setFilterMonth(val)}
                options={Array.from({ length: 12 }).map((_, i) => ({
                  value: (i + 1).toString().padStart(2, '0'),
                  label: new Date(0, i).toLocaleString('default', { month: 'short' })
                }))}
                placeholder="All Months"
              />
            </div>
            <div className="flex-1">
              <CustomSelect
                value={filterYear}
                onChange={(val) => setFilterYear(val)}
                options={[
                  { value: '2024', label: '2024' },
                  { value: '2025', label: '2025' },
                  { value: '2026', label: '2026' },
                  { value: '2027', label: '2027' }
                ]}
                placeholder="All Years"
              />
            </div>
          </div>
          {/* Total Business Amount */}
          <div className={`flex items-center justify-between px-3 py-2.5 rounded-xl border ${type === 'vendor' ? 'bg-rose-500/10 border-rose-500/20' : 'bg-emerald-500/10 border-emerald-500/20'}`}>
            <span className={`text-xs font-semibold ${type === 'vendor' ? 'text-rose-300' : 'text-emerald-300'}`}>{type === 'vendor' ? 'Total Purchase' : 'Total Business'}</span>
            <span className={`text-base font-bold font-mono ${type === 'vendor' ? 'text-rose-400' : 'text-emerald-400'}`}>
              ₹{totalBusinessAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        <div className="flex justify-between px-4 py-2 bg-slate-800/30 border-b border-slate-800 text-xs font-semibold text-slate-400">
          <span>Party Name</span>
          <span>Pending Amt</span>
        </div>

        {/* Parties List */}
        <div className="flex-1 overflow-y-auto">
          {filteredParties.map((party, idx) => (
            <div
              key={idx}
              onClick={() => setSelectedPartyName(party.name)}
              className={`flex justify-between items-center px-4 py-3 cursor-pointer border-b border-slate-800/50 transition-colors ${selectedPartyName === party.name
                ? 'bg-indigo-500/10 border-l-4 border-l-indigo-500'
                : 'hover:bg-slate-800/40 border-l-4 border-l-transparent'
                }`}
            >
              <span className={`font-semibold text-sm ${selectedPartyName === party.name ? 'text-indigo-300' : 'text-slate-300'}`}>
                {party.name}
              </span>
              <span className={`text-sm font-mono ${party.totalAmount > 0 ? (type === 'vendor' ? 'text-rose-400' : 'text-emerald-400') : 'text-slate-400'}`}>
                {party.totalAmount > 0 ? party.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 }) : '0.00'}
              </span>
            </div>
          ))}
          {filteredParties.length === 0 && (
            <div className="p-6 text-center text-slate-500 text-sm">No parties found.</div>
          )}
        </div>
      </div>

      {/* RIGHT PANE - Party Details & Transactions */}
      <div className="flex-1 flex flex-col bg-slate-950 overflow-hidden relative">
        {selectedParty ? (
          <>
            {/* Top Header */}
            <div className="px-6 py-5 border-b border-slate-800 bg-slate-900/30 flex justify-between items-center">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h1 className="text-xl font-bold text-slate-100 uppercase tracking-wider">{selectedParty.name}</h1>
                  <button className="text-indigo-400 hover:bg-indigo-400/10 p-1 rounded transition">
                    <Edit2 className="h-4 w-4" />
                  </button>
                </div>
                <div className="text-xs text-slate-500 font-medium">
                  Phone Number
                  <p className="text-sm text-slate-300 font-mono mt-0.5">{selectedParty.phone || 'N/A'}</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className={`flex items-center gap-3 px-4 py-2.5 rounded-xl border ${type === 'vendor' ? 'bg-rose-500/10 border-rose-500/20' : 'bg-emerald-500/10 border-emerald-500/20'}`}>
                  <span className={`text-xs font-semibold uppercase tracking-wider ${type === 'vendor' ? 'text-rose-300' : 'text-emerald-300'}`}>Total Bills Amount</span>
                  <span className={`text-lg font-bold font-mono ${type === 'vendor' ? 'text-rose-400' : 'text-emerald-400'}`}>
                    ₹{totalSale.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
                {type === 'vendor' && (
                  <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl border bg-emerald-500/10 border-emerald-500/20">
                    <span className="text-xs font-semibold uppercase tracking-wider text-emerald-300">Total Profit</span>
                    <span className="text-lg font-bold font-mono text-emerald-400">
                      ₹{totalProfit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Transactions Section */}
            <div className="flex-1 flex flex-col min-h-0">
              {/* Filter + Total bar */}
              <div className="px-6 py-3 flex flex-wrap justify-between items-center gap-3 bg-slate-900/40 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <h3 className="font-semibold text-slate-300 mr-2">Transactions</h3>
                  {/* Month filter */}
                  <div className="w-32">
                    <CustomSelect
                      value={filterMonth}
                      onChange={(val) => setFilterMonth(val)}
                      options={Array.from({ length: 12 }).map((_, i) => ({
                        value: (i + 1).toString().padStart(2, '0'),
                        label: new Date(0, i).toLocaleString('default', { month: 'short' })
                      }))}
                      placeholder="All Months"
                    />
                  </div>
                  {/* Year filter */}
                  <div className="w-28">
                    <CustomSelect
                      value={filterYear}
                      onChange={(val) => setFilterYear(val)}
                      options={[
                        { value: '2024', label: '2024' },
                        { value: '2025', label: '2025' },
                        { value: '2026', label: '2026' },
                        { value: '2027', label: '2027' }
                      ]}
                      placeholder="All Years"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  {/* Action icons */}
                  <div className="flex items-center gap-3 text-slate-400">
                    <button className="hover:text-slate-200 transition p-1" onClick={handlePrint}><Printer className="h-4 w-4" /></button>
                    <button className="text-emerald-500 hover:bg-emerald-500/10 p-1 rounded transition" onClick={handleExport}><FileSpreadsheet className="h-4 w-4" /></button>
                  </div>
                </div>
              </div>

              {/* Transactions Table */}
              {/* Transactions Table */}
              <div className="flex-1 overflow-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="sticky top-0 bg-slate-900 shadow-sm z-10">
                    <tr className="bg-table-header border-b border-slate-700 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                      <th className="px-6 py-3">Type / Number</th>
                      <th className="px-6 py-3">Date</th>
                      {type === 'vendor' ? (
                        <>
                          <th className="px-6 py-3 text-right">Total Amount</th>
                          <th className="px-6 py-3 text-right">Partial Paid</th>
                          <th className="px-6 py-3 text-right">Remaining</th>
                        </>
                      ) : (
                        <th className="px-6 py-3 text-right">Total</th>
                      )}
                      <th className="px-6 py-3 text-center">Status</th>
                      <th className="px-6 py-3 text-center w-36">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {filteredTransactions.map((txn, idx) => (
                      <tr key={idx} className="hover:bg-slate-800/20 transition-colors text-sm border-b border-slate-800/40">
                        {/* Type / Number */}
                        <td className="px-6 py-3.5">
                          <div className="font-semibold text-slate-200">{txn.type}</div>
                          <div className="font-mono text-xs text-indigo-300 mt-0.5">{txn.number}</div>
                        </td>
                        
                        {/* Date */}
                        <td className="px-6 py-3.5 text-slate-300">
                          <div>{txn.date}</div>
                          <div className="text-[10px] text-slate-500 uppercase tracking-wider mt-0.5">Date</div>
                        </td>

                        {/* Amounts */}
                        {type === 'vendor' ? (
                          <>
                            <td className="px-6 py-3.5 text-right font-mono text-slate-200 font-semibold">
                              <div>₹{txn.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                              <div className="text-[10px] text-slate-500 uppercase tracking-wider font-sans font-normal mt-0.5">Total</div>
                            </td>
                            <td className="px-6 py-3.5 text-right font-mono text-emerald-400">
                              <div>₹{txn.paid_amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                              <div className="text-[10px] text-slate-500 uppercase tracking-wider font-sans font-normal mt-0.5">Paid</div>
                            </td>
                            <td className={`px-6 py-3.5 text-right font-mono font-bold ${txn.remaining_amount > 0 ? 'text-rose-400' : 'text-slate-400'}`}>
                              <div>₹{txn.remaining_amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                              <div className="text-[10px] text-slate-500 uppercase tracking-wider font-sans font-normal mt-0.5">Remaining</div>
                            </td>
                          </>
                        ) : (
                          <td className="px-6 py-3.5 text-right font-mono font-medium text-slate-200">
                            <div>₹{txn.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                            <div className="text-[10px] text-slate-500 uppercase tracking-wider font-sans font-normal mt-0.5">Total</div>
                          </td>
                        )}

                        {/* Status */}
                        <td className="px-6 py-3.5 text-center">
                          <div>
                            <span className={`px-2 py-0.5 rounded text-[10px] uppercase tracking-wider font-bold border ${
                              txn.status === 'Paid'
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                : txn.status === 'Partial'
                                ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                            }`}>
                              {txn.status}
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-500 uppercase tracking-wider mt-1">Status</div>
                        </td>

                        {/* Actions */}
                        <td className="px-6 py-3.5 text-center">
                          <div className="flex flex-col items-center gap-1.5 justify-center">
                            {/* Primary Button */}
                            {type === 'vendor' ? (
                              txn.status !== 'Paid' ? (
                                <button
                                  onClick={(e) => { e.stopPropagation(); setPayingTxn(txn); setPayAmount(''); setPayError(''); setIsPayModalOpen(true); }}
                                  className="w-full text-center py-1 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-lg transition shadow-lg shadow-rose-900/20"
                                >
                                  Pay
                                </button>
                              ) : (
                                <span className="text-[10px] uppercase tracking-wider font-bold text-slate-500 leading-normal h-6 flex items-center justify-center">Fully Paid</span>
                              )
                            ) : (
                              txn.status === 'Pending' ? (
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleMarkPaid(txn.id); }}
                                  className="w-full text-center py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg transition shadow-lg shadow-emerald-900/20"
                                >
                                  Mark Paid
                                </button>
                              ) : (
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleRevertStatus(txn.id); }}
                                  className="w-full text-center py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-lg transition border border-slate-700"
                                >
                                  Revert
                                </button>
                              )
                            )}

                            {/* Secondary CRUD Icons */}
                            {(() => {
                              const isActionDisabled = txn.status === 'Paid' || txn.status === 'Partial' || (txn.paid_amount || 0) > 0;
                              return (
                                <div className="flex items-center gap-2.5 mt-1">
                                  <button
                                    onClick={(e) => { e.stopPropagation(); setViewingTxn(txn); setIsViewModalOpen(true); }}
                                    className="text-slate-400 hover:text-slate-100 transition p-0.5"
                                    title="View Invoice"
                                  >
                                    <Eye className="h-3.5 w-3.5" />
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setEditingBillId(txn.id);
                                      navigateTo('generate-bill');
                                    }}
                                    disabled={isActionDisabled}
                                    className={`transition p-0.5 ${isActionDisabled ? 'opacity-20 cursor-not-allowed text-slate-500' : 'text-slate-400 hover:text-amber-400'}`}
                                    title={isActionDisabled ? "Edit Disabled (Payment Recorded)" : "Edit"}
                                  >
                                    <Edit2 className="h-3.5 w-3.5" />
                                  </button>
                                  <button
                                    onClick={(e) => { e.stopPropagation(); handleDelete(txn.id); }}
                                    disabled={isActionDisabled}
                                    className={`transition p-0.5 ${isActionDisabled ? 'opacity-20 cursor-not-allowed text-slate-500' : 'text-slate-400 hover:text-rose-400'}`}
                                    title={isActionDisabled ? "Delete Disabled (Payment Recorded)" : "Delete"}
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              );
                            })()}
                          </div>
                        </td>
                      </tr>
                    ))}
                    {filteredTransactions.length === 0 && (
                      <tr>
                        <td colSpan={type === 'vendor' ? '8' : '6'} className="px-6 py-8 text-center text-slate-500">No transactions found.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-slate-500">
            Select a party to view transactions
          </div>
        )}
      </div>

      {/* PAY MODAL */}
      {isPayModalOpen && payingTxn && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl p-6 shadow-2xl space-y-6">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-rose-400 uppercase tracking-wider">Record Payment (Vendor)</h3>
              <button
                onClick={() => { setIsPayModalOpen(false); setPayingTxn(null); setPayAmount(''); setPayError(''); }}
                className="text-slate-400 hover:text-slate-200 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {payError && (
              <div className="bg-rose-500/15 border border-rose-500/20 text-rose-400 p-3 rounded-xl text-xs font-semibold">
                {payError}
              </div>
            )}

            <div className="space-y-4 text-sm text-slate-300">
              <div className="flex justify-between border-b border-slate-800/50 pb-2">
                <span>Vehicle / Ref:</span>
                <span className="font-mono text-indigo-300 font-bold">{payingTxn.number}</span>
              </div>
              <div className="flex justify-between border-b border-slate-800/50 pb-2">
                <span>Total Amount:</span>
                <span className="font-mono font-semibold text-slate-200">₹{payingTxn.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between border-b border-slate-800/50 pb-2">
                <span>Already Paid:</span>
                <span className="font-mono text-emerald-400">₹{payingTxn.paid_amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between font-bold text-rose-400 pb-2 border-b-2 border-slate-800">
                <span>Remaining Balance:</span>
                <span className="font-mono">₹{payingTxn.remaining_amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
            </div>

            <form onSubmit={handlePaymentSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Payment Amount (₹) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="Enter payment amount..."
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 focus:border-rose-500 outline-none rounded-xl px-4 py-2.5 text-sm text-slate-100 transition font-mono"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 px-4 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl shadow-lg transition duration-150"
              >
                Submit Payment
              </button>
            </form>
          </div>
        </div>
      )}

      {/* VIEW INVOICE MODAL */}
      {isViewModalOpen && viewingTxn && viewingTxn.bill && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="relative w-full max-w-4xl bg-slate-900 rounded-2xl border border-slate-700 shadow-2xl overflow-hidden flex flex-col my-8 max-h-[90vh]">
            {/* Header */}
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-800 bg-slate-950/80">
              <h2 className="text-lg font-bold text-slate-100 uppercase tracking-wider">Invoice Details</h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const printContent = document.getElementById("invoice-print-area").innerHTML;
                    const originalContent = document.body.innerHTML;
                    document.body.innerHTML = printContent;
                    window.print();
                    document.body.innerHTML = originalContent;
                    window.location.reload(); // Reload to restore event listeners
                  }}
                  className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold rounded-lg transition"
                >
                  <Printer className="h-4 w-4" /> Print / PDF
                </button>
                <button
                  onClick={() => { setIsViewModalOpen(false); setViewingTxn(null); }}
                  className="p-1.5 text-slate-400 hover:text-slate-200 bg-slate-800 rounded-lg hover:bg-slate-700 transition"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
            
            {/* Body */}
            <div className="p-6 overflow-y-auto flex-1 bg-slate-950/50">
              <div id="invoice-print-area" className="bg-white text-slate-900 p-8 md:p-12 rounded-xl text-left print-border min-h-[11in] flex flex-col justify-between">
                <div>


                  {/* Top Company Header Box */}
                  <div className="border border-slate-700 text-xs text-slate-800">
                    {/* Row 1: Company Title */}
                    <div className="py-2.5 px-3 border-b border-slate-700 text-center bg-slate-50">
                      <h1 className="text-2xl font-black tracking-tight leading-none" style={{ color: '#0096FF' }}>PURVI TOURS &amp; TRAVELS</h1>
                      <p className="text-[11px] mt-1 font-bold text-slate-600">PANCHIL NAGAR NEAR RAHUL S MITRA MANDAL GHORPADI GAON PUNE 41101</p>
                    </div>
                    {/* Row 2: Contact Info */}
                    <div className="grid grid-cols-3 border-b border-slate-700 divide-x divide-slate-700">
                      <div className="p-1.5 px-2.5">
                        <span className="font-bold text-slate-500">Phone:</span> <span className="font-bold text-slate-900">7821010996</span>
                      </div>
                      <div className="p-1.5 px-2.5">
                        <span className="font-bold text-slate-500">Email:</span> <span className="font-bold text-slate-900">ravisable099@gmail.com</span>
                      </div>
                      <div className="p-1.5 px-2.5">
                        <span className="font-bold text-slate-500">SAC Code:</span> <span className="font-bold text-slate-900">998559</span>
                      </div>
                    </div>
                    {/* Row 3: GSTIN & State */}
                    <div className="grid grid-cols-2 divide-x divide-slate-700">
                      <div className="p-1.5 px-2.5">
                        <span className="font-bold text-slate-500">GSTIN:</span> <span className="font-bold text-slate-900">27FPNPS2300C1Z1</span>
                      </div>
                      <div className="p-1.5 px-2.5">
                        <span className="font-bold text-slate-500">State:</span> <span className="font-bold text-slate-900">27-Maharashtra</span>
                      </div>
                    </div>
                  </div>

                  {/* Customer, Invoice & Guest Details Box */}
                  <div className="border-x border-b border-slate-700 grid grid-cols-12 text-xs text-slate-800 divide-x divide-slate-700">
                    
                    {/* Bill To Column */}
                    <div className="col-span-5 flex flex-col justify-between">
                      <div className="bg-slate-50 border-b border-slate-700 px-2.5 py-1 font-bold text-slate-600 text-[10px] uppercase">
                        Bill To:
                      </div>
                      <div className="p-2.5 space-y-1 flex-1">
                        <h3 className="text-sm font-black text-slate-900 uppercase">{viewingTxn.bill.customer_name}</h3>
                        {customerDetails?.billing_address ? (
                          <p className="text-slate-600 font-bold leading-tight">{customerDetails.billing_address}</p>
                        ) : (
                          <p className="text-slate-400 italic font-medium">No address provided</p>
                        )}
                        <div className="pt-1 space-y-1">
                          <p>
                            <span className="font-bold text-slate-500">Contact No:</span>{" "}
                            <span className="font-bold text-slate-900">{viewingTxn.bill.phone_number || customerDetails?.phone || '—'}</span>
                          </p>
                          <p>
                            <span className="font-bold text-slate-500">GSTIN:</span>{" "}
                            <span className="font-bold text-slate-900">{customerDetails?.gstin || '—'}</span>
                          </p>
                          <p>
                            <span className="font-bold text-slate-500">State:</span>{" "}
                            <span className="font-bold text-slate-900">{customerDetails?.state ? `27-${customerDetails.state}` : '27-Maharashtra'}</span>
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Invoice Details Column */}
                    <div className="col-span-4 flex flex-col justify-between">
                      <div className="bg-slate-50 border-b border-slate-700 px-2.5 py-1 font-bold text-slate-600 text-[10px] uppercase">
                        Invoice Details:
                      </div>
                      <div className="p-2.5 space-y-1.5 flex-1">
                        <p>
                          <span className="font-bold text-slate-500">Invoice No.:</span>{" "}
                          <span className="font-bold text-slate-900">{viewingTxn.bill.bill_no || viewingTxn.bill.id.substring(0, 6).toUpperCase()}</span>
                        </p>
                        <p>
                          <span className="font-bold text-slate-500">Date:</span>{" "}
                          <span className="font-bold text-slate-900">{formatDate(viewingTxn.bill.date)}</span>
                        </p>
                        <p>
                          <span className="font-bold text-slate-500">Place Of Supply:</span>{" "}
                          <span className="font-bold text-slate-900">{customerDetails?.state ? `27-${customerDetails.state}` : '27-Maharashtra'}</span>
                        </p>
                      </div>
                    </div>

                    {/* Guest Name Column */}
                    <div className="col-span-3 flex flex-col justify-between">
                      <div className="bg-slate-50 border-b border-slate-700 px-2.5 py-1 font-bold text-slate-600 text-[10px] uppercase">
                        Guest & Vehicle:
                      </div>
                      <div className="p-2.5 space-y-1.5 flex-1">
                        <div>
                          <p className="font-bold text-slate-500 text-[10px]">Guest name:</p>
                          <p className="text-xs font-black text-slate-900 uppercase">
                            {viewingTxn.bill.guest_name || '—'}
                          </p>
                        </div>
                        <div className="pt-1.5 border-t border-slate-200 mt-1.5">
                          <p className="font-bold text-slate-500 text-[10px]">Vehicle No:</p>
                          <p className="text-xs font-black text-slate-900 uppercase">
                            {viewingTxn.bill.vehicle_number || '—'}
                          </p>
                        </div>
                      </div>
                    </div>

                  </div>

                  <div className="mb-2"></div>

                  {/* Table Ledger items */}
                  <div className="mt-8">
                    <table className="w-full text-left text-[11px] border-collapse border border-slate-400">
                      <colgroup>
                        <col style={{ width: '25%' }} />
                        <col style={{ width: '8%' }} />
                        <col />
                        <col style={{ width: '9%' }} />
                        <col style={{ width: '8%' }} />
                        <col style={{ width: '8%' }} />
                        <col style={{ width: '8%' }} />
                        <col style={{ width: '7%' }} />
                        <col style={{ width: '11%' }} />
                        <col />
                      </colgroup>
                      <thead>
                        <tr className="border-b border-slate-300 text-slate-700 bg-slate-50 uppercase text-[9px] tracking-wider">
                          <th className="p-2.5 font-bold border border-slate-400">Rental Package Plan</th>
                          <th className="p-2.5 font-bold text-center border border-slate-400">Rate</th>
                          <th className="p-2.5 font-bold text-center border border-slate-400">Date</th>
                          <th className="p-2.5 font-bold text-center border border-slate-400">Total Distance</th>
                          <th className="p-2.5 font-bold text-center border border-slate-400">Extra KMs</th>
                          <th className="p-2.5 font-bold text-center border border-slate-400">Total Hours</th>
                          <th className="p-2.5 font-bold text-center border border-slate-400">Extra Hours</th>
                          <th className="p-2.5 font-bold text-center border border-slate-400">DA</th>
                          <th className="p-2.5 font-bold text-center border border-slate-400">Night Allowance</th>
                          <th className="p-2.5 font-bold text-right border border-slate-400">Sub Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {(viewingTxn.bill.table_items || []).map((item, idx) => (
                          <tr key={idx} className="hover:bg-slate-50 transition">
                            <td className="p-2.5 font-semibold text-slate-900 whitespace-nowrap border border-slate-400">{item.plan_name}</td>
                            <td className="p-2.5 text-center font-semibold text-slate-900 whitespace-nowrap border border-slate-400">₹{(item.rate || 0).toLocaleString('en-IN')}</td>
                            <td className="p-2.5 text-center text-slate-600 whitespace-nowrap border border-slate-400">{formatDate(item.date)}</td>
                            <td className="p-2.5 text-center font-medium whitespace-nowrap border border-slate-400">{item.total_distance_km} KM</td>
                            <td className="p-2.5 text-center text-slate-600 whitespace-nowrap border border-slate-400">{item.extra_km > 0 ? `${item.extra_km} KM` : '-'}</td>
                            <td className="p-2.5 text-center font-medium whitespace-nowrap border border-slate-400">{item.total_hours} Hrs</td>
                            <td className="p-2.5 text-center text-slate-600 whitespace-nowrap border border-slate-400">{item.extra_hours > 0 ? `${item.extra_hours} Hrs` : '-'}</td>
                            <td className="p-2.5 text-center font-medium text-slate-600 whitespace-nowrap border border-slate-400">{item.da_allowance > 0 ? `₹${item.da_allowance.toLocaleString('en-IN')}` : '-'}</td>
                            <td className="p-2.5 text-center font-medium text-slate-600 whitespace-nowrap border border-slate-400">{item.night_allowance > 0 ? `₹${item.night_allowance.toLocaleString('en-IN')}` : '-'}</td>
                            <td className="p-2.5 text-right font-bold text-slate-900 whitespace-nowrap border border-slate-400">₹{item.amount_without_gst.toLocaleString('en-IN')}</td>
                          </tr>
                        ))}
                        {viewingTxn.bill.table_items && viewingTxn.bill.table_items.length > 1 && (() => {
                          const items = viewingTxn.bill.table_items;
                          const totalDistance = items.reduce((sum, item) => sum + (parseFloat(item.total_distance_km) || 0), 0);
                          const totalExtraKm = items.reduce((sum, item) => sum + (parseFloat(item.extra_km) || 0), 0);
                          const totalHours = items.reduce((sum, item) => sum + (parseFloat(item.total_hours) || 0), 0);
                          const totalExtraHours = items.reduce((sum, item) => sum + (parseFloat(item.extra_hours) || 0), 0);
                          const totalDA = items.reduce((sum, item) => sum + (parseFloat(item.da_allowance) || 0), 0);
                          const totalNight = items.reduce((sum, item) => sum + (parseFloat(item.night_allowance) || 0), 0);
                          const totalSubtotal = items.reduce((sum, item) => sum + (parseFloat(item.amount_without_gst) || 0), 0);
                          return (
                            <tr className="bg-slate-50 font-bold border-t border-slate-400 text-slate-900">
                              <td className="p-2.5 text-left border border-slate-400 whitespace-nowrap uppercase tracking-wider">Total</td>
                              <td className="p-2.5 text-center border border-slate-400"></td>
                              <td className="p-2.5 text-center border border-slate-400"></td>
                              <td className="p-2.5 text-center border border-slate-400 whitespace-nowrap">{totalDistance} KM</td>
                              <td className="p-2.5 text-center border border-slate-400 whitespace-nowrap">{totalExtraKm > 0 ? `${totalExtraKm} KM` : '-'}</td>
                              <td className="p-2.5 text-center border border-slate-400 whitespace-nowrap">{totalHours} Hrs</td>
                              <td className="p-2.5 text-center border border-slate-400 whitespace-nowrap">{totalExtraHours > 0 ? `${totalExtraHours} Hrs` : '-'}</td>
                              <td className="p-2.5 text-center border border-slate-400 whitespace-nowrap">{totalDA > 0 ? `₹${totalDA.toLocaleString('en-IN')}` : '-'}</td>
                              <td className="p-2.5 text-center border border-slate-400 whitespace-nowrap">{totalNight > 0 ? `₹${totalNight.toLocaleString('en-IN')}` : '-'}</td>
                              <td className="p-2.5 text-right border border-slate-400 whitespace-nowrap font-black">₹{totalSubtotal.toLocaleString('en-IN')}</td>
                            </tr>
                          );
                        })()}
                       </tbody>
                    </table>
                  </div>
                  {/* Bottom section with Tax Summary on left, Totals on right */}
                  <div className="mt-6 grid grid-cols-12 gap-8 items-start">
                    
                    {/* Left: Tax Summary (only shown if GST enabled) */}
                    <div className="col-span-7">
                      {viewingTxn.bill.gst_enabled && getTaxSummary().length > 0 && (
                        <div className="space-y-1">
                          <div className="bg-slate-50 px-2 py-1 border border-slate-400 font-bold text-slate-800 text-[9px] uppercase">
                            Tax Summary ({getTaxSummary().map(r => `${r.cgstRate + r.sgstRate}% GST`).join(', ')}):
                          </div>
                          <table className="w-full text-center text-[9px] border-x border-b border-slate-400 border-collapse table-fixed">
                            <colgroup>
                              <col style={{ width: '15%' }} />
                              <col style={{ width: '22%' }} />
                              <col style={{ width: '10%' }} />
                              <col style={{ width: '15%' }} />
                              <col style={{ width: '10%' }} />
                              <col style={{ width: '15%' }} />
                              <col style={{ width: '13%' }} />
                            </colgroup>
                            <thead>
                              <tr className="border-b border-slate-400 bg-slate-50 text-slate-800 uppercase font-bold text-[8px]">
                                <th rowSpan="2" className="border-r border-slate-400 p-1 text-center align-middle">HSN/ SAC</th>
                                <th rowSpan="2" className="border-r border-slate-400 p-1 text-center align-middle">Taxable (₹)</th>
                                <th colSpan="2" className="border-r border-slate-400 border-b border-slate-400 p-0.5 text-center font-bold">CGST</th>
                                <th colSpan="2" className="border-r border-slate-400 border-b border-slate-400 p-0.5 text-center font-bold">SGST</th>
                                <th rowSpan="2" className="p-1 text-center align-middle">Tax (₹)</th>
                              </tr>
                              <tr className="border-b border-slate-400 bg-slate-50 text-slate-800 uppercase font-bold text-[7px]">
                                <th className="border-r border-slate-400 p-0.5 text-center">Rate</th>
                                <th className="border-r border-slate-400 p-0.5 text-center">Amt</th>
                                <th className="border-r border-slate-400 p-0.5 text-center">Rate</th>
                                <th className="border-r border-slate-400 p-0.5 text-center">Amt</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                              {getTaxSummary().map((row, idx) => (
                                <tr key={idx} className="text-slate-700 font-medium">
                                  <td className="border-r border-slate-400 p-1 text-center font-mono">{row.hsn}</td>
                                  <td className="border-r border-slate-400 p-1 text-center font-mono">₹{row.taxableAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                  <td className="border-r border-slate-400 p-1 text-center font-mono">{row.cgstRate}%</td>
                                  <td className="border-r border-slate-400 p-1 text-center font-mono">₹{row.cgstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                  <td className="border-r border-slate-400 p-1 text-center font-mono">{row.sgstRate}%</td>
                                  <td className="border-r border-slate-400 p-1 text-center font-mono">₹{row.sgstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                  <td className="p-1 text-center font-mono font-bold text-slate-900">₹{row.totalTax.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                </tr>
                              ))}
                              {/* Totals Row */}
                              <tr className="bg-slate-50 border-t border-slate-400 text-slate-900 font-black">
                                <td className="border-r border-slate-400 p-1 text-center uppercase">TOTAL</td>
                                <td className="border-r border-slate-400 p-1 text-center font-mono">
                                  ₹{getTaxSummary().reduce((sum, r) => sum + r.taxableAmount, 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </td>
                                <td className="border-r border-slate-400 p-1 bg-slate-100/30"></td>
                                <td className="border-r border-slate-400 p-1 text-center font-mono">
                                  ₹{getTaxSummary().reduce((sum, r) => sum + r.cgstAmount, 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </td>
                                <td className="border-r border-slate-400 p-1 bg-slate-100/30"></td>
                                <td className="border-r border-slate-400 p-1 text-center font-mono">
                                  ₹{getTaxSummary().reduce((sum, r) => sum + r.sgstAmount, 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </td>
                                <td className="p-1 text-center font-mono">
                                  ₹{getTaxSummary().reduce((sum, r) => sum + r.totalTax, 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>

                    {/* Right: Total Calculations */}
                    <div className="col-span-5 text-xs">
                      <div className="space-y-1.5 border-t border-slate-200 pt-2">
                        <div className="flex justify-between text-slate-600">
                          <span>Subtotal (Excl. Tax):</span>
                          <span className="font-semibold font-mono">₹{printSubtotalExclTax.toLocaleString('en-IN')}</span>
                        </div>
                        {viewingTxn.bill.gst_enabled && printGstAmount > 0 && (
                          <div className="flex justify-between text-slate-600">
                            <span>GST ({(parseFloat((viewingTxn.bill.table_items || []).find(item => (parseFloat(item.gst_rate) || 0) > 0)?.gst_rate) || 12)}%):</span>
                            <span className="font-semibold font-mono">₹{printGstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                          </div>
                        )}
                        {viewingTxn.bill.toll_amount > 0 && (
                          <div className="flex justify-between text-slate-600">
                            <span>Toll Charges:</span>
                            <span className="font-semibold font-mono">₹{viewingTxn.bill.toll_amount.toLocaleString()}</span>
                          </div>
                        )}
                        {viewingTxn.bill.parking_amount > 0 && (
                          <div className="flex justify-between text-slate-600">
                            <span>Parking Charges:</span>
                            <span className="font-semibold font-mono">₹{viewingTxn.bill.parking_amount.toLocaleString()}</span>
                          </div>
                        )}
                        <div className="flex justify-between text-xl font-black text-slate-900 border-t border-slate-300 pt-1.5 bg-indigo-50/30 p-2 rounded-lg border border-indigo-100/50 mt-1">
                          <span className="text-indigo-800">Grand Total:</span>
                          <span className="text-indigo-900 font-mono">₹{viewingTxn.bill.final_bill_amount.toLocaleString('en-IN')}</span>
                        </div>
                        <div className="text-[10px] text-right font-bold text-indigo-700 italic pt-1">
                          {viewingTxn.bill.final_bill_words}
                        </div>
                      </div>
                    </div>

                  </div>
                </div>

                {/* Terms and Signatures */}
                <div className="border-t border-slate-200 pt-8 mt-12 grid grid-cols-2 gap-8 text-[10px] text-slate-500">
                  <div>
                    <p className="font-bold text-slate-700 uppercase mb-2 text-[9px]">Terms & Conditions</p>
                    <ul className="list-disc pl-4 space-y-1">
                      <li>Payment is due within 7 days from the invoice date.</li>
                      <li>Tolls, parking fees, state tax, and entry taxes shall be paid extra.</li>
                      <li>All disputes are subject to local judicial jurisdictions.</li>
                    </ul>
                  </div>
                  <div className="flex flex-col justify-end items-end h-full">
                    <div className="flex flex-col items-center mt-2">
                      <img src="/signature.png" alt="Signature" className="h-36 object-contain -mb-5 relative z-10 opacity-90" />
                      <div className="w-44 border-t border-slate-400 text-center pt-2 relative z-20">
                        <p className="font-bold text-slate-800 text-[10px]">Authorized Signature</p>
                        <p className="text-[8px] text-slate-400 mt-1">For {viewingTxn.bill.vendor_name || 'PURVI TOURS & TRAVELS'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
