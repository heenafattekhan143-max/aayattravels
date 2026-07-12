import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import {
  LayoutDashboard,
  FileSpreadsheet,
  Car,
  Layers,
  Users,
  FileText,
  ChevronDown,
  ChevronRight,
  Plus,
  List,
  Percent,
  Wrench,
  CheckCircle,
  Menu,
  X,
  BookOpen,
  IndianRupee,
  Sun,
  Moon,
  LogOut,
  UserCircle,
  ShieldCheck,
  Building2,
  Lock,
  Eye,
  EyeOff,
  AlertCircle
} from 'lucide-react';
import { AuthProvider, useAuth, ROLE_PERMISSIONS } from './context/AuthContext';
import LandingPage from './pages/auth/LandingPage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';

// Import Pages
import Dashboard from './pages/Dashboard';
import BasicPlanDashboard from './pages/BasicPlanDashboard';
import { useConfirm } from './context/ConfirmContext';
import CustomSelect from './components/CustomSelect';
import AddCustomer from './pages/AddCustomer';
import CustomerList from './pages/CustomerList';
import AddPlan from './pages/AddPlan';
import PlanList from './pages/PlanList';
import GenerateBill from './pages/GenerateBill';
import BillList from './pages/BillList';
import AddVehicle from './pages/AddVehicle';
import VehicleList from './pages/VehicleList';
import Quotation from './pages/Quotation';
import AddPlanName from './pages/AddPlanName';
import SalesScreen from './pages/SalesScreen';
import PurchaseScreen from './pages/PurchaseScreen';
import MyVehicleSalesScreen from './pages/MyVehicleSalesScreen';
import AddDriver from './pages/AddDriver';
import DriverList from './pages/DriverList';
import DriverSalary from './pages/DriverSalary';
import BookingScreen from './pages/BookingScreen';
import VendorPaymentsList from './pages/VendorPaymentsList';
import VendorPaymentDetails from './pages/VendorPaymentDetails';
import ReceivedPaymentsList from './pages/ReceivedPaymentsList';
import ReceivedPaymentDetails from './pages/ReceivedPaymentDetails';
import EventBilling from './pages/EventBilling';
import EventList from './pages/EventList';
import BookingList from './pages/BookingList';
import CustomDatePicker from './components/CustomDatePicker';
import BusinessProfile from './pages/BusinessProfile';

const MENU_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: 'dashboard' },
  { 
    id: 'booking', label: 'Bookings', 
    items: [
      { path: 'booking-screen', label: 'New Booking', icon: Plus },
      { path: 'booking-list', label: 'Booking List', icon: List }
    ]
  },
  { 
    id: 'billing', label: 'Bills', 
    items: [
      { path: 'add-gst', label: 'Add GST', icon: Percent },
      { path: 'generate-bill', label: 'Generate Bill', icon: Plus },
      { path: 'bill-list', label: 'Bill List', icon: List }
    ]
  },
  { 
    id: 'events', label: 'Event Management', 
    items: [
      { path: 'event-billing', label: 'Event Billing', icon: Plus },
      { path: 'event-list', label: 'Event List', icon: List }
    ]
  },
  { 
    id: 'payments', label: 'Payments', 
    items: [
      { path: 'vendor-payments', label: 'Vendor Payments', icon: IndianRupee },
      { path: 'received-vendor-payment', label: 'Received Payment', icon: IndianRupee }
    ]
  },
  { 
    id: 'company', label: 'Company / Vendors', 
    items: [
      { path: 'add-customer', label: 'Add Customer', icon: Plus },
      { path: 'customer-list', label: 'Customer / Vendor List', icon: List }
    ]
  },
  { 
    id: 'plans', label: 'Packages', 
    items: [
      { path: 'add-plan', label: 'Create Package', icon: Plus },
      { path: 'plan-list', label: 'Package List', icon: List }
    ]
  },
  { 
    id: 'vehicle', label: 'Vehicle', 
    items: [
      { path: 'add-vehicle', label: 'Add Vehicle', icon: Plus },
      { path: 'vehicle-maintenance', label: 'Vehicle Maintenance', icon: Wrench },
      { path: 'vehicle-list', label: 'Vehicle List', icon: List }
    ]
  },
  { 
    id: 'driver', label: 'Driver', 
    items: [
      { path: 'add-driver', label: 'Add Driver', icon: Plus },
      { path: 'driver-list', label: 'Driver List', icon: List },
      { path: 'driver-salary', label: 'Salary', icon: IndianRupee }
    ]
  },
  { 
    id: 'business', label: 'Business', 
    items: [
      { path: 'all-sale', label: 'All Sale', icon: FileText },
      { path: 'purchase', label: 'Purchase', icon: List },
      { path: 'my-sale', label: 'My Vehicle Sale', icon: Car }
    ]
  },
  { id: 'quotation', label: 'Quotation', icon: FileText, path: 'quotation' }
];

