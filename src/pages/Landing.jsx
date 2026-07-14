import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingBag, ShieldCheck, Truck, BarChart3, ChevronRight } from 'lucide-react';

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 20px' }}>
      {/* Hero Section */}
      <section className="glass-hero" style={{ marginBottom: '60px', textAlign: 'center' }}>
        <h1 style={{ fontSize: '3rem', fontWeight: 800, marginBottom: '16px', color: 'var(--color-text-main)', lineHeight: 1.2 }}>
          Modernizing Neighborhood Retail with <span style={{ color: 'var(--color-primary)' }}>AI & Hyperlocal Tech</span>
        </h1>
        <p style={{ fontSize: '1.2rem', color: 'var(--color-text-muted)', marginBottom: '32px', maxWidth: '700px', margin: '0 auto 32px auto' }}>
          Kirana Connect connects customers, local shopkeepers, and delivery partners through live inventory tracking, AI basket split-optimization, voice logs, and OCR invoicing.
        </p>
        <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button className="btn btn-primary" onClick={() => navigate('/login')} style={{ fontSize: '1.1rem', padding: '12px 28px' }}>
            Get Started <ChevronRight size={20} />
          </button>
          <button className="btn btn-outline" onClick={() => navigate('/login?role=shopkeeper')} style={{ fontSize: '1.1rem', padding: '12px 28px' }}>
            Merchant Portal
          </button>
        </div>
      </section>

      {/* Role Selection Showcase */}
      <h2 style={{ textAlign: 'center', marginBottom: '40px', fontWeight: 700 }}>Choose Your Role on the Platform</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '30px', marginBottom: '60px' }}>
        <div className="card card-hover" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: 'var(--color-primary-light)', display: 'flex', alignItems: 'center', justifyContext: 'center', padding: '12px', color: 'var(--color-primary)' }}>
            <ShoppingBag size={24} />
          </div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Customer</h3>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', flex: 1 }}>
            Find nearby stores, compare prices, and use AI optimization to split your basket across shops for the absolute lowest total bill.
          </p>
          <button className="btn btn-secondary" onClick={() => navigate('/login?role=customer')} style={{ width: '100%' }}>
            Access Customer Hub
          </button>
        </div>

        <div className="card card-hover" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: '#fef3c7', display: 'flex', alignItems: 'center', justifyContext: 'center', padding: '12px', color: 'var(--color-accent-dark)' }}>
            <BarChart3 size={24} />
          </div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Shopkeeper</h3>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', flex: 1 }}>
            Manage stock with voice dictation, scan invoices via OCR scanner, accept customer orders, and view AI demand predictions.
          </p>
          <button className="btn btn-secondary" onClick={() => navigate('/login?role=shopkeeper')} style={{ width: '100%', color: 'var(--color-accent-dark)', backgroundColor: '#fef3c7' }}>
            Merchant Login
          </button>
        </div>

        <div className="card card-hover" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: '#dbeafe', display: 'flex', alignItems: 'center', justifyContext: 'center', padding: '12px', color: 'var(--color-cta)' }}>
            <Truck size={24} />
          </div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Delivery Agent</h3>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', flex: 1 }}>
            Accept deliveries, follow optimized routes, verify customer deliveries with OTP, and manage your earnings via escrow wallet.
          </p>
          <button className="btn btn-secondary" onClick={() => navigate('/login?role=delivery')} style={{ width: '100%', color: 'var(--color-cta)', backgroundColor: '#dbeafe' }}>
            Delivery Portal
          </button>
        </div>

        <div className="card card-hover" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: '#fee2e2', display: 'flex', alignItems: 'center', justifyContext: 'center', padding: '12px', color: 'var(--color-error)' }}>
            <ShieldCheck size={24} />
          </div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Admin Console</h3>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', flex: 1 }}>
            Manage platform stores, review transactional ledger records, configure delivery configurations, and investigate fraud geofencing.
          </p>
          <button className="btn btn-secondary" onClick={() => navigate('/login?role=admin')} style={{ width: '100%', color: 'var(--color-error)', backgroundColor: '#fee2e2' }}>
            Admin Panel
          </button>
        </div>
      </div>

      {/* Stats Section */}
      <section style={{ backgroundColor: 'white', borderRadius: '18px', padding: '40px', border: '1px solid var(--color-border)', textAlign: 'center' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '30px' }}>
          <div>
            <h3 style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--color-primary)' }}>15,000+</h3>
            <p style={{ color: 'var(--color-text-muted)', fontWeight: 500 }}>Active Kirana Stores</p>
          </div>
          <div>
            <h3 style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--color-primary)' }}>12%</h3>
            <p style={{ color: 'var(--color-text-muted)', fontWeight: 500 }}>Cheaper AI Cart Split Deals</p>
          </div>
          <div>
            <h3 style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--color-primary)' }}>2.4M</h3>
            <p style={{ color: 'var(--color-text-muted)', fontWeight: 500 }}>Hyperlocal Orders Delivered</p>
          </div>
          <div>
            <h3 style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--color-primary)' }}>99.2%</h3>
            <p style={{ color: 'var(--color-text-muted)', fontWeight: 500 }}>AI Speech & OCR Recognition</p>
          </div>
        </div>
      </section>
    </div>
  );
}
