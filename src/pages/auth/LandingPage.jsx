import React, { useState, useEffect, useRef } from 'react';
import { Car, Star, Shield, Zap, Globe, CheckCircle, ArrowRight, Menu, X, TrendingUp, Clock, Users, FileText, CreditCard, MapPin, Package, Receipt, Building2 } from 'lucide-react';

const features = [
  { icon: Receipt, title: 'GST/ Non GST Bill Generation', desc: 'Generate professional GST-compliant invoices instantly with dynamic billing ledger.', color: 'amber' },
  { icon: Car, title: 'Fleet Management', desc: 'Add and track all your vehicles — details, documents, and trip history in one place.', color: 'sky' },
  { icon: Users, title: 'Customer & Vendor Management', desc: 'Maintain complete records of customers and vendors with transaction histories.', color: 'emerald' },
  { icon: TrendingUp, title: 'Revenue Analytics', desc: 'Visual dashboard with earnings, expenses, party balances and growth insights.', color: 'violet' },
  { icon: CreditCard, title: 'Payment Tracking', desc: 'Record and track all received payments. Know exactly who owes what.', color: 'rose' },
  { icon: Package, title: 'Custom Plans & Packages', desc: 'Create reusable billing packages for local, outstation, and event trips.', color: 'purple' },
];

const colorMap = {
  indigo: { bg: 'bg-indigo-500/10', border: 'border-indigo-500/20', icon: 'text-indigo-400', glow: 'hover:shadow-indigo-500/20' },
  emerald: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', icon: 'text-emerald-400', glow: 'hover:shadow-emerald-500/20' },
  sky: { bg: 'bg-sky-500/10', border: 'border-sky-500/20', icon: 'text-sky-400', glow: 'hover:shadow-sky-500/20' },
  amber: { bg: 'bg-amber-500/10', border: 'border-amber-500/20', icon: 'text-amber-400', glow: 'hover:shadow-amber-500/20' },
  violet: { bg: 'bg-violet-500/10', border: 'border-violet-500/20', icon: 'text-violet-400', glow: 'hover:shadow-violet-500/20' },
  rose: { bg: 'bg-rose-500/10', border: 'border-rose-500/20', icon: 'text-rose-400', glow: 'hover:shadow-rose-500/20' },
  cyan: { bg: 'bg-cyan-500/10', border: 'border-cyan-500/20', icon: 'text-cyan-400', glow: 'hover:shadow-cyan-500/20' },
  purple: { bg: 'bg-purple-500/10', border: 'border-purple-500/20', icon: 'text-purple-400', glow: 'hover:shadow-purple-500/20' },
  teal: { bg: 'bg-teal-500/10', border: 'border-teal-500/20', icon: 'text-teal-400', glow: 'hover:shadow-teal-500/20' },
};

const stats = [
  { value: '10K+', label: 'Bookings Managed', icon: TrendingUp },
  { value: '500+', label: 'Businesses', icon: Users },
  { value: '99.9%', label: 'Uptime', icon: Shield },
  { value: '24/7', label: 'Support', icon: Clock },
];

export const allFeatures = [
  'Smart booking & trip management',
  'GST-compliant bill generation',
  'Dynamic billing ledger (custom rates, km, hours)',
  'Fleet & vehicle management',
  'Customer & vendor management',
  'Driver management & salary tracking',
  'Revenue & expense analytics dashboard',
  'Received payment tracking',
  'Outstation journey tracking',
  'Event billing & quotation generation',
  'Custom plan & package creation',
  'Party transaction history',
  'Multi-user role-based access',
  'Business profile management',
  'Data export (PDF / Excel)',
  'Priority email & chat support',
  '7-day free trial included',
];

