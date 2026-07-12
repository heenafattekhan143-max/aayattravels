import React, { useState, useEffect } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx-js-style';
import {
  FileText,
  Search,
  Trash2,
  Calendar,
  IndianRupee,
  Car,
  CheckCircle,
  XCircle,
  Edit,
  Download
} from 'lucide-react';
import { useConfirm } from '../context/ConfirmContext';
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

export default function EventList({ navigateTo, setEditingEventBillId }) {
  const confirm = useConfirm();
  const [bills, setBills] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    fetchEventBills();
  }, []);

  async function fetchEventBills() {
    try {
      const res = await axios.get('/api/event-bills');
      setBills(res.data);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch event bills.');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id) {
    const isConfirmed = await confirm("Are you sure you want to delete this event bill permanently?");
    if (!isConfirmed) return;
    try {
      await axios.delete(`/api/event-bills/${id}`);
      setBills(prev => prev.filter(b => b.id !== id));
    } catch (err) {
      console.error(err);
      alert("Failed to delete event bill.");
    }
  }

  async function handleUpdateStatus(bill, newStatus) {
    try {
      const updatedBill = { ...bill, status: newStatus };
      const res = await axios.put(`/api/event-bills/${bill.id}`, updatedBill);
      setBills(prev => prev.map(b => b.id === bill.id ? res.data : b));
    } catch (err) {
      console.error("Failed to update status:", err);
      alert("Failed to update event bill status.");
    }
  }

  // ─── Excel Styles ───
  const hdrStyle    = { font: { bold: true, sz: 12, color: { rgb: 'FFFFFF' } }, fill: { fgColor: { rgb: '0F2A5A' } }, alignment: { horizontal: 'center', vertical: 'center' }, border: { bottom: { style: 'medium', color: { rgb: '4472C4' } } } };
  const subHdrStyle = { font: { bold: true, sz: 11, color: { rgb: 'FFFFFF' } }, fill: { fgColor: { rgb: '1F5C99' } }, alignment: { horizontal: 'center', vertical: 'center' } };
  const labelStyle  = { font: { bold: true, sz: 11, color: { rgb: '1F3864' } }, fill: { fgColor: { rgb: 'DCE6F1' } }, alignment: { horizontal: 'left', vertical: 'center' } };
  const valueStyle  = { font: { sz: 11 }, alignment: { horizontal: 'left', vertical: 'center' } };
  const numFmt      = { numFmt: '₹#,##0.00', font: { sz: 11 }, alignment: { horizontal: 'right' } };
  const numFmtBold  = { numFmt: '₹#,##0.00', font: { bold: true, sz: 12, color: { rgb: '006100' } }, fill: { fgColor: { rgb: '92D050' } }, alignment: { horizontal: 'right' } };
  const totalStyle  = { font: { bold: true, sz: 12, color: { rgb: '006100' } }, fill: { fgColor: { rgb: '92D050' } }, alignment: { horizontal: 'center' } };
  const summaryLabel= { font: { bold: true, sz: 12, color: { rgb: 'FFFFFF' } }, fill: { fgColor: { rgb: '375623' } }, alignment: { horizontal: 'left', vertical: 'center' } };
  const summaryVal  = { numFmt: '₹#,##0.00', font: { bold: true, sz: 12, color: { rgb: 'FFFFFF' } }, fill: { fgColor: { rgb: '375623' } }, alignment: { horizontal: 'right', vertical: 'center' } };
  const altRow1     = { font: { sz: 11 }, fill: { fgColor: { rgb: 'E8F0FE' } }, alignment: { horizontal: 'center', vertical: 'center' } };
  const altRow2     = { font: { sz: 11 }, fill: { fgColor: { rgb: 'FFFFFF' } }, alignment: { horizontal: 'center', vertical: 'center' } };

  // Bulk export — all filtered event bills
  const handleExportExcel = async () => {
    const wb = XLSX.utils.book_new();

    // ── Sheet 1: Event Summary ──
    const sumHdr = [
      'Invoice No', 'Client Name', 'Event Name', 'Event Location',
      'Start Date', 'End Date', 'Total Days', 'Total Vehicles',
      'Subtotal ₹', 'GST Rate %', 'GST Amount ₹',
      'Toll ₹', 'Parking ₹', 'Advance ₹',
      'Grand Total ₹', 'Status'
    ];
    const sumRows = filteredBills.map(b => [
      b.bill_no || b.id?.substring(0, 6)?.toUpperCase() || '',
      b.client_name || '',
      b.event_name || '',
      b.event_location || '',
      b.start_date || '',
      b.end_date || '',
      b.total_days || '',
      b.total_vehicles_count || 0,
      parseFloat(b.subtotal) || 0,
      parseFloat(b.gst_rate) || 0,
      parseFloat(b.gst_amount) || 0,
      parseFloat(b.toll_amount) || 0,
      parseFloat(b.parking_amount) || 0,
      parseFloat(b.advance_amount) || 0,
      parseFloat(b.final_bill_amount) || 0,
      b.status || ''
    ]);
    const sumTotal = ['TOTAL', '', '', '', '', '', '', sumRows.reduce((s, r) => s + r[7], 0),
      sumRows.reduce((s, r) => s + r[8], 0), '',
      sumRows.reduce((s, r) => s + r[10], 0),
      sumRows.reduce((s, r) => s + r[11], 0),
      sumRows.reduce((s, r) => s + r[12], 0),
      sumRows.reduce((s, r) => s + r[13], 0),
      sumRows.reduce((s, r) => s + r[14], 0), ''
    ];
    const ws1 = XLSX.utils.aoa_to_sheet([sumHdr, ...sumRows, sumTotal]);
    const nCol1 = sumHdr.length;
    const moneyCols1 = [8, 10, 11, 12, 13, 14];
    for (let c = 0; c < nCol1; c++) {
      const a = XLSX.utils.encode_cell({ r: 0, c }); if (!ws1[a]) ws1[a] = { t: 's', v: '' }; ws1[a].s = hdrStyle;
    }
    sumRows.forEach((_, ri) => {
      const s = ri % 2 === 0 ? altRow1 : altRow2;
      for (let c = 0; c < nCol1; c++) {
        const a = XLSX.utils.encode_cell({ r: ri + 1, c }); if (!ws1[a]) ws1[a] = { t: 'n', v: 0 };
        ws1[a].s = moneyCols1.includes(c) ? { ...numFmt, fill: s.fill } : s;
      }
    });
    const tr1 = sumRows.length + 1;
    for (let c = 0; c < nCol1; c++) {
      const a = XLSX.utils.encode_cell({ r: tr1, c }); if (!ws1[a]) ws1[a] = { t: 's', v: '' };
      ws1[a].s = moneyCols1.includes(c) ? numFmtBold : totalStyle;
    }
    ws1['!cols'] = [
      { wch: 12 }, { wch: 26 }, { wch: 26 }, { wch: 22 },
      { wch: 12 }, { wch: 12 }, { wch: 10 }, { wch: 14 },
      { wch: 14 }, { wch: 12 }, { wch: 14 },
      { wch: 12 }, { wch: 12 }, { wch: 12 },
      { wch: 14 }, { wch: 12 }
    ];
    XLSX.utils.book_append_sheet(wb, ws1, '📋 Event Summary');

    // ── Sheet 2: Vehicle Line Items (fetched from bookings) ──
    let allBookings = [];
    for (const b of filteredBills) {
      try {
        const res = await axios.get(`/api/bookings?event_id=${b.id}`);
        (res.data || []).forEach(bk => allBookings.push({ ...bk, _bill: b }));
      } catch (e) { /* skip */ }
    }

    const vehHdr = [
      'Invoice No', 'Client Name', 'Event Name', 'Start Date', 'End Date',
      'Vehicle No', 'Vehicle Type', 'Driver Name',
      'Rate ₹', 'DA Allowance ₹', 'Night Allowance ₹',
      'Extra KM', 'Extra KM Rate ₹', 'Total ₹', 'Status'
    ];
    const vehRows = allBookings.map(bk => [
      bk._bill?.bill_no || bk._bill?.id?.substring(0, 6)?.toUpperCase() || '',
      bk._bill?.client_name || '',
      bk._bill?.event_name || '',
      bk._bill?.start_date || '',
      bk._bill?.end_date || '',
      bk.vehicle_number || '',
      bk.vehicle_type || '',
      bk.driver_name || '',
      parseFloat(bk.rate) || 0,
      parseFloat(bk.da_allowance) || 0,
      parseFloat(bk.night_allowance) || 0,
      parseFloat(bk.extra_km) || 0,
      parseFloat(bk.extra_km_rate) || 0,
      (parseFloat(bk.rate) || 0) + (parseFloat(bk.da_allowance) || 0) + (parseFloat(bk.night_allowance) || 0),
      bk.booking_status || ''
    ]);
    const ws2 = XLSX.utils.aoa_to_sheet([vehHdr, ...vehRows]);
    const nCol2 = vehHdr.length;
    const moneyCols2 = [8, 9, 10, 12, 13];
    for (let c = 0; c < nCol2; c++) {
      const a = XLSX.utils.encode_cell({ r: 0, c }); if (!ws2[a]) ws2[a] = { t: 's', v: '' }; ws2[a].s = subHdrStyle;
    }
    vehRows.forEach((_, ri) => {
      const s = ri % 2 === 0 ? altRow1 : altRow2;
      for (let c = 0; c < nCol2; c++) {
        const a = XLSX.utils.encode_cell({ r: ri + 1, c }); if (!ws2[a]) ws2[a] = { t: 'n', v: 0 };
        ws2[a].s = moneyCols2.includes(c) ? { ...numFmt, fill: s.fill } : s;
      }
    });
    ws2['!cols'] = [
      { wch: 12 }, { wch: 26 }, { wch: 26 }, { wch: 12 }, { wch: 12 },
      { wch: 16 }, { wch: 16 }, { wch: 22 },
      { wch: 12 }, { wch: 16 }, { wch: 18 },
      { wch: 10 }, { wch: 14 }, { wch: 14 }, { wch: 12 }
    ];
    XLSX.utils.book_append_sheet(wb, ws2, '🚗 Vehicle Line Items');

    // ── Sheet 3: GST Summary ──
    const gstHdr = [
      'Invoice No', 'Client Name', 'Event Name', 'Start Date',
      'GST Rate %', 'Subtotal ₹', 'GST Amount ₹', 'Grand Total ₹'
    ];
    const gstRows = filteredBills.filter(b => (parseFloat(b.gst_rate) || 0) > 0).map(b => [
      b.bill_no || b.id?.substring(0, 6)?.toUpperCase() || '',
      b.client_name || '',
      b.event_name || '',
      b.start_date || '',
      parseFloat(b.gst_rate) || 0,
      parseFloat(b.subtotal) || 0,
      parseFloat(b.gst_amount) || 0,
      parseFloat(b.final_bill_amount) || 0
    ]);
    const ws3 = XLSX.utils.aoa_to_sheet([gstHdr, ...gstRows]);
    const nCol3 = gstHdr.length;
    const moneyCols3 = [5, 6, 7];
    for (let c = 0; c < nCol3; c++) {
      const a = XLSX.utils.encode_cell({ r: 0, c }); if (!ws3[a]) ws3[a] = { t: 's', v: '' };
      ws3[a].s = { ...hdrStyle, fill: { fgColor: { rgb: '5B2A8A' } } };
    }
    gstRows.forEach((_, ri) => {
      const s = ri % 2 === 0 ? { fill: { fgColor: { rgb: 'F5F0FF' } } } : { fill: { fgColor: { rgb: 'FFFFFF' } } };
      for (let c = 0; c < nCol3; c++) {
        const a = XLSX.utils.encode_cell({ r: ri + 1, c }); if (!ws3[a]) ws3[a] = { t: 'n', v: 0 };
        ws3[a].s = moneyCols3.includes(c) ? { ...numFmt, fill: s.fill } : { ...s, alignment: { horizontal: 'center' } };
      }
    });
    ws3['!cols'] = [{ wch: 12 }, { wch: 26 }, { wch: 26 }, { wch: 12 }, { wch: 12 }, { wch: 14 }, { wch: 14 }, { wch: 14 }];
    XLSX.utils.book_append_sheet(wb, ws3, '🧾 GST Summary');

    XLSX.writeFile(wb, `EventBills_Export_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  // Single bill download
  const handleExportSingleBill = async (bill) => {
    const wb = XLSX.utils.book_new();

    // Fetch bookings for this event
    let bookings = [];
    try {
      const res = await axios.get(`/api/bookings?event_id=${bill.id}`);
      bookings = res.data || [];
    } catch (e) { /* skip */ }

    const infoData = [
      ['PURVI TOURS & TRAVELS – EVENT BILL', '', '', ''],
      ['Invoice No:', bill.bill_no || '', 'Status:', bill.status || ''],
      ['Client Name:', bill.client_name || '', 'Event Name:', bill.event_name || ''],
      ['Location:', bill.event_location || '', 'Total Days:', bill.total_days || ''],
      ['Start Date:', bill.start_date || '', 'End Date:', bill.end_date || ''],
      ['Total Vehicles:', bill.total_vehicles_count || 0, 'GST Rate:', `${bill.gst_rate || 0}%`],
      ['', '', '', ''],
    ];

    const lineHdr = [
      'Vehicle No', 'Vehicle Type', 'Driver Name',
      'Rate ₹', 'DA Allowance ₹', 'Night Allowance ₹',
      'Extra KM', 'Extra KM Rate ₹', 'Row Total ₹', 'Status'
    ];
    const lineData = bookings.map(bk => [
      bk.vehicle_number || '',
      bk.vehicle_type || '',
      bk.driver_name || '',
      parseFloat(bk.rate) || 0,
      parseFloat(bk.da_allowance) || 0,
      parseFloat(bk.night_allowance) || 0,
      parseFloat(bk.extra_km) || 0,
      parseFloat(bk.extra_km_rate) || 0,
      (parseFloat(bk.rate) || 0) + (parseFloat(bk.da_allowance) || 0) + (parseFloat(bk.night_allowance) || 0),
      bk.booking_status || ''
    ]);
    const totalsRow = [
      'TOTAL', '', '',
      lineData.reduce((s, r) => s + r[3], 0),
      lineData.reduce((s, r) => s + r[4], 0),
      lineData.reduce((s, r) => s + r[5], 0),
      lineData.reduce((s, r) => s + r[6], 0), '',
      lineData.reduce((s, r) => s + r[8], 0), ''
    ];
    const summaryData = [
      ['', '', '', ''],
      ['Subtotal:', parseFloat(bill.subtotal) || 0, 'GST Amount:', parseFloat(bill.gst_amount) || 0],
      ['Toll:', parseFloat(bill.toll_amount) || 0, 'Parking:', parseFloat(bill.parking_amount) || 0],
      ['Advance Paid:', parseFloat(bill.advance_amount) || 0, 'Grand Total:', parseFloat(bill.final_bill_amount) || 0],
    ];

    const fullData = [...infoData, lineHdr, ...lineData, totalsRow, ...summaryData];
    const ws = XLSX.utils.aoa_to_sheet(fullData);

    // Style company row
    const c1 = ws['A1']; if (c1) c1.s = { font: { bold: true, sz: 18, color: { rgb: '1A3C8F' } }, fill: { fgColor: { rgb: 'D6E4FF' } }, alignment: { horizontal: 'left', vertical: 'center' } };

    // Info rows labels
    for (let r = 1; r <= 5; r++) {
      ['A', 'C'].forEach(col => { const cell = ws[`${col}${r + 1}`]; if (cell) cell.s = labelStyle; });
      ['B', 'D'].forEach(col => { const cell = ws[`${col}${r + 1}`]; if (cell) cell.s = valueStyle; });
    }

    // Line header
    const lhr = infoData.length;
    for (let c = 0; c < lineHdr.length; c++) {
      const a = XLSX.utils.encode_cell({ r: lhr, c }); if (!ws[a]) ws[a] = { t: 's', v: '' }; ws[a].s = hdrStyle;
    }

    // Line data rows
    const moneyCols = [3, 4, 5, 7, 8];
    lineData.forEach((_, ri) => {
      const s = ri % 2 === 0 ? altRow1 : altRow2;
      for (let c = 0; c < lineHdr.length; c++) {
        const a = XLSX.utils.encode_cell({ r: lhr + 1 + ri, c }); if (!ws[a]) ws[a] = { t: 'n', v: 0 };
        ws[a].s = moneyCols.includes(c) ? { ...numFmt, fill: s.fill } : s;
      }
    });

    // Totals row
    const tridx = lhr + 1 + lineData.length;
    for (let c = 0; c < lineHdr.length; c++) {
      const a = XLSX.utils.encode_cell({ r: tridx, c }); if (!ws[a]) ws[a] = { t: 's', v: '' };
      ws[a].s = moneyCols.includes(c) ? numFmtBold : totalStyle;
    }

    // Summary section styling (after totals row)
    // summaryData starts at: tridx + 2 (blank row after totals)
    const summaryStartRow = tridx + 2;
    // 3 data rows (Subtotal/GST, Toll/Parking, Advance/Grand Total)
    [[0,1],[1,3],[2,3]].forEach(([rowOffset, valColIdx]) => {
      for (let col = 0; col < 4; col++) {
        const a = XLSX.utils.encode_cell({ r: summaryStartRow + rowOffset, c: col });
        if (!ws[a]) ws[a] = { t: 's', v: '' };
        if (col === 0 || col === 2) { ws[a].s = summaryLabel; }
        else { ws[a].s = summaryVal; }
      }
    });

    ws['!cols'] = [
      { wch: 18 }, { wch: 18 }, { wch: 24 },
      { wch: 14 }, { wch: 18 }, { wch: 20 },
      { wch: 12 }, { wch: 16 }, { wch: 16 }, { wch: 14 }
    ];
    ws['!rows'] = [{ hpt: 28 }]; // taller company name row
    XLSX.utils.book_append_sheet(wb, ws, 'Event Invoice');
    XLSX.writeFile(wb, `EventInvoice_${bill.bill_no || bill.id?.substring(0, 6)}_${bill.start_date || 'export'}.xlsx`);
  };

  const filteredBills = bills.filter(b => {
    const matchesSearch = b.client_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.event_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.bill_no?.toLowerCase().includes(searchTerm.toLowerCase());

    let matchesDate = true;
    if (startDate && b.start_date < startDate) matchesDate = false;
    if (endDate && b.start_date > endDate) matchesDate = false;

    return matchesSearch && matchesDate;
  });

  return (
    <div className="space-y-6 pb-20">

      {/* Header with Export button */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center bg-gradient-to-r from-slate-900 to-indigo-950 p-5 rounded-2xl border border-indigo-500/20 shadow-xl gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-50 tracking-tight">Event Bill Records</h1>
          <p className="text-indigo-200 mt-0.5 text-sm font-medium">Browse and export event invoices</p>
        </div>
        <button
          onClick={handleExportExcel}
          className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 px-4 rounded-xl shadow-lg transition w-full sm:w-auto"
          title="Export All Filtered Bills to Excel (3 sheets)"
        >
          <Download className="h-4 w-4" /> Export Excel
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 items-center bg-slate-900/50 p-4 rounded-xl border border-slate-700/50 shadow-xl">
        <div className="flex flex-1 gap-4 items-center w-full glass-panel p-3 rounded-lg border border-slate-700/50">
          <Search className="h-5 w-5 text-slate-400 shrink-0" />
          <input
            type="text"
            placeholder="Search by client, event name, or bill no..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-transparent border-none outline-none text-slate-100 placeholder-slate-400 text-sm"
          />
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto relative z-20">
          <div className="w-full md:w-40 relative">
            <CustomDatePicker
              value={startDate}
              onChange={setStartDate}
              placeholder="Start Date"
            />
          </div>
          <div className="w-full md:w-40 relative">
            <CustomDatePicker
              value={endDate}
              onChange={setEndDate}
              placeholder="End Date"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
        </div>
      ) : error ? (
        <div className="bg-rose-500/10 border border-rose-500/30 text-rose-400 p-4 rounded-xl text-center">
          {error}
        </div>
      ) : (
        <div className="glass-panel rounded-2xl border border-slate-700/50 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-700 bg-table-header text-slate-400 text-xs font-semibold uppercase tracking-wider">
                  <th className="p-4">Invoice No</th>
                  <th className="p-4">Start Date</th>
                  <th className="p-4">End Date</th>
                  <th className="p-4">Client / Event</th>
                  <th className="p-4">Vehicles</th>
                  <th className="p-4">Total Amount</th>
                  <th className="p-4">Payments</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-sm text-slate-300">
                {filteredBills.map((bill, idx) => (
                  <tr key={bill.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="p-4">
                      <span className="font-mono text-indigo-400 font-bold">{bill.bill_no || bill.id.substring(0, 6).toUpperCase()}</span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1.5 text-slate-300">
                        <Calendar className="h-3.5 w-3.5 text-slate-500" />
                        <span>{formatDate(bill.start_date)}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1.5 text-slate-300">
                        <Calendar className="h-3.5 w-3.5 text-slate-500" />
                        <span>{formatDate(bill.end_date)}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="font-bold text-slate-200 uppercase">{bill.client_name}</div>
                      <div className="text-xs text-slate-400 italic">{bill.event_name}</div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1 text-slate-300">
                        <Car className="h-3.5 w-3.5 text-slate-500" />
                        <span className="font-semibold">{bill.total_vehicles_count}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="font-bold text-emerald-400">
                        ₹{bill.final_bill_amount.toLocaleString('en-IN')}
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="px-2 py-1 rounded text-[10px] font-bold uppercase bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        {bill.status}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {bill.status !== 'Paid' && bill.status !== 'Cancelled' && (
                          <button
                            onClick={() => handleUpdateStatus(bill, 'Paid')}
                            className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20 transition"
                            title="Mark as Paid"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </button>
                        )}
                        {bill.status !== 'Cancelled' && bill.status !== 'Paid' && (
                          <button
                            onClick={() => handleUpdateStatus(bill, 'Cancelled')}
                            className="p-2 rounded-lg bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 border border-amber-500/20 transition"
                            title="Cancel Bill"
                          >
                            <XCircle className="h-4 w-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleExportSingleBill(bill)}
                          className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20 transition"
                          title="Download Excel for this Event Bill"
                        >
                          <Download className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => {
                            setEditingEventBillId(bill.id);
                            navigateTo('event-billing');
                          }}
                          className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 border border-indigo-500/20 transition"
                          title="Edit Event Bill"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(bill.id)}
                          className="p-2 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-500/20 transition"
                          title="Delete Event Bill"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredBills.length === 0 && (
                  <tr>
                    <td colSpan="8" className="p-8 text-center text-slate-500">
                      No event bills found matching your criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
