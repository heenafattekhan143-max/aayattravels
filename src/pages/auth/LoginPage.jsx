import React, { useState } from 'react';
import { Car, Eye, EyeOff, ArrowRight, Mail, Lock, AlertCircle, CheckCircle, TrendingUp, Users } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const highlights = [
  { icon: TrendingUp, text: 'Real-time booking & revenue analytics' },
  { icon: Car,        text: 'Complete fleet & driver management' },
  { icon: Users,      text: 'Role-based access for your team' },
  { icon: CheckCircle,text: 'GST-compliant billing in one click' },
];

const demoCredentials = [
  { role: 'Super Admin', email: 'admin@purvitravels.com',  password: 'admin123',  color: 'indigo' },
  { role: 'Vendor',      email: 'vendor@purvitravels.com', password: 'vendor123', color: 'emerald' },
  { role: 'Staff',       email: 'staff@purvitravels.com',  password: 'staff123',  color: 'sky' },
];

export default function LoginPage({ onNavigate }) {
  const { login } = useAuth();
  const [formData, setFormData] = useState({ identifier: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  const handleChange = (e) => { setFormData(p => ({ ...p, [e.target.name]: e.target.value })); setError(''); };

  const handleResetSubmit = async (e) => {
    e.preventDefault();
    if (!formData.identifier) { setError('Please enter your email or mobile number.'); return; }
    setLoading(true);
    await new Promise(r => setTimeout(r, 800));
    setLoading(false);
    setResetSent(true);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.identifier || !formData.password) { setError('Please fill in all fields.'); return; }
    setLoading(true);
    await new Promise(r => setTimeout(r, 700));
    const result = await login(formData.identifier, formData.password);
    setLoading(false);
    if (!result.success) setError(result.error);
  };

  return (
    <div className="min-h-screen bg-[#020617] flex font-sans overflow-hidden">

      {/* ===== LEFT PANEL — Image + branding ===== */}
      <div className="hidden lg:flex flex-col w-[52%] relative overflow-hidden">
        {/* City highway image */}
        <img src="/login-bg.png" alt="City highways at night" className="absolute inset-0 w-full h-full object-cover" />

        {/* Dark overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#020617]/85 via-indigo-950/60 to-violet-950/50" />

        {/* Animated top-left blob */}
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-indigo-600/30 rounded-full blur-[100px] animate-pulse" />
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-violet-600/20 rounded-full blur-[80px] animate-pulse" style={{animationDelay:'2s'}} />

        {/* Content */}
        <div className="relative z-10 flex flex-col h-full p-12">
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

          {/* Main tagline */}
          <div className="flex-1 flex flex-col justify-center">
            <h2 className="text-4xl font-black text-white leading-tight mb-4 animate-fade-in-up delay-100 opacity-0-init">
              Your Business,<br />
              <span className="shimmer-text">Fully Under Control.</span>
            </h2>
            <p className="text-slate-300 text-lg mb-10 leading-relaxed animate-fade-in-up delay-200 opacity-0-init">
              Manage bookings, fleet, drivers, and billing from a single premium platform.
            </p>

            {/* Highlights */}
            <ul className="space-y-4">
              {highlights.map((h, i) => (
                <li key={h.text} className={`flex items-center gap-3 animate-fade-in-up opacity-0-init`} style={{animationDelay:`${0.3+i*0.1}s`}}>
                  <div className="w-9 h-9 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center shrink-0">
                    <h.icon className="h-4 w-4 text-indigo-400" />
                  </div>
                  <span className="text-slate-200 text-sm">{h.text}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Bottom testimonial chip */}
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
                <div className="flex gap-0.5 mt-0.5">
                  {[...Array(5)].map((_,i) => <span key={i} className="text-amber-400 text-xs">★</span>)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ===== RIGHT PANEL — Login form ===== */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-10 relative">
        {/* Background blobs */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-600/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-60 h-60 bg-violet-600/8 rounded-full blur-[80px] pointer-events-none" />

        <div className="w-full max-w-md relative z-10">
          {/* Mobile logo */}
          <div className="flex flex-col items-center mb-8 lg:hidden">
            <div className="bg-indigo-600 p-3 rounded-2xl shadow-2xl shadow-indigo-500/40 mb-3 animate-pulse-glow">
              <Car className="h-7 w-7 text-white" />
            </div>
            <h1 className="text-2xl font-black text-slate-50">Miracrest Group</h1>
            <p className="text-slate-400 text-sm mt-1">Rental System</p>
          </div>

          {/* Header */}
          <div className="mb-8 animate-fade-in-up">
            {isForgotPassword ? (
              <>
                <h1 className="text-3xl font-black text-slate-50 mb-2">Reset Password</h1>
                <p className="text-slate-400">Enter your email to receive a reset link</p>
              </>
            ) : (
              <>
                <h1 className="text-3xl font-black text-slate-50 mb-2">Welcome back 👋</h1>
                <p className="text-slate-400">Sign in to your account to continue</p>
              </>
            )}
          </div>

          {/* Card */}
          <div className="bg-slate-900/70 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-8 shadow-2xl shadow-black/40 animate-fade-in-up delay-100 opacity-0-init">
            {resetSent ? (
              <div className="text-center py-6">
                <div className="mx-auto w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mb-6">
                  <CheckCircle className="h-8 w-8" />
                </div>
                <h2 className="text-xl font-bold text-slate-100 mb-2">Check your email</h2>
                <p className="text-slate-400 text-sm mb-8">
                  We've sent a password reset link to <span className="font-medium text-slate-200">{formData.identifier}</span>.
                </p>
                <button
                  onClick={() => { setIsForgotPassword(false); setResetSent(false); setFormData({ identifier: '', password: '' }); }}
                  className="w-full py-3.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl transition"
                >
                  Return to Login
                </button>
              </div>
            ) : (
            <form onSubmit={isForgotPassword ? handleResetSubmit : handleSubmit} className="space-y-5">
              {/* Email */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-300">Email or Mobile Number</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <input type="text" name="identifier" value={formData.identifier} onChange={handleChange}
                    placeholder="you@example.com or 9876543210"
                    className="w-full bg-slate-800/60 border border-slate-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 outline-none rounded-xl pl-11 pr-4 py-3 text-slate-100 placeholder:text-slate-500 transition" />
                </div>
              </div>

              {/* Password */}
              {!isForgotPassword && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-semibold text-slate-300">Password</label>
                    <button type="button" onClick={() => { setIsForgotPassword(true); setError(''); }} className="text-xs text-indigo-400 hover:text-indigo-300 transition">Forgot password?</button>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                    <input type={showPassword ? 'text' : 'password'} name="password" value={formData.password} onChange={handleChange}
                      placeholder="Enter your password"
                      className="w-full bg-slate-800/60 border border-slate-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 outline-none rounded-xl pl-11 pr-11 py-3 text-slate-100 placeholder:text-slate-500 transition" />
                    <button type="button" onClick={() => setShowPassword(s => !s)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition">
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              )}

              {/* Error */}
              {error && (
                <div className="flex items-center gap-2 bg-rose-500/10 border border-rose-500/30 text-rose-400 rounded-xl px-4 py-3 text-sm">
                  <AlertCircle className="h-4 w-4 shrink-0" /><span>{error}</span>
                </div>
              )}

              {/* Submit */}
              <button type="submit" disabled={loading}
                className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 disabled:opacity-50 text-white font-bold rounded-xl transition-all duration-300 shadow-xl shadow-indigo-500/25 flex items-center justify-center gap-2">
                {loading
                  ? <span className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  : isForgotPassword 
                    ? <>Send Reset Link <ArrowRight className="h-4 w-4" /></>
                    : <>Sign In <ArrowRight className="h-4 w-4" /></>
                }
              </button>
            </form>
            )}

            <div className="mt-6 text-center">
              {isForgotPassword ? (
                <button type="button" onClick={() => { setIsForgotPassword(false); setError(''); }} className="text-sm text-slate-400 hover:text-slate-300 transition">
                  ← Back to Login
                </button>
              ) : (
                <p className="text-sm text-slate-500">
                  Don't have an account?{' '}
                  <button onClick={() => onNavigate('register')} className="text-indigo-400 hover:text-indigo-300 font-semibold transition">Create account</button>
                </p>
              )}
            </div>
          </div>

          {/* Demo credentials */}
          <div className="mt-5 bg-slate-900/50 border border-slate-700/40 rounded-2xl p-4 animate-fade-in-up delay-300 opacity-0-init">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Demo Credentials</p>
            <div className="grid grid-cols-3 gap-2">
              {demoCredentials.map(d => (
                <button key={d.role} type="button"
                  onClick={() => setFormData({ identifier: d.email, password: d.password })}
                  className={`text-left px-3 py-2.5 rounded-xl bg-${d.color}-500/5 border border-${d.color}-500/15 hover:border-${d.color}-500/40 hover:bg-${d.color}-500/10 transition group`}>
                  <div className={`text-xs font-bold text-${d.color}-400 mb-0.5`}>{d.role}</div>
                  <div className="text-[10px] text-slate-600 group-hover:text-slate-400 transition font-mono truncate">{d.email.split('@')[0]}</div>
                </button>
              ))}
            </div>
          </div>

          <p className="text-center text-xs text-slate-600 mt-5">
            <button onClick={() => onNavigate('landing')} className="hover:text-slate-400 transition">← Back to Home</button>
          </p>
        </div>
      </div>
    </div>
  );
}
