import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider, useCart } from './context/CartContext';

// Pages
import Landing from './pages/Landing';
import Login from './pages/Login';
import CustomerHome from './pages/CustomerHome';
import StoreDiscovery from './pages/StoreDiscovery';
import Cart from './pages/Cart';
import BasketOptimizer from './pages/BasketOptimizer';
import OrderTracking from './pages/OrderTracking';
import ShopkeeperDashboard from './pages/ShopkeeperDashboard';
import InventoryManager from './pages/InventoryManager';
import OCRUpload from './pages/OCRUpload';
import VoiceInventory from './pages/VoiceInventory';
import ShopkeeperAnalytics from './pages/ShopkeeperAnalytics';
import DeliveryDashboard from './pages/DeliveryDashboard';
import AdminDashboard from './pages/AdminDashboard';

// Icons
import { 
  ShoppingBag, Store, ShoppingCart, Compass, CheckSquare, 
  User, Sparkles, Mic, FileText, BarChart3, ShieldCheck, 
  Truck, LogOut, Menu, X, Users, AlertTriangle 
} from 'lucide-react';

function NavigationShell({ children }) {
  const { user, logout, switchRole } = useAuth();
  const { cartItems } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [rolePanelOpen, setRolePanelOpen] = useState(false);

  // If on landing or login page, don't wrap in navbar/sidebar shell
  const isAuthPage = location.pathname === '/' || location.pathname === '/login';
  if (isAuthPage) {
    return (
      <>
        {children}
        {/* Floating Demo Helper for switching roles even on auth pages */}
        <RoleSwitcher widgetOpen={rolePanelOpen} setWidgetOpen={setRolePanelOpen} />
      </>
    );
  }

  // Handle logout
  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // Navigations based on role
  const getNavLinks = () => {
    switch (user?.role) {
      case 'customer':
        return [
          { path: '/customer', label: 'Shopping Feed', icon: <ShoppingBag size={20} /> },
          { path: '/customer/map', label: 'Store Discovery', icon: <Store size={20} /> },
          { path: '/customer/cart', label: 'Cart Basket', icon: <ShoppingCart size={20} />, badge: cartItems.length },
          { path: '/customer/optimize', label: 'AI Optimizer', icon: <Sparkles size={20} /> },
          { path: '/customer/orders', label: 'Track Orders', icon: <Compass size={20} /> },
        ];
      case 'shopkeeper':
        return [
          { path: '/shopkeeper', label: 'Dashboard Hub', icon: <CheckSquare size={20} /> },
          { path: '/shopkeeper/inventory', label: 'Stock Manager', icon: <Store size={20} /> },
          { path: '/shopkeeper/voice', label: 'Voice Updates', icon: <Mic size={20} /> },
          { path: '/shopkeeper/ocr', label: 'OCR Scanner', icon: <FileText size={20} /> },
          { path: '/shopkeeper/analytics', label: 'AI Analytics', icon: <BarChart3 size={20} /> },
        ];
      case 'delivery':
        return [
          { path: '/delivery', label: 'Driver Dashboard', icon: <Truck size={20} /> },
        ];
      case 'admin':
        return [
          { path: '/admin', label: 'Admin Console', icon: <ShieldCheck size={20} /> },
        ];
      default:
        return [];
    }
  };

  const navLinks = getNavLinks();

  return (
    <div className="app-container">
      {/* Sidebar for Desktop */}
      <aside className={`desktop-sidebar ${mobileMenuOpen ? 'open' : ''}`}>
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">🏪</div>
          <span>Kirana Connect</span>
        </div>

        <nav className="sidebar-nav">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={`nav-link ${location.pathname === link.path ? 'active' : ''}`}
              onClick={() => setMobileMenuOpen(false)}
            >
              {link.icon}
              <span style={{ flex: 1 }}>{link.label}</span>
              {link.badge !== undefined && link.badge > 0 && (
                <span className="navbar-badge" style={{ position: 'relative', top: 0, right: 0 }}>
                  {link.badge}
                </span>
              )}
            </Link>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="user-avatar">{user?.name ? user.name[0] : 'U'}</div>
          <div className="user-info">
            <div className="user-name">{user?.name}</div>
            <span className="user-role-badge">{user?.role}</span>
          </div>
          <button onClick={handleLogout} style={{ color: 'var(--color-error)', display: 'flex', alignItems: 'center' }}>
            <LogOut size={18} />
          </button>
        </div>
      </aside>

      {/* Main Panel wrapper */}
      <div className="main-wrapper">
        {/* Top Navbar */}
        <header className="top-navbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button 
              className="navbar-btn" 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              style={{ display: window.innerWidth <= 1024 ? 'flex' : 'none' }}
            >
              {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700, textTransform: 'capitalize' }}>
              {location.pathname.split('/').filter(Boolean).join(' ➔ ') || 'Kirana Connect'}
            </h2>
          </div>

          <div className="navbar-actions">
            {user?.role === 'customer' && (
              <button className="navbar-btn" onClick={() => navigate('/customer/cart')}>
                <ShoppingCart size={22} />
                {cartItems.length > 0 && <span className="navbar-badge">{cartItems.length}</span>}
              </button>
            )}
            <div className="user-avatar" style={{ width: '36px', height: '36px' }}>
              {user?.name ? user.name[0] : 'U'}
            </div>
          </div>
        </header>

        {/* Content Body */}
        <main className="main-content">
          {children}
        </main>

        {/* Mobile Navigation bar */}
        <nav className="mobile-nav">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={`mobile-nav-link ${location.pathname === link.path ? 'active' : ''}`}
            >
              {link.icon}
              <span>{link.label.split(' ')[0]}</span>
            </Link>
          ))}
          <button className="mobile-nav-link" onClick={handleLogout}>
            <LogOut size={22} />
            <span>Logout</span>
          </button>
        </nav>
      </div>

      {/* Floating Demo Role Switcher Panel */}
      <RoleSwitcher widgetOpen={rolePanelOpen} setWidgetOpen={setRolePanelOpen} />
    </div>
  );
}

