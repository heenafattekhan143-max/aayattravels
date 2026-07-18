import React, { useState, useEffect, useMemo, useRef } from 'react';
import axios from 'axios';
import {
  Users, FileText, DollarSign, BookOpen, MapPin, Clock, Calendar,
  User, RefreshCw, Car, ArrowRight, ShoppingCart, Search, Filter,
  X, CheckCircle, AlertTriangle, Truck, Ban, CheckSquare, Receipt,
  TrendingUp, ChevronDown, Sun, Moon, Phone, CreditCard, Navigation,
  Hash, UserCheck, IndianRupee, Plus
} from 'lucide-react';
import CustomDatePicker from '../components/CustomDatePicker';
import { useConfirm } from '../context/ConfirmContext';

const API = '/api';

const STATUS_FILTERS = [
  { key: 'all', label: 'All', color: 'indigo' },
  { key: 'Confirmed', label: 'Confirmed', color: 'blue' },
  { key: 'Pending', label: 'Pending', color: 'amber' },
  { key: 'Dispatch Pending', label: 'Dispatch Pending', color: 'orange' },
  { key: 'Dispatched', label: 'Dispatched', color: 'purple' },
  { key: 'Completed', label: 'Completed', color: 'emerald' },
  { key: 'Cancelled', label: 'Cancelled', color: 'rose' }
];

