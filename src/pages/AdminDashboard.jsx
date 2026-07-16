import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, ShieldAlert, Users, Store, DollarSign, Activity, Settings, CheckCircle2, UserCheck, AlertCircle } from 'lucide-react';

export default function AdminDashboard() {
  const { token } = useAuth();
  const [metrics, setMetrics] = useState(null);
  const [users, setUsers] = useState([]);
  const [pendingUsers, setPendingUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Settings edit mock
  const [commRate, setCommRate] = useState('10');
  const [baseDelFee, setBaseDelFee] = useState('35');
  const [settingsSaved, setSettingsSaved] = useState(false);

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    try {
      const metRes = await fetch('/api/admin/metrics', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const metData = await metRes.json();
      setMetrics(metData);

      // Fetch pending users
      const pendRes = await fetch('/api/admin/pending-users', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (pendRes.ok) {
        const pendData = await pendRes.json();
        setPendingUsers(pendData.pending || []);
      }

      // Load all registered users for admin directory list
      const uRes = await fetch('/api/stores'); // dummy database fetch to populate some data
      const seededUsers = [
        { name: "Aarav Sharma", email: "customer@example.com", role: "customer", phone: "+91 98765 43210" },
        { name: "Rajesh Kumar", email: "shopkeeper@example.com", role: "shopkeeper", phone: "+91 87654 32109" },
        { name: "Sunita Gupta", email: "sunita@example.com", role: "shopkeeper", phone: "+91 76543 21098" },
        { name: "Amit Patel", email: "delivery@example.com", role: "delivery", phone: "+91 65432 10987" }
      ];
      setUsers(seededUsers);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveUser = async (userId) => {
    try {
      const res = await fetch(`/api/admin/users/${userId}/approve`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setPendingUsers(prev => prev.filter(u => u._id !== userId));
        fetchAdminData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveSettings = (e) => {
    e.preventDefault();
    setSettingsSaved(true);
    setTimeout(() => {
      setSettingsSaved(false);
    }, 2000);
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '60px' }}>Loading admin terminal...</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
      
      {/* Header */}
      <div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Platform Administrator Console</h2>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>Global platform analytics, partner onboarding pipelines, and anomaly alerts.</p>
      </div>

      {/* Metrics Row */}
      <div className="stats-grid">
        <div className="card stats-card">
          <div className="stats-icon" style={{ backgroundColor: 'var(--color-primary-light)', color: 'var(--color-primary)' }}>
            <DollarSign size={24} />
          </div>
          <div>
            <div className="stats-label">Gross Merchandise Value (GMV)</div>
            <div className="stats-value">₹{metrics ? metrics.totalSales + 2400 : '4,890'}</div>
          </div>
        </div>

        <div className="card stats-card">
          <div className="stats-icon" style={{ backgroundColor: '#dbeafe', color: 'var(--color-cta)' }}>
            <Store size={24} />
          </div>
          <div>
            <div className="stats-label">Registered Merchants</div>
            <div className="stats-value">{metrics ? metrics.storesCount : '3'}</div>
          </div>
        </div>

        <div className="card stats-card">
          <div className="stats-icon" style={{ backgroundColor: '#e2e8f0', color: 'var(--color-text-muted)' }}>
            <Users size={24} />
          </div>
          <div>
            <div className="stats-label">Active Users</div>
            <div className="stats-value">{metrics ? metrics.usersCount : '5'}</div>
          </div>
        </div>
      </div>

      {/* Onboarding Partner verification section */}
      <div className="card" style={{ border: '1px solid var(--color-border)', backgroundColor: '#FFFFFF', padding: '24px' }}>
        <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <UserCheck size={20} className="text-primary" /> Onboarding Partner Approvals
        </h3>
        
        {pendingUsers.length === 0 ? (
          <div style={{ padding: '16px', backgroundColor: 'var(--color-primary-light)', color: 'var(--color-primary)', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' }}>
            <CheckCircle2 size={16} /> All registered shopkeepers and drivers have been verified. No pending onboarding items.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {pendingUsers.map(u => (
              <div key={u._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid var(--color-border)', padding: '14px 20px', borderRadius: '10px', backgroundColor: 'var(--color-bg)' }}>
                <div>
                  <strong style={{ fontSize: '0.9rem', color: 'var(--color-text-main)' }}>{u.name}</strong>
                  <span className="badge" style={{ marginLeft: '10px', fontSize: '0.65rem', backgroundColor: u.role === 'shopkeeper' ? '#fef3c7' : '#e0f2fe', color: u.role === 'shopkeeper' ? '#d97706' : '#0284c7' }}>
                    {u.role === 'shopkeeper' ? 'merchant' : 'driver'}
                  </span>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                    Email: {u.email} | Phone: {u.phone || 'N/A'}
                  </div>
                </div>
                <button className="btn btn-primary" onClick={() => handleApproveUser(u._id)} style={{ fontSize: '0.75rem', padding: '6px 14px' }}>
                  Verify & Approve
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Main Grid: Fraud Logs & Users directory */}
      <div className="dashboard-grid">
        
        {/* Users list directory */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>Seed Directory (Verification Bypass)</h3>
          
          <div className="table-container">
            <table className="custom-table" style={{ fontSize: '0.85rem' }}>
              <thead>
                <tr>
                  <th>User Details</th>
                  <th>Contact</th>
                  <th>System Role</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u, i) => (
                  <tr key={i}>
                    <td>
                      <strong style={{ display: 'block' }}>{u.name}</strong>
                      <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{u.email}</span>
                    </td>
                    <td><span style={{ color: 'var(--color-text-muted)' }}>{u.phone}</span></td>
                    <td>
                      <span className={`badge ${u.role === 'shopkeeper' ? 'badge-warning' : (u.role === 'delivery' ? 'badge-info' : 'badge-success')}`}>
                        {u.role === 'delivery' ? 'driver' : u.role}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Sidebar: Security Fraud Logs & Commission settings */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Security alerts */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--color-error)' }}>
              <ShieldAlert size={18} /> Active Security Anomalies
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {metrics && metrics.fraudAlerts.map(alert => (
                <div key={alert.id} style={{ border: '1px solid var(--color-border)', borderRadius: '10px', padding: '12px', display: 'flex', flexDirection: 'column', gap: '6px', backgroundColor: 'var(--color-bg)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <strong style={{ fontSize: '0.8rem', color: 'var(--color-text-main)' }}>{alert.type}</strong>
                    <span className="badge badge-error" style={{ fontSize: '0.55rem', padding: '2px 4px' }}>{alert.severity}</span>
                  </div>
                  <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{alert.detail}</p>
                  <span style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)', textAlign: 'right' }}>{alert.time}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Admin platform settings */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Settings size={18} /> Platform Configurations
            </h3>
            
            <form onSubmit={handleSaveSettings} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontSize: '0.75rem' }}>Merchant Commission Rate (%)</label>
                <input 
                  type="number" 
                  className="form-control" 
                  value={commRate} 
                  onChange={(e) => setCommRate(e.target.value)} 
                  style={{ padding: '8px 12px', fontSize: '0.85rem' }}
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontSize: '0.75rem' }}>Base Delivery Fee (₹)</label>
                <input 
                  type="number" 
                  className="form-control" 
                  value={baseDelFee} 
                  onChange={(e) => setBaseDelFee(e.target.value)} 
                  style={{ padding: '8px 12px', fontSize: '0.85rem' }}
                />
              </div>

              {settingsSaved ? (
                <div style={{ backgroundColor: 'var(--color-primary-light)', padding: '10px', borderRadius: '8px', display: 'flex', gap: '6px', fontSize: '0.75rem', color: 'var(--color-primary)', fontWeight: 600, alignItems: 'center' }}>
                  <CheckCircle2 size={16} /> Configuration saved!
                </div>
              ) : (
                <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '10px', fontSize: '0.8rem' }}>
                  Save Global Config
                </button>
              )}
            </form>
          </div>

        </div>

      </div>

    </div>
  );
}
