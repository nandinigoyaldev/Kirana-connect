import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingBag, Truck, BarChart3, ChevronRight, Sparkles, Mic, FileText, CheckCircle2, UserCheck, ShieldCheck, MapPin, Zap, ArrowRightLeft } from 'lucide-react';

export default function Landing() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('splitter');
  const [animatedIndex, setAnimatedIndex] = useState(0);

  // Auto-rotate the active diagnostic log inside the mockup
  useEffect(() => {
    const interval = setInterval(() => {
      setAnimatedIndex(prev => (prev === 0 ? 1 : 0));
    }, 3500);
    return () => clearInterval(interval);
  }, []);

  const tourFeatures = {
    splitter: {
      title: "Smart Basket Cost Router",
      subtitle: "Heuristic Checkout Splitter Engine",
      badge: "AI Optimization",
      desc: "Kirana Connect reads the list of grocery products in your shopping cart and queries inventory prices from all registered stores within your neighborhood. It then computes the mathematical optimal split — dividing the basket between multiple merchants and balancing product costs against delivery fees to guarantee the lowest total bill.",
      impact: "Saves customers 12% to 18% on average per checkout basket.",
      icon: <ArrowRightLeft size={22} className="text-primary" />
    },
    coop: {
      title: "Cooperative Stock Sharing Network",
      subtitle: "B2B Neighborhood Retailer Cooperative",
      badge: "Dynamic Inventory balancing",
      desc: "Individual retail shops frequently run out of popular SKUs. Kirana Connect solves this by establishing a decentralized sharing ledger. Shopkeepers can broadcast immediate borrow requests to nearby co-op partners. Lending stores accept transfers in real-time, automatically updating database balances.",
      impact: "Reduces inventory stock-out occurrences by 94% across neighborhood hubs.",
      icon: <MapPin size={22} className="text-secondary" />
    },
    speech: {
      title: "Multilingual Speech Stock Ingestion",
      subtitle: "Voice Updates & OCR Inbound Ingestion",
      badge: "Retailer Telemetry",
      desc: "Shopkeepers don't need spreadsheets or computers. Kirana Connect provides natural speech dictation (supporting English and Hindi voice updates) and a document scanner. Uploading paper invoices segment quantities and map catalog items automatically.",
      impact: "Reduces catalog updating time from hours to under 10 seconds.",
      icon: <Mic size={22} style={{ color: 'var(--color-primary)' }} />
    }
  };

  return (
    <div style={{ backgroundColor: 'var(--color-bg)', minHeight: '100vh', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      
      {/* Dynamic Header */}
      <header style={{ backgroundColor: '#FFFFFF', borderBottom: '1px solid var(--color-border)', position: 'sticky', top: 0, zIndex: 100, padding: '16px 24px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '1.75rem', lineHeight: 1 }}>🏪</span>
            <strong style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--color-primary)', letterSpacing: '-0.7px' }}>Kirana Connect</strong>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button className="btn btn-outline" onClick={() => navigate('/login?role=shopkeeper')} style={{ fontSize: '0.85rem', padding: '8px 16px' }}>
              Merchant Hub
            </button>
            <button className="btn btn-primary" onClick={() => navigate('/login')} style={{ fontSize: '0.85rem', padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              Enter Console <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section Banner */}
      <div style={{ backgroundColor: 'var(--color-primary-light)', padding: '10px 24px', textAlign: 'center', borderBottom: '1px solid var(--color-border)' }}>
        <p style={{ fontSize: '0.8rem', color: 'var(--color-primary)', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
          <Zap size={14} /> ⚡ Now Live in Gurgaon Sector 4 Hub: Supporting real Phone OTP logins and merchant co-op shares.
        </p>
      </div>

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '60px 24px 80px' }}>
        
        {/* Main Hero grid layout */}
        <section className="grid-2" style={{ alignItems: 'center', gap: '48px', marginBottom: '80px' }}>
          
          {/* Hero text panel (Left) */}
          <div className="flex-col" style={{ gap: '20px' }}>
            <h1 style={{ fontSize: '3.25rem', fontWeight: 900, color: 'var(--color-text-main)', letterSpacing: '-1.5px', lineHeight: 1.1, margin: 0 }}>
              Connecting Local Retailers, <span style={{ color: 'var(--color-primary)' }}>Optimizing Costs</span>
            </h1>
            <p className="text-md text-muted" style={{ lineHeight: 1.6, margin: 0, fontSize: '1.05rem' }}>
              Kirana Connect modernizes neighborhood grocery operations. Customers check out at the lowest split-store prices, merchants balance inventory deficiencies collaboratively, and drivers complete drops with secure OTP handshakes.
            </p>
            <div className="flex-row" style={{ gap: '16px', marginTop: '8px' }}>
              <button className="btn btn-primary" onClick={() => navigate('/login')} style={{ padding: '14px 28px', fontSize: '0.95rem' }}>
                Access Shopping Feed
              </button>
              <button className="btn btn-outline" onClick={() => navigate('/login?role=admin')} style={{ padding: '14px 28px', fontSize: '0.95rem' }}>
                Admin Dashboard Demo
              </button>
            </div>
          </div>

          {/* Hero interactive mockup showcase (Right) */}
          <div className="card" style={{ padding: '28px', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-lg)', backgroundColor: '#FFFFFF' }}>
            <div className="flex-between" style={{ borderBottom: '1px solid var(--color-border)', paddingBottom: '14px', marginBottom: '16px' }}>
              <span className="text-xs font-bold" style={{ color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Sparkles size={14} /> LIVE HEURISTIC CHECKOUT SOLVER
              </span>
              <span className="badge" style={{ backgroundColor: animatedIndex === 1 ? 'rgba(16, 185, 129, 0.15)' : '#F3F4F6', color: animatedIndex === 1 ? 'var(--color-accent-dark)' : 'var(--color-text-muted)', fontSize: '0.65rem' }}>
                {animatedIndex === 1 ? 'AI Optimization Applied' : 'Base Single Store Mode'}
              </span>
            </div>

            {/* Shopping List mockup */}
            <div className="flex-col" style={{ gap: '8px', marginBottom: '16px' }}>
              <div className="flex-between" style={{ fontSize: '0.85rem', padding: '8px 12px', backgroundColor: 'var(--color-bg)', borderRadius: '8px' }}>
                <span>Amul Full Cream Milk (1L)</span>
                <strong>₹66</strong>
              </div>
              <div className="flex-between" style={{ fontSize: '0.85rem', padding: '8px 12px', backgroundColor: 'var(--color-bg)', borderRadius: '8px' }}>
                <span>Britannia Sandwich Bread</span>
                <strong>₹45</strong>
              </div>
            </div>

            {/* Simulated route split panel */}
            <div className="flex-col" style={{ border: '1px solid var(--color-border)', padding: '16px', borderRadius: '12px', backgroundColor: 'rgba(238, 242, 255, 0.4)' }}>
              {animatedIndex === 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div className="flex-between" style={{ fontSize: '0.8rem' }}>
                    <span className="text-muted">Target Store:</span>
                    <strong>Kumar Kirana Store</strong>
                  </div>
                  <div className="flex-between" style={{ fontSize: '0.8rem' }}>
                    <span className="text-muted">Items Subtotal:</span>
                    <strong>₹111</strong>
                  </div>
                  <div className="flex-between" style={{ fontSize: '0.8rem' }}>
                    <span className="text-muted">Single Delivery Fee:</span>
                    <strong>₹30</strong>
                  </div>
                  <div className="flex-between" style={{ borderTop: '1px solid var(--color-border)', paddingTop: '10px', marginTop: '6px', fontSize: '0.9rem', fontWeight: 800 }}>
                    <span>Total Checkout Bill:</span>
                    <span style={{ color: 'var(--color-primary)' }}>₹141</span>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div className="flex-between" style={{ fontSize: '0.8rem' }}>
                    <span className="text-muted" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><CheckCircle2 size={12} className="text-accent" /> Optimized Route Split:</span>
                    <strong style={{ color: 'var(--color-accent-dark)' }}>2 Merchants matched</strong>
                  </div>
                  <div className="flex-between" style={{ fontSize: '0.8rem' }}>
                    <span className="text-muted">Kumar Kirana (Milk):</span>
                    <strong>₹60 (+ ₹10 delivery share)</strong>
                  </div>
                  <div className="flex-between" style={{ fontSize: '0.8rem' }}>
                    <span className="text-muted">Gupta Provision (Bread):</span>
                    <strong>₹35 (+ ₹15 delivery share)</strong>
                  </div>
                  <div className="flex-between" style={{ borderTop: '1px solid var(--color-border)', paddingTop: '10px', marginTop: '6px', fontSize: '0.9rem', fontWeight: 800 }}>
                    <span>Optimized Checkout Total:</span>
                    <span style={{ color: 'var(--color-accent-dark)' }}>₹120 (Saved ₹21!)</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Feature Tab Tour Section */}
        <section className="card" style={{ padding: '36px', backgroundColor: '#FFFFFF', border: '1px solid var(--color-border)', marginBottom: '8px' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--color-primary)', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>
            🛠️ Platform Architecture Explorer
          </span>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 900, marginBottom: '24px', letterSpacing: '-0.5px', marginTop: 0 }}>Explore Core Operational Models</h2>

          <div className="tour-tab-layout">
            
            {/* Tab switch panel (Left) */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {Object.keys(tourFeatures).map(key => (
                <button
                  key={key}
                  onClick={() => setActiveTab(key)}
                  style={{
                    padding: '14px 18px',
                    borderRadius: '10px',
                    textAlign: 'left',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all var(--transition-fast)',
                    backgroundColor: activeTab === key ? 'var(--color-primary-light)' : 'transparent',
                    color: activeTab === key ? 'var(--color-primary)' : 'var(--color-text-muted)',
                    border: 'none'
                  }}
                >
                  {tourFeatures[key].title}
                </button>
              ))}
            </div>

            {/* Tab content pane (Right) */}
            <div className="flex-col" style={{ gap: '16px', backgroundColor: 'var(--color-bg)', padding: '28px', borderRadius: '14px', border: '1px solid var(--color-border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div className="icon-container bg-primary-light" style={{ width: '40px', height: '40px', borderRadius: '8px' }}>
                  {tourFeatures[activeTab].icon}
                </div>
                <div>
                  <span className="badge" style={{ backgroundColor: 'var(--color-primary)', color: '#FFFFFF', fontSize: '0.65rem', fontWeight: 700 }}>
                    {tourFeatures[activeTab].badge}
                  </span>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: '4px 0 0 0' }}>
                    {tourFeatures[activeTab].subtitle}
                  </h3>
                </div>
              </div>
              <p className="text-sm text-muted" style={{ lineHeight: 1.6, margin: 0 }}>
                {tourFeatures[activeTab].desc}
              </p>
              <div style={{ borderTop: '1px dashed var(--color-border)', paddingTop: '16px', fontSize: '0.8rem', color: 'var(--color-accent-dark)', fontWeight: 700 }}>
                📈 Heuristic Solution Impact: {tourFeatures[activeTab].impact}
              </div>
            </div>
          </div>
        </section>

        {/* Directory Showcase Cards */}
        <section style={{ marginTop: '80px' }}>
          <h2 className="text-center" style={{ fontSize: '1.75rem', fontWeight: 900, marginBottom: '36px', letterSpacing: '-0.5px' }}>Kirana Connect Platform Directories</h2>
          <div className="grid-4" style={{ gap: '20px' }}>
            
            <div className="showcase-card">
              <div className="icon-container bg-primary-light">
                <ShoppingBag size={22} />
              </div>
              <h3 className="text-md font-bold" style={{ margin: 0 }}>Customer Portal</h3>
              <p className="text-xs text-muted" style={{ flex: 1, lineHeight: 1.5, margin: 0 }}>
                Verify nearby merchant directories, search items via multilingual voice scanner, and route checkouts.
              </p>
              <button className="btn btn-secondary w-full" onClick={() => navigate('/login?role=customer')} style={{ fontSize: '0.8rem', padding: '8px' }}>
                Customer Feed
              </button>
            </div>

            <div className="showcase-card">
              <div className="icon-container bg-primary-light">
                <BarChart3 size={22} className="text-primary" />
              </div>
              <h3 className="text-md font-bold" style={{ margin: 0 }}>Merchant Terminal</h3>
              <p className="text-xs text-muted" style={{ flex: 1, lineHeight: 1.5, margin: 0 }}>
                Update inventories via voice dictation, scan paper invoices via OCR, and balance coop shares.
              </p>
              <button className="btn btn-secondary w-full" onClick={() => navigate('/login?role=shopkeeper')} style={{ fontSize: '0.8rem', padding: '8px' }}>
                Shopkeeper Console
              </button>
            </div>

            <div className="showcase-card">
              <div className="icon-container bg-primary-light">
                <Truck size={22} />
              </div>
              <h3 className="text-md font-bold" style={{ margin: 0 }}>Delivery Driver</h3>
              <p className="text-xs text-muted" style={{ flex: 1, lineHeight: 1.5, margin: 0 }}>
                Accept active pickup coordinates, navigate routing maps, and settle drop payouts via customer OTP code.
              </p>
              <button className="btn btn-secondary w-full" onClick={() => navigate('/login?role=delivery')} style={{ fontSize: '0.8rem', padding: '8px' }}>
                Driver Portal
              </button>
            </div>

            <div className="showcase-card">
              <div className="icon-container bg-primary-light">
                <ShieldCheck size={22} />
              </div>
              <h3 className="text-md font-bold" style={{ margin: 0 }}>System Admin</h3>
              <p className="text-xs text-muted" style={{ flex: 1, lineHeight: 1.5, margin: 0 }}>
                Settle merchant escrow ledger files, inspect anomaly fraud warnings, and verify onboarding partners.
              </p>
              <button className="btn btn-secondary w-full" onClick={() => navigate('/login?role=admin')} style={{ fontSize: '0.8rem', padding: '8px' }}>
                Admin Console
              </button>
            </div>

          </div>
        </section>

        {/* Real-time statistics proof points */}
        <section className="stat-panel text-center" style={{ backgroundColor: '#FFFFFF', marginTop: '60px' }}>
          <div>
            <div className="stat-box-title" style={{ fontSize: '2.5rem' }}>15+ Min</div>
            <p className="text-xs text-muted font-bold" style={{ textTransform: 'uppercase', margin: 0 }}>Average Delivery Speed</p>
          </div>
          <div>
            <div className="stat-box-title" style={{ fontSize: '2.5rem' }}>14.8%</div>
            <p className="text-xs text-muted font-bold" style={{ textTransform: 'uppercase', margin: 0 }}>Checkout Cost Reductions</p>
          </div>
          <div>
            <div className="stat-box-title" style={{ fontSize: '2.5rem' }}>₹4.2 Lakhs</div>
            <p className="text-xs text-muted font-bold" style={{ textTransform: 'uppercase', margin: 0 }}>Retailer Escrow Disbursed</p>
          </div>
          <div>
            <div className="stat-box-title" style={{ fontSize: '2.5rem' }}>100%</div>
            <p className="text-xs text-muted font-bold" style={{ textTransform: 'uppercase', margin: 0 }}>Partner OTP Security</p>
          </div>
        </section>

      </div>
    </div>
  );
}