const colorMap = {
  indigo: { btn: 'bg-indigo-600 text-white border-indigo-600', badge: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30' },
  blue: { btn: 'bg-blue-600 text-white border-blue-600', badge: 'bg-blue-500/15 text-blue-400 border-blue-500/30' },
  amber: { btn: 'bg-amber-500 text-slate-900 border-amber-500', badge: 'bg-amber-500/15 text-amber-400 border-amber-500/30' },
  orange: { btn: 'bg-orange-500 text-slate-50 border-orange-500', badge: 'bg-orange-500/15 text-orange-400 border-orange-500/30' },
  emerald: { btn: 'bg-emerald-600 text-white border-emerald-600', badge: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' },
  rose: { btn: 'bg-rose-600 text-white border-rose-600', badge: 'bg-rose-500/15 text-rose-400 border-rose-500/30' },
  red: { btn: 'bg-red-700 text-white border-red-700', badge: 'bg-red-500/15 text-red-400 border-red-500/30' },
  purple: { btn: 'bg-purple-600 text-white border-purple-600', badge: 'bg-purple-500/15 text-purple-400 border-purple-500/30' },
};

const paymentBadge = {
  Pending: 'bg-amber-500/15 text-amber-400 border border-amber-500/30',
  Partial: 'bg-orange-500/15 text-orange-400 border border-orange-500/30',
  Paid: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
};

const statusBorderColor = {
  Confirmed: '#3b82f6',
  Pending: '#f59e0b',
  'Dispatch Pending': '#f97316',
  Dispatched: '#a855f7',
  Completed: '#10b981',
  Cancelled: '#f43f5e',
  'No Show': '#ef4444',
};

const statusRowBg = {
  Confirmed: 'bg-slate-900 hover:bg-slate-800/50',
  Pending: 'bg-slate-900 hover:bg-slate-800/50',
  'Dispatch Pending': 'bg-slate-900 hover:bg-slate-800/50',
  Dispatched: 'bg-slate-900 hover:bg-slate-800/50',
  Completed: 'bg-slate-900 hover:bg-slate-800/50',
  Cancelled: 'bg-slate-900 hover:bg-slate-800/50',
  'No Show': 'bg-slate-900 hover:bg-slate-800/50',
};

function todayStr() { return new Date().toISOString().split('T')[0]; }

function formatDate(d) {
  if (!d) return '—';
  const [y, m, day] = d.split('-');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${parseInt(day, 10)} ${months[parseInt(m, 10) - 1]} ${y}`;
}

/* ───── BOOKING DETAIL MODAL ───── */
import PortalDropdown from '../components/PortalDropdown';
import CustomSelect from '../components/CustomSelect';

function AllotmentModal({ booking, onClose, onSave, vehicles, drivers, allBookings }) {
  const [selectedVehicle, setSelectedVehicle] = useState(booking?.vehicle_number || '');
  const [vehicleType, setVehicleType] = useState(booking?.vehicle_type || '');
  const [selectedDriver, setSelectedDriver] = useState(booking?.driver_name || '');
  const [passengers, setPassengers] = useState(booking?.passengers || 1);
  const [pickupTime, setPickupTime] = useState(booking?.pickup_time || '');
  const [note, setNote] = useState(booking?.note || '');
  const [ownershipType, setOwnershipType] = useState('All');
  const [isGuestVehicle, setIsGuestVehicle] = useState(false);
  const [isGuestDriver, setIsGuestDriver] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter vehicles
  const filteredVehicles = React.useMemo(() => {
    if (!vehicles) return [];
    return vehicles.filter(v => {
      if (ownershipType !== 'All' && v.ownership_type !== ownershipType) return false;
      const isAllocated = (allBookings || []).some(b =>
        b.journey_date === booking.journey_date &&
        b.vehicle_number === v.vehicle_number &&
        b.id !== booking.id &&
        ['Confirmed', 'Dispatch Pending', 'Pending'].includes(b.booking_status)
      );
      return !isAllocated;
    });
  }, [vehicles, ownershipType, allBookings, booking.journey_date, booking.id]);

  // Filter drivers based on availability
  const filteredDrivers = React.useMemo(() => {
    if (!drivers) return [];
    return drivers.filter(d => {
      const isAllocated = (allBookings || []).some(b =>
        b.journey_date === booking.journey_date &&
        b.driver_name === d.name &&
        b.id !== booking.id &&
        ['Confirmed', 'Dispatched', 'Dispatch Pending', 'Pending'].includes(b.booking_status)
      );
      return !isAllocated;
    });
  }, [drivers, allBookings, booking.journey_date, booking.id]);

  // Auto-fill vehicle type when vehicle changes
  useEffect(() => {
    if (!isGuestVehicle) {
      if (selectedVehicle) {
        const veh = vehicles.find(v => v.vehicle_number === selectedVehicle);
        if (veh) setVehicleType(veh.model || veh.vehicle_type || '');
      } else {
        setVehicleType('');
      }
    }
  }, [selectedVehicle, vehicles, isGuestVehicle]);

  const handleSave = async () => {
    if (!selectedVehicle || !selectedDriver) {
      alert("Please select both a vehicle and a driver.");
      return;
    }
    setIsSubmitting(true);
    await onSave(booking.id, {
      vehicle_number: selectedVehicle,
      vehicle_type: vehicleType,
      driver_name: selectedDriver,
      passengers: parseInt(passengers, 10) || 1,
      pickup_time: pickupTime,
      note: note,
      booking_status: 'Dispatched'
    });
    setIsSubmitting(false);
  };

  if (!booking) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{ animation: 'fadeInUp 0.25s ease-out both' }}
    >
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700/60 rounded-3xl shadow-2xl shadow-black/60 overflow-hidden"
        style={{ animation: 'fadeInUp 0.3s ease-out both' }}>

        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-800/60 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center shrink-0">
            <Car className="h-4 w-4 text-emerald-400" />
          </div>
          <h2 className="text-lg font-bold text-slate-100 uppercase tracking-wider">Dispatch Info</h2>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          {/* Ownership Toggle */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-400 uppercase flex items-center gap-1.5">
              <Car className="h-3 w-3" /> Vehicle Ownership
            </label>
            <CustomSelect
              value={ownershipType}
              onChange={(val) => {
                setOwnershipType(val);
                setSelectedVehicle('');
                setVehicleType('');
              }}
              options={[
                { value: 'All', label: 'All' },
                { value: 'Owner', label: 'Owner' },
                { value: 'Vendor', label: 'Vendor' }
              ]}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400 uppercase flex items-center justify-between w-full">
                <span className="flex items-center gap-1.5"><Car className="h-3 w-3" /> Vehicle No.</span>
                {isGuestVehicle && (
                  <button type="button" onClick={() => { setIsGuestVehicle(false); setSelectedVehicle(''); setVehicleType(''); }} className="text-[10px] text-red-400 hover:text-red-300 transition font-bold">
                    Cancel Guest
                  </button>
                )}
              </label>
              {isGuestVehicle ? (
                <input
                  type="text"
                  value={selectedVehicle}
                  onChange={(e) => setSelectedVehicle(e.target.value.toUpperCase())}
                  placeholder="Enter Guest Vehicle No."
                  className="w-full bg-slate-950 border border-slate-700 focus:border-indigo-500 text-slate-100 rounded-xl px-3 py-2.5 text-sm outline-none transition uppercase"
                  autoFocus
                />
              ) : (
                <CustomSelect
                  value={selectedVehicle}
                  onChange={setSelectedVehicle}
                  options={filteredVehicles.map(v => ({
                    value: v.vehicle_number,
                    label: `${v.vehicle_number} (${v.ownership_type === 'Owner' ? 'Owner' : 'Vendor'})`,
                    dropdownLabel: (
                      <div className="flex flex-col w-full text-left">
                        <div className="flex items-center gap-2">
                          <span>{v.vehicle_number}</span>
                          <span className={`text-[9px] px-1.5 py-0.5 rounded-full border ${v.ownership_type === 'Owner' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30' : 'bg-amber-500/10 text-amber-400 border-amber-500/30'}`}>
                            {v.ownership_type === 'Owner' ? 'Owner' : 'Vendor'}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-normal mt-0.5">
                          {v.vehicle_type} • {v.driver_name || 'Unassigned'}
                        </span>
                      </div>
                    )
                  }))}
                  placeholder="-- Select Vehicle --"
                  actionButton={{
                    label: '+ Add Guest Vehicle',
                    onClick: () => {
                      setIsGuestVehicle(true);
                      setSelectedVehicle('');
                      setVehicleType('');
                    }
                  }}
                />
              )}
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400 uppercase flex items-center gap-1.5">
                <Car className="h-3 w-3" /> Vehicle Type
              </label>
              <input
                type="text"
                readOnly={!isGuestVehicle}
                value={vehicleType}
                onChange={(e) => isGuestVehicle && setVehicleType(e.target.value)}
                placeholder={isGuestVehicle ? "Enter Vehicle Type / Model" : "Auto-filled on selection"}
                className={`w-full ${isGuestVehicle ? 'bg-slate-950 border border-slate-700 focus:border-indigo-500 text-slate-100 cursor-text' : 'bg-slate-950/50 border border-slate-800 text-slate-400 cursor-not-allowed'} rounded-xl px-3 py-2.5 text-sm outline-none transition`}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400 uppercase flex items-center justify-between w-full">
                <span>Driver</span>
                {isGuestDriver && (
                  <button type="button" onClick={() => { setIsGuestDriver(false); setSelectedDriver(''); }} className="text-[10px] text-red-400 hover:text-red-300 transition font-bold">
                    Cancel Guest
                  </button>
                )}
              </label>
              {isGuestDriver ? (
                <input
                  type="text"
                  value={selectedDriver}
                  onChange={(e) => setSelectedDriver(e.target.value)}
                  placeholder="Enter Guest Driver Name"
                  className="w-full bg-slate-950 border border-slate-700 focus:border-indigo-500 text-slate-100 rounded-xl px-3 py-2.5 text-sm outline-none transition"
                  autoFocus
                />
              ) : (
                <CustomSelect
                  value={selectedDriver}
                  onChange={setSelectedDriver}
                  options={filteredDrivers.map(d => ({ value: d.name, label: d.name }))}
                  placeholder="-- Select Driver --"
                  actionButton={{
                    label: '+ Add Guest Driver',
                    onClick: () => {
                      setIsGuestDriver(true);
                      setSelectedDriver('');
                    }
                  }}
                />
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400 uppercase">Passengers</label>
              <input
                type="number"
                min="1"
                value={passengers}
                onChange={(e) => setPassengers(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 focus:border-indigo-500 text-slate-100 rounded-xl px-3 py-2.5 text-sm outline-none transition"
              />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-semibold text-slate-400 uppercase">Journey Start Time</label>
              <input
                type="time"
                value={pickupTime}
                onChange={(e) => setPickupTime(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 focus:border-indigo-500 text-slate-100 rounded-xl px-3 py-2.5 text-sm outline-none transition [color-scheme:dark]"
              />
            </div>
          </div>

          {/* Note Field */}
          <div className="space-y-1.5 mt-2">
            <label className="text-xs font-semibold text-slate-400 uppercase">Note <span className="text-slate-500 lowercase">(Optional)</span></label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Add any extra notes..."
              rows={2}
              className="w-full bg-slate-950 border border-slate-700 focus:border-indigo-500 text-slate-100 rounded-xl px-3 py-2.5 text-sm outline-none transition resize-none"
            ></textarea>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800/60 bg-slate-900/50 flex items-center justify-end gap-3">
          <button onClick={onClose} disabled={isSubmitting} className="px-4 py-2 text-sm font-bold bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white rounded-xl transition disabled:opacity-50">
            Cancel
          </button>
          <button onClick={handleSave} disabled={isSubmitting} className="px-5 py-2 text-sm font-bold bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition shadow-lg shadow-indigo-500/25 flex items-center gap-2 disabled:opacity-50">
            {isSubmitting ? 'Saving...' : 'Allot Vehicle'}
          </button>
        </div>
      </div>
    </div>
  );
}

function CloseBookingModal({ booking, onClose, onSave }) {
  const [endKm, setEndKm] = useState(booking?.end_km || '');
  const [closeTime, setCloseTime] = useState(booking?.end_time || new Date().toTimeString().slice(0, 5));
  const [workingHours, setWorkingHours] = useState(booking?.working_hours || '');
  const [note, setNote] = useState(booking?.note || '');
  const [paymentStatus, setPaymentStatus] = useState(booking?.payment_status || 'Pending');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Auto-calculate working hours when closeTime changes
  useEffect(() => {
    if (booking?.pickup_time && closeTime) {
      const [startHr, startMin] = booking.pickup_time.split(':').map(Number);
      const [endHr, endMin] = closeTime.split(':').map(Number);

      let diffHr = endHr - startHr;
      let diffMin = endMin - startMin;

      if (diffMin < 0) {
        diffHr -= 1;
        diffMin += 60;
      }
      if (diffHr < 0) {
        diffHr += 24;
      }

      const hours = diffHr + (diffMin / 60);
      setWorkingHours(Math.ceil(hours) + 1); // Add 1 additional hour as requested
    }
  }, [closeTime, booking?.pickup_time]);

  const handleSave = async () => {
    if (!endKm) {
      alert("Please enter the KM travelled.");
      return;
    }
    setIsSubmitting(true);
    await onSave(booking.id, {
      end_km: parseInt(endKm, 10),
      end_time: closeTime,
      working_hours: parseInt(workingHours, 10) || 0,
      note: note,
      payment_status: paymentStatus,
      booking_status: 'Completed'
    });
    setIsSubmitting(false);
  };

  if (!booking) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{ animation: 'fadeInUp 0.25s ease-out both' }}
    >
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-sm bg-slate-900 border border-slate-700/60 rounded-3xl shadow-2xl shadow-black/60 overflow-hidden"
        style={{ animation: 'fadeInUp 0.3s ease-out both' }}>

        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-800/60 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center shrink-0">
            <CheckSquare className="h-4 w-4 text-emerald-400" />
          </div>
          <h2 className="text-lg font-bold text-slate-100 uppercase tracking-wider">Close Booking</h2>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400 uppercase">Close Time</label>
              <input
                type="time"
                value={closeTime}
                onChange={(e) => setCloseTime(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 focus:border-emerald-500 text-slate-100 rounded-xl px-3 py-2.5 text-sm outline-none transition [color-scheme:dark]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400 uppercase">Working Hours (+1 hr)</label>
              <input
                type="number"
                min="0"
                value={workingHours}
                onChange={(e) => setWorkingHours(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 focus:border-emerald-500 text-slate-100 rounded-xl px-3 py-2.5 text-sm outline-none transition"
                placeholder="e.g. 8"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mt-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400 uppercase">Travelled KM</label>
              <input
                type="number"
                min="0"
                value={endKm}
                onChange={(e) => setEndKm(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 focus:border-emerald-500 text-slate-100 rounded-xl px-3 py-2.5 text-sm outline-none transition"
                placeholder="e.g. 150"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400 uppercase">Payment Status</label>
              <select
                value={paymentStatus}
                onChange={(e) => setPaymentStatus(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 focus:border-emerald-500 text-slate-100 rounded-xl px-3 py-2.5 text-sm outline-none transition"
              >
                <option value="Pending">Pending</option>
                <option value="Partial">Partial</option>
                <option value="Paid">Paid</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5 mt-2">
            <label className="text-xs font-semibold text-slate-400 uppercase">Note <span className="text-slate-500 lowercase">(Optional)</span></label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Add any extra notes..."
              rows={2}
              className="w-full bg-slate-950 border border-slate-700 focus:border-emerald-500 text-slate-100 rounded-xl px-3 py-2.5 text-sm outline-none transition resize-none"
            ></textarea>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800/60 bg-slate-900/50 flex items-center justify-end gap-3">
          <button onClick={onClose} disabled={isSubmitting} className="px-4 py-2 text-sm font-bold bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white rounded-xl transition disabled:opacity-50">
            Cancel
          </button>
          <button onClick={handleSave} disabled={isSubmitting} className="px-5 py-2 text-sm font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl transition shadow-lg shadow-emerald-500/25 flex items-center gap-2 disabled:opacity-50">
            {isSubmitting ? 'Saving...' : 'Close Booking'}
          </button>
        </div>
      </div>
    </div>
  );
}

function BookingDetailModal({ booking: b, onClose, onCancel, colorMap, STATUS_FILTERS, paymentBadge, statusBorderColor, formatDate, todayStr, plans }) {
  if (!b) return null;
  const statusFilter_ = STATUS_FILTERS.find(f => f.key === b.booking_status);
  const bStatusColor = colorMap[statusFilter_?.color || 'indigo']?.badge || 'bg-slate-700 text-slate-300';
  const borderColor = statusBorderColor[b.booking_status] || '#475569';
  const isToday = b.journey_date === todayStr();

  const plan = (plans || []).find(p => p.id === b.plan_id);
  const amount = plan ? plan.rate : (b.total_amount || 0);
  const balanceDue = amount > 0 ? amount - (b.advance_amount || 0) : 0;

  const SectionTitle = ({ icon: Icon, title, color = 'text-indigo-400' }) => (
    <div className="flex items-center gap-2 mb-3">
      <Icon className={`h-4 w-4 ${color}`} />
      <span className={`text-[11px] font-black uppercase tracking-widest ${color}`}>{title}</span>
      <div className="flex-1 h-px bg-slate-700/50 ml-1" />
    </div>
  );

  const Field = ({ label, value, valueClass = 'text-slate-100', mono = false }) => (
    value ? (
      <div>
        <div className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mb-0.5">{label}</div>
        <div className={`text-sm font-semibold ${valueClass} ${mono ? 'font-mono' : ''}`}>{value}</div>
      </div>
    ) : null
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4"
      style={{ animation: 'fadeInUp 0.25s ease-out both' }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-sm" onClick={onClose} />

      {/* Modal — wider, no scroll */}
      <div className="relative w-full max-w-5xl flex flex-col bg-slate-900 border border-slate-700/60 rounded-3xl shadow-2xl shadow-black/60 overflow-hidden"
        style={{ animation: 'fadeInUp 0.3s ease-out both' }}>

        {/* Colored top accent */}
        <div className="h-1.5 w-full" style={{ background: `linear-gradient(90deg, ${borderColor}, ${borderColor}44)` }} />

        {/* Header */}
        <div className="shrink-0 px-5 pt-4 pb-3.5 border-b border-slate-800/60 flex items-start justify-between gap-4 bg-slate-900/80">
          <div>
            <div className="flex items-center gap-2.5 mb-1.5 flex-wrap">
              <span className="text-2xl font-black text-indigo-400 font-mono">
                {b.booking_id ? `#${b.booking_id}` : '—'}
              </span>
              <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${bStatusColor}`}>{b.booking_status}</span>
              <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${paymentBadge[b.payment_status] || 'bg-slate-700 text-slate-300'}`}>{b.payment_status}</span>
              {isToday && <span className="text-[9px] font-black text-white bg-indigo-600 px-2 py-0.5 rounded-full uppercase tracking-wider">Today</span>}
              {b.is_guest && <span className="text-[9px] font-black text-amber-900 bg-amber-400/20 border border-amber-400/30 px-2 py-0.5 rounded-full uppercase tracking-wider">Guest</span>}
            </div>
            <div className="flex items-center gap-2 text-slate-400 text-xs">
              <Calendar className="h-3 w-3" />
              <span>{formatDate(b.journey_date)}</span>
              {b.pickup_time && <><span className="text-slate-600">·</span><Clock className="h-3 w-3" /><span className="font-mono">{b.pickup_time}{b.end_time ? ` → ${b.end_time}` : ''}</span></>}
              {b.booking_date && <><span className="text-slate-600">·</span><span className="text-slate-600 text-[10px]">Booked: {b.booking_date}</span></>}
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-400 hover:text-white transition shrink-0">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body — 2 column grid, no scroll */}
        <div className="px-5 py-4 grid grid-cols-2 gap-4">

          {/* ── LEFT COLUMN ── */}
          <div className="space-y-3">

            {/* Section 1: Passenger / Client Info */}
            <div className="bg-slate-800/30 border border-slate-700/40 rounded-2xl p-3.5">
              <SectionTitle icon={User} title="Passenger / Client Info" color="text-indigo-400" />
              <div className="grid grid-cols-2 gap-3">
                <Field label="Client Name" value={b.customer_name} valueClass="text-slate-100 font-bold" />
                <Field label="Phone" value={b.customer_phone} valueClass="text-indigo-300" mono />
                <Field label="Booked By" value={b.booked_by_name} valueClass="text-slate-300" />
              </div>
              {b.passenger_details && b.passenger_details.length > 0 && b.passenger_details.some(p => p.name) && (
                <div className="mt-2">
                  <div className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mb-1">Passengers</div>
                  <div className="flex flex-wrap gap-1.5">
                    {b.passenger_details.map((p, i) => p.name ? (
                      <div key={i} className="flex items-center gap-1 text-xs bg-slate-800 border border-slate-700/50 rounded-lg px-2 py-1">
                        <span className="text-slate-100 font-semibold">{p.name}</span>
                        {p.phone && <span className="text-slate-500 text-[10px]">· {p.phone}</span>}
                      </div>
                    ) : null)}
                  </div>
                </div>
              )}
            </div>

            {/* Section 2: Trip Details */}
            <div className="bg-slate-800/30 border border-slate-700/40 rounded-2xl p-3.5">
              <SectionTitle icon={Navigation} title="Trip Details" color="text-emerald-400" />
              <div className="grid grid-cols-3 gap-3 mb-3">
                <Field label="Journey Date" value={b.journey_date ? formatDate(b.journey_date) : null} valueClass="text-slate-100 font-bold" />
                <Field label="Return Date" value={b.return_date ? formatDate(b.return_date) : null} valueClass="text-violet-300" />
                <Field label="Reporting Time" value={b.pickup_time} valueClass="text-indigo-300" mono />
                <Field label="End Time" value={b.end_time} valueClass="text-indigo-300" mono />
                <Field label="Trip Type" value={b.trip_type} valueClass="text-amber-300" />
                <Field label="Flight / Train No." value={b.flight_train_number} valueClass="text-slate-300" mono />
              </div>
              <div className="space-y-1.5">
                {(b.pickup_address || b.pickup_location) && (
                  <div className="flex items-start gap-2 bg-slate-800/40 rounded-xl px-2.5 py-2">
                    <MapPin className="h-3 w-3 text-green-400 shrink-0 mt-0.5" />
                    <div>
                      <div className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Pickup</div>
                      <div className="text-xs font-semibold text-slate-100">{b.pickup_address || b.pickup_location}</div>
                    </div>
                  </div>
                )}
                {(b.drop_address || b.drop_location) && (
                  <div className="flex items-start gap-2 bg-slate-800/40 rounded-xl px-2.5 py-2">
                    <MapPin className="h-3 w-3 text-rose-400 shrink-0 mt-0.5" />
                    <div>
                      <div className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Drop</div>
                      <div className="text-xs font-semibold text-slate-100">{b.drop_address || b.drop_location}</div>
                    </div>
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* ── RIGHT COLUMN ── */}
          <div className="space-y-3">

            {/* Section 3: Vehicle & Driver */}
            <div className="bg-slate-800/30 border border-slate-700/40 rounded-2xl p-3.5">
              <SectionTitle icon={Car} title="Vehicle & Driver" color="text-sky-400" />
              <div className="grid grid-cols-3 gap-3">
                <Field label="Vehicle No." value={b.vehicle_number} valueClass="text-sky-300" mono />
                <Field label="Vehicle Type" value={b.vehicle_type} valueClass="text-slate-300" />
                <Field label="Vehicle Class" value={b.vehicle_class} valueClass="text-slate-300" />
                <Field label="Driver Name" value={b.driver_name || 'Unassigned'} valueClass={b.driver_name ? 'text-violet-300' : 'text-slate-500 italic'} />
                <Field label="Passengers" value={b.passengers > 0 ? `${b.passengers} pax` : null} valueClass="text-slate-300" />
                {b.working_hours > 0 && <Field label="Working Hours" value={`${b.working_hours} hrs`} valueClass="text-slate-300" />}
                {b.end_km > 0 && <Field label="End KM" value={`${b.end_km} km`} valueClass="text-slate-300" />}
              </div>
            </div>

            {/* Section 4: Package & Financials */}
            <div className="bg-slate-800/30 border border-slate-700/40 rounded-2xl p-3.5">
              <SectionTitle icon={IndianRupee} title="Package & Financials" color="text-emerald-400" />
              {plan && (
                <div className="mb-2.5 flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/25 rounded-xl px-3 py-1.5">
                  <span className="text-[9px] text-slate-400 font-semibold uppercase tracking-wider">Package:</span>
                  <span className="text-xs font-bold text-indigo-300 leading-tight">{plan.plan_name}</span>
                </div>
              )}
              <div className="grid grid-cols-3 gap-2 mb-2.5">
                <div className="bg-slate-900/60 border border-slate-700/50 rounded-xl p-2.5 text-center">
                  <div className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mb-0.5">Total</div>
                  <div className="text-base font-black text-emerald-400">{amount > 0 ? `₹${amount.toLocaleString('en-IN')}` : '—'}</div>
                </div>
                <div className="bg-slate-900/60 border border-slate-700/50 rounded-xl p-2.5 text-center">
                  <div className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mb-0.5">Advance</div>
                  <div className="text-base font-black text-indigo-400">{b.advance_amount > 0 ? `₹${b.advance_amount.toLocaleString('en-IN')}` : '—'}</div>
                </div>
                <div className="bg-slate-900/60 border border-slate-700/50 rounded-xl p-2.5 text-center">
                  <div className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mb-0.5">Balance</div>
                  <div className={`text-base font-black ${balanceDue > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>{amount > 0 ? `₹${balanceDue.toLocaleString('en-IN')}` : '—'}</div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {b.da_allowance > 0 && <Field label="DA Allowance" value={`₹${b.da_allowance}`} valueClass="text-slate-300" />}
                {b.night_allowance > 0 && <Field label="Night Allowance" value={`₹${b.night_allowance}`} valueClass="text-slate-300" />}
                {b.gst_rate > 0 && <Field label="GST Rate" value={`${b.gst_rate}%`} valueClass="text-slate-300" />}
                {b.rate > 0 && <Field label="Rate" value={`₹${b.rate}`} valueClass="text-slate-300" />}
              </div>
            </div>

            {/* Section 5: Remarks & Notes */}
            {(b.remarks || b.note) && (
              <div className="bg-slate-800/30 border border-slate-700/40 rounded-2xl p-3.5">
                <SectionTitle icon={BookOpen} title="Remarks & Notes" color="text-amber-400" />
                <div className="space-y-2">
                  {b.remarks && <div><div className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mb-0.5">Remarks</div><p className="text-xs text-slate-300 leading-relaxed">{b.remarks}</p></div>}
                  {b.note && <div><div className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mb-0.5">Note</div><p className="text-xs text-slate-300 leading-relaxed">{b.note}</p></div>}
                </div>
              </div>
            )}

          </div>

        </div>

        {/* Footer actions */}
        <div className="shrink-0 px-5 py-3.5 border-t border-slate-800/60 bg-slate-900/80 flex items-center justify-between gap-3">
          <div>
            {b.payment_status === 'Pending' && !['Dispatched', 'Completed', 'Cancelled'].includes(b.booking_status) && (
              <button
                onClick={() => { onCancel(b.id); onClose(); }}
                className="px-4 py-2 text-sm font-bold bg-rose-500/10 text-rose-400 border border-rose-500/30 hover:bg-rose-500/20 rounded-xl transition">
                Cancel Booking
              </button>
            )}
          </div>
          <button onClick={onClose} className="px-5 py-2 text-sm font-bold bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition shadow-lg shadow-indigo-500/25">
            Close
          </button>
        </div>

      </div>
    </div>
  );
}


export default function Dashboard({ navigateTo, theme, setTheme }) {
  const confirm = useConfirm();
  const [stats, setStats] = useState({ totalSalesAmount: 0, totalPurchaseAmount: 0, totalEntities: 0, upcomingCount: 0 });
  const [allBookings, setAllBookings] = useState([]);
  const [eventBills, setEventBills] = useState([]);
  const [availableVehicles, setAvailableVehicles] = useState([]);
  const [availableDrivers, setAvailableDrivers] = useState([]);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [bookingTypeFilter, setBookingTypeFilter] = useState('Regular');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [expandedEvents, setExpandedEvents] = useState({});

  // Allotment Modal State
  const [allotmentModalOpen, setAllotmentModalOpen] = useState(false);
  const [allotmentBookingId, setAllotmentBookingId] = useState(null);

  // Close Booking Modal State
  const [closeModalOpen, setCloseModalOpen] = useState(false);
  const [closeBookingId, setCloseBookingId] = useState(null);

  // Payment Modal State
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [paymentEvent, setPaymentEvent] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState('');

  // Draggable FAB state
  const [fabPos, setFabPos] = useState(() => {
    try {
      const saved = localStorage.getItem('dashboard_fab_pos');
      return saved ? JSON.parse(saved) : { right: 32, bottom: 40 };
    } catch { return { right: 32, bottom: 40 }; }
  });
  const fabDragging = useRef(false);
  const fabOffset = useRef({ x: 0, y: 0 });
  const fabRef = useRef(null);
  const [paymentIsSubmitting, setPaymentIsSubmitting] = useState(false);

  const fetchAll = async () => {
    try {
      const [billsRes, entitiesRes, bookingsRes, vehiclesRes, driversRes, plansRes, eventBillsRes] = await Promise.all([
        axios.get(`${API}/bills`),
        axios.get(`${API}/customers`),
        axios.get(`${API}/bookings`),
        axios.get(`${API}/vehicles`),
        axios.get(`${API}/drivers`),
        axios.get(`${API}/plans`),
        axios.get(`${API}/event-bills`),
      ]);
      const bills = billsRes.data;
      const today = todayStr();

      setAvailableVehicles(vehiclesRes.data);
      setAvailableDrivers(driversRes.data);
      setPlans(plansRes.data);
      setEventBills(eventBillsRes.data || []);

      setStats({
        totalSalesAmount: bills.filter(b => b.bill_type !== 'Purchase').reduce((s, b) => s + (b.final_bill_amount || 0), 0),
        totalPurchaseAmount: bills.filter(b => b.bill_type === 'Purchase').reduce((s, b) => s + (b.final_bill_amount || 0), 0),
        totalEntities: entitiesRes.data.length,
        upcomingCount: (bookingsRes.data || []).filter(b => b.journey_date && b.journey_date >= today && b.booking_status !== 'Cancelled').length,
      });

      const allSortedBookings = [...(bookingsRes.data || [])].sort((a, b) => {
        const dateCompare = (a.journey_date || '').localeCompare(b.journey_date || '');
        if (dateCompare !== 0) return dateCompare;
        return (a.pickup_time || '').localeCompare(b.pickup_time || '');
      });
      setAllBookings(allSortedBookings);
    } catch (err) {
      console.error('Dashboard fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const statusCounts = useMemo(() => {
    const counts = { all: allBookings.length };
    STATUS_FILTERS.slice(1).forEach(f => {
      counts[f.key] = allBookings.filter(b => b.booking_status === f.key || b.payment_status === f.key).length;
    });
    return counts;
  }, [allBookings]);

  const filteredBookings = useMemo(() => {
    const today = todayStr();
    return allBookings.filter(b => {
      if (statusFilter !== 'all' && b.booking_status !== statusFilter && b.payment_status !== statusFilter) return false;

      // Booking Type Filter (Regular vs Event)
      if (bookingTypeFilter === 'Regular') {
        if (b.event_id) return false;
        // Only show upcoming (with a valid date) for regular view
        if (!b.journey_date || b.journey_date < today) return false;
      } else if (bookingTypeFilter === 'Event') {
        if (!b.event_id) return false;
      } else {
        // All - only upcoming with valid dates
        if (!b.journey_date || b.journey_date < today) return false;
      }

      if (fromDate && b.journey_date < fromDate) return false;
      if (toDate && b.journey_date > toDate) return false;
      if (searchTerm) {
        const term = searchTerm.toLowerCase();

        // Match multiple fields
        const bookingIdStr = b.booking_id ? `#${b.booking_id}` : '';
        const formattedDate = formatDate(b.journey_date).toLowerCase();

        const matchesId = (b.booking_id || '').toLowerCase().includes(term) || bookingIdStr.toLowerCase().includes(term);
        const matchesDate = (b.journey_date || '').toLowerCase().includes(term) || formattedDate.includes(term);
        const matchesStartTime = (b.pickup_time || '').toLowerCase().includes(term);
        const matchesEndTime = (b.end_time || '').toLowerCase().includes(term);
        const matchesClient = (b.customer_name || '').toLowerCase().includes(term) || (b.customer_phone || '').toLowerCase().includes(term);
        const matchesRoute = (b.pickup_address || '').toLowerCase().includes(term) || (b.pickup_location || '').toLowerCase().includes(term) || (b.drop_location || '').toLowerCase().includes(term);
        const matchesTripType = (b.trip_type || '').toLowerCase().includes(term);
        const matchesVehicle = (b.vehicle_number || '').toLowerCase().includes(term) || (b.vehicle_type || '').toLowerCase().includes(term);
        const matchesDriver = (b.driver_name || '').toLowerCase().includes(term);

        if (!matchesId && !matchesDate && !matchesStartTime && !matchesEndTime && !matchesClient && !matchesRoute && !matchesTripType && !matchesVehicle && !matchesDriver) {
          return false;
        }
      }
      return true;
    });
  }, [allBookings, statusFilter, fromDate, toDate, searchTerm, bookingTypeFilter]);

  const handleCancelBooking = async (bookingId) => {
    const isConfirmed = await confirm('Are you sure you want to cancel this booking?');
    if (!isConfirmed) return;
    try {
      await axios.put(`${API}/bookings/${bookingId}`, {
        booking_status: 'Cancelled'
      });
      setAllBookings(prev => prev.map(b => b.id === bookingId ? { ...b, booking_status: 'Cancelled' } : b));
    } catch (err) {
      console.error("Failed to cancel booking:", err);
      alert("Failed to cancel booking");
    }
  };

  const handleConfirmBooking = async (bookingId) => {
    try {
      await axios.put(`${API}/bookings/${bookingId}`, {
        booking_status: 'Confirmed'
      });
      setAllBookings(prev => prev.map(b => b.id === bookingId ? { ...b, booking_status: 'Confirmed' } : b));
    } catch (err) {
      console.error("Failed to confirm booking:", err);
      alert("Failed to confirm booking. Please try again.");
    }
  };

  const handleSaveAllotment = async (bookingId, updateData) => {
    try {
      await axios.put(`${API}/bookings/${bookingId}`, updateData);
      setAllBookings(prev => prev.map(b => b.id === bookingId ? { ...b, ...updateData } : b));
      setAllotmentModalOpen(false);
      setAllotmentBookingId(null);
    } catch (err) {
      console.error("Failed to save allotment:", err);
      alert("Failed to save allotment. Please try again.");
    }
  };

  const handleSaveCloseBooking = async (bookingId, updateData) => {
    try {
      await axios.put(`${API}/bookings/${bookingId}`, updateData);
      setAllBookings(prev => prev.map(b => b.id === bookingId ? { ...b, ...updateData } : b));
      setCloseModalOpen(false);
      setCloseBookingId(null);
    } catch (err) {
      console.error("Failed to close booking:", err);
      alert("Failed to close booking. Please try again.");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-1">
      {/* ─── ALLOTMENT MODAL ─── */}
      {allotmentModalOpen && (
        <AllotmentModal
          booking={allBookings.find(b => b.id === allotmentBookingId)}
          onClose={() => { setAllotmentModalOpen(false); setAllotmentBookingId(null); }}
          onSave={handleSaveAllotment}
          vehicles={availableVehicles}
          drivers={availableDrivers}
          allBookings={allBookings}
        />
      )}

      {/* ─── CLOSE BOOKING MODAL ─── */}
      {closeModalOpen && (
        <CloseBookingModal
          booking={allBookings.find(b => b.id === closeBookingId)}
          onClose={() => { setCloseModalOpen(false); setCloseBookingId(null); }}
          onSave={handleSaveCloseBooking}
        />
      )}

      {/* ─── BOOKING DETAIL MODAL ─── */}
      <BookingDetailModal
        booking={selectedBooking}
        onClose={() => setSelectedBooking(null)}
        onCancel={handleCancelBooking}
        colorMap={colorMap}
        STATUS_FILTERS={STATUS_FILTERS}
        paymentBadge={paymentBadge}
        statusBorderColor={statusBorderColor}
        formatDate={formatDate}
        todayStr={todayStr}
        plans={plans}
      />

      {/* ─── FILTER CARD ─── */}
      <div className="glass-panel rounded-2xl border border-slate-700/50 shadow-xl p-4 space-y-3">
        {/* Booking Type Toggle */}
        <div className="flex gap-2 p-1 bg-slate-900 border border-slate-700/50 rounded-xl w-fit">
          {['Regular', 'Event'].map(type => (
            <button key={type} onClick={() => setBookingTypeFilter(type)}
              className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${bookingTypeFilter === type ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'}`}>
              {type === 'Regular' ? 'Regular Bookings' : 'Event Bookings'}
            </button>
          ))}
        </div>

        {/* Row 1: Status Filters + Search */}
        <div className="flex flex-col lg:flex-row lg:items-center gap-4">
          {/* Search (Column 1) */}
          <div className="flex items-center bg-slate-800/60 border border-slate-700 rounded-xl overflow-hidden px-3 py-2.5 gap-2 focus-within:border-indigo-500/60 transition w-full lg:w-1/3 shrink-0">
            <Search className="h-4 w-4 text-slate-400 shrink-0" />
            <input
              type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search by client, vehicle, driver, booking ID..."
              className="bg-transparent text-sm text-slate-100 outline-none w-full placeholder-slate-500"
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm('')} className="text-slate-500 hover:text-slate-200 transition shrink-0">
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Status Filter Chips — hidden in Event mode */}
          {bookingTypeFilter !== 'Event' && (
            <div className="flex gap-1.5 flex-wrap flex-1">
              {STATUS_FILTERS.map(f => {
                const isActive = statusFilter === f.key;
                const count = statusCounts[f.key] || 0;
                const c = colorMap[f.color];
                return (
                  <button key={f.key} onClick={() => setStatusFilter(f.key)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[11px] font-bold transition-all duration-200 ${isActive ? c.btn + ' shadow-md scale-105' : 'border-slate-700 text-slate-400 hover:border-slate-500 hover:text-slate-200 bg-transparent'
                      }`}>
                    {f.label}
                    <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ${isActive ? 'bg-black/20' : 'bg-slate-700 text-slate-300'}`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

        </div>

        {/* Row 2: Date range — hidden in Event mode */}
        {bookingTypeFilter !== 'Event' && (
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <div className="flex items-center gap-2 flex-1">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider w-8 shrink-0">From</span>
              <div className="flex-1">
                <CustomDatePicker value={fromDate} onChange={setFromDate} maxDate={toDate} placeholder="Start Date"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 pr-7 py-1.5 text-xs text-slate-100 outline-none cursor-pointer" />
              </div>
            </div>
            <div className="flex items-center gap-2 flex-1">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider w-8 shrink-0">To</span>
              <div className="flex-1">
                <CustomDatePicker value={toDate} onChange={setToDate} minDate={fromDate} placeholder="End Date"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 pr-7 py-1.5 text-xs text-slate-100 outline-none cursor-pointer" />
              </div>
            </div>
            <div className="flex items-center gap-3">
              {(fromDate || toDate) && (
                <button onClick={() => { setFromDate(''); setToDate(''); }}
                  className="text-[10px] text-rose-400 font-bold border border-rose-500/30 px-2.5 py-1.5 rounded-lg hover:bg-rose-500/10 transition">
                  Clear Dates
                </button>
              )}
              <div className="text-[10px] text-slate-500 font-medium whitespace-nowrap">
                Showing <span className="text-slate-50 font-bold">{filteredBookings.length}</span> of {allBookings.filter(b => !b.event_id).length}
              </div>
            </div>
          </div>
        )}

        {/* Event mode info row */}
        {bookingTypeFilter === 'Event' && (
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-slate-500 font-medium">
              Showing all <span className="text-slate-300 font-bold">{eventBills.length}</span> event{eventBills.length !== 1 ? 's' : ''}
            </span>
          </div>
        )}
      </div>

      {/* ─── EVENT BOOKINGS SECTIONAL VIEW ─── */}
      {bookingTypeFilter === 'Event' ? (
        <div className="space-y-4">
          {eventBills.length === 0 ? (
            <div className="glass-panel rounded-2xl border border-slate-700/50 shadow-xl p-16 flex flex-col items-center gap-3 text-slate-600">
              <Car className="h-10 w-10" />
              <p className="text-sm font-semibold">No event bills found</p>
              <p className="text-xs">Create an event bill to see bookings here.</p>
            </div>
          ) : (
            eventBills.map((ev) => {
              const evBookings = allBookings.filter(b => b.event_id === ev.id);
              const activeBookings = evBookings.filter(b => b.booking_status !== 'Cancelled');
              const cancelledCount = evBookings.length - activeBookings.length;
              // Compute active total from live booking data
              const activeTotal = activeBookings.reduce((sum, b) => sum + (parseFloat(b.rate) || 0) + (parseFloat(b.da_allowance) || 0) + (parseFloat(b.night_allowance) || 0), 0);
              const isExpanded = expandedEvents[ev.id] !== false; // default expanded
              const statusColor = ev.status === 'Paid' ? 'text-emerald-400 bg-emerald-500/15 border-emerald-500/30'
                : ev.status === 'Cancelled' ? 'text-rose-400 bg-rose-500/15 border-rose-500/30'
                  : 'text-amber-400 bg-amber-500/15 border-amber-500/30';
              return (
                <div key={ev.id} className="glass-panel rounded-2xl border border-slate-700/50 shadow-xl overflow-hidden">
                  {/* Section Header: Event Details */}
                  <button
                    onClick={() => setExpandedEvents(prev => ({ ...prev, [ev.id]: !isExpanded }))}
                    className="w-full flex items-start justify-between gap-4 px-5 py-4 bg-slate-800/60 hover:bg-slate-800/80 transition text-left"
                  >
                    <div className="flex items-start gap-4 min-w-0 flex-1">
                      <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center shrink-0 mt-0.5">
                        <Car className="h-5 w-5 text-indigo-400" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <span className="text-sm font-black text-slate-50">{ev.event_name}</span>
                          <span className="text-[10px] font-bold text-indigo-300 bg-indigo-500/15 border border-indigo-500/30 px-2 py-0.5 rounded-full font-mono">#{ev.bill_no}</span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusColor}`}>{ev.status}</span>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400">
                          <span className="flex items-center gap-1"><User className="h-3 w-3 text-slate-500" />{ev.client_name}</span>
                          <span className="flex items-center gap-1"><MapPin className="h-3 w-3 text-green-500" />{ev.event_location || '—'}</span>
                          <span className="flex items-center gap-1"><Calendar className="h-3 w-3 text-indigo-400" />{formatDate(ev.start_date)} → {formatDate(ev.end_date)}</span>
                          <span className="flex items-center gap-1"><Clock className="h-3 w-3 text-violet-400" />{ev.total_days} {ev.total_days === 1 ? 'Day' : 'Days'}</span>
                        </div>

                        {/* Payment Details */}
                        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-2 pt-2 border-t border-slate-700/50 font-mono text-[11px]">
                          <div className="text-slate-400">Total Bill: <span className="font-bold text-slate-200 text-[11px]">₹{(ev.final_bill_amount || 0).toLocaleString('en-IN')}</span></div>
                          <div className="text-emerald-500/80">Received: <span className="font-bold text-emerald-400 text-[11px]">₹{(ev.advance_amount || 0).toLocaleString('en-IN')}</span></div>
                          <div className="text-rose-500/80">Pending: <span className="font-bold text-rose-400 text-[20px]">₹{Math.max(0, (ev.final_bill_amount || 0) - (ev.advance_amount || 0)).toLocaleString('en-IN')}</span></div>
                          {cancelledCount > 0 && <div className="text-[10px] text-rose-400 font-bold font-sans">({cancelledCount} cancelled)</div>}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      {ev.status !== 'Paid' && (
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); setPaymentEvent(ev); setPaymentAmount(''); setPaymentModalOpen(true); }}
                          className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-bold rounded-lg shadow transition"
                        >
                          Add Payment
                        </button>
                      )}
                      <span className="text-[11px] font-bold text-slate-400 bg-slate-700/60 border border-slate-600/40 px-2.5 py-1 rounded-full">
                        {activeBookings.length} Active{evBookings.length !== activeBookings.length ? ` / ${evBookings.length}` : ''}
                      </span>
                      <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                    </div>
                  </button>

                  {/* Bookings List */}
                  {isExpanded && (
                    <div>
                      {evBookings.length === 0 ? (
                        <div className="px-5 py-8 text-center flex flex-col items-center gap-2 text-slate-600">
                          <Car className="h-7 w-7" />
                          <p className="text-xs font-medium">No bookings yet for this event</p>
                        </div>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full text-left border-collapse min-w-[800px]">
                            <thead>
                              <tr className="border-b border-t border-slate-700/80 bg-slate-900/50 text-slate-400 text-[9px] font-bold uppercase tracking-wider">
                                <th className="px-4 py-2">Booking ID</th>
                                <th className="px-4 py-2">Trip Date</th>
                                <th className="px-4 py-2">Time</th>
                                <th className="px-4 py-2">Customer</th>
                                <th className="px-4 py-2">Pickup → Drop</th>
                                <th className="px-4 py-2">Vehicle</th>
                                <th className="px-4 py-2">Driver</th>
                                <th className="px-4 py-2 text-right">Rate</th>
                                <th className="px-4 py-2 text-center">Status</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/60">
                              {evBookings.map((b, i) => {
                                const isCancelled = b.booking_status === 'Cancelled';
                                const bStatusColor = colorMap[STATUS_FILTERS.find(f => f.key === b.booking_status)?.color || 'indigo']?.badge || 'bg-slate-700 text-slate-300';
                                const amount = b.rate || b.total_amount || 0;
                                return (
                                  <tr key={b.id}
                                    onClick={() => setSelectedBooking(b)}
                                    className={`transition cursor-pointer ${isCancelled ? 'opacity-50 bg-rose-950/10' : 'bg-slate-900 hover:bg-slate-800/40'}`}
                                    style={{ borderLeft: `3px solid ${statusBorderColor[b.booking_status] || '#475569'}`, animation: `fadeInUp 0.25s ease-out ${i * 0.04}s both` }}
                                  >
                                    <td className={`px-4 py-2.5 text-indigo-400 font-mono font-bold text-xs ${isCancelled ? 'line-through' : ''}`}>{b.booking_id ? `#${b.booking_id}` : '—'}</td>
                                    <td className={`px-4 py-2.5 text-xs font-semibold whitespace-nowrap ${isCancelled ? 'line-through text-slate-500' : 'text-slate-200'}`}>{formatDate(b.journey_date)}</td>
                                    <td className={`px-4 py-2.5 text-xs font-mono whitespace-nowrap ${isCancelled ? 'text-slate-600' : 'text-indigo-300'}`}>{b.pickup_time || '—'}{b.end_time ? ` → ${b.end_time}` : ''}</td>
                                    <td className="px-4 py-2.5">
                                      <div className={`text-xs font-semibold truncate max-w-[120px] ${isCancelled ? 'line-through text-slate-500' : 'text-slate-100'}`}>{b.customer_name || '—'}</div>
                                      {b.customer_phone && <div className="text-[10px] text-slate-500 font-mono">{b.customer_phone}</div>}
                                    </td>
                                    <td className="px-4 py-2.5">
                                      <div className="flex items-center gap-1 text-xs max-w-[160px]">
                                        <MapPin className="h-3 w-3 text-green-400 shrink-0" />
                                        <span className={`truncate ${isCancelled ? 'text-slate-600' : 'text-slate-300'}`}>{b.pickup_address || b.pickup_location || '—'}</span>
                                        {b.drop_location && (<><ArrowRight className="h-2.5 w-2.5 text-slate-600 shrink-0" /><span className={`truncate ${isCancelled ? 'text-slate-600' : 'text-slate-300'}`}>{b.drop_location}</span></>)}
                                      </div>
                                    </td>
                                    <td className="px-4 py-2.5">
                                      <div className={`text-xs font-mono font-bold ${isCancelled ? 'text-slate-600' : 'text-sky-300'}`}>{b.vehicle_number || '—'}</div>
                                      {b.vehicle_class && <div className="text-[10px] text-slate-500">{b.vehicle_class}</div>}
                                    </td>
                                    <td className={`px-4 py-2.5 text-xs truncate max-w-[100px] ${isCancelled ? 'text-slate-600' : 'text-violet-300'}`}>{b.driver_name || <span className="text-slate-600 italic">Unassigned</span>}</td>
                                    <td className="px-4 py-2.5 text-right">
                                      <span className={`font-bold text-xs ${isCancelled ? 'line-through text-slate-600' : 'text-emerald-400'}`}>{amount > 0 ? `₹${amount.toLocaleString('en-IN')}` : '—'}</span>
                                    </td>
                                    <td className="px-4 py-2.5 text-center">
                                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border whitespace-nowrap ${bStatusColor}`}>{b.booking_status}</span>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      ) : (
        <div className="glass-panel rounded-2xl border border-slate-700/50 shadow-xl overflow-hidden">

          {/* ── MOBILE: CARD LIST (hidden on sm+) ── */}
          <div className="block sm:hidden divide-y divide-slate-800/60">
            {filteredBookings.length === 0 ? (
              <div className="flex flex-col items-center gap-2 text-slate-600 py-12">
                <BookOpen className="h-9 w-9" />
                <p className="text-sm font-semibold">No bookings found</p>
                <p className="text-xs">Try changing your filters or search term.</p>
              </div>
            ) : (
              filteredBookings.map((b) => {
                const isToday = b.journey_date === todayStr();
                const bStatusColor = colorMap[STATUS_FILTERS.find(f => f.key === b.booking_status)?.color || 'indigo']?.badge || 'bg-slate-700 text-slate-300';
                const plan = plans.find(p => p.id === b.plan_id);
                const amount = plan ? plan.rate : (b.total_amount || 0);

                return (
                  <div key={b.id}
                    onClick={() => setSelectedBooking(b)}
                    className="p-3 flex flex-col gap-2 bg-slate-900 hover:bg-slate-800/50 transition cursor-pointer"
                    style={{ borderLeft: `3px solid ${statusBorderColor[b.booking_status] || '#475569'}` }}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-indigo-400 font-mono font-bold text-xs shrink-0">{b.booking_id ? `#${b.booking_id}` : '—'}</span>
                        <div className="min-w-0">
                          <div className="text-slate-50 font-semibold text-xs">{formatDate(b.journey_date)}</div>
                          {isToday && <div className="text-[9px] font-bold text-indigo-400 uppercase">Today</div>}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${bStatusColor}`}>{b.booking_status}</span>
                        {b.booking_status === 'Dispatched' ? (
                          <button onClick={(e) => { e.stopPropagation(); setCloseBookingId(b.id); setCloseModalOpen(true); }} className="text-[9px] font-bold px-3 py-1 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white shadow border border-emerald-500 transition cursor-pointer">Close</button>
                        ) : b.booking_status === 'Unconfirmed' ? (
                          <button onClick={(e) => { e.stopPropagation(); handleConfirmBooking(b.id); }} className="text-[9px] font-bold px-2.5 py-1 rounded-full bg-blue-600 hover:bg-blue-500 text-white shadow border border-blue-500 transition cursor-pointer">Confirm</button>
                        ) : ['Completed', 'Cancelled'].includes(b.booking_status) ? null : (
                          <button onClick={(e) => { e.stopPropagation(); setAllotmentBookingId(b.id); setAllotmentModalOpen(true); }} className="text-[9px] font-bold px-2.5 py-1 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white shadow border border-indigo-500 transition cursor-pointer">Allot</button>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <div className="text-slate-50 font-semibold text-xs truncate">{b.customer_name}</div>
                        {b.customer_phone && <div className="text-slate-500 text-[10px]">{b.customer_phone}</div>}
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-sky-300 font-mono font-bold text-xs">{b.vehicle_number || '—'}</div>
                        {b.vehicle_type && <div className="text-slate-500 text-[10px]">{b.vehicle_type}</div>}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-400 min-w-0">
                      <MapPin className="h-2.5 w-2.5 text-green-400 shrink-0" />
                      <span className="truncate">{b.pickup_address || b.pickup_location || '—'}</span>
                      {b.drop_location && (<><ArrowRight className="h-2 w-2 text-slate-600 shrink-0" /><span className="truncate">{b.drop_location}</span></>)}
                      {plan && <div className="ml-auto shrink-0 px-1.5 py-1 rounded-md bg-slate-700/60 border border-slate-600/40 text-[9px] font-medium max-w-[120px] line-clamp-2 leading-tight text-right" title={plan.plan_name}>{plan.plan_name}</div>}
                    </div>
                    <div className="flex items-center justify-between gap-2 text-[10px]">
                      <div className="flex items-center gap-2 text-indigo-300 font-mono">
                        {b.pickup_time && <span>{b.pickup_time}</span>}
                        {b.end_time && <><ArrowRight className="h-2 w-2 text-slate-600" /><span>{b.end_time}</span></>}
                      </div>
                      <div className="text-violet-300 truncate max-w-[120px]">{b.driver_name || <span className="text-slate-600 italic">No driver</span>}</div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* ── DESKTOP: TABLE (hidden on mobile) ── */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[1000px]">
              <thead>
                <tr className="border-b border-slate-700 bg-table-header text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                  <th className="px-2.5 py-2">Booking ID</th>
                  <th className="px-2.5 py-2">Trip Date</th>
                  <th className="px-2.5 py-2">Reporting Time</th>
                  <th className="px-2.5 py-2">Passenger Name</th>
                  <th className="px-2.5 py-2">Pickup Address</th>
                  <th className="px-2.5 py-2">City</th>
                  <th className="px-2.5 py-2">Package Name</th>
                  <th className="px-2.5 py-2">Vehicle</th>
                  <th className="px-2.5 py-2">Driver</th>
                  <th className="px-2.5 py-2 text-center">Status</th>
                  <th className="px-2.5 py-2 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-sm text-slate-300">
                {filteredBookings.length === 0 ? (
                  <tr>
                    <td colSpan="12" className="px-2.5 py-16 text-center">
                      <div className="flex flex-col items-center gap-2 text-slate-600">
                        <BookOpen className="h-9 w-9" />
                        <p className="text-sm font-semibold">No bookings found</p>
                        <p className="text-xs">Try changing your filters or search term.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredBookings.map((b, i) => {
                    const isToday = b.journey_date === todayStr();
                    const statusBg = statusRowBg[b.booking_status] || 'bg-slate-900 hover:bg-slate-800/50';
                    const rowBg = isToday ? `${statusBg} bg-indigo-950/20 border-y border-indigo-500/20` : statusBg;
                    const bStatusColor = colorMap[STATUS_FILTERS.find(f => f.key === b.booking_status)?.color || 'indigo']?.badge || 'bg-slate-700 text-slate-300';

                    const plan = plans.find(p => p.id === b.plan_id);
                    const amount = plan ? plan.rate : (b.total_amount || 0);

                    return (
                      <tr key={b.id}
                        onClick={() => setSelectedBooking(b)}
                        className={`transition cursor-pointer ${rowBg}`}
                        style={{
                          borderLeft: `3px solid ${statusBorderColor[b.booking_status] || '#475569'}`,
                          animation: `fadeInUp 0.35s ease-out ${i * 0.04}s both`,
                        }}>
                        <td className="px-2.5 py-2 text-indigo-400 font-mono font-bold text-xs">{b.booking_id ? `#${b.booking_id}` : '—'}</td>
                        <td className="px-2.5 py-2 whitespace-nowrap">
                          <div className="flex flex-col gap-0.5">
                            <span className="text-slate-50 font-semibold text-xs">{formatDate(b.journey_date)}</span>
                            {isToday && <span className="text-[9px] font-bold text-indigo-400 uppercase tracking-wider">Today</span>}
                          </div>
                        </td>
                        <td className="px-2.5 py-2 text-xs font-mono text-indigo-300 whitespace-nowrap">{b.pickup_time || '—'}</td>
                        <td className="px-2.5 py-2">
                          <div className="flex flex-col">
                            <span className="text-slate-50 font-semibold text-xs truncate max-w-[140px]">
                              {(b.passenger_details && b.passenger_details[0]?.name) || b.customer_name || '—'}
                            </span>
                            {(b.passenger_details && b.passenger_details[0]?.phone) || b.customer_phone
                              ? <span className="text-slate-500 text-[10px]">{(b.passenger_details && b.passenger_details[0]?.phone) || b.customer_phone}</span>
                              : null
                            }
                          </div>
                        </td>
                        <td className="px-2.5 py-2">
                          <div className="flex items-start gap-1.5 text-xs max-w-[180px]">
                            <MapPin className="h-3 w-3 text-green-400 shrink-0 mt-0.5" />
                            <span className="text-slate-300 leading-tight line-clamp-2">{b.pickup_address || b.pickup_location || '—'}</span>
                          </div>
                        </td>
                        <td className="px-2.5 py-2">
                          <span className="text-xs font-semibold text-emerald-300 whitespace-nowrap">{b.pickup_location || '—'}</span>
                        </td>
                        <td className="px-2.5 py-2 min-w-[200px]">
                          <div className="text-[10px] leading-tight px-2 py-1.5 rounded-lg bg-slate-700/60 text-slate-300 border border-slate-600/40 font-medium max-w-[200px] line-clamp-2" title={plan ? plan.plan_name : ''}>
                            {plan ? plan.plan_name : '—'}
                          </div>
                        </td>
                        <td className="px-2.5 py-2">
                          <div className="flex flex-col gap-0.5 text-xs">
                            <span className="text-sky-300 font-mono font-bold">{b.vehicle_number}</span>
                            {b.vehicle_type && <span className="text-slate-500 text-[10px]">{b.vehicle_type}</span>}
                          </div>
                        </td>
                        <td className="px-2.5 py-2">
                          <div className="flex flex-col gap-0.5 text-xs">
                            <span className="text-violet-300 truncate max-w-[130px]">{b.driver_name || <span className="text-slate-600 italic">Unassigned</span>}</span>
                            {b.passengers > 0 && <span className="text-slate-500 text-[10px]">{b.passengers} pax</span>}
                          </div>
                        </td>
                        <td className="px-2.5 py-2 text-center">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border whitespace-nowrap ${bStatusColor}`}>{b.booking_status}</span>
                        </td>
                        <td className="px-2.5 py-2 text-center">
                          {b.booking_status === 'Dispatched' ? (
                            <button onClick={(e) => { e.stopPropagation(); setCloseBookingId(b.id); setCloseModalOpen(true); }} className="text-[10px] font-bold px-4 py-1.5 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white shadow border border-emerald-500 transition cursor-pointer">Close</button>
                          ) : b.booking_status === 'Unconfirmed' ? (
                            <button onClick={(e) => { e.stopPropagation(); handleConfirmBooking(b.id); }} className="text-[10px] font-bold px-4 py-1.5 rounded-full bg-blue-600 hover:bg-blue-500 text-white shadow border border-blue-500 transition cursor-pointer">Confirm</button>
                          ) : ['Completed', 'Cancelled'].includes(b.booking_status) ? null : (
                            <button onClick={(e) => { e.stopPropagation(); setAllotmentBookingId(b.id); setAllotmentModalOpen(true); }} className="text-[10px] font-bold px-4 py-1.5 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white shadow border border-indigo-500 transition cursor-pointer">Allot</button>
                          )}
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

      {/* ─── PAYMENT MODAL ─── */}
      {paymentModalOpen && paymentEvent && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm flex justify-center items-center p-4">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden p-6 animate-in fade-in zoom-in duration-200">
            <h3 className="text-lg font-bold text-slate-100 mb-4 flex items-center gap-2"><IndianRupee className="h-5 w-5 text-emerald-400" /> Update Payment</h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-400">Enter Payment Amount Received (₹)</label>
                <input
                  type="number"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 focus:border-indigo-500 text-slate-100 rounded-xl px-4 py-3 mt-1.5 text-lg font-mono font-bold outline-none transition placeholder-slate-700"
                  placeholder="e.g. 5000"
                />
                <div className="flex justify-between items-center mt-2">
                  <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">
                    Total Bill: <span className="text-slate-300">₹{(paymentEvent.final_bill_amount || 0).toLocaleString('en-IN')}</span>
                  </p>
                  <p className="text-[10px] text-emerald-500/80 font-semibold uppercase tracking-wider">
                    Prev Received: <span className="text-emerald-400">₹{(paymentEvent.advance_amount || 0).toLocaleString('en-IN')}</span>
                  </p>
                </div>
              </div>
              <div className="flex gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setPaymentModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl text-xs font-bold text-slate-300 bg-slate-800 hover:bg-slate-700 transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={paymentIsSubmitting}
                  onClick={async () => {
                    const amt = parseFloat(paymentAmount);
                    if (isNaN(amt) || amt <= 0) return alert("Please enter a valid amount greater than 0");
                    const newTotal = (paymentEvent.advance_amount || 0) + amt;
                    const finalAmt = paymentEvent.final_bill_amount || 0;
                    const newStatus = (newTotal >= finalAmt && finalAmt > 0) ? 'Paid' : 'Partial';

                    setPaymentIsSubmitting(true);
                    try {
                      await axios.patch(`${API}/event-bills/${paymentEvent.id}/payment`, {
                        advance_amount: newTotal,
                        status: newStatus
                      });

                      await axios.post(`${API}/received-payments`, {
                        customer_id: paymentEvent.customer_id || '',
                        customer_name: paymentEvent.client_name || 'Event Client',
                        amount: amt,
                        payment_date: todayStr(),
                        payment_mode: 'Cash',
                        reference_id: paymentEvent.bill_no || '',
                        notes: `Payment for Event: ${paymentEvent.event_name}`
                      });

                      setPaymentModalOpen(false);
                      fetchAll();
                    } catch (err) {
                      console.error("Payment update failed", err);
                      alert("Failed to update payment");
                    }
                    setPaymentIsSubmitting(false);
                  }}
                  className="flex-1 py-2.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-500/25 disabled:opacity-50 transition"
                >
                  {paymentIsSubmitting ? 'Saving...' : 'Add Payment'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── DRAGGABLE FAB ─── */}
      <div
        ref={fabRef}
        onPointerDown={(e) => {
          e.preventDefault();
          fabDragging.current = false;
          const rect = fabRef.current.getBoundingClientRect();
          fabOffset.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
          fabRef.current.setPointerCapture(e.pointerId);
          fabRef.current._startX = e.clientX;
          fabRef.current._startY = e.clientY;
        }}
        onPointerMove={(e) => {
          const dx = e.clientX - (fabRef.current._startX || e.clientX);
          const dy = e.clientY - (fabRef.current._startY || e.clientY);
          if (Math.abs(dx) > 4 || Math.abs(dy) > 4) fabDragging.current = true;
          if (!fabDragging.current) return;
          const vw = window.innerWidth;
          const vh = window.innerHeight;
          const btnW = fabRef.current.offsetWidth;
          const btnH = fabRef.current.offsetHeight;
          const newRight = Math.min(Math.max(vw - e.clientX - (btnW - fabOffset.current.x), 8), vw - btnW - 8);
          const newBottom = Math.min(Math.max(vh - e.clientY - (btnH - fabOffset.current.y), 8), vh - btnH - 8);
          setFabPos({ right: newRight, bottom: newBottom });
        }}
        onPointerUp={() => {
          const wasDragging = fabDragging.current;
          fabDragging.current = false;
          if (wasDragging) {
            try { localStorage.setItem('dashboard_fab_pos', JSON.stringify(fabPos)); } catch {}
          }
        }}
        onClick={() => {
          if (!fabDragging.current) navigateTo('booking-screen');
        }}
        style={{
          position: 'fixed',
          right: fabPos.right,
          bottom: fabPos.bottom,
          zIndex: 100,
          userSelect: 'none',
          touchAction: 'none',
        }}
        className="group flex items-center gap-2.5 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-3.5 rounded-2xl shadow-2xl shadow-indigo-500/40 border border-indigo-500/50 transition-colors duration-150 cursor-grab active:cursor-grabbing select-none"
        title="Add New Booking — drag to reposition"
      >
        <Plus className="h-5 w-5 shrink-0" />
        <span className="text-sm font-black tracking-wide whitespace-nowrap">New Booking</span>
        <svg width="10" height="14" viewBox="0 0 10 14" fill="currentColor" className="opacity-40 group-hover:opacity-70 transition-opacity ml-0.5 shrink-0">
          <circle cx="2" cy="2" r="1.5"/><circle cx="8" cy="2" r="1.5"/>
          <circle cx="2" cy="7" r="1.5"/><circle cx="8" cy="7" r="1.5"/>
          <circle cx="2" cy="12" r="1.5"/><circle cx="8" cy="12" r="1.5"/>
        </svg>
      </div>

    </div>
  );
}