function AppContent() {
  const confirm = useConfirm();
  const { user, isLoggedIn, authLoading, logout, hasPermission } = useAuth();
  const [authRoute, setAuthRoute] = useState('landing'); // 'landing' | 'login' | 'register'
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [vendorForPayment, setVendorForPayment] = useState(null);
  const [customerForReceivedPayment, setCustomerForReceivedPayment] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentDateTime, setCurrentDateTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentDateTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Theme State
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('app-theme');
    return saved || 'dark';
  });

  useEffect(() => {
    if (theme === 'light') {
      document.documentElement.classList.add('light');
    } else {
      document.documentElement.classList.remove('light');
    }
    localStorage.setItem('app-theme', theme);
  }, [theme]);

  // Detect if mobile
  const isMobile = () => window.innerWidth < 1024;

  // Close sidebar on mobile when navigating
  const navigate = (page) => {
    setCurrentPage(page);
    if (isMobile()) setSidebarOpen(false);
  };

  // Submenu open/close states
  const [submenuOpen, setSubmenuOpen] = useState({
    business: true,
    billing: true,
    vehicle: false,
    plans: false,
    company: false,
    driver: false,
    booking: false,
    payments: false,
    events: false
  });

  // Edit bill routing state
  const [editingBillId, setEditingBillId] = useState(null);
  const [editingEventBillId, setEditingEventBillId] = useState(null);
  const [editingBookingId, setEditingBookingId] = useState(null);

  // Local state for inline Add GST rates configuration
  const [gstRates, setGstRates] = useState([0, 5, 12, 18]);
  const [newGstRate, setNewGstRate] = useState('');
  const [gstSuccess, setGstSuccess] = useState(false);

  // Local state for inline Vehicle Maintenance Log mockup
  const [maintenanceLogs, setMaintenanceLogs] = useState([]);
  const [newLog, setNewLog] = useState({
    vehicle: '',
    type: '',
    service: '',
    cost: '',
    date: new Date().toISOString().split('T')[0],
    status: 'Completed',
    odo_km: ''
  });
  const [editingLog, setEditingLog] = useState(null);
  const [maintenanceSuccess, setMaintenanceSuccess] = useState(false);
  const [vehicles, setVehicles] = useState([]);

  // Filters for Maintenance Logs
  const [filterVehicle, setFilterVehicle] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterMonth, setFilterMonth] = useState('');
  const [filterYear, setFilterYear] = useState('');

  const fetchVehicles = async () => {
    try {
      const res = await axios.get('/api/vehicles');
      setVehicles(res.data);
    } catch (err) {
      console.error('Error fetching vehicles:', err);
    }
  };

  const fetchMaintenanceLogs = async () => {
    try {
      const res = await axios.get('/api/maintenance');
      setMaintenanceLogs(res.data);
    } catch (err) {
      console.error('Error fetching maintenance logs:', err);
    }
  };

  useEffect(() => {
    fetchVehicles();
    fetchMaintenanceLogs();
  }, [currentPage]);

  const filteredLogs = useMemo(() => {
    return maintenanceLogs.filter(log => {
      if (filterVehicle && log.vehicle !== filterVehicle) return false;
      if (filterType && log.type !== filterType) return false;
      if (log.date) {
        const [year, month] = log.date.split('-');
        if (filterYear && year !== filterYear) return false;
        if (filterMonth && month !== filterMonth) return false;
      }
      return true;
    });
  }, [maintenanceLogs, filterVehicle, filterType, filterMonth, filterYear]);

  const totalFilteredCost = filteredLogs.reduce((sum, log) => sum + (log.cost || 0), 0);

  const toggleSubmenu = (menu) => {
    setSubmenuOpen(prev => ({
      ...prev,
      [menu]: !prev[menu]
    }));
  };

  const handleAddGst = (e) => {
    e.preventDefault();
    const rate = parseFloat(newGstRate);
    if (!isNaN(rate) && rate >= 0 && !gstRates.includes(rate)) {
      setGstRates(prev => [...prev, rate].sort((a, b) => a - b));
      setNewGstRate('');
      setGstSuccess(true);
      setTimeout(() => setGstSuccess(false), 2000);
    }
  };

  const handleDeleteGst = (rateToDelete) => {
    setGstRates(prev => prev.filter(rate => rate !== rateToDelete));
  };


  const handleAddMaintenance = async (e) => {
    e.preventDefault();
    if (!newLog.vehicle || !newLog.type || !newLog.cost) return;

    try {
      const payload = {
        vehicle: newLog.vehicle,
        type: newLog.type,
        service: newLog.service || "",
        cost: parseFloat(newLog.cost),
        date: newLog.date || new Date().toISOString().split('T')[0],
        status: newLog.status,
        odo_km: newLog.type === 'Maintenance' && newLog.odo_km ? parseInt(newLog.odo_km) : null
      };

      const res = await axios.post('/api/maintenance', payload);
      setMaintenanceLogs(prev => [res.data, ...prev]);

      setNewLog({
        vehicle: '',
        type: '',
        service: '',
        cost: '',
        date: new Date().toISOString().split('T')[0],
        status: 'Completed',
        odo_km: ''
      });
      setMaintenanceSuccess(true);
      setTimeout(() => setMaintenanceSuccess(false), 2000);
    } catch (err) {
      console.error('Error adding maintenance log:', err);
      alert('Failed to log maintenance record.');
    }
  };

  const handleEditMaintenance = async (e) => {
    e.preventDefault();
    if (!editingLog || !editingLog.vehicle || !editingLog.type || !editingLog.cost) return;
    try {
      const payload = {
        vehicle: editingLog.vehicle,
        type: editingLog.type,
        service: editingLog.service || "",
        cost: parseFloat(editingLog.cost),
        date: editingLog.date,
        status: editingLog.status,
        odo_km: editingLog.type === 'Maintenance' && editingLog.odo_km ? parseInt(editingLog.odo_km) : null
      };
      const res = await axios.put(`/api/maintenance/${editingLog.id}`, payload);
      setMaintenanceLogs(prev => prev.map(l => l.id === editingLog.id ? res.data : l));
      setEditingLog(null);
    } catch (err) {
      console.error('Error updating maintenance log:', err);
      alert('Failed to update record.');
    }
  };

  const handleDeleteMaintenance = async (logId) => {
    const isConfirmed = await confirm('Delete this maintenance record?');
    if (!isConfirmed) return;
    try {
      await axios.delete(`/api/maintenance/${logId}`);
      setMaintenanceLogs(prev => prev.filter(l => l.id !== logId));
    } catch (err) {
      console.error('Error deleting maintenance log:', err);
      alert('Failed to delete record.');
    }
  };

  // Render routing handler
  const renderContent = () => {
    switch (currentPage) {
      case 'dashboard':
        return user?.role === 'staff' ? 
          <BasicPlanDashboard navigateTo={setCurrentPage} /> : 
          <Dashboard navigateTo={setCurrentPage} theme={theme} setTheme={setTheme} />;
      case 'generate-bill':
        return <GenerateBill navigateTo={setCurrentPage} editingBillId={editingBillId} setEditingBillId={setEditingBillId} gstRates={gstRates} />;
      case 'bill-list':
        return <BillList navigateTo={setCurrentPage} setEditingBillId={setEditingBillId} />;
      case 'add-customer':
        return <AddCustomer navigateTo={setCurrentPage} />;
      case 'customer-list':
        return <CustomerList navigateTo={setCurrentPage} />;
      case 'add-plan':
        return <AddPlan navigateTo={setCurrentPage} />;
      case 'plan-list':
        return <PlanList navigateTo={setCurrentPage} />;
      case 'add-vehicle':
        return <AddVehicle navigateTo={setCurrentPage} />;
      case 'vehicle-list':
        return <VehicleList navigateTo={setCurrentPage} />;
      case 'quotation':
        return <Quotation navigateTo={setCurrentPage} />;
      case 'add-driver':
        return <AddDriver navigateTo={setCurrentPage} />;
      case 'driver-list':
        return <DriverList navigateTo={setCurrentPage} />;
      case 'driver-salary':
        return <DriverSalary navigateTo={setCurrentPage} />;
      case 'booking-screen':
        return <BookingScreen navigateTo={setCurrentPage} editingBookingId={editingBookingId} setEditingBookingId={setEditingBookingId} />;
      case 'booking-list':
        return <BookingList navigateTo={setCurrentPage} setEditingBookingId={setEditingBookingId} />;
      case 'payments':
      case 'vendor-payments':
        return <VendorPaymentsList navigateTo={setCurrentPage} setVendorForPayment={setVendorForPayment} />;
      case 'payment-details':
        return <VendorPaymentDetails navigateTo={setCurrentPage} vendorId={vendorForPayment} />;
      case 'received-vendor-payment':
        return <ReceivedPaymentsList navigateTo={setCurrentPage} setCustomerForPayment={setCustomerForReceivedPayment} />;
      case 'received-payment-details':
        return <ReceivedPaymentDetails navigateTo={setCurrentPage} customerId={customerForReceivedPayment} />;
      case 'event-billing':
        return <EventBilling navigateTo={setCurrentPage} editingEventBillId={editingEventBillId} setEditingEventBillId={setEditingEventBillId} />;
      case 'event-list':
        return <EventList navigateTo={setCurrentPage} setEditingEventBillId={setEditingEventBillId} />;
      case 'business-profile':
        return <BusinessProfile navigateTo={setCurrentPage} />;

      // Inline Add GST Section
      case 'add-gst':
        return (
          <div className="max-w-md mx-auto space-y-6">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center bg-gradient-to-r from-slate-900 to-indigo-950 p-6 rounded-2xl border border-indigo-500/20 shadow-xl gap-4">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-slate-50 tracking-tight">GST Configuration</h1>
                <p className="text-indigo-200 mt-1 text-sm font-medium">Add or manage tax tier options</p>
              </div>
              <div className="bg-indigo-500/10 p-3 rounded-xl border border-indigo-500/30 w-fit shrink-0">
                <Percent className="h-6 w-6 text-indigo-400" />
              </div>
            </div>

            {gstSuccess && (
              <div className="flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 p-4 rounded-xl">
                <CheckCircle className="h-5 w-5" />
                <span className="font-semibold">GST rate added successfully!</span>
              </div>
            )}

            <form onSubmit={handleAddGst} className="glass-panel p-6 rounded-2xl border border-slate-700/50 space-y-4 shadow-xl">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-300">New Tax Rate Percentage (%)</label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="number"
                    step="0.1"
                    placeholder="e.g. 28"
                    value={newGstRate}
                    onChange={(e) => setNewGstRate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 focus:border-indigo-500 outline-none rounded-xl px-4 py-2.5 text-slate-100 transition"
                    required
                  />
                  <button
                    type="submit"
                    className="w-full sm:w-auto px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition shadow-lg shrink-0"
                  >
                    Add Rate
                  </button>
                </div>
              </div>


              <div className="border-t border-slate-800 pt-4">
                <h3 className="text-xs uppercase font-bold text-slate-400 tracking-wider mb-2">Available Tiers</h3>
                <div className="flex flex-wrap gap-2">
                  {gstRates.map(rate => (
                    <span key={rate} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-bold text-sm">
                      <span>{rate}% GST</span>
                      <button
                        type="button"
                        onClick={() => handleDeleteGst(rate)}
                        className="text-indigo-400/50 hover:text-rose-400 hover:bg-rose-500/10 p-0.5 rounded transition"
                        title={`Delete ${rate}% GST rate`}
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </form>
          </div>
        );

      // Inline Vehicle Maintenance log Section
      case 'vehicle-maintenance':
        return (
          <div className="space-y-6">

            {maintenanceSuccess && (
              <div className="flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 p-4 rounded-xl">
                <CheckCircle className="h-5 w-5" />
                <span className="font-semibold">Maintenance record saved!</span>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Form panel */}
              <form onSubmit={editingLog ? handleEditMaintenance : handleAddMaintenance} className="glass-panel p-6 rounded-2xl border border-slate-700/50 shadow-xl space-y-4 h-fit">
                <div className="flex justify-between items-center">
                  <h3 className="text-md font-bold text-slate-50">{editingLog ? 'Edit Maintenance Record' : 'Log Maintenance Record'}</h3>
                  {editingLog && (
                    <button type="button" onClick={() => setEditingLog(null)} className="text-xs text-slate-400 hover:text-slate-200 transition">✕ Cancel</button>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Vehicle Plate No. *</label>
                  <CustomSelect
                    value={editingLog ? editingLog.vehicle : newLog.vehicle}
                    onChange={(val) => editingLog ? setEditingLog({ ...editingLog, vehicle: val }) : setNewLog({ ...newLog, vehicle: val })}
                    options={vehicles.filter(v => v.ownership_type === 'Owner').map(v => ({ value: v.vehicle_number, label: `${v.vehicle_number} ${v.model ? `(${v.model})` : ''}` }))}
                    placeholder="-- Select Vehicle --"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Service Type *</label>
                  <CustomSelect
                    value={editingLog ? editingLog.type : newLog.type}
                    onChange={(val) => editingLog ? setEditingLog({ ...editingLog, type: val }) : setNewLog({ ...newLog, type: val })}
                    options={['Fuel', 'Maintenance', 'Repair', 'Insurance', 'Others']}
                    placeholder="-- Select Type --"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Service Description</label>
                  <input
                    type="text"
                    placeholder="e.g. Oil change, Tire rotate"
                    value={editingLog ? editingLog.service : newLog.service}
                    onChange={(e) => editingLog ? setEditingLog({ ...editingLog, service: e.target.value }) : setNewLog({ ...newLog, service: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 outline-none rounded-xl px-3 py-2 text-xs text-slate-100 focus:border-indigo-500 transition"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Service Date *</label>
                  <CustomDatePicker
                    value={editingLog ? editingLog.date : newLog.date}
                    onChange={(dateStr) => editingLog ? setEditingLog({ ...editingLog, date: dateStr }) : setNewLog({ ...newLog, date: dateStr })}
                    placeholder="Select service date"
                  />
                </div>

                {(editingLog ? editingLog.type === 'Maintenance' : newLog.type === 'Maintenance') && (
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-300">ODO Meter Reading (KM)</label>
                    <input
                      type="number"
                      placeholder="e.g. 45000"
                      value={editingLog ? editingLog.odo_km || '' : newLog.odo_km}
                      onChange={(e) => editingLog ? setEditingLog({ ...editingLog, odo_km: e.target.value }) : setNewLog({ ...newLog, odo_km: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-700 outline-none rounded-xl px-3 py-2 text-xs text-slate-100 focus:border-indigo-500 transition"
                    />
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-300">Cost (₹) *</label>
                    <input
                      type="number"
                      placeholder="Cost"
                      value={editingLog ? editingLog.cost : newLog.cost}
                      onChange={(e) => editingLog ? setEditingLog({ ...editingLog, cost: e.target.value }) : setNewLog({ ...newLog, cost: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-700 outline-none rounded-xl px-3 py-2 text-xs text-slate-100 focus:border-indigo-500 transition"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-300">Status</label>
                    <CustomSelect
                      value={editingLog ? editingLog.status : newLog.status}
                      onChange={(val) => editingLog ? setEditingLog({ ...editingLog, status: val }) : setNewLog({ ...newLog, status: val })}
                      options={['Completed', 'In Progress']}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className={`w-full py-2.5 ${editingLog ? 'bg-amber-600 hover:bg-amber-500' : 'bg-indigo-600 hover:bg-indigo-500'} text-white font-semibold text-sm rounded-xl transition shadow-lg`}
                >
                  {editingLog ? 'Update Record' : 'Log Service Info'}
                </button>
              </form>

              {/* List panel */}
              <div className="glass-panel rounded-2xl border border-slate-700/50 lg:col-span-2 shadow-xl flex flex-col h-full">
                <div className="p-4 border-b border-slate-800/50 flex flex-wrap gap-4 items-center justify-between bg-slate-900/40 rounded-t-2xl">
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="w-40">
                      <CustomSelect
                        value={filterVehicle}
                        onChange={(val) => setFilterVehicle(val)}
                        options={Array.from(new Set(maintenanceLogs.map(l => l.vehicle)))}
                        placeholder="All Vehicles"
                      />
                    </div>

                    <div className="w-32">
                      <CustomSelect
                        value={filterType}
                        onChange={(val) => setFilterType(val)}
                        options={['Fuel', 'Maintenance', 'Repair', 'Insurance', 'Others']}
                        placeholder="All Types"
                      />
                    </div>

                    <div className="w-36">
                      <CustomSelect
                        value={filterMonth}
                        onChange={(val) => setFilterMonth(val)}
                        options={Array.from({ length: 12 }).map((_, i) => ({
                          value: (i + 1).toString().padStart(2, '0'),
                          label: new Date(0, i).toLocaleString('default', { month: 'short' })
                        }))}
                        placeholder="All Months"
                      />
                    </div>

                    <div className="w-32">
                      <CustomSelect
                        value={filterYear}
                        onChange={(val) => setFilterYear(val)}
                        options={['2024', '2025', '2026', '2027']}
                        placeholder="All Years"
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-rose-500/10 border border-rose-500/20">
                    <span className="text-xs text-rose-300 font-semibold">Total Cost:</span>
                    <span className="text-sm font-bold text-rose-400 font-mono">₹{totalFilteredCost.toLocaleString()}</span>
                  </div>
                </div>

                <div className="p-6 overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-700 text-slate-400 text-xs font-semibold uppercase tracking-wider bg-table-header">
                        <th className="p-3">Vehicle</th>
                        <th className="p-3">Service Details</th>
                        <th className="p-3">Cost</th>
                        <th className="p-3">Date</th>
                        <th className="p-3 text-center">Status</th>
                        <th className="p-3 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 text-xs text-slate-300">
                      {filteredLogs.map((log, idx) => (
                        <tr key={idx} className="border-b border-slate-800/50 hover:bg-slate-800/20 transition-colors">
                          <td className="px-6 py-4 text-sm font-bold font-mono text-slate-200">{log.vehicle}</td>
                          <td className="px-6 py-4 text-sm text-slate-300">
                            {log.type && (
                              <span className="inline-block px-2 py-0.5 mr-2 rounded text-[10px] font-bold bg-slate-800 text-slate-400 border border-slate-700 uppercase">
                                {log.type}
                              </span>
                            )}
                            {log.service}
                          </td>
                          <td className="p-3 font-bold text-indigo-300">₹{log.cost.toLocaleString()}</td>
                          <td className="p-3">{log.date}</td>
                          <td className="p-3 text-center">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${log.status === 'Completed'
                              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
                              : 'bg-amber-500/15 text-amber-400 border border-amber-500/20'
                              }`}>
                              {log.status}
                            </span>
                          </td>
                          <td className="p-3 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => setEditingLog({ ...log, odo_km: log.odo_km || '' })}
                                className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 border border-amber-500/20 transition"
                                title="Edit"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                              </button>
                              <button
                                onClick={() => handleDeleteMaintenance(log.id)}
                                className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-500/20 transition"
                                title="Delete"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /><path d="M10 11v6" /><path d="M14 11v6" /><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" /></svg>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {filteredLogs.length === 0 && (
                        <tr>
                          <td colSpan="6" className="px-6 py-8 text-center text-slate-500">
                            No maintenance logs found matching the selected filters.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        );

      case 'add-plan-name':
        return <AddPlanName />;

      case 'all-sale':
        return <SalesScreen navigateTo={setCurrentPage} setEditingBillId={setEditingBillId} />;

      case 'purchase':
        return <PurchaseScreen navigateTo={setCurrentPage} setEditingBillId={setEditingBillId} />;

      case 'my-sale':
        return <MyVehicleSalesScreen />;

      default:
        return <Dashboard navigateTo={setCurrentPage} theme={theme} setTheme={setTheme} />;
    }
  };

  // Show loading spinner while auth state is being restored
  if (authLoading) {
    return (
      <div className="h-full flex items-center justify-center bg-[#020617]">
        <div className="flex flex-col items-center gap-4">
          <div className="bg-indigo-600 p-4 rounded-2xl shadow-2xl shadow-indigo-500/40">
            <Car className="h-8 w-8 text-white" />
          </div>
          <div className="h-6 w-6 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  // Auth pages — shown when not logged in
  if (!isLoggedIn) {
    if (authRoute === 'login') return <LoginPage onNavigate={setAuthRoute} />;
    if (authRoute === 'register') return <RegisterPage onNavigate={setAuthRoute} />;
    return <LandingPage onNavigate={setAuthRoute} />;
  }

  // Filter menu by role
  const visibleMenuItems = MENU_ITEMS.filter(item => hasPermission(item.id));

  const roleBadgeColor = {
    superadmin: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
    vendor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    staff: 'text-sky-400 bg-sky-500/10 border-sky-500/20',
  }[user?.role] || 'text-slate-400 bg-slate-500/10 border-slate-500/20';

  return (
    <div className="h-full flex text-slate-100 bg-slate-950 font-sans relative">

      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-[90] bg-black/60 backdrop-blur-sm lg:hidden no-print"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* PERSISTENT SIDE NAVIGATION MENU */}
      <aside className={`force-dark fixed lg:static z-[100] top-0 left-0 h-full w-64 bg-slate-900 border-r border-slate-800 flex flex-col shrink-0 no-print transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}>
        {/* Header/Logo */}
        <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
          <div className="flex items-center gap-3">
            {user?.logo ? (
              <img src={user.logo} alt="Logo" className="h-10 w-10 object-contain rounded-xl bg-white p-1 shadow-lg shadow-indigo-500/30" />
            ) : (
              <div className="bg-indigo-600 p-2 rounded-xl text-white shadow-lg shadow-indigo-500/30">
                <Car className="h-5 w-5" />
              </div>
            )}
            <div className="min-w-0">
              <span className="font-extrabold text-slate-50 text-md tracking-tight block truncate">{user?.businessName || 'My Business'}</span>
              <span className="text-[10px] text-indigo-400 font-semibold tracking-wider uppercase block">Rental System</span>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-50 hover:bg-slate-800 transition lg:hidden"
          >
            <X className="h-4 w-4" />
          </button>
        </div>


        {/* Navigation list */}
        <nav className="flex-1 px-3 py-6 space-y-2 overflow-y-auto no-scrollbar">
          {visibleMenuItems.map(section => (
            <div key={section.id} className="space-y-1">
              {section.items ? (
                <>
                  <button
                    onClick={() => toggleSubmenu(section.id)}
                    className={`w-full flex items-center justify-between px-4 py-3 text-xs font-bold uppercase tracking-wider transition-all duration-300 rounded-xl group ${
                      submenuOpen[section.id] 
                        ? 'text-indigo-400 bg-indigo-500/10 shadow-sm' 
                        : 'text-slate-300 hover:text-slate-100 hover:bg-slate-800/50'
                    }`}
                  >
                    <span className="group-hover:translate-x-1 transition-transform duration-300 flex items-center gap-2">
                      {section.icon && <section.icon className="h-4 w-4" />}
                      {section.label}
                    </span>
                    <div className={`transition-transform duration-300 ${submenuOpen[section.id] ? 'rotate-180' : 'rotate-0'}`}>
                      <ChevronDown className="h-3.5 w-3.5" />
                    </div>
                  </button>
                  
                  <div 
                    className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${
                      submenuOpen[section.id] ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                    }`}
                  >
                    <div className="overflow-hidden">
                      <div className="pl-2 space-y-1 ml-4 mt-1 mb-2 border-l-2 border-slate-700/50">
                        {section.items.map(item => {
                          const isActive = currentPage === item.path || 
                            (item.path === 'vendor-payments' && currentPage === 'payment-details') ||
                            (item.path === 'received-vendor-payment' && currentPage === 'received-payment-details');
                          
                          return (
                            <button
                              key={item.path}
                              onClick={() => navigate(item.path)}
                              className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg transition-all duration-300 group relative overflow-hidden ${
                                isActive 
                                  ? 'text-indigo-400 font-bold bg-indigo-500/20 shadow-sm before:absolute before:left-0 before:top-0 before:h-full before:w-1 before:bg-indigo-500 before:rounded-r' 
                                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800'
                              }`}
                            >
                              <item.icon className={`h-4 w-4 transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`} />
                              <span className={`transition-transform duration-300 ${isActive ? 'translate-x-0' : 'group-hover:translate-x-1'}`}>
                                {item.label}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <button
                  onClick={() => navigate(section.path)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-300 group ${
                    currentPage === section.path
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/25 border-l-4 border-slate-100'
                      : 'text-slate-300 hover:text-slate-100 hover:bg-slate-800/50'
                  }`}
                >
                  <section.icon className={`h-5 w-5 transition-transform duration-300 ${currentPage === section.path ? 'scale-110' : 'group-hover:scale-110'}`} />
                  <span className="group-hover:translate-x-1 transition-transform duration-300">{section.label}</span>
                </button>
              )}
            </div>
          ))}
        </nav>

      </aside>

      {/* MAIN VIEWPORT FRAME */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-slate-950 lg:ml-0">

        {/* Navigation Bar (hidden on print) */}
        <header className="h-14 lg:h-16 border-b border-slate-800 bg-slate-900/30 flex items-center justify-between px-4 lg:px-8 shrink-0 no-print">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(s => !s)}
              className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-200 transition"
              title="Toggle Sidebar"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider hidden sm:block">
              Service Registry: <span className="text-indigo-400 font-mono">127.0.0.1:8000</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Theme Toggle */}
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="flex items-center gap-2 bg-slate-800/80 hover:bg-slate-700 px-3 py-1.5 rounded-lg text-xs font-semibold transition text-slate-200 border border-slate-700"
            >
              {theme === 'dark' ? <Sun className="h-3.5 w-3.5 text-amber-400" /> : <Moon className="h-3.5 w-3.5 text-indigo-400" />}
              {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
            </button>

            {/* Display Current System Date */}
            <div className="text-xs font-semibold text-slate-300 font-mono hidden md:block tracking-wide border border-slate-700/50 bg-slate-800/40 px-3 py-1.5 rounded-lg shadow-inner">
              {currentDateTime.toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true })}
            </div>

            {/* Profile Dropdown */}
            <div className="relative">
              <button 
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="flex items-center justify-center h-9 w-9 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 hover:bg-indigo-500/20 hover:text-indigo-300 transition"
              >
                <UserCircle className="h-5 w-5" />
              </button>

              {profileDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setProfileDropdownOpen(false)} />
                  <div className="absolute right-0 mt-3 w-56 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl z-50 overflow-hidden py-1 animate-fade-in-down origin-top-right">
                    <div className="px-4 py-3 border-b border-slate-700/50 bg-slate-900/30 mb-1">
                      <div className="text-sm font-bold text-slate-100 truncate">{user?.name || 'Admin User'}</div>
                      <div className="text-xs text-slate-400 truncate">{user?.email || 'admin@purvitravels.com'}</div>
                    </div>
                    <button 
                      onClick={() => { navigate('business-profile'); setProfileDropdownOpen(false); }}
                      className="w-full text-left px-4 py-2.5 text-sm text-slate-300 hover:bg-slate-700 hover:text-slate-100 flex items-center gap-3 transition"
                    >
                      <Building2 className="h-4 w-4 text-indigo-400" /> Business Profile
                    </button>
                    <button 
                      onClick={() => { setShowPasswordModal(true); setProfileDropdownOpen(false); }}
                      className="w-full text-left px-4 py-2.5 text-sm text-slate-300 hover:bg-slate-700 hover:text-slate-100 flex items-center gap-3 transition"
                    >
                      <Lock className="h-4 w-4 text-amber-400" /> Change Password
                    </button>
                    <div className="border-t border-slate-700/50 my-1"></div>
                    <button 
                      onClick={() => { logout(); setProfileDropdownOpen(false); }}
                      className="w-full text-left px-4 py-2.5 text-sm text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 flex items-center gap-3 transition"
                    >
                      <LogOut className="h-4 w-4" /> Sign Out
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 flex flex-col overflow-y-auto p-4 lg:p-8 w-full">
          {renderContent()}
        </main>
      </div>

      {/* Change Password Modal */}
      {showPasswordModal && (
        <ChangePasswordModal onClose={() => setShowPasswordModal(false)} />
      )}
    </div>
  );
}

function ChangePasswordModal({ onClose }) {
  const { user, updateUser } = useAuth();
  const [form, setForm] = useState({ current: '', new: '', confirm: '' });
  const [showPwd, setShowPwd] = useState({ current: false, new: false, confirm: false });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.current || !form.new || !form.confirm) {
      setError('Please fill all fields');
      return;
    }
    if (user?.password && form.current !== user.password) {
      setError('Current password is incorrect');
      return;
    }
    if (form.new !== form.confirm) {
      setError('New passwords do not match');
      return;
    }
    if (form.new.length < 6) {
      setError('New password must be at least 6 characters');
      return;
    }

    updateUser({ password: form.new });
    setSuccess('Password updated successfully!');
    setTimeout(() => {
      setSuccess('');
      onClose();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-fade-in-up">
        <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Lock className="h-5 w-5 text-indigo-400" /> Change Password
          </h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-6">
          {success ? (
            <div className="flex flex-col items-center justify-center py-8 text-emerald-400 gap-3">
              <CheckCircle className="h-12 w-12" />
              <p className="text-lg font-semibold">{success}</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {[
                { name: 'current', label: 'Current Password' },
                { name: 'new', label: 'New Password' },
                { name: 'confirm', label: 'Confirm New Password' },
              ].map(field => (
                <div key={field.name} className="space-y-1.5">
                  <label className="text-sm font-semibold text-slate-300">{field.label}</label>
                  <div className="relative">
                    <input
                      type={showPwd[field.name] ? 'text' : 'password'}
                      name={field.name}
                      value={form[field.name]}
                      onChange={handleChange}
                      placeholder={`Enter ${field.label.toLowerCase()}`}
                      className="w-full bg-slate-950/50 border border-slate-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 outline-none rounded-xl pl-4 pr-11 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPwd(p => ({ ...p, [field.name]: !p[field.name] }))}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition"
                    >
                      {showPwd[field.name] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              ))}

              {error && (
                <div className="flex items-center gap-2 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl px-4 py-3 text-sm">
                  <AlertCircle className="h-4 w-4 shrink-0" /><span>{error}</span>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={onClose} className="px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-300 hover:text-slate-100 hover:bg-slate-800 transition">
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-xl transition shadow-lg shadow-indigo-500/20">
                  Update Password
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
