import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Layers,
  Plus,
  Search,
  Trash2,
  Edit,
  X,
  CheckCircle,
  AlertTriangle,
  ShieldAlert
} from 'lucide-react';
import { useConfirm } from '../context/ConfirmContext';
import CustomSelect from '../components/CustomSelect';

const VEHICLE_TYPES = ["Sedan", "Ertiga", "SUV"];

const DEFAULT_RATES = {
  "Sedan": { km: 12, hr: 150 },
  "Ertiga": { km: 15, hr: 180 },
  "SUV": { km: 18, hr: 200 }
};

export default function PlanList({ navigateTo }) {
  const confirm = useConfirm();
  const [plans, setPlans] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Edit modal states
  const [editingPlan, setEditingPlan] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  const [editErrors, setEditErrors] = useState({});
  const [editSuccess, setEditSuccess] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchPlans();
  }, []);

  async function fetchPlans() {
    try {
      const res = await axios.get('/api/plans');
      setPlans(res.data);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch rental plans.');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id) {
    const isConfirmed = await confirm("Are you sure you want to delete this rental plan?");
    if (!isConfirmed) return;

    try {
      await axios.delete(`/api/plans/${id}`);
      setPlans(prev => prev.filter(p => p.id !== id));
    } catch (err) {
      console.error(err);
      alert("Failed to delete plan.");
    }
  }

  // Open edit modal
  const startEdit = (plan) => {
    setEditingPlan(plan);
    setEditFormData({
      plan_name: plan.plan_name || '',
      rate: plan.rate ? plan.rate.toString() : '',
      vehicle_type: plan.vehicle_type || 'Sedan',
      extra_km_rate: plan.extra_km_rate ? plan.extra_km_rate.toString() : '',
      extra_hours_rate: plan.extra_hours_rate ? plan.extra_hours_rate.toString() : '',
      base_hours: plan.base_hours ? plan.base_hours.toString() : '',
      base_km: plan.base_km ? plan.base_km.toString() : '',
      da_allowance: plan.da_allowance ? plan.da_allowance.toString() : '',
      night_allowance: plan.night_allowance ? plan.night_allowance.toString() : '',
      plan_type: plan.plan_type || 'Local'
    });
    setEditErrors({});
    setEditSuccess('');
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditFormData(prev => {
      const updated = { ...prev, [name]: value };

      if (name === 'plan_name') {
        const hourMatch = value.match(/(\d+)\s*(?:hour|hr|h)/i);
        const kmMatch = value.match(/(\d+)\s*(?:km|kilometer)/i);
        const rateMatch = value.match(/(\d+)\s*(?:rs|inr|rate|price|rupees)/i);

        if (hourMatch) updated.base_hours = hourMatch[1];
        if (kmMatch) updated.base_km = kmMatch[1];
        if (rateMatch) updated.rate = rateMatch[1];
      }

      // Auto-update extra rates if vehicle type changes
      if (name === 'vehicle_type') {
        const rates = DEFAULT_RATES[value];
        if (rates) {
          updated.extra_km_rate = rates.km.toString();
          updated.extra_hours_rate = rates.hr.toString();
        }
      }
      return updated;
    });

    if (editErrors[name]) {
      setEditErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateEditForm = () => {
    const tempErrors = {};
    if (!editFormData.plan_name?.trim()) tempErrors.plan_name = "Plan name is required.";

    if (!editFormData.rate || isNaN(editFormData.rate) || parseFloat(editFormData.rate) <= 0) {
      tempErrors.rate = "Plan base rate must be a number greater than 0.";
    }

    if (!editFormData.extra_km_rate || isNaN(editFormData.extra_km_rate)) {
      tempErrors.extra_km_rate = "Extra KM rate must be a number.";
    }

    if (editFormData.plan_type === 'Local' && (!editFormData.extra_hours_rate || isNaN(editFormData.extra_hours_rate))) {
      tempErrors.extra_hours_rate = "Extra hour rate must be a number.";
    }

    if (editFormData.plan_type === 'Outstation' && (!editFormData.base_km || isNaN(editFormData.base_km))) {
      tempErrors.base_km = "Per day KM limit is required.";
    }

    setEditErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!validateEditForm()) return;

    setIsSaving(true);
    setEditSuccess('');

    try {
      const payload = {
        plan_name: editFormData.plan_name,
        rate: parseFloat(editFormData.rate),
        vehicle_type: editFormData.vehicle_type,
        extra_km_rate: parseFloat(editFormData.extra_km_rate),
        extra_hours_rate: editFormData.plan_type === 'Local' ? parseFloat(editFormData.extra_hours_rate) : 0,
        base_hours: editFormData.base_hours ? parseInt(editFormData.base_hours, 10) : null,
        base_km: editFormData.base_km ? parseInt(editFormData.base_km, 10) : null,
        da_allowance: editFormData.da_allowance ? parseFloat(editFormData.da_allowance) : 0,
        night_allowance: editFormData.night_allowance ? parseFloat(editFormData.night_allowance) : 0
      };

      const res = await axios.put(`/api/plans/${editingPlan.id}`, payload);
      setEditSuccess("Plan updated successfully!");

      // Update local plans state
      setPlans(prev => prev.map(p => p.id === editingPlan.id ? res.data : p));

      setTimeout(() => {
        setEditingPlan(null);
      }, 1000);

    } catch (err) {
      console.error(err);
      const errMsg = err.response?.data?.detail || "An error occurred while updating rental plan.";
      setEditErrors({ api: errMsg });
    } finally {
      setIsSaving(false);
    }
  };

  const filteredPlans = plans.filter(p =>
    p.plan_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.vehicle_type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">


      <div className="flex gap-4 items-center glass-panel p-4 rounded-xl border border-slate-700/50">
        <Search className="h-5 w-5 text-slate-400 shrink-0" />
        <input
          type="text"
          placeholder="Search plans by name or car type..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-transparent border-none outline-none text-slate-100 placeholder-slate-400 text-sm"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
        </div>
      ) : error ? (
        <div className="flex items-center gap-2 bg-rose-500/15 border border-rose-500/20 text-rose-400 p-4 rounded-xl">
          <ShieldAlert className="h-5 w-5" />
          <span>{error}</span>
        </div>
      ) : (
        <div className="glass-panel rounded-2xl border border-slate-700/50 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-700 bg-table-header text-slate-400 text-xs font-semibold uppercase tracking-wider">
                  <th className="p-4">Plan Type</th>
                  <th className="p-4">Vehicle</th>
                  <th className="p-4">Plan Name</th>
                  <th className="p-4">Rate (Rs.)</th>
                  <th className="p-4">Base Limits</th>
                  <th className="p-4">Extra Rates</th>
                  <th className="p-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-sm text-slate-300">
                {filteredPlans.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="p-6 text-center text-slate-500">No rental plans found.</td>
                  </tr>
                ) : (
                  filteredPlans.map((plan) => (
                    <tr key={plan.id} className="hover:bg-slate-800/20 transition">
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded text-[10px] font-bold border uppercase ${plan.plan_type === 'Outstation' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'}`}>
                          {plan.plan_type || 'Local'}
                        </span>
                      </td>
                      <td className="p-4 text-slate-300">{plan.vehicle_type}</td>
                      <td className="p-4 font-semibold text-slate-50">{plan.plan_name}</td>
                      <td className="p-4 font-bold text-indigo-300">₹{plan.rate.toLocaleString()}</td>
                      <td className="p-4 text-slate-400 font-medium text-xs">
                        {plan.plan_type === 'Outstation' ? `${plan.base_km} Kms/Day` : `${plan.base_hours} Hrs / ${plan.base_km} Kms`}
                      </td>
                      <td className="p-4 text-slate-400 font-mono text-xs space-y-1">
                        <div>₹{plan.extra_km_rate}/Km</div>
                        {plan.plan_type !== 'Outstation' && <div>₹{plan.extra_hours_rate}/Hr</div>}
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex justify-center gap-1">
                          <button
                            onClick={() => startEdit(plan)}
                            className="list-action-btn p-2 text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition"
                            title="Edit Plan"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(plan.id)}
                            className="list-action-btn p-2 text-rose-400 hover:bg-rose-500/10 rounded-lg transition"
                            title="Delete Plan"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* EDIT PLAN MODAL */}
      {editingPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="glass-panel w-full max-w-md rounded-2xl border border-slate-700/60 shadow-2xl p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h2 className="text-lg font-bold text-slate-50 flex items-center gap-2">
                <Edit className="h-5 w-5 text-indigo-400" />
                Edit Plan: {editingPlan.plan_name}
              </h2>
              <button
                onClick={() => setEditingPlan(null)}
                className="text-slate-400 hover:text-slate-50 p-1 hover:bg-slate-800 rounded-lg transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {editSuccess && (
              <div className="flex items-center gap-2 bg-emerald-500/15 text-emerald-400 p-3 rounded-lg text-sm font-semibold">
                <CheckCircle className="h-4 w-4" />
                <span>{editSuccess}</span>
              </div>
            )}

            {editErrors.api && (
              <div className="flex items-center gap-2 bg-rose-500/15 text-rose-400 p-3 rounded-lg text-sm font-semibold">
                <AlertTriangle className="h-4 w-4" />
                <span>{editErrors.api}</span>
              </div>
            )}

            <form onSubmit={handleSaveEdit} className="space-y-4">

              {/* Plan Name */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Plan Name *</label>
                <input
                  type="text"
                  name="plan_name"
                  value={editFormData.plan_name}
                  onChange={handleEditChange}
                  className={`w-full bg-slate-950 text-xs border ${editErrors.plan_name ? 'border-rose-500' : 'border-slate-700'} rounded-lg px-3 py-2 text-slate-100 outline-none`}
                />
                {editErrors.plan_name && <p className="text-[10px] text-rose-400">{editErrors.plan_name}</p>}
              </div>

              {editFormData.plan_type === 'Local' ? (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-300">Base Hours</label>
                      <input type="number" name="base_hours" value={editFormData.base_hours} onChange={handleEditChange} className="w-full bg-slate-950 text-xs border border-slate-700 rounded-lg px-3 py-2 text-slate-100 outline-none" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-300">Base KMs</label>
                      <input type="number" name="base_km" value={editFormData.base_km} onChange={handleEditChange} className="w-full bg-slate-950 text-xs border border-slate-700 rounded-lg px-3 py-2 text-slate-100 outline-none" />
                    </div>
                  </div>
                  <div className="space-y-1 mt-4">
                    <label className="text-xs font-semibold text-slate-300">Base Rate (Rs.) *</label>
                    <input type="text" name="rate" value={editFormData.rate} onChange={handleEditChange} className={`w-full bg-slate-950 text-xs border ${editErrors.rate ? 'border-rose-500' : 'border-slate-700'} rounded-lg px-3 py-2 text-slate-100 outline-none`} />
                    {editErrors.rate && <p className="text-[10px] text-rose-400">{editErrors.rate}</p>}
                  </div>
                </>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-300">Per Day KM Limit *</label>
                    <input type="number" name="base_km" value={editFormData.base_km} onChange={handleEditChange} className={`w-full bg-slate-950 text-xs border ${editErrors.base_km ? 'border-rose-500' : 'border-slate-700'} rounded-lg px-3 py-2 text-slate-100 outline-none`} />
                    {editErrors.base_km && <p className="text-[10px] text-rose-400">{editErrors.base_km}</p>}
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-300">Per Day Rate (Rs.) *</label>
                    <input type="text" name="rate" value={editFormData.rate} onChange={handleEditChange} className={`w-full bg-slate-950 text-xs border ${editErrors.rate ? 'border-rose-500' : 'border-slate-700'} rounded-lg px-3 py-2 text-slate-100 outline-none`} />
                    {editErrors.rate && <p className="text-[10px] text-rose-400">{editErrors.rate}</p>}
                  </div>
                </div>
              )}

              {/* Extra Rates */}
              <div className="grid grid-cols-2 gap-4 border-t border-slate-800 pt-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Extra KM Rate (₹)</label>
                  <input type="text" name="extra_km_rate" value={editFormData.extra_km_rate} onChange={handleEditChange} className="w-full bg-slate-950 text-xs border border-slate-700 rounded-lg px-3 py-2 text-slate-100 outline-none" />
                  {editErrors.extra_km_rate && <p className="text-[10px] text-rose-400">{editErrors.extra_km_rate}</p>}
                </div>
                {editFormData.plan_type === 'Local' && (
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Extra Hour Rate (₹)</label>
                    <input type="text" name="extra_hours_rate" value={editFormData.extra_hours_rate} onChange={handleEditChange} className="w-full bg-slate-950 text-xs border border-slate-700 rounded-lg px-3 py-2 text-slate-100 outline-none" />
                    {editErrors.extra_hours_rate && <p className="text-[10px] text-rose-400">{editErrors.extra_hours_rate}</p>}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Driver Allowance (₹)</label>
                  <input type="number" name="da_allowance" value={editFormData.da_allowance} onChange={handleEditChange} className="w-full bg-slate-950 text-xs border border-slate-700 rounded-lg px-3 py-2 text-slate-100 outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Night Allowance (₹)</label>
                  <input type="number" name="night_allowance" value={editFormData.night_allowance} onChange={handleEditChange} className="w-full bg-slate-950 text-xs border border-slate-700 rounded-lg px-3 py-2 text-slate-100 outline-none" />
                </div>
              </div>

              <div className="flex justify-end gap-3 border-t border-slate-800 pt-4">
                <button
                  type="button"
                  onClick={() => setEditingPlan(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg transition shadow-lg disabled:opacity-50"
                >
                  {isSaving ? "Saving..." : "Save Changes"}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
