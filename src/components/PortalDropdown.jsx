import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

export default function PortalDropdown({ isOpen, anchorRef, onClose, children }) {
  const [style, setStyle] = useState({});

  useEffect(() => {
    if (isOpen && anchorRef.current) {
      const rect = anchorRef.current.getBoundingClientRect();
      setStyle({
        position: 'fixed',
        top: rect.bottom + 4,
        left: rect.left,
        width: rect.width,
        zIndex: 999999,
      });
    }
  }, [isOpen, anchorRef]);

  useEffect(() => {
    const handleScroll = (e) => {
      // ignore scrolls inside the dropdown itself
      if (e.target && e.target.closest && e.target.closest('.portal-dropdown-content')) return;
      if (isOpen) onClose();
    };
    if (isOpen) {
      window.addEventListener('scroll', handleScroll, true);
      window.addEventListener('resize', onClose);
    }
    return () => {
      window.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('resize', onClose);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div 
      style={style} 
      className="portal-dropdown-content bg-[#000000] border border-slate-700 rounded-xl max-h-60 overflow-y-auto shadow-[0_10px_40px_rgba(0,0,0,0.9)] divide-y divide-slate-800"
    >
      {children}
    </div>,
    document.body
  );
}
