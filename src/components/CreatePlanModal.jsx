import React, { useState } from 'react';
import axios from 'axios';
import { Layers, CheckCircle, AlertTriangle, X } from 'lucide-react';
import CustomSelect from './CustomSelect';
import { useVehicleClasses } from '../hooks/useVehicleClasses';

export default function CreatePlanModal({ onClose, onSuccess, initialData }) {
  const [formData, setFormData] = useState({
    plan_name: initialData?.plan_name || '',
    company_rate: initialData?.company_rate || initialData?.rate || '',
    vendor_rate: initialData?.vendor_rate || initialData?.rate || '',
    extra_km_rate: initialData?.extra_km_rate || '',
    extra_hours_rate: initialData?.extra_hours_rate || '',
    vendor_extra_km_rate: initialData?.vendor_extra_km_rate || '',
    vendor_extra_hours_rate: initialData?.vendor_extra_hours_rate || '',
    vehicle_type: initialData?.vehicle_type || '',
    plan_type: initialData?.plan_type || 'Local',
    base_hours: initialData?.base_hours || '',
    base_km: initialData?.base_km || '',
    da_allowance: initialData?.da_allowance || '',
    night_allowance: initialData?.night_allowance || ''
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { vehicleClasses } = useVehicleClasses();

  const validate = () => {
    const tempErrors = {};
    if (!formData.vehicle_type) {
      tempErrors.vehicle_type = "Vehicle class is required.";
    }
    if (!formData.plan_name.trim()) {
      tempErrors.plan_name = "Plan name is required.";
    }

    if (!formData.company_rate) {
      tempErrors.company_rate = "Company rate is required.";
    } else if (isNaN(formData.company_rate) || parseFloat(formData.company_rate) <= 0) {
      tempErrors.company_rate = "Company rate must be a valid number greater than 0.";
    }

    if (!formData.vendor_rate) {
      tempErrors.vendor_rate = "Vendor rate is required.";
    } else if (isNaN(formData.vendor_rate) || parseFloat(formData.vendor_rate) <= 0) {
      tempErrors.vendor_rate = "Vendor rate must be a valid number greater than 0.";
    }

    if (!formData.extra_km_rate || isNaN(formData.extra_km_rate)) {
      tempErrors.extra_km_rate = "Extra KM rate must be a number.";
    }

    if (formData.plan_type === 'Local' && (!formData.extra_hours_rate || isNaN(formData.extra_hours_rate))) {
      tempErrors.extra_hours_rate = "Extra hour rate must be a number.";
    }

    if (formData.plan_type === 'Outstation' && (!formData.base_km || isNaN(formData.base_km))) {
      tempErrors.base_km = "Per day KM limit is required.";
    }

    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const updated = { ...prev, [name]: value };

      // Auto-parse if package name changes
      if (name === 'plan_name') {
        const hourMatch = value.match(/(\d+)\s*(?:hour|hr|h)/i);
        const kmMatch = value.match(/(\d+)\s*(?:km|kilometer)/i);
        const rateMatch = value.match(/(\d+)\s*(?:rs|inr|rate|price|rupees)/i);

        if (hourMatch) updated.base_hours = hourMatch[1];
        if (kmMatch) updated.base_km = kmMatch[1];
        if (rateMatch) {
          updated.company_rate = rateMatch[1];
          updated.vendor_rate = rateMatch[1];
        }
      }

      // Auto-calculate Base Rates based on KM limits and Rates ONLY for Outstation
      if (updated.plan_type === 'Outstation') {
        if (['base_km', 'extra_km_rate', 'vendor_extra_km_rate', 'plan_name'].includes(name)) {
          const baseKm = parseFloat(updated.base_km) || 0;
          
          if (updated.extra_km_rate && !isNaN(parseFloat(updated.extra_km_rate))) {
            updated.company_rate = (baseKm * parseFloat(updated.extra_km_rate)).toString();
          }
          
          if (updated.vendor_extra_km_rate && !isNaN(parseFloat(updated.vendor_extra_km_rate))) {
            updated.vendor_rate = (baseKm * parseFloat(updated.vendor_extra_km_rate)).toString();
          }
        }
      }

      return updated;
    });
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);

    try {
      const payload = {
        plan_name: formData.plan_name,
        company_rate: parseFloat(formData.company_rate),
        vendor_rate: parseFloat(formData.vendor_rate),
        vehicle_type: formData.vehicle_type,
        extra_km_rate: parseFloat(formData.extra_km_rate),
        extra_hours_rate: formData.plan_type === 'Local' ? parseFloat(formData.extra_hours_rate) : 0,
        vendor_extra_km_rate: formData.vendor_extra_km_rate ? parseFloat(formData.vendor_extra_km_rate) : null,
        vendor_extra_hours_rate: formData.plan_type === 'Local' && formData.vendor_extra_hours_rate ? parseFloat(formData.vendor_extra_hours_rate) : null,
        customer_type: 'guest',
        customer_id: null,
        plan_type: formData.plan_type,
        base_hours: formData.base_hours ? parseInt(formData.base_hours, 10) : null,
        base_km: formData.base_km ? parseInt(formData.base_km, 10) : null,
        da_allowance: formData.da_allowance ? parseFloat(formData.da_allowance) : 0,
        night_allowance: formData.night_allowance ? parseFloat(formData.night_allowance) : 0
      };

      let res;
      if (initialData?.id) {
        res = await axios.put(`/api/plans/${initialData.id}`, payload);
      } else {
        res = await axios.post('/api/plans', payload);
      }
      onSuccess(res.data);
    } catch (err) {
      console.error(err);
      const errMsg = err.response?.data?.detail || "An error occurred while creating plan.";
      setErrors({ api: errMsg });
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="glass-panel w-full max-w-lg rounded-2xl border border-slate-700/60 shadow-2xl p-6 space-y-4 my-8 relative">

        <div className="flex justify-between items-center border-b border-slate-800 pb-3">
          <h2 className="text-lg font-bold text-slate-50 flex items-center gap-2">
            <Layers className="h-5 w-5 text-indigo-400" />
            {initialData ? 'Edit Package' : 'Create Custom Package'}
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-50 p-1 hover:bg-slate-800 rounded-lg transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {errors.api && (
          <div className="flex items-center gap-3 bg-rose-500/10 border border-rose-500/30 text-rose-400 p-3 rounded-xl shadow-lg">
            <AlertTriangle className="h-5 w-5 shrink-0" />
            <span className="font-semibold text-sm">{errors.api}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Plan Type Toggle */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300 block">Plan Type <span className="text-rose-500">*</span></label>
            <div className="flex gap-4 mt-1">
              <label className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border ${formData.plan_type === 'Local' ? 'bg-indigo-500/10 border-indigo-500 text-indigo-400' : 'bg-slate-950/60 border-slate-700 text-slate-400 hover:border-slate-500'} cursor-pointer transition shadow-sm`}>
                <input
                  type="radio"
                  name="plan_type"
                  value="Local"
                  checked={formData.plan_type === 'Local'}
                  onChange={handleChange}
                  className="hidden"
                />
                <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${formData.plan_type === 'Local' ? 'border-indigo-500' : 'border-slate-500'}`}>
                  {formData.plan_type === 'Local' && <div className="w-2 h-2 rounded-full bg-indigo-500" />}
                </div>
                <span className="text-sm font-semibold">Local</span>
              </label>
              <label className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border ${formData.plan_type === 'Outstation' ? 'bg-indigo-500/10 border-indigo-500 text-indigo-400' : 'bg-slate-950/60 border-slate-700 text-slate-400 hover:border-slate-500'} cursor-pointer transition shadow-sm`}>
                <input
                  type="radio"
                  name="plan_type"
                  value="Outstation"
                  checked={formData.plan_type === 'Outstation'}
                  onChange={handleChange}
                  className="hidden"
                />
                <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${formData.plan_type === 'Outstation' ? 'border-indigo-500' : 'border-slate-500'}`}>
                  {formData.plan_type === 'Outstation' && <div className="w-2 h-2 rounded-full bg-indigo-500" />}
                </div>
                <span className="text-sm font-semibold">Outstation</span>
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Vehicle Class */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-400">Vehicle Class <span className="text-rose-500">*</span></label>
              <CustomSelect
                value={formData.vehicle_type}
                onChange={(val) => setFormData({ ...formData, vehicle_type: val })}
                options={vehicleClasses.map(c => ({ value: c.name, label: c.capacity ? `${c.name} (${c.capacity} Seater)` : c.name }))}
                placeholder="-- Select Class --"
              />
              {errors.vehicle_type && <p className="text-xs text-rose-400 mt-1 font-medium">{errors.vehicle_type}</p>}
            </div>

            {/* Plan Name */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-400">Package Name <span className="text-rose-500">*</span></label>
              <input
                type="text"
                name="plan_name"
                placeholder={formData.plan_type === 'Local' ? "e.g. 8 hours 80 Kms" : "e.g. Pune to Mumbai"}
                value={formData.plan_name}
                onChange={handleChange}
                className={`w-full bg-slate-950/60 border ${errors.plan_name ? 'border-rose-500' : 'border-slate-800 focus:border-indigo-500'} focus:ring-1 focus:ring-indigo-500/50 outline-none rounded-lg px-4 py-2.5 text-sm text-slate-200 transition`}
              />
              {errors.plan_name && <p className="text-xs text-rose-400 mt-1 font-medium">{errors.plan_name}</p>}
              {formData.plan_type === 'Local' && <p className="text-xs text-slate-500 font-medium">Tip: Use format e.g. "X hours Y Kms" or "X Hr Y Km" for auto-parsing.</p>}
            </div>
          </div>

          {formData.plan_type === 'Local' ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-400">Base Hours (Auto-parsed)</label>
                  <input
                    type="number"
                    name="base_hours"
                    placeholder="e.g. 8"
                    value={formData.base_hours}
                    onChange={handleChange}
                    className="w-full bg-slate-950/60 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 outline-none rounded-lg px-4 py-2.5 text-sm text-slate-200 transition"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-400">Base KMs (Auto-parsed)</label>
                  <input
                    type="number"
                    name="base_km"
                    placeholder="e.g. 80"
                    value={formData.base_km}
                    onChange={handleChange}
                    className="w-full bg-slate-950/60 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 outline-none rounded-lg px-4 py-2.5 text-sm text-slate-200 transition"
                  />
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Per Day KM Limit - full width */}
              <div className="space-y-1 mt-2">
                <label className="text-xs font-semibold text-slate-400">Per Day KM Limit <span className="text-rose-500">*</span></label>
                <input
                  type="number"
                  name="base_km"
                  placeholder="e.g. 300"
                  value={formData.base_km}
                  onChange={handleChange}
                  className={`w-full bg-slate-950/60 border ${errors.base_km ? 'border-rose-500' : 'border-slate-800 focus:border-indigo-500'} focus:ring-1 focus:ring-indigo-500/50 outline-none rounded-lg px-4 py-2.5 text-sm text-slate-200 transition`}
                />
                {errors.base_km && <p className="text-xs text-rose-400 mt-1 font-medium">{errors.base_km}</p>}
              </div>
            </>
          )}




          {/* Rates — 2-column: Company left, Vendor right */}
          <div className="border-t border-slate-800/50 pt-4 mt-4">

            {/* Column headers */}
            <div className="grid grid-cols-2 gap-4 mb-1">
              <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Company</p>
              <p className="text-[10px] font-bold text-amber-400/80 uppercase tracking-widest">Vendor</p>
            </div>

            {/* Extra KM Rate row - OUTSTATION (ABOVE BASE RATE) */}
            {formData.plan_type === 'Outstation' && (
              <div className="grid grid-cols-2 gap-4 mb-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-400">KM RATE (₹) <span className="text-rose-500">*</span></label>
                  <input
                    type="text"
                    name="extra_km_rate"
                    value={formData.extra_km_rate}
                    onChange={handleChange}
                    className={`w-full bg-slate-950/60 border ${errors.extra_km_rate ? 'border-rose-500' : 'border-slate-800 focus:border-indigo-500'} focus:ring-1 focus:ring-indigo-500/50 outline-none rounded-lg px-4 py-2.5 text-sm text-slate-200 transition`}
                  />
                  {errors.extra_km_rate && <p className="text-xs text-rose-400 mt-1 font-medium">{errors.extra_km_rate}</p>}
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-amber-400/80">KM RATE (₹) <span className="text-slate-500 font-normal"></span></label>
                  <input
                    type="text"
                    name="vendor_extra_km_rate"
                    placeholder="e.g. 12"
                    value={formData.vendor_extra_km_rate}
                    onChange={handleChange}
                    className="w-full bg-slate-950/60 border border-slate-800 focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/30 outline-none rounded-lg px-4 py-2.5 text-sm text-slate-200 transition"
                  />
                </div>
              </div>
            )}

            {/* Base Rate row */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400">Base Rate (Rs.) <span className="text-rose-500">*</span></label>
                <input
                  type="text"
                  name="company_rate"
                  placeholder="e.g. 4000"
                  value={formData.company_rate}
                  onChange={handleChange}
                  className={`w-full bg-slate-950/60 border ${errors.company_rate ? 'border-rose-500' : 'border-slate-800 focus:border-indigo-500'} focus:ring-1 focus:ring-indigo-500/50 outline-none rounded-lg px-4 py-2.5 text-sm text-slate-200 transition`}
                />
                {errors.company_rate && <p className="text-xs text-rose-400 mt-1 font-medium">{errors.company_rate}</p>}
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-amber-400/80">Base Rate (Rs.) <span className="text-rose-500">*</span></label>
                <input
                  type="text"
                  name="vendor_rate"
                  placeholder="e.g. 3500"
                  value={formData.vendor_rate}
                  onChange={handleChange}
                  className={`w-full bg-slate-950/60 border ${errors.vendor_rate ? 'border-rose-500' : 'border-slate-800 focus:border-amber-500/50'} focus:ring-1 focus:ring-amber-500/30 outline-none rounded-lg px-4 py-2.5 text-sm text-slate-200 transition`}
                />
                {errors.vendor_rate && <p className="text-xs text-rose-400 mt-1 font-medium">{errors.vendor_rate}</p>}
              </div>
            </div>

            {/* Extra KM Rate row - LOCAL (BELOW BASE RATE) */}
            {formData.plan_type === 'Local' && (
              <div className="grid grid-cols-2 gap-4 mt-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-400">EXTRA KM RATE (₹) <span className="text-rose-500">*</span></label>
                  <input
                    type="text"
                    name="extra_km_rate"
                    value={formData.extra_km_rate}
                    onChange={handleChange}
                    className={`w-full bg-slate-950/60 border ${errors.extra_km_rate ? 'border-rose-500' : 'border-slate-800 focus:border-indigo-500'} focus:ring-1 focus:ring-indigo-500/50 outline-none rounded-lg px-4 py-2.5 text-sm text-slate-200 transition`}
                  />
                  {errors.extra_km_rate && <p className="text-xs text-rose-400 mt-1 font-medium">{errors.extra_km_rate}</p>}
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-amber-400/80">EXTRA KM RATE (₹) <span className="text-slate-500 font-normal"></span></label>
                  <input
                    type="text"
                    name="vendor_extra_km_rate"
                    placeholder="e.g. 12"
                    value={formData.vendor_extra_km_rate}
                    onChange={handleChange}
                    className="w-full bg-slate-950/60 border border-slate-800 focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/30 outline-none rounded-lg px-4 py-2.5 text-sm text-slate-200 transition"
                  />
                </div>
              </div>
            )}

            {/* Extra Hour Rate row — Local only */}
            {formData.plan_type === 'Local' && (
              <div className="grid grid-cols-2 gap-4 mt-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-400">COMPANY HOUR RATE (₹) <span className="text-rose-500">*</span></label>
                  <input
                    type="text"
                    name="extra_hours_rate"
                    value={formData.extra_hours_rate}
                    onChange={handleChange}
                    className={`w-full bg-slate-950/60 border ${errors.extra_hours_rate ? 'border-rose-500' : 'border-slate-800 focus:border-indigo-500'} focus:ring-1 focus:ring-indigo-500/50 outline-none rounded-lg px-4 py-2.5 text-sm text-slate-200 transition`}
                  />
                  {errors.extra_hours_rate && <p className="text-xs text-rose-400 mt-1 font-medium">{errors.extra_hours_rate}</p>}
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-amber-400/80">COMPANY HOUR RATE (₹) <span className="text-slate-500 font-normal"></span></label>
                  <input
                    type="text"
                    name="vendor_extra_hours_rate"
                    placeholder="e.g. 150"
                    value={formData.vendor_extra_hours_rate}
                    onChange={handleChange}
                    className="w-full bg-slate-950/60 border border-slate-800 focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/30 outline-none rounded-lg px-4 py-2.5 text-sm text-slate-200 transition"
                  />
                </div>
              </div>
            )}

            {/* Allowances row */}
            <div className="grid grid-cols-2 gap-4 mt-3 pt-3 border-t border-slate-800/40">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400">DRIVER ALLOWANCE (₹) <span className="text-slate-500 font-normal">(Optional)</span></label>
                <input
                  type="number"
                  name="da_allowance"
                  placeholder="e.g. 300"
                  value={formData.da_allowance}
                  onChange={handleChange}
                  className="w-full bg-slate-950/60 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 outline-none rounded-lg px-4 py-2.5 text-sm text-slate-200 transition"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400">NIGHT ALLOWANCE (₹) <span className="text-slate-500 font-normal">(Optional)</span></label>
                <input
                  type="number"
                  name="night_allowance"
                  placeholder="e.g. 200"
                  value={formData.night_allowance}
                  onChange={handleChange}
                  className="w-full bg-slate-950/60 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 outline-none rounded-lg px-4 py-2.5 text-sm text-slate-200 transition"
                />
              </div>
            </div>
          </div>


          {/* Buttons Panel */}
          <div className="flex justify-end items-center mt-5 gap-3 border-t border-slate-800/50 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition"
            >
              Cancel
            </button>

            <button type="submit" disabled={isSubmitting} className="px-5 py-2 text-sm font-bold bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition shadow-lg shadow-indigo-500/25 flex items-center gap-2 disabled:opacity-50">
              {isSubmitting ? (initialData ? 'Saving...' : 'Creating...') : (initialData ? 'Save Changes' : 'Create Package')}
              {!isSubmitting && <CheckCircle className="h-4 w-4" />}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
