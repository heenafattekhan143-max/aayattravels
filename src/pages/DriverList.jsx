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
  ShieldAlert,
  MapPin,
  Sparkles
} from 'lucide-react';
import { useConfirm } from '../context/ConfirmContext';
import CustomSelect from '../components/CustomSelect';
import CustomDatePicker from '../components/CustomDatePicker';

const getExpiryStatus = (expiryDateStr) => {
  if (!expiryDateStr) return { soon: false, expired: false, daysLeft: null };
  const expiryDate = new Date(expiryDateStr);
  const today = new Date();
  
  expiryDate.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  
  const diffTime = expiryDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) {
    return { soon: false, expired: true, daysLeft: diffDays };
  } else if (diffDays <= 7) {
    return { soon: true, expired: false, daysLeft: diffDays };
  }
  return { soon: false, expired: false, daysLeft: diffDays };
};

export default function DriverList({ navigateTo }) {
  const [drivers, setDrivers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Edit modal state
  const [editingDriver, setEditingDriver] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  const [editErrors, setEditErrors] = useState({});
  const [editSuccess, setEditSuccess] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Delete modal state
  const [deletingDriverId, setDeletingDriverId] = useState(null);

  useEffect(() => {
    fetchDrivers();
  }, []);

  async function fetchDrivers() {
    try {
      const res = await axios.get('/api/drivers');
      setDrivers(res.data);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch drivers list.');
    } finally {
      setLoading(false);
    }
  }

  const confirmDelete = async (id) => {
    try {
      await axios.delete(`/api/drivers/${id}`);
      setDrivers(prev => prev.filter(d => d.id !== id));
      setDeletingDriverId(null);
    } catch (err) {
      console.error(err);
      alert("Failed to delete driver.");
    }
  };

  // Open Edit Modal
  const startEdit = (driver) => {
    setEditingDriver(driver);
    setEditFormData({
      name: driver.name,
      phone: driver.phone,
      license_number: driver.license_number || '',
      status: driver.status,
      address: driver.address || '',
      joining_date: driver.joining_date || '',
      license_expiry_date: driver.license_expiry_date || '',
      basic_salary: driver.basic_salary || '',
      da_local: driver.da_local || '',
      da_outstation: driver.da_outstation || ''
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
        basic_salary: editFormData.basic_salary ? parseFloat(editFormData.basic_salary) : 0.0,
        da_local: editFormData.da_local ? parseFloat(editFormData.da_local) : 0.0,
        da_outstation: editFormData.da_outstation ? parseFloat(editFormData.da_outstation) : 0.0,
      };
      const res = await axios.put(`/api/drivers/${editingDriver.id}`, payload);
      setEditSuccess("Driver details updated successfully!");
      
      // Update drivers in local state list
      setDrivers(prev => prev.map(d => d.id === editingDriver.id ? res.data : d));

      setTimeout(() => {
        setEditingDriver(null);
      }, 1000);

    } catch (err) {
      console.error(err);
      const errMsg = err.response?.data?.detail || "An error occurred while updating driver.";
      setEditErrors({ api: errMsg });
    } finally {
      setIsSaving(false);
    }
  };

  const filteredDrivers = drivers.filter(d => 
    d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.phone.includes(searchTerm) ||
    d.license_number?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const expiringDrivers = drivers.filter(d => {
    const status = getExpiryStatus(d.license_expiry_date);
    return status.soon || status.expired;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 bg-gradient-to-r from-slate-900 to-indigo-950 p-6 rounded-2xl border border-indigo-500/20 shadow-xl">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-50 tracking-tight">Driver Registry</h1>
          <p className="text-indigo-200 mt-1 text-sm font-medium">Browse, edit, or delete driver records</p>
        </div>
        <button 
          onClick={() => navigateTo('add-driver')}
          className="page-add-btn flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2.5 px-4 rounded-xl shadow-lg transition duration-150"
        >
          <Plus className="h-4 w-4" /> Add Driver
        </button>
      </div>

      {expiringDrivers.length > 0 && (
        <div className="flex flex-col gap-2 bg-rose-500/10 border border-rose-500/30 text-rose-400 p-4 rounded-xl">
          <div className="flex items-center gap-2 font-bold">
            <AlertTriangle className="h-5 w-5 text-rose-400 animate-pulse" />
            <span>License Expiry Warning</span>
          </div>
          <ul className="list-disc pl-6 text-xs font-semibold text-rose-300 space-y-1">
            {expiringDrivers.map(d => {
              const status = getExpiryStatus(d.license_expiry_date);
              return (
                <li key={d.id}>
                  <strong>{d.name}</strong>'s license {status.expired ? "has EXPIRED" : `expires soon in ${status.daysLeft} days`} ({d.license_expiry_date}).
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <div className="flex gap-4 items-center glass-panel p-4 rounded-xl border border-slate-700/50">
        <Search className="h-5 w-5 text-slate-400 shrink-0" />
        <input 
          type="text"
          placeholder="Search by name, phone number, or license number..."
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
                  <th className="p-4">Name</th>
                  <th className="p-4">Phone</th>
                  <th className="p-4">License Number</th>
                  <th className="p-4">Joining Date</th>
                  <th className="p-4">License Expiry</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Address</th>
                  <th className="p-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-sm text-slate-300">
                {filteredDrivers.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="p-6 text-center text-slate-500">No driver profiles found.</td>
                  </tr>
                ) : (
                  filteredDrivers.map((driver) => (
                    <tr key={driver.id} className="hover:bg-slate-800/20 transition">
                      <td className="p-4 font-semibold text-slate-50">{driver.name}</td>
                      <td className="p-4">{driver.phone}</td>
                      <td className="p-4 font-mono text-xs">{driver.license_number || '-'}</td>
                      <td className="p-4 text-xs">{driver.joining_date || '-'}</td>
                      <td className="p-4 text-xs font-mono">
                        {driver.license_expiry_date ? (() => {
                          const status = getExpiryStatus(driver.license_expiry_date);
                          if (status.expired) {
                            return (
                              <span className="text-rose-500 font-bold flex items-center gap-1.5 animate-pulse">
                                <span className="h-2 w-2 rounded-full bg-rose-500 inline-block shadow-[0_0_8px_#ef4444]"></span>
                                {driver.license_expiry_date} (Expired)
                              </span>
                            );
                          } else if (status.soon) {
                            return (
                              <span className="text-amber-500 font-bold flex items-center gap-1.5 animate-pulse">
                                <span className="h-2 w-2 rounded-full bg-amber-500 inline-block shadow-[0_0_8px_#f59e0b]"></span>
                                {driver.license_expiry_date} ({status.daysLeft}d left)
                              </span>
                            );
                          }
                          return driver.license_expiry_date;
                        })() : '-'}
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded text-xs font-bold ${
                          driver.status === 'Active' 
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                            : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        }`}>
                          {driver.status}
                        </span>
                      </td>
                      <td className="p-4 max-w-xs truncate" title={driver.address}>{driver.address || '-'}</td>
                      <td className="p-4 text-center">
                        <div className="flex justify-center gap-1">
                          <button 
                            onClick={() => startEdit(driver)}
                            className="list-action-btn p-2 text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition"
                            title="Edit Driver"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button 
                            onClick={() => setDeletingDriverId(driver.id)}
                            className="list-action-btn p-2 text-rose-400 hover:bg-rose-500/10 rounded-lg transition"
                            title="Delete Driver"
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
      {editingDriver && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="glass-panel w-full max-w-xl rounded-2xl border border-slate-700/60 shadow-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h2 className="text-lg font-bold text-slate-50 flex items-center gap-2">
                <Edit className="h-5 w-5 text-indigo-400" />
                Edit Driver: {editingDriver.name}
              </h2>
              <button 
                onClick={() => setEditingDriver(null)}
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
              {/* Name & Phone */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Driver Name *</label>
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

              {/* License & Status */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-slate-800 pt-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">License Number</label>
                  <input 
                    type="text" 
                    name="license_number"
                    value={editFormData.license_number}
                    onChange={handleEditChange}
                    className="w-full bg-slate-950 text-xs border ${editErrors.license_number ? 'border-rose-500' : 'border-slate-700'} rounded-lg px-3 py-2 text-slate-100 outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Operational Status *</label>
                  <CustomSelect
                    value={editFormData.status}
                    onChange={(val) => handleEditChange({ target: { name: 'status', value: val } })}
                    options={['Active', 'Inactive']}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Joining Date</label>
                  <CustomDatePicker
                    value={editFormData.joining_date}
                    onChange={(dateStr) => setEditFormData(prev => ({ ...prev, joining_date: dateStr }))}
                    placeholder="Select joining date"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">License Expiry Date</label>
                  <CustomDatePicker
                    value={editFormData.license_expiry_date}
                    onChange={(dateStr) => setEditFormData(prev => ({ ...prev, license_expiry_date: dateStr }))}
                    placeholder="Select license expiry date"
                  />
                </div>
              </div>

              {/* Salary & DA Configuration */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-slate-800 pt-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Basic Salary (Monthly ₹)</label>
                  <input 
                    type="number" 
                    name="basic_salary"
                    value={editFormData.basic_salary}
                    onChange={handleEditChange}
                    placeholder="e.g. 15000"
                    className="w-full bg-slate-950 text-xs border border-slate-700 rounded-lg px-3 py-2 text-slate-100 outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">DA - Local (₹/Booking)</label>
                  <input 
                    type="number" 
                    name="da_local"
                    value={editFormData.da_local}
                    onChange={handleEditChange}
                    placeholder="e.g. 300"
                    className="w-full bg-slate-950 text-xs border border-slate-700 rounded-lg px-3 py-2 text-slate-100 outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">DA - Outstation (₹/Booking)</label>
                  <input 
                    type="number" 
                    name="da_outstation"
                    value={editFormData.da_outstation}
                    onChange={handleEditChange}
                    placeholder="e.g. 600"
                    className="w-full bg-slate-950 text-xs border border-slate-700 rounded-lg px-3 py-2 text-slate-100 outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Address */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Address</label>
                <textarea 
                  name="address"
                  rows="2"
                  value={editFormData.address}
                  onChange={handleEditChange}
                  className="w-full bg-slate-950 text-xs border border-slate-700 rounded-lg px-3 py-2 text-slate-100 outline-none resize-none"
                ></textarea>
              </div>

              <div className="flex justify-end gap-3 border-t border-slate-800 pt-4">
                <button
                  type="button"
                  onClick={() => setEditingDriver(null)}
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
      {/* DELETE CONFIRMATION MODAL OVERLAY */}
      {deletingDriverId && (() => {
        const driver = drivers.find(d => d.id === deletingDriverId);
        if (!driver) return null;
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
            <div className="glass-panel w-full max-w-md rounded-2xl border border-slate-700/60 shadow-2xl p-6 space-y-6">
              <div className="flex items-center gap-3 text-rose-500">
                <Trash2 className="h-6 w-6 animate-pulse" />
                <h3 className="text-lg font-bold text-slate-50">Confirm Deletion</h3>
              </div>
              <p className="text-sm text-slate-300">
                Are you sure you want to delete driver <strong>{driver.name}</strong>? This action cannot be undone.
              </p>
              <div className="flex justify-end gap-3 border-t border-slate-800 pt-4">
                <button
                  type="button"
                  onClick={() => setDeletingDriverId(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => confirmDelete(deletingDriverId)}
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-lg transition shadow-lg shadow-rose-500/20"
                >
                  Delete Driver
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
