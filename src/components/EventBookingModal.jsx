import React, { useState, useEffect } from 'react';
import { X, Car, CheckCircle } from 'lucide-react';
import CustomDatePicker from './CustomDatePicker';
import CustomSelect from './CustomSelect';

const TRIP_TYPES = ['One Way', 'Round Trip', 'Local'];
const VEHICLE_CLASSES = ['Hatchback', 'Sedan', 'SUV', 'MUV', 'Premium Sedan', 'Luxury', 'Traveller', 'Mini Bus', 'Bus'];

export default function EventBookingModal({ 
  isOpen, 
  onClose, 
  onSave, 
  vehicles, 
  drivers, 
  defaultCustomer, 
  defaultCustomerPhone,
  defaultDate,
  defaultDropLocation,
  initialData,
  plans = []
}) {
  const [formData, setFormData] = useState({
    customer_name: '',
    pickup_location: '',
    drop_location: defaultDropLocation || '',
    pickup_time: '10:00',
    journey_date: defaultDate || '',
    vehicle_number: '',
    vehicle_type: '',
    vehicle_class: '',
    driver_name: '',
    trip_type: 'Local',
    selected_plan_id: '',
    rate: '',
    da_allowance: '',
    night_allowance: '',
    passengers: 1,
    remarks: ''
  });

  const [isDraftLoaded, setIsDraftLoaded] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setFormData({ ...initialData });
      } else {
        const draft = localStorage.getItem('draftEventBooking');
        if (draft) {
          try {
            setFormData(JSON.parse(draft));
          } catch (e) {
            console.error("Error parsing draft event booking", e);
          }
        } else {
          setFormData({
            customer_name: '',
            pickup_location: '',
            drop_location: defaultDropLocation || '',
            pickup_time: '10:00',
            journey_date: defaultDate || '',
            vehicle_number: '',
            vehicle_class: '',
            driver_name: '',
            trip_type: 'Local',
            selected_plan_id: '',
            rate: '',
            da_allowance: '',
            night_allowance: '',
            passengers: 1,
            remarks: ''
          });
        }
      }
      setIsDraftLoaded(true);
    } else {
      setIsDraftLoaded(false); // Reset when modal closes
    }
  }, [isOpen, initialData, defaultDate, defaultDropLocation]);

  useEffect(() => {
    if (isOpen && !initialData && isDraftLoaded) {
      localStorage.setItem('draftEventBooking', JSON.stringify(formData));
    }
  }, [formData, isOpen, initialData]);

  const handleChange = (field, value) => {
    setFormData(prev => {
      const next = { ...prev, [field]: value };
      if (field === 'vehicle_number') {
        const v = vehicles.find(veh => veh.vehicle_number === value);
        if (v) {
          next.vehicle_type = v.vehicle_type || '';
          if (v.driver_name) next.driver_name = v.driver_name;
        }
      }
      return next;
    });
  };

  const handlePlanChange = (planId) => {
    const p = plans.find(x => x.id === planId);
    if (p) {
      setFormData(prev => ({ 
        ...prev, 
        selected_plan_id: planId, 
        rate: p.rate || '',
        da_allowance: p.da_allowance || '',
        night_allowance: p.night_allowance || ''
      }));
    } else {
      setFormData(prev => ({ ...prev, selected_plan_id: '' }));
    }
  };

  const handleSave = () => {
    if (!formData.pickup_location || !formData.vehicle_number || !formData.driver_name) {
      alert('Please fill in pickup location, vehicle, and driver.');
      return;
    }
    
    if (!initialData) {
      localStorage.removeItem('draftEventBooking');
    }
    
    onSave({
      ...formData,
      rate: parseFloat(formData.rate) || 0,
      da_allowance: parseFloat(formData.da_allowance) || 0,
      night_allowance: parseFloat(formData.night_allowance) || 0,
      customer_name: formData.customer_name || defaultCustomer || 'Event Customer',
      customer_phone: defaultCustomerPhone || '',
      booking_status: 'Confirmed',
      payment_status: 'Pending',
      is_guest: false
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700/60 rounded-3xl shadow-2xl overflow-hidden">
        
        <div className="px-6 py-5 border-b border-slate-800/60 flex justify-between items-center bg-slate-800/20">
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <Car className="h-5 w-5 text-indigo-400" /> Add Event Booking
          </h2>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-4 space-y-3 max-h-[80vh] overflow-y-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1 sm:col-span-2">
              <label className="text-xs font-semibold text-slate-300">Customer Name</label>
              <input type="text" value={formData.customer_name} onChange={(e) => handleChange('customer_name', e.target.value)} 
                placeholder="Enter customer name"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-slate-100 outline-none" />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Vehicle *</label>
              <input type="text" value={formData.vehicle_number} onChange={(e) => handleChange('vehicle_number', e.target.value)}
                placeholder="Enter vehicle number"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-slate-100 outline-none" />
            </div>
            
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Vehicle Class <span className="text-slate-500 lowercase">(Optional)</span></label>
              <CustomSelect
                value={formData.vehicle_class}
                onChange={(val) => handleChange('vehicle_class', val)}
                options={[
                  { value: '', label: 'None' },
                  ...VEHICLE_CLASSES.map(vc => ({ value: vc, label: vc }))
                ]}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Driver *</label>
              <input type="text" value={formData.driver_name} onChange={(e) => handleChange('driver_name', e.target.value)}
                placeholder="Enter driver name"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-slate-100 outline-none" />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Journey Date</label>
              <CustomDatePicker value={formData.journey_date} onChange={(v) => handleChange('journey_date', v)} />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Pickup Time</label>
              <input type="time" value={formData.pickup_time} onChange={(e) => handleChange('pickup_time', e.target.value)} 
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-slate-100 outline-none [color-scheme:dark]" />
            </div>
            
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Pickup Location *</label>
              <input type="text" value={formData.pickup_location} onChange={(e) => handleChange('pickup_location', e.target.value)} 
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-slate-100 outline-none" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Drop Location</label>
              <input type="text" value={formData.drop_location} onChange={(e) => handleChange('drop_location', e.target.value)} 
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-slate-100 outline-none" />
            </div>
            
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Trip Type</label>
              <CustomSelect value={formData.trip_type} onChange={(v) => handleChange('trip_type', v)} options={TRIP_TYPES} />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Select Package (Optional)</label>
              <CustomSelect
                value={formData.selected_plan_id}
                onChange={handlePlanChange}
                options={plans.map(p => ({ value: p.id, label: `${p.plan_name} - ₹${p.rate}` }))}
                placeholder="-- Select Package --"
                searchable={true}
              />
            </div>
            
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Rate (₹) *</label>
              <input type="number" value={formData.rate} onChange={(e) => handleChange('rate', e.target.value)}
                placeholder="e.g. 3000"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-slate-100 outline-none" />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">DA Allowance (₹)</label>
              <input type="number" value={formData.da_allowance} onChange={(e) => handleChange('da_allowance', e.target.value)}
                placeholder="e.g. 500"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-slate-100 outline-none" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Night Allowance (₹)</label>
              <input type="number" value={formData.night_allowance} onChange={(e) => handleChange('night_allowance', e.target.value)}
                placeholder="e.g. 300"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-slate-100 outline-none" />
            </div>

            <div className="space-y-1 sm:col-span-2">
              <label className="text-xs font-semibold text-slate-300">Remarks</label>
              <textarea value={formData.remarks} onChange={(e) => handleChange('remarks', e.target.value)} rows="2"
                placeholder="Any additional notes..."
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-slate-100 outline-none resize-none" />
            </div>
          </div>
        </div>
        
        <div className="px-4 py-3 bg-slate-900 border-t border-slate-800 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 rounded-lg border border-slate-700 text-slate-300 text-sm font-semibold hover:bg-slate-800 transition">
            Cancel
          </button>
          <button onClick={handleSave} className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold shadow-lg shadow-indigo-500/20 transition flex items-center gap-2">
            <CheckCircle className="h-4 w-4" /> Save Booking
          </button>
        </div>

      </div>
    </div>
  );
}
