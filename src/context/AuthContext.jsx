import React, { createContext, useState, useEffect, useContext } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token') || '');

  useEffect(() => {
    if (token) {
      localStorage.setItem('token', token);
      fetchUserProfile();
    } else {
      localStorage.removeItem('token');
      setUser(null);
      setLoading(false);
    }
  }, [token]);

  const fetchUserProfile = async () => {
    try {
      const res = await fetch('/api/auth/profile', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      } else {
        // Token might have expired
        logout();
      }
    } catch (err) {
      console.error("Error fetching user profile:", err);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password, role) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, role })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Login failed');
      setToken(data.token);
      setUser(data.user);
      return data.user;
    } catch (err) {
      console.error("Login error:", err);
      throw err;
    }
  };

  const register = async (userData) => {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Registration failed');
      setToken(data.token);
      setUser(data.user);
      return data.user;
    } catch (err) {
      console.error("Register error:", err);
      throw err;
    }
  };

  const logout = () => {
    setToken('');
    setUser(null);
    localStorage.removeItem('token');
  };

  // For testing, lets provide a quick switch role function
  const switchRole = async (targetRole) => {
    setLoading(true);
    try {
      const res = await fetch('/api/auth/demo-switch', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ role: targetRole })
      });
      const data = await res.json();
      if (res.ok) {
        setToken(data.token);
        setUser(data.user);
      }
    } catch (err) {
      console.error("Demo Switch Role Error:", err);
    } finally {
      setLoading(false);
    }
  };
  
  const loginWithOtp = async (phone, otp, role) => {
    try {
      const res = await fetch('/api/auth/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, otp, role })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'OTP verification failed');
      setToken(data.token);
      setUser(data.user);
      return data.user;
    } catch (err) {
      console.error("OTP verification error:", err);
      throw err;
    }
  };

  const loginWithVoice = async (phrase, role) => {
    try {
      const res = await fetch('/api/auth/voice-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phrase, role })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Voice verification failed');
      setToken(data.token);
      setUser(data.user);
      return data.user;
    } catch (err) {
      console.error("Voice matching login error:", err);
      throw err;
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, loginWithOtp, loginWithVoice, register, logout, switchRole, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
