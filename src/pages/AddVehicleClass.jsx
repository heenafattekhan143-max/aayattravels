import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Car, CheckCircle, AlertTriangle, Trash2, Edit2, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useConfirm } from '../context/ConfirmContext';


export default function AddVehicleClass() {
  const { user } = useAuth();
  const confirm = useConfirm();
  
  const [formData, setFormData] = useState({
    name: '',
    capacity: '',
    description: ''
  });
  
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState({});
  const [successMsg, setSuccessMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`/api/vehicle-classes`);
      setClasses(res.data);
    } catch (err) {
      console.error('Failed to fetch vehicle classes', err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const tempErrors = {};
    if (!formData.name.trim()) tempErrors.name = "Class Name is required.";
    if (formData.capacity && isNaN(formData.capacity)) tempErrors.capacity = "Capacity must be a number.";
    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setIsSubmitting(true);
    setSuccessMsg('');

    try {
      const payload = {
        name: formData.name.trim(),
        capacity: formData.capacity ? parseInt(formData.capacity) : null,
        description: formData.description.trim()
      };
      
      if (editingId) {
        await axios.put(`/api/vehicle-classes/${editingId}`, payload);
        setSuccessMsg("Vehicle class updated successfully!");
        setEditingId(null);
      } else {
        await axios.post(`/api/vehicle-classes`, payload);
        setSuccessMsg("Vehicle class added successfully!");
      }
      setFormData({ name: '', capacity: '', description: '' });
      fetchClasses();
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      console.error(err);
      setErrors({ api: err.response?.data?.detail || "An error occurred while saving." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (cls) => {
    setEditingId(cls.id);
    setFormData({
      name: cls.name,
      capacity: cls.capacity || '',
      description: cls.description || ''
    });
    setErrors({});
  };

  const cancelEdit = () => {
    setEditingId(null);
    setFormData({ name: '', capacity: '', description: '' });
    setErrors({});
  };

  const handleDelete = async (id) => {
    const isConfirmed = await confirm("Are you sure you want to delete this vehicle class?");
    if (!isConfirmed) return;

    try {
      await axios.delete(`/api/vehicle-classes/${id}`);
      setClasses(prev => prev.filter(c => c.id !== id));
    } catch (err) {
      console.error(err);
      alert("Failed to delete vehicle class.");
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
      
      {/* ADD FORM */}
      <div className="glass-panel rounded-2xl border border-slate-700/50 shadow-xl p-5 lg:col-span-1">
        <div className="flex items-center justify-between mb-6 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Car className="h-5 w-5 text-indigo-400" />
            <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
              {editingId ? 'Edit Vehicle Class' : 'Add Vehicle Class'}
            </h2>
          </div>
          {editingId && (
            <button onClick={cancelEdit} className="text-slate-400 hover:text-rose-400 transition" title="Cancel Edit">
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        {successMsg && (
          <div className="mb-6 flex items-center gap-2 bg-emerald-500/15 border border-emerald-500/20 text-emerald-400 p-4 rounded-xl font-semibold">
            <CheckCircle className="h-5 w-5" />
            <span>{successMsg}</span>
          </div>
        )}

        {errors.api && (
          <div className="mb-6 flex items-center gap-2 bg-rose-500/15 border border-rose-500/20 text-rose-400 p-4 rounded-xl font-semibold">
            <AlertTriangle className="h-5 w-5" />
            <span>{errors.api}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Class Name <span className="text-rose-500">*</span></label>
              <input
                type="text"
                name="name"
                placeholder="e.g. Sedan, SUV, Luxury"
                value={formData.name}
                onChange={handleChange}
                className={`w-full bg-slate-950/60 border ${errors.name ? 'border-rose-500' : 'border-slate-700 focus:border-indigo-500'} focus:ring-2 focus:ring-indigo-500/20 outline-none rounded-xl px-4 py-2.5 text-sm text-slate-100 transition`}
              />
              {errors.name && <p className="text-xs text-rose-400 mt-1">{errors.name}</p>}
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Seating Capacity <span className="text-slate-500 font-normal">(optional)</span></label>
              <input
                type="number"
                name="capacity"
                placeholder="e.g. 4"
                value={formData.capacity}
                onChange={handleChange}
                className={`w-full bg-slate-950/60 border ${errors.capacity ? 'border-rose-500' : 'border-slate-700 focus:border-indigo-500'} focus:ring-2 focus:ring-indigo-500/20 outline-none rounded-xl px-4 py-2.5 text-sm text-slate-100 transition`}
              />
              {errors.capacity && <p className="text-xs text-rose-400 mt-1">{errors.capacity}</p>}
            </div>
          </div>
          
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">Description <span className="text-slate-500 font-normal">(optional)</span></label>
            <input
              type="text"
              name="description"
              placeholder="e.g. Standard 4-seater cars"
              value={formData.description}
              onChange={handleChange}
              className="w-full bg-slate-950/60 border border-slate-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none rounded-xl px-4 py-2.5 text-sm text-slate-100 transition"
            />
          </div>

          <div className="pt-4 border-t border-slate-800/50 flex items-center gap-3">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full sm:w-auto px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold rounded-xl transition shadow-lg shadow-indigo-500/20 disabled:opacity-50"
            >
              {isSubmitting ? "Saving..." : (editingId ? "Update Class" : "Add Vehicle Class")}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={cancelEdit}
                className="w-full sm:w-auto px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-bold rounded-xl transition"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      {/* LIST SECTION */}
      <div className="glass-panel rounded-2xl border border-slate-700/50 shadow-xl p-5 lg:col-span-2">
        <div className="flex items-center gap-2 mb-6 border-b border-slate-800 pb-3">
          <Car className="h-5 w-5 text-indigo-400" />
          <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider">Existing Vehicle Classes</h2>
        </div>
        
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
          </div>
        ) : classes.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-sm">No vehicle classes found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-700 bg-table-header text-slate-400 text-xs font-semibold uppercase tracking-wider">
                  <th className="p-4">Name</th>
                  <th className="p-4">Capacity</th>
                  <th className="p-4">Description</th>
                  <th className="p-4">Action</th>
                </tr>
              </thead>
              <tbody>
                {classes.map((cls) => (
                  <tr key={cls.id} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition group">
                    <td className="p-4 text-sm font-semibold text-slate-200">{cls.name}</td>
                    <td className="p-4 text-sm text-slate-400">{cls.capacity || '-'}</td>
                    <td className="p-4 text-sm text-slate-400">{cls.description || '-'}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <button onClick={() => handleEdit(cls)} className="p-1.5 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 transition" title="Edit">
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button onClick={() => handleDelete(cls.id)} className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition" title="Delete">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
