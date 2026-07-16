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
  const [debtors, setDebtors] = useState([]);
  const [shoppersCount, setShoppersCount] = useState(4);
  const [showCoopModal, setShowCoopModal] = useState(false);
  const [coopForm, setCoopForm] = useState({ productId: '', quantity: 10 });
  const [loading, setLoading] = useState(true);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [selectedDebtor, setSelectedDebtor] = useState(null);

  // Stock Swap states
  const [swaps, setSwaps] = useState([]);
  const [showSwapModal, setShowSwapModal] = useState(false);
  const [swapForm, setSwapForm] = useState({
    toStoreId: '',
    offerItem: { name: 'Amul Gold Milk (1L)', qty: 10 },
    demandItem: { name: 'Britannia Premium Bread', qty: 5 }
  });

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(() => {
      setShoppersCount(prev => Math.max(2, Math.min(8, prev + (Math.random() > 0.5 ? 1 : -1))));
    }, 4000);
    return () => clearInterval(interval);
  }, [activeOrders]);

  const fetchDashboardData = async () => {
    try {
      const ordRes = await fetch('/api/orders/shopkeeper', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const ordData = await ordRes.json();
      setOrders(ordData.orders || []);

      const analRes = await fetch('/api/analytics/shopkeeper', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const analData = await analRes.json();
      setAnalytics(analData);

      const coopRes = await fetch('/api/coop/requests', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const coopData = await coopRes.json();
      setCoopRequests(coopData.requests || []);

      const prodRes = await fetch('/api/products');
      const prodData = await prodRes.json();
      setProducts(prodData.products || []);

      // Fetch swaps
      const swapRes = await fetch('/api/inventory/swap', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (swapRes.ok) {
        const swapData = await swapRes.json();
        setSwaps(swapData);
      }

      // Fetch debtors
      const khataRes = await fetch('/api/khata/merchant', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (khataRes.ok) {
        const khataData = await khataRes.json();
        setDebtors(khataData);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSendReminder = async (customerId) => {
    try {
      const res = await fetch('/api/khata/remind', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ customerId })
      });
      const data = await res.json();
      alert(data.message || 'Udhaar reminder alert sent.');
    } catch (err) {
      alert('Failed to send reminder alert.');
    }
  };

  const handleRecordPayment = async (customerId, amount) => {
    if (!amount) return;
    try {
      const res = await fetch('/api/khata/pay', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ customerId, amount })
      });
      const data = await res.json();
      alert(data.message || 'Payment recorded.');
      setPaymentAmount('');
      setSelectedDebtor(null);
      fetchDashboardData();
    } catch (err) {
      alert('Failed to record repayment.');
    }
  };

  const handleCreateSwap = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/inventory/swap/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(swapForm)
      });
      if (res.ok) {
        setShowSwapModal(false);
        fetchDashboardData();
        alert("Stock Swap proposed to target store!");
      }
    } catch (err) {
      alert("Failed to propose swap.");
    }
  };

  const handleRespondSwap = async (swapId, action) => {
    try {
      const res = await fetch(`/api/inventory/swap/${swapId}/respond`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ action })
      });
      const data = await res.json();
      alert(data.message || "Swap response recorded.");
      fetchDashboardData();
    } catch (err) {
      alert("Error responding to swap offer.");
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
          <div style={{ backgroundColor: 'var(--color-primary-light)', color: 'var(--color-primary)', padding: '12px', borderRadius: '12px' }}>
            <TrendingUp size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>Today's Revenue</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800 }}>₹{todayRevenue || '1,890'}</div>
          </div>
        </div>

        <div className="card" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ backgroundColor: 'rgba(99, 102, 241, 0.15)', color: 'var(--color-primary)', padding: '12px', borderRadius: '12px' }}>
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

        <div className="card" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ backgroundColor: 'rgba(249, 115, 22, 0.15)', color: 'var(--color-secondary)', padding: '12px', borderRadius: '12px' }}>
            <Activity size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>Outstanding Udhaar Credit</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--color-secondary)' }}>
              ₹{debtors.reduce((sum, d) => sum + (d.khataDebt || 0), 0)}
            </div>
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

      {/* NEW: Digital Udhaar Ledger & Live Traffic Analytics Grid */}
      <div className="grid-2" style={{ marginTop: '30px' }}>
        
        {/* Udhaar Credit Book */}
        <div className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0 }}>Digital Khata Book (Udhaar Ledger)</h3>
            <span className="badge" style={{ backgroundColor: 'var(--color-primary-light)', color: 'var(--color-primary)', fontSize: '0.75rem', fontWeight: 700 }}>
              {debtors.length} active debtors
            </span>
          </div>
          
          {debtors.length === 0 ? (
            <p className="text-sm text-muted" style={{ margin: 0, textAlign: 'center', padding: '20px 0' }}>
              No outstanding customer credits. Nice work!
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {debtors.map(debtor => (
                <div key={debtor._id} style={{ border: '1px solid var(--color-border)', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px', backgroundColor: 'var(--color-bg)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <strong style={{ fontSize: '0.9rem', color: 'var(--color-text-main)' }}>{debtor.name}</strong>
                        <span className="badge" style={{
                          backgroundColor: debtor.khataScore === 'A+' ? 'rgba(13, 148, 136, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                          color: debtor.khataScore === 'A+' ? 'var(--color-success)' : 'var(--color-warning)',
                          fontSize: '0.6rem',
                          padding: '2px 6px'
                        }}>
                          Score: {debtor.khataScore || 'A+'}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>{debtor.phone || 'No phone registered'}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', display: 'block' }}>Outstanding Balance</span>
                      <strong style={{ fontSize: '1rem', color: 'var(--color-error)' }}>₹{debtor.khataDebt}</strong>
                    </div>
                  </div>

                  {selectedDebtor === debtor._id ? (
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', backgroundColor: '#FFFFFF', padding: '8px', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
                      <input
                        type="number"
                        placeholder="Amt"
                        className="form-control"
                        style={{ padding: '6px', fontSize: '0.8rem', flex: 1 }}
                        value={paymentAmount}
                        onChange={(e) => setPaymentAmount(e.target.value)}
                      />
                      <button 
                        className="btn btn-primary"
                        onClick={() => handleRecordPayment(debtor._id, paymentAmount)}
                        style={{ fontSize: '0.75rem', padding: '6px 12px' }}
                      >
                        Settle
                      </button>
                      <button 
                        className="btn"
                        onClick={() => setSelectedDebtor(null)}
                        style={{ fontSize: '0.75rem', padding: '6px', border: '1px solid var(--color-border)' }}
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                      <button
                        className="btn btn-outline"
                        onClick={() => handleSendReminder(debtor._id)}
                        style={{ fontSize: '0.75rem', padding: '6px' }}
                      >
                        Send WhatsApp Alert
                      </button>
                      <button
                        className="btn btn-secondary"
                        onClick={() => { setSelectedDebtor(debtor._id); setPaymentAmount(''); }}
                        style={{ fontSize: '0.75rem', padding: '6px' }}
                      >
                        Record Repayment
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Live Traffic Analytics */}
        <div className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0 }}>Live Catalog Foot Traffic</h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', margin: '4px 0 0 0' }}>
              Real-time customer views on your store listings.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', backgroundColor: 'var(--color-primary-light)', padding: '16px', borderRadius: '12px' }}>
            <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: 'var(--color-accent)', animation: 'pulse-ring 1.5s infinite' }}></div>
            <div>
              <strong style={{ fontSize: '1.5rem', color: 'var(--color-primary)', display: 'block', lineHeight: 1 }}>{shoppersCount}</strong>
              <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>Active Shoppers Viewing Now</span>
            </div>
          </div>

          {/* SVG Animated Sparkline Chart */}
          <div style={{ flex: 1, minHeight: '120px', display: 'flex', alignItems: 'flex-end', borderBottom: '2px solid var(--color-border)', position: 'relative' }}>
            <svg viewBox="0 0 100 30" style={{ width: '100%', height: '100px', overflow: 'visible' }}>
              <defs>
                <linearGradient id="grad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="var(--color-primary)" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="var(--color-primary)" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              <path
                d="M 0 25 C 20 18, 30 22, 50 10 C 70 20, 80 8, 100 15 L 100 30 L 0 30 Z"
                fill="url(#grad)"
              />
              <path
                d="M 0 25 C 20 18, 30 22, 50 10 C 70 20, 80 8, 100 15"
                fill="none"
                stroke="var(--color-primary)"
                strokeWidth="2"
                strokeLinecap="round"
              />
              {/* Dynamic point on sparkline */}
              <circle cx="100" cy="15" r="3" fill="var(--color-secondary)" />
            </svg>
            <div style={{ position: 'absolute', left: 0, top: 0, fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>8 AM</div>
            <div style={{ position: 'absolute', right: 0, top: 0, fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>Now</div>
          </div>
        </div>

      </div>

      {/* Stock Swap Agreements Panel */}
      <div className="card" style={{ marginTop: '30px', padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0 }}>Stock Swap Exchange (B2B Trade Agreements)</h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', margin: '4px 0 0 0' }}>
              Exchange surplus items with other local kiranas to fulfill stock imbalances without spending cash.
            </p>
          </div>
          <button 
            className="btn btn-outline" 
            onClick={() => setShowSwapModal(true)}
            style={{ fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            Propose Stock Swap
          </button>
        </div>

        {swaps.length === 0 ? (
          <p className="text-sm text-muted" style={{ textAlign: 'center', padding: '24px 0', margin: 0 }}>
            No swap offers active at this time.
          </p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            {swaps.map(swap => {
              const isOutgoing = swap.fromStoreId === user.storeId;
              return (
                <div key={swap._id} style={{ border: '1px solid var(--color-border)', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px', backgroundColor: 'var(--color-bg)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.7rem', color: 'var(--color-secondary)', fontWeight: 800, textTransform: 'uppercase' }}>
                      {isOutgoing ? `PROPOSED TO: ${swap.toStoreName}` : `RECEIVED FROM: ${swap.fromStoreName}`}
                    </span>
                    <span className="badge" style={{ 
                      fontSize: '0.65rem', 
                      backgroundColor: swap.status === 'pending' ? '#FEF3C7' : (swap.status === 'approved' ? '#D1FAE5' : '#FEE2E2'),
                      color: swap.status === 'pending' ? '#D97706' : (swap.status === 'approved' ? '#059669' : '#DC2626')
                    }}>
                      {swap.status.toUpperCase()}
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '0.8rem' }}>
                    <div style={{ borderRight: '1px solid var(--color-border)', paddingRight: '8px' }}>
                      <span style={{ color: 'var(--color-text-muted)', display: 'block', fontSize: '0.65rem' }}>OFFERING:</span>
                      <strong>{swap.offerItem.qty}x {swap.offerItem.name}</strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--color-text-muted)', display: 'block', fontSize: '0.65rem' }}>DEMANDING:</span>
                      <strong>{swap.demandItem.qty}x {swap.demandItem.name}</strong>
                    </div>
                  </div>

                  {swap.status === 'pending' && !isOutgoing && (
                    <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                      <button 
                        className="btn btn-primary" 
                        onClick={() => handleRespondSwap(swap._id, 'approve')}
                        style={{ flex: 1, fontSize: '0.75rem', padding: '6px' }}
                      >
                        Accept Swap
                      </button>
                      <button 
                        className="btn btn-outline" 
                        onClick={() => handleRespondSwap(swap._id, 'reject')}
                        style={{ flex: 1, fontSize: '0.75rem', padding: '6px' }}
                      >
                        Decline
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
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

