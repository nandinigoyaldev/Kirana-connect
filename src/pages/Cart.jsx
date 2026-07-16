import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { ShoppingCart, Trash2, Plus, Minus, Sparkles, CreditCard, AlertCircle, ShoppingBag, ShieldAlert, Share2 } from 'lucide-react';

export default function Cart() {
  const navigate = useNavigate();
  const { token, user } = useAuth();
  const { cartItems, removeFromCart, updateQuantity, getCartStats, checkout, isOptimizedMode, setIsOptimizedMode } = useCart();
  const [loading, setLoading] = useState(false);
  const [showRazorpay, setShowRazorpay] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('cod');

  const [surgeActive, setSurgeActive] = useState(false);
  const [surgeFactor, setSurgeFactor] = useState(1.0);
  const [groupBasketId, setGroupBasketId] = useState(() => {
    return new URLSearchParams(window.location.search).get('groupBasketId') || '';
  });
  const [groupBasket, setGroupBasket] = useState(null);

  useEffect(() => {
    fetchSurgePrice();
    if (groupBasketId) {
      fetchGroupBasket();
      const interval = setInterval(fetchGroupBasket, 3000);
      return () => clearInterval(interval);
    }
  }, [groupBasketId]);

  const fetchSurgePrice = async () => {
    try {
      const res = await fetch('/api/pricing/surge');
      const data = await res.json();
      if (res.ok) {
        setSurgeActive(data.surgeActive);
        setSurgeFactor(data.surgeFactor);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchGroupBasket = async () => {
    try {
      const res = await fetch(`/api/group-basket/${groupBasketId}`);
      if (res.ok) {
        const data = await res.json();
        setGroupBasket(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateGroupBasket = async () => {
    try {
      const res = await fetch('/api/group-basket/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ creatorName: user.name })
      });
      const data = await res.json();
      if (res.ok) {
        const bid = data._id || data.id;
        setGroupBasketId(bid);
        window.history.pushState({}, '', `${window.location.pathname}?groupBasketId=${bid}`);
        alert("Group basket created! Share the link at the top to split cart additions.");
      }
    } catch (err) {
      alert("Failed to create group basket");
    }
  };

  const { subtotal, deliveryFee, taxes, total } = getCartStats();
  const adjustedTotal = Math.round((subtotal + deliveryFee + taxes) * surgeFactor);

  const handleCheckoutClick = () => {
    if (paymentMethod === 'razorpay') {
      setShowRazorpay(true);
    } else {
      handleFinalizeCheckout();
    }
  };

  const handleFinalizeCheckout = async () => {
    setLoading(true);
    try {
      await checkout(paymentMethod);
      setShowRazorpay(false);
      navigate('/customer/orders'); // Navigate to active orders
    } catch (err) {
      console.error(err);
      alert("Checkout failed: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (cartItems.length === 0) {
    return (
      <div className="card" style={{ maxWidth: '600px', margin: '40px auto', textAlign: 'center', padding: '40px' }}>
        <ShoppingCart size={48} style={{ color: 'var(--color-text-muted)', marginBottom: '16px' }} />
        <h3 style={{ fontSize: '1.25rem', marginBottom: '8px' }}>Your Shopping Basket is Empty</h3>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', marginBottom: '24px' }}>
          Browse stores and add products to your basket to use our hyperlocal fulfillment network.
        </p>
        <button className="btn btn-primary" onClick={() => navigate('/customer')}>
          Continue Shopping
        </button>
      </div>
    );
  }

  return (
    <div className="dashboard-grid">

      {surgeActive && (
        <div style={{ backgroundColor: 'rgba(13, 148, 136, 0.1)', color: 'var(--color-secondary)', padding: '12px 20px', borderRadius: '8px', fontSize: '0.85rem', display: 'flex', gap: '8px', alignItems: 'center', fontWeight: 600, gridColumn: 'span 2', border: '1px solid var(--color-border)' }}>
          <AlertCircle size={16} />
          Dynamic weather/grid surge is active: Grand Total reflects a {surgeFactor}x modifier due to bad weather/peak hours.
        </div>
      )}
      
      {/* Left: Cart Items List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        {/* Roommate Share Portal */}
        {groupBasketId ? (
          <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--color-primary-light)', padding: '16px', borderRadius: '12px' }}>
            <div>
              <span style={{ fontSize: '0.7rem', color: 'var(--color-secondary)', fontWeight: 800, textTransform: 'uppercase' }}>Active Roommate Basket</span>
              <strong style={{ display: 'block', fontSize: '0.85rem' }}>Creator: {groupBasket?.creatorName || 'Roommate'}</strong>
            </div>
            <button 
              className="btn btn-outline" 
              onClick={() => {
                navigator.clipboard.writeText(window.location.href);
                alert("Roommate basket link copied!");
              }}
              style={{ fontSize: '0.75rem', gap: '6px' }}
            >
              <Share2 size={12} /> Copy Share Link
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#FFFFFF', padding: '16px', borderRadius: '12px', border: '1px dashed var(--color-border)' }}>
            <span className="text-xs text-muted">Shopping with flatmates?</span>
            <button className="btn btn-outline" onClick={handleCreateGroupBasket} style={{ fontSize: '0.75rem' }}>
              Create Flatmate Share Basket
            </button>
          </div>
        )}

        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, borderBottom: '1px solid var(--color-border)', paddingBottom: '14px' }}>
            Shopping Basket ({cartItems.reduce((sum, i) => sum + i.quantity, 0)} items)
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {cartItems.map((item) => (
              <div key={`${item.product._id}-${item.storeId}`} style={{ display: 'flex', gap: '16px', alignItems: 'center', borderBottom: '1px solid var(--color-border)', paddingBottom: '16px' }}>
                
                <div style={{ width: '64px', height: '64px', borderRadius: '8px', overflow: 'hidden', backgroundColor: 'var(--color-bg)' }}>
                  <img 
                    src={item.product.image} 
                    alt={item.product.name} 
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                  />
                </div>

                <div style={{ flex: 1 }}>
                  <h4 style={{ fontSize: '0.9rem', fontWeight: 600 }}>{item.product.name}</h4>
                  <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Unit: {item.product.unit}</p>
                  <strong style={{ fontSize: '0.9rem', color: 'var(--color-text-main)' }}>₹{item.product.price}</strong>
                </div>

                {/* Quantity Controls */}
                <div style={{ display: 'flex', alignItems: 'center', border: '1px solid var(--color-border)', borderRadius: '20px', padding: '2px' }}>
                  <button 
                    onClick={() => updateQuantity(item.product._id, item.quantity - 1, item.storeId)}
                    style={{ padding: '4px 8px', color: 'var(--color-text-muted)' }}
                  >
                    <Minus size={14} />
                  </button>
                  <span style={{ fontSize: '0.85rem', fontWeight: 600, minWidth: '24px', textAlign: 'center' }}>{item.quantity}</span>
                  <button 
                    onClick={() => updateQuantity(item.product._id, item.quantity + 1, item.storeId)}
                    style={{ padding: '4px 8px', color: 'var(--color-text-muted)' }}
                  >
                    <Plus size={14} />
                  </button>
                </div>

                <button 
                  onClick={() => removeFromCart(item.product._id, item.storeId)}
                  style={{ padding: '8px', color: 'var(--color-error)' }}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>

          {/* Group basket active details split render */}
          {groupBasket && groupBasket.items.length > 0 && (
            <div style={{ borderTop: '1px dashed var(--color-border)', paddingTop: '16px', marginTop: '16px' }}>
              <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', display: 'block', fontWeight: 700, marginBottom: '10px' }}>ITEMS ADDED BY FLATMATES:</span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {groupBasket.items.map((item, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', backgroundColor: '#F8FAFC', padding: '10px', borderRadius: '8px' }}>
                    <div>
                      <strong>{item.product.name}</strong> x{item.quantity}
                      <span style={{ display: 'block', fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>Added by: {item.addedBy}</span>
                    </div>
                    <strong>₹{item.product.price * item.quantity}</strong>
                  </div>
                ))}
              </div>
              
              <div style={{ backgroundColor: 'var(--color-primary-light)', padding: '12px', borderRadius: '8px', marginTop: '12px', fontSize: '0.8rem' }}>
                <strong style={{ display: 'block', marginBottom: '6px', color: 'var(--color-secondary)' }}>Flatmate Split Bill Projection:</strong>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div>You ({user?.name || 'Customer'}): <strong>₹{adjustedTotal}</strong> (With delivery & surge)</div>
                  {Array.from(new Set(groupBasket.items.map(i => i.addedBy))).map(name => {
                    const flatmateTotal = groupBasket.items.filter(i => i.addedBy === name).reduce((sum, i) => sum + i.product.price * i.quantity, 0);
                    return <div key={name}>{name}: <strong>₹{flatmateTotal}</strong></div>;
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right: Order Summary & Checkout Panel */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        {/* AI Splitting Banner */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--color-primary)', fontWeight: 700, fontSize: '0.8rem' }}>
            <Sparkles size={14} /> AI OPTIMIZATION VALUE
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
            Before checking out, run our AI optimization algorithm to split items across shops for the lowest aggregate cost.
          </p>
          <button 
            className="btn btn-secondary" 
            onClick={() => navigate('/customer/optimize')}
            style={{ width: '100%', fontSize: '0.8rem', padding: '8px' }}
          >
            Optimize Basket Splits
          </button>
        </div>

        {/* Totals */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h4 style={{ fontSize: '0.95rem', fontWeight: 700 }}>Payment Summary</h4>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.85rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--color-text-muted)' }}>
              <span>Subtotal</span>
              <span>₹{subtotal}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--color-text-muted)' }}>
              <span>Delivery Fee</span>
              <span>{deliveryFee === 0 ? 'FREE' : `₹${deliveryFee}`}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--color-text-muted)' }}>
              <span>GST (5%)</span>
              <span>₹{taxes}</span>
            </div>
            {surgeActive && (
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--color-secondary)', fontWeight: 600 }}>
                <span>Surge Modifier</span>
                <span>{surgeFactor}x</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '1rem', borderTop: '1px solid var(--color-border)', paddingTop: '10px', marginTop: '4px' }}>
              <span>Grand Total</span>
              <span style={{ color: 'var(--color-primary)' }}>₹{adjustedTotal}</span>
            </div>
          </div>

          {/* Payment Method Selector */}
          <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '14px', marginTop: '4px' }}>
            <label className="form-label">Select Payment Method</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', cursor: 'pointer' }}>
                <input 
                  type="radio" 
                  name="payMethod" 
                  checked={paymentMethod === 'cod'} 
                  onChange={() => setPaymentMethod('cod')} 
                />
                Cash on Delivery (COD)
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', cursor: 'pointer' }}>
                <input 
                  type="radio" 
                  name="payMethod" 
                  checked={paymentMethod === 'razorpay'} 
                  onChange={() => setPaymentMethod('razorpay')} 
                />
                Razorpay Checkout (Simulated)
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', cursor: 'pointer', color: 'var(--color-primary)', fontWeight: 600 }}>
                <input 
                  type="radio" 
                  name="payMethod" 
                  checked={paymentMethod === 'khata'} 
                  onChange={() => setPaymentMethod('khata')} 
                />
                Digital Khata (Buy Now, Pay Later)
              </label>
            </div>
          </div>

          <button 
            className="btn btn-primary" 
            onClick={handleCheckoutClick}
            disabled={loading}
            style={{ width: '100%', padding: '12px' }}
          >
            Place Hyperlocal Order
          </button>
        </div>
      </div>

      {/* RAZORPAY MODAL SIMULATION */}
      {showRazorpay && (
        <div className="modal-overlay" style={{ zIndex: 1200 }}>
          <div className="modal-content" style={{ maxWidth: '380px', padding: '0', overflow: 'hidden' }}>
            {/* Razorpay Header */}
            <div style={{ backgroundColor: '#0c2240', color: 'white', padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', opacity: 0.8 }}>Payment Gateway</div>
                <strong style={{ fontSize: '1rem', color: 'white' }}>Razorpay Checkout</strong>
              </div>
              <ShieldAlert size={24} style={{ color: '#00cc66' }} />
            </div>

            {/* Razorpay Details */}
            <div style={{ padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', fontSize: '0.9rem' }}>
                <span style={{ color: 'var(--color-text-muted)' }}>Paying To:</span>
                <strong style={{ color: 'var(--color-text-main)' }}>Kirana Connect Platform</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px', fontSize: '0.9rem' }}>
                <span style={{ color: 'var(--color-text-muted)' }}>Amount Due:</span>
                <strong style={{ color: 'var(--color-primary)', fontSize: '1.1rem' }}>₹{total}</strong>
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontSize: '0.75rem' }}>Select Mock Card</label>
                <select className="form-control" style={{ fontSize: '0.85rem' }}>
                  <option>HDFC Visa Debit Card (**** 4242)</option>
                  <option>SBI Rupay Debit Card (**** 9876)</option>
                  <option>UPI Instant Pay (username@okhdfc)</option>
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '20px' }}>
                <button className="btn btn-outline" onClick={() => setShowRazorpay(false)}>
                  Cancel
                </button>
                <button 
                  className="btn btn-primary" 
                  onClick={handleFinalizeCheckout} 
                  disabled={loading}
                  style={{ backgroundColor: '#2563EB' }} // Razorpay blue
                >
                  {loading ? 'Processing...' : 'Pay ₹' + total}
                </button>
              </div>
            </div>
            
            <div style={{ backgroundColor: 'var(--color-bg)', padding: '10px', fontSize: '0.65rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
              🔒 Secured by Razorpay Escrow Engine. Real money will not be charged.
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
