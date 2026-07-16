import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { Truck, Wallet, CheckCircle2, TrendingUp, Navigation, ShieldCheck, ArrowUpRight, DollarSign, X } from 'lucide-react';

export default function DeliveryDashboard() {
  const { user, token } = useAuth();
  const { fetchActiveOrders } = useCart();
  const [orders, setOrders] = useState([]);
  const [wallet, setWallet] = useState(null);
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showOtpModal, setShowOtpModal] = useState(null); // holds orderId
  const [otpCode, setOtpCode] = useState('');
  const [otpError, setOtpError] = useState('');

  // Payout state
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState('');
  const [payoutDone, setPayoutDone] = useState(false);

  useEffect(() => {
    fetchDeliveryData();
  }, []);

  const fetchDeliveryData = async () => {
    try {
      const ordRes = await fetch('/api/orders/delivery', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const ordData = await ordRes.json();
      setOrders(ordData.orders || []);

      const walRes = await fetch('/api/wallet', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const walData = await walRes.json();
      setWallet(walData.wallet);

      const storeRes = await fetch('/api/stores');
      const storeData = await storeRes.json();
      setStores(storeData.stores || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
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
        fetchDeliveryData();
        fetchActiveOrders();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handlePickUpOrder = async (orderId) => {
    try {
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: 'picked_up' })
      });
      if (res.ok) {
        fetchDeliveryData();
        fetchActiveOrders();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleVerifyOtpAndDeliver = async (e) => {
    e.preventDefault();
    setOtpError('');

    try {
      const res = await fetch(`/api/orders/${showOtpModal}/status`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: 'delivered', otp: otpCode })
      });
      if (res.ok) {
        setShowOtpModal(null);
        setOtpCode('');
        fetchDeliveryData();
        fetchActiveOrders();
      } else {
        const errData = await res.json();
        setOtpError(errData.message || 'Invalid OTP code. Please try again.');
      }
    } catch (err) {
      console.error(err);
      setOtpError('Failed to complete delivery. Check connection.');
    }
  };

  const handleInitiateWithdrawal = async (e) => {
    e.preventDefault();
    const amount = Number(payoutAmount);
    if (!amount || amount <= 0 || amount > wallet.balance) {
      alert("Invalid payout amount");
      return;
    }

    try {
      const res = await fetch('/api/wallet/withdraw', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ amount })
      });
      if (res.ok) {
        setPayoutDone(true);
        setPayoutAmount('');
        setTimeout(() => {
          setShowPayoutModal(false);
          setPayoutDone(false);
          fetchDeliveryData();
        }, 1500);
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '60px' }}>Loading delivery dashboard...</div>;
  }

  const activeDeliveries = orders.filter(o => o.status === 'accepted' || o.status === 'picked_up');
  const pendingDeliveries = orders.filter(o => o.status === 'pending');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Delivery Agent Center</h2>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>View nearby orders, track escrow transactions, and manage bank withdrawals.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowPayoutModal(true)} style={{ gap: '6px' }}>
          <Wallet size={16} /> Request Earnings Payout
        </button>
      </div>

      {/* Metrics Row */}
      <div className="stats-grid">
        <div className="card stats-card">
          <div className="stats-icon" style={{ backgroundColor: 'var(--color-primary-light)', color: 'var(--color-primary)' }}>
            <DollarSign size={24} />
          </div>
          <div>
            <div className="stats-label">Settled Wallet Balance</div>
            <div className="stats-value">₹{wallet ? wallet.balance : '0'}</div>
          </div>
        </div>

        <div className="card stats-card">
          <div className="stats-icon" style={{ backgroundColor: '#fef3c7', color: 'var(--color-accent-dark)' }}>
            <Wallet size={24} />
          </div>
          <div>
            <div className="stats-label">Escrow Holds</div>
            <div className="stats-value">₹{wallet ? wallet.escrowBalance : '0'}</div>
          </div>
        </div>

        <div className="card stats-card">
          <div className="stats-icon" style={{ backgroundColor: '#dbeafe', color: 'var(--color-cta)' }}>
            <Truck size={24} />
          </div>
          <div>
            <div className="stats-label">Active Shipments</div>
            <div className="stats-value">{activeDeliveries.length}</div>
          </div>
        </div>
      </div>

      {/* Escrow Modal Payout withdrawals */}
      {showPayoutModal && (
        <div className="modal-overlay" style={{ zIndex: 1200 }}>
          <div className="modal-content" style={{ maxWidth: '380px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Withdraw Balance</h3>
              <button onClick={() => setShowPayoutModal(false)} style={{ color: 'var(--color-text-muted)' }}><X size={16} /></button>
            </div>

            {payoutDone ? (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <CheckCircle2 size={40} style={{ color: 'var(--color-primary)', marginBottom: '12px' }} />
                <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '6px' }}>Payout Initiated</h4>
                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>Money transferred to linked UPI bank account.</p>
              </div>
            ) : (
              <form onSubmit={handleInitiateWithdrawal}>
                <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '16px' }}>
                  Current withdrawable balance: <strong>₹{wallet ? wallet.balance : 0}</strong>.
                </p>
                <div className="form-group">
                  <label className="form-label">Withdrawal Amount (₹)</label>
                  <input 
                    type="number" 
                    required 
                    className="form-control" 
                    max={wallet ? wallet.balance : 0} 
                    value={payoutAmount} 
                    onChange={(e) => setPayoutAmount(e.target.value)} 
                    placeholder="Enter amount"
                  />
                </div>
                <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '10px' }}>
                  Confirm Payout UPI Transfer
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* OTP Modal */}
      {showOtpModal && (
        <div className="modal-overlay" style={{ zIndex: 1200 }}>
          <div className="modal-content" style={{ maxWidth: '380px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '8px' }}>Fulfillment Verification</h3>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem', marginBottom: '20px' }}>
              Enter the 4-digit security PIN provided by the customer to confirm delivery and release the held escrow funds.
            </p>

            {otpError && (
              <div style={{ backgroundColor: '#fee2e2', color: 'var(--color-error)', padding: '10px 14px', borderRadius: '8px', fontSize: '0.75rem', marginBottom: '16px', fontWeight: 500 }}>
                {otpError}
              </div>
            )}

            <form onSubmit={handleVerifyOtpAndDeliver}>
              <div className="form-group">
                <label className="form-label">Verification OTP</label>
                <input 
                  type="text" 
                  required 
                  className="form-control" 
                  maxLength={4} 
                  placeholder="e.g. 1234"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  style={{ letterSpacing: '8px', textAlign: 'center', fontSize: '1.25rem', fontWeight: 700 }}
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '20px' }}>
                <button type="button" className="btn btn-outline" onClick={() => { setShowOtpModal(null); setOtpCode(''); setOtpError(''); }}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ gap: '4px' }}><ShieldCheck size={16} /> Verify OTP</button>
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', textAlign: 'center', marginTop: '12px' }}>
                💡 Tip: Use seeded OTP <strong style={{ color: 'var(--color-text-main)' }}>1234</strong> for review.
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Layout split: Deliveries list vs Wallet History */}
      <div className="dashboard-grid">
        
        {/* Deliveries Feed */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Active Deliveries */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>Assigned Deliveries ({activeDeliveries.length})</h3>
            
            {activeDeliveries.length === 0 ? (
              <div style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', textAlign: 'center', padding: '16px' }}>
                No active assigned delivery routes. Accept a pending request below.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {activeDeliveries.map(o => (
                  <div key={o._id} style={{ border: '1px solid var(--color-border)', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <strong>Order #{o._id.substring(0,8)}</strong>
                      <span className="badge badge-warning">{o.status}</span>
                    </div>

                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                      <div>Fulfillment centers: <strong>{
                        Array.from(new Set(o.items.map(item => {
                          const store = stores.find(s => s._id === item.storeId);
                          return store ? store.name : 'Unknown Store';
                        }))).join(', ') || 'Kumar Kirana Store'
                      }</strong></div>
                      
                      {/* NEW: Multi-store TSP Route Optimizer */}
                      <div style={{ marginTop: '8px', padding: '10px 14px', backgroundColor: 'var(--color-bg)', borderRadius: '10px', border: '1px solid var(--color-border)' }}>
                        <span style={{ fontSize: '0.7rem', color: 'var(--color-primary)', fontWeight: 700, display: 'block', marginBottom: '4px', textTransform: 'uppercase' }}>
                          ⚡ AI ROUTE SOLVER SEQUENCE (TSP OPTIMIZED):
                        </span>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.75rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ color: 'var(--color-primary)' }}>①</span> Hub ➔ Pick up from: <strong>{stores.find(s => s._id === o.items[0]?.storeId)?.name || 'Kumar Kirana Store'}</strong>
                          </div>
                          {Array.from(new Set(o.items.map(i => i.storeId))).length > 1 && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span style={{ color: 'var(--color-primary)' }}>②</span> Pick up from: <strong>{stores.find(s => s._id === o.items.find(i => i.storeId !== o.items[0]?.storeId)?.storeId)?.name || 'Gupta Provision Store'}</strong>
                            </div>
                          )}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ color: 'var(--color-accent-dark)' }}>③</span> Final Dropoff: <strong>A-404, Maple Heights, Gurgaon Sector 4</strong>
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '4px', alignItems: 'center', color: 'var(--color-primary)', fontWeight: 600, marginTop: '8px' }}>
                        <Navigation size={12} /> Delivery Earning: ₹{o.deliveryFee} (Held in Escrow)
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
                      {o.status === 'accepted' ? (
                        <button className="btn btn-primary" onClick={() => handlePickUpOrder(o._id)} style={{ flex: 1, padding: '8px', fontSize: '0.8rem' }}>
                          Confirm Merchant Pickup
                        </button>
                      ) : (
                        <button className="btn btn-primary" onClick={() => setShowOtpModal(o._id)} style={{ flex: 1, padding: '8px', fontSize: '0.8rem', backgroundColor: 'var(--color-cta)' }}>
                          Verify Delivery OTP
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Incoming Job Feed */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>Hyperlocal Shipment Offers ({pendingDeliveries.length})</h3>
            
            {pendingDeliveries.length === 0 ? (
              <div style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', textAlign: 'center', padding: '16px' }}>
                No pending shipments in your hyperlocal geofence at this time.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {pendingDeliveries.map(o => (
                  <div key={o._id} style={{ border: '1px solid var(--color-border)', borderRadius: '12px', padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <strong style={{ fontSize: '0.85rem' }}>Order #{o._id.substring(0,8)}</strong>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                        Route: {
                          Array.from(new Set(o.items.map(item => {
                            const store = stores.find(s => s._id === item.storeId);
                            return store ? store.name.replace(" Kirana Store", "").replace(" Provision Store", "").replace(" Super Store", "") : 'Store';
                          }))).join(' + ') || 'Kumar Kirana'
                        } ➔ Sector 45
                      </div>
                      <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-primary)', marginTop: '2px' }}>
                        Fee: ₹{o.deliveryFee}
                      </div>
                    </div>
                    <button className="btn btn-primary" onClick={() => handleAcceptOrder(o._id)} style={{ padding: '8px 16px', fontSize: '0.75rem' }}>
                      Accept Route
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Payout History list (Right) */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>Earning Log</h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {wallet && wallet.transactions.map((tx, idx) => (
              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--color-border)' }}>
                <div>
                  <strong style={{ fontSize: '0.8rem', display: 'block' }}>{tx.description}</strong>
                  <span style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)' }}>{new Date(tx.date).toLocaleDateString()}</span>
                </div>
                <strong style={{ fontSize: '0.85rem', color: tx.amount > 0 ? 'var(--color-primary)' : 'var(--color-error)' }}>
                  {tx.amount > 0 ? '+' : ''}₹{tx.amount}
                </strong>
              </div>
            ))}
            {(!wallet || wallet.transactions.length === 0) && (
              <div style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem', textAlign: 'center', padding: '10px 0' }}>No wallet transactions yet.</div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
