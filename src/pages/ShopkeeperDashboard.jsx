import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { ShoppingBag, CheckCircle, Clock, AlertTriangle, TrendingUp, Sparkles, Plus, Mic, FileText, ChevronRight } from 'lucide-react';

export default function ShopkeeperDashboard() {
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const { activeOrders, fetchActiveOrders } = useCart();
  const [orders, setOrders] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, [activeOrders]);

  const fetchDashboardData = async () => {
    try {
      // Fetch shopkeeper orders
      const ordRes = await fetch('/api/orders/shopkeeper', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const ordData = await ordRes.json();
      setOrders(ordData.orders || []);

      // Fetch analytics
      const analRes = await fetch('/api/analytics/shopkeeper', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const analData = await analRes.json();
      setAnalytics(analData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateItemStatus = async (orderId, productId, itemStatus) => {
    try {
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ itemId: productId, itemStatus })
      });
      if (res.ok) {
        fetchDashboardData();
        fetchActiveOrders();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAcceptOrder = async (orderId) => {
    try {
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: 'accepted' })
      });
      if (res.ok) {
        fetchDashboardData();
        fetchActiveOrders();
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '60px' }}>Loading merchant dashboard...</div>;
  }

  // Calculate metrics
  const activeOrdersCount = orders.filter(o => o.status !== 'delivered' && o.status !== 'cancelled').length;
  const storeId = user.storeId;
  
  // Calculate today's store revenue from orders
  const todayRevenue = orders
    .filter(o => o.status === 'delivered')
    .reduce((sum, o) => {
      const storeItems = o.items.filter(i => i.storeId === storeId);
      const sub = storeItems.reduce((s, i) => s + (i.price * i.quantity), 0);
      return sum + sub;
    }, 0);

  // Critical stock items forecast
  const criticalItems = analytics ? analytics.predictedDemand.filter(d => d.urgency === 'critical' || d.urgency === 'high') : [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
      
      {/* Welcome Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Welcome Back, {user.name}!</h2>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>Managing store: <strong>Kumar Kirana & General Store</strong></p>
        </div>
        
        {/* Quick Actions Shortcuts */}
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn btn-secondary" onClick={() => navigate('/shopkeeper/voice')} style={{ gap: '6px', fontSize: '0.85rem' }}>
            <Mic size={16} /> Voice Stock Log
          </button>
          <button className="btn btn-secondary" onClick={() => navigate('/shopkeeper/ocr')} style={{ gap: '6px', fontSize: '0.85rem' }}>
            <FileText size={16} /> OCR Invoice Upload
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="stats-grid">
        <div className="card stats-card">
          <div className="stats-icon" style={{ backgroundColor: 'var(--color-primary-light)', color: 'var(--color-primary)' }}>
            <TrendingUp size={24} />
          </div>
          <div>
            <div className="stats-label">Today's Revenue</div>
            <div className="stats-value">₹{todayRevenue || '1,890'}</div>
          </div>
        </div>

        <div className="card stats-card">
          <div className="stats-icon" style={{ backgroundColor: '#dbeafe', color: 'var(--color-cta)' }}>
            <ShoppingBag size={24} />
          </div>
          <div>
            <div className="stats-label">Active Orders</div>
            <div className="stats-value">{activeOrdersCount}</div>
          </div>
        </div>

        <div className="card stats-card">
          <div className="stats-icon" style={{ backgroundColor: '#fee2e2', color: 'var(--color-error)' }}>
            <AlertTriangle size={24} />
          </div>
          <div>
            <div className="stats-label">Low Stock Alerts</div>
            <div className="stats-value">{criticalItems.length}</div>
          </div>
        </div>
      </div>

      {/* Active Orders List & Stock Forecast side-by-side */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: '30px', alignItems: 'start' }}>
        
        {/* Active Orders */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Incoming Pickup Requests</h3>
          
          {orders.length === 0 ? (
            <div style={{ padding: '30px', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
              No pending orders for your store at the moment.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {orders.map(o => {
                const myStoreItems = o.items.filter(i => i.storeId === storeId);
                const isPendingAccept = o.status === 'pending';

                return (
                  <div key={o._id} style={{ border: '1px solid var(--color-border)', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    
                    {/* Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <strong>Order #{o._id.substring(0,8)}</strong>
                        <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>Customer: Aarav Sharma</div>
                      </div>
                      <span className="badge badge-info">{o.status}</span>
                    </div>

                    {/* Items table */}
                    <div style={{ backgroundColor: 'var(--color-bg)', padding: '10px', borderRadius: '8px' }}>
                      {myStoreItems.map(item => (
                        <div key={item.productId} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '4px' }}>
                          <span>{item.name} <strong>x{item.quantity}</strong></span>
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>₹{item.price * item.quantity}</span>
                            {o.status === 'accepted' && item.status !== 'prepared' && (
                              <button 
                                className="btn btn-secondary" 
                                onClick={() => handleUpdateItemStatus(o._id, item.productId, 'prepared')}
                                style={{ padding: '2px 8px', fontSize: '0.7rem', borderRadius: '4px' }}
                              >
                                Mark Ready
                              </button>
                            )}
                            {item.status === 'prepared' && (
                              <span style={{ color: 'var(--color-primary)', fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '2px' }}><CheckCircle size={12} /> Packed</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Action buttons */}
                    {isPendingAccept && (
                      <div style={{ display: 'flex', gap: '10px' }}>
                        <button className="btn btn-primary" onClick={() => handleAcceptOrder(o._id)} style={{ flex: 1, padding: '8px', fontSize: '0.8rem' }}>
                          Accept Order
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Sidebar: AI Analytics Stock Restock Forecast */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--color-primary)', fontWeight: 700, fontSize: '0.85rem' }}>
            <Sparkles size={14} /> AI DEMAND FORECASTING
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
            Predicted inventory demand based on hyperlocal purchasing trends and weekday historical data.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {criticalItems.map((item, idx) => (
              <div key={idx} style={{ border: '1px solid var(--color-border)', borderRadius: '10px', padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <strong style={{ fontSize: '0.85rem' }}>{item.name}</strong>
                  <span className="badge badge-error" style={{ fontSize: '0.6rem' }}>{item.urgency}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                  <span>Current: <strong>{item.currentStock} bags</strong></span>
                  <span>Forecast Demand: <strong>{item.forecastDemand} bags</strong></span>
                </div>
                <button 
                  className="btn btn-secondary" 
                  onClick={() => navigate('/shopkeeper/inventory')}
                  style={{ width: '100%', padding: '6px', fontSize: '0.75rem', color: 'var(--color-primary)' }}
                >
                  Restock Catalog <ChevronRight size={12} />
                </button>
              </div>
            ))}
          </div>

          <button className="btn btn-outline" onClick={() => navigate('/shopkeeper/analytics')} style={{ fontSize: '0.8rem', padding: '10px' }}>
            View Full Predictions
          </button>
        </div>

      </div>

    </div>
  );
}
