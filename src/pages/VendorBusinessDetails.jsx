import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import CustomSelect from '../components/CustomSelect';
import { IndianRupee, ArrowLeft, History, FileText, Calendar, Plus, Clock, CheckCircle, Trash2, Filter, Receipt, ArrowLeftCircle, ArrowRightCircle } from 'lucide-react';
import CustomDatePicker from '../components/CustomDatePicker';

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
import { useConfirm } from '../context/ConfirmContext';

export default function VendorBusinessDetails({ navigateTo, vendorId }) {
  const confirm = useConfirm();
  const [vendor, setVendor] = useState(null);
  const [bills, setBills] = useState([]);
  const [salesBills, setSalesBills] = useState([]);
  const [payments, setPayments] = useState([]);
  const [receivedPayments, setReceivedPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isReceiveModalOpen, setIsReceiveModalOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMode, setPaymentMode] = useState('Cash');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!vendorId) {
      navigateTo('vendor-payments');
      return;
    }
    fetchData();
  }, [vendorId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      // Fetch vendor details
      const vendorRes = await axios.get(`/api/customers/${vendorId}`);
      setVendor(vendorRes.data);

      // Fetch all bills to filter purchases & sales for this vendor
      // Ideally we would have a query param, but we filter client-side here
      const billsRes = await axios.get('/api/bills');
      const vendorBills = billsRes.data.filter(b =>
        b.bill_type === 'Purchase' &&
        (b.customer_name === vendorRes.data.name || b.vendor_name === vendorRes.data.name)
      );
      setBills(vendorBills);

      const vendorSalesBills = billsRes.data.filter(b =>
        b.bill_type === 'Sales' && b.customer_name === vendorRes.data.name
      );
      setSalesBills(vendorSalesBills);

      // Fetch payments
      const paymentsRes = await axios.get(`/api/payments/vendor/${vendorId}`);
      setPayments(paymentsRes.data);

      // Fetch received payments
      const rPaymentsRes = await axios.get('/api/received-payments');
      setReceivedPayments(rPaymentsRes.data.filter(p => p.customer_name === vendorRes.data.name));

    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleMakePayment = async (e) => {
    e.preventDefault();
    if (!paymentAmount || isNaN(paymentAmount) || Number(paymentAmount) <= 0) {
      alert("Please enter a valid amount.");
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        vendor_id: vendorId,
        vendor_name: vendor.name,
        amount: Number(paymentAmount),
        payment_date: paymentDate,
        payment_mode: paymentMode,
        notes: notes
      };

      await axios.post('/api/payments', payload);

      // Close modal and refresh data
      setIsModalOpen(false);
      setPaymentAmount('');
      setNotes('');
      fetchData();
    } catch (err) {
      console.error('Error recording payment:', err);
      alert('Failed to record payment.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReceivePayment = async (e) => {
    e.preventDefault();
    if (!paymentAmount || isNaN(paymentAmount) || Number(paymentAmount) <= 0) {
      alert("Please enter a valid amount.");
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        customer_id: vendorId,
        customer_name: vendor.name,
        amount: Number(paymentAmount),
        payment_date: paymentDate,
        payment_mode: paymentMode,
        notes: notes
      };

      await axios.post('/api/received-payments', payload);

      setIsReceiveModalOpen(false);
      setPaymentAmount('');
      setNotes('');
      fetchData();
    } catch (err) {
      console.error('Error recording received payment:', err);
      alert('Failed to record received payment.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeletePayment = async (paymentId) => {
    const isConfirmed = await confirm("Are you sure you want to delete this payment record? This will increase the pending bill amount.");
    if (!isConfirmed) {
      return;
    }

    try {
      await axios.delete(`/api/payments/${paymentId}`);
      fetchData();
    } catch (err) {
      console.error('Error deleting payment:', err);
      alert('Failed to delete payment.');
    }
  };

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
    bills.forEach(b => {
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
        credit: p.amount || 0,
        obj: p
      });
    });

    // Vendor Payments (+ Receivable, i.e., reduces Payable)
    payments.forEach(p => {
      txns.push({
        id: `paid-${p.id}`,
        date: p.payment_date || p.created_at?.split('T')[0],
        type: 'Vendor Payment',
        ref: p.notes || p.payment_mode || '-',
        charge: p.amount || 0,
        credit: 0,
        obj: p
      });
    });

    // Filter by date if needed
    if (startDate || endDate) {
      txns = txns.filter(t => {
        const d = new Date(t.date).getTime();
        if (startDate && d < new Date(startDate).getTime()) return false;
        if (endDate && d > new Date(endDate).getTime() + 86400000 - 1) return false;
        return true;
      });
    }

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
  }, [salesBills, bills, receivedPayments, payments, startDate, endDate]);

  const globalTotalPurchase = useMemo(() => bills.reduce((sum, b) => sum + (b.final_bill_amount || 0), 0), [bills]);
  const globalTotalPaid = useMemo(() => payments.reduce((sum, p) => sum + (p.amount || 0), 0), [payments]);
  const globalTotalSales = useMemo(() => salesBills.reduce((sum, b) => sum + (b.final_bill_amount || 0), 0), [salesBills]);
  const globalTotalReceived = useMemo(() => receivedPayments.reduce((sum, p) => sum + (p.amount || 0), 0), [receivedPayments]);

  const netBalance = transactions.length > 0 ? transactions[transactions.length - 1].balance : 0;
  const isPayable = netBalance < 0;

  const isFiltered = startDate !== '' || endDate !== '';  if (loading) {
    return <div className="text-center py-20 text-slate-400">Loading details...</div>;
  }

  if (!vendor) return null;

  return (
    <div className="w-full px-6 space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigateTo('vendor-payments')}
            className="p-2 rounded-xl bg-slate-900 border border-slate-700 hover:border-indigo-500 hover:bg-indigo-500/10 transition text-slate-300 hover:text-indigo-400"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-50 tracking-tight">{vendor.name}</h1>
            <p className="text-sm text-slate-400 mt-1">Vendor Business Details</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 bg-slate-900/60 p-2 rounded-xl border border-slate-700/50">
          <div className="flex items-center gap-2 pl-2 text-slate-400 border-r border-slate-700 pr-3">
            <Filter className="h-4 w-4" />
            <span className="text-xs font-semibold uppercase">Date</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-32 relative">
              <CustomDatePicker 
                value={startDate} 
                onChange={setStartDate} 
                maxDate={endDate}
                placeholder="Start Date"
                className="bg-slate-800 text-slate-200 text-sm border-none rounded-lg pl-3 pr-8 py-1.5 outline-none cursor-pointer hover:bg-slate-700 transition w-full"
              />
            </div>
            <span className="text-slate-500 text-sm">to</span>
            <div className="w-32 relative">
              <CustomDatePicker 
                value={endDate} 
                onChange={setEndDate} 
                minDate={startDate}
                placeholder="End Date"
                className="bg-slate-800 text-slate-200 text-sm border-none rounded-lg pl-3 pr-8 py-1.5 outline-none cursor-pointer hover:bg-slate-700 transition w-full"
              />
            </div>
          </div>
          {(startDate || endDate) && (
            <button 
              onClick={() => { setStartDate(''); setEndDate(''); }}
              className="text-xs text-rose-400 hover:text-rose-300 ml-1 px-2"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {/* Net Party Balance */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-col justify-between col-span-1 md:col-span-3 lg:col-span-2">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Net Party Balance</p>
            <div className={`text-2xl font-bold font-mono ${isPayable ? 'text-rose-400' : 'text-emerald-400'}`}>
              ₹{Math.abs(netBalance).toLocaleString('en-IN')}
            </div>
            <p className={`text-[10px] mt-1 font-semibold ${isPayable ? 'text-rose-500' : 'text-emerald-500'}`}>
              {isPayable ? '(Payable to them)' : netBalance > 0 ? '(Receivable from them)' : 'Settled'}
            </p>
          </div>
          <div className="flex gap-2 mt-4">
            {isPayable && (
              <button
                onClick={() => setIsModalOpen(true)}
                title="Record Payment (Payable)"
                className="flex-1 bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 border border-rose-500/30 px-3 py-2.5 rounded-xl font-bold transition flex items-center justify-center gap-2"
              >
                <Plus className="h-4 w-4" />
                <span className="text-xs">Pay</span>
              </button>
            )}
            {netBalance > 0 && (
              <button
                onClick={() => setIsReceiveModalOpen(true)}
                title="Record Received Payment (Receivable)"
                className="flex-1 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30 px-3 py-2.5 rounded-xl font-bold transition flex items-center justify-center gap-2"
              >
                <Plus className="h-4 w-4" />
                <span className="text-xs">Receive</span>
              </button>
            )}
          </div>
        </div>

        {/* Purchase Section */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 shadow-xl">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Total Purchase</p>
          <div className="text-xl font-bold text-rose-400 font-mono">₹{globalTotalPurchase.toLocaleString('en-IN')}</div>
          <p className="text-[10px] text-slate-500 mt-1">Sum of {bills.length} purchase bills</p>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 shadow-xl">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Total Paid</p>
          <div className="text-xl font-bold text-indigo-400 font-mono">₹{globalTotalPaid.toLocaleString('en-IN')}</div>
          <p className="text-[10px] text-slate-500 mt-1">Sum of {payments.length} payments made</p>
        </div>

        {/* Sales Section */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 shadow-xl">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Total Sales</p>
          <div className="text-xl font-bold text-emerald-400 font-mono">₹{globalTotalSales.toLocaleString('en-IN')}</div>
          <p className="text-[10px] text-slate-500 mt-1">Sum of {salesBills.length} sales bills</p>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 shadow-xl">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Total Received</p>
          <div className="text-xl font-bold text-cyan-400 font-mono">₹{globalTotalReceived.toLocaleString('en-IN')}</div>
          <p className="text-[10px] text-slate-500 mt-1">Sum of {receivedPayments.length} payments received</p>
        </div>
      </div>

      <div className="glass-panel p-6 rounded-2xl border border-slate-700/50 shadow-xl flex flex-col">
        <div className="flex items-center gap-2 mb-6">
          <FileText className="h-5 w-5 text-indigo-400" />
          <h2 className="text-lg font-bold text-slate-50">Unified Business Ledger</h2>
        </div>

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
                <th className="px-4 py-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50 text-sm">
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-4 py-12 text-center text-slate-500">
                    No transactions found for this vendor.
                  </td>
                </tr>
              ) : (
                transactions.map((txn, idx) => (
                  <tr key={txn.id || idx} className="hover:bg-slate-800/30 transition-colors group">
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
                    <td className="px-4 py-3 text-center">
                      {(txn.type === 'Received Payment' || txn.type === 'Vendor Payment') && (
                        <button
                          onClick={async () => {
                            const isConfirmed = await confirm("Are you sure you want to delete this payment record?");
                            if (isConfirmed) {
                              const endpoint = txn.type === 'Received Payment' ? `/api/received-payments/${txn.obj.id}` : `/api/payments/${txn.obj.id}`;
                              await axios.delete(endpoint);
                              fetchData();
                            }
                          }}
                          className="text-rose-400/50 hover:text-rose-400 hover:bg-rose-400/10 p-1.5 rounded-lg transition-all"
                          title="Delete Payment"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payment Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-xl font-bold text-slate-50">Pay Vendor</h2>
                <p className="text-sm font-medium text-rose-400 mt-1">
                  Pending Payable: ₹{Math.abs(netBalance).toLocaleString('en-IN')}
                </p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-50 transition">
                <CheckCircle className="h-5 w-5 opacity-0" /> {/* Spacer */}
                <span className="text-xl leading-none">&times;</span>
              </button>
            </div>

            <form onSubmit={handleMakePayment} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 block">Amount to Pay (₹)</label>
                <input
                  type="number"
                  required
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 focus:border-indigo-500 rounded-xl px-4 py-3 text-slate-100 outline-none transition"
                  placeholder="Enter amount"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 block">Date</label>
                  <input
                    type="date"
                    required
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 focus:border-indigo-500 rounded-xl px-4 py-3 text-slate-100 outline-none transition"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 block">Mode</label>
                  <CustomSelect
                    value={paymentMode}
                    onChange={(val) => setPaymentMode(val)}
                    options={['Cash', 'UPI', 'Bank Transfer', 'Cheque']}
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 block">Notes (Optional)</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 focus:border-indigo-500 rounded-xl px-4 py-3 text-slate-100 outline-none transition"
                  placeholder="e.g. Transaction ID"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-rose-600 hover:bg-rose-500 text-white font-bold py-3 rounded-xl shadow-lg shadow-rose-500/25 transition disabled:opacity-50 mt-4"
              >
                {submitting ? 'Recording...' : 'Record Payment Made'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Receive Payment Modal */}
      {isReceiveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-xl font-bold text-slate-50">Receive from Vendor</h2>
                <p className="text-sm font-medium text-emerald-400 mt-1">
                  Pending Receivable: ₹{Math.abs(netBalance).toLocaleString('en-IN')}
                </p>
              </div>
              <button onClick={() => setIsReceiveModalOpen(false)} className="text-slate-400 hover:text-slate-50 transition">
                <CheckCircle className="h-5 w-5 opacity-0" /> {/* Spacer */}
                <span className="text-xl leading-none">&times;</span>
              </button>
            </div>

            <form onSubmit={handleReceivePayment} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 block">Amount Received (₹)</label>
                <input
                  type="number"
                  required
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 focus:border-indigo-500 rounded-xl px-4 py-3 text-slate-100 outline-none transition"
                  placeholder="Enter amount"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 block">Date</label>
                  <input
                    type="date"
                    required
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 focus:border-indigo-500 rounded-xl px-4 py-3 text-slate-100 outline-none transition"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 block">Mode</label>
                  <CustomSelect
                    value={paymentMode}
                    onChange={(val) => setPaymentMode(val)}
                    options={['Cash', 'UPI', 'Bank Transfer', 'Cheque']}
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 block">Notes (Optional)</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 focus:border-indigo-500 rounded-xl px-4 py-3 text-slate-100 outline-none transition"
                  placeholder="e.g. Transaction ID"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl shadow-lg shadow-emerald-500/25 transition disabled:opacity-50 mt-4"
              >
                {submitting ? 'Recording...' : 'Record Payment Received'}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
