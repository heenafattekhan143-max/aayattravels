import React, { useState, useEffect } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';
import { Download, Loader2, Search, FileText } from 'lucide-react';

const REPORT_CONFIG = {
  sales: {
    title: 'Sales Report',
    endpoint: '/api/bills',
    filter: (data) => data.filter(b => b.bill_type === 'Sales'),
    columns: [
      { header: 'Date', key: 'date', format: (v) => v ? new Date(v).toLocaleDateString() : '-' },
      { header: 'Bill No', key: 'bill_no' },
      { header: 'Client', key: 'customer_name' },
      { header: 'Vehicle', key: 'vehicle_number' },
      { header: 'Driver', key: 'driver_name' },
      { header: 'Route', key: 'route', value: (row) => row.source && row.destination ? `${row.source} - ${row.destination}` : '-' },
      { header: 'Status', key: 'status' },
      { header: 'Total Amount', key: 'final_bill_amount' },
      { header: 'Paid Amount', key: 'paid_amount' },
      { header: 'Pending Amount', key: 'pending_amount', value: (row) => (row.final_bill_amount || 0) - (row.paid_amount || 0) },
      { header: 'Actions', key: 'actions' }
    ]
  },
  vendor: {
    title: 'Vendor Report',
    endpoint: '/api/bills',
    filter: (data) => data.filter(b => b.bill_type === 'Purchase'),
    columns: [
      { header: 'Date', key: 'date', format: (v) => v ? new Date(v).toLocaleDateString() : '-' },
      { header: 'Bill No', key: 'bill_no' },
      { header: 'Vendor', key: 'vendor_name' },
      { header: 'Vehicle', key: 'vehicle_number' },
      { header: 'Driver', key: 'driver_name' },
      { header: 'Route', key: 'route', value: (row) => row.source && row.destination ? `${row.source} - ${row.destination}` : '-' },
      { header: 'Status', key: 'status' },
      { header: 'Total Amount', key: 'final_bill_amount' },
      { header: 'Paid Amount', key: 'paid_amount' },
      { header: 'Pending Amount', key: 'pending_amount', value: (row) => (row.final_bill_amount || 0) - (row.paid_amount || 0) },
      { header: 'Actions', key: 'actions' }
    ]
  },
  bookings: {
    title: 'Bookings Report',
    endpoint: '/api/bookings',
    filter: (data) => data,
    columns: [
      { header: 'Trip Date', key: 'journey_date', format: (v) => v ? new Date(v).toLocaleDateString() : '-' },
      { header: 'Client', key: 'customer_name' },
      { header: 'Phone', key: 'customer_phone' },
      { header: 'Vehicle', key: 'vehicle_number' },
      { header: 'Driver', key: 'driver_name' },
      { header: 'Trip Type', key: 'trip_type' },
      { header: 'Passengers', key: 'passengers' },
      { header: 'Route', key: 'route', value: (row) => row.pickup_location && row.drop_location ? `${row.pickup_location} - ${row.drop_location}` : '-' },
      { header: 'Start Km', key: 'start_km' },
      { header: 'End Km', key: 'end_km' },
      { header: 'Status', key: 'booking_status' },
      { header: 'Total Fare', key: 'total_amount' },
      { header: 'Advance', key: 'advance_amount' },
      { header: 'Pending', key: 'pending_amount', value: (row) => (row.total_amount || 0) - (row.advance_amount || 0) },
      { header: 'Actions', key: 'actions' }
    ]
  },
  maintenance: {
    title: 'Vehicle Maintenance Report',
    endpoint: '/api/maintenance',
    filter: (data) => data,
    columns: [
      { header: 'Date', key: 'date', format: (v) => v ? new Date(v).toLocaleDateString() : '-' },
      { header: 'Vehicle', key: 'vehicle' },
      { header: 'Type', key: 'type' },
      { header: 'Cost', key: 'cost' },
      { header: 'Service/Notes', key: 'service' }
    ]
  },
  driver: {
    title: 'Driver Report',
    endpoint: '/api/drivers',
    filter: (data) => data,
    columns: [
      { header: 'Name', key: 'name' },
      { header: 'Phone', key: 'phone' },
      { header: 'License No', key: 'license_number' },
      { header: 'Join Date', key: 'joining_date', format: (v) => v ? new Date(v).toLocaleDateString() : '-' },
      { header: 'Basic Salary', key: 'basic_salary' },
      { header: 'Status', key: 'status' }
    ]
  },
  payments: {
    title: 'Payments Report (Vendors)',
    endpoint: '/api/payments',
    filter: (data) => data,
    columns: [
      { header: 'Date', key: 'payment_date', format: (v) => v ? new Date(v).toLocaleDateString() : '-' },
      { header: 'Vendor Name', key: 'vendor_name' },
      { header: 'Amount', key: 'amount' },
      { header: 'Mode', key: 'payment_mode' },
      { header: 'Reference ID', key: 'reference_id' },
      { header: 'Notes', key: 'notes' }
    ]
  },
  advances: {
    title: 'Advances Report (Drivers & Vendors)',
    endpoint: '/api/advances',
    filter: (data) => data,
    columns: [
      { header: 'Date', key: 'date', format: (v) => v ? new Date(v).toLocaleDateString() : '-' },
      { header: 'Party Type', key: 'party_type' },
      { header: 'Name', key: 'party_name' },
      { header: 'Amount', key: 'amount' },
      { header: 'Direction', key: 'direction' },
      { header: 'Mode', key: 'payment_mode' },
      { header: 'Notes', key: 'notes' }
    ]
  }
};

