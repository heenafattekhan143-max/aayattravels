import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import CustomSelect from '../components/CustomSelect';
import { IndianRupee, ArrowLeft, History, FileText, Calendar, Plus, Clock, CheckCircle, Trash2, Filter } from 'lucide-react';
import CustomDatePicker from '../components/CustomDatePicker';
import { useConfirm } from '../context/ConfirmContext';
import PartyLedgerModal from '../components/PartyLedgerModal';

export default function ReceivedPaymentDetails({ navigateTo, customerId }) {
  const confirm = useConfirm();
  const [customer, setCustomer] = useState(null);
  const [bills, setBills] = useState([]);
  const [receivedPayments, setReceivedPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isLedgerOpen, setIsLedgerOpen] = useState(false);

  // Filters
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMode, setPaymentMode] = useState('Cash');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!customerId) {
      navigateTo('received-vendor-payment');
      return;
    }
    fetchData();
  }, [customerId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      // Fetch customer details
      const customerRes = await axios.get(`/api/customers/${customerId}`);
      setCustomer(customerRes.data);

      // Fetch all bills to filter sales for this customer
      const billsRes = await axios.get('/api/bills');
      const customerBills = billsRes.data.filter(b =>
        b.bill_type === 'Sales' && b.customer_name === customerRes.data.name
      );
      setBills(customerBills);

      // Fetch received payments
      const paymentsRes = await axios.get(`/api/received-payments/customer/${customerId}`);
      setReceivedPayments(paymentsRes.data);

    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRecordPayment = async (e) => {
    e.preventDefault();
    if (!paymentAmount || isNaN(paymentAmount) || Number(paymentAmount) <= 0) {
      alert("Please enter a valid amount.");
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        customer_id: customerId,
        customer_name: customer.name,
        amount: Number(paymentAmount),
        payment_date: paymentDate,
        payment_mode: paymentMode,
        notes: notes
      };

      await axios.post('/api/received-payments', payload);

      // Close modal and refresh data
      setIsModalOpen(false);
      setPaymentAmount('');
      setNotes('');
      fetchData();
    } catch (err) {
      console.error('Error recording received payment:', err);
      alert('Failed to record payment.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeletePayment = async (paymentId) => {
    const isConfirmed = await confirm("Are you sure you want to delete this received payment record? This will increase the pending bill amount.");
    if (!isConfirmed) {
      return;
    }

    try {
      await axios.delete(`/api/received-payments/${paymentId}`);
      fetchData();
    } catch (err) {
      console.error('Error deleting payment:', err);
      alert('Failed to delete payment.');
    }
  };

  // FIFO Allocation logic (similar to vendor side)
  const allocatedBills = useMemo(() => {
    // 1. Sort bills by date ascending (oldest first)
    const sorted = [...bills].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    // 2. Calculate total paid
    let remainingPayment = receivedPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
    
    // 3. Allocate payments
    const allocated = sorted.map(bill => {
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
      
      return {
        ...bill,
        allocatedPaid: paidForThisBill,
        computedStatus: computedStatus
      };
    });
    
    // Return newest first for display
    return allocated.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [bills, receivedPayments]);

  const filteredBills = useMemo(() => {
    return allocatedBills.filter(b => {
      const d = new Date(b.date).getTime();
      if (startDate && d < new Date(startDate).getTime()) return false;
      if (endDate && d > new Date(endDate).getTime() + 86400000 - 1) return false;
      return true;
    });
  }, [allocatedBills, startDate, endDate]);

  const filteredPayments = useMemo(() => {
    return receivedPayments.filter(p => {
      const d = new Date(p.payment_date).getTime();
      if (startDate && d < new Date(startDate).getTime()) return false;
      if (endDate && d > new Date(endDate).getTime() + 86400000 - 1) return false;
      return true;
    });
  }, [receivedPayments, startDate, endDate]);

  const totalSales = useMemo(() => filteredBills.reduce((sum, b) => sum + (b.final_bill_amount || 0), 0), [filteredBills]);
  const totalPaid = useMemo(() => filteredPayments.reduce((sum, p) => sum + (p.amount || 0), 0), [filteredPayments]);
  
  const globalTotalSales = useMemo(() => bills.reduce((sum, b) => sum + (b.final_bill_amount || 0), 0), [bills]);
  const globalTotalPaid = useMemo(() => receivedPayments.reduce((sum, p) => sum + (p.amount || 0), 0), [receivedPayments]);
  
  const globalTotalPending = globalTotalSales - globalTotalPaid;
  
  const isFiltered = startDate !== '' || endDate !== '';

  if (loading) {
    return <div className="text-center py-20 text-slate-400">Loading details...</div>;
  }

  if (!customer) return null;

  return (
    <div className="w-full px-6 space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigateTo('received-vendor-payment')}
            className="p-2 rounded-xl bg-slate-900 border border-slate-700 hover:border-indigo-500 hover:bg-indigo-500/10 transition text-slate-300 hover:text-indigo-400"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-50 tracking-tight">{customer.name}</h1>
            <p className="text-sm text-slate-400 mt-1">Customer Received Payment Details</p>
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-2">Pending Balance</p>
            <div className="text-3xl font-bold font-mono text-emerald-400">
              ₹{globalTotalPending.toLocaleString('en-IN')}
            </div>
            <p className="text-xs mt-2 font-semibold text-emerald-500">
              Receivable from Customer
            </p>
          </div>
          <div className="flex gap-2 mt-4">
            <button
              onClick={() => setIsLedgerOpen(true)}
              className="flex-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 py-2.5 rounded-xl text-sm font-bold transition flex items-center justify-center gap-2"
            >
              <FileText className="h-4 w-4" /> View Ledger
            </button>
            {globalTotalPending > 0 && (
              <button
                onClick={() => setIsModalOpen(true)}
                title="Record Received Payment"
                className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2.5 rounded-xl font-bold transition flex items-center justify-center shadow-lg shadow-indigo-500/25"
              >
                <Plus className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 shadow-xl">
          <p className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-2">
            {!isFiltered ? 'Total Sales' : 'Period Sales'}
          </p>
          <div className="text-3xl font-bold text-emerald-400 font-mono">₹{totalSales.toLocaleString('en-IN')}</div>
          <p className="text-xs text-slate-500 mt-2">Sum of {filteredBills.length} sales bills</p>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 shadow-xl">
          <p className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-2">
            {!isFiltered ? 'Total Received' : 'Period Received'}
          </p>
          <div className="text-3xl font-bold text-indigo-400 font-mono">₹{totalPaid.toLocaleString('en-IN')}</div>
          <p className="text-xs text-slate-500 mt-2">Sum of {filteredPayments.length} received payments</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Payment History */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-700/50 shadow-xl flex flex-col max-h-[500px]">
          <div className="flex items-center gap-2 mb-6">
            <History className="h-5 w-5 text-indigo-400" />
            <h2 className="text-lg font-bold text-slate-50">Received Payments History</h2>
          </div>

          <div className="flex-1 overflow-y-auto pr-2">
            {filteredPayments.length === 0 ? (
              <div className="text-center py-10 text-slate-500 text-sm">No payments recorded in this period.</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                {filteredPayments.map((pay) => (
                  <div key={pay.id} className="bg-slate-900/80 border border-slate-700 p-4 rounded-xl flex items-center justify-between group transition hover:border-slate-500/50">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-200 font-mono">₹{pay.amount.toLocaleString('en-IN')}</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                          {pay.payment_mode}
                        </span>
                      </div>
                      {pay.notes && <p className="text-xs text-slate-500 mt-1">{pay.notes}</p>}
                    </div>
                    <div className="text-right flex items-center justify-end gap-3">
                      <div className="flex items-center gap-1.5 text-xs text-slate-400">
                        <Calendar className="h-3 w-3" />
                        <span>{new Date(pay.payment_date).toLocaleDateString('en-GB')}</span>
                      </div>
                      <button
                        onClick={() => handleDeletePayment(pay.id)}
                        className="text-rose-400/50 hover:text-rose-400 hover:bg-rose-400/10 p-1.5 rounded-lg transition-all"
                        title="Delete Payment"
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

        {/* Sales Bills */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-700/50 shadow-xl flex flex-col max-h-[600px]">
          <div className="flex items-center gap-2 mb-6">
            <FileText className="h-5 w-5 text-emerald-400" />
            <h2 className="text-lg font-bold text-slate-50">Sales Bills</h2>
          </div>

          <div className="flex-1 overflow-y-auto pr-2">
            {filteredBills.length === 0 ? (
              <div className="text-center py-10 text-slate-500 text-sm">No sales bills found in this period.</div>
            ) : (
              <div className="flex flex-col gap-4">
                {filteredBills.map((bill) => (
                  <div key={bill.id} className="bg-slate-900/80 border border-slate-700 p-4 rounded-xl flex items-center justify-between gap-6">
                    {/* Amount & Status */}
                    <div className="w-28 shrink-0">
                      <div className="font-bold text-emerald-400 text-lg font-mono">₹{(bill.final_bill_amount || 0).toLocaleString('en-IN')}</div>
                      <span className={`inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider ${
                        bill.computedStatus === 'Paid' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                        bill.computedStatus === 'Partial' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                          'bg-slate-500/10 text-slate-400 border-slate-500/20'
                        }`}>
                        {bill.computedStatus}
                      </span>
                    </div>

                    {/* Paid & Pending */}
                    <div className="w-32 shrink-0 text-xs border-r border-slate-700/50 pr-4">
                      <div className="flex justify-between mb-1.5">
                        <span className="text-slate-500">Paid:</span>
                        <span className="text-emerald-400 font-medium font-mono">₹{bill.allocatedPaid.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Pending:</span>
                        <span className="text-rose-400 font-medium font-mono">₹{(bill.final_bill_amount - bill.allocatedPaid).toLocaleString('en-IN')}</span>
                      </div>
                    </div>

                    {/* Route */}
                    <div className="flex-1 min-w-[120px] text-xs">
                      <span className="text-slate-500 block mb-0.5">Route</span>
                      <span className="text-slate-200 font-medium">
                        {bill.source ? `${bill.source} ${bill.destination ? `→ ${bill.destination}` : ''}` : 'N/A'}
                      </span>
                    </div>

                    {/* Vehicle */}
                    <div className="flex-1 min-w-[100px] text-xs">
                      <span className="text-slate-500 block mb-0.5">Vehicle &amp; Driver</span>
                      <span className="text-slate-200 font-medium block">{bill.vehicle_number}</span>
                      {bill.driver_name && <span className="text-slate-400 block truncate">{bill.driver_name}</span>}
                    </div>

                    {/* Guest */}
                    <div className="flex-1 min-w-[100px] text-xs">
                      <span className="text-slate-500 block mb-0.5">Guest</span>
                      <span className="text-slate-200 font-medium block truncate">{bill.guest_name || 'N/A'}</span>
                    </div>

                    {/* Plans */}
                    <div className="flex-1 min-w-[120px] text-xs">
                      <span className="text-slate-500 block mb-0.5">Plans</span>
                      <span className="text-slate-300 font-medium line-clamp-2">
                        {bill.table_items?.map(t => t.plan_name).join(', ') || 'N/A'}
                      </span>
                    </div>

                    {/* Date */}
                    <div className="w-24 shrink-0 text-right">
                      <div className="flex items-center justify-end gap-1.5 text-xs text-slate-400">
                        <Calendar className="h-3 w-3 shrink-0" />
                        <span>{new Date(bill.date).toLocaleDateString('en-GB')}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-slate-50">Record Received Payment</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-50 transition">
                <span className="text-xl leading-none">&times;</span>
              </button>
            </div>

            <form onSubmit={handleRecordPayment} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 block">Amount (₹)</label>
                <input
                  type="number"
                  required
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 focus:border-indigo-500 rounded-xl px-4 py-3 text-slate-100 outline-none transition font-mono"
                  placeholder={`Max: ${globalTotalPending}`}
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
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-xl shadow-lg shadow-indigo-500/25 transition disabled:opacity-50 mt-4"
              >
                {submitting ? 'Recording...' : 'Record Payment'}
              </button>
            </form>
          </div>
        </div>
      )}

      <PartyLedgerModal
        isOpen={isLedgerOpen}
        onClose={() => setIsLedgerOpen(false)}
        partyName={customer.name}
        salesBills={bills}
        receivedPayments={receivedPayments}
        purchaseBills={[]}
        vendorPayments={[]}
      />
    </div>
  );
}
