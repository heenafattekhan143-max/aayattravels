import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, IndianRupee, ChevronRight, User } from 'lucide-react';

export default function VendorPaymentsList({ navigateTo, setVendorForPayment }) {
  const [vendors, setVendors] = useState([]);
  const [bills, setBills] = useState([]);
  const [payments, setPayments] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const [receivedPayments, setReceivedPayments] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [venRes, billsRes, payRes, recPayRes] = await Promise.all([
        axios.get('/api/customers?entity_type=vendor'),
        axios.get('/api/bills'),
        axios.get('/api/payments'),
        axios.get('/api/received-payments')
      ]);
      setVendors(venRes.data);
      setBills(billsRes.data);
      setPayments(payRes.data);
      setReceivedPayments(recPayRes.data);
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const vendorBalances = React.useMemo(() => {
    const balances = {};
    vendors.forEach(v => {
      balances[v.id] = { name: v.name, totalPurchases: 0, totalSales: 0, totalPaid: 0, totalReceived: 0, pendingPayable: 0, pendingReceivable: 0, netBalance: 0 };
    });

    const nameToId = {};
    vendors.forEach(v => { nameToId[v.name.toLowerCase()] = v.id; });

    bills.forEach(b => {
      if (b.bill_type === 'Purchase') {
        const vendorName = (b.vendor_name || '').toLowerCase();
        const vendorId = nameToId[vendorName];
        if (vendorId && balances[vendorId]) {
          balances[vendorId].totalPurchases += (b.final_bill_amount || 0);
        }
      } else if (b.bill_type === 'Sales') {
        const vendorName = (b.customer_name || '').toLowerCase();
        const vendorId = nameToId[vendorName];
        if (vendorId && balances[vendorId]) {
          balances[vendorId].totalSales += (b.final_bill_amount || 0);
        }
      }
    });

    payments.forEach(p => {
      const vendorName = (p.vendor_name || '').toLowerCase();
      const vendorId = nameToId[vendorName];
      if (vendorId && balances[vendorId]) {
        balances[vendorId].totalPaid += (p.amount || 0);
      }
    });

    receivedPayments.forEach(p => {
      const vendorName = (p.customer_name || '').toLowerCase();
      const vendorId = nameToId[vendorName];
      if (vendorId && balances[vendorId]) {
        balances[vendorId].totalReceived += (p.amount || 0);
      }
    });

    Object.keys(balances).forEach(id => {
      const bal = balances[id];
      bal.pendingPayable = bal.totalPurchases - bal.totalPaid;
      bal.pendingReceivable = bal.totalSales - bal.totalReceived;
      bal.netBalance = bal.pendingReceivable - bal.pendingPayable;
    });

    return balances;
  }, [vendors, bills, payments, receivedPayments]);

  const handleVendorClick = (vendorId) => {
    setVendorForPayment(vendorId);
    navigateTo('payment-details');
  };

  const filteredVendors = vendors.filter(v =>
    v.name.toLowerCase().includes(search.toLowerCase()) ||
    (v.phone && v.phone.includes(search))
  );

  return (
    <div className="space-y-6">


      <div className="flex gap-4 items-center glass-panel p-4 rounded-xl border border-slate-700/50">
        <Search className="h-5 w-5 text-slate-400 shrink-0" />
        <input
          type="text"
          placeholder="Search by name, phone number, or GSTIN..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-transparent border-none outline-none text-slate-100 placeholder-slate-400 text-sm"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
        </div>
      ) : (
        <div className="glass-panel rounded-2xl border border-slate-700/50 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-700 bg-table-header text-slate-400 text-xs font-semibold uppercase tracking-wider">
                  <th className="p-4">Type</th>
                  <th className="p-4">Name</th>
                  <th className="p-4">Phone</th>
                  <th className="p-4 text-right">Pending Sales</th>
                  <th className="p-4 text-right">Pending Purchases</th>
                  <th className="p-4 text-right">Net Balance</th>
                  <th className="p-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-sm text-slate-300">
                {filteredVendors.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="p-6 text-center text-slate-500">No vendors found matching your search.</td>
                  </tr>
                ) : (
                  filteredVendors.map((vendor) => {
                    const balance = vendorBalances[vendor.id];
                    const net = balance?.netBalance || 0;

                    return (
                      <tr key={vendor.id} className="hover:bg-slate-800/20 transition group">
                        <td className="p-4">
                          <span className="px-2 py-1 rounded text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                            Vendor
                          </span>
                        </td>
                        <td className="p-4 font-semibold text-slate-50 group-hover:text-indigo-400 transition">{vendor.name}</td>
                        <td className="p-4">{vendor.phone}</td>
                        <td className="p-4 text-right font-medium text-emerald-400">
                          ₹{(balance?.pendingReceivable || 0).toLocaleString('en-IN')}
                        </td>
                        <td className="p-4 text-right font-medium text-rose-400">
                          ₹{(balance?.pendingPayable || 0).toLocaleString('en-IN')}
                        </td>
                        <td className="p-4 text-right font-black">
                          {net > 0 ? (
                            <span className="text-emerald-400">₹{net.toLocaleString('en-IN')} (Receivable)</span>
                          ) : net < 0 ? (
                            <span className="text-rose-400">₹{Math.abs(net).toLocaleString('en-IN')} (Payable)</span>
                          ) : (
                            <span className="text-slate-400">₹0</span>
                          )}
                        </td>
                        <td className="p-4 text-center">
                          <button
                            onClick={() => handleVendorClick(vendor.id)}
                            className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg transition shadow-lg shadow-indigo-500/20 text-xs flex items-center gap-2 mx-auto"
                          >
                            Select <ChevronRight className="h-3 w-3" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