export default function ReportsView({ reportType, navigateTo, setViewingBillId, setReturnToRoute }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Filters
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const config = REPORT_CONFIG[reportType];

  useEffect(() => {
    if (config) {
      fetchData();
    }
  }, [reportType]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await axios.get(`${config.endpoint}?t=${Date.now()}`);
      let processedData = config.filter(res.data);

      // FIFO Logic for Sales and Vendor Reports to compute Paid Amount correctly
      if (reportType === 'sales') {
        const recvRes = await axios.get('/api/received-payments');
        const receivedPayments = recvRes.data || [];
        
        // Group bills by customer
        const customerMap = {};
        processedData.forEach(b => {
          const name = (b.customer_name || '').toLowerCase().trim();
          if (!customerMap[name]) customerMap[name] = [];
          customerMap[name].push(b);
        });

        Object.keys(customerMap).forEach(cust => {
          let totalReceived = receivedPayments
            .filter(p => (p.customer_name || '').toLowerCase().trim() === cust)
            .reduce((sum, p) => sum + (p.amount || 0), 0);

          // Sort oldest first for FIFO
          customerMap[cust].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
          
          customerMap[cust].forEach(bill => {
            const billTotal = bill.final_bill_amount || 0;
            // First use explicitly saved paid_amount (e.g. from advance), then remaining ledger pool
            let paid = parseFloat(bill.paid_amount) || 0;
            if (paid < billTotal && totalReceived > 0) {
              const shortfall = billTotal - paid;
              const apply = Math.min(shortfall, totalReceived);
              paid += apply;
              totalReceived -= apply;
            }
            bill.paid_amount = paid;
          });
        });
      } else if (reportType === 'vendor') {
        const [payRes, advRes] = await Promise.all([
          axios.get('/api/payments'),
          axios.get('/api/advances')
        ]);
        const payments = payRes.data || [];
        const advances = advRes.data || [];
        
        const vendorMap = {};
        processedData.forEach(b => {
          const name = (b.vendor_name || '').toLowerCase().trim();
          if (!vendorMap[name]) vendorMap[name] = [];
          vendorMap[name].push(b);
        });

        Object.keys(vendorMap).forEach(vend => {
          const totalPaid = payments
            .filter(p => (p.vendor_name || '').toLowerCase().trim() === vend)
            .reduce((sum, p) => sum + (p.amount || 0), 0);
            
          const totalAdvances = advances
            .filter(a => (a.party_name || '').toLowerCase().trim() === vend && a.party_type === 'Vendor' && a.direction === 'sent')
            .reduce((sum, a) => sum + (a.amount || 0), 0);
            
          let availableCredit = totalPaid + totalAdvances;

          // Sort oldest first for FIFO
          vendorMap[vend].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
          
          vendorMap[vend].forEach(bill => {
            const billTotal = bill.final_bill_amount || 0;
            let paid = parseFloat(bill.paid_amount) || 0;
            if (paid < billTotal && availableCredit > 0) {
              const shortfall = billTotal - paid;
              const apply = Math.min(shortfall, availableCredit);
              paid += apply;
              availableCredit -= apply;
            }
            bill.paid_amount = paid;
          });
        });
      }

      setData(processedData);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch report data.');
    } finally {
      setLoading(false);
    }
  };

  const getFilteredData = () => {
    return data.filter(item => {
      // Date filter
      if (startDate && endDate) {
        const itemDate = new Date(item.created_at || item.date || item.joining_date);
        const start = new Date(startDate);
        const end = new Date(endDate);
        end.setHours(23, 59, 59); // Include entire end day
        if (itemDate < start || itemDate > end) return false;
      }
      
      // Text search filter (basic global search across values)
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matches = config.columns.some(col => {
          let val = col.value ? col.value(item) : item[col.key];
          if (col.format && val) val = col.format(val);
          return String(val || '').toLowerCase().includes(query);
        });
        if (!matches) return false;
      }
      
      return true;
    });
  };

  const handleViewInvoice = async (row) => {
    if (reportType === 'bookings') {
      try {
        const res = await axios.get('/api/bills');
        const bill = res.data.find(b => b.booking_ref === row.id);
        if (bill) {
          setViewingBillId(bill.id);
          setReturnToRoute('reports-bookings');
          navigateTo('bill-list');
        } else {
          alert("Bill not generated for this booking yet.");
        }
      } catch (err) {
        console.error(err);
        alert("Failed to fetch bill details.");
      }
    } else {
      setViewingBillId(row.id);
      setReturnToRoute(reportType === 'sales' ? 'reports-sales' : 'reports-vendor');
      navigateTo('bill-list');
    }
  };

  const handleExport = () => {
    const filteredData = getFilteredData();
    if (filteredData.length === 0) {
      alert("No data available to export.");
      return;
    }

    // Format data for Excel
    const excelData = filteredData.map(item => {
      const row = {};
      config.columns.forEach(col => {
        let val = col.value ? col.value(item) : item[col.key];
        if (col.format && val) val = col.format(val);
        row[col.header] = val;
      });
      return row;
    });

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, config.title);
    
    // Generate filename
    const filename = `${config.title.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(workbook, filename);
  };

  if (!config) return <div className="p-6 text-slate-300">Invalid Report Type</div>;

  const filteredData = getFilteredData();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
            <FileText className="h-6 w-6 text-indigo-400" />
            {config.title}
          </h1>
          <p className="text-slate-400 text-sm mt-1">Generate and export {config.title.toLowerCase()}s</p>
        </div>
        <button
          onClick={handleExport}
          disabled={loading || filteredData.length === 0}
          className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold rounded-xl transition shadow-lg shadow-emerald-900/20"
        >
          <Download className="h-4 w-4" /> Export to Excel
        </button>
      </div>

      <div className="glass-panel rounded-2xl border border-slate-700/50 shadow-xl p-5 md:p-6">
        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div>
            <label className="text-xs font-semibold text-slate-300 mb-1 block">From Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full bg-slate-950/60 border border-slate-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none rounded-xl px-4 py-2 text-sm text-slate-100 transition"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-300 mb-1 block">To Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full bg-slate-950/60 border border-slate-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none rounded-xl px-4 py-2 text-sm text-slate-100 transition"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-300 mb-1 block">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <input
                type="text"
                placeholder="Search records..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-950/60 border border-slate-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none rounded-xl pl-10 pr-4 py-2 text-sm text-slate-100 transition"
              />
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 bg-rose-500/10 border border-rose-500/20 text-rose-400 p-4 rounded-xl text-sm font-medium">
            {error}
          </div>
        )}

        {/* Data Table Preview */}
        <div className="overflow-x-auto rounded-xl border border-slate-700/50">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-800/50 text-slate-400 text-xs font-bold uppercase tracking-wider">
                {config.columns.map((col, i) => (
                  <th key={i} className="p-4 border-b border-slate-700/50">{col.header}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={config.columns.length} className="p-8 text-center">
                    <Loader2 className="h-8 w-8 animate-spin text-indigo-500 mx-auto" />
                  </td>
                </tr>
              ) : filteredData.length === 0 ? (
                <tr>
                  <td colSpan={config.columns.length} className="p-8 text-center text-slate-400 text-sm">
                    No records found matching your filters.
                  </td>
                </tr>
              ) : (
                filteredData.slice(0, 50).map((row, i) => (
                  <tr key={i} className="border-b border-slate-700/30 hover:bg-slate-800/30 transition text-sm">
                    {config.columns.map((col, j) => {
                      if (col.key === 'actions') {
                        return (
                          <td key={j} className="p-4 text-slate-300 whitespace-nowrap">
                            <button
                              onClick={() => handleViewInvoice(row)}
                              className="p-1.5 bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 rounded-lg transition"
                              title="View Invoice"
                            >
                              <FileText className="w-4 h-4" />
                            </button>
                          </td>
                        );
                      }
                      let val = col.value ? col.value(row) : row[col.key];
                      if (col.format && val) val = col.format(val);
                      return (
                        <td key={j} className="p-4 text-slate-300 whitespace-nowrap">
                          {val !== undefined && val !== null && val !== '' ? val : '-'}
                        </td>
                      );
                    })}
                  </tr>
                ))
              )}
            </tbody>
          </table>
          {!loading && filteredData.length > 50 && (
            <div className="p-3 text-center text-xs font-semibold text-slate-500 bg-slate-900/50 border-t border-slate-700/50">
              Showing first 50 records. Export to Excel to view all {filteredData.length} records.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
