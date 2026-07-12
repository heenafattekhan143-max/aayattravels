import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Users,
  Plus,
  Search,
  Trash2,
  Edit,
  X,
  CheckCircle,
  AlertTriangle,
  MapPin,
  Sparkles,
  ShieldAlert
} from 'lucide-react';
import { useConfirm } from '../context/ConfirmContext';
import CustomSelect from '../components/CustomSelect';

const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat",
  "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh",
  "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab",
  "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh",
  "Uttarakhand", "West Bengal", "Delhi", "Jammu and Kashmir", "Ladakh", "Puducherry"
];

const GST_TYPES = ["Registered", "Unregistered", "Composite", "Consumer"];

export default function CustomerList({ navigateTo }) {
  const confirm = useConfirm();
  const [entities, setEntities] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Edit modal state
  const [editingEntity, setEditingEntity] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  const [editErrors, setEditErrors] = useState({});
  const [editSuccess, setEditSuccess] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isGstLoading, setIsGstLoading] = useState(false);
  const [gstLookupSuccess, setGstLookupSuccess] = useState(false);

  useEffect(() => {
    if (!editFormData.gstin) return;
    const gstin = editFormData.gstin.trim().toUpperCase();
    if (gstin.length === 15) {
      const gstinPattern = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
      if (gstinPattern.test(gstin)) {
        handleGstLookup(gstin);
      }
    } else {
      setGstLookupSuccess(false);
    }
  }, [editFormData.gstin]);

  const handleGstLookup = async (gstin) => {
    setIsGstLoading(true);
    setEditErrors(prev => ({ ...prev, gstin: '' }));
    try {
      const res = await axios.get(`/api/customers/gst-lookup/${gstin}`);
      const data = res.data;
      if (data && data.legal_name) {
        setEditFormData(prev => ({
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

  useEffect(() => {
    fetchEntities();
  }, []);

  async function fetchEntities() {
    try {
      const res = await axios.get('/api/customers');
      setEntities(res.data);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch customers and vendors list.');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id) {
    const isConfirmed = await confirm("Are you sure you want to delete this customer/vendor profile?");
    if (!isConfirmed) return;

    try {
      await axios.delete(`/api/customers/${id}`);
      setEntities(prev => prev.filter(e => e.id !== id));
    } catch (err) {
      console.error(err);
      alert("Failed to delete profile.");
    }
  }

  // Open Edit Modal
  const startEdit = (entity) => {
    setEditingEntity(entity);
    setEditFormData({
      entity_type: entity.entity_type,
      name: entity.name,
      gstin: entity.gstin || '',
      phone: entity.phone,
      gst_type: entity.gst_type,
      billing_address: entity.billing_address || '',
      state: entity.state,
      email: entity.email || ''
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
    if (!editFormData.name?.trim()) tempErrors.name = "Name is required.";

    const phonePattern = /^\d{10}$/;
    if (!editFormData.phone) {
      tempErrors.phone = "Phone number is required.";
    } else if (!phonePattern.test(editFormData.phone)) {
      tempErrors.phone = "Phone number must be exactly 10 digits.";
    }

    if (editFormData.gst_type === 'Registered' || editFormData.gst_type === 'Composite') {
      const gstinPattern = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
      if (!editFormData.gstin) {
        tempErrors.gstin = "GSTIN is required for Registered/Composite GST type.";
      } else if (!gstinPattern.test(editFormData.gstin.toUpperCase())) {
        tempErrors.gstin = "Invalid Indian GSTIN format.";
      }
    }

    if (editFormData.email) {
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailPattern.test(editFormData.email)) {
        tempErrors.email = "Invalid email format.";
      }
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
        gstin: (editFormData.gst_type === 'Registered' || editFormData.gst_type === 'Composite') ? editFormData.gstin.toUpperCase() : ''
      };

      const res = await axios.put(`/api/customers/${editingEntity.id}`, payload);
      setEditSuccess("Profile updated successfully!");

      // Update entities in local state list
      setEntities(prev => prev.map(e => e.id === editingEntity.id ? res.data : e));

      setTimeout(() => {
        setEditingEntity(null);
      }, 1000);

    } catch (err) {
      console.error(err);
      const errMsg = err.response?.data?.detail || "An error occurred while updating profile.";
      setEditErrors({ api: errMsg });
    } finally {
      setIsSaving(false);
    }
  };

  const filteredEntities = entities.filter(e =>
    e.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.phone.includes(searchTerm) ||
    e.gstin?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">

      <div className="flex gap-4 items-center glass-panel p-4 rounded-xl border border-slate-700/50">
        <Search className="h-5 w-5 text-slate-400 shrink-0" />
        <input
          type="text"
          placeholder="Search by name, phone number, or GSTIN..."
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
                  <th className="p-4">Type</th>
                  <th className="p-4">Name</th>
                  <th className="p-4">Phone</th>
                  <th className="p-4">GST Mode</th>
                  <th className="p-4">GSTIN</th>
                  <th className="p-4">State</th>
                  <th className="p-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-sm text-slate-300">
                {filteredEntities.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="p-6 text-center text-slate-500">No customer or vendor profiles found.</td>
                  </tr>
                ) : (
                  filteredEntities.map((entity) => (
                    <tr key={entity.id} className="hover:bg-slate-800/20 transition">
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded text-xs font-bold ${entity.entity_type === 'customer'
                            ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          }`}>
                          {entity.entity_type === 'customer' ? 'Customer' : 'Vendor'}
                        </span>
                      </td>
                      <td className="p-4 font-semibold text-slate-50">{entity.name}</td>
                      <td className="p-4">{entity.phone}</td>
                      <td className="p-4 text-slate-400">{entity.gst_type}</td>
                      <td className="p-4 font-mono text-xs">{entity.gstin || '-'}</td>
                      <td className="p-4">{entity.state}</td>
                      <td className="p-4 text-center">
                        <div className="flex justify-center gap-1">
                          <button
                            onClick={() => startEdit(entity)}
                            className="list-action-btn p-2 text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition"
                            title="Edit Profile"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(entity.id)}
                            className="list-action-btn p-2 text-rose-400 hover:bg-rose-500/10 rounded-lg transition"
                            title="Delete Profile"
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

      {/* EDIT MODAL OVERLAY */}
      {editingEntity && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="glass-panel w-full max-w-xl rounded-2xl border border-slate-700/60 shadow-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h2 className="text-lg font-bold text-slate-50 flex items-center gap-2">
                <Edit className="h-5 w-5 text-indigo-400" />
                Edit Profile: {editingEntity.name}
              </h2>
              <button
                onClick={() => setEditingEntity(null)}
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

              {/* Account Type Selection */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400 block">Account Type *</label>
                <div className="flex gap-4 mt-1">
                  <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
                    <input
                      type="radio"
                      name="entity_type"
                      checked={editFormData.entity_type === 'customer'}
                      onChange={() => setEditFormData(p => ({ ...p, entity_type: 'customer' }))}
                      className="w-4 h-4 text-indigo-600 border-slate-700 bg-slate-950"
                    />
                    <span className="font-semibold">Company / Customer</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
                    <input
                      type="radio"
                      name="entity_type"
                      checked={editFormData.entity_type === 'vendor'}
                      onChange={() => setEditFormData(p => ({ ...p, entity_type: 'vendor' }))}
                      className="w-4 h-4 text-indigo-600 border-slate-700 bg-slate-950"
                    />
                    <span className="font-semibold">Vendor</span>
                  </label>
                </div>
              </div>

              {/* Name & Phone */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Full Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={editFormData.name}
                    onChange={handleEditChange}
                    className={`w-full bg-slate-950 text-xs border ${editErrors.name ? 'border-rose-500' : 'border-slate-700'} rounded-lg px-3 py-2 text-slate-100 outline-none focus:border-indigo-500`}
                  />
                  {editErrors.name && <p className="text-[10px] text-rose-400">{editErrors.name}</p>}
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Phone *</label>
                  <input
                    type="text"
                    name="phone"
                    maxLength="10"
                    value={editFormData.phone}
                    onChange={handleEditChange}
                    className={`w-full bg-slate-950 text-xs border ${editErrors.phone ? 'border-rose-500' : 'border-slate-700'} rounded-lg px-3 py-2 text-slate-100 outline-none focus:border-indigo-500`}
                  />
                  {editErrors.phone && <p className="text-[10px] text-rose-400">{editErrors.phone}</p>}
                </div>
              </div>

              {/* GST Type & GSTIN */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-slate-800 pt-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">GST Type *</label>
                  <CustomSelect
                    value={editFormData.gst_type}
                    onChange={(val) => handleEditChange({ target: { name: 'gst_type', value: val } })}
                    options={GST_TYPES}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">
                    GSTIN
                    {(editFormData.gst_type === 'Registered' || editFormData.gst_type === 'Composite') && ' *'}
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      name="gstin"
                      value={editFormData.gstin}
                      onChange={handleEditChange}
                      disabled={editFormData.gst_type === 'Unregistered' || editFormData.gst_type === 'Consumer'}
                      className={`w-full bg-slate-950 text-xs border ${editErrors.gstin ? 'border-rose-500' : 'border-slate-700'} rounded-lg px-3 py-2 text-slate-100 outline-none focus:border-indigo-500 disabled:opacity-40`}
                    />
                    {isGstLoading && (
                      <span className="absolute right-3 top-2.5 flex h-4 w-4 items-center justify-center">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                      </span>
                    )}
                  </div>
                  {gstLookupSuccess && (
                    <p className="text-[10px] text-emerald-400 mt-1 font-semibold flex items-center gap-1">
                      <span>✨ GSTIN details auto-filled successfully!</span>
                    </p>
                  )}
                  {editErrors.gstin && <p className="text-[10px] text-rose-400">{editErrors.gstin}</p>}
                </div>
              </div>

              {/* State & Email */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">State *</label>
                  <CustomSelect
                    value={editFormData.state}
                    onChange={(val) => handleEditChange({ target: { name: 'state', value: val } })}
                    options={INDIAN_STATES}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Email</label>
                  <input
                    type="text"
                    name="email"
                    value={editFormData.email}
                    onChange={handleEditChange}
                    className={`w-full bg-slate-950 text-xs border ${editErrors.email ? 'border-rose-500' : 'border-slate-700'} rounded-lg px-3 py-2 text-slate-100 outline-none`}
                  />
                  {editErrors.email && <p className="text-[10px] text-rose-400">{editErrors.email}</p>}
                </div>
              </div>

              {/* Address */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Billing Address</label>
                <textarea
                  name="billing_address"
                  rows="2"
                  value={editFormData.billing_address}
                  onChange={handleEditChange}
                  className="w-full bg-slate-950 text-xs border border-slate-700 rounded-lg px-3 py-2 text-slate-100 outline-none resize-none"
                ></textarea>
              </div>

              <div className="flex justify-end gap-3 border-t border-slate-800 pt-4">
                <button
                  type="button"
                  onClick={() => setEditingEntity(null)}
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
