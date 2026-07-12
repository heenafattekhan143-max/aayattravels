import React, { useState, useRef } from 'react';
import {
  Car, Eye, EyeOff, ArrowRight, Mail, Lock, User, Phone,
  Building, MapPin, Hash, Globe, CheckCircle, AlertCircle, ChevronDown,
  TrendingUp, Users, Shield, Star, FileImage, Upload, X
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const BUSINESS_TYPES = [
  'Car-rental company',
  'Tours & Travels company',
  'Travel agent',
  'Corporate Transport',
  'Other',
];

const CITIES = [
  'Mumbai', 'Pune', 'Nashik', 'Nagpur', 'Aurangabad', 'Kolhapur',
  'Solapur', 'Thane', 'Navi Mumbai', 'Ahmednagar', 'Amravati', 'Other',
];

const leftPanelStep1 = [
  { icon: TrendingUp, text: 'Real-time booking & revenue tracking' },
  { icon: Car,        text: 'Full fleet & driver management' },
  { icon: Users,      text: 'Multi-user role-based access' },
  { icon: Shield,     text: 'Secure, GST-compliant billing' },
];

const leftPanelStep2 = [
  { icon: Star,       text: 'Personalized dashboard for your business' },
  { icon: TrendingUp, text: 'Powerful analytics from day one' },
  { icon: Shield,     text: 'Your data is secure & private' },
  { icon: CheckCircle,text: 'Setup completes in under 2 minutes' },
];

export default function RegisterPage({ onNavigate }) {
  const { register } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [verificationSent, setVerificationSent] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [businessTypeOpen, setBusinessTypeOpen] = useState(false);
  const [cityOpen, setCityOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [step1, setStep1] = useState({ email: '', name: '', phone: '', password: '', confirmPassword: '' });
  const [step2, setStep2] = useState({ businessName: '', businessType: 'Car-rental company', address: '', pincode: '', city: '', referral: '', gstin: '' });
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const logoInputRef = useRef(null);

  const handleStep1Change = (e) => { setStep1(p => ({ ...p, [e.target.name]: e.target.value })); setError(''); };
  const handleStep2Change = (e) => { setStep2(p => ({ ...p, [e.target.name]: e.target.value })); setError(''); };

  const handleLogoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { setError('Logo must be an image file.'); return; }
    if (file.size > 2 * 1024 * 1024) { setError('Logo must be smaller than 2MB.'); return; }
    setLogoFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setLogoPreview(ev.target.result);
    reader.readAsDataURL(file);
    setError('');
  };

  const handleLogoRemove = () => {
    setLogoFile(null);
    setLogoPreview(null);
    if (logoInputRef.current) logoInputRef.current.value = '';
  };

  const validateStep1 = () => {
    if (!step1.email || !step1.name || !step1.phone || !step1.password || !step1.confirmPassword) return 'Please fill in all required fields.';
    if (!/\S+@\S+\.\S+/.test(step1.email)) return 'Please enter a valid email address.';
    if (step1.phone.length < 10) return 'Please enter a valid 10-digit phone number.';
    if (step1.password.length < 6) return 'Password must be at least 6 characters.';
    if (step1.password !== step1.confirmPassword) return 'Passwords do not match.';
    return null;
  };

  const handleStep1Submit = async (e) => {
    e.preventDefault();
    const err = validateStep1();
    if (err) { setError(err); return; }
    setLoading(true);
    await new Promise(r => setTimeout(r, 600));
    setLoading(false);
    setCurrentStep(2);
    setVerificationSent(true);
    setError('');
  };

  const validateStep2 = () => {
    if (!step2.businessName || !step2.businessType || !step2.address || !step2.city) return 'Please fill in all required fields.';
    return null;
  };

  const handleStep2Submit = async (e) => {
    e.preventDefault();
    const err = validateStep2();
    if (err) { setError(err); return; }
    setLoading(true);
    await new Promise(r => setTimeout(r, 800));
    await register(step1, { ...step2, logoFile });
  };

  const inputCls = "w-full bg-slate-800/60 border border-slate-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 outline-none rounded-xl px-4 py-2.5 text-slate-100 placeholder:text-slate-500 transition text-sm";
  const inputIconCls = "w-full bg-slate-800/60 border border-slate-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 outline-none rounded-xl pl-10 pr-4 py-2.5 text-slate-100 placeholder:text-slate-500 transition text-sm";
  const labelCls = "text-xs font-semibold text-slate-400 uppercase tracking-wide";
  const highlights = currentStep === 1 ? leftPanelStep1 : leftPanelStep2;

  return (
    <div className="min-h-screen bg-[#020617] flex font-sans overflow-hidden">

      {/* ===== LEFT PANEL ===== */}
      <div className="hidden lg:flex flex-col w-[45%] relative overflow-hidden">
        <img src="/login-bg.png" alt="City highways" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-br from-[#020617]/88 via-indigo-950/65 to-violet-950/50" />
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-indigo-600/30 rounded-full blur-[100px] animate-pulse" />
        <div className="absolute bottom-0 right-0 w-72 h-72 bg-violet-600/20 rounded-full blur-[80px] animate-pulse" style={{animationDelay:'2s'}} />

        <div className="relative z-10 flex flex-col h-full p-10">
          {/* Logo */}
          <div className="flex items-center gap-3 animate-fade-in-down">
            <div className="bg-indigo-600 p-2.5 rounded-xl shadow-2xl shadow-indigo-500/50 animate-pulse-glow">
              <Car className="h-6 w-6 text-white" />
            </div>
            <div>
              <span className="font-extrabold text-white text-xl tracking-tight">Miracrest Group</span>
              <span className="text-[10px] text-indigo-300 font-semibold tracking-widest uppercase block leading-none">Rental System</span>
            </div>
          </div>

          {/* Step indicator on left */}
          <div className="flex items-center gap-3 mt-8 animate-fade-in-up delay-100 opacity-0-init">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black transition-all duration-500 ${currentStep >= 1 ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/40' : 'bg-slate-800 text-slate-500'}`}>1</div>
            <div className={`h-0.5 w-8 rounded-full transition-all duration-500 ${currentStep >= 2 ? 'bg-indigo-500' : 'bg-slate-700'}`} />
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black transition-all duration-500 ${currentStep >= 2 ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/40' : 'bg-slate-800 text-slate-500'}`}>2</div>
            <span className="text-xs text-slate-400 ml-2">{currentStep === 1 ? 'Personal Info' : 'Business Setup'}</span>
          </div>

          <div className="flex-1 flex flex-col justify-center">
            <h2 className="text-3xl font-black text-white leading-tight mb-3 animate-fade-in-up delay-200 opacity-0-init">
              {currentStep === 1 ? <>Join Hundreds of<br /><span className="shimmer-text">Travel Businesses.</span></> : <>Almost There!<br /><span className="shimmer-text">Setup Your Business.</span></>}
            </h2>
            <p className="text-slate-300 text-base mb-8 leading-relaxed animate-fade-in-up delay-300 opacity-0-init">
              {currentStep === 1
                ? 'Create your account in seconds and start managing your operations today.'
                : 'Add your business details to personalize your dashboard experience.'}
            </p>

            <ul className="space-y-4">
              {highlights.map((h, i) => (
                <li key={h.text} className="flex items-center gap-3 animate-fade-in-up opacity-0-init" style={{animationDelay:`${0.4+i*0.1}s`}}>
                  <div className="w-9 h-9 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center shrink-0">
                    <h.icon className="h-4 w-4 text-indigo-400" />
                  </div>
                  <span className="text-slate-200 text-sm">{h.text}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Trust strip */}
          <div className="animate-fade-in-up delay-700 opacity-0-init">
            <div className="inline-flex items-center gap-3 bg-slate-900/60 backdrop-blur-sm border border-slate-700/50 rounded-2xl px-4 py-3">
              <div className="flex -space-x-2">
                {['bg-indigo-500','bg-violet-500','bg-emerald-500'].map((c,i) => (
                  <div key={i} className={`w-7 h-7 rounded-full ${c} border-2 border-slate-900 flex items-center justify-center text-xs font-bold text-white`}>
                    {['R','S','A'][i]}
                  </div>
                ))}
              </div>
              <div>
                <div className="text-xs font-semibold text-slate-200">500+ businesses onboarded</div>
                <div className="flex gap-0.5 mt-0.5">{[...Array(5)].map((_,i)=><span key={i} className="text-amber-400 text-xs">★</span>)}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ===== RIGHT PANEL — Form ===== */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-8 relative overflow-y-auto">
        <div className="absolute top-0 right-0 w-72 h-72 bg-indigo-600/8 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-60 h-60 bg-violet-600/8 rounded-full blur-[80px] pointer-events-none" />

        <div className="w-full max-w-lg relative z-10">
          {/* Mobile logo */}
          <div className="flex flex-col items-center mb-6 lg:hidden">
            <div className="bg-indigo-600 p-3 rounded-2xl shadow-2xl shadow-indigo-500/40 mb-3 animate-pulse-glow">
              <Car className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-xl font-black text-slate-50">Miracrest Group</h1>
          </div>

          {/* Header */}
          <div className="mb-6 animate-fade-in-up">
            <h1 className="text-2xl font-black text-slate-50 mb-1">
              {currentStep === 1 ? 'Create your account' : 'Setup your business'}
            </h1>
            <p className="text-slate-400 text-sm">
              {currentStep === 1 ? 'Start managing your travel business today' : 'Almost done! Just a few more details.'}
            </p>
          </div>

          {/* Stepper (top of form) */}
          <div className="flex items-center gap-3 mb-6 animate-fade-in-up delay-100 opacity-0-init">
            {[{n:1,label:'Account'},{n:2,label:'Business'}].map((s,idx,arr)=>(
              <React.Fragment key={s.n}>
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs transition-all duration-300 ${
                    currentStep > s.n ? 'bg-emerald-500 text-white' : currentStep === s.n ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-500 border border-slate-700'
                  }`}>
                    {currentStep > s.n ? <CheckCircle className="h-4 w-4" /> : s.n}
                  </div>
                  <span className={`text-xs font-semibold ${currentStep >= s.n ? 'text-slate-300' : 'text-slate-600'}`}>{s.label}</span>
                </div>
                {idx < arr.length-1 && <div className={`flex-1 h-0.5 rounded-full transition-all duration-500 ${currentStep > 1 ? 'bg-indigo-500' : 'bg-slate-800'}`} />}
              </React.Fragment>
            ))}
          </div>

          {/* ===== STEP 1 ===== */}
          {currentStep === 1 && (
            <div className="bg-slate-900/70 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-7 shadow-2xl shadow-black/40 animate-fade-in-up delay-200 opacity-0-init">
              <form onSubmit={handleStep1Submit} className="space-y-4">
                {/* Full Name — full width */}
                <div className="space-y-1.5">
                  <label className={labelCls}>Your Name <span className="text-rose-400">*</span></label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                    <input type="text" name="name" value={step1.name} onChange={handleStep1Change} placeholder="Full Name" className={inputIconCls} />
                  </div>
                </div>

                {/* Email + Phone — 2 cols */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className={labelCls}>Email Address <span className="text-rose-400">*</span></label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                      <input type="email" name="email" value={step1.email} onChange={handleStep1Change} placeholder="you@example.com" className={inputIconCls} />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className={labelCls}>Phone Number <span className="text-rose-400">*</span></label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                      <input type="tel" name="phone" value={step1.phone} onChange={handleStep1Change} placeholder="10-digit phone" maxLength={10} className={inputIconCls} />
                    </div>
                  </div>
                </div>

                {/* Password + Confirm — 2 cols */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className={labelCls}>Password <span className="text-rose-400">*</span></label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                      <input type={showPassword ? 'text' : 'password'} name="password" value={step1.password} onChange={handleStep1Change} placeholder="Min 6 characters"
                        className="w-full bg-slate-800/60 border border-slate-700 focus:border-indigo-500 outline-none rounded-xl pl-10 pr-10 py-2.5 text-slate-100 placeholder:text-slate-500 text-sm transition" />
                      <button type="button" onClick={() => setShowPassword(s=>!s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition">
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className={labelCls}>Re-enter Password <span className="text-rose-400">*</span></label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                      <input type={showConfirm ? 'text' : 'password'} name="confirmPassword" value={step1.confirmPassword} onChange={handleStep1Change} placeholder="Repeat password"
                        className="w-full bg-slate-800/60 border border-slate-700 focus:border-indigo-500 outline-none rounded-xl pl-10 pr-10 py-2.5 text-slate-100 placeholder:text-slate-500 text-sm transition" />
                      <button type="button" onClick={() => setShowConfirm(s=>!s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition">
                        {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                {error && (
                  <div className="flex items-center gap-2 bg-rose-500/10 border border-rose-500/30 text-rose-400 rounded-xl px-4 py-2.5 text-sm">
                    <AlertCircle className="h-4 w-4 shrink-0" /><span>{error}</span>
                  </div>
                )}

                <button type="submit" disabled={loading}
                  className="w-full py-3 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 disabled:opacity-50 text-white font-bold rounded-xl transition-all shadow-xl shadow-indigo-500/25 flex items-center justify-center gap-2 text-sm">
                  {loading ? <span className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><span>CREATE ACCOUNT</span><ArrowRight className="h-4 w-4" /></>}
                </button>

                <div className="text-center space-y-1 pt-1">
                  <p className="text-xs text-slate-500">
                    By creating an account you agree to our{' '}
                    <a href="#" className="text-indigo-400 hover:text-indigo-300">Privacy Policy</a> and{' '}
                    <a href="#" className="text-indigo-400 hover:text-indigo-300">Terms of Use</a>
                  </p>
                  <p className="text-sm text-slate-500">
                    Already have an account?{' '}
                    <button onClick={() => onNavigate('login')} className="text-indigo-400 hover:text-indigo-300 font-semibold transition">Sign in</button>
                  </p>
                </div>
              </form>
            </div>
          )}

          {/* ===== STEP 2 ===== */}
          {currentStep === 2 && (
            <div className="bg-slate-900/70 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-7 shadow-2xl shadow-black/40 animate-fade-in-up delay-200 opacity-0-init">
              <form onSubmit={handleStep2Submit} className="space-y-4">
                {/* Phone OTP */}
                <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-3.5">
                  <p className="text-xs text-slate-300 font-medium mb-2">
                    Phone: <span className="text-indigo-400 font-mono">{step1.phone}</span>
                  </p>
                  <div className="flex gap-2">
                    <input type="text" value={verificationCode} onChange={e=>setVerificationCode(e.target.value)}
                      placeholder="Verification Code" maxLength={6}
                      className="flex-1 bg-slate-900 border border-slate-700 focus:border-indigo-500 outline-none rounded-xl px-4 py-2 text-slate-100 placeholder:text-slate-500 text-sm transition font-mono tracking-widest" />
                    <button type="button" onClick={() => setVerificationSent(true)} className="shrink-0 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition">
                      {verificationSent ? 'RESEND' : 'VERIFY'}
                    </button>
                  </div>
                  {verificationSent && (
                    <p className="text-xs text-emerald-400 flex items-center gap-1.5 mt-2">
                      <CheckCircle className="h-3.5 w-3.5" />Code sent to {step1.phone}
                    </p>
                  )}
                </div>

                {/* Business Name + Type */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className={labelCls}>Business Name <span className="text-rose-400">*</span></label>
                    <div className="relative">
                      <Building className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                      <input type="text" name="businessName" value={step2.businessName} onChange={handleStep2Change} placeholder="e.g. City Cabs" className={inputIconCls} />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className={labelCls}>Business Type <span className="text-rose-400">*</span></label>
                    <div className="relative">
                      <button type="button" onClick={() => setBusinessTypeOpen(s=>!s)}
                        className="w-full bg-slate-800/60 border border-slate-700 rounded-xl px-4 py-2.5 text-left flex items-center justify-between text-sm transition">
                        <span className={step2.businessType ? 'text-slate-100' : 'text-slate-500'}>{step2.businessType || 'Select type...'}</span>
                        <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${businessTypeOpen ? 'rotate-180' : ''}`} />
                      </button>
                      {businessTypeOpen && (
                        <div className="absolute z-30 w-full mt-1 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden">
                          {BUSINESS_TYPES.map((bt, idx) => (
                            idx === 0 ? (
                              <button key={bt} type="button" onClick={() => { setStep2(p=>({...p,businessType:bt})); setBusinessTypeOpen(false); }}
                                className="w-full text-left px-4 py-2.5 text-sm text-slate-300 hover:bg-indigo-500/10 hover:text-indigo-300 transition flex items-center gap-2">
                                <CheckCircle className="h-3.5 w-3.5 text-emerald-400" />
                                {bt}
                              </button>
                            ) : (
                              <div key={bt}
                                className="w-full text-left px-4 py-2.5 text-sm text-slate-600 flex items-center gap-2 cursor-not-allowed select-none">
                                <span className="text-[9px] font-bold bg-slate-700 text-slate-500 rounded px-1.5 py-0.5 uppercase tracking-wide">Soon</span>
                                {bt}
                              </div>
                            )
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Address */}
                <div className="space-y-1.5">
                  <label className={labelCls}>Address <span className="text-rose-400">*</span></label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                    <textarea name="address" value={step2.address} onChange={handleStep2Change} placeholder="Full business address..." rows={2}
                      className="w-full bg-slate-800/60 border border-slate-700 focus:border-indigo-500 outline-none rounded-xl pl-10 pr-4 py-2.5 text-slate-100 placeholder:text-slate-500 transition resize-none text-sm" />
                  </div>
                </div>

                {/* Pincode + City */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className={labelCls}>Pincode</label>
                    <div className="relative">
                      <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                      <input type="text" name="pincode" value={step2.pincode} onChange={handleStep2Change} placeholder="e.g. 411001" maxLength={6} className={inputIconCls} />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className={labelCls}>City <span className="text-rose-400">*</span></label>
                    <div className="relative">
                      <button type="button" onClick={() => setCityOpen(s=>!s)}
                        className="w-full bg-slate-800/60 border border-slate-700 rounded-xl px-4 py-2.5 text-left flex items-center justify-between text-sm">
                        <span className={step2.city ? 'text-slate-100' : 'text-slate-500'}>{step2.city || 'Select city...'}</span>
                        <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${cityOpen ? 'rotate-180' : ''}`} />
                      </button>
                      {cityOpen && (
                        <div className="absolute z-30 w-full mt-1 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-y-auto max-h-44">
                          {CITIES.map(c => (
                            <button key={c} type="button" onClick={() => { setStep2(p=>({...p,city:c})); setCityOpen(false); }}
                              className="w-full text-left px-4 py-2.5 text-sm text-slate-300 hover:bg-indigo-500/10 hover:text-indigo-300 transition">{c}</button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* GSTIN + Logo Upload — Optional */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* GSTIN */}
                  <div className="space-y-1.5">
                    <label className={labelCls}>
                      GSTIN <span className="text-slate-500 font-normal normal-case tracking-normal">(optional)</span>
                    </label>
                    <div className="relative">
                      <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                      <input
                        type="text"
                        name="gstin"
                        value={step2.gstin}
                        onChange={handleStep2Change}
                        placeholder="e.g. 27AACCO1234C1Z5"
                        maxLength={15}
                        className={`${inputIconCls} uppercase`}
                      />
                    </div>
                    {step2.gstin && step2.gstin.length > 0 && step2.gstin.length < 15 && (
                      <p className="text-xs text-amber-400 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" /> GSTIN should be 15 characters
                      </p>
                    )}
                    {step2.gstin && step2.gstin.length === 15 && (
                      <p className="text-xs text-emerald-400 flex items-center gap-1">
                        <CheckCircle className="h-3 w-3" /> Looks good!
                      </p>
                    )}
                  </div>

                  {/* Logo Upload */}
                  <div className="space-y-1.5">
                    <label className={labelCls}>
                      Business Logo <span className="text-slate-500 font-normal normal-case tracking-normal">(optional)</span>
                    </label>
                    <input
                      ref={logoInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleLogoChange}
                      className="hidden"
                      id="logo-upload"
                    />
                    {logoPreview ? (
                      <div className="relative flex items-center gap-3 bg-slate-800/60 border border-indigo-500/50 rounded-xl px-3 py-2">
                        <img src={logoPreview} alt="Logo preview" className="h-10 w-10 rounded-lg object-contain bg-white/5 border border-slate-700" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-slate-200 font-medium truncate">{logoFile?.name}</p>
                          <p className="text-xs text-slate-500">{(logoFile?.size / 1024).toFixed(0)} KB</p>
                        </div>
                        <button
                          type="button"
                          onClick={handleLogoRemove}
                          className="p-1 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition"
                          title="Remove logo"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <label
                        htmlFor="logo-upload"
                        className="flex items-center gap-3 w-full bg-slate-800/60 border border-dashed border-slate-600 hover:border-indigo-500 hover:bg-indigo-500/5 rounded-xl px-4 py-3 cursor-pointer transition group"
                      >
                        <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center group-hover:bg-indigo-500/20 transition shrink-0">
                          <Upload className="h-4 w-4 text-indigo-400" />
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-slate-300 group-hover:text-indigo-300 transition">Click to upload logo</p>
                          <p className="text-[10px] text-slate-500 mt-0.5">PNG, JPG, SVG • Max 2MB</p>
                        </div>
                      </label>
                    )}
                  </div>
                </div>

                {/* Referral */}
                <div className="bg-slate-800/40 border border-slate-700/40 rounded-xl p-3 space-y-2">
                  <p className="text-xs font-semibold text-slate-300">Have you been referred? <span className="text-slate-500 font-normal">(optional)</span></p>
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                    <input type="email" name="referral" value={step2.referral} onChange={handleStep2Change} placeholder="Referrer email address"
                      className="w-full bg-slate-900 border border-slate-700 focus:border-indigo-500 outline-none rounded-xl pl-10 pr-4 py-2.5 text-slate-100 placeholder:text-slate-500 text-sm transition" />
                  </div>
                </div>

                {error && (
                  <div className="flex items-center gap-2 bg-rose-500/10 border border-rose-500/30 text-rose-400 rounded-xl px-4 py-2.5 text-sm">
                    <AlertCircle className="h-4 w-4 shrink-0" /><span>{error}</span>
                  </div>
                )}

                <div className="flex gap-3">
                  <button type="button" onClick={() => { setCurrentStep(1); setError(''); }}
                    className="px-4 py-2.5 text-sm font-semibold text-slate-400 hover:text-slate-200 border border-slate-700 hover:border-slate-600 rounded-xl transition">
                    ← Back
                  </button>
                  <button type="submit" disabled={loading}
                    className="flex-1 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 disabled:opacity-50 text-white font-bold rounded-xl transition-all shadow-xl shadow-indigo-500/25 flex items-center justify-center gap-2 text-sm">
                    {loading
                      ? <span className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      : <><CheckCircle className="h-4 w-4" /><span>SETUP MY BUSINESS</span></>}
                  </button>
                </div>
              </form>
            </div>
          )}

          <p className="text-center text-xs text-slate-600 mt-4">
            <button onClick={() => onNavigate('landing')} className="hover:text-slate-400 transition">← Back to Home</button>
          </p>
        </div>
      </div>
    </div>
  );
}
