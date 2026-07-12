import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

import axios from 'axios';

const API_URL = '/api';

// Role permissions define which menu sections each role can access
export const ROLE_PERMISSIONS = {
  superadmin: [
    'dashboard', 'booking', 'billing', 'events', 'payments',
    'company', 'plans', 'vehicle', 'driver', 'business',
  ],
  vendor: [
    'dashboard', 'booking', 'billing', 'events', 'payments', 'company', 'plans',
  ],
  staff: [
    'dashboard', 'billing', 'company', 'plans', 'vehicle', 'driver', 'business',
  ],
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);

  // On mount, check if user session exists in localStorage
  useEffect(() => {
    try {
      const savedUser = localStorage.getItem('purvi_user');
      if (savedUser) {
        const parsed = JSON.parse(savedUser);
        setUser(parsed);
        setIsLoggedIn(true);
      }
    } catch (e) {
      // Ignore bad data
    } finally {
      setAuthLoading(false);
    }
  }, []);

  const login = async (identifier, password) => {
    try {
      const res = await axios.post(`${API_URL}/auth/login`, { identifier, password });
      const safeUser = res.data;
      setUser(safeUser);
      setIsLoggedIn(true);
      localStorage.setItem('purvi_user', JSON.stringify(safeUser));
      return { success: true, user: safeUser };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.detail || 'Invalid email/phone or password.' 
      };
    }
  };

  const register = async (step1Data, step2Data) => {
    // Convert logo file to base64 for localStorage persistence (optional field)
    let logoBase64 = null;
    if (step2Data.logoFile) {
      try {
        logoBase64 = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target.result);
          reader.onerror = reject;
          reader.readAsDataURL(step2Data.logoFile);
        });
      } catch (e) {
        console.warn('Failed to read logo file:', e);
      }
    }

    const payload = {
      email: step1Data.email,
      password: step1Data.password, // Frontend should have collected password! Wait, RegisterPage has password?
      name: step1Data.name,
      phone: step1Data.phone,
      businessName: step2Data.businessName,
      businessType: step2Data.businessType,
      address: step2Data.address,
      pincode: step2Data.pincode,
      city: step2Data.city,
      referral: step2Data.referral,
      gstin: step2Data.gstin || '',
      logo: logoBase64 || null,
      role: 'superadmin'
    };

    try {
      const res = await axios.post(`${API_URL}/auth/register`, payload);
      const newUser = res.data;
      setUser(newUser);
      setIsLoggedIn(true);
      localStorage.setItem('purvi_user', JSON.stringify(newUser));
      return { success: true, user: newUser };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.detail || 'Failed to register account.' 
      };
    }
  };

  const logout = () => {
    setUser(null);
    setIsLoggedIn(false);
    localStorage.removeItem('purvi_user');
  };

  const updateUser = (patch) => {
    setUser(prev => {
      const updated = { ...prev, ...patch };
      try {
        localStorage.setItem('purvi_user', JSON.stringify(updated));
      } catch (e) {
        console.error('Failed to save to localStorage', e);
        alert('Failed to save changes. The logo image might be too large for storage. Please try a smaller image.');
      }
      return updated;
    });
  };

  const hasPermission = (sectionId) => {
    if (!user || !user.role) return false;
    const allowed = ROLE_PERMISSIONS[user.role] || [];
    return allowed.includes(sectionId);
  };

  return (
    <AuthContext.Provider value={{ user, isLoggedIn, authLoading, login, register, logout, updateUser, hasPermission }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
