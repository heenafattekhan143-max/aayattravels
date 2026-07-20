import React, { useState, useRef, useEffect } from 'react';
import { X, Download, Printer, Eye } from 'lucide-react';
import html2pdf from 'html2pdf.js';
import DutySlipTemplate from './DutySlipTemplate';
import { createPortal } from 'react-dom';

export default function DutySlipSidebar({ isOpen, onClose, booking, plans, formatDate }) {
  const [isGenerating, setIsGenerating] = useState(false);
  
  const [config, setConfig] = useState({
    addCustomerName: true,
    addBookedByName: false,
    addAllPassengerNames: false,
    hideDutyTypeName: false,
    hideVehicleGroupName: false,
    hideVehicleName: false,
    hideRemarks: false,
    addGarageStartTime: false,
    addReleasedKmTime: false,
    addEntireDateRange: false,
    hideBusinessLetterHead: false,
  });

  const printRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen && !booking) return null;

  const handleDownloadPdf = async () => {
    if (!printRef.current) return;
    setIsGenerating(true);
    try {
      const element = printRef.current;
      const opt = {
        margin: [10, 10, 10, 10], // top, left, bottom, right in mm
        filename: `Duty_Slip_${booking?.booking_id || 'Booking'}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, logging: false },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };
      await html2pdf().from(element).set(opt).save();
    } catch (err) {
      console.error("PDF Generation failed", err);
      alert("Failed to generate PDF");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleViewPdf = async () => {
    if (!printRef.current) return;
    
    // Open window synchronously to avoid popup blockers
    const pdfWindow = window.open('', '_blank');
    if (pdfWindow) {
      pdfWindow.document.write('<html><head><title>Loading PDF...</title></head><body style="font-family:sans-serif;text-align:center;padding:50px;"><h2>Generating PDF, please wait...</h2></body></html>');
    }

    setIsGenerating(true);
    try {
      const element = printRef.current;
      const opt = {
        margin: [10, 10, 10, 10],
        filename: `Duty_Slip_${booking?.booking_id || 'Booking'}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, logging: false },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };
      
      await html2pdf().from(element).set(opt).output('blob').then((blob) => {
        const url = URL.createObjectURL(blob);
        if (pdfWindow) {
          pdfWindow.location.href = url;
        } else {
          window.open(url, '_blank');
        }
      });
    } catch (err) {
      console.error("PDF View failed", err);
      if (pdfWindow) pdfWindow.close();
      alert("Failed to view PDF");
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePrint = () => {
    if (!printRef.current) return;
    
    const printContent = printRef.current.innerHTML;
    const printWindow = window.open('', '', 'height=800,width=1000');
    if (printWindow) {
      printWindow.document.write('<html><head><title>Print Duty Slip</title>');
      // Add tailwind or required styles here for perfect print.
      // Since it uses tailwind, we can link the main css or just rely on inline styles.
      // But Tailwind classes might not load. For robustness, we will fetch the page stylesheets.
      const styles = Array.from(document.styleSheets)
        .map(styleSheet => {
          try {
            return Array.from(styleSheet.cssRules)
              .map(rule => rule.cssText)
              .join('');
          } catch (e) {
            // Cross-origin styles will fail here, ignore them.
            return '';
          }
        }).join('\\n');
        
      printWindow.document.write('<style>' + styles + '</style>');
      printWindow.document.write('</head><body class="bg-white m-0 p-0" style="print-color-adjust: exact; -webkit-print-color-adjust: exact;">');
      printWindow.document.write(printContent);
      printWindow.document.write('</body></html>');
      
      printWindow.document.close();
      printWindow.focus();
      
      // Allow time for styles to apply before printing
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 500);
    }
  };

  const toggleOption = (key) => {
    setConfig(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const options = [
    { key: 'addCustomerName', label: 'Add customer name' },
    { key: 'addBookedByName', label: 'Add booked by name' },
    { key: 'addAllPassengerNames', label: 'Add all passenger names and numbers' },
    { key: 'hideDutyTypeName', label: 'Hide duty type name' },
    { key: 'hideVehicleGroupName', label: 'Hide vehicle group name' },
    { key: 'hideVehicleName', label: 'Hide vehicle name' },
    { key: 'hideRemarks', label: 'Hide remarks' },
    { key: 'addGarageStartTime', label: 'Add garage start time' },
    { key: 'addReleasedKmTime', label: 'Add released km/time section' },
    { key: 'addEntireDateRange', label: 'Add entire booking date range' },
    { key: 'hideBusinessLetterHead', label: 'Hide business letter head' },
  ];

  return createPortal(
    <>
      {/* Backdrop */}
      <div 
        className={`fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-[9999] transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} 
        onClick={onClose}
      />

      {/* Sidebar Panel */}
      <div className={`fixed top-0 right-0 h-full w-full max-w-md bg-slate-900 border-l border-slate-700 shadow-2xl z-[10000] flex flex-col transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-800 shrink-0 bg-slate-900/50">
          <h2 className="text-lg font-bold text-slate-100">Print Duty Slip for <span className="text-indigo-400">#{booking?.booking_id || ''}</span></h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content (Options) */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-5 custom-scrollbar">
          <div className="space-y-4">
            {options.map((opt) => (
              <label key={opt.key} className="flex items-center gap-3 cursor-pointer group">
                <div className="relative flex items-center justify-center w-5 h-5">
                  <input
                    type="checkbox"
                    checked={config[opt.key]}
                    onChange={() => toggleOption(opt.key)}
                    className="peer sr-only"
                  />
                  <div className="w-5 h-5 border-2 border-slate-600 rounded bg-slate-800 peer-checked:bg-indigo-600 peer-checked:border-indigo-600 transition-colors"></div>
                  <svg className="absolute w-3.5 h-3.5 text-white pointer-events-none opacity-0 peer-checked:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-sm font-medium text-slate-300 group-hover:text-slate-100 transition-colors select-none">
                  {opt.label}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-5 border-t border-slate-800 bg-slate-900/80 shrink-0">
          <button 
            onClick={handlePrint}
            disabled={isGenerating}
            className="w-full py-3 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold shadow-lg shadow-indigo-500/25 transition-all disabled:opacity-50"
          >
            <Printer className="h-5 w-5" />
            Print Duty Slip
          </button>
        </div>

      </div>

      {/* Hidden Printable Container */}
      <div className="overflow-hidden h-0 w-0 absolute top-[-9999px] left-[-9999px]">
        {booking && (
          <DutySlipTemplate 
            ref={printRef}
            booking={booking}
            config={config}
            plans={plans}
            formatDate={formatDate}
          />
        )}
      </div>

    </>,
    document.body
  );
}
