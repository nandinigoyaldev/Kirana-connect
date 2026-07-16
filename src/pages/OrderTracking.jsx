import React, { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { io } from 'socket.io-client';
import { Package, Truck, Compass, CheckCircle2, MapPin, Navigation, RefreshCw } from 'lucide-react';

export default function OrderTracking() {
  const { token, user } = useAuth();
  const { activeOrders, fetchActiveOrders } = useCart();
  const [selectedOrder, setSelectedStore] = useState(null);
  const [driverLocation, setDriverLocation] = useState({ lat: 28.4590, lng: 77.0260 });
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    // Connect to WebSocket server
    const s = io(window.location.origin || 'http://localhost:5001');
    setSocket(s);

    if (user) {
      s.emit('register_user', user._id);
    }

    s.on('order_status_updated', (updatedOrder) => {
      console.log("WebSocket Status Update:", updatedOrder);
      fetchActiveOrders();
      if (selectedOrder && selectedOrder._id === updatedOrder._id) {
        setSelectedStore(updatedOrder);
      }
    });

    s.on('stock_updated', () => {
      // ignore in customer orders tracker
    });

    // Simulate real-time driver coordinates movement if order status is 'picked_up'
    const interval = setInterval(() => {
      setDriverLocation(prev => {
        // Increment coordinates slightly to simulate path movement
        const nextLat = prev.lat + (Math.random() - 0.3) * 0.0004;
        const nextLng = prev.lng + (Math.random() - 0.3) * 0.0004;
        return { lat: nextLat, lng: nextLng };
      });
    }, 3000);

    return () => {
      s.disconnect();
      clearInterval(interval);
    };
  }, [user]);

  // Set first order as selected initially
  useEffect(() => {
    if (activeOrders.length > 0 && !selectedOrder) {
      setSelectedStore(activeOrders[0]);
    }
  }, [activeOrders]);

  const getStatusStepIndex = (status) => {
    const steps = ['pending', 'accepted', 'prepared', 'picked_up', 'delivered'];
    return steps.indexOf(status);
  };

  const stepsList = [
    { label: 'Order Confirmed', desc: 'Shopkeeper reviewing order', icon: <Package size={16} /> },
    { label: 'Merchant Preparing', desc: 'Sourcing items and packing', icon: <Compass size={16} /> },
    { label: 'Out for Delivery', desc: 'Partner picking up items', icon: <Truck size={16} /> },
    { label: 'Delivered', desc: 'Fulfillment completed', icon: <CheckCircle2 size={16} /> }
  ];

  // Helper map rendering
  const getMapCoordinates = (lat, lng) => {
    const latMin = 28.4540;
    const latMax = 28.4640;
    const lngMin = 77.0210;
    const lngMax = 77.0340;

    const x = ((lng - lngMin) / (lngMax - lngMin)) * 100;
    const y = 100 - (((lat - latMin) / (latMax - latMin)) * 100);

    return { x: Math.max(5, Math.min(95, x)), y: Math.max(5, Math.min(95, y)) };
  };

  if (activeOrders.length === 0) {
    return (
      <div className="card" style={{ maxWidth: '600px', margin: '40px auto', textAlign: 'center', padding: '40px' }}>
        <Package size={48} style={{ color: 'var(--color-text-muted)', marginBottom: '16px' }} />
        <h3 style={{ fontSize: '1.25rem', marginBottom: '8px' }}>No Active Orders Found</h3>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', marginBottom: '24px' }}>
          You don't have any pending delivery requests at the moment.
        </p>
        <button className="btn btn-primary" onClick={() => fetchActiveOrders()}>
          <RefreshCw size={14} /> Refresh Orders List
        </button>
      </div>
    );
  }

  const order = selectedOrder || activeOrders[0];
  const activeStep = getStatusStepIndex(order.status);

  return (
    <div className="split-layout-left">
      
      {/* Left Sidebar: Orders directory */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px', overflowY: 'auto' }}>
        <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>My Orders</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {activeOrders.map(o => (
            <button
              key={o._id}
              onClick={() => setSelectedStore(o)}
              style={{
                padding: '12px',
                borderRadius: '12px',
                border: '1px solid var(--color-border)',
                textAlign: 'left',
                backgroundColor: order._id === o._id ? 'var(--color-primary-light)' : 'white',
                color: order._id === o._id ? 'var(--color-primary)' : 'var(--color-text-main)',
                transition: 'all var(--transition-fast)'
              }}
            >
              <div style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: '4px' }}>Order #{o._id.substring(0,8)}</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                <span>₹{o.total}</span>
                <span className="badge badge-info" style={{ fontSize: '0.65rem', padding: '2px 6px' }}>{o.status}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Right: Stepper and simulated tracking map */}
      <div style={{ display: 'grid', gridTemplateRows: 'auto 1fr', gap: '20px', height: '100%' }}>
        
        {/* Stepper Status tracker */}
        <div className="card" style={{ padding: '20px 24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid var(--color-border)', paddingBottom: '12px' }}>
            <div>
              <h4 style={{ fontSize: '1rem', fontWeight: 700 }}>Tracking Order #{order._id.substring(0,8)}</h4>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>Estimated Arrival: 15-20 mins</p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
              <span className="badge badge-success" style={{ fontSize: '0.8rem' }}>{order.status}</span>
              {order.deliveryOtp && order.status === 'picked_up' && (
                <div style={{ fontSize: '0.75rem', backgroundColor: 'rgba(16, 185, 129, 0.15)', border: '1px dashed var(--color-primary)', color: 'var(--color-primary)', padding: '4px 8px', borderRadius: '6px', fontWeight: 700, marginTop: '4px' }}>
                  Delivery Verification OTP: {order.deliveryOtp}
                </div>
              )}
            </div>
          </div>


          {/* Stepper indicator bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative', overflowX: 'auto', padding: '10px 0' }}>
            {stepsList.map((step, idx) => {
              const stepsMapping = ['pending', 'accepted', 'prepared', 'picked_up', 'delivered'];
              const currentStepIndex = stepsMapping.indexOf(order.status);
              
              // Evaluate step status
              let isCompleted = false;
              let isActive = false;
              if (idx === 0) {
                isCompleted = currentStepIndex >= 0; // pending
                isActive = currentStepIndex === 0;
              } else if (idx === 1) {
                isCompleted = currentStepIndex >= 2; // prepared
                isActive = currentStepIndex === 1 || currentStepIndex === 2;
              } else if (idx === 2) {
                isCompleted = currentStepIndex >= 4; // delivered
                isActive = currentStepIndex === 3;
              } else if (idx === 3) {
                isCompleted = currentStepIndex === 4; // delivered
                isActive = currentStepIndex === 4;
              }

              return (
                <div key={idx} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '100px', textAlign: 'center', position: 'relative' }}>
                  {/* Circle Indicator */}
                  <div 
                    style={{ 
                      width: '32px', 
                      height: '32px', 
                      borderRadius: '50%', 
                      backgroundColor: isCompleted ? 'var(--color-primary)' : (isActive ? 'var(--color-accent)' : 'var(--color-bg)'), 
                      color: isCompleted ? 'white' : (isActive ? 'var(--color-text-main)' : 'var(--color-text-muted)'),
                      border: '2px solid var(--color-border)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: '8px',
                      zIndex: 2,
                      transition: 'all var(--transition-normal)'
                    }}
                  >
                    {step.icon}
                  </div>

                  <strong style={{ fontSize: '0.75rem', color: isCompleted || isActive ? 'var(--color-text-main)' : 'var(--color-text-muted)' }}>{step.label}</strong>
                  <span style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)', display: 'block', maxWidth: '120px' }}>{step.desc}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Live Map tracker */}
        <div className="card" style={{ position: 'relative', overflow: 'hidden', padding: 0 }}>
          {/* Map canvas */}
          <div style={{ width: '100%', height: '100%', position: 'relative', backgroundImage: 'radial-gradient(#cbd5e1 1.5px, transparent 1.5px)', backgroundSize: '24px 24px', backgroundColor: '#e2e8f0' }}>
            
            {/* Street Grid */}
            <div style={{ position: 'absolute', top: '40%', left: 0, right: 0, height: '16px', backgroundColor: 'white' }}></div>
            <div style={{ position: 'absolute', top: 0, bottom: 0, left: '50%', width: '16px', backgroundColor: 'white' }}></div>

            {/* Merchant Pinpoint */}
            {(() => {
              const pos = getMapCoordinates(28.4595, 77.0266);
              return (
                <div style={{ position: 'absolute', left: `${pos.x}%`, top: `${pos.y}%`, transform: 'translate(-50%, -50%)', zIndex: 10 }}>
                  <div style={{ padding: '6px', borderRadius: '50%', backgroundColor: 'var(--color-primary)', color: 'white', boxShadow: 'var(--shadow-md)' }}>
                    <MapPin size={16} />
                  </div>
                  <div style={{ position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%)', backgroundColor: 'white', border: '1px solid var(--color-border)', fontSize: '0.6rem', padding: '2px 6px', borderRadius: '4px', whiteSpace: 'nowrap', fontWeight: 700 }}>
                    Store Hub
                  </div>
                </div>
              );
            })()}

            {/* Customer Pinpoint */}
            {(() => {
              const pos = getMapCoordinates(28.4575, 77.0295);
              return (
                <div style={{ position: 'absolute', left: `${pos.x}%`, top: `${pos.y}%`, transform: 'translate(-50%, -50%)', zIndex: 10 }}>
                  <div style={{ padding: '6px', borderRadius: '50%', backgroundColor: 'var(--color-cta)', color: 'white', boxShadow: 'var(--shadow-md)' }}>
                    <Navigation size={16} />
                  </div>
                  <div style={{ position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%)', backgroundColor: 'white', border: '1px solid var(--color-border)', fontSize: '0.6rem', padding: '2px 6px', borderRadius: '4px', whiteSpace: 'nowrap', fontWeight: 700 }}>
                    Deliver to Me
                  </div>
                </div>
              );
            })()}

            {/* Moving Driver Amit Patel */}
            {order.status === 'picked_up' && (() => {
              const pos = getMapCoordinates(driverLocation.lat, driverLocation.lng);
              return (
                <div style={{ position: 'absolute', left: `${pos.x}%`, top: `${pos.y}%`, transform: 'translate(-50%, -50%)', zIndex: 20 }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'var(--shadow-lg)', border: '2px solid var(--color-accent-dark)' }}>
                    🛵
                  </div>
                  <div style={{ position: 'absolute', bottom: '100%', left: '50%', transform: 'translateX(-50%)', backgroundColor: 'var(--color-text-main)', color: 'white', fontSize: '0.6rem', padding: '2px 6px', borderRadius: '4px', whiteSpace: 'nowrap', fontWeight: 700, marginBottom: '4px' }}>
                    Amit Patel (In Transit)
                  </div>
                </div>
              );
            })()}

          </div>
        </div>

      </div>

    </div>
  );
}
