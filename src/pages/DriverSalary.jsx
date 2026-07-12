import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import {
  Calendar, Search, CreditCard, Clock, ChevronDown, ChevronUp, FileText, Download, IndianRupee, Printer, SlidersHorizontal, UserCheck, Eye, Trash2, MapPin, Navigation, Map, MoreVertical, X, AlertCircle, ArrowLeft, Car, Phone, TrendingUp, User
} from 'lucide-react';
import CustomSelect from '../components/CustomSelect';
import CustomDatePicker from '../components/CustomDatePicker';
import { useAuth } from '../context/AuthContext';

const API = '/api';

const MONTHS = [
  { value: 'All', label: 'All Months' },
  { value: '01', label: 'January' },
  { value: '02', label: 'February' },
  { value: '03', label: 'March' },
  { value: '04', label: 'April' },
  { value: '05', label: 'May' },
  { value: '06', label: 'June' },
  { value: '07', label: 'July' },
  { value: '08', label: 'August' },
  { value: '09', label: 'September' },
  { value: '10', label: 'October' },
  { value: '11', label: 'November' },
  { value: '12', label: 'December' },
];

const YEARS = ['All Years', '2024', '2025', '2026', '2027', '2028', '2029', '2030', '2031', '2032', '2033', '2034', '2035', '2036', '2037', '2038', '2039', '2040', '2041', '2042', '2043', '2044', '2045', '2046', '2047', '2048', '2049', '2050', '2051', '2052', '2053', '2054', '2055', '2056', '2057', '2058', '2059', '2060'];

