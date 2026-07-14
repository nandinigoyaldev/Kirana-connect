import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { User, Lock, Mail, ChevronRight, CornerDownRight } from 'lucide-react';

export default function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login } = useAuth();
  
  const roleParam = searchParams.get('role') || 'customer';
  const [role, setRole] = useState(roleParam);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('password'); // default seeded password
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Sync role selector with URL search param
  useEffect(() => {
    setRole(roleParam);
    fillDemoCredentials(roleParam);
  }, [roleParam]);

  const fillDemoCredentials = (selectedRole) => {
    if (selectedRole === 'customer') {
      setEmail('customer@example.com');
    } else if (selectedRole === 'shopkeeper') {
      setEmail('shopkeeper@example.com');
    } else if (selectedRole === 'delivery') {
      setEmail('delivery@example.com');
    } else if (selectedRole === 'admin') {
      setEmail('admin@example.com');
    }
    setPassword('password');
  };

  const handleRoleTabClick = (selectedRole) => {
    setRole(selectedRole);
    fillDemoCredentials(selectedRole);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(email, password, role);
      
      // Redirect based on role
      if (user.role === 'customer') navigate('/customer');
      else if (user.role === 'shopkeeper') navigate('/shopkeeper');
      else if (user.role === 'delivery') navigate('/delivery');
      else if (user.role === 'admin') navigate('/admin');
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '440px', margin: '60px auto', padding: '0 20px' }}>
      <div className="card" style={{ padding: '36px' }}>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '8px', textAlign: 'center', color: 'var(--color-text-main)' }}>
          Sign In to <span style={{ color: 'var(--color-primary)' }}>Kirana Connect</span>
        </h2>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginBottom: '24px', textAlign: 'center' }}>
          Select your portal below to access features.
        </p>

        {/* Role Tabs */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '4px', backgroundColor: 'var(--color-bg)', padding: '4px', borderRadius: '10px', marginBottom: '24px' }}>
          {['customer', 'shopkeeper', 'delivery', 'admin'].map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => handleRoleTabClick(r)}
              style={{
                padding: '8px 2px',
                fontSize: '0.75rem',
                fontWeight: 600,
                textTransform: 'capitalize',
                borderRadius: '8px',
                backgroundColor: role === r ? 'white' : 'transparent',
                color: role === r ? 'var(--color-primary)' : 'var(--color-text-muted)',
                boxShadow: role === r ? 'var(--shadow-sm)' : 'none',
                transition: 'all var(--transition-fast)'
              }}
            >
              {r === 'delivery' ? 'Driver' : r}
            </button>
          ))}
        </div>

        {error && (
          <div style={{ backgroundColor: '#fee2e2', color: 'var(--color-error)', padding: '12px 16px', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '20px', fontWeight: 500 }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <div style={{ position: 'relative' }}>
              <Mail size={18} style={{ position: 'absolute', left: '14px', top: '15px', color: 'var(--color-text-muted)' }} />
              <input
                type="email"
                required
                className="form-control"
                style={{ paddingLeft: '42px' }}
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <label className="form-label" style={{ marginBottom: 0 }}>Password</label>
              <a href="#" style={{ fontSize: '0.8rem', color: 'var(--color-primary)', fontWeight: 500 }}>Forgot?</a>
            </div>
            <div style={{ position: 'relative' }}>
              <Lock size={18} style={{ position: 'absolute', left: '14px', top: '15px', color: 'var(--color-text-muted)' }} />
              <input
                type="password"
                required
                className="form-control"
                style={{ paddingLeft: '42px' }}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: '100%', padding: '12px', fontSize: '1rem' }}>
            {loading ? 'Entering Portal...' : 'Sign In'} <ChevronRight size={18} />
          </button>
        </form>

        <div style={{ marginTop: '24px', borderTop: '1px solid var(--color-border)', paddingTop: '20px', textAlign: 'center' }}>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
            Testing the app? Click any role tab above to autofill seeded credentials.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', backgroundColor: 'var(--color-bg)', padding: '10px', borderRadius: '8px', marginTop: '12px', fontSize: '0.8rem', color: 'var(--color-text-muted)', gap: '4px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><CornerDownRight size={12} /> Password is: <strong style={{ color: 'var(--color-text-main)' }}>password</strong></div>
          </div>
        </div>
      </div>
    </div>
  );
}
