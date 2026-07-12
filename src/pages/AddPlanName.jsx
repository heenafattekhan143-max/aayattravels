import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Layers, CheckCircle, AlertTriangle, Trash2, Plus } from 'lucide-react';

export default function AddPlanName() {
  const [planName, setPlanName] = useState('');
  const [planNames, setPlanNames] = useState([]);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchPlanNames();
  }, []);

  const fetchPlanNames = async () => {
    try {
      const res = await axios.get('/api/plan-names');
      setPlanNames(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!planName.trim()) {
      setErrorMsg('Plan name cannot be empty.');
      return;
    }
    setIsLoading(true);
    setSuccessMsg('');
    setErrorMsg('');
    try {
      const res = await axios.post('/api/plan-names', { name: planName });
      setSuccessMsg('Plan name added successfully!');
      setPlanName('');
      setPlanNames([...planNames, res.data]);
      setTimeout(() => setSuccessMsg(''), 2000);
    } catch (err) {
      setErrorMsg(err.response?.data?.detail || 'Failed to add plan name.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`/api/plan-names/${id}`);
      setPlanNames(planNames.filter(p => p.id !== id));
    } catch (err) {
      console.error('Failed to delete plan name:', err);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex justify-between items-center bg-gradient-to-r from-slate-900 to-indigo-950 p-6 rounded-2xl border border-indigo-500/20 shadow-xl">
        <div>
          <h1 className="text-2xl font-bold text-slate-50 tracking-tight">Add Plan Name</h1>
          <p className="text-indigo-200 mt-1 text-sm font-medium">Manage predefined plan names</p>
        </div>
        <div className="bg-indigo-500/10 p-3 rounded-xl border border-indigo-500/30">
          <Layers className="h-6 w-6 text-indigo-400" />
        </div>
      </div>

      {successMsg && (
        <div className="flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 p-4 rounded-xl">
          <CheckCircle className="h-5 w-5 shrink-0 animate-bounce" />
          <span className="font-semibold">{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="flex items-center gap-3 bg-rose-500/10 border border-rose-500/30 text-rose-400 p-4 rounded-xl">
          <AlertTriangle className="h-5 w-5 shrink-0" />
          <span className="font-semibold">{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleAdd} className="glass-panel p-6 rounded-2xl border border-slate-700/50 shadow-xl flex gap-4">
        <input 
          type="text" 
          value={planName}
          onChange={(e) => setPlanName(e.target.value)}
          placeholder="e.g. 8 Hours 80 Kms"
          className="flex-1 bg-slate-950 border border-slate-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none rounded-xl px-4 py-3 text-slate-100 transition"
        />
        <button 
          type="submit" 
          disabled={isLoading}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 px-6 rounded-xl shadow-lg transition duration-150 disabled:opacity-50"
        >
          <Plus className="h-5 w-5" /> Add
        </button>
      </form>

      <div className="glass-panel rounded-2xl border border-slate-700/50 shadow-xl overflow-hidden">
        <div className="p-4 border-b border-slate-800 bg-slate-800/20">
          <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wider">Existing Plan Names</h2>
        </div>
        <div className="divide-y divide-slate-800/50">
          {planNames.length === 0 ? (
            <div className="p-6 text-center text-slate-500 text-sm">No plan names added yet.</div>
          ) : (
            planNames.map(plan => (
              <div key={plan.id} className="p-4 flex justify-between items-center hover:bg-slate-800/20 transition">
                <span className="font-semibold text-slate-200">{plan.name}</span>
                <button 
                  onClick={() => handleDelete(plan.id)}
                  className="text-rose-400 hover:bg-rose-500/10 p-2 rounded-lg transition"
                  title="Delete Plan Name"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
