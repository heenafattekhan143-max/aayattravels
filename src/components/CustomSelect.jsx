import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown } from 'lucide-react';

export default function CustomSelect({
  value,
  onChange,
  options = [],
  placeholder = '-- Select --',
  disabled = false,
  className = '',
  placement = 'bottom',
  hidePlaceholder = false,
  searchable = false,
  actionButton = null,
}) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const wrapRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      // If clicking outside both the wrapper and the portal, close it
      if (wrapRef.current && !wrapRef.current.contains(e.target) && !e.target.closest('.custom-select-portal-dropdown')) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    if (!open) {
      setSearchQuery('');
    }
  }, [open]);

  const handleSelect = (v) => {
    onChange(v);
    setOpen(false);
  };

  let selectedLabel = placeholder;
  if (value !== '' && value !== undefined && value !== null) {
    const opt = options.find((o) => {
      if (typeof o === 'object') return o.value === value;
      return o === value;
    });
    if (opt) {
      selectedLabel = typeof opt === 'object' ? opt.label : opt;
    } else {
      selectedLabel = value; 
    }
  }

  const [dropdownStyle, setDropdownStyle] = useState({});

  useEffect(() => {
    if (open && wrapRef.current) {
      const rect = wrapRef.current.getBoundingClientRect();
      if (placement === 'top') {
        setDropdownStyle({
          position: 'fixed',
          bottom: window.innerHeight - rect.top + 4,
          left: rect.left,
          width: rect.width,
          zIndex: 999999,
        });
      } else {
        setDropdownStyle({
          position: 'fixed',
          top: rect.bottom + 4,
          left: rect.left,
          width: rect.width,
          zIndex: 999999,
        });
      }
    }
  }, [open, placement]);

  // Close on scroll to prevent the fixed dropdown from detaching
  useEffect(() => {
    const handleScroll = (e) => {
      // Don't close if scrolling inside the dropdown itself
      if (e.target && e.target.closest && e.target.closest('.custom-select-portal-dropdown')) {
        return;
      }
      if (open) setOpen(false);
    };
    if (open) {
      window.addEventListener('scroll', handleScroll, true);
    }
    return () => window.removeEventListener('scroll', handleScroll, true);
  }, [open]);

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
        <span className="truncate flex-1 text-left text-slate-100 font-semibold">{selectedLabel}</span>
        <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${open ? 'rotate-180 text-indigo-400' : ''}`} />
      </button>

      {open && !disabled && createPortal(
        <div 
          style={dropdownStyle} 
          className="custom-select-portal-dropdown fixed bg-slate-900 border border-slate-700/80 rounded-xl shadow-2xl shadow-black/80 flex flex-col z-[999999] overflow-hidden"
        >
          {searchable && (
            <div className="p-2 border-b border-slate-800/80 bg-slate-900/50">
              <input
                type="text"
                autoFocus
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.stopPropagation()}
                className="w-full bg-slate-950 border border-slate-700 focus:border-indigo-500 text-slate-200 rounded-lg px-3 py-1.5 text-sm outline-none transition placeholder:text-slate-500"
              />
            </div>
          )}
          <div className="max-h-52 overflow-y-auto py-1">
            {!hidePlaceholder && (
              <button
                type="button"
                onMouseDown={(e) => { e.preventDefault(); onChange(''); setOpen(false); }}
                className="w-full text-left px-4 py-2 text-sm font-semibold text-slate-400 hover:bg-slate-800/50 hover:text-slate-50 transition border-b border-slate-800/50"
              >
                {placeholder}
              </button>
            )}
            {options.filter(opt => {
              if (!searchable || !searchQuery) return true;
              const label = typeof opt === 'object' ? opt.label : opt;
              return String(label).toLowerCase().includes(searchQuery.toLowerCase());
            }).map((opt, i) => {
              const optVal = typeof opt === 'object' ? opt.value : opt;
              const optLabel = typeof opt === 'object' ? opt.label : opt;
              const dropdownLabel = typeof opt === 'object' && opt.dropdownLabel ? opt.dropdownLabel : optLabel;
              return (
                <button
                  key={i}
                  type="button"
                  onMouseDown={(e) => { e.preventDefault(); handleSelect(optVal); }}
                  className="w-full flex items-center gap-3 px-4 py-2 text-left text-sm transition text-slate-200 hover:bg-indigo-500/10 hover:text-indigo-300"
                >
                  <span className="font-semibold w-full">{dropdownLabel}</span>
                </button>
              );
            })}
          </div>
          {actionButton && (
            <div className="border-t border-slate-700/80 bg-slate-900/80 p-2">
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  setOpen(false);
                  actionButton.onClick();
                }}
                className="w-full flex items-center justify-center gap-2 py-2 text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 hover:bg-emerald-600 hover:text-white rounded-lg transition shadow-md"
              >
                {actionButton.label}
              </button>
            </div>
          )}
        </div>,
        document.body
      )}
    </div>
  );
}
