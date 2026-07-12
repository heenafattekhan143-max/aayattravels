import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { UserPlus, Sparkles, MapPin, CheckCircle, AlertTriangle } from 'lucide-react';
import CustomSelect from '../components/CustomSelect';

const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat",
  "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh",
  "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab",
  "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh",
  "Uttarakhand", "West Bengal", "Delhi", "Jammu and Kashmir", "Ladakh", "Puducherry"
];

const GST_TYPES = ["Registered", "Unregistered", "Composite", "Consumer"];

export default function AddCustomer({ navigateTo }) {
  const [formData, setFormData] = useState({
    entity_type: 'customer',
    name: '',
    gstin: '',
    phone: '',
    gst_type: 'Unregistered',
    billing_address: '',
    state: 'Maharashtra',
    email: ''
  });

  const [errors, setErrors] = useState({});
  const [successMsg, setSuccessMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGstLoading, setIsGstLoading] = useState(false);
  const [gstLookupSuccess, setGstLookupSuccess] = useState(false);

  useEffect(() => {
    const gstin = formData.gstin.trim().toUpperCase();
    if (gstin.length === 15) {
      const gstinPattern = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
      if (gstinPattern.test(gstin)) {
        handleGstLookup(gstin);
      }
    } else {
      setGstLookupSuccess(false);
    }
  }, [formData.gstin]);

  const handleGstLookup = async (gstin) => {
    setIsGstLoading(true);
    setErrors(prev => ({ ...prev, gstin: '' }));
    try {
      const res = await axios.get(`/api/customers/gst-lookup/${gstin}`);
      const data = res.data;
      if (data && data.legal_name) {
        setFormData(prev => ({
          ...prev,
          name: data.legal_name,
          state: data.state || prev.state,
          billing_address: data.billing_address || prev.billing_address,
          email: data.email || prev.email,
          gst_type: 'Registered'
        }));
        setGstLookupSuccess(true);
      }
    } catch (err) {
      console.error('GSTIN lookup failed:', err);
    } finally {
      setIsGstLoading(false);
    }
  };

  const validate = () => {
    const tempErrors = {};
    if (!formData.name.trim()) tempErrors.name = "Name is required.";

    // Phone validation (10 digits)
    const phonePattern = /^\d{10}$/;
    if (!formData.phone) {
      tempErrors.phone = "Phone number is required.";
    } else if (!phonePattern.test(formData.phone)) {
      tempErrors.phone = "Phone number must be exactly 10 digits.";
    }

    // GSTIN Validation (Indian GSTIN format: 15 alphanumeric characters)
    // Only validate if GST Type is Registered or Composite
    if (formData.gst_type === 'Registered' || formData.gst_type === 'Composite') {
      const gstinPattern = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
      if (!formData.gstin) {
        tempErrors.gstin = "GSTIN is required for Registered/Composite GST type.";
      } else if (!gstinPattern.test(formData.gstin.toUpperCase())) {
        tempErrors.gstin = "Invalid Indian GSTIN format (e.g. 27AAAAA1111A1Z1).";
      }
    }

    // Email validation
    if (formData.email) {
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailPattern.test(formData.email)) {
        tempErrors.email = "Invalid email format.";
      }
    }

    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear validation error when editing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleTypeChange = (type) => {
    setFormData(prev => ({
      ...prev,
      entity_type: type
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    setSuccessMsg('');

    try {
      const payload = {
        ...formData,
        gstin: (formData.gst_type === 'Registered' || formData.gst_type === 'Composite') ? formData.gstin.toUpperCase() : ''
      };

      await axios.post('/api/customers', payload);
      setSuccessMsg(`${formData.entity_type === 'customer' ? 'Customer' : 'Vendor'} added successfully!`);

      // Reset form
      setFormData({
        entity_type: 'customer',
        name: '',
        gstin: '',
        phone: '',
        gst_type: 'Unregistered',
        billing_address: '',
        state: 'Maharashtra',
        email: ''
      });

      setTimeout(() => {
        navigateTo('customer-list');
      }, 1500);

    } catch (err) {
      console.error(err);
      const errMsg = err.response?.data?.detail || "An error occurred while adding customer.";
      setErrors({ api: errMsg });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-[1200px] mx-auto space-y-4">
      {successMsg && (
        <div className="flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 p-3 rounded-xl shadow-lg">
          <CheckCircle className="h-5 w-5 shrink-0 animate-bounce" />
          <span className="font-semibold text-sm">{successMsg}</span>
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
              <UserPlus className="h-5 w-5 text-indigo-400" />
              <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider">Basic Information</h3>
            </div>

            {/* Type Selector Radio Buttons */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300 block">Account Type <span className="text-rose-500">*</span></label>
              <div className="flex gap-6 mt-1">
                <label className="flex items-center gap-2 cursor-pointer text-slate-300 text-sm">
                  <input
                    type="radio"
                    name="entity_type"
                    checked={formData.entity_type === 'customer'}
                    onChange={() => handleTypeChange('customer')}
                    className="w-4 h-4 text-indigo-600 border-slate-700 focus:ring-indigo-500 bg-slate-950"
                  />
                  <span className="font-semibold">Company / Customer</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-slate-300 text-sm">
                  <input
                    type="radio"
                    name="entity_type"
                    checked={formData.entity_type === 'vendor'}
                    onChange={() => handleTypeChange('vendor')}
                    className="w-4 h-4 text-indigo-600 border-slate-700 focus:ring-indigo-500 bg-slate-950"
                  />
                  <span className="font-semibold">Vendor</span>
                </label>
              </div>
            </div>

            {/* Full Name & Phone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Full Name <span className="text-rose-500">*</span></label>
                <input
                  type="text"
                  name="name"
                  placeholder="e.g. John Doe / Purvi Travels"
                  value={formData.name}
                  onChange={handleChange}
                  className={`w-full bg-slate-950/60 border ${errors.name ? 'border-rose-500/80 focus:ring-rose-500' : 'border-slate-700 focus:border-indigo-500'} focus:ring-2 focus:ring-indigo-500/20 outline-none rounded-xl px-4 py-2.5 text-sm text-slate-100 transition`}
                />
                {errors.name && <p className="text-xs text-rose-400 mt-1 font-medium">{errors.name}</p>}
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Phone Number <span className="text-rose-500">*</span></label>
                <input
                  type="text"
                  name="phone"
                  maxLength="10"
                  placeholder="e.g. 9876543210"
                  value={formData.phone}
                  onChange={handleChange}
                  className={`w-full bg-slate-950/60 border ${errors.phone ? 'border-rose-500/80 focus:ring-rose-500' : 'border-slate-700 focus:border-indigo-500'} focus:ring-2 focus:ring-indigo-500/20 outline-none rounded-xl px-4 py-2.5 text-sm text-slate-100 transition`}
                />
                {errors.phone && <p className="text-xs text-rose-400 mt-1 font-medium">{errors.phone}</p>}
              </div>
            </div>

            {/* Email */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Email Address</label>
              <input
                type="text"
                name="email"
                placeholder="e.g. client@domain.com"
                value={formData.email}
                onChange={handleChange}
                className={`w-full bg-slate-950/60 border ${errors.email ? 'border-rose-500/80 focus:ring-rose-500' : 'border-slate-700 focus:border-indigo-500'} focus:ring-2 focus:ring-indigo-500/20 outline-none rounded-xl px-4 py-2.5 text-sm text-slate-100 transition`}
              />
              {errors.email && <p className="text-xs text-rose-400 mt-1 font-medium">{errors.email}</p>}
            </div>

          </div>

          {/* ── RIGHT COLUMN (CARD 2) ── */}
          <div className="glass-panel rounded-2xl border border-slate-700/50 shadow-xl p-5 md:p-6 flex flex-col justify-between">
            <div className="space-y-6">
              
              <div className="flex items-center gap-2 mb-2 border-b border-slate-800 pb-2">
                <Sparkles className="h-5 w-5 text-indigo-400" />
                <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider">GST & Address Details</h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">GST Type <span className="text-rose-500">*</span></label>
                  <CustomSelect
                    value={formData.gst_type}
                    onChange={(val) => handleChange({ target: { name: 'gst_type', value: val } })}
                    options={GST_TYPES}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">
                    GSTIN
                    {(formData.gst_type === 'Registered' || formData.gst_type === 'Composite') && <span className="text-rose-500"> *</span>}
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      name="gstin"
                      placeholder="15-character Alphanumeric"
                      value={formData.gstin}
                      onChange={handleChange}
                      disabled={formData.gst_type === 'Unregistered' || formData.gst_type === 'Consumer'}
                      className={`w-full bg-slate-950/60 border ${errors.gstin ? 'border-rose-500/80 focus:ring-rose-500' : 'border-slate-700 focus:border-indigo-500'} focus:ring-2 focus:ring-indigo-500/20 outline-none rounded-xl px-4 py-2.5 text-sm text-slate-100 transition disabled:opacity-40 disabled:cursor-not-allowed`}
                    />
                    {isGstLoading && (
                      <span className="absolute right-4 top-3 flex h-4 w-4 items-center justify-center">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                      </span>
                    )}
                  </div>
                  {gstLookupSuccess && (
                    <p className="text-xs text-emerald-400 mt-1 font-semibold flex items-center gap-1">
                      <span>✨ GSTIN details auto-filled successfully!</span>
                    </p>
                  )}
                  {errors.gstin && <p className="text-xs text-rose-400 mt-1 font-medium">{errors.gstin}</p>}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1">
                  State <span className="text-rose-500">*</span>
                  <MapPin className="h-3 w-3 text-indigo-400 inline" />
                </label>
                <CustomSelect
                  value={formData.state}
                  onChange={(val) => handleChange({ target: { name: 'state', value: val } })}
                  options={INDIAN_STATES}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Billing Address</label>
                <textarea
                  name="billing_address"
                  rows="2"
                  placeholder="Enter complete company billing address..."
                  value={formData.billing_address}
                  onChange={handleChange}
                  className="w-full bg-slate-950/60 border border-slate-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none rounded-xl px-4 py-2 text-sm text-slate-100 transition resize-none"
                ></textarea>
              </div>
            </div>

            {/* Buttons Panel */}
            <div className="flex justify-between items-center border-t border-slate-800 pt-5 mt-5">
              <button
                type="button"
                onClick={() => navigateTo('customer-list')}
                className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-semibold rounded-xl transition duration-150"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                className="px-8 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-slate-50 text-sm font-bold rounded-xl shadow-lg hover:shadow-indigo-500/20 transition duration-150 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isSubmitting ? "Submitting..." : "Submit Profile"}
              </button>
            </div>
          </div>

        </div>
      </form>
    </div>
  );
}