export default function DriverSalary({ navigateTo }) {
  const { user } = useAuth();
  const bizName    = user?.businessName || 'My Business';
  const bizAddress = user?.address      || '';
  const bizPhone   = user?.phone        || '';
  const bizEmail   = user?.email        || '';
  const bizLogo    = user?.logo         || null;
  const [drivers, setDrivers] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Selected Month & Year (Default to June 2026 as per system metadata date)
  const [selectedMonth, setSelectedMonth] = useState('06');
  const [selectedYear, setSelectedYear] = useState('2026');

  // Search and Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDriverStatus, setSelectedDriverStatus] = useState('All'); // All, Active, Inactive
  const [includedStatuses, setIncludedStatuses] = useState(['Confirmed', 'Completed']); // statuses that count for salary DAs
  const [sortBy, setSortBy] = useState('name'); // name, salary, trips, payable
  const [sortOrder, setSortOrder] = useState('asc'); // asc, desc

  // Detailed Modal State
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [detailSearchTerm, setDetailSearchTerm] = useState('');
  const [detailTripType, setDetailTripType] = useState('All'); // All, Local, Outstation
  const [detailBookingStatus, setDetailBookingStatus] = useState('All'); // All, Confirmed, Completed, Cancelled

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    setError('');
    try {
      const [driversRes, bookingsRes] = await Promise.all([
        axios.get(`${API}/drivers`),
        axios.get(`${API}/bookings`)
      ]);
      setDrivers(driversRes.data);
      setBookings(bookingsRes.data);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to fetch drivers or bookings. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  // Calculate salary summary per driver for the selected month/year
  const driversCalculated = useMemo(() => {
    return drivers.map(driver => {
      // Find all bookings for this driver in selected month & year
      const driverBookings = bookings.filter(b => {
        if (!b.driver_name || !b.journey_date) return false;

        // Exact name match
        const matchesDriver = b.driver_name.toLowerCase().trim() === driver.name.toLowerCase().trim();

        // Date match (format is YYYY-MM-DD)
        const [year, month] = b.journey_date.split('-');
        const matchesYear = selectedYear === 'All' || year === selectedYear;
        const matchesMonth = selectedMonth === 'All' || month === selectedMonth;
        const matchesDate = matchesYear && matchesMonth;

        // Status match
        const matchesStatus = includedStatuses.includes(b.booking_status);

        return matchesDriver && matchesDate && matchesStatus;
      });

      // Split into local and outstation trips
      const localTrips = driverBookings.filter(b => b.trip_type === 'Local');
      const outstationTrips = driverBookings.filter(b => b.trip_type === 'One Way' || b.trip_type === 'Round Trip');

      const localCount = localTrips.length;
      const outstationCount = outstationTrips.length;

      const basicSalary = driver.basic_salary || 0;
      const daLocalRate = driver.da_local || 0;
      const daOutstationRate = driver.da_outstation || 0;

      const totalDaLocal = localCount * daLocalRate;
      const totalDaOutstation = outstationCount * daOutstationRate;
      const totalDa = totalDaLocal + totalDaOutstation;

      const netSalary = basicSalary + totalDa;

      return {
        ...driver,
        bookingsList: driverBookings,
        localCount,
        outstationCount,
        totalDaLocal,
        totalDaOutstation,
        totalDa,
        netSalary
      };
    });
  }, [drivers, bookings, selectedMonth, selectedYear, includedStatuses]);

  // Filter and Sort the calculated driver summaries
  const filteredDrivers = useMemo(() => {
    return driversCalculated
      .filter(d => {
        // Status filter
        if (selectedDriverStatus !== 'All' && d.status !== selectedDriverStatus) return false;

        // Search term filter
        const query = searchTerm.toLowerCase().trim();
        if (!query) return true;

        return (
          d.name.toLowerCase().includes(query) ||
          d.phone.includes(query) ||
          (d.license_number && d.license_number.toLowerCase().includes(query))
        );
      })
      .sort((a, b) => {
        let fieldA, fieldB;
        if (sortBy === 'name') {
          fieldA = a.name.toLowerCase();
          fieldB = b.name.toLowerCase();
        } else if (sortBy === 'salary') {
          fieldA = a.basic_salary || 0;
          fieldB = b.basic_salary || 0;
        } else if (sortBy === 'trips') {
          fieldA = a.localCount + a.outstationCount;
          fieldB = b.localCount + b.outstationCount;
        } else if (sortBy === 'payable') {
          fieldA = a.netSalary;
          fieldB = b.netSalary;
        }

        if (fieldA < fieldB) return sortOrder === 'asc' ? -1 : 1;
        if (fieldA > fieldB) return sortOrder === 'asc' ? 1 : -1;
        return 0;
      });
  }, [driversCalculated, searchTerm, selectedDriverStatus, sortBy, sortOrder]);

  // Selected driver's detailed information (updated based on state recalculation)
  const activeDetailDriver = useMemo(() => {
    if (!selectedDriver) return null;
    return driversCalculated.find(d => d.id === selectedDriver.id) || null;
  }, [selectedDriver, driversCalculated]);

  // Selected driver's bookings list filtered by search & booking attributes
  const filteredDriverBookings = useMemo(() => {
    if (!activeDetailDriver) return [];

    // In detailed view, we fetch ALL bookings for this driver in that month, regardless of includedStatuses state, 
    // but allow filtering by booking_status in the UI modal.
    const allMonthBookings = bookings.filter(b => {
      if (!b.driver_name || !b.journey_date) return false;
      const matchesDriver = b.driver_name.toLowerCase().trim() === activeDetailDriver.name.toLowerCase().trim();
      const [year, month] = b.journey_date.split('-');
      const matchesYear = selectedYear === 'All' || year === selectedYear;
      const matchesMonth = selectedMonth === 'All' || month === selectedMonth;
      const matchesDate = matchesYear && matchesMonth;
      return matchesDriver && matchesDate;
    });

    return allMonthBookings.filter(b => {
      // Search term
      const query = detailSearchTerm.toLowerCase().trim();
      if (query) {
        const matchCust = b.customer_name.toLowerCase().includes(query);
        const matchVeh = b.vehicle_number && b.vehicle_number.toLowerCase().includes(query);
        if (!matchCust && !matchVeh) return false;
      }

      // Trip type filter
      if (detailTripType === 'Local' && b.trip_type !== 'Local') return false;
      if (detailTripType === 'Outstation' && b.trip_type === 'Local') return false;

      // Booking status filter
      if (detailBookingStatus !== 'All' && b.booking_status !== detailBookingStatus) return false;

      return true;
    });
  }, [activeDetailDriver, bookings, selectedMonth, selectedYear, detailSearchTerm, detailTripType, detailBookingStatus]);

  // Overall system-wide metric cards for the selected month/year
  const monthlyMetrics = useMemo(() => {
    let activeDrivers = driversCalculated.filter(d => d.status === 'Active').length;
    let totalTrips = 0;
    let totalDaPaid = 0;
    let totalSalaries = 0;

    driversCalculated.forEach(d => {
      totalTrips += d.localCount + d.outstationCount;
      totalDaPaid += d.totalDa;
      totalSalaries += d.netSalary;
    });

    return {
      activeDrivers,
      totalTrips,
      totalDaPaid,
      totalSalaries
    };
  }, [driversCalculated]);

  // Toggle included booking statuses
  const toggleStatus = (status) => {
    if (includedStatuses.includes(status)) {
      if (includedStatuses.length > 1) {
        setIncludedStatuses(prev => prev.filter(s => s !== status));
      }
    } else {
      setIncludedStatuses(prev => [...prev, status]);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const formatCurrency = (val) => {
    return `₹${Number(val).toLocaleString('en-IN')}`;
  };

  const getMonthName = (val) => {
    return MONTHS.find(m => m.value === val)?.label || '';
  };

  return (
    <div className="space-y-6">

      {/* Dynamic styles to print statements elegantly */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print-slip-area, .print-slip-area * {
            visibility: visible;
          }
          .print-slip-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 20px;
            background: white !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>


      {error && (
        <div className="flex items-center gap-3 bg-rose-500/10 border border-rose-500/30 text-rose-400 p-4 rounded-xl no-print">
          <AlertCircle className="h-5 w-5" />
          <span className="font-semibold">{error}</span>
        </div>
      )}

      {/* ── METRIC CARDS ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 no-print">
        {/* Active Drivers */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 bg-slate-900/20 shadow-lg flex items-center gap-4">
          <div className="bg-indigo-500/10 p-3 rounded-xl border border-indigo-500/20 text-indigo-400">
            <User className="h-6 w-6" />
          </div>
          <div>
            <span className="text-xs text-slate-500 font-bold uppercase tracking-wider block">Active Drivers</span>
            <span className="text-2xl font-extrabold text-slate-50">{loading ? '...' : monthlyMetrics.activeDrivers}</span>
          </div>
        </div>

        {/* Total Trips */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 bg-slate-900/20 shadow-lg flex items-center gap-4">
          <div className="bg-emerald-500/10 p-3 rounded-xl border border-emerald-500/20 text-emerald-400">
            <Car className="h-6 w-6" />
          </div>
          <div>
            <span className="text-xs text-slate-500 font-bold uppercase tracking-wider block">Total Trips (Month)</span>
            <span className="text-2xl font-extrabold text-slate-50">{loading ? '...' : monthlyMetrics.totalTrips}</span>
          </div>
        </div>

        {/* Total DA Paid */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 bg-slate-900/20 shadow-lg flex items-center gap-4">
          <div className="bg-amber-500/10 p-3 rounded-xl border border-amber-500/20 text-amber-400">
            <TrendingUp className="h-6 w-6" />
          </div>
          <div>
            <span className="text-xs text-slate-500 font-bold uppercase tracking-wider block">Total Allowances (DA)</span>
            <span className="text-2xl font-extrabold text-amber-400 font-mono">
              {loading ? '...' : formatCurrency(monthlyMetrics.totalDaPaid)}
            </span>
          </div>
        </div>

        {/* Total Salaries Payable */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 bg-slate-900/20 shadow-lg flex items-center gap-4">
          <div className="bg-violet-500/10 p-3 rounded-xl border border-violet-500/20 text-violet-400">
            <IndianRupee className="h-6 w-6" />
          </div>
          <div>
            <span className="text-xs text-slate-500 font-bold uppercase tracking-wider block">Net Payroll (Month)</span>
            <span className="text-2xl font-extrabold text-violet-400 font-mono">
              {loading ? '...' : formatCurrency(monthlyMetrics.totalSalaries)}
            </span>
          </div>
        </div>
      </div>

      {/* ── FILTERS AND SETTINGS PANEL ── */}
      <div className="glass-panel rounded-2xl border border-slate-800 bg-slate-900/20 p-5 space-y-4 no-print">
        <div className="flex flex-wrap gap-4 items-center justify-between">
          <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
            {/* Search Input */}
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <input
                type="text"
                placeholder="Search driver name or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700/80 outline-none rounded-xl pl-9 pr-4 py-2 text-xs text-slate-100 focus:border-indigo-500 transition placeholder-slate-600"
              />
            </div>

            <div className="w-40">
              <CustomSelect
                value={selectedDriverStatus}
                onChange={(val) => setSelectedDriverStatus(val)}
                options={[
                  { value: 'All', label: 'All Statuses' },
                  { value: 'Active', label: 'Active Drivers' },
                  { value: 'Inactive', label: 'Inactive Drivers' }
                ]}
              />
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-2 bg-slate-950 border border-slate-700 rounded-xl px-2 py-1.5 text-xs text-slate-300">
              <SlidersHorizontal className="h-3 w-3 text-slate-400" />
              <div className="w-40">
                <CustomSelect
                  value={sortBy}
                  onChange={(val) => setSortBy(val)}
                  options={[
                    { value: 'name', label: 'Sort by Name' },
                    { value: 'salary', label: 'Sort by Basic Salary' },
                    { value: 'trips', label: 'Sort by Trips Count' },
                    { value: 'payable', label: 'Sort by Net Salary' }
                  ]}
                  className="border-none bg-transparent"
                />
              </div>
              <button
                onClick={() => setSortOrder(o => o === 'asc' ? 'desc' : 'asc')}
                className="p-1 hover:bg-slate-800 rounded text-[10px] uppercase font-bold text-indigo-400"
              >
                {sortOrder}
              </button>
            </div>

            {/* Booking calculation settings */}
            {/* <div className="flex items-center gap-2 bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-300">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <Filter className="h-3 w-3 text-indigo-400" /> Include Bookings:
              </span>
              <div className="flex gap-3">
                {['Confirmed', 'Completed', 'Cancelled'].map(st => {
                  const isInc = includedStatuses.includes(st);
                  return (
                    <label key={st} className="flex items-center gap-1.5 text-[11px] cursor-pointer text-slate-300 hover:text-slate-50 select-none">
                      <input 
                        type="checkbox" 
                        checked={isInc}
                        onChange={() => toggleStatus(st)}
                        className="rounded border-slate-700 bg-slate-950 text-indigo-600 focus:ring-indigo-600 focus:ring-offset-slate-950"
                      />
                      <span>{st}</span>
                    </label>
                  );
                })}
              </div>
            </div> */}
            <div className="flex gap-3 items-center shrink-0">
              <div className="bg-slate-950 border border-slate-700/60 rounded-xl px-3 py-2 flex items-center gap-2">
                <Calendar className="h-4 w-4 text-indigo-400" />
                <div className="w-28">
                  <CustomSelect
                    value={selectedMonth}
                    onChange={(val) => setSelectedMonth(val)}
                    options={MONTHS.map(m => ({ value: m.value, label: m.label }))}
                    className="border-none bg-transparent font-semibold"
                  />
                </div>
                <span className="text-slate-600 font-bold">|</span>
                <div className="w-24">
                  <CustomSelect
                    value={selectedYear}
                    onChange={(val) => setSelectedYear(val)}
                    options={YEARS.map(y => ({ value: y, label: y }))}
                    className="border-none bg-transparent font-semibold"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── DRIVER SALARY LISTING TABLE ── */}
      <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden shadow-xl no-print">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-700 text-slate-400 text-[11px] font-bold uppercase tracking-wider bg-table-header">
                <th className="p-4">Driver Details</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Basic Salary</th>
                <th className="p-4 text-center">Local Trips (DA)</th>
                <th className="p-4 text-center">Outstation Trips (DA)</th>
                <th className="p-4 text-right">Total DA Earned</th>
                <th className="p-4 text-right bg-indigo-900/10 text-indigo-300">Net Payable</th>
                <th className="p-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs text-slate-300">
              {loading ? (
                <tr>
                  <td colSpan="8" className="p-12 text-center text-slate-500 font-semibold">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-indigo-500"></div>
                      Calculating driver compensation details...
                    </div>
                  </td>
                </tr>
              ) : filteredDrivers.length === 0 ? (
                <tr>
                  <td colSpan="8" className="p-12 text-center text-slate-500 font-semibold">
                    No driver records matching the selected parameters.
                  </td>
                </tr>
              ) : (
                filteredDrivers.map((driver) => (
                  <tr key={driver.id} className="hover:bg-slate-900/30 transition-colors">
                    <td className="p-4">
                      <div className="font-semibold text-slate-50 text-sm">{driver.name}</div>
                      <div className="text-[10px] text-slate-500 font-mono mt-0.5">{driver.phone}</div>
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${driver.status === 'Active'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        }`}>
                        {driver.status}
                      </span>
                    </td>
                    <td className="p-4 text-right font-semibold text-slate-200">
                      {formatCurrency(driver.basic_salary || 0)}
                    </td>
                    <td className="p-4 text-center">
                      <div className="font-semibold text-slate-200">{driver.localCount}</div>
                      <div className="text-[10px] text-slate-500">@{formatCurrency(driver.da_local || 0)}</div>
                    </td>
                    <td className="p-4 text-center">
                      <div className="font-semibold text-slate-200">{driver.outstationCount}</div>
                      <div className="text-[10px] text-slate-500">@{formatCurrency(driver.da_outstation || 0)}</div>
                    </td>
                    <td className="p-4 text-right font-semibold text-amber-400 font-mono">
                      {formatCurrency(driver.totalDa)}
                    </td>
                    <td className="p-4 text-right font-bold text-indigo-300 bg-indigo-900/5 font-mono text-sm">
                      {formatCurrency(driver.netSalary)}
                    </td>
                    <td className="p-4 text-center">
                      <button
                        onClick={() => {
                          setSelectedDriver(driver);
                          setDetailSearchTerm('');
                          setDetailTripType('All');
                          setDetailBookingStatus('All');
                        }}
                        className="px-3 py-1.5 rounded-lg bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 hover:bg-indigo-600 hover:text-white transition flex items-center gap-1 mx-auto text-[11px] font-bold"
                      >
                        <Eye className="h-3 w-3" /> View Details
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── DETAIL MODAL DRAWER ── */}
      {activeDetailDriver && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 no-print animate-fade-in">
          <div className="bg-slate-950 border border-slate-800 w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden rounded-2xl">

            {/* Modal Header */}
            <div className="p-6 border-b border-slate-800/80 bg-slate-900/40 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSelectedDriver(null)}
                  className="p-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-400 hover:text-slate-50 rounded-lg transition"
                >
                  <ArrowLeft className="h-4 w-4" />
                </button>
                <div>
                  <h2 className="text-lg font-bold text-slate-50 tracking-tight">Driver Statement</h2>
                  <p className="text-xs text-slate-500">Trip log and compensation details for {activeDetailDriver.name}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handlePrint}
                  className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold py-2 px-4 rounded-xl shadow-lg transition"
                >
                  <Printer className="h-3.5 w-3.5" /> Print Salary Slip
                </button>
                <button
                  onClick={() => setSelectedDriver(null)}
                  className="p-2 text-slate-400 hover:text-slate-50 hover:bg-slate-800 rounded-lg transition"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Driver & Salary Summary Card */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                {/* Driver Profile */}
                <div className="glass-panel p-4 rounded-xl border border-slate-800 bg-slate-900/10 space-y-2.5">
                  <div className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">Driver Details</div>
                  <div className="space-y-1.5 text-xs text-slate-300">
                    <div className="font-bold text-sm text-slate-50">{activeDetailDriver.name}</div>
                    <div className="flex items-center gap-2"><Phone className="h-3.5 w-3.5 text-slate-500" />{activeDetailDriver.phone}</div>
                    {activeDetailDriver.license_number && (
                      <div className="flex items-center gap-2"><span className="text-slate-500 font-bold font-mono">DL:</span> {activeDetailDriver.license_number}</div>
                    )}
                    {activeDetailDriver.address && (
                      <div className="flex items-start gap-2"><MapPin className="h-3.5 w-3.5 text-slate-500 mt-0.5" /><span className="truncate">{activeDetailDriver.address}</span></div>
                    )}
                  </div>
                </div>

                {/* Rates Card */}
                <div className="glass-panel p-4 rounded-xl border border-slate-800 bg-slate-900/10 space-y-2.5">
                  <div className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">Approved Rates</div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                      <span className="text-slate-500 block text-[9px] uppercase font-bold">Local DA</span>
                      <span className="font-bold text-slate-200 mt-0.5 block">{formatCurrency(activeDetailDriver.da_local || 0)}</span>
                    </div>
                    <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                      <span className="text-slate-500 block text-[9px] uppercase font-bold">Outstation DA</span>
                      <span className="font-bold text-slate-200 mt-0.5 block">{formatCurrency(activeDetailDriver.da_outstation || 0)}</span>
                    </div>
                  </div>
                  <div className="text-[10px] text-slate-500 italic">DAs are credited per booking matching approved trip scopes.</div>
                </div>

                {/* Calculation Summary Card */}
                <div className="glass-panel p-4 rounded-xl border border-slate-800/80 bg-indigo-950/20 shadow-lg space-y-2">
                  <div className="text-[10px] font-bold text-violet-400 uppercase tracking-wider">Salary Summary ({getMonthName(selectedMonth)} {selectedYear})</div>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between text-slate-400">
                      <span>Basic Salary:</span>
                      <span className="font-mono text-slate-200 font-semibold">{formatCurrency(activeDetailDriver.basic_salary || 0)}</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Local Trips ({activeDetailDriver.localCount}):</span>
                      <span className="font-mono text-slate-200 font-semibold">+{formatCurrency(activeDetailDriver.totalDaLocal)}</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Outstation Trips ({activeDetailDriver.outstationCount}):</span>
                      <span className="font-mono text-slate-200 font-semibold">+{formatCurrency(activeDetailDriver.totalDaOutstation)}</span>
                    </div>
                    <div className="border-t border-slate-800 my-1.5 pt-1.5 flex justify-between text-sm font-bold">
                      <span className="text-slate-50">Net Payable:</span>
                      <span className="font-mono text-indigo-400">{formatCurrency(activeDetailDriver.netSalary)}</span>
                    </div>
                  </div>
                </div>

              </div>

              {/* Booking List Filters */}
              <div className="glass-panel p-4 rounded-xl border border-slate-800 bg-slate-900/10 space-y-3">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Filter Trip History</div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Search customer/vehicle */}
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
                    <input
                      type="text"
                      placeholder="Search customer, vehicle..."
                      value={detailSearchTerm}
                      onChange={(e) => setDetailSearchTerm(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 outline-none rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 focus:border-indigo-500"
                    />
                  </div>

                  {/* Trip Type Select */}
                  <div className="w-44">
                    <CustomSelect
                      value={detailTripType}
                      onChange={(val) => setDetailTripType(val)}
                      options={[
                        { value: 'All', label: 'All Trip Types' },
                        { value: 'Local', label: 'Local Trips Only' },
                        { value: 'Outstation', label: 'Outstation Trips Only' }
                      ]}
                    />
                  </div>

                  {/* Booking Status Select */}
                  <div className="w-48">
                    <CustomSelect
                      value={detailBookingStatus}
                      onChange={(val) => setDetailBookingStatus(val)}
                      options={[
                        { value: 'All', label: 'All Booking Statuses' },
                        { value: 'Confirmed', label: 'Confirmed' },
                        { value: 'Completed', label: 'Completed' },
                        { value: 'Cancelled', label: 'Cancelled' }
                      ]}
                    />
                  </div>
                </div>
              </div>

              {/* Bookings Details Table */}
              <div className="glass-panel rounded-xl border border-slate-800 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-700 text-slate-400 text-[10px] font-bold uppercase tracking-wider bg-table-header">
                        <th className="p-3">S.No.</th>
                        <th className="p-3">Journey Date</th>
                        <th className="p-3">Customer Details</th>
                        <th className="p-3">Vehicle</th>
                        <th className="p-3">Trip Type</th>
                        <th className="p-3">Status</th>
                        <th className="p-3 text-right">Trip DA</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-900 text-xs text-slate-300">
                      {filteredDriverBookings.length === 0 ? (
                        <tr>
                          <td colSpan="7" className="p-8 text-center text-slate-500 font-semibold">
                            No bookings found for the selected filters.
                          </td>
                        </tr>
                      ) : (
                        filteredDriverBookings.map((b, idx) => {
                          const isLocal = b.trip_type === 'Local';
                          const daAmount = isLocal ? (activeDetailDriver.da_local || 0) : (activeDetailDriver.da_outstation || 0);
                          const isExcluded = !includedStatuses.includes(b.booking_status);

                          return (
                            <tr key={b.id || idx} className={`hover:bg-slate-900/20 transition-colors ${isExcluded ? 'opacity-50 line-through' : ''}`}>
                              <td className="p-3 font-mono text-slate-500">{idx + 1}</td>
                              <td className="p-3 font-semibold">{b.journey_date || '—'}</td>
                              <td className="p-3">
                                <div className="font-semibold text-slate-200">{b.customer_name}</div>
                                {b.customer_phone && <div className="text-[10px] text-slate-500 font-mono">{b.customer_phone}</div>}
                              </td>
                              <td className="p-3 font-mono font-bold text-slate-300">{b.vehicle_number || '—'}</td>
                              <td className="p-3">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${isLocal
                                  ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                                  : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                                  }`}>
                                  {b.trip_type || 'Outstation'}
                                </span>
                              </td>
                              <td className="p-3">
                                <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${b.booking_status === 'Completed'
                                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                  : b.booking_status === 'Cancelled'
                                    ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                                    : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                                  }`}>
                                  {b.booking_status}
                                </span>
                              </td>
                              <td className="p-3 text-right font-bold text-slate-200 font-mono">
                                {isExcluded ? '₹0' : formatCurrency(daAmount)}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-800/80 bg-slate-900/20 flex justify-end gap-3 shrink-0">
              <button
                onClick={() => setSelectedDriver(null)}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ── PRINT-ONLY DETAILED COMPENSATION SLIP SHEET (Visually styled payslip invoice) ── */}
      {activeDetailDriver && (
        <div className="hidden print-slip-area print-only font-sans p-8 space-y-6 bg-white text-black">
          {/* Header */}
          <div className="border border-slate-700 text-slate-800 mb-6 rounded-lg overflow-hidden">
            {/* Row 1: Company Title + Logo */}
            <div className="py-4 px-6 border-b border-slate-700 text-center bg-slate-50 flex items-center justify-between min-h-[100px]">
              <div className="w-40 flex justify-start shrink-0">
                {bizLogo && (
                  <img src={bizLogo} alt="Logo" className="h-20 w-auto max-w-[160px] object-contain rounded" />
                )}
              </div>
              <div className="flex-1 px-4">
                <h1 className="text-3xl font-black tracking-tight leading-none text-[#0096FF] print:text-[#0096FF]" style={{ color: '#0096FF', WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}>{bizName.toUpperCase()}</h1>
                {bizAddress && <p className="text-xs mt-1.5 font-bold text-slate-600 print:text-slate-600">{bizAddress}</p>}
              </div>
              <div className="w-40 shrink-0"></div>
            </div>
            {/* Row 2: Contact Info */}
            <div className="grid grid-cols-2 md:grid-cols-3 border-b border-slate-700 divide-x divide-slate-700 bg-slate-50/50 text-xs">
              <div className="p-2 px-4 flex items-center justify-center">
                <span className="font-bold text-slate-500 mr-2">Phone:</span> <span className="font-black text-slate-900">{bizPhone || '—'}</span>
              </div>
              <div className="p-2 px-4 flex items-center justify-center">
                <span className="font-bold text-slate-500 mr-2">Email:</span> <span className="font-black text-slate-900">{bizEmail || '—'}</span>
              </div>
              <div className="p-2 px-4 hidden md:flex items-center justify-center">
                <span className="font-bold text-slate-500 mr-2">Generated:</span> <span className="font-black text-slate-900 font-mono">{new Date().toLocaleDateString('en-IN')}</span>
              </div>
            </div>
            {/* Row 3: Document Title & Details */}
            <div className="grid grid-cols-2 divide-x divide-slate-700 bg-slate-100">
              <div className="p-3 px-4 flex items-center justify-center">
                <span className="text-sm font-black text-slate-900 tracking-widest uppercase">Compensation Statement</span>
              </div>
              <div className="p-3 px-4 flex items-center justify-center">
                <span className="text-xs font-bold mr-3 text-slate-600 uppercase tracking-wider">Statement Period:</span> 
                <span className="text-sm font-black text-slate-900 uppercase">{getMonthName(selectedMonth)} {selectedYear}</span>
              </div>
            </div>
          </div>

          {/* Profiles section */}
          <div className="grid grid-cols-2 gap-8 py-4">
            {/* Driver Profile */}
            <div className="space-y-1.5">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">DRIVER PROFILE</h3>
              <div className="text-sm font-bold text-slate-900">{activeDetailDriver.name}</div>
              <div className="text-xs text-slate-700">Phone: {activeDetailDriver.phone}</div>
              {activeDetailDriver.license_number && (
                <div className="text-xs text-slate-700">License No: {activeDetailDriver.license_number}</div>
              )}
              {activeDetailDriver.joining_date && (
                <div className="text-xs text-slate-700">Joining Date: {activeDetailDriver.joining_date}</div>
              )}
              {activeDetailDriver.address && (
                <div className="text-xs text-slate-700 leading-relaxed max-w-xs">Address: {activeDetailDriver.address}</div>
              )}
            </div>

            {/* Compensation rates configuration */}
            <div className="space-y-1.5 text-right">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider text-right">CONTRACT STRUCTURE</h3>
              <div className="text-xs text-slate-700">Monthly Basic Salary: {formatCurrency(activeDetailDriver.basic_salary || 0)}</div>
              <div className="text-xs text-slate-700">Approved Local DA rate: {formatCurrency(activeDetailDriver.da_local || 0)} per booking</div>
              <div className="text-xs text-slate-700">Approved Outstation DA rate: {formatCurrency(activeDetailDriver.da_outstation || 0)} per booking</div>
            </div>
          </div>

          {/* Salary Computation Breakdown */}
          <div className="border border-slate-300 rounded-lg overflow-hidden bg-slate-50 p-4 space-y-3">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">PAYSLIP SUMMARY</h3>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between font-semibold border-b border-slate-200 pb-1.5 text-slate-800">
                <span>1. Monthly Basic Salary (Fixed)</span>
                <span className="font-mono">{formatCurrency(activeDetailDriver.basic_salary || 0)}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200 pb-1.5 text-slate-700">
                <span>2. Local Trips Allowance ({activeDetailDriver.localCount} Trips @ {formatCurrency(activeDetailDriver.da_local || 0)})</span>
                <span className="font-mono">+{formatCurrency(activeDetailDriver.totalDaLocal)}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200 pb-1.5 text-slate-700">
                <span>3. Outstation Trips Allowance ({activeDetailDriver.outstationCount} Trips @ {formatCurrency(activeDetailDriver.da_outstation || 0)})</span>
                <span className="font-mono">+{formatCurrency(activeDetailDriver.totalDaOutstation)}</span>
              </div>
              <div className="flex justify-between text-slate-600 border-b border-slate-200 pb-1.5">
                <span>Total Allowance (DA) Earned</span>
                <span className="font-mono font-semibold">{formatCurrency(activeDetailDriver.totalDa)}</span>
              </div>
              <div className="flex justify-between text-sm font-bold text-slate-900 pt-1.5">
                <span>NET PAYABLE SALARY</span>
                <span className="font-mono text-indigo-700 text-base">{formatCurrency(activeDetailDriver.netSalary)}</span>
              </div>
            </div>
          </div>

          {/* Signature panel */}
          <div className="grid grid-cols-2 gap-16 pt-16 text-xs font-semibold text-slate-700 items-end">
            <div className="border-t border-slate-400 text-center pt-2 max-w-[200px]">
              DRIVER SIGNATURE
            </div>
            <div className="flex flex-col items-center max-w-[200px] w-full ml-auto">
              <img src="/signature.png" alt="Signature" className="h-36 object-contain -mb-5 relative z-10 opacity-90" />
              <div className="w-full border-t border-slate-400 text-center pt-2 relative z-20">
                AUTHORIZED SIGNATORY
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
