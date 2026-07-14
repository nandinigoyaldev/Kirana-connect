import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { Search, Mic, Store, ShoppingCart, Sparkles, Filter, AlertCircle, ChevronRight, Check } from 'lucide-react';

export default function CustomerHome() {
  const navigate = useNavigate();
  const { addToCart, cartItems } = useCart();
  const [stores, setStores] = useState([]);
  const [products, setProducts] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  
  // Voice search simulator states
  const [isListening, setIsListening] = useState(false);
  const [voiceToast, setVoiceToast] = useState('');

  // Categories
  const categories = ['All', 'Dairy', 'Bakery', 'Eggs & Poultry', 'Pantry', 'Snacks', 'Household'];

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      // Fetch stores
      const storesRes = await fetch('/api/stores');
      const storesData = await storesRes.json();
      setStores(storesData.stores || []);

      // Fetch products
      const prodsRes = await fetch('/api/products');
      const prodsData = await prodsRes.json();
      setProducts(prodsData.products || []);

      // Fetch inventory to show prices per store
      // In a real app we'd load this on demand, but here we can load all inventory to show compare options
      const invList = [];
      for (const s of storesData.stores || []) {
        const invRes = await fetch(`/api/inventory/store/${s._id}`);
        const invData = await invRes.json();
        invList.push(...invData.inventory);
      }
      setInventory(invList);
    } catch (err) {
      console.error("Error loading customer data:", err);
    } finally {
      setLoading(false);
    }
  };

  // Voice Search using Web Speech API with simulation fallback
  const handleVoiceSearch = () => {
    if (isListening) return;
    
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.lang = 'en-IN';
      recognition.interimResults = false;
      
      recognition.onstart = () => {
        setIsListening(true);
        setVoiceToast("Listening for product names...");
      };
      
      recognition.onerror = (event) => {
        console.error("Speech recognition error", event.error);
        setIsListening(false);
        runSimulatedVoiceSearch();
      };
      
      recognition.onend = () => {
        setIsListening(false);
      };
      
      recognition.onresult = (event) => {
        const speechToText = event.results[0][0].transcript;
        // Strip trailing punctuation
        const query = speechToText.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g,"");
        setSearchQuery(query);
        setVoiceToast(`Search set to: "${query}"`);
        setTimeout(() => {
          setIsListening(false);
          setVoiceToast('');
        }, 1500);
      };
      
      recognition.start();
    } else {
      runSimulatedVoiceSearch();
    }
  };

  const runSimulatedVoiceSearch = () => {
    setIsListening(true);
    setVoiceToast("Listening for item names (simulated)...");
    
    setTimeout(() => {
      const phrases = ["Amul Milk", "Fresh Eggs", "Britannia Bread", "Chakki Atta"];
      const randomPhrase = phrases[Math.floor(Math.random() * phrases.length)];
      setSearchQuery(randomPhrase);
      setVoiceToast(`Search set to: "${randomPhrase}"`);
      setTimeout(() => {
        setIsListening(false);
        setVoiceToast('');
      }, 1500);
    }, 2000);
  };

  // Filter products by category and query
  const filteredProducts = products.filter(p => {
    const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Helper: Find cheapest price and store name for a product
  const getProductPricingInfo = (productId) => {
    const items = inventory.filter(i => (i.productId._id === productId || i.productId === productId) && i.isAvailable);
    if (items.length === 0) return { price: null, storeName: 'Out of stock' };
    
    // sort by price
    const sorted = [...items].sort((a, b) => a.price - b.price);
    const store = stores.find(s => s._id === sorted[0].storeId);
    return {
      price: sorted[0].price,
      storeId: sorted[0].storeId,
      storeName: store ? store.name : 'Unknown Store',
      allOffers: sorted.map(i => {
        const s = stores.find(st => st._id === i.storeId);
        return {
          storeName: s ? s.name : 'Store',
          price: i.price,
          stock: i.stock
        };
      })
    };
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '60px' }}>Loading Hyperlocal Ecosystem...</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
      
      {/* Top Banner: AI Optimizer Promo */}
      <div className="glass-hero" style={{ padding: '28px', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '20px' }}>
        <div style={{ flex: '1', minWidth: '280px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-primary)', fontWeight: 700, fontSize: '0.9rem', marginBottom: '8px' }}>
            <Sparkles size={16} /> AI BASKET SPLITTING ALGORITHM
          </div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '8px' }}>Cheapest Checkout Splitter</h2>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
            Have multiple grocery items? Enter your list in the AI Basket Optimizer. We will search local stores, calculate delivery costs, and split your order to find the absolute lowest cost combinations.
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/customer/optimize')} style={{ whiteSpace: 'nowrap' }}>
          Try AI Optimizer <ChevronRight size={16} />
        </button>
      </div>

      {/* Voice visualizer overlay */}
      {isListening && (
        <div className="modal-overlay" style={{ zIndex: 2000 }}>
          <div className="modal-content" style={{ maxWidth: '340px', textAlign: 'center', padding: '40px 20px' }}>
            <h3 style={{ marginBottom: '16px' }}>Voice Search Active</h3>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', marginBottom: '24px' }}>
              {voiceToast}
            </p>
            <div className="audio-visualizer">
              <div className="visualizer-bar active" style={{ animationDelay: '0.1s' }}></div>
              <div className="visualizer-bar active" style={{ animationDelay: '0.3s' }}></div>
              <div className="visualizer-bar active" style={{ animationDelay: '0.5s' }}></div>
              <div className="visualizer-bar active" style={{ animationDelay: '0.2s' }}></div>
              <div className="visualizer-bar active" style={{ animationDelay: '0.4s' }}></div>
            </div>
            <button className="btn btn-outline" style={{ marginTop: '24px' }} onClick={() => setIsListening(false)}>Cancel</button>
          </div>
        </div>
      )}

      {/* Search & Categories Bar */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'center', justifyContent: 'space-between' }}>
        
        {/* Search */}
        <div style={{ display: 'flex', gap: '8px', flex: '1', minWidth: '280px', maxWidth: '500px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, backgroundColor: 'white', border: '1px solid var(--color-border)', borderRadius: '24px', padding: '8px 16px' }}>
            <Search size={18} style={{ color: 'var(--color-text-muted)' }} />
            <input 
              type="text" 
              placeholder="Search products, brands, or categories..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontSize: '0.9rem' }}
            />
          </div>
          <button className="btn btn-secondary" onClick={handleVoiceSearch} style={{ borderRadius: '50%', width: '42px', height: '42px', padding: 0 }}>
            <Mic size={18} />
          </button>
        </div>

        {/* Action button maps store location discovery */}
        <button className="btn btn-outline" onClick={() => navigate('/customer/map')} style={{ borderRadius: '24px' }}>
          <Store size={16} /> Locate Stores on Map
        </button>
      </div>

      {/* Categories chips scroll */}
      <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '8px', scrollbarWidth: 'none' }}>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            style={{
              padding: '8px 18px',
              borderRadius: '20px',
              fontSize: '0.85rem',
              fontWeight: 500,
              backgroundColor: selectedCategory === cat ? 'var(--color-primary-light)' : 'white',
              color: selectedCategory === cat ? 'var(--color-primary)' : 'var(--color-text-muted)',
              border: selectedCategory === cat ? '1px solid var(--color-primary)' : '1px solid var(--color-border)',
              whiteSpace: 'nowrap',
              transition: 'all var(--transition-fast)'
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Products Grid */}
      <div>
        <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          {selectedCategory} Products <span className="badge badge-info">{filteredProducts.length} items</span>
        </h3>
        
        {filteredProducts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', backgroundColor: 'white', borderRadius: '18px', border: '1px solid var(--color-border)' }}>
            <AlertCircle size={36} style={{ color: 'var(--color-text-muted)', marginBottom: '12px' }} />
            <p style={{ color: 'var(--color-text-muted)' }}>No products found matching your preferences.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '20px' }}>
            {filteredProducts.map(product => {
              const pricing = getProductPricingInfo(product._id);
              return (
                <div key={product._id} className="card card-hover" style={{ display: 'flex', flexDirection: 'column', padding: '16px', height: '100%' }}>
                  {/* Image container */}
                  <div style={{ height: '140px', backgroundColor: 'var(--color-bg)', borderRadius: '12px', overflow: 'hidden', marginBottom: '14px', position: 'relative' }}>
                    <img 
                      src={product.image} 
                      alt={product.name} 
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                      onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=300' }}
                    />
                    <span style={{ position: 'absolute', top: '8px', left: '8px', fontSize: '0.7rem', fontWeight: 600, padding: '2px 8px', borderRadius: '4px', backgroundColor: 'white', boxShadow: 'var(--shadow-sm)' }}>
                      {product.category}
                    </span>
                  </div>

                  {/* Name and unit */}
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '2px', lineClamp: 1, overflow: 'hidden' }}>{product.name}</h4>
                  <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '12px' }}>Per {product.unit}</p>

                  {/* Pricing Comparison */}
                  <div style={{ backgroundColor: 'var(--color-bg)', padding: '10px', borderRadius: '10px', marginBottom: '14px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    {pricing.price !== null ? (
                      <div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>Cheapest nearby</div>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                          <span style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--color-primary)' }}>₹{pricing.price}</span>
                          <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>at {pricing.storeName}</span>
                        </div>
                        {pricing.allOffers && pricing.allOffers.length > 1 && (
                          <div style={{ borderTop: '1px solid var(--color-border)', marginTop: '6px', paddingTop: '4px', fontSize: '0.65rem', color: 'var(--color-text-muted)' }}>
                            Compare: {pricing.allOffers.map(o => `₹${o.price}`).join(' | ')}
                          </div>
                        )}
                      </div>
                    ) : (
                      <span style={{ fontSize: '0.8rem', color: 'var(--color-error)', fontWeight: 500 }}>Out of stock</span>
                    )}
                  </div>

                  {/* Add to Cart Action */}
                  <button 
                    disabled={pricing.price === null}
                    className="btn btn-primary" 
                    onClick={() => {
                      addToCart(product, 1, pricing.storeId);
                    }}
                    style={{ width: '100%', padding: '8px', fontSize: '0.8rem' }}
                  >
                    <ShoppingCart size={14} /> Add to Cart
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}
