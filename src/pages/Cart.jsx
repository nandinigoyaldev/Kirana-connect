import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { ShoppingCart, Trash2, Plus, Minus, Sparkles, CreditCard, AlertCircle, ShoppingBag, ShieldAlert } from 'lucide-react';

export default function Cart() {
  const navigate = useNavigate();
  const { cartItems, removeFromCart, updateQuantity, getCartStats, checkout, isOptimizedMode, setIsOptimizedMode, optimizeBasket } = useCart();
  const [loading, setLoading] = useState(false);
  const [showRazorpay, setShowRazorpay] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('cod');

  const { subtotal, deliveryFee, taxes, total } = getCartStats();

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
      
      {/* Left: Cart Items List */}
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
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '1rem', borderTop: '1px solid var(--color-border)', paddingTop: '10px', marginTop: '4px' }}>
              <span>Grand Total</span>
              <span style={{ color: 'var(--color-primary)' }}>₹{total}</span>
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
