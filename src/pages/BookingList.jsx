import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import {
  BookOpen, Plus, Search, Edit2, Trash2, CheckCircle,
  AlertTriangle, X, Car, User, MapPin, Calendar,
  Phone, CreditCard, Clock, ArrowRight, RefreshCw, Loader2, Building2, UserPlus
} from 'lucide-react';
import { useConfirm } from '../context/ConfirmContext';
import CustomDatePicker from '../components/CustomDatePicker';
import CustomSelect from '../components/CustomSelect';

const API = '/api';

const TRIP_TYPES = ['One Way', 'Round Trip', 'Local'];
const BOOKING_STATUSES = ['Unconfirmed', 'Confirmed', 'Cancelled', 'Completed'];
const PAYMENT_STATUSES = ['Pending', 'Partial', 'Paid'];
const VEHICLE_TYPES = ['Sedan', 'SUV', 'Mini Bus', 'Tempo Traveller', 'Luxury', 'Others'];

const emptyForm = {
  booking_id: '',
  booking_date: new Date().toISOString().split('T')[0],
  customer_name: '',
  customer_phone: '',
  is_guest: false,
  pickup_location: '',
  drop_location: '',
  pickup_time: '',
  end_time: '',
  pickup_address: '',
  journey_date: '',
  return_date: '',
  vehicle_number: '',
  driver_name: '',
  trip_type: 'One Way',
  vehicle_type: '',
  passengers: 1,
  advance_amount: '',
  total_amount: '',
  payment_status: 'Pending',
  booking_status: 'Confirmed',
  remarks: '',
};

const statusColor = {
  Unconfirmed: 'bg-slate-500/15 text-slate-300 border border-slate-500/30',
  Confirmed: 'bg-blue-500/15 text-blue-400 border border-blue-500/30',
  Cancelled: 'bg-red-500/15 text-red-400 border border-red-500/30',
  Completed: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
};

const paymentColor = {
  Pending: 'bg-amber-500/15 text-amber-400 border border-amber-500/30',
  Partial: 'bg-orange-500/15 text-orange-400 border border-orange-500/30',
  Paid: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
};

