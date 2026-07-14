import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { Sparkles, ArrowRight, CheckCircle2, AlertCircle, TrendingDown, Store, ArrowLeft } from 'lucide-react';

export default function BasketOptimizer() {
  const navigate = useNavigate();
  const { cartItems, optimizeBasket, checkout } = useCart();
  const [optData, setOptData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  useEffect(() => {
    if (cartItems.length > 0) {
      runOptimization();
    } else {
      setLoading(false);
    }
  }, [cartItems]);

  const runOptimization = async () => {
    setLoading(true);
    try {
      const data = await optimizeBasket();
      setOptData(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckoutOptimized = async () => {
    setCheckoutLoading(true);
    try {
      // Calls checkout with isOptimized: true
      await checkout('cod');
      navigate('/customer/orders');
    } catch (err) {
      alert("Checkout failed: " + err.message);
    } finally {
      setCheckoutLoading(false);
    }
  };

  if (cartItems.length === 0) {
    return (
      <div className="card" style={{ maxWidth: '600px', margin: '40px auto', textAlign: 'center', padding: '40px' }}>
        <AlertCircle size={48} style={{ color: 'var(--color-text-muted)', marginBottom: '16px' }} />
        <h3 style={{ fontSize: '1.25rem', marginBottom: '8px' }}>No items in Cart to Optimize</h3>
        <button className="btn btn-primary" onClick={() => navigate('/customer')}>
          Go to Product Feed
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 20px' }}>
        <div className="live-pulse" style={{ width: '40px', height: '40px', marginBottom: '24px' }}></div>
        <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '8px' }}>AI Hyperlocal Optimizer</h3>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>Comparing inventory tables and delivery distances across nearby stores...</p>
      </div>
    );
  }

  const { singleStoreOption, splitOrders, combinedSplitTotal, recommendationReason, confidenceScore } = optData || {};

  // Calculate savings
  const singleTotal = singleStoreOption ? singleStoreOption.total : 0;
  const splitTotal = combinedSplitTotal || 0;
  const savings = singleTotal - splitTotal;
  const isSplitBetter = savings > 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button className="btn btn-outline" onClick={() => navigate('/customer/cart')} style={{ borderRadius: '50%', width: '40px', height: '40px', padding: 0 }}>
          <ArrowLeft size={16} />
        </button>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>AI Basket Split Recommendation</h2>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>Calculated using live inventories and routing coordinates</p>
        </div>
      </div>

      {/* Comparison Overview Widget */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
        
        {/* Comparison card */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px', border: isSplitBetter ? '1px solid var(--color-border)' : '2px solid var(--color-primary)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Cheapest Single Store</span>
            {!isSplitBetter && <span className="badge badge-success">Cheapest Deal</span>}
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Store Name</div>
            <strong style={{ fontSize: '1.1rem' }}>{singleStoreOption ? singleStoreOption.storeName : 'None Available'}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 'auto' }}>
            <span style={{ fontSize: '1.8rem', fontWeight: 800, color: isSplitBetter ? 'var(--color-text-muted)' : 'var(--color-primary)' }}>
              ₹{singleTotal}
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginLeft: '8px' }}>incl. taxes & delivery</span>
          </div>
        </div>

        {/* Split Optimizer Card */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px', border: isSplitBetter ? '2px solid var(--color-primary)' : '1px solid var(--color-border)', position: 'relative', overflow: 'hidden' }}>
          {isSplitBetter && (
            <div style={{ position: 'absolute', top: 0, right: 0, backgroundColor: 'var(--color-primary)', color: 'white', padding: '4px 14px', fontSize: '0.7rem', fontWeight: 700, borderBottomLeftRadius: '12px' }}>
              RECOMMENDED BY AI
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Cheapest Split Orders</span>
            {isSplitBetter && <span className="badge badge-success">Cheapest Deal</span>}
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Fulfillment Stores</div>
            <strong style={{ fontSize: '1.1rem' }}>{splitOrders ? splitOrders.map(o => o.storeName).join(' + ') : 'None'}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 'auto' }}>
            <span style={{ fontSize: '1.8rem', fontWeight: 800, color: isSplitBetter ? 'var(--color-primary)' : 'var(--color-text-muted)' }}>
              ₹{splitTotal}
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginLeft: '8px' }}>incl. taxes & delivery</span>
          </div>
        </div>

        {/* Savings Metric Widget */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '12px', justifyContent: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-primary)' }}>
            <TrendingDown size={24} />
            <div>
              <h4 style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Net Savings</h4>
              <strong style={{ fontSize: '1.5rem', color: 'var(--color-text-main)' }}>
                {savings > 0 ? `₹${savings}` : '₹0'}
              </strong>
            </div>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', borderTop: '1px solid var(--color-border)', paddingTop: '10px' }}>
            <strong>Confidence Score:</strong> {confidenceScore}%
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
            "{recommendationReason}"
          </p>
        </div>
      </div>

      {/* Split details breakdown */}
      <div>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '16px' }}>Split Fulfillment Breakdown</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {(isSplitBetter ? splitOrders : [singleStoreOption]).filter(Boolean).map((order, idx) => (
            <div key={order.storeId || idx} className="card" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--color-border)', paddingBottom: '12px', marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Store size={18} style={{ color: 'var(--color-primary)' }} />
                  <strong style={{ fontSize: '0.95rem' }}>{order.storeName}</strong>
                </div>
                <span className="badge badge-info" style={{ fontSize: '0.7rem' }}>Split Part {idx + 1}</span>
              </div>

              {/* Items in this split */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '14px' }}>
                {order.items.map((item) => (
                  <div key={item.productId} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                    <span>{item.name} x {item.quantity}</span>
                    <strong>₹{item.cost} <span style={{ fontSize: '0.7rem', fontWeight: 400 }}>(₹{item.price}/unit)</span></strong>
                  </div>
                ))}
              </div>

              {/* Summary of split */}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', borderTop: '1px dashed var(--color-border)', paddingTop: '10px', color: 'var(--color-text-muted)' }}>
                <span>Subtotal: ₹{order.subtotal} | Delivery: ₹{order.deliveryFee} | Taxes: ₹{order.taxes}</span>
                <strong style={{ color: 'var(--color-text-main)' }}>Total: ₹{order.total}</strong>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Action Footer */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
        <button className="btn btn-outline" onClick={() => navigate('/customer/cart')}>
          Back to Basket
        </button>
        <button 
          className="btn btn-primary" 
          onClick={handleCheckoutOptimized}
          disabled={checkoutLoading}
          style={{ padding: '12px 30px' }}
        >
          {checkoutLoading ? 'Processing Checkout...' : 'Confirm & Checkout Optimized split'} <ArrowRight size={16} />
        </button>
      </div>

    </div>
  );
}
