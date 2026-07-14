import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Navigation, Star, Phone, Clock, ChevronRight, X } from 'lucide-react';

export default function StoreDiscovery() {
  const navigate = useNavigate();
  const [stores, setStores] = useState([]);
  const [selectedStore, setSelectedStore] = useState(null);
  const [loading, setLoading] = useState(true);

  // Customer current position (Gurgaon coordinates approx)
  const customerPos = { lat: 28.4590, lng: 77.0260 };

  useEffect(() => {
    fetchStores();
  }, []);

  const fetchStores = async () => {
    try {
      const res = await fetch('/api/stores');
      const data = await res.json();
      setStores(data.stores || []);
      // Pre-select first store
      if (data.stores && data.stores.length > 0) {
        setSelectedStore(data.stores[0]);
      }
    } catch (err) {
      console.error("Error loading stores:", err);
    } finally {
      setLoading(false);
    }
  };

  // Convert lat/lng to percentage coordinates on our 2D grid map canvas
  const getMapCoordinates = (lat, lng) => {
    // Map bounding box (approximately covering local Gurgaon Sector 45/4)
    const latMin = 28.4550;
    const latMax = 28.4650;
    const lngMin = 77.0200;
    const lngMax = 77.0350;

    const x = ((lng - lngMin) / (lngMax - lngMin)) * 100;
    const y = 100 - (((lat - latMin) / (latMax - latMin)) * 100); // invert Y for screen space

    return { x: Math.max(5, Math.min(95, x)), y: Math.max(5, Math.min(95, y)) };
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '60px' }}>Loading Store discovery map...</div>;
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '20px', height: 'calc(100vh - 120px)' }}>
      
      {/* Grid Map Simulator (Left) */}
      <div className="card" style={{ position: 'relative', overflow: 'hidden', padding: 0, height: '100%', backgroundColor: '#e2e8f0', display: 'flex', flexDirection: 'column' }}>
        
        {/* Map Header */}
        <div style={{ padding: '16px 20px', backgroundColor: 'white', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 10 }}>
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>Hyperlocal Store Locator</h3>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>Pins represent live grocery inventories near you</p>
          </div>
          <div style={{ display: 'flex', gap: '8px', fontSize: '0.75rem', fontWeight: 600 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: 'var(--color-cta)' }}></span> Me</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: 'var(--color-primary)' }}></span> Stores</span>
          </div>
        </div>

        {/* Map Graphics */}
        <div style={{ flex: 1, position: 'relative', backgroundImage: 'radial-gradient(#cbd5e1 1.5px, transparent 1.5px)', backgroundSize: '24px 24px', backgroundColor: '#f1f5f9' }}>
          
          {/* Simulated Streets/Grid */}
          <div style={{ position: 'absolute', top: '25%', left: 0, right: 0, height: '12px', backgroundColor: 'rgba(255,255,255,0.7)' }}></div>
          <div style={{ position: 'absolute', top: '65%', left: 0, right: 0, height: '16px', backgroundColor: 'rgba(255,255,255,0.7)' }}></div>
          <div style={{ position: 'absolute', top: 0, bottom: 0, left: '30%', width: '14px', backgroundColor: 'rgba(255,255,255,0.7)' }}></div>
          <div style={{ position: 'absolute', top: 0, bottom: 0, left: '70%', width: '12px', backgroundColor: 'rgba(255,255,255,0.7)' }}></div>

          {/* Customer marker */}
          {(() => {
            const pos = getMapCoordinates(customerPos.lat, customerPos.lng);
            return (
              <div 
                style={{ 
                  position: 'absolute', 
                  left: `${pos.x}%`, 
                  top: `${pos.y}%`, 
                  transform: 'translate(-50%, -50%)',
                  zIndex: 20
                }}
              >
                <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: 'rgba(37, 99, 235, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'pulse-ring 2s infinite' }}>
                  <div style={{ width: '14px', height: '14px', borderRadius: '50%', backgroundColor: 'var(--color-cta)', border: '2px solid white' }}></div>
                </div>
                <div style={{ position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%)', backgroundColor: 'var(--color-text-main)', color: 'white', fontSize: '0.6rem', padding: '2px 6px', borderRadius: '4px', whiteSpace: 'nowrap', fontWeight: 600 }}>
                  My Location
                </div>
              </div>
            );
          })()}

          {/* Store Pinpoints */}
          {stores.map(store => {
            const pos = getMapCoordinates(store.location.lat, store.location.lng);
            const isSelected = selectedStore && selectedStore._id === store._id;
            return (
              <button
                key={store._id}
                onClick={() => setSelectedStore(store)}
                style={{
                  position: 'absolute',
                  left: `${pos.x}%`,
                  top: `${pos.y}%`,
                  transform: 'translate(-50%, -50%)',
                  zIndex: isSelected ? 30 : 25,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  cursor: 'pointer'
                }}
              >
                <div 
                  style={{ 
                    padding: '8px', 
                    borderRadius: '50%', 
                    backgroundColor: isSelected ? 'var(--color-primary)' : 'white', 
                    color: isSelected ? 'white' : 'var(--color-primary)',
                    boxShadow: 'var(--shadow-md)',
                    border: '1px solid var(--color-border)',
                    transition: 'all var(--transition-fast)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <MapPin size={isSelected ? 22 : 18} />
                </div>
                <div 
                  style={{ 
                    marginTop: '4px',
                    backgroundColor: isSelected ? 'var(--color-primary)' : 'rgba(255,255,255,0.9)', 
                    color: isSelected ? 'white' : 'var(--color-text-main)', 
                    fontSize: '0.65rem', 
                    fontWeight: 700,
                    padding: '2px 6px', 
                    borderRadius: '4px', 
                    whiteSpace: 'nowrap',
                    boxShadow: 'var(--shadow-sm)',
                    border: '1px solid var(--color-border)'
                  }}
                >
                  {store.name}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Store Sidebar details (Right) */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          {selectedStore ? (
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 800 }}>{selectedStore.name}</h3>
                  <button onClick={() => setSelectedStore(null)} style={{ color: 'var(--color-text-muted)' }}><X size={16} /></button>
                </div>

                <div style={{ height: '140px', borderRadius: '12px', overflow: 'hidden', marginBottom: '16px' }}>
                  <img 
                    src={selectedStore.image} 
                    alt={selectedStore.name} 
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                    onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=300' }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginBottom: '12px' }}>
                  <span className="badge badge-success" style={{ gap: '2px' }}><Star size={12} fill="white" /> {selectedStore.rating}</span>
                  <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Gurgaon Hyperlocal Zone</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                  <div style={{ display: 'flex', gap: '8px' }}><MapPin size={16} /> {selectedStore.address}</div>
                  <div style={{ display: 'flex', gap: '8px' }}><Navigation size={16} /> Distance: ~0.4 km</div>
                  <div style={{ display: 'flex', gap: '8px' }}><Clock size={16} /> Delivery in: 15-20 mins</div>
                </div>
              </div>

              <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '16px', marginTop: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', fontSize: '0.9rem' }}>
                  <span style={{ color: 'var(--color-text-muted)' }}>Delivery Fee</span>
                  <strong style={{ color: 'var(--color-text-main)' }}>₹{selectedStore.deliveryFee}</strong>
                </div>
                <button 
                  className="btn btn-primary" 
                  onClick={() => navigate(`/customer`)} 
                  style={{ width: '100%' }}
                >
                  Shop Store Inventory <ChevronRight size={16} />
                </button>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--color-text-muted)', textAlign: 'center', gap: '10px' }}>
              <Navigation size={32} />
              <p style={{ fontSize: '0.9rem' }}>Select a store pinpoint on the map to inspect live reviews, catalog size, and delivery fee tiers.</p>
            </div>
          )}
        </div>

        {/* Directory Card */}
        <div className="card" style={{ padding: '16px' }}>
          <h4 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '12px' }}>Stores Directory</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '180px', overflowY: 'auto' }}>
            {stores.map(store => (
              <button
                key={store._id}
                onClick={() => setSelectedStore(store)}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: '1px solid var(--color-border)',
                  backgroundColor: selectedStore && selectedStore._id === store._id ? 'var(--color-primary-light)' : 'white',
                  color: selectedStore && selectedStore._id === store._id ? 'var(--color-primary)' : 'var(--color-text-main)',
                  textAlign: 'left',
                  fontSize: '0.8rem',
                  fontWeight: 500
                }}
              >
                <span>{store.name}</span>
                <span style={{ fontSize: '0.75rem', opacity: 0.8 }}>★ {store.rating}</span>
              </button>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
}
