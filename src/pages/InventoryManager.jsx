import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Plus, ToggleLeft, ToggleRight, Edit, AlertCircle, Sparkles, Scan, Search, Check } from 'lucide-react';

export default function InventoryManager() {
  const { user, token } = useAuth();
  const [products, setProducts] = useState([]);
  const [storeInventory, setStoreInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Offline-first sync states
  const [isOffline, setIsOffline] = useState(false);
  const [offlineQueue, setOfflineQueue] = useState(() => {
    const saved = localStorage.getItem('inventory_offline_queue');
    return saved ? JSON.parse(saved) : [];
  });

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
    if (isOffline) {
      const updatedQueue = [...offlineQueue, {
        productId: editingItem.productId._id || editingItem.productId,
        price: Number(editPrice),
        stock: Number(editStock),
        isAvailable: editAvailable,
        name: editingItem.productId.name || 'Product Update',
        timestamp: new Date().toISOString()
      }];
      setOfflineQueue(updatedQueue);
      localStorage.setItem('inventory_offline_queue', JSON.stringify(updatedQueue));
      
      const nextInv = storeInventory.map(item => 
        (item._id === editingItem._id) 
          ? { ...item, price: Number(editPrice), stock: Number(editStock), isAvailable: editAvailable } 
          : item
      );
      setStoreInventory(nextInv);
      setEditingItem(null);
      setIsSaving(false);
      return;
    }

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

  const handlePushOfflineUpdates = async () => {
    if (offlineQueue.length === 0) return;
    setLoading(true);
    try {
      for (const item of offlineQueue) {
        await fetch('/api/inventory/update', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            productId: item.productId,
            price: item.price,
            stock: item.stock,
            isAvailable: item.isAvailable
          })
        });
      }
      alert("Successfully synced all local cached inventory changes back to cloud!");
      setOfflineQueue([]);
      localStorage.removeItem('inventory_offline_queue');
      loadInventoryData();
    } catch (err) {
      alert("Sync failed. Check cloud link connection.");
    } finally {
      setLoading(false);
    }
  };

  const handleOneClickReorder = async (invItem) => {
    try {
      const supRes = await fetch('/api/suppliers', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const supData = await supRes.json();
      const targetSupplier = supData.suppliers?.[0];
      if (!targetSupplier) {
        alert("Please register a Wholesaler/Supplier first!");
        return;
      }
      
      const orderNumber = `PO-AUTO-${Math.floor(1000 + Math.random() * 9000)}`;
      const res = await fetch('/api/purchase-orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          supplierId: targetSupplier._id,
          orderNumber,
          expectedDeliveryDate: new Date(Date.now() + 172800000).toISOString().split('T')[0],
          items: [{
            productId: invItem.productId._id || invItem.productId,
            quantityOrdered: 50,
            buyingPrice: Math.round(invItem.price * 0.8),
            sellingPrice: invItem.price
          }],
          notes: `Automated reorder draft triggered by low stock alert (under 15 units)`
        })
      });
      if (res.ok) {
        alert(`Draft purchase order #${orderNumber} created successfully!`);
      } else {
        alert("Failed to auto-draft purchase order.");
      }
    } catch (err) {
      console.error(err);
      alert("Error drafting purchase order.");
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

      {/* Offline Sync Controls banner */}
      <div className="card" style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: isOffline ? 'rgba(239, 68, 68, 0.05)' : 'var(--color-primary-light)', border: '1px solid var(--color-border)', borderRadius: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: isOffline ? 'var(--color-error)' : 'var(--color-success)' }}></div>
          <div>
            <strong style={{ fontSize: '0.85rem' }}>Connection Link: {isOffline ? 'Offline (Cached Mode)' : 'Online (Direct Cloud Synced)'}</strong>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>
              {isOffline ? `Pending changes saved in local cache: ${offlineQueue.length} items` : 'Database is actively synchronised.'}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          {isOffline && offlineQueue.length > 0 && (
            <button className="btn btn-primary" onClick={handlePushOfflineUpdates} style={{ fontSize: '0.75rem', padding: '6px 12px' }}>
              Push Cached Updates ({offlineQueue.length})
            </button>
          )}
          <button 
            className="btn btn-outline" 
            onClick={() => {
              setIsOffline(!isOffline);
              if (!isOffline) alert("Simulating network disconnect. Inventory changes will cache locally in your browser.");
              else alert("Network link restored!");
            }}
            style={{ fontSize: '0.75rem', padding: '6px 12px', borderColor: isOffline ? 'var(--color-success)' : 'var(--color-error)', color: isOffline ? 'var(--color-success)' : 'var(--color-error)' }}
          >
            {isOffline ? 'Go Online' : 'Simulate Offline'}
          </button>
        </div>
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
                      {item.stock <= 15 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--color-error)', fontWeight: 700, fontSize: '0.8rem' }}>
                            <AlertCircle size={14} /> Low: {item.stock} left
                          </span>
                          <span style={{ fontSize: '0.65rem', color: 'var(--color-secondary)', fontWeight: 700 }}>
                            ⚠️ Runout predicted (2d)
                          </span>
                        </div>
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
                    <td style={{ textAlign: 'right', display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                      {item.stock <= 15 && (
                        <button 
                          className="btn btn-secondary" 
                          onClick={() => handleOneClickReorder(item)} 
                          style={{ padding: '6px 10px', fontSize: '0.7rem', color: 'var(--color-primary)' }}
                        >
                          Auto-Reorder
                        </button>
                      )}
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
