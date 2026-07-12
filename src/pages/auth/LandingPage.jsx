import React, { useState, useEffect, useRef } from 'react';
import { Car, Star, Shield, Zap, Globe, CheckCircle, ArrowRight, Menu, X, TrendingUp, Clock, Users } from 'lucide-react';

const features = [
  { icon: Zap,        title: 'Smart Booking',       desc: 'Real-time scheduling & automated alerts for every trip.',        color: 'indigo' },
  { icon: Shield,     title: 'Role-Based Access',    desc: 'Enterprise-grade security. Control what each member sees.',       color: 'emerald' },
  { icon: Globe,      title: 'Fleet Overview',       desc: 'Every vehicle, driver and trip on one powerful dashboard.',       color: 'sky' },
  { icon: Star,       title: 'GST Billing',          desc: 'Generate professional invoices instantly, GST compliant.',        color: 'amber' },
  { icon: TrendingUp, title: 'Revenue Analytics',    desc: 'Visual reports on earnings, expenses, and growth trends.',        color: 'violet' },
  { icon: Users,      title: 'Driver Management',    desc: 'Track salaries, assign trips, monitor driver performance.',      color: 'rose' },
];

const colorMap = {
  indigo:  { bg: 'bg-indigo-500/10',  border: 'border-indigo-500/20',  icon: 'text-indigo-400',  glow: 'hover:shadow-indigo-500/20' },
  emerald: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', icon: 'text-emerald-400', glow: 'hover:shadow-emerald-500/20' },
  sky:     { bg: 'bg-sky-500/10',     border: 'border-sky-500/20',     icon: 'text-sky-400',     glow: 'hover:shadow-sky-500/20' },
  amber:   { bg: 'bg-amber-500/10',   border: 'border-amber-500/20',   icon: 'text-amber-400',   glow: 'hover:shadow-amber-500/20' },
  violet:  { bg: 'bg-violet-500/10',  border: 'border-violet-500/20',  icon: 'text-violet-400',  glow: 'hover:shadow-violet-500/20' },
  rose:    { bg: 'bg-rose-500/10',    border: 'border-rose-500/20',    icon: 'text-rose-400',    glow: 'hover:shadow-rose-500/20' },
};

const stats = [
  { value: '10K+',  label: 'Bookings Managed', icon: TrendingUp },
  { value: '500+',  label: 'Businesses',        icon: Users },
  { value: '99.9%', label: 'Uptime',            icon: Shield },
  { value: '24/7',  label: 'Support',           icon: Clock },
];

// Floating stat badge component
function FloatingBadge({ className, children }) {
  return (
    <div className={`absolute bg-slate-900/90 backdrop-blur-sm border border-slate-700/60 rounded-2xl px-4 py-2.5 shadow-2xl shadow-black/40 ${className}`}>
      {children}
    </div>
  );
}

// Animated counter hook
function useCountUp(target, duration = 2000) {
  const [count, setCount] = useState(0);
  const ref = useRef(false);
  useEffect(() => {
    if (ref.current) return;
    ref.current = true;
    const steps = 40;
    const increment = target / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= target) { setCount(target); clearInterval(timer); }
      else setCount(Math.floor(current));
    }, duration / steps);
    return () => clearInterval(timer);
  }, [target, duration]);
  return count;
}