// Floating Role Switcher Widget for easy testing
function RoleSwitcher({ widgetOpen, setWidgetOpen }) {
  const { user, switchRole } = useAuth();
  const navigate = useNavigate();

  const handleSwitch = async (role) => {
    await switchRole(role);
    setWidgetOpen(false);
    // Redirect based on selected role
    if (role === 'customer') navigate('/customer');
    else if (role === 'shopkeeper') navigate('/shopkeeper');
    else if (role === 'delivery') navigate('/delivery');
    else if (role === 'admin') navigate('/admin');
  };

  return (
    <div className="role-switcher-container">
      {widgetOpen && (
        <div className="role-switcher-panel">
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-muted)', marginBottom: '8px', borderBottom: '1px solid var(--color-border)', paddingBottom: '6px' }}>
            DEMO ROLE SELECTOR
          </div>
          {['customer', 'shopkeeper', 'delivery', 'admin'].map((role) => (
            <button
              key={role}
              onClick={() => handleSwitch(role)}
              className={`role-switcher-btn ${user?.role === role ? 'active' : ''}`}
            >
              <span style={{ textTransform: 'capitalize' }}>{role === 'delivery' ? 'Driver Partner' : role}</span>
              {user?.role === role && <span style={{ fontSize: '0.65rem' }}>Active</span>}
            </button>
          ))}
        </div>
      )}
      <button 
        className="role-switcher-toggle" 
        onClick={() => setWidgetOpen(!widgetOpen)}
      >
        🎭 Switch Roles Demo
      </button>
    </div>
  );
}

// Protected Route wrapper
function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '60px' }}>Authenticating user session...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <Router>
          <NavigationShell>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Landing />} />
              <Route path="/login" element={<Login />} />

              {/* Customer Routes */}
              <Route path="/customer" element={
                <ProtectedRoute allowedRoles={['customer']}><CustomerHome /></ProtectedRoute>
              } />
              <Route path="/customer/map" element={
                <ProtectedRoute allowedRoles={['customer']}><StoreDiscovery /></ProtectedRoute>
              } />
              <Route path="/customer/cart" element={
                <ProtectedRoute allowedRoles={['customer']}><Cart /></ProtectedRoute>
              } />
              <Route path="/customer/optimize" element={
                <ProtectedRoute allowedRoles={['customer']}><BasketOptimizer /></ProtectedRoute>
              } />
              <Route path="/customer/orders" element={
                <ProtectedRoute allowedRoles={['customer']}><OrderTracking /></ProtectedRoute>
              } />

              {/* Shopkeeper Routes */}
              <Route path="/shopkeeper" element={
                <ProtectedRoute allowedRoles={['shopkeeper']}><ShopkeeperDashboard /></ProtectedRoute>
              } />
              <Route path="/shopkeeper/inventory" element={
                <ProtectedRoute allowedRoles={['shopkeeper']}><InventoryManager /></ProtectedRoute>
              } />
              <Route path="/shopkeeper/ocr" element={
                <ProtectedRoute allowedRoles={['shopkeeper']}><OCRUpload /></ProtectedRoute>
              } />
              <Route path="/shopkeeper/voice" element={
                <ProtectedRoute allowedRoles={['shopkeeper']}><VoiceInventory /></ProtectedRoute>
              } />
              <Route path="/shopkeeper/analytics" element={
                <ProtectedRoute allowedRoles={['shopkeeper']}><ShopkeeperAnalytics /></ProtectedRoute>
              } />

              {/* Delivery Routes */}
              <Route path="/delivery" element={
                <ProtectedRoute allowedRoles={['delivery']}><DeliveryDashboard /></ProtectedRoute>
              } />

              {/* Admin Routes */}
              <Route path="/admin" element={
                <ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>
              } />

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </NavigationShell>
        </Router>
      </CartProvider>
    </AuthProvider>
  );
}
