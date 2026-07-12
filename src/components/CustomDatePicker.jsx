import React from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { Calendar } from 'lucide-react';

export default function CustomDatePicker({ value, onChange, placeholder = "Select Date", className = "", minDate, maxDate }) {
  // Convert standard 'YYYY-MM-DD' string to Date object
  const selectedDate = value ? new Date(value) : null;
  const min = minDate ? new Date(minDate) : null;
  const max = maxDate ? new Date(maxDate) : null;

  const handleChange = (date) => {
    // Convert Date object back to 'YYYY-MM-DD' local format
    if (!date) {
      onChange('');
      return;
    }
    // Adjust for timezone to get true local date string
    const offset = date.getTimezoneOffset();
    const adjustedDate = new Date(date.getTime() - (offset * 60 * 1000));
    const dateString = adjustedDate.toISOString().split('T')[0];
    onChange(dateString);
  };

  return (
    <div className="relative w-full">
      <DatePicker
        selected={selectedDate}
        onChange={handleChange}
        minDate={min}
        maxDate={max}
        dateFormat="dd MMM yyyy"
        placeholderText={placeholder}
        className={className || "w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-100 outline-none focus:border-indigo-500 transition"}
        calendarClassName="dark-theme-calendar"
        portalId="root"
      />
      <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
    </div>
  );
}