/* ── Reusable searchable customer picker ── */
function CustomerSearchPicker({ entities, value, phone, isGuest, guestName, guestPhone, onChange, onGuestChange, error }) {
  const [query, setQuery] = useState(value || '');
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

  // Keep input in sync when form resets / edits load
  useEffect(() => { setQuery(isGuest ? 'Other / Guest Customer' : (value || '')); }, [value, isGuest]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filtered = query.trim().length === 0 || query === 'Other / Guest Customer'
    ? entities
    : entities.filter(e =>
      e.name.toLowerCase().includes(query.toLowerCase()) ||
      e.phone.includes(query)
    );

  const handleSelect = (entity) => {
    setQuery(entity.name);
    setOpen(false);
    onChange(entity.name, entity.phone, false);
  };

  const handleSelectGuest = () => {
    setQuery('Other / Guest Customer');
    setOpen(false);
    onChange('', '', true);   // signal parent: guest mode on, clear name/phone
  };

  const handleInputChange = (e) => {
    setQuery(e.target.value);
    setOpen(true);
    if (!e.target.value) onChange('', '', false);
  };

  const handleClear = () => {
    setQuery('');
    setOpen(false);
    onChange('', '', false);
  };

  return (
    <div ref={wrapRef} className="space-y-2">
      <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
        <Building2 className="h-3 w-3 text-indigo-400" /> Customer / Company *
      </label>

      {/* Search input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500 pointer-events-none" />
        <input
          type="text"
          placeholder="Search by name or phone..."
          value={query}
          onFocus={() => setOpen(true)}
          onChange={handleInputChange}
          readOnly={isGuest}
          className={`w-full bg-slate-950 border ${isGuest ? 'border-amber-500/50 text-amber-300' :
              error ? 'border-red-500' : 'border-slate-700'
            } outline-none rounded-xl pl-9 pr-9 py-2.5 text-sm text-slate-100 focus:border-indigo-500 transition placeholder-slate-600`}
          autoComplete="off"
        />
        {(query || isGuest) && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
      {error && <p className="text-xs text-red-400">{error}</p>}

      {/* Dropdown */}
      {open && (
        <div className="absolute z-40 mt-1 w-full max-w-sm bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden">
          <div className="max-h-52 overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="px-4 py-4 text-xs text-slate-500 text-center">No matching customers found</div>
            ) : (
              filtered.map(entity => (
                <button
                  key={entity.id}
                  type="button"
                  onMouseDown={() => handleSelect(entity)}
                  className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-800 transition text-left"
                >
                  <div className="bg-indigo-500/10 p-1.5 rounded-lg border border-indigo-500/20 shrink-0">
                    <User className="h-3 w-3 text-indigo-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-slate-50 truncate">{entity.name}</span>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${entity.entity_type === 'customer'
                          ? 'bg-blue-500/15 text-blue-400 border border-blue-500/30'
                          : 'bg-violet-500/15 text-violet-400 border border-violet-500/30'
                        }`}>{entity.entity_type}</span>
                    </div>
                    <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                      <Phone className="h-2.5 w-2.5" />{entity.phone}
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>

          {/* ── Other / Guest option ── */}
          <div className="border-t border-slate-800">
            <button
              type="button"
              onMouseDown={handleSelectGuest}
              className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-amber-500/10 transition text-left group"
            >
              <div className="bg-amber-500/10 p-1.5 rounded-lg border border-amber-500/30 shrink-0">
                <UserPlus className="h-3 w-3 text-amber-400" />
              </div>
              <div>
                <div className="text-sm font-semibold text-amber-300">Other / Guest Customer</div>
                <div className="text-xs text-slate-500">Enter name &amp; phone manually</div>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* ── Guest inputs shown when Other is selected ── */}
      {isGuest && (
        <div className="space-y-2 p-3 bg-amber-500/5 border border-amber-500/25 rounded-xl">
          <p className="text-[11px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
            <UserPlus className="h-3 w-3" /> Guest Customer Details
          </p>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">Guest Name *</label>
            <input
              type="text"
              placeholder="Enter guest full name"
              value={guestName}
              onChange={(e) => onGuestChange('name', e.target.value)}
              className="w-full bg-slate-950 border border-amber-500/30 outline-none rounded-xl px-3 py-2.5 text-sm text-slate-100 focus:border-amber-400 transition placeholder-slate-600"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">Guest Phone</label>
            <input
              type="tel"
              placeholder="10-digit phone number"
              value={guestPhone}
              onChange={(e) => onGuestChange('phone', e.target.value)}
              className="w-full bg-slate-950 border border-amber-500/30 outline-none rounded-xl px-3 py-2.5 text-sm text-slate-100 focus:border-amber-400 transition placeholder-slate-600"
            />
          </div>
        </div>
      )}

      {/* Auto-filled phone tag (for registered customer) */}
      {!isGuest && phone && (
        <div className="flex items-center gap-2 px-3 py-2 bg-slate-900/60 border border-slate-800 rounded-xl">
          <Phone className="h-3 w-3 text-indigo-400 shrink-0" />
          <span className="text-xs text-slate-300 font-mono">{phone}</span>
          <span className="text-xs text-slate-600 ml-auto">Auto-filled</span>
        </div>
      )}
    </div>
  );
}

/* ── Confirm Delete Dialog ── */
function ConfirmDialog({ open, title, message, onConfirm, onCancel }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-8 max-w-sm w-full mx-4">
        <div className="flex items-start gap-4 mb-6">
          <div className="bg-red-500/15 p-3 rounded-xl border border-red-500/30 shrink-0">
            <AlertTriangle className="h-6 w-6 text-red-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-50 mb-1">{title}</h3>
            <p className="text-sm text-slate-400">{message}</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2.5 rounded-xl border border-slate-700 text-slate-300 text-sm font-semibold hover:bg-slate-800 transition"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-sm font-bold transition shadow-lg shadow-red-500/20"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════ */
/*                   MAIN COMPONENT                       */
/* ══════════════════════════════════════════════════════ */
export default function BookingList({ navigateTo, setEditingBookingId }) {
  const [bookings, setBookings] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [entities, setEntities] = useState([]);   // ← customers + vendors
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [errors, setErrors] = useState({});
  const [successMsg, setSuccessMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Guest customer state (separate from formData to avoid confusion)
  const [guestName, setGuestName] = useState('');
  const [guestPhone, setGuestPhone] = useState('');

  // Filters
  const [searchText, setSearchText] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPayment, setFilterPayment] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [filterDateType, setFilterDateType] = useState('booking_date'); // 'booking_date' | 'journey_date'
  const [bookingTypeFilter, setBookingTypeFilter] = useState('Regular');

  // Delete dialog
  const [deleteDialog, setDeleteDialog] = useState({ open: false, id: null, name: '' });

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [bRes, vRes, dRes, eRes, pRes] = await Promise.all([
        axios.get(`${API}/bookings`),
        axios.get(`${API}/vehicles`),
        axios.get(`${API}/drivers`),
        axios.get(`${API}/customers`),
        axios.get(`${API}/plans`),
      ]);
      setBookings(bRes.data);
      setVehicles(vRes.data);
      setDrivers(dRes.data.filter(d => d.status === 'Active'));
      setEntities(eRes.data);
      setPlans(pRes.data);
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const validate = () => {
    const errs = {};
    // If guest mode, validate guestName instead
    const effectiveName = formData.is_guest ? guestName.trim() : formData.customer_name.trim();
    if (!effectiveName) errs.customer_name = 'Customer name is required.';
    if (!formData.journey_date) errs.journey_date = 'Journey date is required.';
    
    // Validate return date is equal to or after journey date
    if (formData.journey_date && formData.return_date) {
      if (formData.return_date < formData.journey_date) {
        errs.return_date = 'Return date must be equal to or greater than journey start date.';
      }
    }
    
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleChange = (field, value) => {
    setFormData(prev => {
      const nextData = { ...prev, [field]: value };
      // Auto-adjust return date if journey date is moved past it
      if (field === 'journey_date' && nextData.return_date && nextData.return_date < value) {
        nextData.return_date = value;
      }
      return nextData;
    });
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
    if (field === 'journey_date' || field === 'return_date') {
      setErrors(prev => ({ ...prev, journey_date: '', return_date: '' }));
    }
  };

  // Called by CustomerSearchPicker when a registered customer is selected OR guest mode toggled
  const handleCustomerSelect = (name, phone, isGuest) => {
    setFormData(prev => ({ ...prev, customer_name: name, customer_phone: phone, is_guest: isGuest }));
    if (isGuest) { setGuestName(''); setGuestPhone(''); }  // reset guest fields when switching to guest mode
    if (errors.customer_name) setErrors(prev => ({ ...prev, customer_name: '' }));
  };

  // Called by guest name/phone inputs inside CustomerSearchPicker
  const handleGuestChange = (field, value) => {
    if (field === 'name') setGuestName(value);
    if (field === 'phone') setGuestPhone(value);
    if (errors.customer_name) setErrors(prev => ({ ...prev, customer_name: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setIsSubmitting(true);
    try {
      // For guest customers, use the manually entered name/phone
      const finalName = formData.is_guest ? guestName.trim() : formData.customer_name;
      const finalPhone = formData.is_guest ? guestPhone.trim() : formData.customer_phone;

      const payload = {
        ...formData,
        customer_name: finalName,
        customer_phone: finalPhone,
        passengers: parseInt(formData.passengers) || 1,
        advance_amount: parseFloat(formData.advance_amount) || 0,
        total_amount: parseFloat(formData.total_amount) || 0,
      };

      if (editingId) {
        await axios.put(`${API}/bookings/${editingId}`, payload);
        setSuccessMsg('Booking updated successfully!');
      } else {
        await axios.post(`${API}/bookings`, payload);
        setSuccessMsg('Booking created successfully!');
      }

      setFormData(emptyForm);
      setEditingId(null);
      setErrors({});
      fetchAll();
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      console.error('Error saving booking:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (b) => {
    setEditingBookingId(b.id);
    navigateTo('booking-screen');
  };

  const handleMarkPaid = async (b) => {
    try {
      await axios.put(`${API}/bookings/${b.id}`, { ...b, payment_status: 'Paid' });
      setBookings(prev => prev.map(item => item.id === b.id ? { ...item, payment_status: 'Paid' } : item));
      setSuccessMsg(`Payment marked as Paid!`);
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      console.error('Error marking as paid:', err);
    }
  };

  const handleDeleteRequest = (b) => setDeleteDialog({ open: true, id: b.id, name: b.customer_name });

  const handleDeleteConfirm = async () => {
    try {
      await axios.delete(`${API}/bookings/${deleteDialog.id}`);
      setBookings(prev => prev.filter(b => b.id !== deleteDialog.id));
    } catch (err) {
      console.error('Error deleting booking:', err);
    } finally {
      setDeleteDialog({ open: false, id: null, name: '' });
    }
  };

  const cancelEdit = () => {
    setFormData(emptyForm);
    setGuestName('');
    setGuestPhone('');
    setEditingId(null);
    setErrors({});
  };

  const filteredBookings = bookings.filter(b => {
    const matchText = !searchText ||
      b.customer_name?.toLowerCase().includes(searchText.toLowerCase()) ||
      b.vehicle_number?.toLowerCase().includes(searchText.toLowerCase()) ||
      b.pickup_location?.toLowerCase().includes(searchText.toLowerCase()) ||
      b.drop_location?.toLowerCase().includes(searchText.toLowerCase());
    const matchStatus = !filterStatus || b.booking_status === filterStatus;
    const matchPayment = !filterPayment || b.payment_status === filterPayment;
    const matchDate = !filterDate || (b[filterDateType] && b[filterDateType] === filterDate);
    
    // Booking Type Filter (Regular vs Event)
    let matchType = true;
    if (bookingTypeFilter === 'Regular') {
      matchType = !b.event_id;
    } else if (bookingTypeFilter === 'Event') {
      matchType = !!b.event_id;
    }

    return matchText && matchStatus && matchPayment && matchDate && matchType;
  });

  const hasActiveFilters = searchText || filterStatus || filterPayment || filterDate;

  const clearFilters = () => {
    setSearchText('');
    setFilterStatus('');
    setFilterPayment('');
    setFilterDate('');
    setFilterDateType('booking_date');
  };

  const totalRevenue = bookings.filter(b => b.booking_status !== 'Cancelled').reduce((s, b) => {
    const plan = plans.find(p => p.id === b.plan_id);
    return s + (plan ? plan.rate : (b.total_amount || 0));
  }, 0);
  const totalAdvance = bookings.filter(b => b.booking_status !== 'Cancelled').reduce((s, b) => s + (b.advance_amount || 0), 0);
  const confirmedCount = bookings.filter(b => b.booking_status === 'Confirmed').length;
  const completedCount = bookings.filter(b => b.booking_status === 'Completed').length;

  const inputCls = (field) =>
    `w-full bg-slate-950 border ${errors[field] ? 'border-red-500' : 'border-slate-700'} outline-none rounded-xl px-3 py-2.5 text-sm text-slate-100 focus:border-indigo-500 transition placeholder-slate-600`;

  const selectCls = `w-full bg-slate-950 border border-slate-700 outline-none rounded-xl px-3 py-2.5 text-sm text-slate-100 cursor-pointer focus:border-indigo-500 transition`;

  return (
    <div className="space-y-6">
      <ConfirmDialog
        open={deleteDialog.open}
        title="Delete Booking"
        message={`Are you sure you want to delete the booking for "${deleteDialog.name}"? This action cannot be undone.`}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteDialog({ open: false, id: null, name: '' })}
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {[
          { label: 'Total Bookings', value: bookings.length, icon: BookOpen, color: 'indigo' },
          { label: 'Confirmed', value: confirmedCount, icon: Clock, color: 'blue' },
          { label: 'Completed', value: completedCount, icon: CheckCircle, color: 'emerald' },
          { label: 'Total Revenue', value: `₹${totalRevenue.toLocaleString('en-IN')}`, icon: CreditCard, color: 'violet' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="glass-panel p-3 sm:p-4 rounded-2xl border border-slate-700/50 shadow-lg">
            <div className="flex items-center gap-2 sm:gap-3 mb-2">
              <div className={`bg-${color}-500/15 p-1.5 sm:p-2 rounded-lg border border-${color}-500/30 shrink-0`}>
                <Icon className={`h-3.5 w-3.5 sm:h-4 sm:w-4 text-${color}-400`} />
              </div>
              <span className="text-[10px] sm:text-xs font-semibold text-slate-400 uppercase tracking-wider truncate" title={label}>{label}</span>
            </div>
            <div className="text-lg sm:text-2xl font-bold text-slate-50 truncate">{value}</div>
          </div>
        ))}
      </div>

      {/* Success Message */}
      {successMsg && (
        <div className="flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 p-4 rounded-xl">
          <CheckCircle className="h-5 w-5 shrink-0" />
          <span className="font-semibold text-sm">{successMsg}</span>
        </div>
      )}

      {/* Main Layout: List */}
      <div className="grid grid-cols-1 gap-6">

        {/* ── BOOKINGS LIST PANEL ── */}
        <div className="glass-panel rounded-2xl border border-slate-700/50 shadow-xl flex flex-col">

          {/* Filter Bar */}
          <div className="p-4 border-b border-slate-800/50 bg-slate-900/40 rounded-t-2xl space-y-3">

            {/* Booking Type Toggle */}
            <div className="flex gap-2 p-1 bg-slate-900 border border-slate-700/50 rounded-xl w-fit mb-2">
              {['Regular', 'Event', 'All'].map(type => (
                <button key={type} onClick={() => setBookingTypeFilter(type)}
                  className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${bookingTypeFilter === type ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'}`}>
                  {type === 'Regular' ? 'Point-to-Point Bookings' : type === 'Event' ? 'Event Bookings' : 'All Bookings'}
                </button>
              ))}
            </div>

            {/* Row 1: Search + Status + Payment */}
            <div className="flex flex-wrap gap-3 items-center">
              <div className="relative flex-1 min-w-[160px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search customer, vehicle, location..."
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 outline-none rounded-lg pl-9 pr-3 py-2 text-xs text-slate-100 placeholder-slate-600 focus:border-indigo-500 transition"
                />
              </div>
              <div className="w-40">
                <CustomSelect
                  value={filterStatus}
                  onChange={(val) => setFilterStatus(val)}
                  options={BOOKING_STATUSES}
                  placeholder="All Statuses"
                />
              </div>
              <div className="w-40">
                <CustomSelect
                  value={filterPayment}
                  onChange={(val) => setFilterPayment(val)}
                  options={PAYMENT_STATUSES}
                  placeholder="All Payments"
                />
              </div>
            </div>

            {/* Row 2: Date filter + Clear */}
            <div className="flex flex-wrap gap-3 items-center">
              <div className="flex items-center gap-2 bg-slate-950/60 border border-slate-700 rounded-lg px-2 py-1">
                <Calendar className="h-3 w-3 text-indigo-400 shrink-0" />
                <div className="w-36">
                  <CustomSelect
                    value={filterDateType}
                    onChange={(val) => setFilterDateType(val)}
                    options={[
                      { value: 'booking_date', label: 'Booking Date' },
                      { value: 'journey_date', label: 'Journey Date' }
                    ]}
                    className="border-none bg-transparent"
                  />
                </div>
              </div>

              <div className="flex-1 min-w-[160px] max-w-[220px]">
                <CustomDatePicker
                  value={filterDate}
                  onChange={(v) => setFilterDate(v)}
                  placeholder={filterDateType === 'booking_date' ? 'Filter by booking date...' : 'Filter by journey date...'}
                />
              </div>

              {filterDate && (
                <button
                  onClick={() => setFilterDate('')}
                  className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 px-2.5 py-1.5 rounded-lg transition"
                >
                  <X className="h-3 w-3" /> Clear Date
                </button>
              )}

              <div className="ml-auto flex items-center gap-3">
                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="flex items-center gap-1 text-xs text-amber-400 hover:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 px-2.5 py-1.5 rounded-lg transition"
                  >
                    <X className="h-3 w-3" /> Clear All
                  </button>
                )}
                <span className="text-xs text-slate-500 font-mono whitespace-nowrap">
                  {filteredBookings.length} / {bookings.length} records
                </span>
              </div>
            </div>
          </div>

          {/* Desktop Table View */}
          <div className="flex-1 overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[1000px]">
              <thead>
                <tr className="border-b border-slate-700 bg-slate-900/50 text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                  <th className="px-4 py-3">Booking ID</th>
                  <th className="px-4 py-3">Dates</th>
                  <th className="px-4 py-3">Client</th>
                  <th className="px-4 py-3">Route</th>
                  <th className="px-4 py-3">Vehicle</th>
                  <th className="px-4 py-3">Driver</th>
                  <th className="px-4 py-3 text-right">Amount</th>
                  <th className="px-4 py-3 text-center">Status</th>
                  <th className="px-4 py-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-sm text-slate-300">
                {loading ? (
                  <tr>
                    <td colSpan="9" className="py-20 text-center">
                      <div className="flex flex-col items-center justify-center gap-3 text-slate-500">
                        <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
                        <p className="text-sm font-medium">Loading bookings...</p>
                      </div>
                    </td>
                  </tr>
                ) : filteredBookings.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="py-20 text-center">
                      <div className="flex flex-col items-center justify-center gap-3 text-slate-600">
                        <BookOpen className="h-10 w-10" />
                        <p className="text-sm font-medium">No bookings found</p>
                        <p className="text-xs">Create a new booking using the form on the left</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredBookings.map((b) => {
                    const plan = plans.find(p => p.id === b.plan_id);
                    const amount = plan ? plan.rate : (b.total_amount || 0);

                    return (
                      <tr key={b.id} className="transition hover:bg-slate-800/30 group">
                        <td className="px-4 py-3 text-indigo-400 font-mono font-bold text-xs">{b.booking_id ? `#${b.booking_id}` : '—'}</td>
                        <td className="px-4 py-3">
                          <div className="flex flex-col gap-1 text-xs">
                            <span className="font-semibold text-slate-50">{b.journey_date}</span>
                            {b.return_date && <span className="text-slate-500">to {b.return_date}</span>}
                            {b.pickup_time && <span className="font-mono text-indigo-300">{b.pickup_time} {b.end_time && `- ${b.end_time}`}</span>}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-col">
                            <span className="text-slate-50 font-bold text-sm max-w-[150px] truncate">{b.customer_name}</span>
                            {b.customer_phone && <span className="text-slate-500 text-[10px] font-mono mt-0.5">{b.customer_phone}</span>}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-col gap-1 text-xs text-slate-300 max-w-[180px]">
                            <div className="flex items-start gap-1.5"><MapPin className="h-3 w-3 text-green-400 shrink-0 mt-0.5" /><span className="truncate">{b.pickup_location || '—'}</span></div>
                            {b.drop_location && <div className="flex items-start gap-1.5"><ArrowRight className="h-3 w-3 text-slate-600 shrink-0 mt-0.5" /><span className="truncate">{b.drop_location}</span></div>}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-col gap-1 text-xs">
                             <span className="text-sky-300 font-mono font-bold">{b.vehicle_number || '—'}</span>
                             {b.vehicle_type && <span className="text-slate-500 text-[10px]">{b.vehicle_type}</span>}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-col gap-1 text-xs">
                             <span className="text-violet-300 font-semibold max-w-[120px] truncate">{b.driver_name || <span className="text-slate-600 italic font-normal">Unassigned</span>}</span>
                             {b.passengers > 0 && <span className="text-slate-500 text-[10px]">{b.passengers} pax</span>}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex flex-col gap-1">
                            <span className="text-emerald-400 font-bold text-xs">{amount > 0 ? `₹${amount.toLocaleString('en-IN')}` : '—'}</span>
                            {b.advance_amount > 0 && <span className="text-[10px] text-slate-500">Adv: ₹{b.advance_amount.toLocaleString('en-IN')}</span>}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-col items-center gap-1.5">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap ${statusColor[b.booking_status] || 'bg-slate-700 text-slate-300'}`}>{b.booking_status}</span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap ${paymentColor[b.payment_status] || 'bg-slate-700 text-slate-300'}`}>{b.payment_status}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition">
                            {b.payment_status === 'Pending' && b.booking_status !== 'Cancelled' && (
                              <button onClick={() => handleMarkPaid(b)} className="p-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 transition" title="Mark Paid">
                                <CheckCircle className="h-4 w-4" />
                              </button>
                            )}
                            {!['Completed', 'Cancelled', 'Dispatched'].includes(b.booking_status) && (
                              <button onClick={() => handleEdit(b)} className="p-1.5 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 transition" title="Edit">
                                <Edit2 className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Bottom summary */}
          {filteredBookings.length > 0 && (
            <div className="p-3 border-t border-slate-800/50 flex gap-6 text-xs text-slate-500 bg-slate-900/30 rounded-b-2xl">
              <span>Advance Collected: <span className="text-amber-400 font-semibold">₹{totalAdvance.toLocaleString('en-IN')}</span></span>
              <span>Total Revenue: <span className="text-emerald-400 font-semibold">₹{totalRevenue.toLocaleString('en-IN')}</span></span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
