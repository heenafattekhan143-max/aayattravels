import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Sparkles,
  CheckCircle,
  AlertTriangle,
  Plus,
  Trash2,
  Printer,
  ChevronDown,
  ChevronRight,
  User,
  Calendar,
  Car,
  Percent,
  Search,
  Check,
  Download,
  X,
  Edit,
  MapPin,
  FileText, Save, Calculator, Hash, Type, ClipboardType, Tag, Info
} from 'lucide-react';
import CustomDatePicker from '../components/CustomDatePicker';
import CustomSelect from '../components/CustomSelect';
import { convertNumberToWords } from '../utils/numberToWords';
import EventBookingModal from '../components/EventBookingModal';
import { useAuth } from '../context/AuthContext';

export default function EventBilling({ navigateTo, editingEventBillId, setEditingEventBillId }) {
  const { user } = useAuth();
  const bizName    = user?.businessName || 'My Business';
  const bizAddress = user?.address      || '';
  const bizPhone   = user?.phone        || '';
  const bizEmail   = user?.email        || '';
  const bizGstin   = user?.gstin        || '';
  const bizSac     = user?.sacCode      || '998559';
  const bizState   = user?.state        || '27-Maharashtra';
  const bizLogo    = user?.logo         || null;
  // Master Lists
  const [allCustomers, setAllCustomers] = useState([]);
  const [allVehicles, setAllVehicles] = useState([]);
  const [allDrivers, setAllDrivers] = useState([]);

  // Basic Info
  const [clientName, setClientName] = useState('');
  const [eventName, setEventName] = useState('');
  const [eventLocation, setEventLocation] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [totalDays, setTotalDays] = useState(1);
  const [totalVehiclesCount, setTotalVehiclesCount] = useState(0);



  // Other Charges
  const [gstRate, setGstRate] = useState(0);
  const [tollAmount, setTollAmount] = useState('');
  const [parkingAmount, setParkingAmount] = useState('');
  const [advanceAmount, setAdvanceAmount] = useState('');

  // Bill states
  const [finalBillAmount, setFinalBillAmount] = useState(0);
  const [subtotal, setSubtotal] = useState(0);
  const [gstAmount, setGstAmount] = useState(0);
  const [finalBillWords, setFinalBillWords] = useState('');
  const [billStatus, setBillStatus] = useState('Pending');

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState('');
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [generatedBillNo, setGeneratedBillNo] = useState('');

  // Event Bookings State
  const [pendingBookings, setPendingBookings] = useState([]);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [editingBookingIndex, setEditingBookingIndex] = useState(null);

  const [isDraftLoaded, setIsDraftLoaded] = useState(false);

  // Fetch bill data for editing or load draft
  useEffect(() => {
    if (editingEventBillId) {
      fetchBillForEdit(editingEventBillId).finally(() => setIsDraftLoaded(true));
    } else {
      const draft = localStorage.getItem('draftEventBill');
      if (draft) {
        try {
          const parsed = JSON.parse(draft);
          if (parsed.clientName) setClientName(parsed.clientName);
          if (parsed.eventName) setEventName(parsed.eventName);
          if (parsed.eventLocation) setEventLocation(parsed.eventLocation);
          if (parsed.startDate) setStartDate(parsed.startDate);
          if (parsed.endDate) setEndDate(parsed.endDate);
          if (parsed.gstRate) setGstRate(parsed.gstRate);
          if (parsed.tollAmount) setTollAmount(parsed.tollAmount);
          if (parsed.parkingAmount) setParkingAmount(parsed.parkingAmount);
          if (parsed.advanceAmount) setAdvanceAmount(parsed.advanceAmount);
          if (parsed.totalVehiclesCount !== undefined) setTotalVehiclesCount(parsed.totalVehiclesCount);
          if (parsed.pendingBookings) setPendingBookings(parsed.pendingBookings);
        } catch (e) {
          console.error("Error parsing draft event bill", e);
        }
      }
      setIsDraftLoaded(true);
    }
  }, [editingEventBillId]);

  // Save draft to localStorage on change
  useEffect(() => {
    if (!editingEventBillId && isDraftLoaded) {
      const draft = {
        clientName,
        eventName,
        eventLocation,
        startDate,
        endDate,
        gstRate,
        tollAmount,
        parkingAmount,
        advanceAmount,
        totalVehiclesCount,
        pendingBookings
      };
      localStorage.setItem('draftEventBill', JSON.stringify(draft));
    }
  }, [clientName, eventName, eventLocation, startDate, endDate, gstRate, tollAmount, parkingAmount, totalVehiclesCount, pendingBookings, editingEventBillId]);

  const fetchBillForEdit = async (id) => {
    try {
      const res = await axios.get(`/api/event-bills/${id}`);
      const bill = res.data;
      setClientName(bill.client_name || '');
      setEventName(bill.event_name || '');
      setEventLocation(bill.event_location || '');
      setStartDate(bill.start_date || new Date().toISOString().split('T')[0]);
      setEndDate(bill.end_date || new Date().toISOString().split('T')[0]);
      setGstRate(bill.gst_rate || 0);
      setTollAmount(bill.toll_amount || '');
      setParkingAmount(bill.parking_amount || '');
      setTotalVehiclesCount(bill.total_vehicles_count || 0);
      setBillStatus(bill.status || 'Pending');
      setGeneratedBillNo(bill.bill_no || '');

      // Fetch bookings linked to this event
      const bookingsRes = await axios.get(`/api/bookings?event_id=${id}`);
      setPendingBookings(bookingsRes.data || []);
    } catch (err) {
      console.error("Failed to load bill for editing:", err);
    }
  };



  // Load master data
  useEffect(() => {
    async function loadData() {
      try {
        const [custRes, vehRes, driRes] = await Promise.all([
          axios.get('/api/customers'),
          axios.get('/api/vehicles'),
          axios.get('/api/drivers')
        ]);
        setAllCustomers(custRes.data);
        setAllVehicles(vehRes.data);
        setAllDrivers(driRes.data);
      } catch (err) {
        console.error("Error loading event billing master data:", err);
      }
    }
    loadData();
  }, []);

  // Compute total days from start & end date
  useEffect(() => {
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const diffTime = end - start;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      setTotalDays(diffDays > 0 ? diffDays : 1);
    }
  }, [startDate, endDate]);



  // Recalculate Totals
  useEffect(() => {
    let rowsSum = 0;
    pendingBookings.filter(row => row.booking_status !== 'Cancelled').forEach(row => {
      const rowRate = parseFloat(row.rate) || 0;
      const rowDa = parseFloat(row.da_allowance) || 0;
      const rowNight = parseFloat(row.night_allowance) || 0;
      rowsSum += (rowRate + rowDa + rowNight);
    });

    const activeBookingsCount = pendingBookings.filter(b => b.booking_status !== 'Cancelled').length;
    // If we have active bookings, use that for toll/parking math. Otherwise fallback to the planned vehicle count.
    const vehiclesCount = Math.max(activeBookingsCount > 0 ? activeBookingsCount : parseInt(totalVehiclesCount) || 1, 1);
    const tollVal = (parseFloat(tollAmount) || 0) * vehiclesCount;
    const parkVal = (parseFloat(parkingAmount) || 0) * vehiclesCount;

    const sub = rowsSum;
    const gst = sub * (parseFloat(gstRate) || 0) / 100;
    const finalAmount = sub + gst + tollVal + parkVal;

    setSubtotal(sub);
    setGstAmount(gst);
    setFinalBillAmount(finalAmount);
    setFinalBillWords(convertNumberToWords(Math.round(finalAmount)));
  }, [pendingBookings, totalDays, gstRate, tollAmount, parkingAmount, totalVehiclesCount]);


  // Handle Live Preview Validation
  const handleLivePreview = () => {
    if (!clientName.trim() || !eventName.trim() || !eventLocation.trim() || !startDate || !endDate || totalVehiclesCount <= 0) {
      alert("Please fill out all required event details (Owner Name, Event Name, Location, Dates, and Total Vehicles) before viewing the PDF preview.");
      return;
    }
    setShowPreviewModal(true);
  };

  // Submit Handler to save Event Bill
  const handleSaveBill = async () => {
    if (!clientName.trim()) {
      alert("Please enter a customer/client name.");
      return;
    }
    if (!eventName.trim()) {
      alert("Please enter an event name.");
      return;
    }

    setIsSubmitting(true);
    const payload = {
      client_name: clientName,
      customer_id: "",
      event_name: eventName,
      event_location: eventLocation,
      start_date: startDate,
      end_date: endDate,
      total_days: totalDays,
      total_vehicles_count: totalVehiclesCount,
      vehicle_classes: [],
      vehicle_rows: [],
      gst_rate: parseFloat(gstRate) || 0,
      toll_amount: parseFloat(tollAmount) || 0,
      parking_amount: parseFloat(parkingAmount) || 0,
      subtotal: subtotal,
      gst_amount: gstAmount,
      final_bill_amount: finalBillAmount,
      advance_amount: parseFloat(advanceAmount) || 0,
      final_bill_words: finalBillWords,
      status: ((parseFloat(advanceAmount) || 0) >= finalBillAmount && finalBillAmount > 0) ? 'Paid' : ((parseFloat(advanceAmount) || 0) > 0 ? 'Partial' : 'Pending')
    };

    try {
      let eventId = editingEventBillId;
      if (editingEventBillId) {
        await axios.put(`/api/event-bills/${editingEventBillId}`, payload);
        setSuccess("Event Bill Updated Successfully!");
      } else {
        const res = await axios.post('/api/event-bills', payload);
        eventId = res.data.id;
        if (res.data.bill_no) {
          setGeneratedBillNo(res.data.bill_no);
        }
        localStorage.removeItem('draftEventBill');
        setSuccess("Event Bill Saved Successfully!");
      }

      // Save / update all pending bookings
      for (const booking of pendingBookings) {
        const bookingId = booking.id || booking._id;
        if (bookingId) {
          // Existing booking — update it via PUT
          try {
            await axios.put(`/api/bookings/${bookingId}`, {
              ...booking,
              event_id: eventId
            });
          } catch (bErr) {
            console.error("Failed to update event booking", bErr);
          }
        } else {
          // New booking — create it via POST
          try {
            await axios.post('/api/bookings', {
              ...booking,
              event_id: eventId
            });
          } catch (bErr) {
            console.error("Failed to save an event booking", bErr);
          }
        }
      }

      setTimeout(() => {
        setSuccess('');
        setShowPreviewModal(true);
      }, 1000);
    } catch (err) {
      console.error(err);
      alert("Error saving event bill: " + (err.response?.data?.detail || err.message));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Format date helper
  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}`;
  };
  const isFormValidForBooking = clientName.trim() !== '' && eventName.trim() !== '' && eventLocation.trim() !== '' && startDate && endDate && totalVehiclesCount > 0;
  
  const activeBookingsCount = pendingBookings.filter(b => b.booking_status !== 'Cancelled').length;
  const effectiveVehiclesCount = activeBookingsCount > 0 ? activeBookingsCount : (parseInt(totalVehiclesCount) || 0);
  
  const isAddBookingDisabled = !isFormValidForBooking || pendingBookings.length >= totalVehiclesCount;

  const vehicleClassSummary = React.useMemo(() => {
    const summary = {};
    // Only count non-cancelled bookings in the bill summary
    pendingBookings.filter(b => b.booking_status !== 'Cancelled').forEach(b => {
      const vClass = b.vehicle_class || b.vehicle_type || 'Vehicle';
      if (!summary[vClass]) {
        summary[vClass] = {
          class_name: vClass,
          count: 0,
          total_rate: 0
        };
      }
      summary[vClass].count += 1;
      summary[vClass].total_rate += parseFloat(b.rate) || 0;
    });
    return Object.values(summary);
  }, [pendingBookings]);

  return (
    <div className="space-y-6 pb-20">
      {/* Alert message */}
      {success && (
        <div className="flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 p-4 rounded-xl">
          <CheckCircle className="h-5 w-5 animate-bounce shrink-0" />
          <span className="font-semibold">{success}</span>
        </div>
      )}

      {/* Two-Column Form Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

        {/* Left Side (8 Cols): Basic details & allocation */}
        <div className="lg:col-span-8 space-y-6">

          {/* Card 1: Event Details */}
          <div className="glass-panel p-6 rounded-2xl border border-slate-700/50 shadow-xl space-y-4">
            <h2 className="text-sm font-bold text-slate-50 uppercase tracking-wider flex items-center gap-2 pb-2 border-b border-slate-800">
              <Calendar className="h-4 w-4 text-indigo-400" /> Event & Customer Information
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Customer Input */}
              <div className="space-y-1 relative">
                <label className="text-xs font-semibold text-slate-300">Event Owner Name *</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 h-4 w-4" />
                  <input
                    type="text"
                    placeholder="Enter event owner name..."
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    className="w-full bg-slate-950/60 border border-slate-700 focus:border-indigo-500 outline-none rounded-xl pl-9 pr-4 py-2 text-sm text-slate-100 transition"
                  />
                </div>
              </div>

              {/* Event Name */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Event Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Wedding Reception, Corporate Summit"
                  value={eventName}
                  onChange={(e) => setEventName(e.target.value)}
                  className="w-full bg-slate-950/60 border border-slate-700 focus:border-indigo-500 outline-none rounded-xl px-4 py-2 text-sm text-slate-100 transition"
                />
              </div>
            </div>

            {/* Event Location */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Event Location *</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 h-4 w-4" />
                <input
                  type="text"
                  placeholder="e.g. Grand Hyatt, Mumbai"
                  value={eventLocation}
                  onChange={(e) => setEventLocation(e.target.value)}
                  className="w-full bg-slate-950/60 border border-slate-700 focus:border-indigo-500 outline-none rounded-xl pl-9 pr-4 py-2 text-sm text-slate-100 transition"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Start Date */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Start Date</label>
                <CustomDatePicker
                  value={startDate}
                  onChange={(d) => setStartDate(d)}
                />
              </div>

              {/* End Date */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">End Date</label>
                <CustomDatePicker
                  value={endDate}
                  onChange={(d) => setEndDate(d)}
                />
              </div>

              {/* Computed Days Info */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500">Duration (Days)</label>
                <input
                  type="text"
                  value={totalDays}
                  disabled={pendingBookings.length > 0}
                  onChange={(e) => {
                    const cleaned = e.target.value.replace(/\D/g, '');
                    setTotalDays(cleaned ? parseInt(cleaned) : '');
                  }}
                  className={`w-full border outline-none rounded-xl px-4 py-2.5 text-sm font-black font-mono transition text-center ${
                    pendingBookings.length > 0 
                      ? 'bg-slate-950/40 border-slate-800 text-slate-500 cursor-not-allowed' 
                      : 'bg-slate-950/60 border-slate-700 focus:border-indigo-500 text-slate-300'
                  }`}
                />
              </div>

              {/* Total Vehicles count input */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Total Vehicles</label>
                <input
                  type="text"
                  placeholder="Count"
                  value={totalVehiclesCount}
                  onChange={(e) => {
                    const cleaned = e.target.value.replace(/\D/g, '');
                    setTotalVehiclesCount(cleaned ? parseInt(cleaned) : 0);
                  }}
                  className="w-full bg-slate-950/60 border border-slate-700 focus:border-indigo-500 outline-none rounded-xl px-4 py-2 text-sm text-slate-100 font-bold font-mono transition text-center"
                />
              </div>
            </div>
          </div>

        {/* Section: Event Bookings */}
          <div className="glass-panel p-6 rounded-2xl border border-slate-700/50 shadow-xl space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
              <h2 className="text-sm font-bold text-slate-50 uppercase tracking-wider flex items-center gap-2">
                <Car className="h-4 w-4 text-emerald-400" /> Event Bookings
                <span className="text-[10px] bg-slate-800 border border-slate-700 text-slate-300 px-2 py-0.5 rounded-full ml-2 normal-case font-mono">
                  {pendingBookings.length} / {totalVehiclesCount || 0}
                </span>
              </h2>
              <button
                type="button"
                disabled={isAddBookingDisabled}
                onClick={() => setIsBookingModalOpen(true)}
                className={`px-3 py-1.5 text-white text-xs font-bold rounded-lg shadow-lg transition duration-150 ${
                  isAddBookingDisabled 
                    ? 'bg-slate-700 text-slate-400 cursor-not-allowed opacity-60' 
                    : 'bg-emerald-600 hover:bg-emerald-500'
                }`}
                title={!isFormValidForBooking ? "Please fill all event details above to add bookings" : ""}
              >
                + Add Event Booking
              </button>
            </div>

            {pendingBookings.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-table-header text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-700">
                      <th className="py-2.5 px-2">Date</th>
                      <th className="py-2.5 px-2">Customer</th>
                      <th className="py-2.5 px-2">Vehicle</th>
                      <th className="py-2.5 px-2">Driver</th>
                      <th className="py-2.5 px-2">Rate (₹)</th>
                      <th className="py-2.5 px-2 hidden md:table-cell">Pickup</th>
                      <th className="py-2.5 px-2 hidden md:table-cell">Drop</th>
                      <th className="py-2.5 pl-2 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/40">
                    {pendingBookings.map((b, bIdx) => {
                      const isCancelled = b.booking_status === 'Cancelled';
                      return (
                      <tr key={b.id || bIdx} className={`group border-b border-slate-800/30 ${isCancelled ? 'opacity-50 bg-rose-950/10' : 'hover:bg-slate-800/20'}`}>
                        <td className="py-2 px-2">
                          <div className="flex flex-col">
                            <span className={`font-medium ${isCancelled ? 'line-through text-slate-500' : 'text-slate-300'}`}>{formatDate(b.journey_date)}</span>
                            <span className="text-[10px] text-indigo-400 font-mono font-bold mt-0.5">{b.pickup_time}</span>
                          </div>
                        </td>
                        <td className={`py-2 px-2 font-semibold ${isCancelled ? 'line-through text-slate-500' : 'text-slate-300'}`}>{b.customer_name || '—'}</td>
                        <td className={`py-2 px-2 font-bold ${isCancelled ? 'text-slate-600' : 'text-slate-200'}`}>{b.vehicle_number}</td>
                        <td className={`py-2 px-2 ${isCancelled ? 'text-slate-600' : 'text-slate-300'}`}>{b.driver_name}</td>
                        <td className={`py-2 px-2 font-mono font-bold ${isCancelled ? 'line-through text-slate-600' : 'text-emerald-400'}`}>₹{b.rate || 0}</td>
                        <td className={`py-2 px-2 truncate max-w-[120px] hidden md:table-cell ${isCancelled ? 'text-slate-600' : 'text-slate-400'}`}>{b.pickup_location}</td>
                        <td className={`py-2 px-2 truncate max-w-[120px] hidden md:table-cell ${isCancelled ? 'text-slate-600' : 'text-slate-400'}`}>{b.drop_location}</td>
                        <td className="py-2 pl-2 text-right">
                          {isCancelled ? (
                            <span className="text-[9px] font-bold text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2 py-1 rounded-lg">Cancelled</span>
                          ) : (
                          <>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingBookingIndex(bIdx);
                              setIsBookingModalOpen(true);
                            }}
                            className="p-1.5 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-lg hover:bg-indigo-500 hover:text-white transition duration-150 mr-2"
                            title="Edit Booking"
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setPendingBookings(prev => prev.filter((_, i) => i !== bIdx))}
                            className="p-1.5 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-lg hover:bg-rose-500 hover:text-white transition duration-150"
                            title="Delete Booking"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                          </>
                          )}
                        </td>
                      </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-xs text-slate-500 italic text-center py-4">No bookings created for this event yet. Click "+ Add Event Booking" to start.</p>
            )}
          </div>
        </div>

        {/* Right Side (4 Cols): Charges & calculations summaries */}
        <div className="lg:col-span-4 space-y-6">

          <div className="glass-panel p-6 rounded-2xl border border-slate-700/50 shadow-xl space-y-6">
            <h2 className="text-sm font-bold text-slate-50 uppercase tracking-wider flex items-center gap-2 pb-2 border-b border-slate-800">
              <Percent className="h-4 w-4 text-indigo-400" /> Calculations & GST
            </h2>

            {/* GST Rate Select */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">GST Rate (%) *</label>
              <CustomSelect
                value={gstRate}
                onChange={(val) => setGstRate(parseFloat(val) || 0)}
                options={[
                  { value: '0', label: '0% (Default - Exempt / No Tax)' },
                  { value: '5', label: '5% GST' },
                  { value: '12', label: '12% GST' },
                  { value: '18', label: '18% GST' }
                ]}
              />
            </div>

            {/* Toll Amount */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Toll Charges (per vehicle ₹)</label>
              <input
                type="text"
                placeholder="e.g. 1500"
                value={tollAmount}
                onChange={(e) => {
                  const cleaned = e.target.value.replace(/\D/g, '');
                  setTollAmount(cleaned);
                }}
                className="w-full bg-slate-950/60 border border-slate-700 focus:border-indigo-500 outline-none rounded-xl px-4 py-2.5 text-sm text-slate-100 font-bold font-mono transition"
              />
            </div>

            {/* Parking Amount */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Parking Charges (per vehicle ₹)</label>
              <input
                type="text"
                placeholder="e.g. 500"
                value={parkingAmount}
                onChange={(e) => {
                  const cleaned = e.target.value.replace(/\D/g, '');
                  setParkingAmount(cleaned);
                }}
                className="w-full bg-slate-950/60 border border-slate-700 focus:border-indigo-500 outline-none rounded-xl px-4 py-2.5 text-sm text-slate-100 font-bold font-mono transition"
              />
            </div>

            {/* Advance Amount */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Advance Payment (₹)</label>
              <input
                type="text"
                placeholder="e.g. 10000"
                value={advanceAmount}
                onChange={(e) => {
                  const cleaned = e.target.value.replace(/\D/g, '');
                  setAdvanceAmount(cleaned);
                }}
                className="w-full bg-slate-950/60 border border-slate-700 focus:border-indigo-500 outline-none rounded-xl px-4 py-2.5 text-sm text-slate-100 font-bold font-mono transition"
              />
            </div>

            {/* Summary details */}
            <div className="border-t border-slate-800 pt-4 space-y-2 text-xs">
              <div className="flex justify-between text-slate-400 font-medium">
                <span>Total Days:</span>
                <span className="font-bold text-slate-200 font-mono">{totalDays}</span>
              </div>
              <div className="flex justify-between text-slate-400 font-medium">
                <span>Total Vehicles:</span>
                <span className="font-bold text-slate-200 font-mono">{effectiveVehiclesCount}</span>
              </div>
              <div className="flex justify-between text-slate-400 font-medium">
                <span>Subtotal (Excl. GST):</span>
                <span className="font-bold text-slate-200 font-mono">₹{subtotal.toLocaleString('en-IN')}</span>
              </div>
              {gstAmount > 0 && (
                <div className="flex justify-between text-slate-400 font-medium">
                  <span>GST Amount ({gstRate}%):</span>
                  <span className="font-bold text-slate-200 font-mono">₹{gstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
              )}
              {parseFloat(tollAmount) > 0 && (
                <div className="flex justify-between text-slate-400 font-medium">
                  <span>Toll Charges:</span>
                  <span className="font-bold text-slate-200 font-mono">₹{((parseFloat(tollAmount) || 0) * Math.max(effectiveVehiclesCount, 1)).toLocaleString('en-IN')}</span>
                </div>
              )}
              {parseFloat(parkingAmount) > 0 && (
                <div className="flex justify-between text-slate-400 font-medium">
                  <span>Parking Charges:</span>
                  <span className="font-bold text-slate-200 font-mono">₹{((parseFloat(parkingAmount) || 0) * Math.max(effectiveVehiclesCount, 1)).toLocaleString('en-IN')}</span>
                </div>
              )}

              {/* Grand Total */}
              <div className="flex justify-between items-center text-lg font-black text-slate-50 bg-slate-900 p-3 rounded-xl border border-slate-800 mt-4">
                <span className="text-indigo-400 text-sm">Final Bill:</span>
                <span className="text-indigo-300 font-mono text-xl">₹{finalBillAmount.toLocaleString('en-IN')}</span>
              </div>
              
              {parseFloat(advanceAmount) > 0 && (
                <div className="flex justify-between text-slate-400 font-medium">
                  <span>Advance Received:</span>
                  <span className="font-bold text-emerald-400 font-mono">- ₹{(parseFloat(advanceAmount) || 0).toLocaleString('en-IN')}</span>
                </div>
              )}
              {parseFloat(advanceAmount) > 0 && (
                <div className="flex justify-between text-slate-50 font-bold border-t border-slate-800 pt-2">
                  <span>Balance Due:</span>
                  <span className="font-mono text-rose-400">₹{Math.max(0, finalBillAmount - (parseFloat(advanceAmount) || 0)).toLocaleString('en-IN')}</span>
                </div>
              )}

              {/* Amount in words */}
              <div className="text-[10px] text-right font-bold text-indigo-400 italic pt-1">
                {finalBillWords}
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="pt-2 flex flex-col gap-3">
              <button
                type="button"
                onClick={handleSaveBill}
                disabled={isSubmitting}
                className="w-full py-3 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-slate-50 font-bold rounded-xl shadow-lg transition duration-150 disabled:opacity-50"
              >
                {isSubmitting ? 'Saving Event Bill...' : 'Save & Print Invoice'}
              </button>
              <button
                type="button"
                onClick={handleLivePreview}
                className="w-full py-3 bg-slate-900 border border-slate-700 hover:border-slate-500 text-slate-300 hover:text-slate-50 font-bold rounded-xl transition flex justify-center items-center gap-2"
              >
                <Printer className="h-4 w-4" /> Live PDF Preview
              </button>
            </div>
          </div>

        </div>

      </div>

      {/* PDF / Invoice Preview Modal */}
      {showPreviewModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm flex justify-center items-start p-4 md:p-8">
          <div className="bg-white text-slate-900 w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden border border-slate-200 flex flex-col my-8">

            {/* Modal actions toolbar */}
            <div className="bg-slate-100 border-b border-slate-200 p-4 flex justify-between items-center print:hidden">
              <div className="flex items-center gap-2">
                <span className="text-slate-800 font-black text-sm">PDF Format Invoice Preview</span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-lg shadow hover:bg-indigo-500 transition"
                >
                  <Printer className="h-4 w-4" /> Print / Download PDF
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowPreviewModal(false);
                  }}
                  className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-200/50 rounded-lg transition"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Printable PDF Area */}
            <div id="invoice-print-area" className="bg-white text-slate-900 p-8 md:p-12 rounded-xl text-left print-border min-h-[11in] flex flex-col justify-between">
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

                {/* Customer, Invoice & Event Details Box */}
                <div className="border-x border-b border-slate-700 grid grid-cols-12 text-xs text-slate-800 divide-x divide-slate-700">
                  {/* Bill To Column */}
                  <div className="col-span-6 flex flex-col justify-between">
                    <div className="bg-slate-50 border-b border-slate-700 px-2.5 py-1 font-bold text-slate-600 text-[10px] uppercase">
                      Bill To:
                    </div>
                    <div className="p-2.5 space-y-1 flex-1">
                      <h3 className="text-sm font-black text-slate-900 uppercase">{clientName || '—'}</h3>
                      <p className="text-slate-600 font-bold leading-tight">
                        No address provided
                      </p>
                      <div className="pt-1 space-y-0.5">
                        <p>
                          <span className="font-bold text-slate-500">Customer Name:</span>{" "}
                          <span className="font-bold text-slate-900 uppercase">{clientName || '—'}</span>
                        </p>
                        <p>
                          <span className="font-bold text-slate-500">GSTIN:</span>{" "}
                          <span className="font-bold text-slate-900">—</span>
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Event details column */}
                  <div className="col-span-6 flex flex-col justify-between">
                    <div className="bg-slate-50 border-b border-slate-700 px-2.5 py-1 font-bold text-slate-600 text-[10px] uppercase">
                      Event / Invoice Details:
                    </div>
                    <div className="p-2.5 space-y-1 flex-1 font-medium">
                      <p>
                        <span className="font-bold text-slate-500">Invoice No.:</span>{" "}
                        <span className="font-bold text-slate-900">NEW (Generated on Save)</span>
                      </p>
                      <p>
                        <span className="font-bold text-slate-500">Event Name:</span>{" "}
                        <span className="font-bold text-indigo-700 uppercase">{eventName || '—'}</span>
                      </p>
                      <p>
                        <span className="font-bold text-slate-500">Event Location:</span>{" "}
                        <span className="font-bold text-slate-900">{eventLocation || '—'}</span>
                      </p>
                      <p>
                        <span className="font-bold text-slate-500">Start Date:</span>{" "}
                        <span className="font-bold text-slate-900">{formatDate(startDate)}</span>
                      </p>
                      <p>
                        <span className="font-bold text-slate-500">End Date:</span>{" "}
                        <span className="font-bold text-slate-900">{formatDate(endDate)}</span>
                      </p>
                      <p>
                        <span className="font-bold text-slate-500">Total Duration:</span>{" "}
                        <span className="font-bold text-slate-900 font-mono">{totalDays} {totalDays === 1 ? 'Day' : 'Days'}</span>
                      </p>
                      <p>
                        <span className="font-bold text-slate-500">Total Vehicles Provided:</span>{" "}
                        <span className="font-bold text-slate-900 font-mono">
                          {pendingBookings.filter(b => b.booking_status !== 'Cancelled').length}{" "}
                          {pendingBookings.filter(b => b.booking_status !== 'Cancelled').length === 1 ? 'Vehicle' : 'Vehicles'}
                        </span>
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mb-3"></div>

                {/* Event Vehicle Summary Table */}
                <div className="mt-4">
                  <div className="bg-slate-50 px-2.5 py-1.5 border border-slate-400 font-bold text-slate-800 text-[10px] uppercase">
                    Vehicles Summary (Provided Vehicles):
                  </div>
                  <table className="w-full text-left text-[10px] border-x border-b border-slate-400 border-collapse table-fixed">
                    <colgroup>
                      <col style={{ width: '50%' }} />
                      <col style={{ width: '50%' }} />
                    </colgroup>
                    <thead>
                      <tr className="border-b border-slate-400 bg-slate-50 text-slate-800 font-bold text-[9px] uppercase">
                        <th className="p-1.5 border-r border-slate-400 text-center">Vehicle Count</th>
                        <th className="p-1.5 text-center">Total (₹)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pendingBookings.filter(b => b.booking_status !== 'Cancelled').length > 0 ? (
                        <tr className="border-b border-slate-200 text-slate-700 font-medium">
                          <td className="p-1.5 border-r border-slate-400 text-center font-mono font-bold">
                            {pendingBookings.filter(b => b.booking_status !== 'Cancelled').length}
                          </td>
                          <td className="p-1.5 text-center font-mono font-bold text-slate-900">
                            ₹{subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                      ) : (
                        <tr>
                          <td colSpan="2" className="p-3 text-center text-slate-400 italic">No active bookings for this event.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="mb-4"></div>



                {/* Bottom calculations summary */}
                <div className="mt-6 grid grid-cols-12 gap-8 items-start">
                  {/* Left: T&C */}
                  <div className="col-span-6 space-y-1">
                    {/* Empty or minor note */}
                  </div>

                  {/* Right: Calculations breakdown */}
                  <div className="col-span-6 text-xs">
                    <div className="space-y-1.5 border-t border-slate-200 pt-2">
                      <div className="flex justify-between text-slate-600">
                        <span>Subtotal (Excl. Tax):</span>
                        <span className="font-semibold font-mono">₹{subtotal.toLocaleString('en-IN')}</span>
                      </div>
                      {parseFloat(gstRate) > 0 && (
                        <div className="flex justify-between text-slate-600">
                          <span>GST ({gstRate}%):</span>
                          <span className="font-semibold font-mono">₹{gstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        </div>
                      )}
                      {parseFloat(tollAmount) > 0 && (
                        <div className="flex justify-between text-slate-600">
                          <span>Toll Charges:</span>
                          <span className="font-semibold font-mono">₹{((parseFloat(tollAmount) || 0) * Math.max(parseInt(totalVehiclesCount) || 1, 1)).toLocaleString('en-IN')}</span>
                        </div>
                      )}
                      {parseFloat(parkingAmount) > 0 && (
                        <div className="flex justify-between text-slate-600">
                          <span>Parking Charges:</span>
                          <span className="font-semibold font-mono">₹{((parseFloat(parkingAmount) || 0) * Math.max(parseInt(totalVehiclesCount) || 1, 1)).toLocaleString('en-IN')}</span>
                        </div>
                      )}

                      <div className="flex justify-between text-xl font-black text-slate-900 border-t border-slate-300 pt-1.5 bg-indigo-50/30 p-2 rounded-lg border border-indigo-100/50 mt-1">
                        <span className="text-indigo-800">Grand Total:</span>
                        <span className="text-indigo-900 font-mono">₹{finalBillAmount.toLocaleString('en-IN')}</span>
                      </div>
                      {(parseFloat(advanceAmount) > 0 || billStatus === 'Partial' || billStatus === 'Paid') && (
                        <>
                          <div className="flex justify-between text-slate-600 pt-2 mt-1 border-t border-slate-200">
                            <span>Advance Received:</span>
                            <span className="font-semibold font-mono text-emerald-600">- ₹{(parseFloat(advanceAmount) || 0).toLocaleString('en-IN')}</span>
                          </div>
                          <div className="flex justify-between text-lg font-black text-slate-900 pt-1.5 p-2 rounded-lg mt-1 border border-slate-200 bg-slate-50">
                            <span className="text-rose-600">Pending Amount Due:</span>
                            <span className="text-rose-600 font-mono">₹{Math.max(0, finalBillAmount - (parseFloat(advanceAmount) || 0)).toLocaleString('en-IN')}</span>
                          </div>
                        </>
                      )}
                      <div className="text-[10px] text-right font-bold text-indigo-700 italic pt-1">
                        {finalBillWords}
                      </div>
                    </div>
                  </div>
                </div>

              </div>

              {/* Footer Terms & Signatures */}
              <div className="border-t border-slate-200 pt-6 mt-8 grid grid-cols-2 gap-8 text-[9px] text-slate-500">
                <div>
                  <p className="font-bold text-slate-700 uppercase mb-1">Terms &amp; Conditions</p>
                  <ul className="list-disc pl-3 space-y-0.5">
                    <li>Payment is due within 7 days from the invoice date.</li>
                    <li>Tolls, parking fees, state tax, and entry taxes shall be paid extra.</li>
                    <li>All disputes are subject to local judicial jurisdictions.</li>
                  </ul>
                </div>
                <div className="text-right flex flex-col justify-end items-end">
                  <p className="font-bold text-slate-700 uppercase mb-0">For {bizName.toUpperCase()}</p>
                  <img src="/signature.png" alt="Signature" className="h-36 object-contain -mb-5 relative z-10 opacity-90" />
                  <p className="font-bold text-slate-400 border-t border-dashed border-slate-300 pt-1 w-44 text-center uppercase tracking-widest relative z-20">Authorized Signatory</p>
                </div>
              </div>

            </div>

          </div>
        </div>
      )}

      {/* Event Booking Modal */}
      <EventBookingModal
        isOpen={isBookingModalOpen}
        onClose={() => {
          setIsBookingModalOpen(false);
          setEditingBookingIndex(null);
        }}
        onSave={(newBooking) => {
          if (editingBookingIndex !== null) {
            setPendingBookings(prev => {
              const updated = [...prev];
              updated[editingBookingIndex] = newBooking;
              return updated;
            });
          } else {
            setPendingBookings(prev => [...prev, newBooking]);
          }
          setEditingBookingIndex(null);
        }}
        vehicles={allVehicles}
        drivers={allDrivers}
        defaultCustomer={clientName}
        defaultDate={startDate}
        defaultDropLocation={eventLocation}
        initialData={editingBookingIndex !== null ? pendingBookings[editingBookingIndex] : null}
      />
    </div>
  );
}
