import React, { useState } from 'react';
import axios from 'axios';
import { UserPlus, Sparkles, CheckCircle, AlertTriangle, IndianRupee, Car, Phone, User, MapPin } from 'lucide-react';
import CustomDatePicker from '../components/CustomDatePicker';
import CustomSelect from '../components/CustomSelect';

const inputCls = (hasError) =>
  `w-full bg-slate-950/60 border ${hasError
    ? 'border-rose-500/80 focus:ring-rose-500/20'
    : 'border-slate-700 focus:border-indigo-500 focus:ring-indigo-500/20'
  } focus:ring-2 outline-none rounded-xl px-4 py-2.5 text-sm text-slate-100 transition placeholder-slate-600`;

const amountCls = (color) =>
  `w-full bg-slate-950/60 border border-slate-700 focus:border-${color}-500 focus:ring-2 focus:ring-${color}-500/20 outline-none rounded-xl pl-8 pr-4 py-2.5 text-sm text-slate-100 transition`;

export default function AddDriver({ navigateTo }) {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    license_number: '',
    status: 'Active',
    address: '',
    joining_date: '',
    license_expiry_date: '',
    basic_salary: '',
    da_local: '',
    da_outstation: '',
  });

  const [errors, setErrors] = useState({});
  const [successMsg, setSuccessMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validate = () => {
    const tempErrors = {};
    if (!formData.name.trim()) tempErrors.name = 'Driver name is required.';
    const phonePattern = /^\d{10}$/;
    if (!formData.phone) {
      tempErrors.phone = 'Phone number is required.';
    } else if (!phonePattern.test(formData.phone)) {
      tempErrors.phone = 'Phone must be exactly 10 digits.';
    }
    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const resetForm = () => setFormData({
    name: '', phone: '', license_number: '', status: 'Active',
    address: '', joining_date: '', license_expiry_date: '',
    basic_salary: '', da_local: '', da_outstation: '',
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setIsSubmitting(true);
    setSuccessMsg('');
    try {
      const payload = {
        ...formData,
        basic_salary: formData.basic_salary ? parseFloat(formData.basic_salary) : 0,
        da_local: formData.da_local ? parseFloat(formData.da_local) : 0,
        da_outstation: formData.da_outstation ? parseFloat(formData.da_outstation) : 0,
      };
      await axios.post('/api/drivers', payload);
      setSuccessMsg('Driver added successfully!');
      resetForm();
      setTimeout(() => navigateTo('driver-list'), 1500);
    } catch (err) {
      console.error(err);
      let errorMsg = 'An error occurred while adding driver.';
      if (err.response?.data?.detail) {
        if (Array.isArray(err.response.data.detail)) {
          errorMsg = err.response.data.detail.map(e => e.msg).join(', ');
        } else {
          errorMsg = err.response.data.detail;
        }
      }
      setErrors({ api: errorMsg });
    } finally {
      setIsSubmitting(false);
    }
  };

  const fmt = (v) => v ? `₹${Number(v).toLocaleString('en-IN')}` : '—';

  return (
    <div className="space-y-4">

      {/* Alerts */}
      {successMsg && (
        <div className="flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 p-4 rounded-xl">
          <CheckCircle className="h-5 w-5 shrink-0 animate-bounce" />
          <span className="font-semibold">{successMsg}</span>
        </div>
      )}
      {errors.api && (
        <div className="flex items-center gap-3 bg-rose-500/10 border border-rose-500/30 text-rose-400 p-4 rounded-xl">
          <AlertTriangle className="h-5 w-5 shrink-0" />
          <span className="font-semibold">{errors.api}</span>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Page header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-500/15 p-2 rounded-xl border border-indigo-500/30">
              <UserPlus className="h-5 w-5 text-indigo-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-50 tracking-tight">Add New Driver</h1>
              <p className="text-xs text-slate-500">Fill in all driver details and salary structure</p>
            </div>
          </div>

        </div>

        {/* Two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

          {/* ── LEFT PANEL: Basic Info + License ── */}
          <div className="glass-panel rounded-2xl border border-slate-700/50 shadow-xl p-6 space-y-5">

            {/* Section: Basic Info */}
            <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
              <User className="h-4 w-4 text-indigo-400" />
              <h2 className="text-sm font-bold text-slate-50 uppercase tracking-wider">Basic Information</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Driver Name *</label>
                <input
                  type="text" name="name"
                  placeholder="e.g. John Doe"
                  value={formData.name}
                  onChange={handleChange}
                  className={inputCls(errors.name)}
                />
                {errors.name && <p className="text-xs text-rose-400">{errors.name}</p>}
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1">
                  <Phone className="h-3 w-3" /> Phone *
                </label>
                <input
                  type="text" name="phone" maxLength="10"
                  placeholder="10-digit mobile"
                  value={formData.phone}
                  onChange={handleChange}
                  className={inputCls(errors.phone)}
                />
                {errors.phone && <p className="text-xs text-rose-400">{errors.phone}</p>}
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1">
                <MapPin className="h-3 w-3" /> Address
              </label>
              <textarea
                name="address" rows="2"
                placeholder="Enter complete driver address..."
                value={formData.address}
                onChange={handleChange}
                className={`${inputCls(false)} resize-none`}
              />
            </div>

            {/* Section: License & Status */}
            <div className="flex items-center gap-2 pt-1 pb-2 border-b border-slate-800">
              <Sparkles className="h-4 w-4 text-indigo-400" />
              <h2 className="text-sm font-bold text-slate-50 uppercase tracking-wider">License &amp; Status</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">License Number</label>
                <input
                  type="text" name="license_number"
                  placeholder="e.g. MH12 20190001234"
                  value={formData.license_number}
                  onChange={handleChange}
                  className={inputCls(false)}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Status</label>
                <CustomSelect
                  value={formData.status}
                  onChange={(val) => handleChange({ target: { name: 'status', value: val } })}
                  options={['Active', 'Inactive']}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Joining Date</label>
                <CustomDatePicker
                  value={formData.joining_date}
                  onChange={(d) => setFormData(prev => ({ ...prev, joining_date: d }))}
                  placeholder="Select joining date"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">License Expiry Date</label>
                <CustomDatePicker
                  value={formData.license_expiry_date}
                  onChange={(d) => setFormData(prev => ({ ...prev, license_expiry_date: d }))}
                  placeholder="Select expiry date"
                />
              </div>
            </div>
          </div>

          {/* ── RIGHT PANEL: Salary & DA ── */}
          <div className="glass-panel rounded-2xl border border-slate-700/50 shadow-xl p-6 flex flex-col gap-5">

            <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
              <IndianRupee className="h-4 w-4 text-emerald-400" />
              <h2 className="text-sm font-bold text-slate-50 uppercase tracking-wider">Salary &amp; Daily Allowance (DA)</h2>
            </div>

            {/* Basic Salary */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Basic Salary</label>
              <p className="text-[11px] text-slate-500">Monthly fixed salary (₹)</p>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-semibold text-sm">₹</span>
                <input
                  type="number" name="basic_salary" min="0"
                  placeholder="e.g. 15000"
                  value={formData.basic_salary}
                  onChange={handleChange}
                  className="w-full bg-slate-950/60 border border-slate-700 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none rounded-xl pl-8 pr-4 py-2.5 text-sm text-slate-100 transition"
                />
              </div>
            </div>

            {/* DA Local */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">DA — Local</label>
              <p className="text-[11px] text-slate-500">Per booking for local/city trips (₹)</p>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-semibold text-sm">₹</span>
                <input
                  type="number" name="da_local" min="0"
                  placeholder="e.g. 300"
                  value={formData.da_local}
                  onChange={handleChange}
                  className="w-full bg-slate-950/60 border border-slate-700 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none rounded-xl pl-8 pr-4 py-2.5 text-sm text-slate-100 transition"
                />
              </div>
            </div>

            {/* DA Outstation */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">DA — Outstation</label>
              <p className="text-[11px] text-slate-500">Per booking for outstation/overnight trips (₹)</p>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-semibold text-sm">₹</span>
                <input
                  type="number" name="da_outstation" min="0"
                  placeholder="e.g. 600"
                  value={formData.da_outstation}
                  onChange={handleChange}
                  className="w-full bg-slate-950/60 border border-slate-700 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 outline-none rounded-xl pl-8 pr-4 py-2.5 text-sm text-slate-100 transition"
                />
              </div>
            </div>
            <div className="flex gap-3 justify-end mt-auto pt-5 border-t border-slate-800">
              <button
                type="button"
                onClick={() => navigateTo('driver-list')}
                className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-semibold rounded-xl transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-slate-50 text-sm font-bold rounded-xl shadow-lg hover:shadow-indigo-500/20 transition disabled:opacity-50"
              >
                {isSubmitting ? 'Saving...' : 'Submit Driver'}
              </button>
            </div>
          </div>

        </div>
      </form>
    </div>
  );
}
