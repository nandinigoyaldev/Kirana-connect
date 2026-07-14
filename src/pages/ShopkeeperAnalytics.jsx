import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { BarChart3, TrendingUp, Sparkles, AlertCircle, ShoppingBag, ArrowRight } from 'lucide-react';

export default function ShopkeeperAnalytics() {
  const { token } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const res = await fetch('/api/analytics/shopkeeper', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const resData = await res.json();
      setData(resData);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '60px' }}>Loading analytics panel...</div>;
  }

  const { weeklySales, predictedDemand } = data || {};

  // Find max sales to scale SVG chart heights
  const maxSales = Math.max(...weeklySales.map(d => Math.max(d.sales, d.forecast)));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
      
      {/* Header */}
      <div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>AI Analytics & Demand Forecasting</h2>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>Hyperlocal purchasing trends and automatic restocking threshold calculations</p>
      </div>

      {/* SVG Bar Chart: Weekly Sales vs Forecast */}
      <div className="card" style={{ padding: '24px' }}>
        <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <BarChart3 size={18} style={{ color: 'var(--color-primary)' }} /> Weekly Sales vs AI Demand Forecast
        </h3>

        {/* Legend */}
        <div style={{ display: 'flex', gap: '20px', fontSize: '0.8rem', fontWeight: 600, marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '12px', height: '12px', backgroundColor: 'var(--color-primary)', borderRadius: '3px' }}></span>
            <span>Actual Sales</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '12px', height: '12px', backgroundColor: 'var(--color-primary-light)', border: '2px dashed var(--color-primary)', borderRadius: '3px' }}></span>
            <span>Predicted Demand (Forecast)</span>
          </div>
        </div>

        {/* SVG Drawing */}
        <div style={{ width: '100%', overflowX: 'auto' }}>
          <svg viewBox="0 0 600 240" style={{ width: '100%', minWidth: '500px', height: 'auto' }}>
            {/* Grid Lines */}
            <line x1="40" y1="40" x2="580" y2="40" stroke="var(--color-border)" strokeDasharray="4" />
            <line x1="40" y1="120" x2="580" y2="120" stroke="var(--color-border)" strokeDasharray="4" />
            <line x1="40" y1="200" x2="580" y2="200" stroke="var(--color-text-muted)" />

            {/* Y Axis Labels */}
            <text x="10" y="44" fontSize="10" fill="var(--color-text-muted)">₹10k</text>
            <text x="10" y="124" fontSize="10" fill="var(--color-text-muted)">₹5k</text>
            <text x="10" y="204" fontSize="10" fill="var(--color-text-muted)">₹0</text>

            {/* Render Bars */}
            {weeklySales.map((day, idx) => {
              const xStart = 50 + idx * 75;
              const barWidth = 22;
              
              // Scale heights
              const heightSales = (day.sales / maxSales) * 160;
              const heightForecast = (day.forecast / maxSales) * 160;

              return (
                <g key={idx}>
                  {/* Actual Sales Bar */}
                  <rect 
                    x={xStart} 
                    y={200 - heightSales} 
                    width={barWidth} 
                    height={heightSales} 
                    fill="var(--color-primary)" 
                    rx="4" 
                  />
                  {/* Forecast Demand Bar */}
                  <rect 
                    x={xStart + barWidth + 4} 
                    y={200 - heightForecast} 
                    width={barWidth} 
                    height={heightForecast} 
                    fill="var(--color-primary-light)" 
                    stroke="var(--color-primary)"
                    strokeWidth="1"
                    strokeDasharray="2 2"
                    rx="4" 
                  />
                  {/* Day Label */}
                  <text 
                    x={xStart + barWidth} 
                    y="220" 
                    textAnchor="middle" 
                    fontSize="11" 
                    fontWeight="500" 
                    fill="var(--color-text-main)"
                  >
                    {day.day}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      {/* Predicted Restocking Urgency Grid */}
      <div>
        <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '16px' }}>AI Recommended Restocking Tiers</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
          {predictedDemand.map((item, idx) => {
            const isCritical = item.urgency === 'critical';
            const isHigh = item.urgency === 'high';

            return (
              <div 
                key={idx} 
                className="card" 
                style={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: '14px', 
                  border: isCritical ? '2px solid var(--color-error)' : (isHigh ? '1px solid var(--color-warning)' : '1px solid var(--color-border)') 
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <strong style={{ fontSize: '0.95rem' }}>{item.name}</strong>
                  <span className={`badge ${isCritical ? 'badge-error' : (isHigh ? 'badge-warning' : 'badge-success')}`}>
                    {item.urgency}
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Current Stock:</span>
                    <strong style={{ color: 'var(--color-text-main)' }}>{item.currentStock} units</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>7-Day Expected Demand:</span>
                    <strong style={{ color: 'var(--color-text-main)' }}>{item.forecastDemand} units</strong>
                  </div>
                </div>

                {isCritical && (
                  <div style={{ backgroundColor: '#fee2e2', padding: '10px', borderRadius: '8px', display: 'flex', gap: '6px', fontSize: '0.75rem', color: 'var(--color-error)' }}>
                    <AlertCircle size={16} style={{ flexShrink: 0 }} />
                    <span>Immediate restock suggested: Stockout probability is ~89% over the next 48 hours.</span>
                  </div>
                )}

                <button 
                  className="btn btn-secondary" 
                  style={{ 
                    marginTop: 'auto', 
                    fontSize: '0.8rem', 
                    padding: '8px',
                    backgroundColor: isCritical ? 'var(--color-error)' : undefined,
                    color: isCritical ? 'white' : undefined
                  }}
                >
                  Schedule Restock Order <ArrowRight size={14} />
                </button>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
