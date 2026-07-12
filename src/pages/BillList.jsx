import React, { useState, useEffect } from 'react';
import axios from 'axios';
import CustomDatePicker from '../components/CustomDatePicker';
import * as XLSX from 'xlsx-js-style';
import {
  FileText,
  Search,
  Trash2,
  Printer,
  Eye,
  X,
  ArrowLeft,
  Calendar,
  User,
  Hash,
  ShieldCheck,
  Receipt,
  Plus,
  Edit,
  Download
} from 'lucide-react';
import { useConfirm } from '../context/ConfirmContext';
import { useAuth } from '../context/AuthContext';

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

export default function BillList({ navigateTo, setEditingBillId }) {
  const confirm = useConfirm();
  const { user } = useAuth();
  // Dynamic business info from user profile
  const bizName    = user?.businessName || 'My Business';
  const bizAddress = user?.address      || '';
  const bizPhone   = user?.phone        || '';
  const bizEmail   = user?.email        || '';
  const bizGstin   = user?.gstin        || '';
  const bizSac     = user?.sacCode      || '998559';
  const bizState   = user?.state        || '27-Maharashtra';
  const bizLogo    = user?.logo         || null;
  const [bills, setBills] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Selected bill to view / print details
  const [selectedBill, setSelectedBill] = useState(null);
  const [customerDetails, setCustomerDetails] = useState(null);

  useEffect(() => {
    if (selectedBill && selectedBill.customer_id) {
      axios.get(`/api/customers/${selectedBill.customer_id}`)
        .then(res => setCustomerDetails(res.data))
        .catch(err => {
          console.error("Error fetching customer details:", err);
          setCustomerDetails(null);
        });
    } else {
      setCustomerDetails(null);
    }
  }, [selectedBill]);

  useEffect(() => {
    fetchBills();
  }, []);

  async function fetchBills() {
    try {
      const res = await axios.get('/api/bills');
      // Main bill list shows only Sales invoices; Purchase goes to the Purchase screen
      setBills(res.data.filter(b => b.bill_type === 'Sales'));
    } catch (err) {
      console.error(err);
      setError('Failed to fetch bills.');
    } finally {
      setLoading(false);
    }
  }

  const getTaxSummary = () => {
    if (!selectedBill || !selectedBill.table_items) return [];
    const summaryMap = {};
    selectedBill.table_items.forEach(item => {
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
          igstRate: gstRate,
          igstAmount: 0,
          totalTax: 0
        };
      }
      summaryMap[gstRate].taxableAmount += amountWithoutGst;
      summaryMap[gstRate].cgstAmount += taxAmt / 2;
      summaryMap[gstRate].sgstAmount += taxAmt / 2;
      summaryMap[gstRate].igstAmount += taxAmt;
      summaryMap[gstRate].totalTax += taxAmt;
    });
    return Object.values(summaryMap);
  };

  async function handleDelete(id) {
    const isConfirmed = await confirm("Are you sure you want to delete this invoice record permanently?");
    if (!isConfirmed) return;
    try {
      await axios.delete(`/api/bills/${id}`);
      setBills(prev => prev.filter(b => b.id !== id));
      if (selectedBill?.id === id) {
        setSelectedBill(null);
      }
    } catch (err) {
      console.error(err);
      alert("Failed to delete invoice.");
    }
  }

  const handlePrint = () => {
    const printContent = document.getElementById("invoice-print-area").innerHTML;
    const originalContent = document.body.innerHTML;
    document.body.innerHTML = printContent;
    window.print();
    document.body.innerHTML = originalContent;
    window.location.reload(); // Reload to restore event listeners
  };

  const printSubtotalExclTax = selectedBill ? (selectedBill.table_items || []).reduce((sum, item) => sum + (item.amount_without_gst || 0), 0) : 0;
  const printGstAmount = selectedBill ? (selectedBill.table_items || []).reduce((sum, item) => sum + ((item.amount_with_gst || 0) - (item.amount_without_gst || 0)), 0) : 0;
  
  const hasExtraHours = selectedBill ? (selectedBill.table_items || []).some(item => parseFloat(item.extra_hours) > 0) : true;
  const hasNightAllowance = selectedBill ? (selectedBill.table_items || []).some(item => parseFloat(item.night_allowance) > 0) : true;

  const customerGstin = customerDetails?.gstin || (selectedBill ? selectedBill.customer_gstin : '') || '';
  const customerStateCode = customerGstin ? customerGstin.substring(0, 2) : '27';
  const customerStateName = customerDetails?.state || 'Maharashtra';
  const placeOfSupply = `${customerStateCode}-${customerStateName}`;
  const isInterState = customerStateCode !== '27';

  const filteredBills = bills.filter(b => {
    const matchesSearch = b.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.vehicle_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.guest_name?.toLowerCase().includes(searchTerm.toLowerCase());

    let matchesDate = true;
    if (startDate && b.date < startDate) matchesDate = false;
    if (endDate && b.date > endDate) matchesDate = false;

    return matchesSearch && matchesDate;
  });

  const handleExportExcel = () => {
    const wb = XLSX.utils.book_new();

    // ─── Helper: apply style to a range of cells ───
    const styleRange = (ws, r1, c1, r2, c2, style) => {
      for (let r = r1; r <= r2; r++) {
        for (let c = c1; c <= c2; c++) {
          const addr = XLSX.utils.encode_cell({ r, c });
          if (!ws[addr]) ws[addr] = { t: 's', v: '' };
          ws[addr].s = style;
        }
      }
    };

    const boldCenter = { font: { bold: true }, alignment: { horizontal: 'center', vertical: 'center' } };
    const boldLeft   = { font: { bold: true }, alignment: { horizontal: 'left', vertical: 'center' } };
    const boldRight  = { font: { bold: true }, alignment: { horizontal: 'right', vertical: 'center' } };
    const numFmt     = { numFmt: '₹#,##0.00', alignment: { horizontal: 'right' } };
    const numFmtBold = { numFmt: '₹#,##0.00', font: { bold: true }, alignment: { horizontal: 'right' } };
    const hdrStyle   = { font: { bold: true, sz: 12, color: { rgb: 'FFFFFF' } }, fill: { fgColor: { rgb: '1E3A5F' } }, alignment: { horizontal: 'center', vertical: 'center' }, border: { bottom: { style: 'thin', color: { rgb: 'AAAAAA' } } } };
    const subHdrStyle= { font: { bold: true, sz: 10, color: { rgb: 'FFFFFF' } }, fill: { fgColor: { rgb: '2E5FA3' } }, alignment: { horizontal: 'center', vertical: 'center' }, border: { bottom: { style: 'thin', color: { rgb: '9999AA' } } } };
    const totalStyle = { font: { bold: true, color: { rgb: '006100' } }, fill: { fgColor: { rgb: 'C6EFCE' } }, alignment: { horizontal: 'right', vertical: 'center' } };
    const altRow1    = { fill: { fgColor: { rgb: 'F0F4FF' } }, alignment: { horizontal: 'center' } };
    const altRow2    = { fill: { fgColor: { rgb: 'FFFFFF' } }, alignment: { horizontal: 'center' } };

    // ════════════════════════════════════════════════
    // SHEET 1 — Full Bill Summary (one row per bill)
    // ════════════════════════════════════════════════
    const summaryHeaders = [
      'Invoice No', 'Date', 'Customer Name', 'Phone', 'Customer GSTIN',
      'Customer State', 'Guest Name', 'Vehicle Number', 'Vendor Name',
      'Subtotal (Excl. GST) ₹', 'GST Amount ₹', 'CGST ₹', 'SGST ₹', 'IGST ₹',
      'Toll Fees ₹', 'Grand Total ₹', 'GST Enabled'
    ];

    const summaryRows = filteredBills.map(bill => {
      let subtotal = 0, gstAmt = 0, cgst = 0, sgst = 0, igst = 0;
      const billGstin = bill.customer_gstin || '';
      const stateCode = billGstin ? billGstin.substring(0, 2) : '27';
      const interState = stateCode !== '27';

      (bill.table_items || []).forEach(item => {
        const wo = parseFloat(item.amount_without_gst) || 0;
        const wi = parseFloat(item.amount_with_gst) || 0;
        const tax = wi - wo;
        subtotal += wo;
        gstAmt += tax;
        if (interState) { igst += tax; }
        else { cgst += tax / 2; sgst += tax / 2; }
      });

      return [
        bill.bill_no || bill.id?.substring(0, 6)?.toUpperCase() || '',
        bill.date || '',
        bill.customer_name || '',
        bill.phone_number || '',
        billGstin,
        stateCode,
        bill.guest_name || '',
        bill.vehicle_number || '',
        bill.vendor_name || '',
        subtotal,
        gstAmt,
        interState ? 0 : cgst,
        interState ? 0 : sgst,
        interState ? igst : 0,
        parseFloat(bill.toll_amount) || 0,
        parseFloat(bill.final_bill_amount) || 0,
        bill.gst_enabled ? 'Yes' : 'No'
      ];
    });

    // Totals row
    const sumRow = ['TOTAL', '', '', '', '', '', '', '', ''];
    const numCols = [9, 10, 11, 12, 13, 14, 15];
    numCols.forEach(ci => {
      sumRow.push(summaryRows.reduce((s, r) => s + (r[ci] || 0), 0));
    });
    sumRow.push('');

    const wsData1 = [summaryHeaders, ...summaryRows, sumRow];
    const ws1 = XLSX.utils.aoa_to_sheet(wsData1);

    // Styles for Summary sheet
    const nCol = summaryHeaders.length;
    for (let c = 0; c < nCol; c++) {
      const addr = XLSX.utils.encode_cell({ r: 0, c });
      if (!ws1[addr]) ws1[addr] = { t: 's', v: '' };
      ws1[addr].s = hdrStyle;
    }
    summaryRows.forEach((_, ri) => {
      const style = ri % 2 === 0 ? altRow1 : altRow2;
      for (let c = 0; c < nCol; c++) {
        const addr = XLSX.utils.encode_cell({ r: ri + 1, c });
        if (!ws1[addr]) ws1[addr] = { t: 'n', v: 0 };
        ws1[addr].s = [9,10,11,12,13,14,15].includes(c) ? { ...numFmt, fill: style.fill } : style;
      }
    });
    const totalRowIdx = wsData1.length - 1;
    for (let c = 0; c < nCol; c++) {
      const addr = XLSX.utils.encode_cell({ r: totalRowIdx, c });
      if (!ws1[addr]) ws1[addr] = { t: 's', v: '' };
      ws1[addr].s = [9,10,11,12,13,14,15].includes(c) ? { ...numFmtBold, fill: { fgColor: { rgb: 'C6EFCE' } }, font: { bold: true, color: { rgb: '006100' } } } : totalStyle;
    }

    ws1['!cols'] = [
      { wch: 12 }, { wch: 12 }, { wch: 28 }, { wch: 14 }, { wch: 20 },
      { wch: 14 }, { wch: 22 }, { wch: 16 }, { wch: 20 },
      { wch: 22 }, { wch: 14 }, { wch: 12 }, { wch: 12 }, { wch: 12 },
      { wch: 12 }, { wch: 14 }, { wch: 12 }
    ];
    XLSX.utils.book_append_sheet(wb, ws1, '📋 Bill Summary');

    // ════════════════════════════════════════════════
    // SHEET 2 — Per-Vehicle Line Items
    // ════════════════════════════════════════════════
    const lineHeaders = [
      'Invoice No', 'Customer Name', 'Date', 'Rental Package Plan', 'Plan Type',
      'Rate ₹', 'No. of Days', 'Journey Start Date', 'Journey End Date',
      'Total Distance (KM)', 'Extra KM', 'Extra KM Rate ₹',
      'Total Hours', 'Extra Hours', 'Extra Hrs Rate ₹',
      'DA Allowance ₹', 'Night Allowance ₹',
      'GST Rate %', 'Subtotal (Excl. GST) ₹', 'GST Amount ₹', 'Total ₹'
    ];

    const lineRows = [];
    filteredBills.forEach(bill => {
      const billNo = bill.bill_no || bill.id?.substring(0, 6)?.toUpperCase() || '';
      (bill.table_items || []).forEach(item => {
        const wo = parseFloat(item.amount_without_gst) || 0;
        const wi = parseFloat(item.amount_with_gst) || 0;
        lineRows.push([
          billNo,
          bill.customer_name || '',
          item.date || bill.date || '',
          item.plan_name || '',
          item.plan_type || '',
          parseFloat(item.rate) || 0,
          parseFloat(item.num_days) || 1,
          item.date || '',
          item.end_date || item.date || '',
          parseFloat(item.total_distance_km) || 0,
          parseFloat(item.extra_km) || 0,
          parseFloat(item.extra_km_rate) || 0,
          parseFloat(item.total_hours) || 0,
          parseFloat(item.extra_hours) || 0,
          parseFloat(item.extra_hours_rate) || 0,
          parseFloat(item.da_allowance) || 0,
          parseFloat(item.night_allowance) || 0,
          parseFloat(item.gst_rate) || 0,
          wo,
          wi - wo,
          wi
        ]);
      });
    });

    const ws2Data = [lineHeaders, ...lineRows];
    const ws2 = XLSX.utils.aoa_to_sheet(ws2Data);

    const nCol2 = lineHeaders.length;
    for (let c = 0; c < nCol2; c++) {
      const addr = XLSX.utils.encode_cell({ r: 0, c });
      if (!ws2[addr]) ws2[addr] = { t: 's', v: '' };
      ws2[addr].s = subHdrStyle;
    }
    lineRows.forEach((_, ri) => {
      const style = ri % 2 === 0 ? altRow1 : altRow2;
      const moneyCols = [5, 11, 14, 15, 16, 18, 19, 20];
      for (let c = 0; c < nCol2; c++) {
        const addr = XLSX.utils.encode_cell({ r: ri + 1, c });
        if (!ws2[addr]) ws2[addr] = { t: 'n', v: 0 };
        ws2[addr].s = moneyCols.includes(c)
          ? { ...numFmt, fill: style.fill }
          : { ...style, alignment: { horizontal: 'center' } };
      }
    });

    ws2['!cols'] = [
      { wch: 12 }, { wch: 26 }, { wch: 12 }, { wch: 30 }, { wch: 14 },
      { wch: 12 }, { wch: 12 }, { wch: 16 }, { wch: 16 },
      { wch: 18 }, { wch: 12 }, { wch: 14 },
      { wch: 14 }, { wch: 14 }, { wch: 16 },
      { wch: 16 }, { wch: 18 },
      { wch: 12 }, { wch: 22 }, { wch: 14 }, { wch: 14 }
    ];
    XLSX.utils.book_append_sheet(wb, ws2, '🚗 Vehicle Line Items');

    // ════════════════════════════════════════════════
    // SHEET 3 — GST Tax Summary
    // ════════════════════════════════════════════════
    const gstHeaders = [
      'Invoice No', 'Date', 'Customer Name', 'Customer GSTIN', 'State Code',
      'Tax Type', 'GST Rate %', 'Taxable Amount ₹',
      'CGST Rate %', 'CGST Amount ₹',
      'SGST Rate %', 'SGST Amount ₹',
      'IGST Rate %', 'IGST Amount ₹',
      'Total Tax ₹', 'Grand Total ₹'
    ];

    const gstRows = [];
    filteredBills.forEach(bill => {
      if (!bill.gst_enabled) return;
      const billNo = bill.bill_no || bill.id?.substring(0, 6)?.toUpperCase() || '';
      const billGstin = bill.customer_gstin || '';
      const stateCode = billGstin ? billGstin.substring(0, 2) : '27';
      const interState = stateCode !== '27';
      const taxMap = {};

      (bill.table_items || []).forEach(item => {
        const rate = parseFloat(item.gst_rate) || 0;
        if (!rate) return;
        const wo = parseFloat(item.amount_without_gst) || 0;
        const wi = parseFloat(item.amount_with_gst) || 0;
        const tax = wi - wo;
        if (!taxMap[rate]) taxMap[rate] = { taxable: 0, tax: 0 };
        taxMap[rate].taxable += wo;
        taxMap[rate].tax += tax;
      });

      Object.entries(taxMap).forEach(([rate, vals]) => {
        const r = parseFloat(rate);
        gstRows.push([
          billNo,
          bill.date || '',
          bill.customer_name || '',
          billGstin,
          stateCode,
          interState ? 'Inter-State (IGST)' : 'Intra-State (CGST+SGST)',
          r,
          vals.taxable,
          interState ? 0 : r / 2,
          interState ? 0 : vals.tax / 2,
          interState ? 0 : r / 2,
          interState ? 0 : vals.tax / 2,
          interState ? r : 0,
          interState ? vals.tax : 0,
          vals.tax,
          vals.taxable + vals.tax
        ]);
      });
    });

    const ws3Data = [gstHeaders, ...gstRows];
    const ws3 = XLSX.utils.aoa_to_sheet(ws3Data);

    const nCol3 = gstHeaders.length;
    for (let c = 0; c < nCol3; c++) {
      const addr = XLSX.utils.encode_cell({ r: 0, c });
      if (!ws3[addr]) ws3[addr] = { t: 's', v: '' };
      ws3[addr].s = { ...hdrStyle, fill: { fgColor: { rgb: '5B2A8A' } } };
    }
    gstRows.forEach((_, ri) => {
      const style = ri % 2 === 0 ? { fill: { fgColor: { rgb: 'F5F0FF' } } } : { fill: { fgColor: { rgb: 'FFFFFF' } } };
      const moneyCols = [7, 9, 11, 13, 14, 15];
      for (let c = 0; c < nCol3; c++) {
        const addr = XLSX.utils.encode_cell({ r: ri + 1, c });
        if (!ws3[addr]) ws3[addr] = { t: 'n', v: 0 };
        ws3[addr].s = moneyCols.includes(c)
          ? { ...numFmt, fill: style.fill }
          : { ...style, alignment: { horizontal: 'center' } };
      }
    });

    ws3['!cols'] = [
      { wch: 12 }, { wch: 12 }, { wch: 28 }, { wch: 22 }, { wch: 12 },
      { wch: 24 }, { wch: 12 }, { wch: 20 },
      { wch: 12 }, { wch: 16 },
      { wch: 12 }, { wch: 16 },
      { wch: 12 }, { wch: 16 },
      { wch: 16 }, { wch: 16 }
    ];
    XLSX.utils.book_append_sheet(wb, ws3, '🧾 GST Tax Summary');

    XLSX.writeFile(wb, `PurviTravels_Export_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  // Export a single bill as Excel
  const handleExportSingleBill = (bill) => {
    const wb = XLSX.utils.book_new();
    const hdrStyle = { font: { bold: true, sz: 11, color: { rgb: 'FFFFFF' } }, fill: { fgColor: { rgb: '1E3A5F' } }, alignment: { horizontal: 'center', vertical: 'center' } };
    const labelStyle = { font: { bold: true }, fill: { fgColor: { rgb: 'EEF2FF' } }, alignment: { horizontal: 'left' } };
    const valueStyle = { alignment: { horizontal: 'left' } };
    const numFmt    = { numFmt: '₹#,##0.00', alignment: { horizontal: 'right' } };
    const numBold   = { numFmt: '₹#,##0.00', font: { bold: true }, fill: { fgColor: { rgb: 'C6EFCE' } }, alignment: { horizontal: 'right' }, font2: { bold: true, color: { rgb: '006100' } } };
    const altRow1   = { fill: { fgColor: { rgb: 'F0F4FF' } }, alignment: { horizontal: 'center' } };
    const altRow2   = { fill: { fgColor: { rgb: 'FFFFFF' } }, alignment: { horizontal: 'center' } };

    const billGstin = bill.customer_gstin || '';
    const stateCode = billGstin ? billGstin.substring(0, 2) : '27';
    const interState = stateCode !== '27';

    // ─── Bill Info ───
    let subtotal = 0, gstAmt = 0;
    (bill.table_items || []).forEach(item => {
      subtotal += parseFloat(item.amount_without_gst) || 0;
      gstAmt   += (parseFloat(item.amount_with_gst) || 0) - (parseFloat(item.amount_without_gst) || 0);
    });

    const infoData = [
      [bizName.toUpperCase(), '', '', ''],
      ['Invoice No:', bill.bill_no || '', 'Date:', bill.date || ''],
      ['Customer:', bill.customer_name || '', 'Phone:', bill.phone_number || ''],
      ['Customer GSTIN:', billGstin, 'State Code:', stateCode],
      ['Guest Name:', bill.guest_name || '', 'Vehicle No:', bill.vehicle_number || ''],
      ['Tax Type:', interState ? 'Inter-State (IGST)' : 'Intra-State (CGST+SGST)', 'GST Enabled:', bill.gst_enabled ? 'Yes' : 'No'],
      ['', '', '', ''],
    ];

    // ─── Line items header + rows ───
    const lineHdr = [
      'Rental Package Plan', 'Plan Type', 'Start Date', 'End Date', 'Days',
      'Rate ₹', 'Distance KM', 'Extra KM', 'Total Hrs', 'Extra Hrs',
      'DA ₹', 'Night Allow. ₹', 'GST%', 'Subtotal ₹', 'GST Amt ₹', 'Total ₹'
    ];

    const lineData = (bill.table_items || []).map((item, i) => {
      const wo = parseFloat(item.amount_without_gst) || 0;
      const wi = parseFloat(item.amount_with_gst) || 0;
      return [
        item.plan_name || '',
        item.plan_type || '',
        item.date || '',
        item.end_date || item.date || '',
        parseFloat(item.num_days) || 1,
        parseFloat(item.rate) || 0,
        parseFloat(item.total_distance_km) || 0,
        parseFloat(item.extra_km) || 0,
        parseFloat(item.total_hours) || 0,
        parseFloat(item.extra_hours) || 0,
        parseFloat(item.da_allowance) || 0,
        parseFloat(item.night_allowance) || 0,
        parseFloat(item.gst_rate) || 0,
        wo,
        wi - wo,
        wi
      ];
    });

    const totalsRow = [
      'TOTAL', '', '', '', '',
      '',
      lineData.reduce((s, r) => s + r[6], 0),
      lineData.reduce((s, r) => s + r[7], 0),
      '', '',
      lineData.reduce((s, r) => s + r[10], 0),
      lineData.reduce((s, r) => s + r[11], 0),
      '',
      subtotal, gstAmt,
      subtotal + gstAmt
    ];

    const summaryData = [
      ['', '', '', ''],
      ['Subtotal (Excl. GST):', subtotal, 'Toll Fees:', parseFloat(bill.toll_amount) || 0],
      ['Total GST:', gstAmt, 'Grand Total:', parseFloat(bill.final_bill_amount) || 0],
    ];

    const fullData = [
      ...infoData,
      lineHdr,
      ...lineData,
      totalsRow,
      ...summaryData
    ];

    const ws = XLSX.utils.aoa_to_sheet(fullData);

    // Style company name row
    const compCell = ws['A1'];
    if (compCell) compCell.s = { font: { bold: true, sz: 16, color: { rgb: '0096FF' } }, alignment: { horizontal: 'left' } };

    // Style info rows (labels bold)
    for (let r = 1; r <= 5; r++) {
      ['A', 'C'].forEach(col => {
        const cell = ws[`${col}${r + 1}`];
        if (cell) cell.s = labelStyle;
      });
      ['B', 'D'].forEach(col => {
        const cell = ws[`${col}${r + 1}`];
        if (cell) cell.s = valueStyle;
      });
    }

    // Style line header row
    const lineHdrRowIdx = infoData.length;
    for (let c = 0; c < lineHdr.length; c++) {
      const addr = XLSX.utils.encode_cell({ r: lineHdrRowIdx, c });
      if (!ws[addr]) ws[addr] = { t: 's', v: '' };
      ws[addr].s = hdrStyle;
    }

    // Style data rows
    lineData.forEach((_, ri) => {
      const style = ri % 2 === 0 ? altRow1 : altRow2;
      const moneyCols = [5, 10, 11, 13, 14, 15];
      for (let c = 0; c < lineHdr.length; c++) {
        const addr = XLSX.utils.encode_cell({ r: lineHdrRowIdx + 1 + ri, c });
        if (!ws[addr]) ws[addr] = { t: 'n', v: 0 };
        ws[addr].s = moneyCols.includes(c) ? { ...numFmt, fill: style.fill } : style;
      }
    });

    // Style totals row
    const totalsRowIdx = lineHdrRowIdx + 1 + lineData.length;
    for (let c = 0; c < lineHdr.length; c++) {
      const addr = XLSX.utils.encode_cell({ r: totalsRowIdx, c });
      if (!ws[addr]) ws[addr] = { t: 's', v: '' };
      const moneyCols = [6, 7, 10, 11, 13, 14, 15];
      ws[addr].s = moneyCols.includes(c)
        ? { numFmt: '₹#,##0.00', font: { bold: true, color: { rgb: '006100' } }, fill: { fgColor: { rgb: 'C6EFCE' } }, alignment: { horizontal: 'right' } }
        : { font: { bold: true, color: { rgb: '006100' } }, fill: { fgColor: { rgb: 'C6EFCE' } }, alignment: { horizontal: 'center' } };
    }

    ws['!cols'] = [
      { wch: 30 }, { wch: 14 }, { wch: 12 }, { wch: 12 }, { wch: 8 },
      { wch: 12 }, { wch: 14 }, { wch: 10 }, { wch: 10 }, { wch: 10 },
      { wch: 12 }, { wch: 16 }, { wch: 8 }, { wch: 16 }, { wch: 14 }, { wch: 14 }
    ];

    XLSX.utils.book_append_sheet(wb, ws, 'Invoice');
    XLSX.writeFile(wb, `Invoice_${bill.bill_no || bill.id?.substring(0, 6)}_${bill.date || 'export'}.xlsx`);
  };

  return (
    <div className="space-y-6">

      {/* List View */}
      <div className="space-y-6 no-print">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center bg-gradient-to-r from-slate-900 to-indigo-950 p-6 rounded-2xl border border-indigo-500/20 shadow-xl gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-50 tracking-tight">Invoice Ledger Records</h1>
            <p className="text-indigo-200 mt-1 text-sm font-medium">Browse generated bills, view print formats, and manage logs</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <button
              onClick={handleExportExcel}
              className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 px-4 rounded-xl shadow-lg transition duration-150 w-full sm:w-auto"
            >
              <Download className="h-4 w-4" /> Export Excel
            </button>
            <button
              onClick={() => navigateTo('generate-bill')}
              className="page-add-btn flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2.5 px-4 rounded-xl shadow-lg transition duration-150 w-full sm:w-auto"
            >
              <Plus className="h-4 w-4" /> Generate Bill
            </button>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-4 items-center bg-slate-900/50 p-4 rounded-xl border border-slate-700/50">
          <div className="flex flex-1 gap-4 items-center w-full glass-panel p-3 rounded-lg border border-slate-700/50">
            <Search className="h-5 w-5 text-slate-400 shrink-0" />
            <input
              type="text"
              placeholder="Search bills by customer, vehicle number, or guest name..."
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
                className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-3 pr-8 py-2 text-sm text-slate-100 outline-none focus:border-indigo-500 cursor-pointer"
              />
            </div>
            <div className="w-full md:w-40 relative">
              <CustomDatePicker
                value={endDate}
                onChange={setEndDate}
                placeholder="End Date"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-3 pr-8 py-2 text-sm text-slate-100 outline-none focus:border-indigo-500 cursor-pointer"
              />
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
          </div>
        ) : error ? (
          <div className="bg-rose-500/15 border border-rose-500/20 text-rose-400 p-4 rounded-xl">
            {error}
          </div>
        ) : (
          <div className="glass-panel rounded-2xl border border-slate-700/50 overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-700 bg-table-header text-slate-400 text-xs font-semibold uppercase tracking-wider">
                    <th className="p-4">Date</th>
                    <th className="p-4">Customer Name</th>
                    <th className="p-4">Vehicle Details</th>
                    <th className="p-4">Guest/Passenger</th>
                    <th className="p-4 text-right">Invoice Total</th>
                    <th className="p-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-sm text-slate-300">
                  {filteredBills.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="p-6 text-center text-slate-500">No invoices logged.</td>
                    </tr>
                  ) : (
                    filteredBills.map((bill) => (
                      <tr key={bill.id} className="hover:bg-slate-800/20 transition">
                        <td className="p-4 font-medium">{bill.date}</td>
                        <td className="p-4 font-semibold text-slate-50">
                          <div className="flex flex-col">
                            <span>{bill.customer_name}</span>
                            <span className="text-xs text-slate-400 font-normal">Phone: {bill.phone_number}</span>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex flex-col">
                            <span className="font-mono text-slate-50 text-xs">{bill.vehicle_number}</span>
                            <span className="text-xs text-slate-400">{bill.vendor_name}</span>
                          </div>
                        </td>
                        <td className="p-4 text-slate-400">{bill.guest_name || 'N/A'}</td>
                        <td className="p-4 text-right font-bold text-indigo-300">₹{bill.final_bill_amount.toLocaleString()}</td>
                        <td className="p-4 text-center">
                          <div className="flex justify-center gap-2">
                            <button
                              onClick={() => setSelectedBill(bill)}
                              className="list-action-btn p-2 text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition"
                              title="View Invoice"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleExportSingleBill(bill)}
                              className="list-action-btn p-2 text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition"
                              title="Download Excel for this Bill"
                            >
                              <Download className="h-4 w-4" />
                            </button>
                            {(() => {
                              const isActionDisabled = bill.status === 'Paid' || bill.status === 'Partial' || (bill.paid_amount || 0) > 0;
                              return (
                                <>
                                  <button
                                    onClick={() => {
                                      setEditingBillId(bill.id);
                                      navigateTo('generate-bill');
                                    }}
                                    disabled={isActionDisabled}
                                    className={`list-action-btn p-2 rounded-lg transition ${isActionDisabled ? 'opacity-20 cursor-not-allowed text-slate-500' : 'text-amber-400 hover:bg-amber-500/10'}`}
                                    title={isActionDisabled ? "Edit Disabled (Payment Recorded)" : "Edit Record"}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </button>
                                  <button
                                    onClick={() => handleDelete(bill.id)}
                                    disabled={isActionDisabled}
                                    className={`list-action-btn p-2 rounded-lg transition ${isActionDisabled ? 'opacity-20 cursor-not-allowed text-slate-500' : 'text-rose-400 hover:bg-rose-500/10'}`}
                                    title={isActionDisabled ? "Delete Disabled (Payment Recorded)" : "Delete Record"}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </>
                              );
                            })()}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* DETAILED PRINT INVOICE MODAL */}
      {selectedBill && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="modal-content relative w-full max-w-4xl bg-slate-900 rounded-2xl border border-slate-700 shadow-2xl overflow-hidden flex flex-col my-8 max-h-[90vh]">

            {/* Header */}
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-800 bg-slate-950/80">
              <h2 className="text-lg font-bold text-slate-100 uppercase tracking-wider">Invoice Details</h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrint}
                  className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold rounded-lg transition"
                >
                  <Printer className="h-4 w-4" /> Print / PDF
                </button>
                <button
                  onClick={() => setSelectedBill(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-200 bg-slate-800 rounded-lg hover:bg-slate-700 transition"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="p-4 overflow-y-auto flex-1 bg-slate-950/50">
              <div id="invoice-print-area" className="bg-white text-slate-900 p-6 md:p-8 rounded-xl text-left print-border min-h-[11in] flex flex-col justify-between">

                <div>


                  {/* Top Company Header Box */}
                  <div className="border border-slate-700 text-xs text-slate-800">
                    {/* Row 1: Company Title + Logo */}
                    <div className="py-2.5 px-4 border-b border-slate-700 text-center bg-slate-50 flex items-center justify-between min-h-[100px]">
                      <div className="w-40 flex justify-start shrink-0">
                        {bizLogo && (
                          <img src={bizLogo} alt="Logo" className="h-20 w-auto max-w-[160px] object-contain rounded" />
                        )}
                      </div>
                      <div className="flex-1 px-4">
                        <h1 className="text-2xl font-black tracking-tight leading-none" style={{ color: '#0096FF' }}>{bizName.toUpperCase()}</h1>
                        {bizAddress && <p className="text-[11px] mt-1 font-bold text-slate-600">{bizAddress}</p>}
                      </div>
                      <div className="w-40 shrink-0"></div>
                    </div>
                    {/* Row 2: Contact Info */}
                    <div className="grid grid-cols-3 border-b border-slate-700 divide-x divide-slate-700">
                      <div className="p-1.5 px-2.5">
                        <span className="font-bold text-slate-500">Phone:</span> <span className="font-bold text-slate-900">{bizPhone || '—'}</span>
                      </div>
                      <div className="p-1.5 px-2.5">
                        <span className="font-bold text-slate-500">Email:</span> <span className="font-bold text-slate-900">{bizEmail || '—'}</span>
                      </div>
                      <div className="p-1.5 px-2.5">
                        <span className="font-bold text-slate-500">SAC Code:</span> <span className="font-bold text-slate-900">{bizSac}</span>
                      </div>
                    </div>
                    {/* Row 3: GSTIN & State */}
                    <div className="grid grid-cols-2 divide-x divide-slate-700">
                      <div className="p-1.5 px-2.5">
                        <span className="font-bold text-slate-500">GSTIN:</span> <span className="font-bold text-slate-900">{bizGstin || '—'}</span>
                      </div>
                      <div className="p-1.5 px-2.5">
                        <span className="font-bold text-slate-500">State:</span> <span className="font-bold text-slate-900">{bizState}</span>
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
                      <div className="p-1.5 space-y-1 flex-1">
                        <h3 className="text-sm font-black text-slate-900 uppercase">{selectedBill.customer_name}</h3>
                        {customerDetails?.billing_address ? (
                          <p className="text-slate-600 font-bold leading-tight">{customerDetails.billing_address}</p>
                        ) : (
                          <p className="text-slate-400 italic font-medium">No address provided</p>
                        )}
                        <div className="pt-1 space-y-1">
                          <p>
                            <span className="font-bold text-slate-500">Contact No:</span>{" "}
                            <span className="font-bold text-slate-900">{selectedBill.phone_number || customerDetails?.phone || '—'}</span>
                          </p>
                          <p>
                            <span className="font-bold text-slate-500">GSTIN:</span>{" "}
                            <span className="font-bold text-slate-900">{customerDetails?.gstin || '—'}</span>
                          </p>
                          <p>
                            <span className="font-bold text-slate-500">State:</span>{" "}
                            <span className="font-bold text-slate-900">{placeOfSupply}</span>
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Invoice Details Column */}
                    <div className="col-span-4 flex flex-col justify-between">
                      <div className="bg-slate-50 border-b border-slate-700 px-2.5 py-1 font-bold text-slate-600 text-[10px] uppercase">
                        Invoice Details:
                      </div>
                      <div className="p-1.5 space-y-1.5 flex-1">
                        <p>
                          <span className="font-bold text-slate-500">Invoice No.:</span>{" "}
                          <span className="font-bold text-slate-900">{selectedBill.bill_no || selectedBill.id.substring(0, 6).toUpperCase()}</span>
                        </p>
                        <p>
                          <span className="font-bold text-slate-500">Date:</span>{" "}
                          <span className="font-bold text-slate-900">{formatDate(selectedBill.date)}</span>
                        </p>
                        <p>
                          <span className="font-bold text-slate-500">Place Of Supply:</span>{" "}
                          <span className="font-bold text-slate-900">{placeOfSupply}</span>
                        </p>
                      </div>
                    </div>

                    {/* Guest Name Column */}
                    <div className="col-span-3 flex flex-col justify-between">
                      <div className="bg-slate-50 border-b border-slate-700 px-2.5 py-1 font-bold text-slate-600 text-[10px] uppercase">
                        Guest & Vehicle:
                      </div>
                      <div className="p-1.5 space-y-1.5 flex-1">
                        <div>
                          <p className="font-bold text-slate-500 text-[10px]">Guest name:</p>
                          <p className="text-xs font-black text-slate-900 uppercase">
                            {selectedBill.guest_name || '—'}
                          </p>
                        </div>
                        <div className="pt-1.5 border-t border-slate-200 mt-1.5">
                          <p className="font-bold text-slate-500 text-[10px]">Vehicle No:</p>
                          <p className="text-xs font-black text-slate-900 uppercase">
                            {selectedBill.vehicle_number || '—'}
                          </p>
                        </div>
                      </div>
                    </div>

                  </div>

                  <div className="mb-2"></div>

                  {/* Table Ledger items */}
                  <div className="mt-4 overflow-x-auto">
                    <table className="w-full text-left text-[11px] border-collapse border border-slate-400">
                      <colgroup>
                        <col style={{ width: '25%' }} />
                        <col style={{ width: '8%' }} />
                        <col />
                        <col style={{ width: '9%' }} />
                        <col style={{ width: '8%' }} />
                        <col style={{ width: '8%' }} />
                        {hasExtraHours && <col style={{ width: '8%' }} />}
                        <col style={{ width: '7%' }} />
                        {hasNightAllowance && <col style={{ width: '11%' }} />}
                        <col />
                      </colgroup>
                      <thead>
                        <tr className="border-b border-slate-300 text-slate-700 bg-slate-50 uppercase text-[9px] tracking-wider">
                          <th className="p-1.5 font-bold border border-slate-400">Rental Package Plan</th>
                          <th className="p-1.5 font-bold text-center border border-slate-400">Rate</th>
                          <th className="p-1.5 font-bold text-center border border-slate-400">Date</th>
                          <th className="p-1.5 font-bold text-center border border-slate-400">Total Distance</th>
                          <th className="p-1.5 font-bold text-center border border-slate-400">Extra KMs</th>
                          <th className="p-1.5 font-bold text-center border border-slate-400">Total Hours</th>
                          {hasExtraHours && <th className="p-1.5 font-bold text-center border border-slate-400">Extra Hours</th>}
                          <th className="p-1.5 font-bold text-center border border-slate-400">DA</th>
                          {hasNightAllowance && <th className="p-1.5 font-bold text-center border border-slate-400">Night Allowance</th>}
                          <th className="p-1.5 font-bold text-right border border-slate-400">Sub Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {(selectedBill.table_items || []).map((item, idx) => (
                          <tr key={idx} className="hover:bg-slate-50 transition">
                            <td className="p-1.5 font-semibold text-slate-900 text-[9px] leading-tight border border-slate-400 break-words">{item.plan_name}</td>
                            <td className="p-1.5 text-center font-semibold text-slate-900 whitespace-nowrap border border-slate-400">₹{(item.rate || 0).toLocaleString('en-IN')}</td>
                            <td className="p-1.5 text-center text-slate-600 whitespace-nowrap border border-slate-400">
                              {item.end_date
                                ? `${formatDate(item.date)} to ${formatDate(item.end_date)}`
                                : formatDate(item.date)}
                            </td>
                            <td className="p-1.5 text-center font-medium whitespace-nowrap border border-slate-400">{item.total_distance_km} KM</td>
                            <td className="p-1.5 text-center text-slate-600 whitespace-nowrap border border-slate-400">{item.extra_km > 0 ? `${item.extra_km} KM` : '-'}</td>
                            <td className="p-1.5 text-center font-medium whitespace-nowrap border border-slate-400">{item.total_hours} Hrs</td>
                            {hasExtraHours && <td className="p-1.5 text-center text-slate-600 whitespace-nowrap border border-slate-400">{item.extra_hours > 0 ? `${item.extra_hours} Hrs` : '-'}</td>}
                            <td className="p-1.5 text-center font-medium text-slate-600 whitespace-nowrap border border-slate-400">{item.da_allowance > 0 ? `₹${item.da_allowance.toLocaleString('en-IN')}` : '-'}</td>
                            {hasNightAllowance && <td className="p-1.5 text-center font-medium text-slate-600 whitespace-nowrap border border-slate-400">{item.night_allowance > 0 ? `₹${item.night_allowance.toLocaleString('en-IN')}` : '-'}</td>}
                            <td className="p-1.5 text-right font-bold text-slate-900 whitespace-nowrap border border-slate-400">₹{item.amount_without_gst.toLocaleString('en-IN')}</td>
                          </tr>
                        ))}
                        {selectedBill.table_items && selectedBill.table_items.length > 1 && (() => {
                          const items = selectedBill.table_items;
                          const totalDistance = items.reduce((sum, item) => sum + (parseFloat(item.total_distance_km) || 0), 0);
                          const totalExtraKm = items.reduce((sum, item) => sum + (parseFloat(item.extra_km) || 0), 0);
                          const totalHours = items.reduce((sum, item) => sum + (parseFloat(item.total_hours) || 0), 0);
                          const totalExtraHours = items.reduce((sum, item) => sum + (parseFloat(item.extra_hours) || 0), 0);
                          const totalDA = items.reduce((sum, item) => sum + (parseFloat(item.da_allowance) || 0), 0);
                          const totalNight = items.reduce((sum, item) => sum + (parseFloat(item.night_allowance) || 0), 0);
                          const totalSubtotal = items.reduce((sum, item) => sum + (parseFloat(item.amount_without_gst) || 0), 0);
                          return (
                            <tr className="bg-slate-50 font-bold border-t border-slate-400 text-slate-900">
                              <td className="p-1.5 text-left border border-slate-400 whitespace-nowrap uppercase tracking-wider">Total</td>
                              <td className="p-1.5 text-center border border-slate-400"></td>
                              <td className="p-1.5 text-center border border-slate-400"></td>
                              <td className="p-1.5 text-center border border-slate-400 whitespace-nowrap">{totalDistance} KM</td>
                              <td className="p-1.5 text-center border border-slate-400 whitespace-nowrap">{totalExtraKm > 0 ? `${totalExtraKm} KM` : '-'}</td>
                              <td className="p-1.5 text-center border border-slate-400 whitespace-nowrap">{totalHours} Hrs</td>
                              {hasExtraHours && <td className="p-1.5 text-center border border-slate-400 whitespace-nowrap">{totalExtraHours > 0 ? `${totalExtraHours} Hrs` : '-'}</td>}
                              <td className="p-1.5 text-center border border-slate-400 whitespace-nowrap">{totalDA > 0 ? `₹${totalDA.toLocaleString('en-IN')}` : '-'}</td>
                              {hasNightAllowance && <td className="p-1.5 text-center border border-slate-400 whitespace-nowrap">{totalNight > 0 ? `₹${totalNight.toLocaleString('en-IN')}` : '-'}</td>}
                              <td className="p-1.5 text-right border border-slate-400 whitespace-nowrap font-black">₹{totalSubtotal.toLocaleString('en-IN')}</td>
                            </tr>
                          );
                        })()}
                      </tbody>
                    </table>
                  </div>
                  {/* Bottom section with Tax Summary on left, Totals on right */}
                  <div className="mt-4 grid grid-cols-12 gap-6 items-start">

                    {/* Left: Tax Summary (only shown if GST enabled) */}
                    <div className="col-span-7">
                      {selectedBill.gst_enabled && getTaxSummary().length > 0 && (
                        <div className="space-y-1">
                          <div className="bg-slate-50 px-2 py-1 border border-slate-400 font-bold text-slate-800 text-[9px] uppercase">
                            Tax Summary ({getTaxSummary().map(r => `${isInterState ? r.igstRate : (r.cgstRate + r.sgstRate)}% GST`).join(', ')}):
                          </div>
                          <table className="w-full text-center text-[9px] border-x border-b border-slate-400 border-collapse table-fixed">
                            <colgroup>
                              <col style={{ width: '40%' }} />
                              {isInterState ? (
                                <>
                                  <col style={{ width: '20%' }} />
                                  <col style={{ width: '20%' }} />
                                </>
                              ) : (
                                <>
                                  <col style={{ width: '15%' }} />
                                  <col style={{ width: '15%' }} />
                                  <col style={{ width: '15%' }} />
                                  <col style={{ width: '15%' }} />
                                </>
                              )}
                              <col style={{ width: '20%' }} />
                            </colgroup>
                            <thead>
                              <tr className="border-b border-slate-400 bg-slate-50 text-slate-800 uppercase font-bold text-[8px]">
                                <th rowSpan="2" className="border-r border-slate-400 p-1 text-center align-middle">Taxable (₹)</th>
                                {isInterState ? (
                                  <th colSpan="2" className="border-r border-slate-400 border-b border-slate-400 p-0.5 text-center font-bold">IGST</th>
                                ) : (
                                  <>
                                    <th colSpan="2" className="border-r border-slate-400 border-b border-slate-400 p-0.5 text-center font-bold">CGST</th>
                                    <th colSpan="2" className="border-r border-slate-400 border-b border-slate-400 p-0.5 text-center font-bold">SGST</th>
                                  </>
                                )}
                                <th rowSpan="2" className="p-1 text-center align-middle">Tax (₹)</th>
                              </tr>
                              <tr className="border-b border-slate-400 bg-slate-50 text-slate-800 uppercase font-bold text-[7px]">
                                {isInterState ? (
                                  <>
                                    <th className="border-r border-slate-400 p-0.5 text-center">Rate</th>
                                    <th className="border-r border-slate-400 p-0.5 text-center">Amt</th>
                                  </>
                                ) : (
                                  <>
                                    <th className="border-r border-slate-400 p-0.5 text-center">Rate</th>
                                    <th className="border-r border-slate-400 p-0.5 text-center">Amt</th>
                                    <th className="border-r border-slate-400 p-0.5 text-center">Rate</th>
                                    <th className="border-r border-slate-400 p-0.5 text-center">Amt</th>
                                  </>
                                )}
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                              {getTaxSummary().map((row, idx) => (
                                <tr key={idx} className="text-slate-700 font-medium">
                                  <td className="border-r border-slate-400 p-1 text-center font-mono">₹{row.taxableAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                  {isInterState ? (
                                    <>
                                      <td className="border-r border-slate-400 p-1 text-center font-mono">{row.igstRate}%</td>
                                      <td className="border-r border-slate-400 p-1 text-center font-mono">₹{row.igstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                    </>
                                  ) : (
                                    <>
                                      <td className="border-r border-slate-400 p-1 text-center font-mono">{row.cgstRate}%</td>
                                      <td className="border-r border-slate-400 p-1 text-center font-mono">₹{row.cgstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                      <td className="border-r border-slate-400 p-1 text-center font-mono">{row.sgstRate}%</td>
                                      <td className="border-r border-slate-400 p-1 text-center font-mono">₹{row.sgstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                    </>
                                  )}
                                  <td className="p-1 text-center font-mono font-bold text-slate-900">₹{row.totalTax.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                </tr>
                              ))}
                              {/* Totals Row */}
                              <tr className="bg-slate-50 border-t border-slate-400 text-slate-900 font-black">
                                <td className="border-r border-slate-400 p-1 text-center font-mono">
                                  TOTAL: ₹{getTaxSummary().reduce((sum, r) => sum + r.taxableAmount, 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </td>
                                {isInterState ? (
                                  <>
                                    <td className="border-r border-slate-400 p-1 bg-slate-100/30"></td>
                                    <td className="border-r border-slate-400 p-1 text-center font-mono">
                                      ₹{getTaxSummary().reduce((sum, r) => sum + r.igstAmount, 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </td>
                                  </>
                                ) : (
                                  <>
                                    <td className="border-r border-slate-400 p-1 bg-slate-100/30"></td>
                                    <td className="border-r border-slate-400 p-1 text-center font-mono">
                                      ₹{getTaxSummary().reduce((sum, r) => sum + r.cgstAmount, 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </td>
                                    <td className="border-r border-slate-400 p-1 bg-slate-100/30"></td>
                                    <td className="border-r border-slate-400 p-1 text-center font-mono">
                                      ₹{getTaxSummary().reduce((sum, r) => sum + r.sgstAmount, 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </td>
                                  </>
                                )}
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
                        {selectedBill.gst_enabled && printGstAmount > 0 && (
                          <div className="flex justify-between text-slate-600">
                            <span>GST ({(parseFloat((selectedBill.table_items || []).find(item => (parseFloat(item.gst_rate) || 0) > 0)?.gst_rate) || 12)}%):</span>
                            <span className="font-semibold font-mono">₹{printGstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                          </div>
                        )}
                        {selectedBill.toll_amount > 0 && (
                          <div className="flex justify-between text-slate-600">
                            <span>Toll Charges:</span>
                            <span className="font-semibold font-mono">₹{selectedBill.toll_amount.toLocaleString()}</span>
                          </div>
                        )}
                        {selectedBill.parking_amount > 0 && (
                          <div className="flex justify-between text-slate-600">
                            <span>Parking Charges:</span>
                            <span className="font-semibold font-mono">₹{selectedBill.parking_amount.toLocaleString()}</span>
                          </div>
                        )}
                        <div className="flex justify-between text-xl font-black text-slate-900 border-t border-slate-300 pt-1.5 bg-indigo-50/30 p-2 rounded-lg border border-indigo-100/50 mt-1">
                          <span className="text-indigo-800">Grand Total:</span>
                          <span className="text-indigo-900 font-mono">₹{selectedBill.final_bill_amount.toLocaleString('en-IN')}</span>
                        </div>
                        <div className="text-[10px] text-right font-bold text-indigo-700 italic pt-1">
                          {selectedBill.final_bill_words}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Terms and Signatures */}
                <div className="border-t border-slate-200 pt-6 mt-4 grid grid-cols-2 gap-8 text-[10px] text-slate-500">
                  <div>
                    <p className="font-bold text-slate-700 uppercase mb-2 text-[9px]">Terms & Conditions</p>
                    <ul className="list-disc pl-4 space-y-1">
                      <li>Time and kilometers will be calculated from office to office.</li>
                      <li>A minimum of 300 km will be charged for outstation trips.</li>
                      <li>Toll, parking, and permit charges are payable as per actuals.</li>
                      <li>A driver allowance will be payable for every outstation trip.</li>
                      <li>A driver allowance for local duty will be payable if the vehicle is used past midnight.</li>
                    </ul>
                  </div>
                  <div className="flex flex-col justify-end items-end h-full">
                    <div className="flex flex-col items-center">
                      <img src="/signature.png" alt="Signature" className="h-36 object-contain -mb-5 -mt-10 relative z-10 opacity-90" />
                      <div className="w-44 border-t border-slate-400 text-center pt-2 relative z-20">
                        <p className="font-bold text-slate-800 text-[10px]">Authorized Signature</p>
                        <p className="text-[8px] text-slate-400 mt-1">For {selectedBill.vendor_name || user?.business_name || 'OUR COMPANY'}</p>
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
