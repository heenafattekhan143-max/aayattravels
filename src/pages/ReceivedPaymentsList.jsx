import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, IndianRupee, ChevronRight, User } from 'lucide-react';

export default function ReceivedPaymentsList({ navigateTo, setCustomerForPayment }) {
  const [customers, setCustomers] = useState([]);
  const [bills, setBills] = useState([]);
  const [receivedPayments, setReceivedPayments] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [custRes, billsRes, payRes] = await Promise.all([
        axios.get('/api/customers?entity_type=customer'),
        axios.get('/api/bills'),
        axios.get('/api/received-payments')
      ]);
      setCustomers(custRes.data);
      setBills(billsRes.data.filter(b => b.bill_type === 'Sales'));
      setReceivedPayments(payRes.data);
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const customerBalances = React.useMemo(() => {
    const balances = {};

    // Index by both id and name for lookup
    customers.forEach(c => {
      balances[c.id] = { name: c.name, totalBill: 0, totalPaid: 0, pending: 0 };
    });

    // Build name→id map for quick lookup
    const nameToId = {};
    customers.forEach(c => { nameToId[c.name.toLowerCase()] = c.id; });

    // Match bills by customer_name field
    bills.forEach(b => {
      const customerName = (b.customer_name || '').toLowerCase();
      const customerId = nameToId[customerName];
      if (customerId && balances[customerId]) {
        balances[customerId].totalBill += (b.final_bill_amount || 0);
      }
    });

    // Match received payments by customer_name
    receivedPayments.forEach(p => {
      const customerName = (p.customer_name || '').toLowerCase();
      const customerId = nameToId[customerName];
      if (customerId && balances[customerId]) {
        balances[customerId].totalPaid += (p.amount || 0);
      }
    });

    Object.keys(balances).forEach(id => {
      balances[id].pending = balances[id].totalBill - balances[id].totalPaid;
    });

    return balances;
  }, [customers, bills, receivedPayments]);

  const handleCustomerClick = (customerId) => {
    setCustomerForPayment(customerId);
    navigateTo('received-payment-details');
  };

  const filteredCustomers = customers.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.phone && c.phone.includes(search))
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
                  <th className="p-4">GST Mode</th>
                  <th className="p-4">State</th>
                  <th className="p-4 text-right">Total Bill</th>
                  <th className="p-4 text-right">Total Received</th>
                  <th className="p-4 text-right">Pending Balance</th>
                  <th className="p-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-sm text-slate-300">
                {filteredCustomers.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="p-6 text-center text-slate-500">No customers found matching your search.</td>
                  </tr>
                ) : (
                  filteredCustomers.map((cust) => {
                    const balance = customerBalances[cust.id];
                    const pending = balance?.pending || 0;
                    const isAdvance = pending < 0;

                    return (
                      <tr key={cust.id} className="hover:bg-slate-800/20 transition group">
                        <td className="p-4">
                          <span className="px-2 py-1 rounded text-xs font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                            Customer
                          </span>
                        </td>
                        <td className="p-4 font-semibold text-slate-50 group-hover:text-indigo-400 transition">{cust.name}</td>
                        <td className="p-4">{cust.phone}</td>
                        <td className="p-4 text-slate-400">{cust.gst_type}</td>
                        <td className="p-4">{cust.state}</td>
                        <td className="p-4 text-right font-medium text-slate-300">
                          ₹{(balance?.totalBill || 0).toLocaleString('en-IN')}
                        </td>
                        <td className="p-4 text-right font-medium text-emerald-400">
                          ₹{(balance?.totalPaid || 0).toLocaleString('en-IN')}
                        </td>
                        <td className="p-4 text-right font-bold">
                          {isAdvance ? (
                            <span className="text-emerald-400">Advance: ₹{Math.abs(pending).toLocaleString('en-IN')}</span>
                          ) : (
                            <span className="text-rose-400">₹{pending.toLocaleString('en-IN')}</span>
                          )}
                        </td>
                        <td className="p-4 text-center">
                          <button
                            onClick={() => handleCustomerClick(cust.id)}
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