export const pricingPlans = [
  {
    id: 'free',
    name: 'Free Trial',
    period: '7 days',
    price: '₹0',
    originalPrice: null,
    badge: 'Start Free',
    highlight: false,
    color: 'sky',
    description: 'Experience the full platform free for 7 days.',
    features: allFeatures,
  },
  {
    id: 'starter',
    name: '1 Month',
    period: 'month',
    price: '₹200',
    originalPrice: null,
    badge: null,
    highlight: false,
    color: 'indigo',
    description: 'Try it out — full access, no commitment.',
    features: allFeatures,
  },
  {
    id: 'growth',
    name: '3 Months',
    period: 'quarter',
    price: '₹500',
    originalPrice: null,
    badge: 'Most Popular',
    highlight: true,
    color: 'violet',
    description: 'Best value for growing travel businesses.',
    features: allFeatures,
  },
  {
    id: 'pro',
    name: '12 Months',
    period: 'year',
    price: '₹800',
    originalPrice: null,
    badge: 'Best Value',
    highlight: false,
    color: 'emerald',
    description: 'Maximum savings for established operators.',
    features: allFeatures,
  },
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
  const [contactForm, setContactForm] = useState({ name: '', email: '', mobile: '' });
  const [contactSubmitted, setContactSubmitted] = useState(false);
  const [contactLoading, setContactLoading] = useState(false);

  const handleContactChange = (e) => setContactForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  const handleContactSubmit = (e) => {
    e.preventDefault();
    setContactLoading(true);
    setTimeout(() => { setContactLoading(false); setContactSubmitted(true); }, 1200);
  };

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className="force-dark min-h-screen bg-[#020617] text-slate-100 font-sans overflow-x-hidden">
      {/* ===== ANIMATED BACKGROUND ===== */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-60 -left-60 w-[700px] h-[700px] bg-indigo-600/20 rounded-full blur-[140px] animate-pulse" />
        <div className="absolute top-1/2 -right-60 w-[500px] h-[500px] bg-violet-600/15 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1.5s' }} />
        <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] bg-sky-600/10 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '3s' }} />
        {/* Grid overlay */}
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'linear-gradient(#818cf8 1px,transparent 1px),linear-gradient(90deg,#818cf8 1px,transparent 1px)', backgroundSize: '60px 60px' }} />
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
              <a key={item} href={`#${item.toLowerCase()}`} style={{ animationDelay: `${i * 0.1}s` }}
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
              <div key={s.label} className={`bg-slate-900/60 border border-slate-700/50 rounded-2xl p-4 text-center animate-fade-in-up opacity-0-init`} style={{ animationDelay: `${i * 0.1 + 0.5}s` }}>
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
                  style={{ animationDelay: `${i * 0.1}s` }}>
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

      {/* ===== PRICING SECTION ===== */}
      <section id="pricing" className="relative z-10 py-24 px-4 sm:px-6 border-t border-slate-800/40">
        <div className="max-w-6xl mx-auto">

          {/* Header */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-violet-500/10 border border-violet-500/25 rounded-full px-4 py-1.5 mb-5">
              <Star className="h-3.5 w-3.5 text-violet-400" />
              <span className="text-sm text-violet-300 font-medium">Simple, transparent pricing</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-50 mb-4">Plans &amp; Pricing</h2>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto">
              Choose the plan that fits your fleet. All plans include a <span className="text-emerald-400 font-semibold">7-day free trial</span> — no credit card required.
            </p>
          </div>

          {/* Cards grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 items-stretch">
            {pricingPlans.map((plan, i) => {
              const colorStyles = {
                sky: { border: 'border-sky-500/30', glow: 'shadow-sky-500/15', badge: 'bg-sky-500/20 text-sky-200 border-sky-500/30', check: 'text-sky-400', btn: 'bg-sky-600 hover:bg-sky-500 shadow-sky-500/30', ring: 'ring-sky-500/30' },
                indigo: { border: 'border-indigo-500/30', glow: 'shadow-indigo-500/15', badge: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30', check: 'text-indigo-400', btn: 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-500/30', ring: 'ring-indigo-500/30' },
                violet: { border: 'border-violet-500/50', glow: 'shadow-violet-500/25', badge: 'bg-violet-500/20 text-violet-200 border-violet-500/30', check: 'text-violet-400', btn: 'bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 shadow-violet-500/40', ring: 'ring-violet-500/50' },
                emerald: { border: 'border-emerald-500/30', glow: 'shadow-emerald-500/15', badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30', check: 'text-emerald-400', btn: 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-500/30', ring: 'ring-emerald-500/30' },
              };
              const c = colorStyles[plan.color];
              return (
                <div
                  key={plan.id}
                  className={`relative flex flex-col rounded-3xl border ${plan.highlight
                    ? `${c.border} bg-gradient-to-b from-slate-800/80 to-slate-900/90 shadow-2xl ${c.glow} ring-1 ${c.ring} scale-[1.03]`
                    : `${c.border} bg-slate-900/60`
                    } p-7 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl animate-fade-in-up opacity-0-init`}
                  style={{ animationDelay: `${i * 0.15}s` }}
                >
                  {/* Popular badge */}
                  {plan.badge && (
                    <div className={`absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full border text-xs font-bold tracking-wide ${c.badge}`}>
                      {plan.badge}
                    </div>
                  )}

                  {/* Plan name & period */}
                  <div className="mb-5">
                    <h3 className="text-xl font-black text-slate-50 mb-1">{plan.name}</h3>
                    <p className="text-sm text-slate-400">{plan.description}</p>
                  </div>

                  {/* Price */}
                  <div className="mb-6">
                    {plan.originalPrice && (
                      <div className="text-sm text-slate-600 line-through mb-0.5">{plan.originalPrice}</div>
                    )}
                    <div className="flex items-end gap-1">
                      <span className="text-4xl font-black text-slate-50">{plan.price}</span>
                      <span className="text-slate-500 text-sm mb-1">/ {plan.period}</span>
                    </div>
                    {plan.originalPrice && (
                      <div className="mt-1 text-xs text-emerald-400 font-semibold">
                        You save {(() => {
                          const orig = parseInt(plan.originalPrice.replace(/[^0-9]/g, ''));
                          const curr = parseInt(plan.price.replace(/[^0-9]/g, ''));
                          return `₹${(orig - curr).toLocaleString()}`;
                        })()}
                      </div>
                    )}
                  </div>

                  {/* CTA Button */}
                  <button
                    onClick={() => onNavigate('register', { plan_id: plan.id })}
                    className={`w-full py-3 rounded-2xl text-sm font-bold text-white shadow-lg transition-all duration-200 mb-7 ${c.btn}`}
                  >
                    Get Started →
                  </button>

                  {/* Divider */}
                  <div className="border-t border-slate-700/50 mb-6" />

                  {/* Features list */}
                  <ul className="space-y-2.5 flex-1">
                    {plan.features.map((feat, fi) => (
                      <li key={fi} className="flex items-start gap-2.5 text-sm text-slate-300">
                        <CheckCircle className={`h-4 w-4 mt-0.5 shrink-0 ${c.check}`} />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>


        </div>
      </section>

      {/* ===== CTA BANNER ===== */}
      <section className="relative z-10 py-20 px-4 sm:px-6">
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

      {/* ===== CONTACT US SECTION ===== */}
      <section id="contact" className="relative z-10 py-24 px-4 sm:px-6 border-t border-slate-800/40">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/25 rounded-full px-4 py-1.5 mb-5">
              <Users className="h-3.5 w-3.5 text-indigo-400" />
              <span className="text-sm text-indigo-300 font-medium">Get in touch</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-50 mb-4">Contact Us</h2>
            <p className="text-slate-400 text-lg max-w-xl mx-auto">
              Have questions or need a demo? Fill in your details and we'll get back to you within 24 hours.
            </p>
          </div>

          {/* Form card */}
          <div className="bg-slate-900/70 border border-slate-700/50 rounded-3xl p-8 sm:p-10 shadow-2xl shadow-black/30 backdrop-blur-sm">
            {contactSubmitted ? (
              <div className="text-center py-10">
                <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center mx-auto mb-5">
                  <CheckCircle className="h-8 w-8 text-emerald-400" />
                </div>
                <h3 className="text-xl font-bold text-slate-50 mb-2">Message Received!</h3>
                <p className="text-slate-400">We'll reach out to <span className="text-indigo-400 font-semibold">{contactForm.email || contactForm.mobile}</span> shortly.</p>
                <button
                  onClick={() => { setContactSubmitted(false); setContactForm({ name: '', email: '', mobile: '' }); }}
                  className="mt-6 text-sm text-slate-500 hover:text-slate-300 underline underline-offset-2 transition"
                >
                  Send another message
                </button>
              </div>
            ) : (
              <form onSubmit={handleContactSubmit} className="space-y-5">
                {/* Name */}
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Full Name <span className="text-rose-400">*</span></label>
                  <input
                    type="text"
                    name="name"
                    required
                    value={contactForm.name}
                    onChange={handleContactChange}
                    placeholder="e.g. Ravi Sharma"
                    className="w-full bg-slate-800/60 border border-slate-700 hover:border-slate-600 focus:border-indigo-500 outline-none rounded-xl px-4 py-3 text-sm text-slate-200 placeholder-slate-600 transition"
                  />
                </div>
                {/* Email */}
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                    Email Address <span className="text-slate-500 normal-case font-normal">(Optional)</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={contactForm.email}
                    onChange={handleContactChange}
                    placeholder="e.g. ravi@example.com"
                    className="w-full bg-slate-800/60 border border-slate-700 hover:border-slate-600 focus:border-indigo-500 outline-none rounded-xl px-4 py-3 text-sm text-slate-200 placeholder-slate-600 transition"
                  />
                </div>
                {/* Mobile */}
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Mobile Number <span className="text-rose-400">*</span></label>
                  <div className="flex gap-2">
                    <span className="flex items-center px-3 bg-slate-800/80 border border-slate-700 rounded-xl text-slate-400 text-sm font-semibold select-none">+91</span>
                    <input
                      type="tel"
                      name="mobile"
                      required
                      maxLength={10}
                      pattern="[0-9]{10}"
                      value={contactForm.mobile}
                      onChange={handleContactChange}
                      placeholder="10-digit mobile number"
                      className="flex-1 bg-slate-800/60 border border-slate-700 hover:border-slate-600 focus:border-indigo-500 outline-none rounded-xl px-4 py-3 text-sm text-slate-200 placeholder-slate-600 transition"
                    />
                  </div>
                </div>
                {/* Submit */}
                <button
                  type="submit"
                  disabled={contactLoading}
                  className="w-full py-3.5 rounded-2xl text-sm font-bold text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 shadow-lg shadow-indigo-500/30 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {contactLoading ? (
                    <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Sending...</>
                  ) : (
                    <>Send Message <ArrowRight className="h-4 w-4" /></>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="relative z-10 border-t border-slate-800 py-10 px-4">
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
