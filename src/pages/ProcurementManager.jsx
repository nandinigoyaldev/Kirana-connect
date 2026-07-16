import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Truck, Users, FileText, BarChart3, Plus, Search, Filter,
  X, Eye, Calendar, ArrowRight, DollarSign,
  Layers, Package, Edit2, Activity
} from 'lucide-react';

export default function ProcurementManager() {
  const { token, user } = useAuth();
  const storeId = user?.storeId;

  // Tabs: 'overview', 'suppliers', 'orders', 'reports', 'pools'
  const [activeTab, setActiveTab] = useState('overview');

  // Co-op Buying Pools Data
  const [pools, setPools] = useState([]);
  const [joiningPoolId, setJoiningPoolId] = useState(null);
  const [joinQty, setJoinQty] = useState(10);

  // Suppliers Data
  const [suppliers, setSuppliers] = useState([]);
  const [loadingSuppliers, setLoadingSuppliers] = useState(false);
  const [searchSupplier, setSearchSupplier] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  // Purchase Orders Data
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [searchOrder, setSearchOrder] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Analytics & Reports
  const [analytics, setAnalytics] = useState(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);

  // Global Products (for creating POs)
  const [globalProducts, setGlobalProducts] = useState([]);

  // Modals & Panels States
  const [supplierModalOpen, setSupplierModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null); // null = Create, object = Edit
  const [poModalOpen, setPOModalOpen] = useState(false);
  const [selectedPO, setSelectedPO] = useState(null);
  const [receivePO, setReceivePO] = useState(null);

  // Form States - Supplier
  const [supplierForm, setSupplierForm] = useState({
    name: '', phone: '', email: '', GSTIN: '', address: '', category: 'Grocery', notes: ''
  });

  // Form States - Purchase Order
  const [poForm, setPOForm] = useState({
    supplierId: '',
    expectedDeliveryDate: '',
    items: [],
    notes: ''
  });
  const [poItemInput, setPoItemInput] = useState({
    productId: '',
    quantityOrdered: 10,
    buyingPrice: 10,
    sellingPrice: 15
  });

  // Form States - Receive Stock
  const [receiveItems, setReceiveItems] = useState([]);

  // Load Initial Data
  useEffect(() => {
    fetchSuppliers();
    fetchPurchaseOrders();
    fetchAnalytics();
    fetchGlobalProducts();
    if (activeTab === 'pools') {
      fetchPools();
    }
  }, [activeTab]);

  const fetchPools = async () => {
    try {
      const res = await fetch('/api/procurement/pools', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setPools(data);
      }
    } catch (err) {
      console.error('Error fetching buying pools:', err);
    }
  };

  const handleJoinPool = async (poolId, quantity) => {
    try {
      const res = await fetch(`/api/procurement/pools/${poolId}/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ quantity })
      });
      const data = await res.json();
      if (res.ok) {
        alert(data.message || 'Joined co-op buying pool!');
        setJoiningPoolId(null);
        setJoinQty(10);
        fetchPools();
        fetchPurchaseOrders();
      } else {
        alert(data.message || 'Failed to join buying pool.');
      }
    } catch (err) {
      alert('Error joining buying pool.');
    }
  };

  const fetchGlobalProducts = async () => {
    try {
      const res = await fetch('/api/products');
      if (res.ok) {
        const data = await res.json();
        setGlobalProducts(data.products || []);
      }
    } catch (err) {
      console.error('Error fetching global products:', err);
    }
  };

  const fetchSuppliers = async () => {
    setLoadingSuppliers(true);
    try {
      const url = `/api/suppliers?search=${searchSupplier}&category=${categoryFilter}`;
      const res = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSuppliers(data.suppliers || []);
      }
    } catch (err) {
      console.error('Error fetching suppliers:', err);
    } finally {
      setLoadingSuppliers(false);
    }
  };

  const fetchPurchaseOrders = async () => {
    setLoadingOrders(true);
    try {
      const url = `/api/purchase-orders?search=${searchOrder}&status=${statusFilter}`;
      const res = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setPurchaseOrders(data.purchaseOrders || []);
      }
    } catch (err) {
      console.error('Error fetching purchase orders:', err);
    } finally {
      setLoadingOrders(false);
    }
  };

  const fetchAnalytics = async () => {
    setLoadingAnalytics(true);
    try {
      const res = await fetch('/api/procurement/analytics', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setAnalytics(data);
      }
    } catch (err) {
      console.error('Error fetching procurement analytics:', err);
    } finally {
      setLoadingAnalytics(false);
    }
  };

  // Supplier CRUD Handlers
  const handleSaveSupplier = async (e) => {
    e.preventDefault();
    try {
      const method = editingSupplier ? 'PUT' : 'POST';
      const url = editingSupplier ? `/api/suppliers/${editingSupplier._id}` : '/api/suppliers';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(supplierForm)
      });

      if (res.ok) {
        setSupplierModalOpen(false);
        setEditingSupplier(null);
        setSupplierForm({ name: '', phone: '', email: '', GSTIN: '', address: '', category: 'Grocery', notes: '' });
        fetchSuppliers();
        fetchAnalytics();
      }
    } catch (err) {
      console.error('Error saving supplier:', err);
    }
  };

  const handleEditSupplierClick = (supplier) => {
    setEditingSupplier(supplier);
    setSupplierForm({
      name: supplier.name,
      phone: supplier.phone,
      email: supplier.email,
      GSTIN: supplier.GSTIN || '',
      address: supplier.address || '',
      category: supplier.category || 'Grocery',
      notes: supplier.notes || ''
    });
    setSupplierModalOpen(true);
  };

  // Purchase Order Handlers
  const handleAddPOItem = () => {
    if (!poItemInput.productId) return;
    const selectedProd = globalProducts.find(p => p._id === poItemInput.productId);
    if (!selectedProd) return;

    // Check if item already exists in PO
    const exists = poForm.items.find(i => i.productId === selectedProd._id);
    if (exists) return;

    setPOForm({
      ...poForm,
      items: [
        ...poForm.items,
        {
          productId: selectedProd._id,
          name: selectedProd.name,
          quantityOrdered: Number(poItemInput.quantityOrdered),
          buyingPrice: Number(poItemInput.buyingPrice),
          sellingPrice: Number(poItemInput.sellingPrice)
        }
      ]
    });
  };

  const handleRemovePOItem = (productId) => {
    setPOForm({
      ...poForm,
      items: poForm.items.filter(item => item.productId !== productId)
    });
  };

  const handleCreatePO = async (e) => {
    e.preventDefault();
    if (!poForm.supplierId) return;
    if (poForm.items.length === 0) return;

    try {
      const res = await fetch('/api/purchase-orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...poForm,
          status: 'ordered'
        })
      });

      if (res.ok) {
        setPOModalOpen(false);
        setPOForm({ supplierId: '', expectedDeliveryDate: '', items: [], notes: '' });
        fetchPurchaseOrders();
        fetchAnalytics();
      }
    } catch (err) {
      console.error('Error creating purchase order:', err);
    }
  };

  // Receive Stock Handler
  const handleOpenReceive = (po) => {
    setReceivePO(po);
    const initialReceiveItems = po.items.map(item => ({
      productId: item.productId,
      name: item.name,
      quantityOrdered: item.quantityOrdered,
      quantityReceived: item.quantityReceived,
      currentReceived: item.quantityOrdered - item.quantityReceived, // default fill remaining
      batchNumber: item.batchNumber || `B-${po.orderNumber}-${Math.floor(100 + Math.random() * 900)}`,
      expiryDate: item.expiryDate ? item.expiryDate.split('T')[0] : new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // default 6 months from now
    }));
    setReceiveItems(initialReceiveItems);
  };

  const handleUpdateReceiveQty = (productId, qty) => {
    setReceiveItems(
      receiveItems.map(item =>
        item.productId === productId
          ? { ...item, currentReceived: Number(qty) }
          : item
      )
    );
  };

  const handleUpdateReceiveBatch = (productId, batch) => {
    setReceiveItems(
      receiveItems.map(item =>
        item.productId === productId ? { ...item, batchNumber: batch } : item
      )
    );
  };

  const handleUpdateReceiveExpiry = (productId, expDate) => {
    setReceiveItems(
      receiveItems.map(item =>
        item.productId === productId ? { ...item, expiryDate: expDate } : item
      )
    );
  };

  const handleSaveReceipt = async () => {
    try {
      const itemsToSubmit = receiveItems.map(ri => ({
        productId: ri.productId,
        quantityReceived: Number(ri.currentReceived),
        batchNumber: ri.batchNumber,
        expiryDate: ri.expiryDate
      }));

      const res = await fetch(`/api/purchase-orders/${receivePO._id}/receive`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ items: itemsToSubmit })
      });

      if (res.ok) {
        setReceivePO(null);
        fetchPurchaseOrders();
        fetchAnalytics();
      } else {
        const errData = await res.json();
        alert(errData.message || 'Failed to receive stock');
      }
    } catch (err) {
      console.error('Error submitting stock receipt:', err);
    }
  };

  const handleCancelPO = async (poId) => {
    if (!confirm('Are you sure you want to cancel this purchase order? This is irreversible.')) return;
    try {
      const res = await fetch(`/api/purchase-orders/${poId}/cancel`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setSelectedPO(null);
        fetchPurchaseOrders();
        fetchAnalytics();
      }
    } catch (err) {
      console.error('Error cancelling PO:', err);
    }
  };

  // Get status color coding
  const getStatusBadge = (status) => {
    switch (status) {
      case 'draft':
        return <span className="badge" style={{ backgroundColor: 'var(--color-text-muted)', color: '#FFF' }}>Draft</span>;
      case 'ordered':
        return <span className="badge" style={{ backgroundColor: 'var(--color-cta)', color: '#FFF' }}>Ordered</span>;
      case 'partially_received':
        return <span className="badge" style={{ backgroundColor: 'var(--color-warning)', color: '#FFF' }}>Partially Received</span>;
      case 'completed':
        return <span className="badge" style={{ backgroundColor: 'var(--color-success)', color: '#FFF' }}>Completed</span>;
      case 'cancelled':
        return <span className="badge" style={{ backgroundColor: 'var(--color-error)', color: '#FFF' }}>Cancelled</span>;
      default:
        return <span className="badge">{status}</span>;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', paddingBottom: '40px' }}>

      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Truck className="color-primary" size={28} /> Procurement & Supplier Hub
          </h2>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
            Manage supplier relationships, order stock, track deliveries, and ingest real-time inventory updates.
          </p>
        </div>

        {activeTab === 'suppliers' && (
          <button
            className="btn btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            onClick={() => { setEditingSupplier(null); setSupplierForm({ name: '', phone: '', email: '', GSTIN: '', address: '', category: 'Grocery', notes: '' }); setSupplierModalOpen(true); }}
          >
            <Plus size={16} /> Add Supplier
          </button>
        )}

        {activeTab === 'orders' && (
          <button
            className="btn btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            onClick={() => setPOModalOpen(true)}
          >
            <Plus size={16} /> Create Purchase Order
          </button>
        )}
      </div>

      {/* Tab Navigation */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--color-border)', paddingBottom: '1px' }}>
        {[
          { id: 'overview', label: 'Overview', icon: <Layers size={16} /> },
          { id: 'suppliers', label: 'Suppliers', icon: <Users size={16} /> },
          { id: 'orders', label: 'Purchase Orders', icon: <FileText size={16} /> },
          { id: 'reports', label: 'Performance & Reports', icon: <BarChart3 size={16} /> },
          { id: 'pools', label: 'Co-op Buying Pools', icon: <Activity size={16} /> }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '10px 16px',
              borderBottom: activeTab === tab.id ? '2px solid var(--color-primary)' : '2px solid transparent',
              color: activeTab === tab.id ? 'var(--color-primary)' : 'var(--color-text-muted)',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all var(--transition-fast)'
            }}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* TAB CONTENT: 1. OVERVIEW */}
      {activeTab === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

          {/* Dashboard Summary Widgets */}
          {loadingAnalytics ? (
            <div style={{ textAlign: 'center', padding: '24px', color: 'var(--color-text-muted)' }}>Loading summary KPIs...</div>
          ) : (
            <div className="grid-responsive" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>

              <div className="card card-hover" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ backgroundColor: 'var(--color-primary-light)', padding: '12px', borderRadius: '12px' }}>
                  <FileText className="color-primary" size={24} />
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>PENDING ORDERS</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800 }}>{analytics?.summary?.pendingPOsCount || 0}</div>
                </div>
              </div>

              <div className="card card-hover" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ backgroundColor: '#DBEAFE', padding: '12px', borderRadius: '12px' }}>
                  <Calendar style={{ color: 'var(--color-cta)' }} size={24} />
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>EXPECTED TODAY/WEEK</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800 }}>{analytics?.expectedDeliveries?.length || 0}</div>
                </div>
              </div>

              <div className="card card-hover" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ backgroundColor: '#FEF3C7', padding: '12px', borderRadius: '12px' }}>
                  <Package style={{ color: 'var(--color-warning)' }} size={24} />
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>TODAY'S INTAKE</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800 }}>{analytics?.summary?.todayReceipts || 0} units</div>
                </div>
              </div>

              <div className="card card-hover" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ backgroundColor: '#F1F5F9', padding: '12px', borderRadius: '12px' }}>
                  <Users style={{ color: '#475569' }} size={24} />
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>ACTIVE SUPPLIERS</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800 }}>{analytics?.summary?.supplierCount || 0}</div>
                </div>
              </div>

              <div className="card card-hover" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ backgroundColor: 'var(--color-primary-light)', padding: '12px', borderRadius: '12px' }}>
                  <DollarSign className="color-primary" size={24} />
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>MONTHLY SPEND</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800 }}>₹{analytics?.summary?.monthlyProcurementSpend?.toLocaleString() || 0}</div>
                </div>
              </div>

            </div>
          )}

          {/* Expected Deliveries & Low-Stock Alerts */}
          <div className="grid-responsive" style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '20px' }}>

            {/* Expected Deliveries Widget */}
            <div className="card" style={{ padding: '24px' }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '16px' }}>Expected Procurement Shipments</h3>
              {loadingAnalytics ? (
                <div>Loading expected deliveries...</div>
              ) : analytics?.expectedDeliveries?.length === 0 ? (
                <div style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', padding: '16px 0' }}>No pending shipments are currently scheduled.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {analytics?.expectedDeliveries?.map(del => (
                    <div
                      key={del._id}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '12px',
                        backgroundColor: '#F8FAFC',
                        borderRadius: '10px',
                        border: '1px solid var(--color-border)'
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{del.orderNumber} - {del.supplierName}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Calendar size={12} /> Expected: {new Date(del.expectedDeliveryDate).toLocaleDateString()}
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>₹{del.total}</span>
                        {getStatusBadge(del.status)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Actions Card */}
            <div className="card" style={{ padding: '24px', backgroundColor: 'var(--color-primary-light)', border: '1px dashed var(--color-primary)' }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--color-primary-dark)', marginBottom: '8px' }}>Procurement Shortcuts</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--color-text-main)', marginBottom: '16px' }}>
                Quickly restock inventory and balance supplier relationships to avoid stock-outs.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <button
                  className="btn"
                  style={{ width: '100%', backgroundColor: '#FFF', border: '1px solid var(--color-border)', justifyContent: 'space-between', display: 'flex', padding: '12px' }}
                  onClick={() => setPOModalOpen(true)}
                >
                  <span style={{ fontWeight: 600 }}>Create New Purchase Order</span>
                  <Plus size={16} />
                </button>
                <button
                  className="btn"
                  style={{ width: '100%', backgroundColor: '#FFF', border: '1px solid var(--color-border)', justifyContent: 'space-between', display: 'flex', padding: '12px' }}
                  onClick={() => { setActiveTab('suppliers'); setEditingSupplier(null); setSupplierModalOpen(true); }}
                >
                  <span style={{ fontWeight: 600 }}>Onboard New Supplier Partner</span>
                  <Plus size={16} />
                </button>
                <button
                  className="btn"
                  style={{ width: '100%', backgroundColor: '#FFF', border: '1px solid var(--color-border)', justifyContent: 'space-between', display: 'flex', padding: '12px' }}
                  onClick={() => setActiveTab('reports')}
                >
                  <span style={{ fontWeight: 600 }}>View Performance & GST Reports</span>
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* TAB CONTENT: 2. SUPPLIERS */}
      {activeTab === 'suppliers' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* Search and filter controls */}
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: '250px', position: 'relative' }}>
              <Search style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--color-text-muted)' }} size={18} />
              <input
                type="text"
                className="form-control"
                placeholder="Search suppliers by name, phone or email..."
                value={searchSupplier}
                onChange={(e) => setSearchSupplier(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchSuppliers()}
                style={{ paddingLeft: '40px', width: '100%' }}
              />
            </div>

            <div style={{ width: '200px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Filter size={18} style={{ color: 'var(--color-text-muted)' }} />
              <select
                className="form-control"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                style={{ width: '100%' }}
              >
                <option value="">All Categories</option>
                <option value="Dairy">Dairy</option>
                <option value="Bakery">Bakery</option>
                <option value="Grocery">Grocery</option>
                <option value="Snacks">Snacks</option>
                <option value="Household">Household</option>
              </select>
            </div>

            <button className="btn btn-primary" onClick={fetchSuppliers}>Apply</button>
          </div>

          {/* Suppliers Table */}
          <div className="card" style={{ overflow: 'hidden' }}>
            {loadingSuppliers ? (
              <div style={{ padding: '40px', textAlign: 'center' }}>Loading suppliers list...</div>
            ) : suppliers.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                No suppliers registered. Click 'Add Supplier' to get started.
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid var(--color-border)' }}>
                    <th style={{ padding: '16px' }}>Name</th>
                    <th style={{ padding: '16px' }}>Category</th>
                    <th style={{ padding: '16px' }}>GSTIN</th>
                    <th style={{ padding: '16px' }}>Phone</th>
                    <th style={{ padding: '16px' }}>Email</th>
                    <th style={{ padding: '16px' }}>Status</th>
                    <th style={{ padding: '16px' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {suppliers.map(sup => (
                    <tr key={sup._id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                      <td style={{ padding: '16px', fontWeight: 700 }}>{sup.name}</td>
                      <td style={{ padding: '16px' }}>
                        <span className="badge" style={{ backgroundColor: 'var(--color-primary-light)', color: 'var(--color-primary-dark)' }}>{sup.category}</span>
                      </td>
                      <td style={{ padding: '16px', fontFamily: 'monospace' }}>{sup.GSTIN || 'N/A'}</td>
                      <td style={{ padding: '16px' }}>{sup.phone}</td>
                      <td style={{ padding: '16px' }}>{sup.email}</td>
                      <td style={{ padding: '16px' }}>
                        <span className={`badge ${sup.active ? 'badge-success' : 'badge-danger'}`} style={{ color: '#FFF', backgroundColor: sup.active ? 'var(--color-success)' : 'var(--color-error)' }}>
                          {sup.active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td style={{ padding: '16px', display: 'flex', gap: '8px' }}>
                        <button className="btn" style={{ padding: '6px 12px', border: '1px solid var(--color-border)' }} onClick={() => handleEditSupplierClick(sup)}>
                          <Edit2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

        </div>
      )}

      {/* TAB CONTENT: 3. PURCHASE ORDERS */}
      {activeTab === 'orders' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* Search/filter controls */}
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: '250px', position: 'relative' }}>
              <Search style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--color-text-muted)' }} size={18} />
              <input
                type="text"
                className="form-control"
                placeholder="Search POs by order number..."
                value={searchOrder}
                onChange={(e) => setSearchOrder(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchPurchaseOrders()}
                style={{ paddingLeft: '40px', width: '100%' }}
              />
            </div>

            <div style={{ width: '200px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Filter size={18} style={{ color: 'var(--color-text-muted)' }} />
              <select
                className="form-control"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{ width: '100%' }}
              >
                <option value="">All Statuses</option>
                <option value="draft">Draft</option>
                <option value="ordered">Ordered</option>
                <option value="partially_received">Partially Received</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            <button className="btn btn-primary" onClick={fetchPurchaseOrders}>Apply</button>
          </div>

          {/* PO Table */}
          <div className="card" style={{ overflow: 'hidden' }}>
            {loadingOrders ? (
              <div style={{ padding: '40px', textAlign: 'center' }}>Loading purchase orders...</div>
            ) : purchaseOrders.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                No purchase orders recorded. Click 'Create Purchase Order' to order inventory stock.
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid var(--color-border)' }}>
                    <th style={{ padding: '16px' }}>PO Number</th>
                    <th style={{ padding: '16px' }}>Supplier</th>
                    <th style={{ padding: '16px' }}>Expected Date</th>
                    <th style={{ padding: '16px' }}>Total Amount</th>
                    <th style={{ padding: '16px' }}>Status</th>
                    <th style={{ padding: '16px' }}>Payment</th>
                    <th style={{ padding: '16px' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {purchaseOrders.map(po => (
                    <tr key={po._id || po.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                      <td style={{ padding: '16px', fontWeight: 700 }}>{po.orderNumber}</td>
                      <td style={{ padding: '16px' }}>{po.supplierName}</td>
                      <td style={{ padding: '16px' }}>{po.expectedDeliveryDate ? new Date(po.expectedDeliveryDate).toLocaleDateString() : 'N/A'}</td>
                      <td style={{ padding: '16px', fontWeight: 600 }}>₹{po.total}</td>
                      <td style={{ padding: '16px' }}>{getStatusBadge(po.status)}</td>
                      <td style={{ padding: '16px', textTransform: 'capitalize' }}>{po.paymentStatus}</td>
                      <td style={{ padding: '16px', display: 'flex', gap: '8px' }}>
                        <button
                          className="btn"
                          style={{ padding: '6px 12px', border: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: '4px' }}
                          onClick={() => setSelectedPO(po)}
                        >
                          <Eye size={14} /> View
                        </button>

                        {(po.status === 'ordered' || po.status === 'partially_received') && (
                          <button
                            className="btn btn-primary"
                            style={{ padding: '6px 12px' }}
                            onClick={() => handleOpenReceive(po)}
                          >
                            Receive Stock
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

        </div>
      )}

      {/* TAB CONTENT: 4. REPORTS */}
      {activeTab === 'reports' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

          <div className="grid-responsive" style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '20px' }}>

            {/* SVG Month Procurement Spend */}
            <div className="card" style={{ padding: '24px' }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <BarChart3 size={18} className="color-primary" /> Monthly Procurement Purchases (Last 6 Months)
              </h3>

              {loadingAnalytics ? (
                <div>Loading spend trend...</div>
              ) : (
                <div style={{ width: '100%', overflowX: 'auto' }}>
                  <svg viewBox="0 0 600 240" style={{ width: '100%', minWidth: '400px', height: 'auto' }}>
                    <line x1="40" y1="40" x2="580" y2="40" stroke="var(--color-border)" strokeDasharray="4" />
                    <line x1="40" y1="120" x2="580" y2="120" stroke="var(--color-border)" strokeDasharray="4" />
                    <line x1="40" y1="200" x2="580" y2="200" stroke="var(--color-text-muted)" />

                    {/* Y-axis labels */}
                    <text x="10" y="44" fontSize="10" fill="var(--color-text-muted)">₹50k</text>
                    <text x="10" y="124" fontSize="10" fill="var(--color-text-muted)">₹25k</text>
                    <text x="10" y="204" fontSize="10" fill="var(--color-text-muted)">₹0</text>

                    {analytics?.monthlyPurchases?.map((monthData, idx) => {
                      const xStart = 60 + idx * 85;
                      const barWidth = 40;
                      const height = Math.min((monthData.spend / 50000) * 160, 160);

                      return (
                        <g key={idx}>
                          <rect
                            x={xStart}
                            y={200 - height}
                            width={barWidth}
                            height={height}
                            fill="var(--color-primary)"
                            rx="4"
                          />
                          <text x={xStart + 6} y="220" fontSize="11" fontWeight="600" fill="var(--color-text-muted)">{monthData.month}</text>
                          <text x={xStart + 4} y={190 - height} fontSize="10" fontWeight="700" fill="var(--color-text-main)">₹{monthData.spend}</text>
                        </g>
                      );
                    })}
                  </svg>
                </div>
              )}
            </div>

            {/* Supplier Performance fulfillment report */}
            <div className="card" style={{ padding: '24px' }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '16px' }}>Supplier Performance Index</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '16px' }}>
                Metrics measuring order accuracy, completion rate, and speed based on closed POs.
              </p>

              {loadingAnalytics ? (
                <div>Loading performance indices...</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {analytics?.supplierPerformance?.map(perf => (
                    <div key={perf.supplierId} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 700 }}>
                        <span>{perf.name} ({perf.category})</span>
                        <span className="color-primary">{perf.fulfillmentRate}% Fulfillment</span>
                      </div>

                      <div style={{ width: '100%', height: '8px', backgroundColor: '#E2E8F0', borderRadius: '4px', overflow: 'hidden' }}>
                        <div
                          style={{
                            width: `${perf.fulfillmentRate}%`,
                            height: '100%',
                            backgroundColor: perf.fulfillmentRate >= 80 ? 'var(--color-success)' : (perf.fulfillmentRate >= 50 ? 'var(--color-warning)' : 'var(--color-error)')
                          }}
                        />
                      </div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>
                        Orders placed: {perf.totalOrders} | Completed: {perf.completedOrders}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

          {/* Detailed Purchase History */}
          <div className="card" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '16px' }}>Procurement Audit Trail</h3>
            {loadingAnalytics ? (
              <div>Loading audit trail...</div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--color-border)', backgroundColor: '#F8FAFC' }}>
                    <th style={{ padding: '12px' }}>Date</th>
                    <th style={{ padding: '12px' }}>PO Number</th>
                    <th style={{ padding: '12px' }}>Supplier</th>
                    <th style={{ padding: '12px' }}>Amount</th>
                    <th style={{ padding: '12px' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {analytics?.purchaseHistory?.slice(0, 10).map(hist => (
                    <tr key={hist._id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                      <td style={{ padding: '12px' }}>{new Date(hist.createdAt).toLocaleDateString()}</td>
                      <td style={{ padding: '12px', fontWeight: 700 }}>{hist.orderNumber}</td>
                      <td style={{ padding: '12px' }}>{hist.supplierName}</td>
                      <td style={{ padding: '12px', fontWeight: 600 }}>₹{hist.total}</td>
                      <td style={{ padding: '12px' }}>{getStatusBadge(hist.status)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

        </div>
      )}

      {activeTab === 'pools' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          <div className="card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>Cooperative Bulk Procurement Pools</h3>
                <p className="text-sm text-muted" style={{ margin: '4px 0 0 0' }}>
                  Pool your stock demands with other Gurgaon Sector 4 merchants to purchase wholesale goods at a bulk discount.
                </p>
              </div>
              <button 
                className="btn btn-primary"
                onClick={() => {
                  const name = prompt("Enter pool product name (e.g. Co-op Wheat Flour 500kg):");
                  if (!name) return;
                  const targetQty = prompt("Enter target bulk quantity (kg):", "200");
                  if (!targetQty) return;
                  const price = prompt("Enter co-op price per kg:", "40");
                  if (!price) return;
                  fetch('/api/procurement/pools', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ name, targetQty: Number(targetQty), price: Number(price), currentQty: 0 })
                  }).then(res => {
                    if (res.ok) {
                      fetchPools();
                    }
                  });
                }}
                style={{ fontSize: '0.85rem' }}
              >
                Create New Pool
              </button>
            </div>

            {pools.length === 0 ? (
              <p className="text-sm text-muted" style={{ textAlign: 'center', padding: '30px 0' }}>Loading collective buying pools...</p>
            ) : (
              <div className="grid-2" style={{ gap: '20px' }}>
                {pools.map(pool => {
                  const percent = Math.min(100, Math.round(((pool.currentQty || 0) / pool.targetQty) * 100));
                  return (
                    <div key={pool._id} className="card" style={{ border: '1px solid var(--color-border)', borderRadius: '14px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px', backgroundColor: 'var(--color-bg)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <strong style={{ fontSize: '1rem', color: 'var(--color-text-main)' }}>{pool.name}</strong>
                          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                            Bulk Price: <span style={{ color: 'var(--color-accent-dark)', fontWeight: 700 }}>₹{pool.price}/kg</span>
                          </div>
                        </div>
                        <span className="badge" style={{
                          backgroundColor: pool.status === 'ordered' ? 'var(--color-accent-light)' : 'rgba(99,102,241,0.1)',
                          color: pool.status === 'ordered' ? 'var(--color-accent-dark)' : 'var(--color-primary)',
                          fontSize: '0.65rem',
                          fontWeight: 700
                        }}>
                          {pool.status === 'ordered' ? '✓ Ordered Wholesale' : '⚡ Gathering Demands'}
                        </span>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 600 }}>
                          <span className="text-muted">Target: {pool.targetQty}kg</span>
                          <span>{pool.currentQty || 0}kg collected ({percent}%)</span>
                        </div>
                        <div style={{ width: '100%', height: '8px', backgroundColor: '#E2E8F0', borderRadius: '4px', overflow: 'hidden' }}>
                          <div style={{ width: `${percent}%`, height: '100%', backgroundColor: pool.status === 'ordered' ? 'var(--color-accent)' : 'var(--color-primary)' }} />
                        </div>
                      </div>

                      {/* Participants List */}
                      <div style={{ borderTop: '1px dashed var(--color-border)', paddingTop: '12px' }}>
                        <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', display: 'block', marginBottom: '6px', fontWeight: 700 }}>PARTICIPATING MERCHANTS:</span>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                          {pool.participants?.map((p, idx) => (
                            <span key={idx} style={{ fontSize: '0.7rem', backgroundColor: '#FFFFFF', border: '1px solid var(--color-border)', padding: '4px 8px', borderRadius: '16px', color: 'var(--color-text-main)' }}>
                              {p.storeName} ({p.qty}kg)
                            </span>
                          )) || <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>No participants yet.</span>}
                        </div>
                      </div>

                      {pool.status !== 'ordered' && (
                        joiningPoolId === pool._id ? (
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', backgroundColor: '#FFFFFF', padding: '8px', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
                            <input
                              type="number"
                              className="form-control"
                              style={{ flex: 1, padding: '6px', fontSize: '0.8rem' }}
                              value={joinQty}
                              onChange={(e) => setJoinQty(e.target.value)}
                              placeholder="Qty (kg)"
                            />
                            <button 
                              className="btn btn-primary"
                              onClick={() => handleJoinPool(pool._id, joinQty)}
                              style={{ fontSize: '0.75rem', padding: '6px 12px' }}
                            >
                              Submit
                            </button>
                            <button 
                              className="btn"
                              onClick={() => setJoiningPoolId(null)}
                              style={{ fontSize: '0.75rem', padding: '6px', border: '1px solid var(--color-border)' }}
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            className="btn btn-primary"
                            onClick={() => { setJoiningPoolId(pool._id); setJoinQty(10); }}
                            style={{ fontSize: '0.8rem', padding: '10px' }}
                          >
                            Join Pool & Declare Demand
                          </button>
                        )
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      )}

      {/* MODAL 1: ADD/EDIT SUPPLIER */}
      {supplierModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="card" style={{ width: '500px', maxWidth: '90%', padding: '24px', position: 'relative' }}>
            <button
              style={{ position: 'absolute', right: '16px', top: '16px', color: 'var(--color-text-muted)' }}
              onClick={() => setSupplierModalOpen(false)}
            >
              <X size={20} />
            </button>

            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '20px' }}>
              {editingSupplier ? 'Edit Supplier' : 'Onboard New Supplier'}
            </h3>

            <form onSubmit={handleSaveSupplier} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '4px' }}>Supplier Name *</label>
                <input
                  type="text"
                  className="form-control"
                  required
                  value={supplierForm.name}
                  onChange={(e) => setSupplierForm({ ...supplierForm, name: e.target.value })}
                  style={{ width: '100%' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '4px' }}>Phone Number *</label>
                  <input
                    type="text"
                    className="form-control"
                    required
                    value={supplierForm.phone}
                    onChange={(e) => setSupplierForm({ ...supplierForm, phone: e.target.value })}
                    style={{ width: '100%' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '4px' }}>Category *</label>
                  <select
                    className="form-control"
                    value={supplierForm.category}
                    onChange={(e) => setSupplierForm({ ...supplierForm, category: e.target.value })}
                    style={{ width: '100%' }}
                  >
                    <option value="Dairy">Dairy</option>
                    <option value="Bakery">Bakery</option>
                    <option value="Grocery">Grocery</option>
                    <option value="Snacks">Snacks</option>
                    <option value="Household">Household</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '4px' }}>Email Address</label>
                <input
                  type="email"
                  className="form-control"
                  value={supplierForm.email}
                  onChange={(e) => setSupplierForm({ ...supplierForm, email: e.target.value })}
                  style={{ width: '100%' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '4px' }}>GSTIN Number</label>
                <input
                  type="text"
                  className="form-control"
                  value={supplierForm.GSTIN}
                  onChange={(e) => setSupplierForm({ ...supplierForm, GSTIN: e.target.value.toUpperCase() })}
                  style={{ width: '100%' }}
                  placeholder="e.g. 07AAAAA1111A1Z1"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '4px' }}>Warehouse/Office Address</label>
                <input
                  type="text"
                  className="form-control"
                  value={supplierForm.address}
                  onChange={(e) => setSupplierForm({ ...supplierForm, address: e.target.value })}
                  style={{ width: '100%' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '4px' }}>Internal Notes</label>
                <textarea
                  className="form-control"
                  value={supplierForm.notes}
                  onChange={(e) => setSupplierForm({ ...supplierForm, notes: e.target.value })}
                  style={{ width: '100%', height: '60px' }}
                />
              </div>

              {editingSupplier && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input
                    type="checkbox"
                    id="supplier-active"
                    checked={supplierForm.active !== false}
                    onChange={(e) => setSupplierForm({ ...supplierForm, active: e.target.checked })}
                  />
                  <label htmlFor="supplier-active" style={{ fontSize: '0.85rem', fontWeight: 600 }}>Supplier Active (Available for orders)</label>
                </div>
              )}

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '10px' }}>
                <button type="button" className="btn" style={{ border: '1px solid var(--color-border)' }} onClick={() => setSupplierModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Supplier</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: CREATE PURCHASE ORDER */}
      {poModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="card" style={{ width: '700px', maxWidth: '95%', padding: '24px', position: 'relative', maxHeight: '90vh', overflowY: 'auto' }}>
            <button
              style={{ position: 'absolute', right: '16px', top: '16px', color: 'var(--color-text-muted)' }}
              onClick={() => setPOModalOpen(false)}
            >
              <X size={20} />
            </button>

            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '20px' }}>Create Purchase Order</h3>

            <form onSubmit={handleCreatePO} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '4px' }}>Select Supplier *</label>
                  <select
                    className="form-control"
                    required
                    value={poForm.supplierId}
                    onChange={(e) => setPOForm({ ...poForm, supplierId: e.target.value })}
                    style={{ width: '100%' }}
                  >
                    <option value="">-- Choose Supplier --</option>
                    {suppliers.filter(s => s.active).map(s => (
                      <option key={s._id || s.id} value={s._id || s.id}>{s.name} ({s.category})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '4px' }}>Expected Delivery Date *</label>
                  <input
                    type="date"
                    className="form-control"
                    required
                    value={poForm.expectedDeliveryDate}
                    onChange={(e) => setPOForm({ ...poForm, expectedDeliveryDate: e.target.value })}
                    style={{ width: '100%' }}
                  />
                </div>
              </div>

              {/* Add Order Line Item Subform */}
              <div style={{ backgroundColor: '#F8FAFC', padding: '16px', borderRadius: '12px', border: '1px solid var(--color-border)' }}>
                <h4 style={{ fontSize: '0.85rem', fontWeight: 800, marginBottom: '12px', color: 'var(--color-primary-dark)' }}>Add Products / Line Items</h4>

                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr auto', gap: '10px', alignItems: 'flex-end' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '4px' }}>Product</label>
                    <select
                      className="form-control"
                      value={poItemInput.productId}
                      onChange={(e) => setPoItemInput({ ...poItemInput, productId: e.target.value })}
                      style={{ width: '100%' }}
                    >
                      <option value="">-- Select Product --</option>
                      {globalProducts.map(p => (
                        <option key={p._id} value={p._id}>{p.name} (₹{p.price})</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '4px' }}>Qty</label>
                    <input
                      type="number"
                      className="form-control"
                      value={poItemInput.quantityOrdered}
                      onChange={(e) => setPoItemInput({ ...poItemInput, quantityOrdered: e.target.value })}
                      style={{ width: '100%' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '4px' }}>Buy Price</label>
                    <input
                      type="number"
                      className="form-control"
                      value={poItemInput.buyingPrice}
                      onChange={(e) => setPoItemInput({ ...poItemInput, buyingPrice: e.target.value })}
                      style={{ width: '100%' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '4px' }}>Sell Price</label>
                    <input
                      type="number"
                      className="form-control"
                      value={poItemInput.sellingPrice}
                      onChange={(e) => setPoItemInput({ ...poItemInput, sellingPrice: e.target.value })}
                      style={{ width: '100%' }}
                    />
                  </div>
                  <button
                    type="button"
                    className="btn btn-primary"
                    style={{ height: '42px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    onClick={handleAddPOItem}
                  >
                    Add
                  </button>
                </div>
              </div>

              {/* Order Items Table list */}
              <div>
                <h4 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '8px' }}>Items Summary</h4>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--color-border)', backgroundColor: '#F8FAFC' }}>
                      <th style={{ padding: '8px' }}>Product</th>
                      <th style={{ padding: '8px' }}>Ordered Qty</th>
                      <th style={{ padding: '8px' }}>Buying Price</th>
                      <th style={{ padding: '8px' }}>Total Cost</th>
                      <th style={{ padding: '8px' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {poForm.items.map(item => (
                      <tr key={item.productId} style={{ borderBottom: '1px solid var(--color-border)' }}>
                        <td style={{ padding: '8px', fontWeight: 600 }}>{item.name}</td>
                        <td style={{ padding: '8px' }}>{item.quantityOrdered}</td>
                        <td style={{ padding: '8px' }}>₹{item.buyingPrice}</td>
                        <td style={{ padding: '8px', fontWeight: 600 }}>₹{item.quantityOrdered * item.buyingPrice}</td>
                        <td style={{ padding: '8px' }}>
                          <button
                            type="button"
                            style={{ color: 'var(--color-error)' }}
                            onClick={() => handleRemovePOItem(item.productId)}
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '4px' }}>Procurement Notes</label>
                <textarea
                  className="form-control"
                  value={poForm.notes}
                  onChange={(e) => setPOForm({ ...poForm, notes: e.target.value })}
                  style={{ width: '100%', height: '50px' }}
                />
              </div>

              {/* Totals Summary */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px', borderTop: '1px solid var(--color-border)', paddingTop: '12px' }}>
                <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                  Subtotal: ₹{poForm.items.reduce((sum, item) => sum + (item.quantityOrdered * item.buyingPrice), 0)}
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                  GST (18%): ₹{Math.round(poForm.items.reduce((sum, item) => sum + (item.quantityOrdered * item.buyingPrice), 0) * 0.18)}
                </div>
                <div style={{ fontSize: '1.1rem', fontWeight: 800 }}>
                  Total: ₹{Math.round(poForm.items.reduce((sum, item) => sum + (item.quantityOrdered * item.buyingPrice), 0) * 1.18)}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '10px' }}>
                <button type="button" className="btn" style={{ border: '1px solid var(--color-border)' }} onClick={() => setPOModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Place Purchase Order</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: VIEW PURCHASE ORDER DETAILS */}
      {selectedPO && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="card" style={{ width: '650px', maxWidth: '95%', padding: '24px', position: 'relative' }}>
            <button
              style={{ position: 'absolute', right: '16px', top: '16px', color: 'var(--color-text-muted)' }}
              onClick={() => setSelectedPO(null)}
            >
              <X size={20} />
            </button>

            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '16px' }}>Purchase Order Details</h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', fontSize: '0.85rem', marginBottom: '20px' }}>
              <div>
                <p><span style={{ color: 'var(--color-text-muted)' }}>Order Number:</span> <strong>{selectedPO.orderNumber}</strong></p>
                <p><span style={{ color: 'var(--color-text-muted)' }}>Supplier:</span> <strong>{selectedPO.supplierName}</strong></p>
                <p><span style={{ color: 'var(--color-text-muted)' }}>GSTIN:</span> <span style={{ fontFamily: 'monospace' }}>{selectedPO.supplierGSTIN || 'N/A'}</span></p>
              </div>
              <div>
                <p><span style={{ color: 'var(--color-text-muted)' }}>Order Date:</span> {new Date(selectedPO.createdAt).toLocaleString()}</p>
                <p><span style={{ color: 'var(--color-text-muted)' }}>Expected Delivery:</span> {selectedPO.expectedDeliveryDate ? new Date(selectedPO.expectedDeliveryDate).toLocaleDateString() : 'N/A'}</p>
                <p><span style={{ color: 'var(--color-text-muted)' }}>Status:</span> {getStatusBadge(selectedPO.status)}</p>
              </div>
            </div>

            {/* STATUS TIMELINE BAR */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', backgroundColor: '#F8FAFC', borderRadius: '12px', marginBottom: '20px', border: '1px solid var(--color-border)' }}>
              {[
                { label: 'Ordered', step: 'ordered', num: 1 },
                { label: 'Received (Part)', step: 'partially_received', num: 2 },
                { label: 'Completed', step: 'completed', num: 3 }
              ].map((stepObj) => {
                const getStepClass = () => {
                  if (selectedPO.status === 'cancelled') return 'var(--color-error)';
                  if (selectedPO.status === 'completed') return 'var(--color-success)';
                  if (selectedPO.status === 'partially_received' && stepObj.num <= 2) return 'var(--color-warning)';
                  if (selectedPO.status === 'ordered' && stepObj.num === 1) return 'var(--color-cta)';
                  if (selectedPO.status === 'ordered' && stepObj.num > 1) return '#CBD5E1';
                  if (selectedPO.status === 'partially_received' && stepObj.num === 3) return '#CBD5E1';
                  return '#CBD5E1';
                };

                return (
                  <div key={stepObj.step} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                    <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: getStepClass(), color: '#FFF', display: 'flex', alignItems: 'center', justifyContext: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '0.85rem' }}>
                      {stepObj.num}
                    </div>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-muted)' }}>{stepObj.label}</span>
                  </div>
                );
              })}
            </div>

            {/* Items table */}
            <div style={{ maxHeight: '200px', overflowY: 'auto', marginBottom: '16px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--color-border)', backgroundColor: '#F8FAFC' }}>
                    <th style={{ padding: '8px' }}>Product</th>
                    <th style={{ padding: '8px' }}>Ordered</th>
                    <th style={{ padding: '8px' }}>Received</th>
                    <th style={{ padding: '8px' }}>Buy Price</th>
                    <th style={{ padding: '8px' }}>Batch</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedPO.items.map(item => (
                    <tr key={item.productId} style={{ borderBottom: '1px solid var(--color-border)' }}>
                      <td style={{ padding: '8px', fontWeight: 600 }}>{item.name}</td>
                      <td style={{ padding: '8px' }}>{item.quantityOrdered}</td>
                      <td style={{ padding: '8px', color: item.quantityReceived === item.quantityOrdered ? 'var(--color-success)' : 'var(--color-text-main)' }}>
                        {item.quantityReceived}
                      </td>
                      <td style={{ padding: '8px' }}>₹{item.buyingPrice}</td>
                      <td style={{ padding: '8px', fontSize: '0.75rem', fontFamily: 'monospace' }}>{item.batchNumber || 'N/A'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--color-border)', paddingTop: '12px' }}>
              <div style={{ fontSize: '1rem', fontWeight: 800 }}>Total Value: ₹{selectedPO.total}</div>

              <div style={{ display: 'flex', gap: '8px' }}>
                {(selectedPO.status === 'ordered' || selectedPO.status === 'partially_received') && (
                  <>
                    <button className="btn btn-danger" onClick={() => handleCancelPO(selectedPO._id)}>Cancel PO</button>
                    <button className="btn btn-primary" onClick={() => { handleOpenReceive(selectedPO); setSelectedPO(null); }}>Receive Stock</button>
                  </>
                )}
                <button className="btn" style={{ border: '1px solid var(--color-border)' }} onClick={() => setSelectedPO(null)}>Close</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: RECEIVE STOCK SCREEN */}
      {receivePO && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="card" style={{ width: '800px', maxWidth: '95%', padding: '24px', position: 'relative', maxHeight: '90vh', overflowY: 'auto' }}>
            <button
              style={{ position: 'absolute', right: '16px', top: '16px', color: 'var(--color-text-muted)' }}
              onClick={() => setReceivePO(null)}
            >
              <X size={20} />
            </button>

            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '8px' }}>Receive Inbound Stock</h3>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem', marginBottom: '20px' }}>
              Recording stock intake for order <strong>{receivePO.orderNumber}</strong>. Input actual received quantities to sync values into your active store inventory.
            </p>

            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem', marginBottom: '20px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-border)', backgroundColor: '#F8FAFC' }}>
                  <th style={{ padding: '10px' }}>Product</th>
                  <th style={{ padding: '10px' }}>Ordered</th>
                  <th style={{ padding: '10px' }}>Received So Far</th>
                  <th style={{ padding: '10px', width: '100px' }}>Receive Now *</th>
                  <th style={{ padding: '10px' }}>Batch Number</th>
                  <th style={{ padding: '10px' }}>Expiry Date</th>
                </tr>
              </thead>
              <tbody>
                {receiveItems.map(item => {
                  const maxRemaining = item.quantityOrdered - item.quantityReceived;
                  return (
                    <tr key={item.productId} style={{ borderBottom: '1px solid var(--color-border)' }}>
                      <td style={{ padding: '10px', fontWeight: 600 }}>{item.name}</td>
                      <td style={{ padding: '10px' }}>{item.quantityOrdered}</td>
                      <td style={{ padding: '10px' }}>{item.quantityReceived}</td>
                      <td style={{ padding: '10px' }}>
                        <input
                          type="number"
                          className="form-control"
                          min="0"
                          max={maxRemaining}
                          value={item.currentReceived}
                          onChange={(e) => handleUpdateReceiveQty(item.productId, e.target.value)}
                          style={{ width: '80px', padding: '6px' }}
                          disabled={maxRemaining <= 0}
                        />
                        {maxRemaining <= 0 && <span style={{ color: 'var(--color-success)', fontSize: '0.75rem', fontWeight: 700 }}>Fully Rec.</span>}
                      </td>
                      <td style={{ padding: '10px' }}>
                        <input
                          type="text"
                          className="form-control"
                          value={item.batchNumber}
                          onChange={(e) => handleUpdateReceiveBatch(item.productId, e.target.value)}
                          style={{ width: '120px', padding: '6px', fontSize: '0.75rem' }}
                          placeholder="Batch No"
                          disabled={maxRemaining <= 0}
                        />
                      </td>
                      <td style={{ padding: '10px' }}>
                        <input
                          type="date"
                          className="form-control"
                          value={item.expiryDate}
                          onChange={(e) => handleUpdateReceiveExpiry(item.productId, e.target.value)}
                          style={{ width: '130px', padding: '6px', fontSize: '0.75rem' }}
                          disabled={maxRemaining <= 0}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button className="btn" style={{ border: '1px solid var(--color-border)' }} onClick={() => setReceivePO(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSaveReceipt}>Commit Receipt & Ingest Stock</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