export default function LandingPage({ onNavigate }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 font-sans overflow-x-hidden">
      {/* ===== ANIMATED BACKGROUND ===== */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-60 -left-60 w-[700px] h-[700px] bg-indigo-600/20 rounded-full blur-[140px] animate-pulse" />
        <div className="absolute top-1/2 -right-60 w-[500px] h-[500px] bg-violet-600/15 rounded-full blur-[120px] animate-pulse" style={{animationDelay:'1.5s'}} />
        <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] bg-sky-600/10 rounded-full blur-[100px] animate-pulse" style={{animationDelay:'3s'}} />
        {/* Grid overlay */}
        <div className="absolute inset-0 opacity-[0.03]" style={{backgroundImage:'linear-gradient(#818cf8 1px,transparent 1px),linear-gradient(90deg,#818cf8 1px,transparent 1px)',backgroundSize:'60px 60px'}} />
      </div>

      {/* ===== NAVBAR ===== */}
      <header className={`relative z-50 sticky top-0 transition-all duration-300 ${scrolled ? 'bg-slate-900/70 backdrop-blur-xl border-b border-slate-800/60 shadow-2xl shadow-black/20' : 'bg-transparent'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 animate-fade-in-down">
            <div className="bg-indigo-600 p-2 rounded-xl shadow-lg shadow-indigo-500/40 animate-pulse-glow">
              <Car className="h-5 w-5 text-white" />
            </div>
            <div>
              <span className="font-extrabold text-slate-50 text-lg tracking-tight">Miracrest Group</span>
              <span className="text-[10px] text-indigo-400 font-semibold tracking-widest uppercase block leading-none">Rental System</span>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-8">
            {['Features', 'Pricing', 'Contact'].map((item, i) => (
              <a key={item} href={`#${item.toLowerCase()}`} style={{animationDelay:`${i*0.1}s`}}
                className="text-sm text-slate-400 hover:text-slate-100 transition animate-fade-in-down opacity-0-init">{item}</a>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-3 animate-fade-in-down delay-300">
            <button onClick={() => onNavigate('login')} className="px-4 py-2 text-sm font-semibold text-slate-300 hover:text-white border border-slate-700 hover:border-slate-500 hover:bg-slate-800/40 rounded-xl transition">
              Log In
            </button>
            <button onClick={() => onNavigate('register')}
              className="px-4 py-2 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl transition shadow-lg shadow-indigo-500/30 flex items-center gap-2 group">
              Get Started <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>

          <button onClick={() => setMobileMenuOpen(s => !s)} className="md:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition">
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-800 bg-slate-900/95 backdrop-blur-xl px-4 py-4 space-y-3">
            {['features', 'pricing', 'contact'].map(s => (
              <a key={s} href={`#${s}`} className="block text-sm text-slate-400 hover:text-white py-2 capitalize">{s}</a>
            ))}
            <div className="pt-2 flex flex-col gap-2">
              <button onClick={() => onNavigate('login')} className="w-full py-2.5 text-sm font-semibold text-slate-300 border border-slate-700 rounded-xl">Log In</button>
              <button onClick={() => onNavigate('register')} className="w-full py-2.5 text-sm font-bold text-white bg-indigo-600 rounded-xl">Get Started Free</button>
            </div>
          </div>
        )}
      </header>

      {/* ===== HERO SECTION ===== */}
      <section className="relative z-10 pt-16 pb-10 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">

            {/* Left: Text */}
            <div>
              {/* Animated badge */}
              <div className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/25 rounded-full px-4 py-1.5 mb-7 animate-fade-in-up">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <div className="w-2 h-2 rounded-full bg-emerald-400 absolute" />
                <span className="text-sm text-indigo-300 font-medium">Trusted by 500+ Travel Businesses</span>
              </div>

              <h1 className="text-4xl sm:text-5xl font-black text-slate-50 leading-tight tracking-tight mb-5 animate-fade-in-up delay-100 opacity-0-init">
                Manage Your Fleet
                <span className="block shimmer-text mt-1">Effortlessly.</span>
              </h1>

              <p className="text-lg text-slate-400 mb-8 leading-relaxed animate-fade-in-up delay-200 opacity-0-init">
                All-in-one platform for car rentals, tours & travel agencies. Bookings, billing, fleet management — all under one roof.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 mb-8 animate-fade-in-up delay-300 opacity-0-init">
                <button onClick={() => onNavigate('register')}
                  className="group px-7 py-3.5 text-base font-bold text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 rounded-2xl transition-all duration-300 shadow-2xl shadow-indigo-500/30 flex items-center justify-center gap-2">
                  Start Free Today <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </button>
                <button onClick={() => onNavigate('login')}
                  className="px-7 py-3.5 text-base font-semibold text-slate-300 hover:text-white border border-slate-700 hover:border-indigo-500/60 hover:bg-indigo-500/5 rounded-2xl transition-all duration-300">
                  Already have an account?
                </button>
              </div>

              <div className="flex flex-wrap gap-4 text-sm text-slate-500 animate-fade-in-up delay-400 opacity-0-init">
                {['No credit card required', 'Setup in 2 minutes', 'Free 7-day trial'].map(txt => (
                  <span key={txt} className="flex items-center gap-1.5">
                    <CheckCircle className="h-4 w-4 text-emerald-500" />{txt}
                  </span>
                ))}
              </div>
            </div>

            {/* Right: Hero image with floating badges */}
            <div className="relative animate-slide-right opacity-0-init hidden lg:block">
              {/* Glow behind image */}
              <div className="absolute inset-0 bg-indigo-500/20 rounded-3xl blur-3xl scale-95" />

              <div className="relative rounded-3xl overflow-hidden border border-slate-700/50 shadow-2xl shadow-black/60 animate-float">
                <img src="/hero-dashboard.png" alt="Miracrest Group Dashboard" className="w-full h-auto object-cover" />
                {/* Gradient overlay at bottom */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#020617]/60 via-transparent to-transparent pointer-events-none" />
              </div>

              {/* Floating stat badges */}
              <FloatingBadge className="-bottom-4 -left-6 animate-float-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                    <TrendingUp className="h-4 w-4 text-emerald-400" />
                  </div>
                  <div>
                    <div className="text-xs text-slate-500">Today's Revenue</div>
                    <div className="text-sm font-bold text-emerald-400">₹48,200</div>
                  </div>
                </div>
              </FloatingBadge>

              <FloatingBadge className="-top-4 -right-4 animate-float">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center">
                    <Car className="h-4 w-4 text-indigo-400" />
                  </div>
                  <div>
                    <div className="text-xs text-slate-500">Active Trips</div>
                    <div className="text-sm font-bold text-indigo-400">24 Live</div>
                  </div>
                </div>
              </FloatingBadge>

              <FloatingBadge className="top-1/2 -left-8 -translate-y-1/2">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  <span className="text-xs font-semibold text-emerald-400">System Online</span>
                </div>
              </FloatingBadge>
            </div>
          </div>
        </div>
      </section>

      {/* ===== DASHBOARD MOCKUP (Mobile / wider preview) ===== */}
      <section className="relative z-10 px-4 sm:px-6 pb-16">
        <div className="max-w-5xl mx-auto">
          <div className="lg:hidden relative rounded-3xl overflow-hidden border border-slate-700/50 shadow-2xl shadow-black/60 animate-float">
            <img src="/hero-dashboard.png" alt="Dashboard" className="w-full h-auto" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#020617]/80 via-transparent to-transparent" />
          </div>
          {/* Live stats strip */}
          <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
            {stats.map((s, i) => (
              <div key={s.label} className={`bg-slate-900/60 border border-slate-700/50 rounded-2xl p-4 text-center animate-fade-in-up opacity-0-init`} style={{animationDelay:`${i*0.1+0.5}s`}}>
                <s.icon className="h-5 w-5 text-indigo-400 mx-auto mb-2" />
                <div className="text-2xl font-black text-slate-50">{s.value}</div>
                <div className="text-xs text-slate-500 mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== FEATURES ===== */}
      <section id="features" className="relative z-10 py-20 px-4 sm:px-6 border-t border-slate-800/40">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-black text-slate-50 mb-4 animate-fade-in-up">Everything to Run Your Business</h2>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto animate-fade-in-up delay-100 opacity-0-init">
              A complete toolkit built specifically for travel entrepreneurs. No more juggling between multiple apps.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f, i) => {
              const c = colorMap[f.color];
              return (
                <div key={f.title} className={`group p-6 rounded-2xl border ${c.border} ${c.bg} hover:shadow-xl ${c.glow} transition-all duration-300 hover:-translate-y-1 cursor-default animate-fade-in-up opacity-0-init`}
                  style={{animationDelay:`${i*0.1}s`}}>
                  <div className={`w-11 h-11 rounded-xl ${c.bg} border ${c.border} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                    <f.icon className={`h-5 w-5 ${c.icon}`} />
                  </div>
                  <h3 className="text-base font-bold text-slate-100 mb-2">{f.title}</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">{f.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ===== CITY IMAGE BANNER ===== */}
      <section className="relative z-10 py-16 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="relative rounded-3xl overflow-hidden shadow-2xl shadow-black/60">
            <img src="/login-bg.png" alt="Indian city highways at night" className="w-full h-72 sm:h-96 object-cover" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#020617]/90 via-[#020617]/50 to-transparent" />
            <div className="absolute inset-0 flex items-center px-10 sm:px-16">
              <div className="max-w-lg">
                <h3 className="text-2xl sm:text-3xl font-black text-white mb-4 leading-tight">
                  Built for the Roads of India
                </h3>
                <p className="text-slate-300 text-base mb-6">
                  From Mumbai to Nashik, manage every trip, every driver, and every rupee — all from one place.
                </p>
                <button onClick={() => onNavigate('register')}
                  className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition shadow-xl shadow-indigo-500/30 flex items-center gap-2 group">
                  Get Started <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== CTA BANNER ===== */}
      <section id="pricing" className="relative z-10 py-20 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto text-center bg-gradient-to-br from-indigo-600/20 via-violet-600/10 to-slate-900 border border-indigo-500/25 rounded-3xl p-12 shadow-2xl shadow-indigo-500/10">
          <h2 className="text-3xl sm:text-4xl font-black text-slate-50 mb-4">Ready to Transform Your Business?</h2>
          <p className="text-slate-400 mb-8 text-lg">
            Join hundreds of travel businesses already using Miracrest Group to streamline their operations.
          </p>
          <button onClick={() => onNavigate('register')}
            className="px-10 py-4 text-base font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-2xl transition shadow-2xl shadow-indigo-500/40 flex items-center gap-2 mx-auto group">
            Create Your Free Account <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer id="contact" className="relative z-10 border-t border-slate-800 py-10 px-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-slate-500">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-600 p-1.5 rounded-lg">
              <Car className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold text-slate-400">Miracrest Group Rental System</span>
          </div>
          <span>© 2026 Miracrest Group. All rights reserved.</span>
          <div className="flex items-center gap-4">
            <a href="#" className="hover:text-slate-300 transition">Privacy Policy</a>
            <a href="#" className="hover:text-slate-300 transition">Terms of Use</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
