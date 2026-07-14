import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Plus, ToggleLeft, ToggleRight, Edit, AlertCircle, Sparkles, Scan, Search, Check } from 'lucide-react';

export default function InventoryManager() {
  const { user, token } = useAuth();
  const [products, setProducts] = useState([]);
  const [storeInventory, setStoreInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Scanning simulator states
  const [isScanning, setIsScanning] = useState(false);
  const [scanStatus, setScanStatus] = useState('');
  
  // Editing states
  const [editingItem, setEditingItem] = useState(null);
  const [editPrice, setEditPrice] = useState(0);
  const [editStock, setEditStock] = useState(0);
  const [editAvailable, setEditAvailable] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadInventoryData();
  }, []);

  const loadInventoryData = async () => {
    setLoading(true);
    try {
      // Fetch global products
      const pRes = await fetch('/api/products');
      const pData = await pRes.json();
      setProducts(pData.products || []);

      // Fetch store inventory
      const invRes = await fetch(`/api/inventory/store/${user.storeId}`);
      const invData = await invRes.json();
      setStoreInventory(invData.inventory || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleAvailable = async (invItem) => {
    const nextVal = !invItem.isAvailable;
    try {
      const res = await fetch('/api/inventory/update', {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          productId: invItem.productId._id || invItem.productId,
          price: invItem.price,
          stock: invItem.stock,
          isAvailable: nextVal
        })
      });
      if (res.ok) {
        // reload
        loadInventoryData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleEditClick = (invItem) => {
    setEditingItem(invItem);
    setEditPrice(invItem.price);
    setEditStock(invItem.stock);
    setEditAvailable(invItem.isAvailable);
  };

  const handleSaveEdit = async () => {
    setIsSaving(true);
    try {
      const res = await fetch('/api/inventory/update', {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          productId: editingItem.productId._id || editingItem.productId,
          price: Number(editPrice),
          stock: Number(editStock),
          isAvailable: editAvailable
        })
      });
      if (res.ok) {
        setEditingItem(null);
        loadInventoryData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  // Barcode Scanner Simulator
  const handleStartScan = () => {
    setIsScanning(true);
    setScanStatus("Align barcode inside the green scanner zone...");

    setTimeout(() => {
      // Find a random product to "detect"
      const randomProduct = products[Math.floor(Math.random() * products.length)];
      if (randomProduct) {
        setScanStatus(`Barcode Detected! Matching: "${randomProduct.name}"...`);
        setTimeout(() => {
          setIsScanning(false);
          setScanStatus('');
          
          // Open editor for this product
          let invItem = storeInventory.find(i => (i.productId._id === randomProduct._id || i.productId === randomProduct._id));
          if (!invItem) {
            // create custom temp item
            invItem = {
              productId: randomProduct,
              price: randomProduct.price,
              stock: 0,
              isAvailable: true
            };
          }
          handleEditClick(invItem);
        }, 1500);
      }
    }, 2500);
  };

  // Filter local inventory by search query
  const filteredInventory = storeInventory.filter(item => {
    const prodName = item.productId.name || '';
    return prodName.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Store Inventory Ledger</h2>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>Configure store prices, manage availability toggles, or use the barcode scanner.</p>
        </div>
        <button className="btn btn-primary" onClick={handleStartScan} style={{ gap: '6px' }}>
          <Scan size={16} /> Barcode Scanner Simulator
        </button>
      </div>

      {/* Barcode scanner overlay */}
      {isScanning && (
        <div className="modal-overlay" style={{ zIndex: 2000 }}>
          <div className="modal-content" style={{ maxWidth: '440px', padding: '0', overflow: 'hidden' }}>
            <div style={{ padding: '16px', borderBottom: '1px solid var(--color-border)', fontWeight: 700 }}>Barcode Scanner Active</div>
            
            {/* Viewfinder simulation */}
            <div style={{ height: '240px', backgroundColor: '#0f172a', position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {/* Laser animation */}
              <div 
                style={{ 
                  position: 'absolute', 
                  top: '50%', 
                  left: '10%', 
                  right: '10%', 
                  height: '2px', 
                  backgroundColor: '#22c55e', 
                  boxShadow: '0 0 10px #22c55e',
                  animation: 'pulse-wave 1.5s infinite alternate' 
                }}
              ></div>

              {/* Grid box */}
              <div style={{ width: '220px', height: '110px', border: '2px dashed #22c55e', borderRadius: '8px' }}></div>
            </div>

            <div style={{ padding: '20px', textAlign: 'center' }}>
              <p style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--color-text-main)' }}>{scanStatus}</p>
              <button className="btn btn-outline" style={{ marginTop: '16px', width: '100%' }} onClick={() => setIsScanning(false)}>Close Scanner</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Item Modal */}
      {editingItem && (
        <div className="modal-overlay" style={{ zIndex: 1900 }}>
          <div className="modal-content" style={{ maxWidth: '400px' }}>
            <h3 style={{ marginBottom: '16px' }}>Adjust Product Stock</h3>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', marginBottom: '20px' }}>
              Update inventory settings for <strong>{editingItem.productId.name}</strong>.
            </p>

            <div className="form-group">
              <label className="form-label">Selling Price (₹)</label>
              <input 
                type="number" 
                className="form-control" 
                value={editPrice}
                onChange={(e) => setEditPrice(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Stock Quantity ({editingItem.productId.unit}s)</label>
              <input 
                type="number" 
                className="form-control" 
                value={editStock}
                onChange={(e) => setEditStock(e.target.value)}
              />
            </div>

            <div className="form-group" style={{ marginBottom: '24px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', cursor: 'pointer' }}>
                <input 
                  type="checkbox" 
                  checked={editAvailable}
                  onChange={(e) => setEditAvailable(e.target.checked)}
                />
                Mark as available for purchase
              </label>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <button className="btn btn-outline" onClick={() => setEditingItem(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSaveEdit} disabled={isSaving}>
                {isSaving ? 'Saving...' : 'Apply changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Inventory Search & List */}
      <div className="card">
        <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, backgroundColor: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: '24px', padding: '6px 14px' }}>
            <Search size={16} style={{ color: 'var(--color-text-muted)' }} />
            <input 
              type="text" 
              placeholder="Search store inventory..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontSize: '0.85rem' }}
            />
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '30px' }}>Loading Inventory...</div>
        ) : filteredInventory.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '30px', color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
            No matching inventory items.
          </div>
        ) : (
          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Product Details</th>
                  <th>Category</th>
                  <th>Store Price</th>
                  <th>Stock Status</th>
                  <th>Listed Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredInventory.map(item => (
                  <tr key={item._id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '6px', overflow: 'hidden', backgroundColor: 'var(--color-bg)' }}>
                          <img src={item.productId.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                        <div>
                          <strong style={{ fontSize: '0.85rem' }}>{item.productId.name}</strong>
                          <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>Per {item.productId.unit}</div>
                        </div>
                      </div>
                    </td>
                    <td><span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{item.productId.category}</span></td>
                    <td><strong>₹{item.price}</strong></td>
                    <td>
                      {item.stock <= 5 ? (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--color-error)', fontWeight: 600, fontSize: '0.8rem' }}>
                          <AlertCircle size={14} /> Low: {item.stock} left
                        </span>
                      ) : (
                        <span style={{ fontSize: '0.8rem', color: 'var(--color-text-main)' }}>{item.stock} in stock</span>
                      )}
                    </td>
                    <td>
                      <button 
                        onClick={() => handleToggleAvailable(item)}
                        style={{ display: 'flex', alignItems: 'center', color: item.isAvailable ? 'var(--color-primary)' : 'var(--color-text-muted)' }}
                      >
                        {item.isAvailable ? <ToggleRight size={28} /> : <ToggleLeft size={28} />}
                      </button>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button className="btn btn-outline" onClick={() => handleEditClick(item)} style={{ padding: '6px 12px', fontSize: '0.75rem', borderRadius: '6px' }}>
                        <Edit size={12} /> Adjust
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
