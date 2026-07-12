import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  AreaChart, Area
} from 'recharts';
import { Activity, TrendingUp, IndianRupee, Car, Plus } from 'lucide-react';

const API = '/api';

export default function BasicPlanDashboard({ navigateTo }) {
  const [data, setData] = useState({ bills: [], bookings: [], vehicles: [], maintenance: [], eventBills: [] });
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [billsRes, bookingsRes, vehiclesRes, maintenanceRes, eventBillsRes] = await Promise.all([
        axios.get(`${API}/bills`),
        axios.get(`${API}/bookings`),
        axios.get(`${API}/vehicles`),
        axios.get(`${API}/maintenance`),
        axios.get(`${API}/event-bills`)
      ]);
      setData({
        bills: billsRes.data,
        bookings: bookingsRes.data,
        vehicles: vehiclesRes.data,
        maintenance: maintenanceRes.data,
        eventBills: eventBillsRes.data
      });
    } catch (err) {
      console.error("Error fetching data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleMarkAsPaid = async (bill) => {
    try {
      if (bill.type === 'Event') {
        await axios.patch(`${API}/event-bills/${bill.id}/payment`, {
          advance_amount: parseFloat(bill.final_bill_amount) || 0,
          status: 'Paid'
        });
        await axios.post(`${API}/received-payments`, {
          customer_id: bill.customer_id || '',
          customer_name: bill.customer_name || bill.client_name || 'Event Client',
          amount: parseFloat(bill.final_bill_amount) - (parseFloat(bill.advance_amount) || 0),
          payment_date: new Date().toISOString().split('T')[0],
          payment_mode: 'Cash',
          reference_id: bill.bill_no || '',
          notes: `Payment for Event: ${bill.event_name}`
        });
      } else {
        await axios.patch(`${API}/bills/${bill.id}/status`, {
          status: 'Paid',
          paid_amount: parseFloat(bill.final_bill_amount) || 0
        });
        
        if (bill.type === 'Purchase') {
          // Log as outgoing payment
          await axios.post(`${API}/payments`, {
            vendor_id: bill.customer_id || '',
            vendor_name: bill.vendor_name || 'Vendor',
            amount: parseFloat(bill.final_bill_amount) - (parseFloat(bill.paid_amount) || 0),
            payment_date: new Date().toISOString().split('T')[0],
            payment_mode: 'Cash',
            reference_id: bill.bill_no || '',
            notes: `Payment for Purchase Bill: ${bill.bill_no}`
          });
        } else {
          // Log as received payment
          await axios.post(`${API}/received-payments`, {
            customer_id: bill.customer_id || '',
            customer_name: bill.customer_name || 'Customer',
            amount: parseFloat(bill.final_bill_amount) - (parseFloat(bill.paid_amount) || 0),
            payment_date: new Date().toISOString().split('T')[0],
            payment_mode: 'Cash',
            reference_id: bill.bill_no || '',
            notes: `Payment for Bill: ${bill.bill_no}`
          });
        }
      }
      await fetchData();
    } catch (err) {
      console.error("Error marking bill as paid:", err);
      alert("Failed to mark bill as paid: " + (err.response?.data?.detail || err.message));
    }
  };

  const stats = useMemo(() => {
    // Total Revenue (Bills + Event Bills)
    const totalSales = data.bills.reduce((sum, b) => sum + (parseFloat(b.final_bill_amount) || 0), 0) +
      data.eventBills.reduce((sum, eb) => sum + (parseFloat(eb.final_bill_amount) || 0), 0);

    // Total Maintenance Costs
    const totalMaintenance = data.maintenance.reduce((sum, m) => sum + (parseFloat(m.cost) || 0), 0);

    // Estimated Profit
    const estimatedProfit = totalSales - totalMaintenance;

    // Active Vehicles
    const activeVehicles = data.vehicles.filter(v => v.status !== 'Inactive').length;

    return { totalSales, estimatedProfit, activeVehicles };
  }, [data]);

  const revenueData = useMemo(() => {
    // Group by month
    const monthly = {};
    const processBill = (dateStr, amount) => {
      if (!dateStr) return;
      const d = new Date(dateStr);
      const m = d.toLocaleString('default', { month: 'short' });
      if (!monthly[m]) monthly[m] = 0;
      monthly[m] += (parseFloat(amount) || 0);
    };

    data.bills.forEach(b => processBill(b.date, b.final_bill_amount));
    data.eventBills.forEach(b => processBill(b.date, b.final_bill_amount));

    // Convert to array
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return months.map(m => ({ name: m, Revenue: monthly[m] || 0 }));
  }, [data]);

  const profitData = useMemo(() => {
    // Group Revenue and Expenses by Month to show profit
    const monthly = {};
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    months.forEach(m => monthly[m] = { name: m, Revenue: 0, Expenses: 0 });

    data.bills.forEach(b => {
      if (!b.date) return;
      const m = new Date(b.date).toLocaleString('default', { month: 'short' });
      if (monthly[m]) monthly[m].Revenue += (parseFloat(b.final_bill_amount) || 0);
    });
    data.eventBills.forEach(b => {
      if (!b.date) return;
      const m = new Date(b.date).toLocaleString('default', { month: 'short' });
      if (monthly[m]) monthly[m].Revenue += (parseFloat(b.final_bill_amount) || 0);
    });

    data.maintenance.forEach(mRecord => {
      if (!mRecord.date) return;
      const m = new Date(mRecord.date).toLocaleString('default', { month: 'short' });
      if (monthly[m]) monthly[m].Expenses += (parseFloat(mRecord.cost) || 0);
    });

    return months.map(m => ({
      name: m,
      Profit: (monthly[m].Revenue - monthly[m].Expenses) || 0,
      Revenue: monthly[m].Revenue,
      Expenses: monthly[m].Expenses
    }));
  }, [data]);

  const vehicleProfitData = useMemo(() => {
    const vStats = {};
    data.vehicles.forEach(v => {
      vStats[v.vehicle_number] = { name: v.vehicle_number, Revenue: 0, Maintenance: 0 };
    });

    // Map bills to vehicles (if possible - if not, map bookings)
    data.bookings.forEach(b => {
      if (b.vehicle_number && vStats[b.vehicle_number]) {
        vStats[b.vehicle_number].Revenue += (parseFloat(b.total_amount) || 0);
      }
    });

    data.maintenance.forEach(m => {
      if (m.vehicle && vStats[m.vehicle]) {
        vStats[m.vehicle].Maintenance += (parseFloat(m.cost) || 0);
      }
    });

    return Object.values(vStats)
      .map(v => ({ ...v, Profit: v.Revenue - v.Maintenance }))
      .sort((a, b) => b.Profit - a.Profit)
      .slice(0, 5); // Top 5
  }, [data]);

  const recentPendingBills = useMemo(() => {
    const pendingSales = data.bills
      .filter(b => b.status === 'Pending' && b.bill_type === 'Sales')
      .map(b => ({ ...b, type: 'Sale', displayDate: b.date || b.created_at || new Date().toISOString() }));

    const pendingPurchases = data.bills
      .filter(b => b.status === 'Pending' && b.bill_type === 'Purchase')
      .map(b => ({ ...b, type: 'Purchase', displayDate: b.date || b.created_at || new Date().toISOString() }));

    const pendingEvents = (data.eventBills || [])
      .filter(b => b.status === 'Pending' || b.status === 'Partial')
      .map(b => ({ ...b, type: 'Event', displayDate: b.start_date || b.created_at || new Date().toISOString(), customer_name: b.client_name }));

    return [...pendingSales, ...pendingPurchases, ...pendingEvents]
      .sort((a, b) => new Date(b.displayDate) - new Date(a.displayDate))
      .slice(0, 10);
  }, [data]);

  if (loading) {
    return <div className="flex items-center justify-center h-full text-indigo-400"><Activity className="animate-spin h-8 w-8" /></div>;
  }

  return (
    <div className="space-y-6 pb-12">

      {/* Top Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-panel p-6 rounded-2xl border border-slate-700/50 shadow-xl flex items-start gap-4 relative overflow-hidden group">
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-indigo-500/10 rounded-full blur-xl group-hover:bg-indigo-500/20 transition duration-500" />
          <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl shrink-0 text-indigo-400">
            <TrendingUp className="h-6 w-6" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Total Revenue</div>
            <div className="text-2xl font-black text-slate-100">₹{stats.totalSales.toLocaleString('en-IN')}</div>
          </div>
        </div>
        <div className="glass-panel p-6 rounded-2xl border border-slate-700/50 shadow-xl flex items-start gap-4 relative overflow-hidden group">
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-emerald-500/10 rounded-full blur-xl group-hover:bg-emerald-500/20 transition duration-500" />
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl shrink-0 text-emerald-400">
            <IndianRupee className="h-6 w-6" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Est. Profit</div>
            <div className="text-2xl font-black text-slate-100">₹{stats.estimatedProfit.toLocaleString('en-IN')}</div>
          </div>
        </div>
        <div className="glass-panel p-6 rounded-2xl border border-slate-700/50 shadow-xl flex items-start gap-4 relative overflow-hidden group">
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-sky-500/10 rounded-full blur-xl group-hover:bg-sky-500/20 transition duration-500" />
          <div className="p-3 bg-sky-500/10 border border-sky-500/20 rounded-xl shrink-0 text-sky-400">
            <Car className="h-6 w-6" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Active Vehicles</div>
            <div className="text-2xl font-black text-slate-100">{stats.activeVehicles} Fleet</div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Revenue Chart */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-700/50 shadow-xl space-y-4">
          <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-emerald-400" />
            Monthly Revenue
          </h3>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `₹${value / 1000}k`} />
                <Tooltip
                  cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#f1f5f9' }}
                  itemStyle={{ color: '#34d399', fontWeight: 'bold' }}
                />
                <Bar dataKey="Revenue" fill="#34d399" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Profit Trend (Area) */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-700/50 shadow-xl space-y-4">
          <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <IndianRupee className="h-4 w-4 text-indigo-400" />
            Revenue vs Expenses
          </h3>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={profitData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#34d399" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#34d399" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorExp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `₹${value / 1000}k`} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                <Area type="monotone" dataKey="Revenue" stroke="#34d399" fillOpacity={1} fill="url(#colorRev)" strokeWidth={2} />
                <Area type="monotone" dataKey="Expenses" stroke="#f43f5e" fillOpacity={1} fill="url(#colorExp)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Pending Bills */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-700/50 shadow-xl space-y-4">
          <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <IndianRupee className="h-4 w-4 text-rose-400" />
            Recent Pending Bills
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300 border-collapse">
              <thead>
                <tr className="border-b border-slate-700/50 text-[10px] uppercase text-slate-500 font-bold tracking-wider">
                  <th className="py-2 px-3">Date</th>
                  <th className="py-2 px-3">Bill ID</th>
                  <th className="py-2 px-3">Customer</th>
                  <th className="py-2 px-3 text-right">Amount Due</th>
                  <th className="py-2 px-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {recentPendingBills.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="py-8 text-center">
                      <div className="text-slate-500 text-sm font-semibold">No pending bills found.</div>
                    </td>
                  </tr>
                ) : (
                  recentPendingBills.map((bill, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/20 transition">
                      <td className="py-3 px-3 whitespace-nowrap text-xs">{new Date(bill.displayDate).toLocaleDateString('en-IN') || '—'}</td>
                      <td className="py-3 px-3 font-mono text-indigo-400 font-bold text-xs">{bill.bill_no || bill.bill_id || bill.id || '—'}</td>
                      <td className="py-3 px-3 font-semibold text-slate-200">{bill.customer_name || '—'}</td>
                      <td className="py-3 px-3 text-right font-bold text-rose-400 text-xs">₹{Math.max(0, parseFloat(bill.final_bill_amount) - (parseFloat(bill.advance_amount) || 0)).toLocaleString('en-IN')}</td>
                      <td className="py-3 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleMarkAsPaid(bill)}
                          className="px-3 py-1 bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600 hover:text-white border border-emerald-500/30 rounded-lg text-[10px] font-bold transition"
                        >
                          Mark Paid
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Vehicle Profitability */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-700/50 shadow-xl space-y-4">
          <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <Car className="h-4 w-4 text-sky-400" />
            Most Profitable Vehicles
          </h3>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={vehicleProfitData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />
                <XAxis type="number" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `₹${value / 1000}k`} />
                <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} width={100} />
                <Tooltip
                  cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#f1f5f9' }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                <Bar dataKey="Revenue" fill="#38bdf8" radius={[0, 4, 4, 0]} barSize={12} />
                <Bar dataKey="Maintenance" fill="#f43f5e" radius={[0, 4, 4, 0]} barSize={12} />
                <Bar dataKey="Profit" fill="#a78bfa" radius={[0, 4, 4, 0]} barSize={12} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
}
