import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Car,
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

const VEHICLE_CLASSES = ["Sedan", "Ertiga", "SUV"];
const STATUS_OPTIONS = ["Active", "Maintenance", "Inactive"];

export default function VehicleList({ navigateTo }) {
  const confirm = useConfirm();
  const [vehicles, setVehicles] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [vendors, setVendors] = useState([]);

  // Edit modal states
  const [editingVehicle, setEditingVehicle] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  const [editErrors, setEditErrors] = useState({});
  const [editSuccess, setEditSuccess] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchVehicles();
    fetchVendors();
  }, []);

  async function fetchVendors() {
    try {
      const res = await axios.get('/api/customers?entity_type=vendor');
      setVendors(res.data);
    } catch (err) {
      console.error("Failed to load vendors:", err);
    }
  }

  async function fetchVehicles() {
    try {
      const res = await axios.get('/api/vehicles');
      setVehicles(res.data);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch fleet vehicles.');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id) {
    const isConfirmed = await confirm("Are you sure you want to delete this vehicle from the fleet?");
    if (!isConfirmed) return;
    try {
      await axios.delete(`/api/vehicles/${id}`);
      setVehicles(prev => prev.filter(v => v.id !== id));
    } catch (err) {
      console.error(err);
      alert("Failed to delete vehicle.");
    }
  }

  const startEdit = (vehicle) => {
    setEditingVehicle(vehicle);
    setEditFormData({
      vehicle_number: vehicle.vehicle_number,
      model: vehicle.model || '',
      driver_name: vehicle.driver_name || '',
      vehicle_type: vehicle.vehicle_type,
      status: vehicle.status,
      ownership_type: vehicle.ownership_type || 'Owner',
      owner_name: vehicle.owner_name || 'Ravi Sable',
      maintenance_km_threshold: vehicle.maintenance_km_threshold || '',
      insurance_expiry: vehicle.insurance_expiry || '',
      insurance_notify_days: vehicle.insurance_notify_days || '',
      road_tax_expiry: vehicle.road_tax_expiry || '',
      road_tax_notify_days: vehicle.road_tax_notify_days || '',
      permit_expiry: vehicle.permit_expiry || '',
      permit_notify_days: vehicle.permit_notify_days || '',
      authorization_expiry: vehicle.authorization_expiry || '',
      authorization_notify_days: vehicle.authorization_notify_days || ''
    });
    setEditErrors({});
    setEditSuccess('');
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (editErrors[name]) {
      setEditErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateEditForm = () => {
    const tempErrors = {};
    if (!editFormData.vehicle_number?.trim()) {
      tempErrors.vehicle_number = "Vehicle plate number is required.";
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
        ...editFormData,
        vehicle_number: editFormData.vehicle_number.toUpperCase()
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

      const res = await axios.put(`/api/vehicles/${editingVehicle.id}`, payload);
      setEditSuccess("Vehicle details updated successfully!");

      // Update state
      setVehicles(prev => prev.map(v => v.id === editingVehicle.id ? res.data : v));

      setTimeout(() => {
        setEditingVehicle(null);
      }, 1000);

    } catch (err) {
      console.error(err);
      const errMsg = err.response?.data?.detail || "An error occurred while updating vehicle details.";
      setEditErrors({ api: errMsg });
    } finally {
      setIsSaving(false);
    }
  };

  const filteredVehicles = vehicles.filter(v =>
    v.vehicle_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.driver_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.model?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">


      <div className="flex gap-4 items-center glass-panel p-4 rounded-xl border border-slate-700/50">
        <Search className="h-5 w-5 text-slate-400 shrink-0" />
        <input
          type="text"
          placeholder="Search by plate number, model, or driver name..."
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
                  <th className="p-4 min-w-[130px]">Plate Number</th>
                  <th className="p-4 min-w-[120px]">Car Model</th>
                  <th className="p-4 min-w-[120px]">Vehicle Class</th>
                  <th className="p-4 min-w-[100px]">Total KMs</th>
                  <th className="p-4 min-w-[120px]">Maintenance<br />Threshold</th>
                  <th className="p-4 min-w-[120px]">Pending<br />Maintenance</th>
                  <th className="p-4 min-w-[110px]">Ownership</th>
                  <th className="p-4 min-w-[130px]">Assigned Driver</th>
                  <th className="p-4 min-w-[100px]">Status</th>
                  <th className="p-4 text-center min-w-[100px]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-sm text-slate-300">
                {filteredVehicles.length === 0 ? (
                  <tr>
                    <td colSpan="10" className="p-6 text-center text-slate-500">No fleet vehicles registered.</td>
                  </tr>
                ) : (
                  filteredVehicles.map((veh) => (
                    <tr key={veh.id} className="hover:bg-slate-800/20 transition">
                      <td className="p-4 font-mono font-bold text-slate-50 text-sm">{veh.vehicle_number}</td>
                      <td className="p-4">{veh.model || '-'}</td>
                      <td className="p-4">
                        <span className="px-2 py-1 rounded text-xs font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                          {veh.vehicle_type}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className="text-sm font-semibold text-slate-200">
                          {veh.total_km_travelled || 0} KM
                        </span>
                      </td>
                      <td className="p-4">
                        {veh.maintenance_km_threshold ? (
                          <span className="text-sm font-semibold text-slate-200 flex items-center">
                            {veh.maintenance_km_threshold} KM
                            {veh.maintenance_km_threshold - (veh.total_km_travelled || 0) <= 0
                              ? (
                                <div className="relative group flex items-center ml-1.5">
                                  <span className="cursor-help text-lg animate-bounce">🚨</span>
                                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max max-w-[200px] px-3 py-2 bg-yellow-400 text-slate-900 text-xs font-bold rounded shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 text-center whitespace-normal">
                                    Maintenance is overdue! Please service immediately.
                                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-[5px] border-transparent border-t-yellow-400"></div>
                                  </div>
                                </div>
                              )
                              : veh.maintenance_km_threshold - (veh.total_km_travelled || 0) < 500
                                ? (
                                  <div className="relative group flex items-center ml-1.5">
                                    <span className="cursor-help">⚠️</span>
                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max max-w-[250px] px-3 py-2 bg-yellow-400 text-slate-900 text-xs font-bold rounded shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 text-center whitespace-normal">
                                      Maintenance approaching! Service due in {veh.maintenance_km_threshold - (veh.total_km_travelled || 0)} KM.
                                      <div className="absolute top-full left-1/2 -translate-x-1/2 border-[5px] border-transparent border-t-yellow-400"></div>
                                    </div>
                                  </div>
                                )
                                : null
                            }
                          </span>
                        ) : (
                          <span className="text-slate-600">-</span>
                        )}
                      </td>
                      <td className="p-4">
                        {veh.maintenance_km_threshold ? (
                          <div className={`font-semibold ${veh.maintenance_km_threshold - (veh.total_km_travelled || 0) <= 0
                            ? 'text-rose-400 animate-pulse'
                            : veh.maintenance_km_threshold - (veh.total_km_travelled || 0) < 500
                              ? 'text-amber-400 animate-pulse'
                              : 'text-emerald-400'
                            }`}>
                            {veh.maintenance_km_threshold - (veh.total_km_travelled || 0) <= 0
                              ? 'Due Now'
                              : `${veh.maintenance_km_threshold - (veh.total_km_travelled || 0)} KM`}
                          </div>
                        ) : (
                          <span className="text-slate-600">-</span>
                        )}
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded text-[10px] uppercase tracking-wider font-bold border ${veh.ownership_type === 'Vendor'
                          ? 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                          : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          }`}>
                          {veh.ownership_type || 'Owner'}
                        </span>
                      </td>
                      <td className="p-4 font-semibold text-slate-200">{veh.driver_name || '-'}</td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${veh.status === 'Active'
                          ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25'
                          : veh.status === 'Maintenance'
                            ? 'bg-amber-500/15 text-amber-400 border border-amber-500/25'
                            : 'bg-slate-500/15 text-slate-400 border border-slate-700'
                          }`}>
                          {veh.status}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex justify-center gap-1">
                          <button
                            onClick={() => startEdit(veh)}
                            className="list-action-btn p-2 text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition"
                            title="Edit Vehicle"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(veh.id)}
                            className="list-action-btn p-2 text-rose-400 hover:bg-rose-500/10 rounded-lg transition"
                            title="Delete Vehicle"
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

      {/* EDIT VEHICLE MODAL */}
      {editingVehicle && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-slate-950/80 backdrop-blur-sm p-6 md:p-12 lg:pl-[calc(16rem+3rem)] overflow-y-auto">
          <div className="glass-panel w-full max-w-5xl rounded-2xl border border-slate-700/60 shadow-2xl p-6 md:p-8 lg:p-10 space-y-6">
            <div className="flex justify-between items-center border-b border-slate-800 pb-4">
              <h2 className="text-lg font-bold text-slate-50 flex items-center gap-2">
                <Edit className="h-5 w-5 text-indigo-400" />
                Edit Vehicle Details: {editingVehicle.vehicle_number}
              </h2>
              <button
                onClick={() => setEditingVehicle(null)}
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

            <form onSubmit={handleSaveEdit} className="space-y-8">

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 lg:gap-6">

                {/* ── LEFT COLUMN (CARD 1) ── */}
                <div className="bg-slate-800/20 rounded-2xl border border-slate-700/50 p-5 md:p-6 space-y-5">
                  {/* Plate Number */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-300">Vehicle Plate Number *</label>
                    <input
                      type="text"
                      name="vehicle_number"
                      value={editFormData.vehicle_number}
                      onChange={handleEditChange}
                      className={`w-full bg-slate-950 text-xs border ${editErrors.vehicle_number ? 'border-rose-500' : 'border-slate-700'} rounded-lg px-3 py-2 text-slate-100 outline-none`}
                      required
                    />
                    {editErrors.vehicle_number && <p className="text-[10px] text-rose-400">{editErrors.vehicle_number}</p>}
                  </div>

                  {/* Model */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-300">Car Model / Brand</label>
                    <input
                      type="text"
                      name="model"
                      value={editFormData.model}
                      onChange={handleEditChange}
                      className="w-full bg-slate-950 text-xs border border-slate-700 rounded-lg px-3 py-2 text-slate-100 outline-none"
                    />
                  </div>

                  {/* Vehicle Type and Status Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Vehicle Type */}
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-300">Vehicle Class *</label>
                      <CustomSelect
                        value={editFormData.vehicle_type}
                        onChange={(val) => handleEditChange({ target: { name: 'vehicle_type', value: val } })}
                        options={VEHICLE_CLASSES}
                      />
                    </div>

                    {/* Status */}
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-300">Operational Status *</label>
                      <CustomSelect
                        value={editFormData.status}
                        onChange={(val) => handleEditChange({ target: { name: 'status', value: val } })}
                        options={STATUS_OPTIONS.map(opt => ({
                          value: opt,
                          label: opt === 'Active' ? 'Active / On Duty' : opt === 'Maintenance' ? 'In Maintenance' : 'Out of Service'
                        }))}
                      />
                    </div>
                  </div>
                </div>

                {/* ── RIGHT COLUMN (CARD 2) ── */}
                <div className="bg-slate-800/20 rounded-2xl border border-slate-700/50 p-5 md:p-6 space-y-5 flex flex-col justify-start">

                  {/* Ownership Type */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-300 block">Ownership Type</label>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setEditFormData({ ...editFormData, ownership_type: 'Owner', owner_name: 'Ravi Sable' })}
                          className={`flex-1 py-1.5 px-2 rounded-lg border text-xs font-bold transition ${editFormData.ownership_type === 'Owner'
                            ? 'bg-indigo-600 border-indigo-500 text-white'
                            : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-slate-200'
                            }`}
                        >
                          Owner
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditFormData({ ...editFormData, ownership_type: 'Vendor', owner_name: '' })}
                          className={`flex-1 py-1.5 px-2 rounded-lg border text-xs font-bold transition ${editFormData.ownership_type === 'Vendor'
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
                        {editFormData.ownership_type === 'Owner' ? 'Owner Name' : 'Select Vendor *'}
                      </label>
                      {editFormData.ownership_type === 'Owner' ? (
                        <input
                          type="text"
                          readOnly
                          value={editFormData.owner_name}
                          className="w-full bg-slate-950/50 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-400 outline-none font-semibold cursor-not-allowed"
                        />
                      ) : (
                        <CustomSelect
                          value={editFormData.owner_name}
                          onChange={(val) => setEditFormData({ ...editFormData, owner_name: val })}
                          options={vendors.map(v => ({ value: v.name, label: v.name }))}
                          placeholder="Select a vendor..."
                        />
                      )}
                    </div>
                  </div>

                  {/* Driver */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-300">Assigned Driver Name</label>
                    <input
                      type="text"
                      name="driver_name"
                      value={editFormData.driver_name || ''}
                      onChange={handleEditChange}
                      className="w-full bg-slate-950 text-xs border border-slate-700 rounded-lg px-3 py-2 text-slate-100 outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Compliance & Renewals */}
              <div className="bg-slate-800/20 rounded-2xl border border-slate-700/50 p-5 md:p-6 space-y-5">
                <div className="flex items-center gap-2 mb-3">
                  <ShieldAlert className="h-4 w-4 text-emerald-400" />
                  <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Compliance & Renewals</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">

                  {/* Maintenance Threshold */}
                  <div className="space-y-3 bg-slate-800/30 p-3 rounded-xl border border-slate-700/50">
                    <h4 className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">Maintenance</h4>
                    <div className="space-y-1">
                      <label className="text-[9px] font-semibold text-slate-400 uppercase">Threshold (KMs)</label>
                      <input
                        type="number"
                        name="maintenance_km_threshold"
                        value={editFormData.maintenance_km_threshold || ''}
                        onChange={handleEditChange}
                        className="w-full bg-slate-950 border border-slate-700 focus:border-indigo-500 text-slate-100 rounded px-2 py-1.5 text-xs outline-none"
                      />
                    </div>
                  </div>


                  <div className="space-y-3 bg-slate-800/30 p-3 rounded-xl border border-slate-700/50">
                    <h4 className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">Insurance</h4>
                    <div className="space-y-1">
                      <label className="text-[9px] font-semibold text-slate-400 uppercase">Expiry Date</label>
                      <input type="date" name="insurance_expiry" value={editFormData.insurance_expiry || ''} onChange={handleEditChange} className="w-full bg-slate-950 border border-slate-700 focus:border-indigo-500 text-slate-100 rounded px-2 py-1.5 text-xs outline-none [color-scheme:dark]" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-semibold text-slate-400 uppercase">Notify Before (Days)</label>
                      <input type="number" min="0" placeholder="e.g. 15" name="insurance_notify_days" value={editFormData.insurance_notify_days || ''} onChange={handleEditChange} className="w-full bg-slate-950 border border-slate-700 focus:border-indigo-500 text-slate-100 rounded px-2 py-1.5 text-xs outline-none" />
                    </div>
                  </div>

                  <div className="space-y-3 bg-slate-800/30 p-3 rounded-xl border border-slate-700/50">
                    <h4 className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">Road Tax</h4>
                    <div className="space-y-1">
                      <label className="text-[9px] font-semibold text-slate-400 uppercase">Expiry Date</label>
                      <input type="date" name="road_tax_expiry" value={editFormData.road_tax_expiry || ''} onChange={handleEditChange} className="w-full bg-slate-950 border border-slate-700 focus:border-indigo-500 text-slate-100 rounded px-2 py-1.5 text-xs outline-none [color-scheme:dark]" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-semibold text-slate-400 uppercase">Notify Before (Days)</label>
                      <input type="number" min="0" placeholder="e.g. 15" name="road_tax_notify_days" value={editFormData.road_tax_notify_days || ''} onChange={handleEditChange} className="w-full bg-slate-950 border border-slate-700 focus:border-indigo-500 text-slate-100 rounded px-2 py-1.5 text-xs outline-none" />
                    </div>
                  </div>

                  <div className="space-y-3 bg-slate-800/30 p-3 rounded-xl border border-slate-700/50">
                    <h4 className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">Permit</h4>
                    <div className="space-y-1">
                      <label className="text-[9px] font-semibold text-slate-400 uppercase">Expiry Date</label>
                      <input type="date" name="permit_expiry" value={editFormData.permit_expiry || ''} onChange={handleEditChange} className="w-full bg-slate-950 border border-slate-700 focus:border-indigo-500 text-slate-100 rounded px-2 py-1.5 text-xs outline-none [color-scheme:dark]" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-semibold text-slate-400 uppercase">Notify Before (Days)</label>
                      <input type="number" min="0" placeholder="e.g. 15" name="permit_notify_days" value={editFormData.permit_notify_days || ''} onChange={handleEditChange} className="w-full bg-slate-950 border border-slate-700 focus:border-indigo-500 text-slate-100 rounded px-2 py-1.5 text-xs outline-none" />
                    </div>
                  </div>

                  <div className="space-y-3 bg-slate-800/30 p-3 rounded-xl border border-slate-700/50">
                    <h4 className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">Authorization</h4>
                    <div className="space-y-1">
                      <label className="text-[9px] font-semibold text-slate-400 uppercase">Expiry Date</label>
                      <input type="date" name="authorization_expiry" value={editFormData.authorization_expiry || ''} onChange={handleEditChange} className="w-full bg-slate-950 border border-slate-700 focus:border-indigo-500 text-slate-100 rounded px-2 py-1.5 text-xs outline-none [color-scheme:dark]" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-semibold text-slate-400 uppercase">Notify Before (Days)</label>
                      <input type="number" min="0" placeholder="e.g. 15" name="authorization_notify_days" value={editFormData.authorization_notify_days || ''} onChange={handleEditChange} className="w-full bg-slate-950 border border-slate-700 focus:border-indigo-500 text-slate-100 rounded px-2 py-1.5 text-xs outline-none" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-4 border-t border-slate-800 ">
                <button
                  type="button"
                  onClick={() => setEditingVehicle(null)}
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
