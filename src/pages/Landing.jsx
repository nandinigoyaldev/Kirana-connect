import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingBag, ShieldCheck, Truck, BarChart3, ChevronRight, Sparkles, Mic, FileText, ArrowRight, CheckCircle2, TrendingDown, Layers, Landmark } from 'lucide-react';

export default function Landing() {
  const navigate = useNavigate();
  const [activeScenario, setActiveScenario] = useState('basket');
  
  // Interactive Mockup State (Animates between Single Store and Split Store checkout states)
  const [mockupState, setMockupState] = useState('single');

  useEffect(() => {
    const interval = setInterval(() => {
      setMockupState(prev => (prev === 'single' ? 'split' : 'single'));
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const scenarios = {
    basket: {
      title: "AI Heuristic Cost Router & Splitter",
      description: "When a customer searches for multiple items (e.g. Milk + Bread + Eggs), our heuristics analyze local store inventories, pricing, and distance fees. It computes if buying separately at different stores beats a single checkout, accounting for delivery costs.",
      impact: "Reduces user cart checkout costs by 12% on average while distributing sales dynamically to local merchants.",
      badge: "Heuristic Logistics Optimization"
    },
    coop: {
      title: "Cooperative Merchant Share Network",
      description: "Neighborhood retailers often run out of popular SKUs. Instead of losing the customer, shopkeepers broadcast borrow requests to nearby co-op stores. Friendly stores with surplus stock accept the transfer, balancing stock levels automatically.",
      impact: "Eliminates localized inventory stock-outs and builds collaborative neighborhood retail networks.",
      badge: "Cooperative Commerce Engine"
    },
    voice: {
      title: "Speech-to-Stock Ingestion & OCR Scanner",
      description: "No manual catalog management. Shopkeepers restock inventories by simply dictating stock adjustments in Hindi/English, or uploading paper supplier invoices. The OCR and lexical parser extract quantities and map database SKUs instantly.",
      impact: "Reduces store stock reconciliation time from hours to under 10 seconds per ledger sheet.",
      badge: "Multimodal AI Telemetry"
    }
  };

  return (
    <div style={{ backgroundColor: 'var(--color-bg)', minHeight: '100vh' }}>
      
      {/* Premium Header */}
      <header style={{ borderBottom: '1px solid var(--color-border)', backgroundColor: '#FFFFFF', padding: '16px 24px', sticky: 'top', zIndex: 100 }}>
        <div className="container" style={{ padding: '0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '1.5rem' }}>🏪</span>
            <strong style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-primary)', letterSpacing: '-0.5px' }}>Kirana Connect</strong>

          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button className="btn btn-outline" onClick={() => navigate('/login?role=shopkeeper')} style={{ fontSize: '0.85rem', padding: '8px 16px' }}>
              Merchant Portal
            </button>
            <button className="btn btn-primary" onClick={() => navigate('/login')} style={{ fontSize: '0.85rem', padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              Access Console <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </header>

      <div className="container" style={{ paddingTop: '60px', paddingBottom: '80px' }}>
        
        {/* Hero Section */}
        <section className="grid-2" style={{ alignItems: 'center', gap: '48px', marginBottom: '80px' }}>
          
          {/* Left Hero Column */}
          <div className="flex-col gap-md">
            <span className="badge" style={{ backgroundColor: 'var(--color-primary-light)', color: 'var(--color-primary)', alignSelf: 'flex-start', fontSize: '0.75rem', fontWeight: 700 }}>
              🚀 Hyperlocal Retail Operating System
            </span>
            <h1 className="text-giant font-extrabold" style={{ color: 'var(--color-text-main)', letterSpacing: '-1px' }}>
              Modernizing Neighborhood Retail with <span className="text-cta">AI Cost Routing</span>
            </h1>
            <p className="text-md text-muted" style={{ lineHeight: 1.6 }}>
              Kirana Connect connects local customers, shopkeepers, and delivery agents through a collaborative cost-optimization router, cooperative stock transfers, OCR invoice ingestion, and voice-assisted inventory logs.

            </p>
            <div className="flex-row" style={{ gap: '16px', marginTop: '8px' }}>
              <button className="btn btn-primary" onClick={() => navigate('/login')} style={{ padding: '12px 28px', fontSize: '0.95rem' }}>
                Get Started Now
              </button>
              <button className="btn btn-outline" onClick={() => navigate('/login?role=customer')} style={{ padding: '12px 28px', fontSize: '0.95rem' }}>
                Customer Feed Demo
              </button>
            </div>
          </div>

          {/* Right Hero Column: Interactive Heuristic Optimization Mockup */}
          <div className="card" style={{ padding: '24px', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-lg)', backgroundColor: '#FFFFFF', position: 'relative' }}>
            <div className="flex-between" style={{ borderBottom: '1px solid var(--color-border)', paddingBottom: '12px', marginBottom: '16px' }}>
              <span className="text-xs text-muted font-bold" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Sparkles size={12} className="text-cta" /> AI BASKET ROUTER DIAGNOSTICS
              </span>
              <span className="badge" style={{ backgroundColor: mockupState === 'split' ? 'rgba(16, 185, 129, 0.15)' : '#F1F5F9', color: mockupState === 'split' ? 'var(--color-secondary)' : 'var(--color-text-muted)', fontSize: '0.65rem' }}>
                {mockupState === 'split' ? 'Heuristic Split Active' : 'Single Store Mode'}
              </span>
            </div>

            {/* Shopping List Items */}
            <div className="flex-col gap-xs" style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', padding: '6px 10px', backgroundColor: 'var(--color-bg)', borderRadius: '6px' }}>
                <span>Amul Milk (1L)</span>
                <strong>₹50</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', padding: '6px 10px', backgroundColor: 'var(--color-bg)', borderRadius: '6px' }}>
                <span>Britannia Premium Bread</span>
                <strong>₹30</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', padding: '6px 10px', backgroundColor: 'var(--color-bg)', borderRadius: '6px' }}>
                <span>Farm Fresh Eggs (6pcs)</span>
                <strong>₹40</strong>
              </div>
            </div>

            {/* Split/Single Comparison */}
            <div className="flex-col gap-sm" style={{ border: '1px solid var(--color-border)', padding: '16px', borderRadius: '10px', backgroundColor: 'rgba(240, 245, 255, 0.3)' }}>
              {mockupState === 'single' ? (
                <div className="flex-col gap-xs" style={{ animation: 'fadeIn 0.5s ease' }}>
                  <div className="flex-between">
                    <span className="text-xs text-muted">Checkout Store:</span>
                    <strong className="text-xs">Kumar Kirana Store</strong>
                  </div>
                  <div className="flex-between">
                    <span className="text-xs text-muted">Subtotal Price:</span>
                    <strong className="text-xs">₹120</strong>
                  </div>
                  <div className="flex-between">
                    <span className="text-xs text-muted">Delivery Charge:</span>
                    <strong className="text-xs">₹30</strong>
                  </div>
                  <div className="flex-between" style={{ borderTop: '1px solid var(--color-border)', paddingTop: '8px', marginTop: '4px' }}>
                    <span className="text-sm font-bold">Total Bill:</span>
                    <strong className="text-sm" style={{ color: 'var(--color-primary)' }}>₹150</strong>
                  </div>
                </div>
              ) : (
                <div className="flex-col gap-xs" style={{ animation: 'fadeIn 0.5s ease' }}>
                  <div className="flex-between">
                    <span className="text-xs text-muted">Route Split:</span>
                    <strong className="text-xs text-primary" style={{ display: 'flex', alignItems: 'center', gap: '2px' }}><CheckCircle2 size={12} /> Optimized</strong>
                  </div>
                  <div className="flex-between">
                    <span className="text-xs text-muted">Kumar Kirana (Milk + Eggs):</span>
                    <strong className="text-xs">₹90 (+ ₹15 delivery)</strong>
                  </div>
                  <div className="flex-between">
                    <span className="text-xs text-muted">Gupta Store (Bread):</span>
                    <strong className="text-xs">₹20 (+ ₹10 delivery)</strong>
                  </div>
                  <div className="flex-between" style={{ borderTop: '1px solid var(--color-border)', paddingTop: '8px', marginTop: '4px' }}>
                    <span className="text-sm font-bold">Total Optimized Bill:</span>
                    <strong className="text-sm text-secondary">₹135 (Saved ₹15!)</strong>
                  </div>
                </div>
              )}
            </div>
            
            <style>{`
              @keyframes fadeIn {
                from { opacity: 0; transform: translateY(2px); }
                to { opacity: 1; transform: translateY(0); }
              }
            `}</style>
          </div>
        </section>

        {/* Interactive Scenario Feature Tour */}
        <section className="card" style={{ marginBottom: '60px', padding: '32px', backgroundColor: '#FFFFFF', border: '1px solid var(--color-border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-primary)', fontWeight: 800, fontSize: '0.85rem', marginBottom: '8px' }}>
            <Sparkles size={16} /> INTERACTIVE PLATFORM TOUR
          </div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '24px', letterSpacing: '-0.5px' }}>Explore Kirana Connect Capabilities</h2>


          <div className="tour-tab-layout">
            {/* Tab navigation */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {Object.keys(scenarios).map((key) => (
                <button
                  key={key}
                  onClick={() => setActiveScenario(key)}
                  style={{
                    padding: '12px 16px',
                    borderRadius: '8px',
                    textAlign: 'left',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    transition: 'all var(--transition-fast)',
                    backgroundColor: activeScenario === key ? 'var(--color-primary-light)' : 'transparent',
                    color: activeScenario === key ? 'var(--color-primary)' : 'var(--color-text-muted)',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                >
                  {key === 'basket' && '1. Heuristic Optimizer'}
                  {key === 'coop' && '2. Merchant Co-op'}
                  {key === 'voice' && '3. Ingestion Systems'}
                </button>
              ))}
            </div>

            {/* Content pane */}
            <div className="flex-col" style={{ justifyContent: 'center', gap: '16px', backgroundColor: 'var(--color-bg)', padding: '24px', borderRadius: '12px', border: '1px solid var(--color-border)' }}>
              <span className="badge" style={{ backgroundColor: 'var(--color-primary)', color: '#FFFFFF', alignSelf: 'flex-start', fontSize: '0.7rem' }}>
                {scenarios[activeScenario].badge}
              </span>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>
                {scenarios[activeScenario].title}
              </h3>
              <p className="text-sm text-muted" style={{ lineHeight: 1.6 }}>
                {scenarios[activeScenario].description}
              </p>
              <div style={{ borderTop: '1px dashed var(--color-border)', paddingTop: '16px', fontSize: '0.8rem', color: 'var(--color-secondary)', fontWeight: 700 }}>
                📈 Hyperlocal Impact: {scenarios[activeScenario].impact}
              </div>
            </div>
          </div>
        </section>

        {/* Directory Showcase Cards */}
        <h2 className="text-center" style={{ marginBottom: '32px', fontWeight: 800, fontSize: '1.75rem', letterSpacing: '-0.5px' }}>Kirana Connect Ecosystem Directory</h2>

        <div className="grid-4" style={{ gap: '20px' }}>
          
          <div className="showcase-card">
            <div className="icon-container bg-primary-light">
              <ShoppingBag size={22} />
            </div>
            <h3 className="text-md font-bold">Customer Portal</h3>
            <p className="text-xs text-muted" style={{ flex: 1, lineHeight: 1.5 }}>
              Browse nearby neighborhood stores, search products via multilingual voice recognition, and optimize checkouts.
            </p>
            <button className="btn btn-secondary w-full" onClick={() => navigate('/login?role=customer')} style={{ fontSize: '0.8rem' }}>
              Open Customer Feed
            </button>
          </div>

          <div className="showcase-card">
            <div className="icon-container bg-primary-light">
              <BarChart3 size={22} className="text-primary" />
            </div>
            <h3 className="text-md font-bold">Merchant Hub</h3>
            <p className="text-xs text-muted" style={{ flex: 1, lineHeight: 1.5 }}>
              Dictate stock changes via voice updates, reconcile supplier invoices via OCR scan, and participate in the Co-op network.
            </p>
            <button className="btn btn-secondary w-full" onClick={() => navigate('/login?role=shopkeeper')} style={{ fontSize: '0.8rem' }}>
              Open Shopkeeper Hub
            </button>
          </div>

          <div className="showcase-card">
            <div className="icon-container bg-primary-light">
              <Truck size={22} />
            </div>
            <h3 className="text-md font-bold">Delivery Partner</h3>
            <p className="text-xs text-muted" style={{ flex: 1, lineHeight: 1.5 }}>
              Secure active pickup listings, navigate optimized routes, and verify final drops via customer OTP verification.
            </p>
            <button className="btn btn-secondary w-full" onClick={() => navigate('/login?role=delivery')} style={{ fontSize: '0.8rem' }}>
              Open Driver Portal
            </button>
          </div>

          <div className="showcase-card">
            <div className="icon-container bg-primary-light">
              <ShieldCheck size={22} />
            </div>
            <h3 className="text-md font-bold">Platform Admin</h3>
            <p className="text-xs text-muted" style={{ flex: 1, lineHeight: 1.5 }}>
              Investigate secure escrow balance settlements, review fraud log records, and monitor total checkout volume analytics.
            </p>
            <button className="btn btn-secondary w-full" onClick={() => navigate('/login?role=admin')} style={{ fontSize: '0.8rem' }}>
              Open Admin Console
            </button>
          </div>

        </div>

        {/* Real-time Statistics Panel */}
        <section className="stat-panel text-center" style={{ backgroundColor: '#FFFFFF', marginTop: '60px' }}>
          <div>
            <div className="stat-box-title">15,000+</div>
            <p className="text-xs text-muted font-bold" style={{ textTransform: 'uppercase' }}>Registered Stores</p>
          </div>
          <div>
            <div className="stat-box-title">12.4%</div>
            <p className="text-xs text-muted font-bold" style={{ textTransform: 'uppercase' }}>Average Cart Savings</p>
          </div>
          <div>
            <div className="stat-box-title">₹24 Lakhs</div>
            <p className="text-xs text-muted font-bold" style={{ textTransform: 'uppercase' }}>E-Commerce Escrow Cleared</p>
          </div>
          <div>
            <div className="stat-box-title">99.2%</div>
            <p className="text-xs text-muted font-bold" style={{ textTransform: 'uppercase' }}>Secure OTP Validation</p>
          </div>
        </section>

      </div>
    </div>
  );
}
