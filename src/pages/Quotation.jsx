import React, { useState } from 'react';
import { FileText, Calculator, Printer, CheckCircle } from 'lucide-react';
import CustomSelect from '../components/CustomSelect';

export default function Quotation() {
  const [quote, setQuote] = useState({
    client_name: '',
    source: 'Pune',
    destination: 'Mumbai',
    days: 1,
    vehicle_type: 'Sedan',
    package_rate: 4500,
    toll_parking: 600,
    tax_rate: 5
  });

  const [success, setSuccess] = useState(false);

  const calculateSubtotal = () => {
    return (quote.package_rate * quote.days) + parseFloat(quote.toll_parking || 0);
  };

  const calculateTax = () => {
    return calculateSubtotal() * (quote.tax_rate / 100);
  };

  const calculateTotal = () => {
    return calculateSubtotal() + calculateTax();
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">


      <form onSubmit={(e) => { e.preventDefault(); setSuccess(true); setTimeout(() => setSuccess(false), 2000); }} className="grid grid-cols-1 md:grid-cols-2 gap-6">

        <div className="glass-panel p-6 rounded-2xl border border-slate-700/50 space-y-4">
          <h2 className="text-md font-bold uppercase text-indigo-400">Trip Estimates</h2>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">Client / Org Name</label>
            <input
              type="text"
              placeholder="e.g. Infosys Ltd."
              value={quote.client_name}
              onChange={(e) => setQuote({ ...quote, client_name: e.target.value })}
              className="w-full bg-slate-950/60 border border-slate-700 focus:border-indigo-500 outline-none rounded-xl px-3 py-2 text-sm text-slate-100 transition"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Source</label>
              <input
                type="text"
                value={quote.source}
                onChange={(e) => setQuote({ ...quote, source: e.target.value })}
                className="w-full bg-slate-950/60 border border-slate-700 outline-none rounded-xl px-3 py-2 text-sm text-slate-100 transition"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Destination</label>
              <input
                type="text"
                value={quote.destination}
                onChange={(e) => setQuote({ ...quote, destination: e.target.value })}
                className="w-full bg-slate-950/60 border border-slate-700 outline-none rounded-xl px-3 py-2 text-sm text-slate-100 transition"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Days</label>
              <input
                type="number"
                min="1"
                value={quote.days}
                onChange={(e) => setQuote({ ...quote, days: parseInt(e.target.value) || 1 })}
                className="w-full bg-slate-950/60 border border-slate-700 outline-none rounded-xl px-3 py-2 text-sm text-slate-100 transition text-center"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Vehicle Class</label>
              <CustomSelect
                value={quote.vehicle_type}
                onChange={(val) => setQuote({ ...quote, vehicle_type: val })}
                options={['Sedan', 'Ertiga', 'SUV']}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Package Day Rate (₹)</label>
              <input
                type="number"
                value={quote.package_rate}
                onChange={(e) => setQuote({ ...quote, package_rate: parseFloat(e.target.value) || 0 })}
                className="w-full bg-slate-950/60 border border-slate-700 outline-none rounded-xl px-3 py-2 text-sm text-slate-100 transition"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Tolls & Parking (₹)</label>
              <input
                type="number"
                value={quote.toll_parking}
                onChange={(e) => setQuote({ ...quote, toll_parking: parseFloat(e.target.value) || 0 })}
                className="w-full bg-slate-950/60 border border-slate-700 outline-none rounded-xl px-3 py-2 text-sm text-slate-100 transition"
              />
            </div>
          </div>
        </div>

        <div className="glass-panel p-6 rounded-2xl border border-slate-700/50 flex flex-col justify-between space-y-6">
          <div>
            <h2 className="text-md font-bold uppercase text-indigo-400">Cost Summary</h2>
            <div className="space-y-3 mt-4 text-sm text-slate-300">
              <div className="flex justify-between">
                <span>Rental Subtotal ({quote.days} Days):</span>
                <span>₹{(quote.package_rate * quote.days).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Toll & Extra Fees:</span>
                <span>₹{parseFloat(quote.toll_parking || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between border-t border-slate-800 pt-3 text-xs text-slate-400">
                <span>GST Tax ({quote.tax_rate}%):</span>
                <span>₹{calculateTax().toLocaleString()}</span>
              </div>
              <div className="flex justify-between border-t border-slate-700 pt-3 text-lg font-bold text-slate-50">
                <span className="text-indigo-400">Estimated Total:</span>
                <span className="font-mono">₹{calculateTotal().toLocaleString()}</span>
              </div>
            </div>
          </div>

          {success && (
            <div className="flex items-center gap-2 text-emerald-400 bg-emerald-500/10 border border-emerald-500/25 p-2 rounded-xl text-xs font-semibold">
              <CheckCircle className="h-4 w-4 shrink-0" />
              <span>Quote calculated and exported!</span>
            </div>
          )}

          <div className="flex gap-4">
            <button
              type="submit"
              className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-lg transition text-xs"
            >
              Save Estimate
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="px-4 py-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-xl transition"
            >
              <Printer className="h-4.5 w-4.5" />
            </button>
          </div>
        </div>

      </form>
    </div>
  );
}
