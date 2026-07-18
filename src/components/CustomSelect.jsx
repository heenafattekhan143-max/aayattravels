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
        <span className={value !== '' && value !== null && value !== undefined ? 'text-slate-100 font-semibold truncate' : 'text-slate-500 truncate'}>
          {selectedLabel}
        </span>
        <ChevronDown className={`h-4 w-4 shrink-0 text-slate-500 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && !disabled && createPortal(
        <div style={dropdownStyle} className="custom-select-portal-dropdown bg-slate-900 border border-slate-800 rounded-lg shadow-[0_10px_40px_rgba(0,0,0,0.8)] overflow-hidden min-w-[max-content] flex flex-col">
          {searchable && (
            <div className="p-2 border-b border-slate-800/50">
              <input
                type="text"
                autoFocus
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.stopPropagation()}
                className="w-full bg-slate-950 border border-slate-700 outline-none rounded text-xs px-2 py-1.5 text-slate-100 focus:border-indigo-500"
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
        </div>,
        document.body
      )}
    </div>
  );
}
