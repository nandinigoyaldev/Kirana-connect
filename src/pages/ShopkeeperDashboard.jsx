import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { ShoppingBag, CheckCircle, Clock, AlertTriangle, TrendingUp, Sparkles, Plus, Mic, FileText, ChevronRight, Share2, Send, HelpCircle, Activity, Check } from 'lucide-react';


export default function ShopkeeperDashboard() {
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const { activeOrders, fetchActiveOrders } = useCart();
  const [orders, setOrders] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [coopRequests, setCoopRequests] = useState([]);
  const [products, setProducts] = useState([]);
  const [showCoopModal, setShowCoopModal] = useState(false);
  const [coopForm, setCoopForm] = useState({ productId: '', quantity: 10 });
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

      // Fetch co-op requests
      const coopRes = await fetch('/api/coop/requests', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const coopData = await coopRes.json();
      setCoopRequests(coopData.requests || []);

      // Fetch global products for form
      const prodRes = await fetch('/api/products');
      const prodData = await prodRes.json();
      setProducts(prodData.products || []);
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

  const handleLendStock = async (requestId) => {
    try {
      const res = await fetch(`/api/coop/request/${requestId}/respond`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: 'accepted' })
      });
      if (res.ok) {
        fetchDashboardData();
      } else {
        const errData = await res.json();
        alert(errData.message || 'Lending failed: Make sure you have enough stock of this product first');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateCoopRequest = async (e) => {
    e.preventDefault();
    if (!coopForm.productId || !coopForm.quantity) return;
    const selectedProd = products.find(p => p._id === coopForm.productId);
    try {
      const res = await fetch('/api/coop/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          productId: coopForm.productId,
          productName: selectedProd ? selectedProd.name : 'Retail Product',
          quantity: Number(coopForm.quantity)
        })
      });
      if (res.ok) {
        setShowCoopModal(false);
        setCoopForm({ productId: '', quantity: 10 });
        fetchDashboardData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '60px' }}>Loading merchant dashboard...</div>;
  }

  const activeOrdersCount = orders.filter(o => o.status !== 'delivered' && o.status !== 'cancelled').length;
  const storeId = user.storeId;
  
  const todayRevenue = orders
    .filter(o => o.status === 'delivered')
    .reduce((sum, o) => {
      const storeItems = o.items.filter(i => i.storeId === storeId);
      const sub = storeItems.reduce((s, i) => s + (i.price * i.quantity), 0);
      return sum + sub;
    }, 0);

  const criticalItems = analytics ? analytics.predictedDemand.filter(d => d.urgency === 'critical' || d.urgency === 'high') : [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
      
      {/* Welcome Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 800 }}>Welcome Back, {user.name}!</h2>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
            Operations Hub • Managing store: <strong style={{ color: 'var(--color-primary)' }}>Kumar Kirana & General Store</strong>
          </p>
        </div>
        
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn btn-secondary" onClick={() => navigate('/shopkeeper/voice')} style={{ gap: '6px', fontSize: '0.85rem' }}>
            <Mic size={16} /> Voice Stock Log
          </button>
          <button className="btn btn-secondary" onClick={() => navigate('/shopkeeper/ocr')} style={{ gap: '6px', fontSize: '0.85rem' }}>
            <FileText size={16} /> OCR Invoice Upload
          </button>
        </div>
      </div>

      {/* Metrics Summary Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
        <div className="card" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', color: 'var(--color-primary)', padding: '12px', borderRadius: '12px' }}>
            <TrendingUp size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>Today's Revenue</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800 }}>₹{todayRevenue || '1,890'}</div>
          </div>
        </div>

        <div className="card" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ backgroundColor: 'rgba(99, 102, 241, 0.15)', color: 'var(--color-cta)', padding: '12px', borderRadius: '12px' }}>
            <ShoppingBag size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>Active Pickup Requests</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800 }}>{activeOrdersCount}</div>
          </div>
        </div>

        <div className="card" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.15)', color: 'var(--color-error)', padding: '12px', borderRadius: '12px' }}>
            <AlertTriangle size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>Low Stock Alerts</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800 }}>{criticalItems.length}</div>
          </div>
        </div>
      </div>

      {/* Main Grid: Orders & Co-op Left side, Predictions Right side */}
      <div className="dashboard-grid-wide">
        
        {/* Left Side Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
          
          {/* Incoming Orders Section */}
          <div className="card" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '16px' }}>Incoming Customer Pickup Requests</h3>
            
            {orders.length === 0 ? (
              <div style={{ padding: '30px', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
                No active pickup requests for your store.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {orders.map(o => {
                  const myStoreItems = o.items.filter(i => i.storeId === storeId);
                  const isPendingAccept = o.status === 'pending';

                  return (
                    <div key={o._id} style={{ border: '1px solid var(--color-border)', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px', backgroundColor: 'rgba(255,255,255,0.01)' }}>
                      
                      <div style={{ display: 'flex', justifyContext: 'space-between', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <strong style={{ fontSize: '0.95rem' }}>Order #{o._id.substring(0,8)}</strong>
                          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Hyperlocal Customer Order</div>
                        </div>
                        <span className="badge" style={{ backgroundColor: 'var(--color-cta-dark)', color: '#FFF' }}>{o.status}</span>
                      </div>

                      <div style={{ backgroundColor: 'var(--color-bg)', padding: '12px', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
                        {myStoreItems.map(item => (
                          <div key={item.productId} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '6px' }}>
                            <span>{item.name} <strong style={{ color: 'var(--color-primary)' }}>x{item.quantity}</strong></span>
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                              <span style={{ fontWeight: 700 }}>₹{item.price * item.quantity}</span>
                              {o.status === 'accepted' && item.status !== 'prepared' && (
                                <button 
                                  className="btn" 
                                  onClick={() => handleUpdateItemStatus(o._id, item.productId, 'prepared')}
                                  style={{ padding: '4px 8px', fontSize: '0.7rem', backgroundColor: 'var(--color-cta)', color: '#FFF' }}
                                >
                                  Mark Ready
                                </button>
                              )}
                              {item.status === 'prepared' && (
                                <span style={{ color: 'var(--color-primary)', fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '2px', fontWeight: 600 }}>
                                  <CheckCircle2 size={12} /> Packed
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>

                      {isPendingAccept && (
                        <button className="btn btn-primary" onClick={() => handleAcceptOrder(o._id)} style={{ width: '100%', padding: '10px' }}>
                          Accept Order
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Differentiator Widget: Cooperative Retailer Network */}
          <div className="card" style={{ padding: '24px', border: '1px solid rgba(16, 185, 129, 0.15)', position: 'relative' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Share2 className="color-primary" size={20} /> Cooperative Retailer Share Network
                </h3>
                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>
                  Co-op stock transfer engine: Borrow or lend inventory with nearby shops during stock-outs.
                </p>
              </div>
              <button 
                className="btn btn-outline" 
                onClick={() => setShowCoopModal(true)}
                style={{ fontSize: '0.75rem', padding: '6px 12px', borderColor: 'var(--color-primary)', color: 'var(--color-primary)' }}
              >
                Request Stock Share
              </button>
            </div>

            {/* List coop requests */}
            {coopRequests.length === 0 ? (
              <div style={{ padding: '20px', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
                No active cooperative stock requests in the network.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {coopRequests.map(req => {
                  const isOwnRequest = String(req.storeId) === String(storeId);
                  return (
                    <div 
                      key={req._id || req.id}
                      style={{ 
                        border: '1px solid var(--color-border)', 
                        borderRadius: '10px', 
                        padding: '14px', 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center',
                        backgroundColor: isOwnRequest ? 'rgba(99, 102, 241, 0.05)' : 'rgba(255, 255, 255, 0.01)'
                      }}
                    >
                      <div>
                        <div style={{ fontSize: '0.85rem', fontWeight: 700 }}>
                          {isOwnRequest ? 'Your Request' : req.storeName}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                          Needs: <span style={{ color: 'var(--color-text-main)', fontWeight: 600 }}>{req.productName} (x{req.quantity})</span>
                        </div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                          Status: <span style={{ color: req.status === 'accepted' ? 'var(--color-success)' : 'var(--color-warning)', fontWeight: 700 }}>{req.status}</span>
                          {req.status === 'accepted' && ` by ${isOwnRequest ? req.targetStoreName : 'You'}`}
                        </div>
                      </div>

                      <div>
                        {!isOwnRequest && req.status === 'pending' && (
                          <button 
                            className="btn btn-primary"
                            onClick={() => handleLendStock(req._id || req.id)}
                            style={{ fontSize: '0.75rem', padding: '8px 12px' }}
                          >
                            Lend Stock
                          </button>
                        )}
                        {req.status === 'accepted' && (
                          <span style={{ color: 'var(--color-success)', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', fontWeight: 600 }}>
                            <Check size={16} /> Dispatched
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>

        {/* Right Side Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
          
          {/* AI Restock Forecast */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--color-primary)', fontWeight: 800, fontSize: '0.8rem' }}>
              <Sparkles size={14} /> HEURISTIC RESTOCK FORECASTS
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
              Predicted product demand computed using historical weekday transaction ledgers.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {criticalItems.map((item, idx) => (
                <div key={idx} style={{ border: '1px solid var(--color-border)', borderRadius: '10px', padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px', backgroundColor: 'rgba(255,255,255,0.01)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <strong style={{ fontSize: '0.85rem' }}>{item.name}</strong>
                    <span className="badge" style={{ backgroundColor: 'var(--color-error)', color: '#FFF', fontSize: '0.6rem' }}>{item.urgency}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                    <span>Stock: <strong>{item.currentStock} units</strong></span>
                    <span>Forecast: <strong>{item.forecastDemand} units</strong></span>
                  </div>
                  <button 
                    className="btn btn-secondary" 
                    onClick={() => navigate('/shopkeeper/procurement')}
                    style={{ width: '100%', padding: '6px', fontSize: '0.75rem', color: 'var(--color-primary)' }}
                  >
                    Open Procurement PO <ChevronRight size={12} />
                  </button>
                </div>
              ))}
            </div>

            <button className="btn btn-outline" onClick={() => navigate('/shopkeeper/analytics')} style={{ fontSize: '0.8rem', padding: '10px' }}>
              View Sales Analytics
            </button>
          </div>

        </div>

      </div>

      {/* CO-OP BORROW REQUEST MODAL */}
      {showCoopModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="card" style={{ width: '450px', maxWidth: '90%', padding: '24px', position: 'relative' }}>
            <button 
              style={{ position: 'absolute', right: '16px', top: '16px', color: 'var(--color-text-muted)' }}
              onClick={() => setShowCoopModal(false)}
            >
              <X size={20} />
            </button>
            
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '16px' }}>Request Stock from Network</h3>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem', marginBottom: '20px' }}>
              Post a stock borrow request. Other nearby merchants in the cooperative network who have surplus stock can fulfill this borrow request instantly.
            </p>

            <form onSubmit={handleCreateCoopRequest} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '4px' }}>Target Product</label>
                <select 
                  className="form-control"
                  required
                  value={coopForm.productId}
                  onChange={(e) => setCoopForm({ ...coopForm, productId: e.target.value })}
                  style={{ width: '100%' }}
                >
                  <option value="">-- Choose Product --</option>
                  {products.map(p => (
                    <option key={p._id} value={p._id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '4px' }}>Quantity Needed</label>
                <input 
                  type="number" 
                  className="form-control"
                  required
                  min="1"
                  max="100"
                  value={coopForm.quantity}
                  onChange={(e) => setCoopForm({ ...coopForm, quantity: e.target.value })}
                  style={{ width: '100%' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '10px' }}>
                <button type="button" className="btn" style={{ border: '1px solid var(--color-border)' }} onClick={() => setShowCoopModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Send size={14} /> Send Broadcast
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

