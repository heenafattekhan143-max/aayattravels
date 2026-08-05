import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  FileSpreadsheet,
  Users,
  MapPin,
  Car,
  Receipt,
  Plus,
  CheckCircle,
  AlertTriangle,
  Trash2,
  Calendar,
  Check,
  Search,
  Calculator,
  Sparkles,
  Edit
} from 'lucide-react';
import CustomDatePicker from '../components/CustomDatePicker';
import CustomSelect from '../components/CustomSelect';
import PortalDropdown from '../components/PortalDropdown';
import RowModal from '../components/RowModal';
import { convertNumberToWords } from '../utils/numberToWords';

export default function GenerateBill({ navigateTo, editingBillId, setEditingBillId, gstRates = [0, 5, 12, 18] }) {
  const vehicleWrapRef = React.useRef(null);
  // Metadata fields
  const [billType, setBillType] = useState('Sales');
  const [partyType, setPartyType] = useState('customer');
  const [gstEnabled, setGstEnabled] = useState(true);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [guestName, setGuestName] = useState('');

  // Reset purchase plan on type change
  useEffect(() => {
    setSelectedPurchasePlan(null);
    setPurchasePlanSearch('');
  }, [billType]);
  const [billDate, setBillDate] = useState(new Date().toISOString().split('T')[0]);

  // Vehicle details
  const [vendorName, setVendorName] = useState('');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [driverName, setDriverName] = useState('');
  const [source, setSource] = useState('');
  const [destination, setDestination] = useState('');
  const [travelDistance, setTravelDistance] = useState('');
  const [description, setDescription] = useState('');

  // Dropdown options loaded from API
  const [allCustomers, setAllCustomers] = useState([]);
  const [allPlans, setAllPlans] = useState([]);
  const [allVehicles, setAllVehicles] = useState([]);

  // Search dropdown states
  const [customerSearch, setCustomerSearch] = useState('');
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [vehicleSearch, setVehicleSearch] = useState('');
  const [showVehicleDropdown, setShowVehicleDropdown] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [showPlanDropdown, setShowPlanDropdown] = useState({}); // rowIdx -> bool

  // Modal State
  const [isRowModalOpen, setIsRowModalOpen] = useState(false);
  const [editingRowIndex, setEditingRowIndex] = useState(null);
  const [currentRowData, setCurrentRowData] = useState(null);

  // Purchase Plan (vendor plan) dropdown state
  const [purchasePlanSearch, setPurchasePlanSearch] = useState('');
  const [selectedPurchasePlan, setSelectedPurchasePlan] = useState(null);
  const [showPurchasePlanDropdown, setShowPurchasePlanDropdown] = useState(false);

  // Table items state
  const [tableItems, setTableItems] = useState([]);

  // Footpanel fields
  const [tollAmount, setTollAmount] = useState('');
  const [parkingAmount, setParkingAmount] = useState('');
  const [finalBillAmount, setFinalBillAmount] = useState(0);
  const [finalBillWords, setFinalBillWords] = useState('');

  const [errors, setErrors] = useState({});
  const [successMsg, setSuccessMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load plans & customers from backend
  useEffect(() => {
    async function loadData() {
      try {
        const [custRes, planRes, vehRes] = await Promise.all([
          axios.get('/api/customers'),
          axios.get('/api/plans'),
          axios.get('/api/vehicles')
        ]);
        setAllCustomers(Array.isArray(custRes.data) ? custRes.data : []);
        setAllPlans(Array.isArray(planRes.data) ? planRes.data : []);
        setAllVehicles(Array.isArray(vehRes.data) ? vehRes.data : []);
      } catch (err) {
        console.error("Error loading master data:", err);
      }
    }
    loadData();
  }, []);

  // Pre-load edit data once editingBillId and master master data is available
  useEffect(() => {
    if (!editingBillId || allPlans.length === 0 || allCustomers.length === 0) return;

    async function loadEditingBill() {
      try {
        const res = await axios.get(`/api/bills/${editingBillId}`);
        const bill = res.data;

        setBillType(bill.bill_type || 'Sales');
        setPartyType(bill.party_type);
        setGstEnabled(bill.gst_enabled);
        setGuestName(bill.guest_name || '');
        setBillDate(bill.date);
        setVendorName(bill.vendor_name);
        setVehicleNumber(bill.vehicle_number);
        setDriverName(bill.driver_name || '');
        setSource(bill.source || '');
        setDestination(bill.destination || '');
        setTravelDistance(bill.travel_distance || '');
        setDescription(bill.description || '');
        setVehicleSearch(bill.vehicle_number);
        setTollAmount(bill.toll_amount > 0 ? bill.toll_amount.toString() : '');
        setParkingAmount(bill.parking_amount > 0 ? bill.parking_amount.toString() : '');

        // Resolve customer selection details
        const matchedCust = allCustomers.find(c => c.id === bill.customer_id);
        if (matchedCust) {
          setSelectedCustomer(matchedCust);
          setCustomerSearch(matchedCust.name);
        } else {
          // Reconstruct fallback
          setSelectedCustomer({
            id: bill.customer_id,
            name: bill.customer_name,
            phone: bill.phone_number,
            entity_type: bill.party_type
          });
          setCustomerSearch(bill.customer_name);
        }

        // Map and resolve table item plan details
        const items = bill.table_items.map(item => {
          const matchedPlan = allPlans.find(p => p.id === item.plan_id);
          const applicableRate = matchedPlan 
            ? (selectedVehicle?.ownership_type === 'Vendor' 
                ? (matchedPlan.vendor_rate || matchedPlan.rate) 
                : (matchedPlan.company_rate || matchedPlan.rate))
            : 0;

          return {
            plan_id: item.plan_id,
            plan_name: item.plan_name,
            plan_type: matchedPlan ? matchedPlan.plan_type : '',
            vehicle_number: item.vehicle_number || '',
            date: item.date,
            end_date: item.end_date || '',
            total_distance_km: item.total_distance_km.toString(),
            extra_km: item.extra_km,
            total_hours: item.total_hours.toString(),
            extra_hours: item.extra_hours,
            da_allowance: item.da_allowance || '',
            night_allowance: item.night_allowance || '',
            amount_without_gst: item.amount_without_gst,
            gst_rate: item.gst_rate || 12,
            amount_with_gst: item.amount_with_gst,
            rate: item.rate ?? applicableRate,
            extra_km_rate: matchedPlan ? matchedPlan.extra_km_rate : 0,
            extra_hours_rate: matchedPlan ? matchedPlan.extra_hours_rate : 0,
            base_km: matchedPlan ? matchedPlan.base_km : 0,
            base_hours: matchedPlan ? matchedPlan.base_hours : 0
          };
        });

        setTableItems(items);

      } catch (err) {
        console.error("Error fetching editing invoice detail:", err);
        setErrors(prev => ({ ...prev, api: "Failed to load invoice edit data." }));
      }
    }

    loadEditingBill();
  }, [editingBillId, allPlans, allCustomers]);

  // Filter customers by selected party type and search term
  const filteredCustomers = allCustomers.filter(c =>
    c.entity_type === partyType &&
    c.name.toLowerCase().includes(customerSearch.toLowerCase())
  );

  // Auto-fill customer when partyType changes (or clear)
  useEffect(() => {
    // Only clear if we are NOT in initial edit mode loading
    if (!editingBillId) {
      setSelectedCustomer(null);
      setCustomerSearch('');
    }
  }, [partyType]);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest('.plan-dropdown-container')) {
        setShowPlanDropdown({});
      }
      if (!e.target.closest('.customer-dropdown-container')) {
        setShowCustomerDropdown(false);
      }
      if (!e.target.closest('.purchase-plan-dropdown-container')) {
        setShowPurchasePlanDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Recalculate whole bill dynamically when items, gst toggle, toll, or purchasePlan changes
  useEffect(() => {
    let itemsTotal = 0;

    const updatedItems = tableItems.map(item => {
      const totalDist = parseFloat(item.total_distance_km) || 0;
      const totalHrs = parseFloat(item.total_hours) || 0;

      const baseKm = parseFloat(item.base_km) || 0;
      const baseHrs = parseFloat(item.base_hours) || 0;
      const extraKmRate = parseFloat(item.extra_km_rate) || 0;
      const extraHrsRate = parseFloat(item.extra_hours_rate) || 0;
      const baseRate = parseFloat(item.rate) || 0;

      const hasRate = !!item.plan_id;

      // Determine number of days for outstation packages
      let numDays = 1;
      if (item.date && item.end_date && ((item.plan_name || '').toLowerCase().includes('outstation') || item.plan_type === 'Outstation')) {
        const start = new Date(item.date);
        const end = new Date(item.end_date);
        if (!isNaN(start) && !isNaN(end) && end >= start) {
          numDays = Math.round((end - start) / (1000 * 60 * 60 * 24)) + 1;
        }
      }

      // Extra calculations (calculate per day average, then multiply by days)
      let extraKm = 0;
      let extraHrs = 0;

      if (hasRate) {
        if (numDays > 1) {
          const avgDistPerDay = totalDist / numDays;
          extraKm = Math.max(0, avgDistPerDay - baseKm) * numDays;

          const avgHrsPerDay = totalHrs / numDays;
          extraHrs = Math.max(0, avgHrsPerDay - baseHrs) * numDays;
        } else {
          extraKm = Math.max(0, totalDist - baseKm);
          extraHrs = Math.max(0, totalHrs - baseHrs);
        }
      }
      const daAllowance = parseFloat(item.da_allowance) || 0;
      const nightAllowance = parseFloat(item.night_allowance) || 0;

      // Base Amount without GST
      const amountWithoutGst = hasRate
        ? (baseRate * numDays) + (extraKm * extraKmRate) + (extraHrs * extraHrsRate) + daAllowance + nightAllowance
        : 0;

      // Tax calculation
      const activeGstRate = gstEnabled ? (parseFloat(item.gst_rate) || 0) : 0;
      const amountWithGst = amountWithoutGst * (1 + activeGstRate / 100);

      itemsTotal += amountWithGst;

      return {
        ...item,
        num_days: numDays,
        extra_km: extraKm,
        extra_hours: extraHrs,
        amount_without_gst: Math.round(amountWithoutGst * 100) / 100,
        amount_with_gst: Math.round(amountWithGst * 100) / 100
      };
    });

    // Check if tableItems are structurally equal before updating to avoid infinite loop
    const hasChanges = JSON.stringify(tableItems) !== JSON.stringify(updatedItems);
    if (hasChanges) {
      setTableItems(updatedItems);
      return;
    }

    const toll = parseFloat(tollAmount) || 0;
    const parking = parseFloat(parkingAmount) || 0;
    const grandTotal = Math.round(itemsTotal + toll + parking);

    setFinalBillAmount(grandTotal);
    setFinalBillWords(convertNumberToWords(grandTotal));

  }, [tableItems, gstEnabled, tollAmount, parkingAmount, billType, selectedPurchasePlan]);

  const openRowModal = (index = null) => {
    if (index !== null) {
      setEditingRowIndex(index);
      setCurrentRowData(tableItems[index]);
    } else {
      setEditingRowIndex(null);
      setCurrentRowData({
        plan_id: '',
        plan_name: '',
        plan_type: '',
        date: new Date().toISOString().split('T')[0],
        total_distance_km: 0,
        extra_km: 0,
        total_hours: 0,
        extra_hours: 0,
        da_allowance: '',
        night_allowance: '',
        rate: 0,
        extra_km_rate: 0,
        extra_hours_rate: 0,
        base_km: 0,
        base_hours: 0,
        amount_without_gst: 0,
        gst_rate: 5,
        amount_with_gst: 0,
        vehicle_number: ''
      });
    }
    setIsRowModalOpen(true);
  };

  const saveRowModal = (data) => {
    if (editingRowIndex !== null) {
      setTableItems(prev => {
        const next = [...prev];
        next[editingRowIndex] = data;
        return next;
      });
    } else {
      setTableItems(prev => [...prev, data]);
    }
    setIsRowModalOpen(false);
    setEditingRowIndex(null);
    setCurrentRowData(null);
  };

  const removeRow = (index) => {
    setTableItems(prev => prev.filter((_, i) => i !== index));
  };

  // Inline edit helper — updates a field in a row and recalculates amounts
  const updateTableItemField = (idx, field, value) => {
    setTableItems(prev => {
      const next = [...prev];
      const row = { ...next[idx], [field]: value };
      const baseRate = parseFloat(row.rate) || 0;
      const extraKmR = parseFloat(row.extra_km_rate) || 0;
      const extraHrR = parseFloat(row.extra_hours_rate) || 0;
      const extraKm = parseFloat(row.extra_km) || 0;
      const extraHrs = parseFloat(row.extra_hours) || 0;
      const da = parseFloat(row.da_allowance) || 0;
      const night = parseFloat(row.night_allowance) || 0;
      const amtExcl = baseRate + extraKm * extraKmR + extraHrs * extraHrR + da + night;
      const gstR = parseFloat(row.gst_rate) || 5;
      const amtIncl = gstEnabled ? amtExcl + amtExcl * (gstR / 100) : amtExcl;
      row.amount_without_gst = amtExcl;
      row.amount_with_gst = amtIncl;
      next[idx] = row;
      return next;
    });
  };

  const handleSelectCustomer = (cust) => {
    setSelectedCustomer(cust);
    setCustomerSearch(cust.name);
    setShowCustomerDropdown(false);
  };

  const validateForm = () => {
    const tempErrors = {};
    if (!selectedCustomer) tempErrors.customer = "Please select a customer/vendor.";

    // In Purchase mode, vendor plan is required instead of row-level plan
    if (billType === 'Purchase' && !selectedPurchasePlan) {
      tempErrors.purchasePlan = "Please select a Vendor Plan for the Purchase bill.";
    }

    // Check table rows
    const rowErrors = [];
    tableItems.forEach((item, idx) => {
      if (!item.plan_id) {
        rowErrors.push(`Row ${idx + 1}: Select a Plan.`);
      }
      if (!item.total_distance_km || isNaN(item.total_distance_km)) {
        rowErrors.push(`Row ${idx + 1}: Total Distance must be a number.`);
      }
      if (!item.total_hours || isNaN(item.total_hours)) {
        rowErrors.push(`Row ${idx + 1}: Total Hours must be a number.`);
      }
    });

    if (rowErrors.length > 0) {
      tempErrors.table = rowErrors;
    }

    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    setSuccessMsg('');

    try {
      // --- BASE COMMON FIELDS ---
      const commonFields = {
        party_type: partyType,
        gst_enabled: gstEnabled,
        customer_id: selectedCustomer.id,
        customer_name: selectedCustomer.name,
        phone_number: selectedCustomer.phone,
        guest_name: guestName,
        date: billDate,
        vendor_name: vendorName,
        vehicle_number: vehicleNumber.toUpperCase(),
        driver_name: driverName,
        source: source,
        destination: destination,
        travel_distance: parseFloat(travelDistance) || tableItems.reduce((acc, item) => acc + (parseFloat(item.total_distance_km) || 0), 0),
        description: description,
        toll_amount: parseFloat(tollAmount) || 0,
        parking_amount: parseFloat(parkingAmount) || 0,
      };

      // --- SALE TABLE ITEMS (using row plan rates) ---
      const saleTableItems = tableItems.map(item => ({
        plan_id: item.plan_id,
        plan_name: item.plan_name,
        vehicle_number: item.vehicle_number || "",
        rate: parseFloat(item.rate) || 0,
        date: item.date,
        end_date: item.end_date,
        total_distance_km: parseFloat(item.total_distance_km),
        extra_km: item.extra_km,
        total_hours: parseFloat(item.total_hours),
        extra_hours: item.extra_hours,
        da_allowance: parseFloat(item.da_allowance) || 0,
        night_allowance: parseFloat(item.night_allowance) || 0,
        amount_without_gst: item.amount_without_gst,
        gst_rate: gstEnabled ? parseFloat(item.gst_rate) : 0,
        amount_with_gst: item.amount_with_gst
      }));

      const saleFinalAmount = Math.round(
        saleTableItems.reduce((s, i) => s + (i.amount_with_gst || 0), 0) +
        (parseFloat(tollAmount) || 0) +
        (parseFloat(parkingAmount) || 0)
      );

      if (editingBillId) {
        // Edit mode: update the existing single bill
        const payload = {
          bill_type: billType,
          ...commonFields,
          table_items: saleTableItems,
          final_bill_amount: finalBillAmount,
          final_bill_words: finalBillWords
        };
        await axios.put(`/api/bills/${editingBillId}`, payload);
        setSuccessMsg('Invoice updated successfully!');
        setEditingBillId(null);

      } else if (billType === 'Purchase' && selectedPurchasePlan) {
        // --- PURCHASE MODE: Create TWO bills ---

        // 1. SALES bill (for the customer in Part A)
        const salesPayload = {
          bill_type: 'Sales',
          ...commonFields,
          table_items: saleTableItems,
          final_bill_amount: saleFinalAmount,
          final_bill_words: convertNumberToWords(saleFinalAmount)
        };

        // 2. PURCHASE bill — recalculate amounts using vendor plan rates and customer's extra KM & hours
        const purchaseTableItems = tableItems.map(item => {
          const totalDist = parseFloat(item.total_distance_km) || 0;
          const totalHrs = parseFloat(item.total_hours) || 0;
          const extraKm = parseFloat(item.extra_km) || 0;
          const extraHrs = parseFloat(item.extra_hours) || 0;
          const da = parseFloat(item.da_allowance) || 0;
          const night = parseFloat(item.night_allowance) || 0;
          const extraKmRate = parseFloat(selectedPurchasePlan.extra_km_rate) || 0;
          const extraHrsRate = parseFloat(selectedPurchasePlan.extra_hours_rate) || 0;
          const baseRate = parseFloat(selectedPurchasePlan.rate) || 0;
          const numDays = item.num_days || 1;
          const amtWithout = (baseRate * numDays) + (extraKm * extraKmRate) + (extraHrs * extraHrsRate) + da + night;
          return {
            plan_id: selectedPurchasePlan.id,
            plan_name: selectedPurchasePlan.plan_name,
            vehicle_number: item.vehicle_number || "",
            rate: baseRate,
            date: item.date,
            end_date: item.end_date,
            total_distance_km: totalDist,
            extra_km: extraKm,
            total_hours: totalHrs,
            extra_hours: extraHrs,
            da_allowance: da,
            night_allowance: night,
            amount_without_gst: Math.round(amtWithout * 100) / 100,
            gst_rate: 0, // no GST on purchase
            amount_with_gst: Math.round(amtWithout * 100) / 100
          };
        });

        // Find vendor linked to vehicle for the purchase bill party
        const vehicleVendor = selectedVehicle
          ? allCustomers.find(c => c.entity_type === 'vendor' && c.name === selectedVehicle.owner_name)
          : null;

        const purchaseFinalAmount = Math.round(
          purchaseTableItems.reduce((s, i) => s + (i.amount_with_gst || 0), 0) +
          (parseFloat(tollAmount) || 0) +
          (parseFloat(parkingAmount) || 0)
        );

        const purchasePayload = {
          bill_type: 'Purchase',
          party_type: 'vendor',
          gst_enabled: false,
          customer_id: vehicleVendor ? vehicleVendor.id : selectedCustomer.id,
          customer_name: vehicleVendor ? vehicleVendor.name : vendorName,
          phone_number: vehicleVendor ? (vehicleVendor.phone || '') : (selectedCustomer.phone || ''),
          guest_name: guestName,
          date: billDate,
          vendor_name: vendorName,
          vehicle_number: vehicleNumber.toUpperCase(),
          driver_name: driverName,
          source: source,
          destination: destination,
          travel_distance: commonFields.travel_distance,
          table_items: purchaseTableItems,
          toll_amount: parseFloat(tollAmount) || 0,
          parking_amount: parseFloat(parkingAmount) || 0,
          final_bill_amount: purchaseFinalAmount,
          final_bill_words: convertNumberToWords(purchaseFinalAmount),
          profit: saleFinalAmount - purchaseFinalAmount
        };

        // POST both bills concurrently
        await Promise.all([
          axios.post('/api/bills', salesPayload),
          axios.post('/api/bills', purchasePayload)
        ]);

        setSuccessMsg(`✅ Two bills created — Sales: ₹${saleFinalAmount.toLocaleString()} | Purchase: ₹${purchaseFinalAmount.toLocaleString()}`);

      } else {
        // --- SALES ONLY ---
        const salesOnlyPayload = {
          bill_type: 'Sales',
          ...commonFields,
          table_items: saleTableItems,
          final_bill_amount: saleFinalAmount,
          final_bill_words: convertNumberToWords(saleFinalAmount)
        };
        await axios.post('/api/bills', salesOnlyPayload);
        setSuccessMsg('Bill generated and saved successfully!');
      }

      setTimeout(() => {
        navigateTo('bill-list');
      }, 2000);

    } catch (err) {
      console.error(err);
      let errMsg = 'An error occurred while saving invoice.';
      if (err.response?.data?.detail) {
        if (typeof err.response.data.detail === 'string') {
          errMsg = err.response.data.detail;
        } else if (Array.isArray(err.response.data.detail)) {
          errMsg = err.response.data.detail.map(d => `${d.loc ? d.loc.join('.') : 'Field'}: ${d.msg}`).join(', ');
        } else {
          errMsg = JSON.stringify(err.response.data.detail);
        }
      }
      setErrors(prev => ({ ...prev, api: errMsg }));
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">

      {successMsg && (
        <div className="flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 p-4 rounded-xl no-print">
          <Check className="h-5 w-5 shrink-0 animate-bounce" />
          <span className="font-semibold">{successMsg}</span>
        </div>
      )}

      {errors.api && (
        <div className="flex items-center gap-3 bg-rose-500/10 border border-rose-500/30 text-rose-400 p-4 rounded-xl no-print">
          <AlertTriangle className="h-5 w-5 shrink-0" />
          <span className="font-semibold">{errors.api}</span>
        </div>
      )}

      {errors.table && (
        <div className="bg-rose-500/10 border border-rose-500/30 text-rose-400 p-4 rounded-xl space-y-1 no-print text-sm font-semibold">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle className="h-4 w-4" />
            <span>Please resolve ledger table issues:</span>
          </div>
          <ul className="list-disc pl-6 font-medium text-xs">
            {errors.table.map((err, idx) => <li key={idx}>{err}</li>)}
          </ul>
        </div>
      )}

      {/* Main Billing Form */}
      <form onSubmit={handleSubmit} className="space-y-6 no-print">

        {/* PART A: Top Metadata Form */}
        <div className="relative z-50 glass-panel p-6 rounded-2xl border border-slate-700/50 shadow-lg space-y-6">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <Receipt className="h-5 w-5 text-indigo-400" />
            <h2 className="text-lg font-bold text-slate-50 uppercase tracking-wider text-sm">Part A: Customer & General Metadata</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

            {/* Bill Type Selector */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-300 block">Bill Type</label>
              <div className="flex gap-4 mt-2">
                <button
                  type="button"
                  onClick={() => setBillType('Sales')}
                  className={`flex-1 py-2 px-3 rounded-lg border text-sm font-bold transition ${billType === 'Sales'
                    ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-500/25'
                    : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-slate-200'
                    }`}
                >
                  Sales
                </button>
                <button
                  type="button"
                  onClick={() => setBillType('Purchase')}
                  className={`flex-1 py-2 px-3 rounded-lg border text-sm font-bold transition ${billType === 'Purchase'
                    ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-500/25'
                    : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-slate-200'
                    }`}
                >
                  Purchase
                </button>
              </div>
            </div>

            {/* Party Selector: always show both options */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-300 block">Party Type</label>
              <div className="flex gap-4 mt-2">
                <button
                  type="button"
                  onClick={() => setPartyType('customer')}
                  className={`flex-1 py-2 px-3 rounded-lg border text-sm font-bold transition ${partyType === 'customer'
                    ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-500/25'
                    : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-slate-200'
                    }`}
                >
                  Company
                </button>
                <button
                  type="button"
                  onClick={() => setPartyType('vendor')}
                  className={`flex-1 py-2 px-3 rounded-lg border text-sm font-bold transition ${partyType === 'vendor'
                    ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-500/25'
                    : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-slate-200'
                    }`}
                >
                  Vendor
                </button>
              </div>
            </div>

            {/* GST Switch */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-300 block">GST Toggle</label>
              <div className="flex items-center gap-3 mt-2 h-10">
                <button
                  type="button"
                  onClick={() => setGstEnabled(p => !p)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${gstEnabled ? 'bg-indigo-600' : 'bg-slate-700'
                    }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${gstEnabled ? 'translate-x-5' : 'translate-x-0'
                      }`}
                  />
                </button>
                <span className="text-sm font-bold text-slate-300">{gstEnabled ? 'ON (Applied)' : 'OFF (Excluded)'}</span>
              </div>
            </div>

            {/* Customer Dropdown Search */}
            <div className="space-y-2 relative customer-dropdown-container">
              <label className="text-sm font-semibold text-slate-300 block">
                Select {partyType === 'customer' ? 'Customer' : 'Vendor'} <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder={`Search or select ${partyType}...`}
                  value={customerSearch}
                  onFocus={() => setShowCustomerDropdown(true)}
                  onChange={(e) => {
                    setCustomerSearch(e.target.value);
                    if (selectedCustomer && e.target.value !== selectedCustomer.name) {
                      setSelectedCustomer(null);
                    }
                  }}
                  className={`w-full bg-slate-950/60 border ${errors.customer ? 'border-rose-500' : 'border-slate-700'
                    } rounded-xl px-4 py-2.5 text-sm text-slate-100 outline-none focus:border-indigo-500 transition`}
                />
                <Search className="absolute right-3 top-3 h-4 w-4 text-slate-400" />
              </div>

              {showCustomerDropdown && (
                <div className="absolute z-50 w-full mt-1 bg-[#0f172a] border border-slate-700 rounded-xl max-h-60 overflow-y-auto shadow-2xl divide-y divide-slate-800">
                  {filteredCustomers.length === 0 ? (
                    <div className="p-3 text-sm text-slate-500 text-center font-medium">No results found.</div>
                  ) : (
                    filteredCustomers.map(cust => (
                      <div
                        key={cust.id}
                        onClick={() => handleSelectCustomer(cust)}
                        className="p-3 text-sm text-slate-200 hover:bg-indigo-600/30 hover:text-white cursor-pointer transition flex justify-between items-center"
                      >
                        <span className="font-semibold">{cust.name}</span>
                        {selectedCustomer?.id === cust.id && <Check className="h-4 w-4 text-indigo-400" />}
                      </div>
                    ))
                  )}
                </div>
              )}
              {errors.customer && <p className="text-xs text-rose-400 mt-1 font-medium">{errors.customer}</p>}
            </div>

            {/* Phone Number (Read Only) */}
            <div className="space-y-1">
              <label className="text-sm font-semibold text-slate-400">Phone Number (Auto-filled)</label>
              <input
                type="text"
                readOnly
                placeholder="Select account to load phone"
                value={selectedCustomer ? selectedCustomer.phone : ''}
                className="w-full bg-slate-950/40 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-400 outline-none cursor-not-allowed font-semibold"
              />
            </div>

            {/* Guest Name */}
            <div className="space-y-1">
              <label className="text-sm font-semibold text-slate-300">Guest Name / Passenger</label>
              <input
                type="text"
                placeholder="e.g. Mr. Smith"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                className="w-full bg-slate-950/60 border border-slate-700 focus:border-indigo-500 outline-none rounded-xl px-4 py-2.5 text-sm text-slate-100 transition"
              />
            </div>

            {/* Select Date */}
            <div className="space-y-1">
              <label className="text-sm font-semibold text-slate-300 flex items-center gap-1">
                Select Date
              </label>
              <CustomDatePicker
                value={billDate}
                onChange={setBillDate}
                className="w-full bg-slate-950 border border-slate-700 focus:border-indigo-500 outline-none rounded-xl pl-4 pr-10 py-2.5 text-sm text-slate-100 transition cursor-pointer"
              />
            </div>

          </div>
        </div>

        <div className="relative z-40 glass-panel p-6 rounded-2xl border border-slate-700/50 shadow-lg space-y-6">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <Car className="h-5 w-5 text-indigo-400" />
            <h2 className="text-lg font-bold text-slate-50 uppercase tracking-wider text-sm">Part B: Vehicle Details</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Vehicle Number Search */}
            <div className="space-y-1 relative z-50" ref={vehicleWrapRef}>
              <label className="text-sm font-semibold text-slate-300">Vehicle Number</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search vehicle number..."
                  value={vehicleSearch}
                  onFocus={() => setShowVehicleDropdown(true)}
                  onBlur={() => setTimeout(() => setShowVehicleDropdown(false), 200)}
                  onChange={(e) => {
                    setVehicleSearch(e.target.value);
                    if (selectedVehicle && e.target.value !== selectedVehicle.vehicle_number) {
                      setSelectedVehicle(null);
                      setVehicleNumber('');
                      setVendorName('');
                      setDriverName('');
                      setSelectedPurchasePlan(null);
                      setPurchasePlanSearch('');
                    } else {
                      setVehicleNumber(e.target.value);
                    }
                    if (errors.vehicleNumber) setErrors(prev => ({ ...prev, vehicleNumber: '' }));
                  }}
                  className={`w-full bg-slate-950/60 border ${errors.vehicleNumber ? 'border-rose-500' : 'border-slate-700'
                    } focus:border-indigo-500 outline-none rounded-xl pl-4 pr-10 py-2.5 text-sm text-slate-100 transition`}
                />
                <Search className="absolute right-3 top-3 h-4 w-4 text-slate-400" />
              </div>

              <PortalDropdown
                isOpen={showVehicleDropdown}
                anchorRef={vehicleWrapRef}
                onClose={() => setShowVehicleDropdown(false)}
              >
                {allVehicles
                  .filter(v => {
                    const matchesSearch = (v.vehicle_number || '').toLowerCase().includes(vehicleSearch.toLowerCase());
                    const matchesType = billType === 'Purchase' ? v.ownership_type === 'Vendor' : true;
                    return matchesSearch && matchesType;
                  })
                  .length === 0 ? (
                  <div className="p-3 text-sm text-slate-500 text-center font-medium">
                    {billType === 'Purchase' ? 'No vendor vehicles found.' : 'No vehicles found.'}
                  </div>
                ) : (
                  allVehicles
                    .filter(v => {
                      const matchesSearch = (v.vehicle_number || '').toLowerCase().includes(vehicleSearch.toLowerCase());
                      const matchesType = billType === 'Purchase' ? v.ownership_type === 'Vendor' : true;
                      return matchesSearch && matchesType;
                    })
                    .map(veh => (
                      <div
                        key={veh.id}
                        onClick={() => {
                          setSelectedVehicle(veh);
                          setVehicleSearch(veh.vehicle_number);
                          setVehicleNumber(veh.vehicle_number);
                          setVendorName(veh.owner_name || 'Purvi Travels');
                          setDriverName(veh.driver_name || '');
                          setSelectedPurchasePlan(null);
                          setPurchasePlanSearch('');
                          setShowVehicleDropdown(false);
                          if (errors.vehicleNumber) setErrors(prev => ({ ...prev, vehicleNumber: '' }));
                          if (errors.vendorName) setErrors(prev => ({ ...prev, vendorName: '' }));
                        }}
                        className="p-3 text-sm text-slate-200 hover:bg-indigo-600/30 hover:text-white cursor-pointer transition flex flex-col"
                      >
                        <span className="font-semibold text-indigo-300">{veh.vehicle_number} <span className="text-slate-400 font-normal text-xs ml-2">({veh.model})</span></span>
                        <span className="text-xs text-slate-500 mt-0.5">{veh.ownership_type || 'Owner'}: {veh.owner_name || 'Purvi Travels'} • Driver: {veh.driver_name || 'N/A'}</span>
                      </div>
                    ))
                )}
              </PortalDropdown>
              {errors.vehicleNumber && <p className="text-xs text-rose-400 mt-1 font-medium">{errors.vehicleNumber}</p>}
            </div>
            {/* Vendor/Owner Name (Auto-filled from Vehicle) */}
            <div className="space-y-1">
              <label className="text-sm font-semibold text-slate-300">
                {selectedVehicle && selectedVehicle.ownership_type === 'Owner' ? 'Owner Name' : 'Vendor Name'}
              </label>
              <input
                type="text"
                readOnly
                placeholder="Auto-filled from vehicle"
                value={vendorName}
                className={`w-full bg-slate-950/40 border ${errors.vendorName ? 'border-rose-500' : 'border-slate-800'
                  } outline-none rounded-xl px-4 py-2.5 text-sm text-slate-400 font-semibold cursor-not-allowed`}
              />
              {errors.vendorName && <p className="text-xs text-rose-400 mt-1 font-medium">{errors.vendorName}</p>}
            </div>

            {/* Driver Name (Auto-filled from Vehicle) */}
            <div className="space-y-1">
              <label className="text-sm font-semibold text-slate-300">Driver Name</label>
              <input
                type="text"
                placeholder="Driver name (can be edited)"
                value={driverName}
                onChange={(e) => setDriverName(e.target.value)}
                className="w-full bg-slate-950/60 border border-slate-700 focus:border-indigo-500 outline-none rounded-xl px-4 py-2.5 text-sm text-slate-100 transition"
              />
            </div>

          </div>
        </div>

        {/* PURCHASE VENDOR PLAN SELECTOR — shown only when billType === Purchase, below Part B */}
        {billType === 'Purchase' && (() => {
          // Find vendor linked to the selected vehicle's owner
          const vehicleVendor = selectedVehicle
            ? allCustomers.find(c => c.entity_type === 'vendor' && c.name === selectedVehicle.owner_name)
            : null;
          const vendorFilteredPlans = allPlans.filter(p => {
            const matchesSearch = (p.plan_name || '').toLowerCase().includes(purchasePlanSearch.toLowerCase());
            // Show plans linked to this vehicle's vendor, OR global plans (no customer_id)
            const matchesVendor = vehicleVendor
              ? (p.customer_id === vehicleVendor.id || !p.customer_id)
              : !p.customer_id; // if no vehicle selected, show only global plans
            const matchesVehicleType = selectedVehicle
              ? p.vehicle_type === selectedVehicle.vehicle_type
              : true;
            return matchesSearch && matchesVendor && matchesVehicleType;
          });
          return (
            <div className="relative z-35 glass-panel p-6 rounded-2xl border border-amber-500/30 shadow-lg bg-amber-500/5">
              <div className="flex items-center gap-2 border-b border-amber-500/20 pb-3 mb-4">
                <Receipt className="h-5 w-5 text-amber-400" />
                <h2 className="text-sm font-bold text-amber-300 uppercase tracking-wider">Vendor Purchase Plan</h2>
                {vehicleVendor && (
                  <span className="ml-2 px-2 py-0.5 rounded bg-amber-500/15 text-amber-400 text-xs font-semibold border border-amber-500/25">
                    {vehicleVendor.name}
                  </span>
                )}
                <span className="ml-2 text-xs text-amber-500/60">
                  {vehicleVendor ? 'Showing plans for this vehicle\'s vendor' : 'Select a vehicle above to filter vendor plans'}
                </span>
              </div>

              <div className="relative purchase-plan-dropdown-container z-50">
                <label className="text-sm font-semibold text-slate-300 block mb-1.5">
                  Select Plan for Purchase (Vendor) Bill <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder={vehicleVendor ? `Search ${vehicleVendor.name}'s plans...` : 'Select a vehicle first...'}
                    disabled={!selectedVehicle}
                    value={selectedPurchasePlan ? selectedPurchasePlan.plan_name : purchasePlanSearch}
                    onFocus={() => setShowPurchasePlanDropdown(true)}
                    onChange={(e) => {
                      setPurchasePlanSearch(e.target.value);
                      if (selectedPurchasePlan) setSelectedPurchasePlan(null);
                      if (errors.purchasePlan) setErrors(prev => ({ ...prev, purchasePlan: '' }));
                    }}
                    className={`w-full bg-slate-950/60 border ${errors.purchasePlan ? 'border-rose-500' : 'border-amber-500/40'
                      } rounded-xl px-4 py-2.5 text-sm text-slate-100 outline-none focus:border-amber-400 transition ${!selectedVehicle ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                  />
                  <Search className="absolute right-3 top-3 h-4 w-4 text-amber-400/60" />
                </div>

                {showPurchasePlanDropdown && selectedVehicle && (
                  <div className="absolute z-50 w-full mt-1 bg-[#0f172a] border border-amber-500/30 rounded-xl max-h-60 overflow-y-auto shadow-[0_10px_40px_rgba(0,0,0,0.8)] divide-y divide-slate-800">
                    {vendorFilteredPlans.length === 0 ? (
                      <div className="p-4 text-sm text-slate-500 text-center">
                        {vehicleVendor ? `No plans found for ${vehicleVendor.name}.` : 'No vendor plans available.'}
                      </div>
                    ) : (
                      vendorFilteredPlans.map(plan => (
                        <div
                          key={plan.id}
                          onClick={() => {
                            setSelectedPurchasePlan(plan);
                            setPurchasePlanSearch(plan.plan_name);
                            setShowPurchasePlanDropdown(false);
                            if (errors.purchasePlan) setErrors(prev => ({ ...prev, purchasePlan: '' }));
                          }}
                          className="p-3 text-sm text-slate-200 hover:bg-amber-500/10 cursor-pointer transition flex justify-between items-center"
                        >
                          <div>
                            <span className="font-semibold text-amber-200">{plan.plan_name}</span>
                            <span className="text-xs text-slate-400 ml-2">({plan.plan_type})</span>
                          </div>
                          <div className="text-right text-xs text-slate-400 space-x-2">
                            <span className="text-amber-300 font-mono font-bold">₹{plan.rate}</span>
                            {plan.extra_km_rate > 0 && <span>+₹{plan.extra_km_rate}/km</span>}
                            {plan.extra_hours_rate > 0 && <span>+₹{plan.extra_hours_rate}/hr</span>}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
                {errors.purchasePlan && <p className="text-xs text-rose-400 mt-1 font-medium">{errors.purchasePlan}</p>}

                {/* Selected plan summary chips */}
                {selectedPurchasePlan && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className="px-3 py-1 rounded-lg bg-amber-500/10 border border-amber-500/25 text-amber-300 text-xs font-semibold">
                      Base Rate: ₹{selectedPurchasePlan.rate}
                    </span>
                    <span className="px-3 py-1 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 text-xs">
                      Base: {selectedPurchasePlan.base_km} km / {selectedPurchasePlan.base_hours} hr
                    </span>
                    <span className="px-3 py-1 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 text-xs">
                      Extra KM: ₹{selectedPurchasePlan.extra_km_rate}/km
                    </span>
                    <span className="px-3 py-1 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 text-xs">
                      Extra Hr: ₹{selectedPurchasePlan.extra_hours_rate}/hr
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })()}

        {/* Additional Description Row */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-700/50 shadow-lg space-y-3">
          <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Description / Notes (Optional)</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add any additional details or remarks for this bill..."
            rows="2"
            className="w-full bg-slate-950/60 border border-slate-700 focus:border-indigo-500 outline-none rounded-xl px-4 py-3 text-sm text-slate-100 transition resize-none"
          />
        </div>

        {/* PART C: Dynamic Billing Table (Matrix) */}
        <div className="relative z-30 glass-panel p-6 rounded-2xl border border-slate-700/50 shadow-lg space-y-4">
          <div className="flex justify-between items-center border-b border-slate-800 pb-3">
            <h2 className="text-lg font-bold text-slate-50 uppercase tracking-wider text-sm flex items-center gap-2">
              <Receipt className="h-5 w-5 text-indigo-400" />
              Part C: Dynamic Billing Ledger Matrix
            </h2>
            <button
              type="button"
              onClick={() => openRowModal(null)}
              className="flex items-center gap-1.5 bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 text-indigo-400 text-xs font-bold px-3 py-1.5 rounded-lg transition"
            >
              <Plus className="h-4.5 w-4.5" /> Add Entry Row
            </button>
          </div>

          {/* Mobile view: entry card list (stacked inputs) */}
          <div className="block md:hidden space-y-4">
            {tableItems.length === 0 ? (
              <div className="glass-panel p-8 rounded-xl border border-slate-700/40 bg-slate-950/20 text-center space-y-3">
                <p className="text-slate-400 text-sm">No billing entries yet.</p>
                <button
                  type="button"
                  onClick={() => openRowModal(null)}
                  className="text-indigo-400 text-sm font-bold hover:text-indigo-300 transition"
                >
                  + Add your first entry
                </button>
              </div>
            ) : (
              tableItems.map((item, idx) => {
                return (
                  <div key={idx} className="glass-panel p-4 rounded-xl border border-slate-700/40 bg-slate-950/20 space-y-3 relative">
                    <div className="flex justify-between items-center border-b border-slate-800/80 pb-2">
                      <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Ledger Entry #{idx + 1}</span>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => openRowModal(idx)}
                          className="text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10 p-1.5 rounded-lg transition"
                          title="Edit Row"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => removeRow(idx)}
                          className="text-rose-500 hover:bg-rose-500/10 p-1.5 rounded-lg transition"
                          title="Remove Row"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Plan</span>
                      <div className="text-sm font-bold text-slate-200">{item.plan_name || '—'}</div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Vehicle No.</span>
                        <div className="text-xs font-mono text-slate-300">{item.vehicle_number || '—'}</div>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Date</span>
                        <div className="text-xs text-slate-300">{item.date} {item.end_date ? `to ${item.end_date}` : ''}</div>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Dist / Extra</span>
                        <div className="text-xs text-slate-300">{item.total_distance_km}km / <span className="text-rose-400">{item.extra_km}km</span></div>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Hrs / Extra</span>
                        <div className="text-xs text-slate-300">{item.total_hours}h / <span className="text-rose-400">{item.extra_hours}h</span></div>
                      </div>
                    </div>

                    {/* GST settings & Calculations */}
                    <div className="border-t border-slate-800/80 pt-3 space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-bold text-slate-500 uppercase">Excl. GST:</span>
                        <span className="text-xs text-slate-300 font-bold font-mono">₹{(item.amount_without_gst || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                      </div>

                      <div className="flex justify-between items-start pt-1 border-t border-slate-900">
                        <div>
                          <span className="text-[10px] font-bold text-indigo-400 uppercase">Incl. GST ({item.gst_rate}%):</span>
                        </div>
                        <span className="text-xs text-indigo-400 font-extrabold font-mono">₹{(item.amount_with_gst || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Desktop view: overflow table (scrollable) */}
          <div className="hidden md:block overflow-x-auto pb-8">
            <table className="w-full text-left border-collapse min-w-[950px]">

              <thead>
                <tr className="border-b border-slate-700 text-slate-400 text-[11px] font-semibold uppercase tracking-wider bg-table-header">
                  <th className="px-2 py-1.5 align-middle">Description (Plan)</th>
                  <th className="px-2 py-1.5 align-middle text-center">Vehicle No.</th>
                  <th className="px-2 py-1.5 align-middle text-center">Date</th>
                  <th className="px-2 py-1.5 align-middle text-center">Rate</th>
                  <th className="px-2 py-1.5 align-middle text-center">Distance (KM)</th>
                  <th className="px-2 py-1.5 align-middle text-center">Extra KM</th>
                  <th className="px-2 py-1.5 align-middle text-center">Hours</th>
                  <th className="px-2 py-1.5 align-middle text-center">Extra Hrs</th>
                  <th className="px-2 py-1.5 align-middle text-center">DA (₹)</th>
                  <th className="px-2 py-1.5 align-middle text-center">Night Allowance.</th>
                  <th className="px-2 py-1.5 align-middle text-center"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {tableItems.length === 0 ? (
                  <tr>
                    <td colSpan="11" className="p-8 text-center text-slate-400 text-sm">
                      No billing entries yet. Click <span className="font-bold text-indigo-400 cursor-pointer" onClick={() => openRowModal(null)}>+ Add Entry Row</span> to get started.
                    </td>
                  </tr>
                ) : (
                  tableItems.map((item, idx) => {
                    const inlineInput = (field, type = 'number', color = 'text-slate-200') => (
                      <input
                        type={type}
                        value={item[field] ?? ''}
                        onChange={e => updateTableItemField(idx, field, type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value)}
                        className={`w-full bg-transparent border-b border-transparent hover:border-slate-600 focus:border-indigo-400 outline-none text-center text-xs py-0.5 px-1 transition ${color}`}
                      />
                    );
                    return (
                      <React.Fragment key={idx}>
                        <tr className="hover:bg-slate-800/10 transition border-t border-slate-700/50">
                          {/* Plan name - read only display */}
                          <td className="p-2 text-xs font-semibold text-slate-200 max-w-[180px] break-words">
                            {item.plan_name || '—'}
                          </td>
                          {/* Vehicle No - inline editable */}
                          <td className="p-1">
                            {inlineInput('vehicle_number', 'text', 'text-slate-400 font-mono text-[10px]')}
                          </td>
                          {/* Date (inline) */}
                          <td className="p-1 text-center">
                            <input
                              type="date"
                              value={item.date || ''}
                              onChange={e => updateTableItemField(idx, 'date', e.target.value)}
                              className="w-full bg-transparent border-b border-transparent hover:border-slate-600 focus:border-indigo-400 outline-none text-center text-[10px] py-0.5 text-slate-300 transition"
                            />
                          </td>
                          {/* Rate (inline) */}
                          <td className="p-1">{inlineInput('rate', 'number', 'text-emerald-300 font-semibold')}</td>
                          {/* Total Distance */}
                          <td className="p-1">{inlineInput('total_distance_km', 'number', 'text-slate-300')}</td>
                          {/* Extra KM */}
                          <td className="p-1">{inlineInput('extra_km', 'number', 'text-rose-400 font-bold')}</td>
                          {/* Total Hours */}
                          <td className="p-1">{inlineInput('total_hours', 'number', 'text-slate-300')}</td>
                          {/* Extra Hours */}
                          <td className="p-1">{inlineInput('extra_hours', 'number', 'text-rose-400 font-bold')}</td>
                          {/* DA Allowance */}
                          <td className="p-1">{inlineInput('da_allowance', 'number', 'text-amber-300 font-semibold')}</td>
                          {/* Night Allowance */}
                          <td className="p-1">{inlineInput('night_allowance', 'number', 'text-purple-300 font-semibold')}</td>
                          {/* Actions */}
                          <td className="p-2 text-center" rowSpan="2">
                            <button
                              type="button"
                              onClick={() => removeRow(idx)}
                              className="text-rose-500 hover:bg-rose-500/10 p-1.5 rounded-lg transition"
                              title="Remove Row"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                        <tr className="border-b border-slate-700/50 bg-slate-900/20">
                          <td colSpan="5" className="p-2 text-right text-xs text-slate-500 font-medium tracking-wide">
                            Calculations →
                          </td>
                          {/* Total Amount without GST */}
                          <td className="p-2 text-right text-slate-300 font-bold font-mono border-l border-slate-800/50 text-xs whitespace-nowrap">
                            Excl. GST: ₹{(item.amount_without_gst || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </td>
                          {/* GST Rate inline */}
                          <td className="p-1">
                            <select
                              value={item.gst_rate || 5}
                              onChange={e => updateTableItemField(idx, 'gst_rate', parseFloat(e.target.value))}
                              className="bg-slate-900 border border-slate-700 rounded text-xs text-slate-300 px-1 py-0.5 outline-none focus:border-indigo-400"
                            >
                              <option value={0}>0%</option>
                              <option value={5}>5%</option>
                              <option value={12}>12%</option>
                              <option value={18}>18%</option>
                              <option value={28}>28%</option>
                            </select>
                          </td>
                          {/* Total Amount with GST */}
                          <td colSpan="2" className="p-2 text-right whitespace-nowrap">
                            <span className="text-indigo-400 font-bold font-mono text-xs">
                              Incl. GST: ₹{(item.amount_with_gst || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </span>
                          </td>
                        </tr>
                      </React.Fragment>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {tableItems.some(item => (item.plan_name || '').toLowerCase().includes('outstation') || item.plan_type === 'Outstation') && (
          <div className="relative z-20 glass-panel p-6 rounded-2xl border border-slate-700/50 shadow-lg mb-6">
            <h3 className="text-sm font-bold text-slate-200 mb-4 uppercase tracking-wider">Outstation Journey Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1">
                <label className="text-sm font-semibold text-slate-300">Source (From)</label>
                <input
                  type="text"
                  placeholder="e.g. Pune"
                  value={source}
                  onChange={(e) => setSource(e.target.value)}
                  className="w-full bg-slate-950/60 border border-slate-700 focus:border-indigo-500 outline-none rounded-xl px-4 py-2.5 text-sm text-slate-100 transition"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-semibold text-slate-300">Destination (To)</label>
                <input
                  type="text"
                  placeholder="e.g. Mumbai"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  className="w-full bg-slate-950/60 border border-slate-700 focus:border-indigo-500 outline-none rounded-xl px-4 py-2.5 text-sm text-slate-100 transition"
                />
              </div>
            </div>
          </div>
        )}

        <div className="relative z-20 glass-panel p-6 rounded-2xl border border-slate-700/50 shadow-lg grid grid-cols-1 md:grid-cols-2 gap-6 items-center">

          <div className="space-y-4">
            {/* Toll input */}
            <div className="space-y-1 w-full md:w-2/3">
              <label className="text-sm font-semibold text-slate-300 flex items-center gap-1">
                Toll Fees (Rs.)
                <Calculator className="h-4 w-4 text-indigo-400" />
              </label>
              <input
                type="text"
                placeholder="e.g. 500"
                value={tollAmount}
                onChange={(e) => setTollAmount(e.target.value)}
                className="w-full bg-slate-950/60 border border-slate-700 focus:border-indigo-500 outline-none rounded-xl px-4 py-2.5 text-sm text-slate-100 transition"
              />
            </div>

            {/* Parking input */}
            <div className="space-y-1 w-full md:w-2/3">
              <label className="text-sm font-semibold text-slate-300 flex items-center gap-1">
                Parking Charges (Rs.)
                <Calculator className="h-4 w-4 text-indigo-400" />
              </label>
              <input
                type="text"
                placeholder="e.g. 150"
                value={parkingAmount}
                onChange={(e) => setParkingAmount(e.target.value)}
                className="w-full bg-slate-950/60 border border-slate-700 focus:border-indigo-500 outline-none rounded-xl px-4 py-2.5 text-sm text-slate-100 transition"
              />
            </div>
          </div>

          {/* Grand total visualizer */}
          <div className="flex flex-col items-center md:items-end justify-center space-y-2">
            <p className="text-sm uppercase font-bold text-slate-400 tracking-wider">Grand Total Bill</p>
            <div className="text-5xl font-black text-slate-50 bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent drop-shadow-sm font-mono">
              ₹{finalBillAmount.toLocaleString()}
            </div>
            {/* In Words display */}
            <div className="flex flex-col items-center md:items-end w-full pt-2">
              <p className="text-xs uppercase font-bold text-slate-400 tracking-wider">Total in Words</p>
              <p className="text-sm font-semibold text-indigo-300 italic text-center md:text-right mt-1">{finalBillWords || '(Rs. Zero Only)'}</p>
            </div>
          </div>

        </div>

        {/* Submit Actions */}
        <div className="flex justify-between items-center border-t border-slate-800 pt-6">
          <button
            type="button"
            onClick={() => {
              if (editingBillId) setEditingBillId(null);
              navigateTo('bill-list');
            }}
            className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl transition duration-150"
          >
            {editingBillId ? "Cancel Edit" : "Cancel"}
          </button>

          <button
            type="submit"
            disabled={isSubmitting}
            className="px-10 py-4 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-slate-50 font-black text-md rounded-xl shadow-lg hover:shadow-indigo-500/25 transition duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Finalizing Bill..." : (editingBillId ? "Save Changes" : "Generate Bill")}
          </button>
        </div>

      </form>

      <RowModal
        isOpen={isRowModalOpen}
        onClose={() => setIsRowModalOpen(false)}
        onSave={saveRowModal}
        initialData={currentRowData}
        gstEnabled={gstEnabled}
        allPlans={allPlans}
        selectedCustomer={selectedCustomer}
        selectedVehicle={selectedVehicle}
        gstRates={gstRates}
      />
    </div>
  );
}
