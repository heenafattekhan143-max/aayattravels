import React, { useState, useEffect } from 'react';
import { X, Search } from 'lucide-react';

const CustomSelect = ({ value, onChange, options, disabled, placement }) => {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <div className="relative w-full">
      <div
        className={`w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 outline-none flex justify-between items-center ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer focus:border-indigo-500'}`}
        onClick={() => !disabled && setIsOpen(!isOpen)}
      >
        <span>{options.find(o => o.value === value)?.label || 'Select...'}</span>
        <span className="text-slate-400 text-[10px]">▼</span>
      </div>
      {isOpen && (
        <div className={`absolute z-50 left-0 right-0 ${placement === 'top' ? 'bottom-full mb-1' : 'top-full mt-1'} bg-[#0f172a] border border-slate-700 rounded-lg max-h-48 overflow-y-auto shadow-xl`}>
          {options.map((opt, i) => (
            <div
              key={i}
              className="p-2 text-xs text-slate-200 hover:bg-indigo-600/30 cursor-pointer"
              onClick={() => { onChange(opt.value); setIsOpen(false); }}
            >
              {opt.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const CustomDatePicker = ({ value, onChange, className }) => {
  return (
    <input
      type="date"
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      className={className}
      onClick={(e) => e.target.showPicker && e.target.showPicker()}
    />
  );
};

export default function RowModal({ isOpen, onClose, onSave, initialData, gstEnabled, allPlans, selectedCustomer, gstRates }) {
  const [formData, setFormData] = useState(null);
  const [planSearch, setPlanSearch] = useState('');
  const [showPlanDropdown, setShowPlanDropdown] = useState(false);
  const [isCreatingCustom, setIsCreatingCustom] = useState(false);

  useEffect(() => {
    if (isOpen && initialData) {
      setFormData({ ...initialData });
      setPlanSearch(initialData.plan_name || '');
    }
  }, [isOpen, initialData]);

  // Handle outside click for plan dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest('.modal-plan-dropdown')) {
        setShowPlanDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Recalculate totals whenever relevant fields change
  useEffect(() => {
    if (!formData) return;

    let totalDist = parseFloat(formData.total_distance_km) || 0;
    let totalHrs = parseFloat(formData.total_hours) || 0;
    const baseKm = parseFloat(formData.base_km) || 0;
    const baseHrs = parseFloat(formData.base_hours) || 0;
    const extraKmRate = parseFloat(formData.extra_km_rate) || 0;
    const extraHrsRate = parseFloat(formData.extra_hours_rate) || 0;
    const baseRate = parseFloat(formData.rate) || 0;

    let extraKm = 0;
    let extraHrs = 0;
    if (formData.plan_id) {
      if (totalDist > baseKm) extraKm = totalDist - baseKm;
      if (totalHrs > baseHrs) extraHrs = totalHrs - baseHrs;
    }

    const da = parseFloat(formData.da_allowance) || 0;
    const night = parseFloat(formData.night_allowance) || 0;

    const rowAmountWithoutGst = baseRate + (extraKm * extraKmRate) + (extraHrs * extraHrsRate) + da + night;
    const rowGstRate = formData.gst_rate || 5;
    const rowAmountWithGst = gstEnabled 
      ? rowAmountWithoutGst + (rowAmountWithoutGst * (rowGstRate / 100))
      : rowAmountWithoutGst;

    if (
      formData.extra_km !== extraKm ||
      formData.extra_hours !== extraHrs ||
      formData.amount_without_gst !== rowAmountWithoutGst ||
      formData.amount_with_gst !== rowAmountWithGst
    ) {
      setFormData(prev => ({
        ...prev,
        extra_km: extraKm,
        extra_hours: extraHrs,
        amount_without_gst: rowAmountWithoutGst,
        amount_with_gst: rowAmountWithGst
      }));
    }
  }, [
    formData?.total_distance_km,
    formData?.total_hours,
    formData?.rate,
    formData?.extra_km_rate,
    formData?.extra_hours_rate,
    formData?.base_km,
    formData?.base_hours,
    formData?.da_allowance,
    formData?.night_allowance,
    formData?.gst_rate,
    formData?.plan_id,
    gstEnabled
  ]);

  if (!isOpen || !formData) return null;

  const handleFieldChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const selectPlan = (plan) => {
    setFormData(prev => ({
      ...prev,
      plan_id: plan.id,
      plan_name: plan.plan_name,
      plan_type: plan.plan_type || '',
      rate: plan.rate,
      extra_km_rate: plan.extra_km_rate,
      extra_hours_rate: plan.extra_hours_rate,
      base_km: plan.base_km,
      base_hours: plan.base_hours,
      total_distance_km: plan.base_km || 0,
      total_hours: plan.base_hours || 0,
    }));
    setPlanSearch(plan.plan_name);
    setShowPlanDropdown(false);
  };

  const filteredPlans = allPlans.filter(p => {
    const matchesSearch = (p.plan_name || '').toLowerCase().includes(planSearch.toLowerCase());
    const matchesParty = selectedCustomer
      ? (p.customer_id === selectedCustomer.id || !p.customer_id)
      : true;
    return matchesSearch && matchesParty;
  });

  const isOutstation = (formData.plan_name || '').toLowerCase().includes('outstation') || formData.plan_type === 'Outstation';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-4xl shadow-2xl flex flex-col max-h-[95vh]">
        <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/50 rounded-t-3xl shrink-0">
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-3">
            <span className="bg-indigo-500/20 text-indigo-400 p-2 rounded-xl border border-indigo-500/30">
              {formData.plan_id ? '✏️' : '✨'}
            </span>
            {formData.plan_id ? 'Edit Billing Entry' : 'Add New Billing Entry'}
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:bg-slate-800 hover:text-slate-200 p-2 rounded-xl transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="px-6 py-4 overflow-y-auto flex-1 space-y-4">
          {/* Plan Selection */}
          {isCreatingCustom ? (
            <div className="bg-indigo-950/20 p-4 rounded-xl border border-indigo-500/30 space-y-4">
              <div className="flex justify-between items-center pb-2 border-b border-indigo-500/20">
                <h4 className="text-sm font-bold text-indigo-400">Custom Package Details</h4>
                <button type="button" onClick={() => { setIsCreatingCustom(false); handleFieldChange('plan_id', ''); }} className="text-slate-400 hover:text-slate-200 transition">
                  <X className="h-4 w-4"/>
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Package Name <span className="text-rose-500">*</span></label>
                  <input 
                    type="text" 
                    placeholder="e.g. Special Drop" 
                    value={formData.plan_name} 
                    onChange={(e) => { 
                      handleFieldChange('plan_name', e.target.value); 
                      handleFieldChange('plan_id', 'custom'); 
                    }} 
                    className="w-full bg-slate-950/60 border border-slate-700 rounded-xl px-4 py-2 text-sm text-slate-100 outline-none focus:border-indigo-500 transition" 
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Package Type</label>
                  <CustomSelect 
                    value={formData.plan_type || 'Local'} 
                    onChange={(val) => handleFieldChange('plan_type', val)} 
                    options={[
                      {value: 'Local', label: 'Local'}, 
                      {value: 'Outstation', label: 'Outstation'}
                    ]} 
                  />
                </div>
              </div>
            </div>
          ) : (
          <div className="space-y-1 relative modal-plan-dropdown">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Select Package <span className="text-rose-500">*</span></label>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
              <input
                type="text"
                placeholder="Search package name (e.g. 8 hours 80 kms)..."
                value={planSearch}
                onFocus={() => setShowPlanDropdown(true)}
                onChange={(e) => {
                  setPlanSearch(e.target.value);
                  if (formData.plan_id && e.target.value !== formData.plan_name) {
                    handleFieldChange('plan_id', '');
                  }
                }}
                className="w-full bg-slate-950/60 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-100 outline-none focus:border-indigo-500 transition"
              />
            </div>
            {showPlanDropdown && (
              <div className="absolute z-50 left-0 right-0 mt-1 bg-[#0f172a] border border-slate-700 rounded-xl max-h-60 overflow-y-auto shadow-2xl divide-y divide-slate-800">
                {filteredPlans.length === 0 ? (
                  <div className="p-4 text-sm text-slate-500 text-center font-medium">No packages matched.</div>
                ) : (
                  filteredPlans.map(plan => (
                    <div
                      key={plan.id}
                      onClick={() => selectPlan(plan)}
                      className="p-4 text-sm text-slate-200 hover:bg-indigo-600/20 hover:text-white cursor-pointer transition flex justify-between items-center"
                    >
                      <div>
                        <div className="font-bold text-slate-50">{plan.plan_name}</div>
                        <div className="text-xs text-slate-400 mt-1">{plan.vehicle_type}</div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className="font-semibold text-indigo-400 font-mono text-base">₹{plan.rate}</span>
                        {(plan.plan_name || '').toLowerCase().includes('outstation') || plan.plan_type === 'Outstation' ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30 uppercase tracking-wider">
                            Outstation
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase tracking-wider">
                            Local
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                )}
                <div className="p-2 bg-slate-900 border-t border-slate-700 sticky bottom-0">
                  <button 
                    type="button" 
                    onClick={() => { 
                      setIsCreatingCustom(true); 
                      setShowPlanDropdown(false); 
                      handleFieldChange('plan_id', 'custom'); 
                      handleFieldChange('plan_name', ''); 
                      handleFieldChange('plan_type', 'Local');
                      handleFieldChange('rate', 0); 
                    }} 
                    className="w-full py-2 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 font-semibold rounded-lg text-sm transition"
                  >
                    + Create Custom Package
                  </button>
                </div>
              </div>
            )}
          </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Vehicle Number</label>
              <input
                type="text"
                placeholder="e.g. MH12 AB 1234"
                value={formData.vehicle_number}
                onChange={(e) => handleFieldChange('vehicle_number', e.target.value)}
                className="w-full bg-slate-950/60 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-100 outline-none focus:border-indigo-500 transition font-mono uppercase"
              />
            </div>
            
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Base Rate</label>
              <input
                type="number"
                placeholder="e.g. 1500"
                value={formData.rate}
                onChange={(e) => handleFieldChange('rate', e.target.value)}
                className="w-full bg-slate-950/60 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-emerald-400 font-mono font-bold outline-none focus:border-emerald-500 transition"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Date(s)</label>
              {isOutstation ? (
                <div className="flex gap-2">
                  <CustomDatePicker
                    value={formData.date}
                    onChange={(val) => handleFieldChange('date', val)}
                    className="w-1/2 bg-slate-950/60 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-slate-100 outline-none focus:border-indigo-500 cursor-pointer"
                  />
                  <CustomDatePicker
                    value={formData.end_date || formData.date}
                    onChange={(val) => handleFieldChange('end_date', val)}
                    className="w-1/2 bg-slate-950/60 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-slate-100 outline-none focus:border-indigo-500 cursor-pointer"
                  />
                </div>
              ) : (
                <CustomDatePicker
                  value={formData.date}
                  onChange={(val) => handleFieldChange('date', val)}
                  className="w-full bg-slate-950/60 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-100 outline-none focus:border-indigo-500 cursor-pointer"
                />
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-slate-950/40 p-4 rounded-2xl border border-slate-800">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total KM</label>
              <input
                type="number"
                placeholder="0"
                value={formData.total_distance_km}
                onChange={(e) => handleFieldChange('total_distance_km', e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 outline-none focus:border-indigo-500 text-center font-mono"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Extra KM</label>
              <input
                type="number"
                readOnly
                value={formData.extra_km}
                className="w-full bg-slate-900/50 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-400 outline-none text-center font-mono"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total Hours</label>
              <input
                type="number"
                placeholder="0"
                value={formData.total_hours}
                onChange={(e) => handleFieldChange('total_hours', e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 outline-none focus:border-indigo-500 text-center font-mono"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Extra Hours</label>
              <input
                type="number"
                readOnly
                value={formData.extra_hours}
                className="w-full bg-slate-900/50 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-400 outline-none text-center font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div className="space-y-1">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Driver Allowance (DA)</label>
              <input
                type="number"
                placeholder="e.g. 300"
                value={formData.da_allowance}
                onChange={(e) => handleFieldChange('da_allowance', e.target.value)}
                className="w-full bg-slate-950/60 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-amber-400 font-mono font-bold outline-none focus:border-amber-500 transition"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Night Allowance</label>
              <input
                type="number"
                placeholder="e.g. 200"
                value={formData.night_allowance}
                onChange={(e) => handleFieldChange('night_allowance', e.target.value)}
                className="w-full bg-slate-950/60 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-purple-400 font-mono font-bold outline-none focus:border-purple-500 transition"
              />
            </div>
          </div>

          {/* Totals Box */}
          <div className="bg-indigo-950/30 border border-indigo-500/20 p-4 rounded-2xl">
            <div className="flex justify-between items-center mb-2 pb-2 border-b border-indigo-500/10">
              <span className="text-sm font-semibold text-slate-300">Amount (Excl. GST)</span>
              <span className="text-lg font-mono font-bold text-slate-100">
                ₹{(formData.amount_without_gst || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </div>

            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-semibold text-slate-300">GST Rate</span>
              <div className="w-32">
                <CustomSelect
                  disabled={!gstEnabled}
                  value={formData.gst_rate}
                  onChange={(val) => handleFieldChange('gst_rate', val)}
                  options={gstRates.map(rate => ({ value: rate, label: `${rate}%` }))}
                  placement="top"
                />
              </div>
            </div>

            <div className="flex justify-between items-center pt-2 border-t border-indigo-500/20">
              <span className="text-base font-bold text-indigo-300 uppercase">Final Amount</span>
              <span className="text-2xl font-mono font-black text-indigo-400">
                ₹{(formData.amount_with_gst || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>

        </div>

        <div className="px-6 py-4 border-t border-slate-800 bg-slate-900/50 rounded-b-3xl flex justify-end gap-4 shrink-0">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition"
          >
            Cancel
          </button>
          <button
            onClick={() => onSave(formData)}
            disabled={!formData.plan_id}
            className={`px-8 py-2.5 rounded-xl font-bold shadow-lg transition flex items-center gap-2 ${
              !formData.plan_id 
                ? 'bg-indigo-500/50 text-white/50 cursor-not-allowed shadow-none' 
                : 'bg-indigo-500 hover:bg-indigo-400 text-white shadow-indigo-500/20'
            }`}
          >
            Save Entry
          </button>
        </div>
      </div>
    </div>
  );
}
