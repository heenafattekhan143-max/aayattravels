import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import axios from 'axios';
import {
  BookOpen, Plus, Search, Edit2, Trash2, CheckCircle,
  AlertTriangle, X, Car, User, MapPin, Calendar,
  Phone, CreditCard, Clock, ArrowRight, RefreshCw, Loader2, Building2, UserPlus, ChevronDown
} from 'lucide-react';
import CustomDatePicker from '../components/CustomDatePicker';
import CustomSelect from '../components/CustomSelect';
import CreatePlanModal from '../components/CreatePlanModal';

const API = '/api';

const TRIP_TYPES = ['One Way', 'Round Trip', 'Local'];
const BOOKING_STATUSES = ['Confirmed', 'Cancelled', 'Completed'];
const PAYMENT_STATUSES = ['Pending', 'Partial', 'Paid'];
const VEHICLE_TYPES = ['Sedan', 'SUV', 'Mini Bus', 'Tempo Traveller', 'Luxury', 'Others'];

function formatDate(d) {
  if (!d) return '—';
  const [y, m, day] = d.split('-');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${parseInt(day, 10)} ${months[parseInt(m, 10) - 1]} ${y}`;
}

function parseDateTime(dateStr, timeStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (timeStr) {
    const [hours, minutes] = timeStr.split(':');
    d.setHours(parseInt(hours, 10) || 0, parseInt(minutes, 10) || 0, 0, 0);
  } else {
    d.setHours(0, 0, 0, 0);
  }
  return d;
}

function doDateRangesOverlap(startA, endA, startB, endB) {
  if (!startA || !startB) return false;
  const actualEndA = endA || new Date(startA.getTime() + 24 * 60 * 60 * 1000 - 1);
  const actualEndB = endB || new Date(startB.getTime() + 24 * 60 * 60 * 1000 - 1);
  return startA <= actualEndB && startB <= actualEndA;
}

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
  plan_id: '',
  payment_status: 'Pending',
  booking_status: 'Confirmed',
  end_km: '',
  working_hours: '',
  remarks: '',
  gst_rate: 0,
};

const statusColor = {
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

/* ── Reusable Vehicle Dropdown ── */
function VehicleSelectDropdown({ vehicles, value, unavailableVehicleIds, onChange, disabled, placeholder }) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSelect = (v, isUnavailable) => {
    if (isUnavailable) return;
    onChange(v.vehicle_number, v.vehicle_type);
    setOpen(false);
  };

  const selectedVehicle = vehicles.find(v => v.vehicle_number === value);

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(!open)}
        className={`w-full flex items-center justify-between bg-slate-950 border ${disabled ? 'border-slate-800 opacity-50 cursor-not-allowed' : open ? 'border-indigo-500' : 'border-slate-700'} outline-none rounded-xl px-3 py-2.5 text-sm text-slate-100 transition`}
      >
        <span className={selectedVehicle ? 'text-slate-100 font-semibold' : 'text-slate-500'}>
          {selectedVehicle ? selectedVehicle.vehicle_number : placeholder}
        </span>
        <ChevronDown className={`h-4 w-4 text-slate-500 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && !disabled && (
        <div className="absolute z-50 mt-2 w-full bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden">
          <div className="max-h-52 overflow-y-auto py-1">
            <button
              type="button"
              onMouseDown={() => { onChange('', ''); setOpen(false); }}
              className="w-full text-left px-4 py-2.5 text-sm font-semibold text-slate-400 hover:bg-slate-800 hover:text-slate-50 transition border-b border-slate-800"
            >
              -- Select Vehicle --
            </button>
            {vehicles.map(v => {
              const isUnavailable = unavailableVehicleIds.includes(v.vehicle_number);
              return (
                <button
                  key={v.id || v.vehicle_number}
                  type="button"
                  onMouseDown={(e) => { e.preventDefault(); handleSelect(v, isUnavailable); }}
                  disabled={isUnavailable}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm transition ${
                    isUnavailable 
                      ? 'opacity-50 cursor-not-allowed bg-slate-900/50' 
                      : 'hover:bg-indigo-500/10 hover:text-indigo-300'
                  }`}
                >
                  <div className={`p-1.5 rounded-lg border shrink-0 ${isUnavailable ? 'bg-slate-800 border-slate-700 text-slate-500' : 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400'}`}>
                    <Car className="h-3 w-3" />
                  </div>
                  <div className="flex flex-col">
                    <span className={`font-semibold ${isUnavailable ? 'text-slate-500' : 'text-slate-200'}`}>
                      {v.vehicle_number}
                    </span>
                    <span className={`text-[11px] font-medium mt-0.5 ${isUnavailable ? 'text-slate-600' : 'text-slate-400'}`}>
                      {v.vehicle_type} {v.driver_name ? `• ${v.driver_name}` : ''}
                    </span>
                  </div>
                  {isUnavailable && (
                    <span className="ml-auto text-[10px] font-bold text-amber-500/70 border border-amber-500/20 bg-amber-500/10 px-1.5 py-0.5 rounded uppercase tracking-wider">
                      Booked
                    </span>
                  )}
                </button>
              );
            })}
          </div>
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
export default function BookingScreen({ navigateTo, editingBookingId, setEditingBookingId }) {
  const [bookings, setBookings] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [entities, setEntities] = useState([]);   // ← customers + vendors
  const [plans, setPlans] = useState([]);         // ← all plans
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [errors, setErrors] = useState({});
  const [successMsg, setSuccessMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Guest customer state (separate from formData to avoid confusion)
  const [guestName, setGuestName] = useState('');
  const [guestPhone, setGuestPhone] = useState('');

  const [showCreatePlanModal, setShowCreatePlanModal] = useState(false);
  const [guestPlanDetails, setGuestPlanDetails] = useState(null);

  // Filters
  const [searchText, setSearchText] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPayment, setFilterPayment] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [filterDateType, setFilterDateType] = useState('booking_date'); // 'booking_date' | 'journey_date'

  // Delete dialog
  const [deleteDialog, setDeleteDialog] = useState({ open: false, id: null, name: '' });

  const unavailableVehicleIds = useMemo(() => {
    if (!formData.journey_date) return [];
    
    const reqStart = parseDateTime(formData.journey_date, formData.pickup_time);
    const reqEnd = parseDateTime(formData.return_date || formData.journey_date, formData.end_time || '23:59');

    if (!reqStart) return [];

    const unavailable = new Set();

    bookings.forEach(b => {
      if (editingId && b.id === editingId) return;
      if (b.booking_status === 'Cancelled') return;
      if (!b.vehicle_number) return;

      const bStart = parseDateTime(b.journey_date, b.pickup_time);
      const bEnd = parseDateTime(b.return_date || b.journey_date, b.end_time || '23:59');
      
      if (doDateRangesOverlap(reqStart, reqEnd, bStart, bEnd)) {
        unavailable.add(b.vehicle_number);
      }
    });

    return Array.from(unavailable);
  }, [formData.journey_date, formData.pickup_time, formData.return_date, formData.end_time, bookings, editingId]);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [vRes, dRes, eRes, bRes, pRes] = await Promise.all([
        axios.get(`${API}/vehicles`),
        axios.get(`${API}/drivers`),
        axios.get(`${API}/customers`),
        axios.get(`${API}/bookings`),
        axios.get(`${API}/plans`),
      ]);
      setVehicles(vRes.data);
      setDrivers(dRes.data.filter(d => d.status === 'Active'));
      setEntities(eRes.data);
      setBookings(bRes.data);
      setPlans(pRes.data);
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  useEffect(() => {
    if (editingBookingId) {
      fetchBookingForEdit(editingBookingId);
    }
  }, [editingBookingId]);

  const fetchBookingForEdit = async (id) => {
    try {
      const res = await axios.get(`${API}/bookings/${id}`);
      handleEdit(res.data);
    } catch (err) {
      console.error("Failed to load booking for editing:", err);
    }
  };

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

      if (formData.booking_status === 'Completed') {
        if (!formData.end_km) errs.end_km = 'Required for billing.';
        if (!formData.working_hours) errs.working_hours = 'Required for billing.';
        if (!formData.plan_id) errs.plan_id = 'A package plan is required to generate the bill.';
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
        end_km: formData.end_km ? parseInt(formData.end_km) : null,
        working_hours: formData.working_hours ? parseInt(formData.working_hours) : null,
        booking_status: editingBookingId ? formData.booking_status : 'Confirmed',
      };

      if (editingBookingId) {
        await axios.put(`${API}/bookings/${editingBookingId}`, payload);
        setSuccessMsg('Booking updated successfully!');
      } else {
        await axios.post(`${API}/bookings`, payload);
        setSuccessMsg('Booking created successfully!');
      }

      setFormData(emptyForm);
      if (setEditingBookingId) setEditingBookingId(null);
      setEditingId(null);
      setErrors({});
      setTimeout(() => {
        setSuccessMsg('');
        navigateTo('booking-list');
      }, 1500);
    } catch (err) {
      console.error('Error saving booking:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (b) => {
    const wasGuest = b.is_guest || false;
    setFormData({
      booking_id: b.booking_id || '',
      booking_date: b.booking_date || '',
      customer_name: wasGuest ? '' : (b.customer_name || ''),
      customer_phone: wasGuest ? '' : (b.customer_phone || ''),
      is_guest: wasGuest,
      pickup_location: b.pickup_location || '',
      drop_location: b.drop_location || '',
      pickup_time: b.pickup_time || '',
      end_time: b.end_time || '',
      pickup_address: b.pickup_address || '',
      journey_date: b.journey_date || '',
      return_date: b.return_date || '',
      vehicle_number: b.vehicle_number || '',
      driver_name: b.driver_name || '',
      trip_type: b.trip_type || 'One Way',
      vehicle_type: b.vehicle_type || '',
      passengers: b.passengers || 1,
      advance_amount: b.advance_amount ?? '',
      plan_id: b.plan_id || '',
      payment_status: b.payment_status || 'Pending',
      booking_status: b.booking_status || 'Confirmed',
      end_km: b.end_km || '',
      working_hours: b.working_hours || '',
      remarks: b.remarks || '',
    });
    if (wasGuest) { setGuestName(b.customer_name || ''); setGuestPhone(b.customer_phone || ''); }
    else { setGuestName(''); setGuestPhone(''); }
    setEditingId(b.id || b._id || editingBookingId);
    setErrors({});
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
    if (setEditingBookingId) setEditingBookingId(null);
    setEditingId(null);
    setErrors({});
    navigateTo('booking-list');
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
    return matchText && matchStatus && matchPayment && matchDate;
  });

  const hasActiveFilters = searchText || filterStatus || filterPayment || filterDate;

  const clearFilters = () => {
    setSearchText('');
    setFilterStatus('');
    setFilterPayment('');
    setFilterDate('');
    setFilterDateType('booking_date');
  };

  const totalAdvance = bookings.filter(b => b.booking_status !== 'Cancelled').reduce((s, b) => s + (b.advance_amount || 0), 0);
  const confirmedCount = bookings.filter(b => b.booking_status === 'Confirmed').length;
  const completedCount = bookings.filter(b => b.booking_status === 'Completed').length;

  const selectedEntity = entities.find(e => e.phone === formData.customer_phone);
  const selectedCustomerId = selectedEntity ? selectedEntity.id : null;
  const availablePlans = formData.is_guest 
    ? plans.filter(p => p.customer_type === 'customer' || !p.customer_id) 
    : (selectedCustomerId ? plans.filter(p => p.customer_id === selectedCustomerId) : []);
  const planOptions = availablePlans.map(p => ({ value: p.id, label: `${p.plan_name} (₹${p.rate})` }));

  const inputCls = (field) =>
    `w-full bg-slate-950 border ${errors[field] ? 'border-red-500' : 'border-slate-700'} outline-none rounded-xl px-3 py-2.5 text-sm text-slate-100 focus:border-indigo-500 transition placeholder-slate-600`;

  const selectCls = `w-full bg-slate-950 border border-slate-700 outline-none rounded-xl px-3 py-2.5 text-sm text-slate-100 cursor-pointer focus:border-indigo-500 transition`;

  return (
    <div className="w-full max-w-[1600px] mx-auto space-y-6 pb-20">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold text-slate-50 flex items-center gap-2">
          {editingId ? <><Edit2 className="h-5 w-5 text-amber-400" /> Edit Booking</> : <><Plus className="h-5 w-5 text-indigo-400" /> New Booking</>}
        </h3>
        {editingId && (
          <button type="button" onClick={cancelEdit} className="flex items-center gap-1 text-xs font-semibold text-slate-400 hover:text-slate-200 transition">
            <X className="h-4 w-4" /> Cancel Edit
          </button>
        )}
      </div>

      {/* Success Message */}
      {successMsg && (
        <div className="flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 p-4 rounded-xl shadow-lg">
          <CheckCircle className="h-5 w-5 shrink-0" />
          <span className="font-semibold text-sm">{successMsg}</span>
        </div>
      )}

      {/* ── FORM ── */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 xl:gap-5 items-stretch">
          
          {/* ── LEFT COLUMN (CARD 1) ── */}
          <div className="glass-panel rounded-2xl border border-slate-700/50 shadow-xl p-5 md:p-6 space-y-8">
            
            {/* Section 1: Customer & Route */}
            <div className="space-y-4">
              <h4 className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-2 border-b border-slate-800 pb-2 flex items-center gap-2">
                <User className="h-4 w-4 text-indigo-400" /> Customer & Route
              </h4>
              
              {/* SEARCHABLE CUSTOMER PICKER */}
              <div className="relative">
                <CustomerSearchPicker
                  entities={entities}
                  value={formData.customer_name}
                  phone={formData.customer_phone}
                  isGuest={formData.is_guest}
                  guestName={guestName}
                  guestPhone={guestPhone}
                  onChange={handleCustomerSelect}
                  onGuestChange={handleGuestChange}
                  error={errors.customer_name}
                />
              </div>

              {/* Pickup From / Drop To */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <MapPin className="h-3 w-3 text-green-400" /> From (City)
                  </label>
                  <input
                    type="text"
                    placeholder="Departure city"
                    value={formData.pickup_location}
                    onChange={(e) => handleChange('pickup_location', e.target.value)}
                    className={inputCls('pickup_location')}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <MapPin className="h-3 w-3 text-red-400" /> To (City)
                  </label>
                  <input
                    type="text"
                    placeholder="Destination city"
                    value={formData.drop_location}
                    onChange={(e) => handleChange('drop_location', e.target.value)}
                    className={inputCls('drop_location')}
                  />
                </div>
              </div>

              {/* Pickup Address */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <MapPin className="h-3 w-3 text-indigo-400" /> Pickup Address / Location
                </label>
                <input
                  type="text"
                  placeholder="e.g. Hotel name, landmark, full address..."
                  value={formData.pickup_address}
                  onChange={(e) => handleChange('pickup_address', e.target.value)}
                  className={inputCls('pickup_address')}
                />
              </div>
            </div>

            {/* Section 2: Travel Schedule */}
            <div className="space-y-4">
              <h4 className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-2 border-b border-slate-800 pb-2 flex items-center gap-2">
                <Calendar className="h-4 w-4 text-blue-400" /> Travel Schedule
              </h4>
              
              {/* Journey Date + Return Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Journey Date *</label>
                  <CustomDatePicker
                    value={formData.journey_date}
                    onChange={(v) => handleChange('journey_date', v)}
                    placeholder="Journey date"
                  />
                  {errors.journey_date && <p className="text-xs text-red-400">{errors.journey_date}</p>}
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Return Date</label>
                  <CustomDatePicker
                    value={formData.return_date}
                    onChange={(v) => handleChange('return_date', v)}
                    placeholder="Return date"
                    minDate={formData.journey_date}
                  />
                  {errors.return_date && <p className="text-xs text-red-400">{errors.return_date}</p>}
                </div>
              </div>

              {/* Times & Trip Type */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <Clock className="h-3 w-3 text-indigo-400" /> Start Time
                  </label>
                  <input
                    type="time"
                    value={formData.pickup_time}
                    onChange={(e) => handleChange('pickup_time', e.target.value)}
                    className={`${inputCls('pickup_time')} [color-scheme:dark]`}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <Clock className="h-3 w-3 text-indigo-400" /> End Time
                  </label>
                  <input
                    type="time"
                    value={formData.end_time || ''}
                    onChange={(e) => handleChange('end_time', e.target.value)}
                    className={`${inputCls('end_time')} [color-scheme:dark]`}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Trip Type</label>
                  <CustomSelect
                    value={formData.trip_type}
                    onChange={(val) => handleChange('trip_type', val)}
                    options={TRIP_TYPES}
                    placeholder="-- Select Trip Type --"
                  />
                </div>
              </div>
            </div>

          </div>

          {/* ── RIGHT COLUMN (CARD 2) ── */}
          <div className="glass-panel rounded-2xl border border-slate-700/50 shadow-xl p-5 md:p-6 flex flex-col justify-between">
            <div className="space-y-8">
              


              {/* Section 3: Financials & Status */}
              <div className="space-y-4">
                <h4 className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-2 border-b border-slate-800 pb-2 flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-amber-400" /> Financials & Status
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1 sm:col-span-2">
                    {formData.is_guest ? (
                      <>
                        <label className="text-xs font-semibold text-slate-300 block mb-1">Custom Package</label>
                        {!guestPlanDetails ? (
                          <button
                            type="button"
                            onClick={() => setShowCreatePlanModal(true)}
                            className="w-full py-2.5 border border-dashed border-indigo-500/50 bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 hover:border-indigo-400 rounded-xl text-sm font-semibold transition flex items-center justify-center gap-2"
                          >
                            <Plus className="h-4 w-4" /> Create Package
                          </button>
                        ) : (
                          <div className="p-4 bg-slate-900 border border-slate-700 rounded-xl relative group">
                            <button
                              type="button"
                              onClick={() => { setGuestPlanDetails(null); handleChange('plan_id', ''); }}
                              className="absolute top-2 right-2 text-slate-500 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition p-1"
                              title="Remove package"
                            >
                              <X className="h-4 w-4" />
                            </button>
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <div className="text-sm font-bold text-slate-50">{guestPlanDetails.plan_name}</div>
                                <div className="text-xs text-slate-400 mt-0.5">{guestPlanDetails.plan_type} Plan</div>
                              </div>
                              <div className="text-right">
                                <div className="text-sm font-bold text-emerald-400">₹{guestPlanDetails.rate}</div>
                                <div className="text-[10px] text-slate-500 uppercase">Base Rate</div>
                              </div>
                            </div>
                            <div className="flex flex-wrap gap-2 mt-3 text-[11px] font-medium text-slate-300">
                              {guestPlanDetails.base_km && <span className="bg-slate-800 px-2 py-1 rounded">{guestPlanDetails.base_km} KMs included</span>}
                              {guestPlanDetails.base_hours && <span className="bg-slate-800 px-2 py-1 rounded">{guestPlanDetails.base_hours} Hrs included</span>}
                              {guestPlanDetails.extra_km_rate > 0 && <span className="bg-slate-800 px-2 py-1 rounded">₹{guestPlanDetails.extra_km_rate}/extra km</span>}
                              {guestPlanDetails.extra_hours_rate > 0 && <span className="bg-slate-800 px-2 py-1 rounded">₹{guestPlanDetails.extra_hours_rate}/extra hr</span>}
                            </div>
                          </div>
                        )}
                      </>
                    ) : (
                      <>
                        <label className="text-xs font-semibold text-slate-300">Select Plan</label>
                        <CustomSelect
                          value={formData.plan_id}
                          onChange={(val) => handleChange('plan_id', val)}
                          options={planOptions}
                          placeholder="-- Select Plan --"
                        />
                      </>
                    )}
                  </div>
                  
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-300">Advance (₹)</label>
                    <input type="number" placeholder="0" value={formData.advance_amount}
                      onChange={(e) => handleChange('advance_amount', e.target.value)} className={inputCls('advance_amount')} />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-300">GST Rate (%)</label>
                    <CustomSelect
                      value={formData.gst_rate}
                      onChange={(val) => handleChange('gst_rate', Number(val))}
                      hidePlaceholder={true}
                      options={[
                        { value: 0, label: '0% (No GST)' },
                        { value: 5, label: '5%' },
                        { value: 10, label: '10%' },
                        { value: 20, label: '20%' },
                        { value: 30, label: '30%' },
                      ]}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-300">Payment Status</label>
                    <CustomSelect
                      value={formData.payment_status}
                      onChange={(val) => handleChange('payment_status', val)}
                      options={PAYMENT_STATUSES}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-300">Booking Status</label>
                    <CustomSelect
                      value={formData.booking_status}
                      onChange={(val) => handleChange('booking_status', val)}
                      options={BOOKING_STATUSES}
                    />
                  </div>
                </div>

                {formData.booking_status === 'Completed' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                    <div className="space-y-1 sm:col-span-2 mb-1">
                      <p className="text-xs font-bold text-emerald-400">Completion Details (Used for auto-billing)</p>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-emerald-100">Total KM Driven *</label>
                      <input type="number" placeholder="e.g. 350" value={formData.end_km} required
                        onChange={(e) => handleChange('end_km', e.target.value)} className={inputCls('end_km')} />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-emerald-100">Total Working Hours *</label>
                      <input type="number" placeholder="e.g. 10" value={formData.working_hours} required
                        onChange={(e) => handleChange('working_hours', e.target.value)} className={inputCls('working_hours')} />
                    </div>
                  </div>
                )}

                {/* Remarks */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Remarks</label>
                  <textarea rows={2} placeholder="Any additional notes..."
                    value={formData.remarks}
                    onChange={(e) => handleChange('remarks', e.target.value)}
                    className={`${inputCls('remarks')} resize-none`}
                  />
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-6 mt-6 border-t border-slate-700/50">
              <button
                type="submit" disabled={isSubmitting}
                className={`w-full py-3 font-bold text-sm tracking-wide rounded-xl transition shadow-lg flex items-center justify-center gap-2 ${editingId
                    ? 'bg-amber-600 hover:bg-amber-500 shadow-amber-500/25'
                    : 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-500/25'
                  } text-slate-50 disabled:opacity-50`}
              >
                {isSubmitting ? (
                  <><Loader2 className="h-5 w-5 animate-spin" /> Saving...</>
                ) : editingId ? (
                  <><Edit2 className="h-5 w-5" /> Update Booking</>
                ) : (
                  <><Plus className="h-5 w-5" /> Create Booking</>
                )}
              </button>
            </div>
            
          </div>
        </div>
      </form>

      {showCreatePlanModal && (
        <CreatePlanModal
          onClose={() => setShowCreatePlanModal(false)}
          onSuccess={(newPlan) => {
            setGuestPlanDetails(newPlan);
            handleChange('plan_id', newPlan.id);
            setPlans(prev => [...prev, newPlan]);
            setShowCreatePlanModal(false);
          }}
        />
      )}
    </div>
  );
}
