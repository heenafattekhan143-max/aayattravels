import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Clock } from 'lucide-react';

export default function CustomTimePicker({
  value,
  onChange,
  placeholder = '--:-- --',
  className = '',
  disabled = false,
}) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

  // Click outside to close
  useEffect(() => {
    const handler = (e) => {
      if (
        wrapRef.current &&
        !wrapRef.current.contains(e.target) &&
        !e.target.closest('.custom-time-portal')
      ) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Compute values for UI
  let h = '';
  let m = '';
  let a = '';
  
  if (value) {
    const [hStr, mStr] = value.split(':');
    let hour = parseInt(hStr, 10);
    const minute = parseInt(mStr, 10);
    
    a = hour >= 12 ? 'PM' : 'AM';
    hour = hour % 12;
    if (hour === 0) hour = 12;
    
    h = hour.toString().padStart(2, '0');
    m = minute.toString().padStart(2, '0');
  }

  // Positioning logic
  const [dropdownStyle, setDropdownStyle] = useState({});
  useEffect(() => {
    if (open && wrapRef.current) {
      const rect = wrapRef.current.getBoundingClientRect();
      setDropdownStyle({
        position: 'fixed',
        top: rect.bottom + 4,
        left: rect.left,
        width: rect.width > 200 ? rect.width : 200,
        zIndex: 999999,
      });
    }
  }, [open]);

  // Prevent scroll detaching
  useEffect(() => {
    const handleScroll = () => { if (open) setOpen(false); };
    if (open) window.addEventListener('scroll', handleScroll, true);
    return () => window.removeEventListener('scroll', handleScroll, true);
  }, [open]);

  const updateTime = (newH, newM, newA) => {
    if (!newH) newH = '12';
    if (!newM) newM = '00';
    if (!newA) newA = 'AM';
    
    let hour24 = parseInt(newH, 10);
    if (newA === 'PM' && hour24 !== 12) hour24 += 12;
    if (newA === 'AM' && hour24 === 12) hour24 = 0;
    
    const formatted = `${hour24.toString().padStart(2, '0')}:${newM}`;
    onChange(formatted);
  };

  const displayLabel = value ? `${h}:${m} ${a}` : placeholder;

  const hoursList = Array.from({ length: 12 }, (_, i) => (i + 1).toString().padStart(2, '0'));
  const minutesList = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0'));
  const ampmList = ['AM', 'PM'];

  return (
    <div ref={wrapRef} className={`relative w-full ${className}`}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(!open)}
        className={`w-full flex items-center justify-between bg-slate-950/60 border ${
          disabled ? 'border-slate-800 opacity-50 cursor-not-allowed' : open ? 'border-indigo-500 ring-1 ring-indigo-500/50' : 'border-slate-800'
        } outline-none rounded-lg px-3 py-2.5 text-sm transition`}
      >
        <span className={value ? 'text-slate-100 font-semibold' : 'text-slate-500'}>
          {displayLabel}
        </span>
        <Clock className="h-4 w-4 shrink-0 text-slate-500" />
      </button>

      {open && !disabled && createPortal(
        <div style={dropdownStyle} className="custom-time-portal bg-slate-800 border border-slate-700 rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.8)] overflow-hidden">
          <div className="p-2 border-b border-slate-700 flex gap-2">
            <div className="flex-1 bg-sky-300 text-sky-900 font-bold text-center py-1.5 rounded outline outline-2 outline-white">
              {h || '12'}
            </div>
            <div className="flex-1 bg-sky-300 text-sky-900 font-bold text-center py-1.5 rounded outline outline-2 outline-white">
              {m || '00'}
            </div>
            <div className="flex-1 bg-sky-300 text-sky-900 font-bold text-center py-1.5 rounded outline outline-2 outline-white">
              {a || 'AM'}
            </div>
          </div>
          
          <div className="flex h-48">
            <div className="flex-1 overflow-y-auto no-scrollbar border-r border-slate-700">
              {hoursList.map(hr => (
                <button
                  key={`h-${hr}`}
                  type="button"
                  onMouseDown={(e) => { e.preventDefault(); updateTime(hr, m, a); }}
                  className={`w-full text-center py-2 text-sm transition ${h === hr ? 'bg-slate-700 text-white font-bold' : 'text-slate-300 hover:bg-slate-700/50'}`}
                >
                  {hr}
                </button>
              ))}
            </div>
            <div className="flex-1 overflow-y-auto no-scrollbar border-r border-slate-700">
              {minutesList.map(min => (
                <button
                  key={`m-${min}`}
                  type="button"
                  onMouseDown={(e) => { e.preventDefault(); updateTime(h, min, a); }}
                  className={`w-full text-center py-2 text-sm transition ${m === min ? 'bg-slate-700 text-white font-bold' : 'text-slate-300 hover:bg-slate-700/50'}`}
                >
                  {min}
                </button>
              ))}
            </div>
            <div className="flex-1 overflow-y-auto no-scrollbar">
              {ampmList.map(ampm => (
                <button
                  key={`a-${ampm}`}
                  type="button"
                  onMouseDown={(e) => { e.preventDefault(); updateTime(h, m, ampm); }}
                  className={`w-full text-center py-2 text-sm transition ${a === ampm ? 'bg-slate-700 text-white font-bold' : 'text-slate-300 hover:bg-slate-700/50'}`}
                >
                  {ampm}
                </button>
              ))}
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
