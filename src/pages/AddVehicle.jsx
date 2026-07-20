import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Car, CheckCircle, AlertTriangle, Sparkles, ShieldAlert } from 'lucide-react';
import CustomSelect from '../components/CustomSelect';
import { useConfirm } from '../context/ConfirmContext';

export default function AddVehicle({ navigateTo }) {
  const [vehicle, setVehicle] = useState({
    vehicle_number: '',
    model: '',
    driver_name: '',
    vehicle_type: 'Sedan',
    status: 'Active',
    ownership_type: 'Owner',
    owner_name: 'Ravi Sable',
    maintenance_km_threshold: '',
    insurance_expiry: '',
    insurance_notify_days: '',
    road_tax_expiry: '',
    road_tax_notify_days: '',
    permit_expiry: '',
    permit_notify_days: '',
    authorization_expiry: '',
    authorization_notify_days: ''
  });

  const [vendors, setVendors] = useState([]);
  const [drivers, setDrivers] = useState([]);

  useEffect(() => {
    async function fetchVendors() {
      try {
        const res = await axios.get('/api/customers?entity_type=vendor');
        setVendors(res.data);
      } catch (err) {
        console.error("Failed to load vendors:", err);
      }
    }
    async function fetchDrivers() {
      try {
        const res = await axios.get('/api/drivers');
        // Keep active or on duty drivers
        setDrivers(res.data.filter(d => d.status === 'Active' || d.status === 'On Duty'));
      } catch (err) {
        console.error("Failed to load drivers:", err);
      }
    }
    fetchVendors();
    fetchDrivers();
  }, []);

  const [success, setSuccess] = useState('');
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validate = () => {
    const tempErrors = {};
    if (!vehicle.vehicle_number.trim()) {
      tempErrors.vehicle_number = "Vehicle plate number is required.";
    } else {
      if (vehicle.vehicle_number.length < 5) {
        tempErrors.vehicle_number = "Invalid plate number length.";
      }
    }
    if (vehicle.ownership_type === 'Vendor' && !vehicle.owner_name) {
      tempErrors.owner_name = "Please select a vendor.";
    }
    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    setSuccess('');
    setErrors({});

    try {
      const payload = {
        ...vehicle,
        vehicle_number: vehicle.vehicle_number.toUpperCase()
      };

      const nullableFields = [
        'maintenance_km_threshold', 'insurance_notify_days', 'road_tax_notify_days',
        'permit_notify_days', 'authorization_notify_days',
        'insurance_expiry', 'road_tax_expiry', 'permit_expiry', 'authorization_expiry'
      ];
      nullableFields.forEach(field => {
        if (payload[field] === '') {
          payload[field] = null;
        } else if (field.includes('notify') || field.includes('threshold')) {
          payload[field] = parseInt(payload[field], 10);
        }
      });

      await axios.post('/api/vehicles', payload);
      setSuccess("Vehicle added to fleet database successfully!");

      setVehicle({
        vehicle_number: '',
        model: '',
        driver_name: '',
        vehicle_type: 'Sedan',
        status: 'Active',
        ownership_type: 'Owner',
        owner_name: 'Ravi Sable',
        maintenance_km_threshold: '',
        insurance_expiry: '',
        insurance_notify_days: '',
        road_tax_expiry: '',
        road_tax_notify_days: '',
        permit_expiry: '',
        permit_notify_days: '',
        authorization_expiry: '',
        authorization_notify_days: ''
      });

      setTimeout(() => {
        navigateTo('vehicle-list');
      }, 1500);

    } catch (err) {
      console.error(err);
      const errMsg = err.response?.data?.detail || "An error occurred while adding vehicle.";
      setErrors({ api: errMsg });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-[1200px] mx-auto space-y-4">

      {success && (
        <div className="flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 p-3 rounded-xl shadow-lg">
          <CheckCircle className="h-5 w-5 shrink-0 animate-bounce" />
          <span className="font-semibold text-sm">{success}</span>
        </div>
      )}

      {errors.api && (
        <div className="flex items-center gap-3 bg-rose-500/10 border border-rose-500/30 text-rose-400 p-3 rounded-xl shadow-lg">
          <AlertTriangle className="h-5 w-5 shrink-0" />
          <span className="font-semibold text-sm">{errors.api}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-5 items-stretch">

          {/* ── LEFT COLUMN (CARD 1) ── */}
          <div className="glass-panel rounded-2xl border border-slate-700/50 shadow-xl p-5 md:p-6 space-y-6">

            {/* Header */}
            <div className="flex items-center gap-2 mb-2 border-b border-slate-800 pb-2">
              <Car className="h-5 w-5 text-indigo-400" />
              <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider">Vehicle Details</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Vehicle Plate Number <span className="text-rose-500">*</span></label>
                <input
                  type="text"
                  placeholder="e.g. MH12SP9620"
                  value={vehicle.vehicle_number}
                  onChange={(e) => {
                    setVehicle({ ...vehicle, vehicle_number: e.target.value.toUpperCase() });
                    if (errors.vehicle_number) setErrors(prev => ({ ...prev, vehicle_number: '' }));
                  }}
                  className={`w-full bg-slate-950/60 border ${errors.vehicle_number ? 'border-rose-500/80 focus:ring-rose-500' : 'border-slate-700 focus:border-indigo-500'} focus:ring-2 focus:ring-indigo-500/20 outline-none rounded-xl px-4 py-2.5 text-sm text-slate-100 transition`}
                  required
                />
                {errors.vehicle_number && <p className="text-xs text-rose-400 font-medium mt-1">{errors.vehicle_number}</p>}
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Car Model / Brand</label>
                <input
                  type="text"
                  placeholder="e.g. Maruti Suzuki Dzire"
                  value={vehicle.model}
                  onChange={(e) => setVehicle({ ...vehicle, model: e.target.value })}
                  className="w-full bg-slate-950/60 border border-slate-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none rounded-xl px-4 py-2.5 text-sm text-slate-100 transition"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Vehicle Class <span className="text-rose-500">*</span></label>
                <CustomSelect
                  value={vehicle.vehicle_type}
                  onChange={(val) => setVehicle({ ...vehicle, vehicle_type: val })}
                  options={['Sedan', 'Ertiga', 'SUV']}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Operational Status <span className="text-rose-500">*</span></label>
                <CustomSelect
                  value={vehicle.status}
                  onChange={(val) => setVehicle({ ...vehicle, status: val })}
                  options={[
                    { value: 'Active', label: 'Active / On Duty' },
                    { value: 'Maintenance', label: 'In Maintenance' },
                    { value: 'Inactive', label: 'Out of Service' }
                  ]}
                />
              </div>
            </div>

          </div>

          {/* ── RIGHT COLUMN (CARD 2) ── */}
          <div className="glass-panel rounded-2xl border border-slate-700/50 shadow-xl p-5 md:p-6 flex flex-col justify-between">
            <div className="space-y-6">

              {/* Header */}
              <div className="flex items-center gap-2 mb-2 border-b border-slate-800 pb-2">
                <Sparkles className="h-5 w-5 text-indigo-400" />
                <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider">Ownership & Assignment</h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-300 block">Ownership Type <span className="text-rose-500">*</span></label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setVehicle({ ...vehicle, ownership_type: 'Owner', owner_name: 'Ravi Sable' })}
                      className={`flex-1 py-1.5 px-2 rounded-lg border text-xs font-bold transition ${vehicle.ownership_type === 'Owner'
                        ? 'bg-indigo-600 border-indigo-500 text-white'
                        : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-slate-200'
                        }`}
                    >
                      Owner
                    </button>
                    <button
                      type="button"
                      onClick={() => setVehicle({ ...vehicle, ownership_type: 'Vendor', owner_name: '' })}
                      className={`flex-1 py-1.5 px-2 rounded-lg border text-xs font-bold transition ${vehicle.ownership_type === 'Vendor'
                        ? 'bg-indigo-600 border-indigo-500 text-white'
                        : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-slate-200'
                        }`}
                    >
                      Vendor
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    {vehicle.ownership_type === 'Owner' ? 'Owner Name' : 'Select Vendor'} <span className="text-rose-500">*</span>
                  </label>
                  {vehicle.ownership_type === 'Owner' ? (
                    <input
                      type="text"
                      readOnly
                      value={vehicle.owner_name}
                      className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-400 outline-none font-semibold cursor-not-allowed"
                    />
                  ) : (
                    <div className="space-y-1">
                      <CustomSelect
                        value={vehicle.owner_name}
                        onChange={(val) => setVehicle({ ...vehicle, owner_name: val })}
                        options={vendors.map(v => ({ value: v.name, label: v.name }))}
                        placeholder="Select a vendor..."
                      />
                      {errors.owner_name && <p className="text-xs text-rose-400 font-medium mt-1">{errors.owner_name}</p>}
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Assigned Driver Name</label>
                <CustomSelect
                  value={vehicle.driver_name}
                  onChange={(val) => setVehicle({ ...vehicle, driver_name: val })}
                  options={drivers.map(d => ({ value: d.name, label: `${d.name} (${d.phone})` }))}
                  placeholder="-- No Driver Assigned --"
                />
              </div>

            </div>
          </div>
        </div>

        {/* ── COMPLIANCE & RENEWALS (CARD 3) ── */}
        <div className="glass-panel rounded-2xl border border-slate-700/50 shadow-xl p-5 md:p-6 space-y-4 mt-6">
          <div className="flex items-center gap-2 mb-4 border-b border-slate-800 pb-2">
            <ShieldAlert className="h-5 w-5 text-emerald-400" />
            <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider">Compliance & Renewals</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 lg:gap-6">

            {/* Maintenance Threshold */}
            <div className="space-y-4 bg-slate-800/20 p-5 rounded-xl border border-slate-700/50">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Maintenance</h4>
              <div className="space-y-1.5">
                <label className="text-[10px] font-semibold text-slate-400 uppercase">Threshold (KMs)</label>
                <input
                  type="number"
                  placeholder="e.g. 10000"
                  value={vehicle.maintenance_km_threshold}
                  onChange={(e) => setVehicle({ ...vehicle, maintenance_km_threshold: e.target.value ? parseInt(e.target.value) : '' })}
                  className="w-full bg-slate-950/60 border border-slate-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none rounded-xl px-4 py-2.5 text-sm text-slate-100 transition"
                />
              </div>
            </div>

            {/* Insurance */}
            <div className="space-y-4 bg-slate-800/20 p-5 rounded-xl border border-slate-700/50">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Insurance</h4>
              <div className="space-y-1.5">
                <label className="text-[10px] font-semibold text-slate-400 uppercase">Expiry Date</label>
                <input type="date" value={vehicle.insurance_expiry} onChange={(e) => setVehicle({ ...vehicle, insurance_expiry: e.target.value })} className="w-full bg-slate-950/60 border border-slate-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-slate-100 rounded-xl px-4 py-2.5 text-sm outline-none transition [color-scheme:dark]" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-semibold text-slate-400 uppercase">Notify Before (Days)</label>
                <input type="number" min="0" placeholder="e.g. 15" value={vehicle.insurance_notify_days} onChange={(e) => setVehicle({ ...vehicle, insurance_notify_days: e.target.value })} className="w-full bg-slate-950/60 border border-slate-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-slate-100 rounded-xl px-4 py-2.5 text-sm outline-none transition" />
              </div>
            </div>

            {/* Road Tax */}
            <div className="space-y-4 bg-slate-800/20 p-5 rounded-xl border border-slate-700/50">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Road Tax</h4>
              <div className="space-y-1.5">
                <label className="text-[10px] font-semibold text-slate-400 uppercase">Expiry Date</label>
                <input type="date" value={vehicle.road_tax_expiry} onChange={(e) => setVehicle({ ...vehicle, road_tax_expiry: e.target.value })} className="w-full bg-slate-950/60 border border-slate-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-slate-100 rounded-xl px-4 py-2.5 text-sm outline-none transition [color-scheme:dark]" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-semibold text-slate-400 uppercase">Notify Before (Days)</label>
                <input type="number" min="0" placeholder="e.g. 15" value={vehicle.road_tax_notify_days} onChange={(e) => setVehicle({ ...vehicle, road_tax_notify_days: e.target.value })} className="w-full bg-slate-950/60 border border-slate-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-slate-100 rounded-xl px-4 py-2.5 text-sm outline-none transition" />
              </div>
            </div>

            {/* Permit */}
            <div className="space-y-4 bg-slate-800/20 p-5 rounded-xl border border-slate-700/50">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Permit</h4>
              <div className="space-y-1.5">
                <label className="text-[10px] font-semibold text-slate-400 uppercase">Expiry Date</label>
                <input type="date" value={vehicle.permit_expiry} onChange={(e) => setVehicle({ ...vehicle, permit_expiry: e.target.value })} className="w-full bg-slate-950/60 border border-slate-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-slate-100 rounded-xl px-4 py-2.5 text-sm outline-none transition [color-scheme:dark]" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-semibold text-slate-400 uppercase">Notify Before (Days)</label>
                <input type="number" min="0" placeholder="e.g. 15" value={vehicle.permit_notify_days} onChange={(e) => setVehicle({ ...vehicle, permit_notify_days: e.target.value })} className="w-full bg-slate-950/60 border border-slate-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-slate-100 rounded-xl px-4 py-2.5 text-sm outline-none transition" />
              </div>
            </div>

            {/* Authorization */}
            <div className="space-y-4 bg-slate-800/20 p-5 rounded-xl border border-slate-700/50">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Authorization</h4>
              <div className="space-y-1.5">
                <label className="text-[10px] font-semibold text-slate-400 uppercase">Expiry Date</label>
                <input type="date" value={vehicle.authorization_expiry} onChange={(e) => setVehicle({ ...vehicle, authorization_expiry: e.target.value })} className="w-full bg-slate-950/60 border border-slate-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-slate-100 rounded-xl px-4 py-2.5 text-sm outline-none transition [color-scheme:dark]" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-semibold text-slate-400 uppercase">Notify Before (Days)</label>
                <input type="number" min="0" placeholder="e.g. 15" value={vehicle.authorization_notify_days} onChange={(e) => setVehicle({ ...vehicle, authorization_notify_days: e.target.value })} className="w-full bg-slate-950/60 border border-slate-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-slate-100 rounded-xl px-4 py-2.5 text-sm outline-none transition" />
              </div>
            </div>

          </div>
        </div>

        {/* Buttons Panel */}
        <div className="flex justify-between items-center pt-2 pb-6 px-2">
          <button
            type="button"
            onClick={() => navigateTo('vehicle-list')}
            className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-semibold rounded-xl transition duration-150"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={isSubmitting}
            className="px-8 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-slate-50 text-sm font-bold rounded-xl shadow-lg hover:shadow-indigo-500/20 transition duration-150 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isSubmitting ? "Adding Vehicle..." : "Submit Vehicle Details"}
          </button>
        </div>
      </form>
    </div>
  );
}
